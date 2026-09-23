import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { evaluateAuthorization, manifestHash, validateManifest, verifyManifestFiles } from './run-contract.mjs'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const stable = (value) => JSON.stringify(value, (_, item) =>
  item && !Array.isArray(item) && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item)
const digest = (value) => hash(stable(value))

export class RunBlock extends Error {
  constructor(code, message = code) {
    super(message)
    this.name = 'RunBlock'
    this.code = code
  }
}

export function classifyQueryError(error) {
  if (error instanceof RunBlock) return error.code
  if (error?.code === '55P03') return 'LOCK_TIMEOUT'
  if (error?.code === '57014') return /statement timeout/i.test(error.message) ? 'STATEMENT_TIMEOUT' : 'QUERY_CANCELLED'
  if (error?.code && /^(08|57P01)/.test(error.code)) return 'CONNECTION_DROP'
  return 'QUERY_FAILURE'
}

export function compareSnapshot(expected, actual) {
  for (const key of ['targetRows', 'protectedRows', 'canonicalRows', 'legacyRows', 'metadata']) {
    if (!(key in expected) || !(key in actual)) throw new RunBlock('SNAPSHOT_INCOMPLETE', `Missing ${key}`)
  }
  const expectedTargets = new Map(expected.targetRows.map((row) => [`${row.table}:${row.id}`, row]))
  const actualTargets = new Map(actual.targetRows.map((row) => [`${row.table}:${row.id}`, row]))
  if (expectedTargets.size !== expected.targetRows.length || actualTargets.size !== actual.targetRows.length) throw new RunBlock('TARGET_DUPLICATE')
  for (const key of actualTargets.keys()) if (!expectedTargets.has(key)) throw new RunBlock('TARGET_ADDED_OUTSIDE_BACKUP', key)
  for (const key of expectedTargets.keys()) if (!actualTargets.has(key)) throw new RunBlock('TARGET_MISSING', key)
  for (const [key, row] of expectedTargets) {
    const found = actualTargets.get(key)
    if (row.path !== found.path) throw new RunBlock('TARGET_PATH_CHANGED', key)
    if (digest(row) !== digest(found)) throw new RunBlock('TARGET_CONTENT_DRIFT', key)
  }
  if (digest(expected.protectedRows) !== digest(actual.protectedRows)) throw new RunBlock('NON_TARGET_RELATION_DRIFT')
  if (digest(expected.canonicalRows) !== digest(actual.canonicalRows)) throw new RunBlock('CANONICAL_CONTENT_DRIFT')
  if (digest(expected.legacyRows) !== digest(actual.legacyRows)) throw new RunBlock('LEGACY_CONTENT_DRIFT')
  for (const key of ['columns', 'constraints', 'indexes', 'sequences', 'rls', 'grants', 'policies']) {
    if (!Array.isArray(expected.metadata[key]) || !Array.isArray(actual.metadata[key])) throw new RunBlock('METADATA_INCOMPLETE', key)
    if (digest(expected.metadata[key]) !== digest(actual.metadata[key])) throw new RunBlock(['rls', 'grants', 'policies'].includes(key) ? 'SECURITY_DRIFT' : 'SCHEMA_DRIFT', key)
  }
  return digest(actual)
}

function checkLimits(limits) {
  for (const key of ['rowCap', 'responseByteCap', 'backupByteCap', 'queryBudget', 'roundTripBudget', 'deadlineMs', 'clientTimeoutMs', 'statementTimeoutMs', 'lockTimeoutMs']) {
    assert(Number.isSafeInteger(limits[key]) && limits[key] > 0, `BLOCK: invalid ${key}`)
  }
  assert(limits.rowCap <= 100 && limits.responseByteCap <= 1024 * 1024 && limits.backupByteCap <= 32 * 1024 * 1024, 'BLOCK: unsafe read caps')
  assert(limits.queryBudget <= limits.roundTripBudget, 'BLOCK: query budget exceeds round-trip budget')
  assert(limits.lockTimeoutMs < limits.statementTimeoutMs && limits.statementTimeoutMs < limits.clientTimeoutMs &&
    limits.clientTimeoutMs < limits.deadlineMs, 'BLOCK: timeout ordering')
}

// plan.snapshot uses readPages/query; plan.apply and plan.restore use query.
// The same plan and executor serve disposable rehearsal and an explicitly
// authorized later run. This module itself never selects a Production target.
export async function executeRun({ manifest, root, plan, clientFactory, sink, limits, mode = 'rehearsal', sessionId,
  approval = null, authoritySourceVerified = false }) {
  const started = Date.now()
  const deadline = started + limits.deadlineMs
  let stage = 'bootstrap'
  let queryLabel = null
  let batch = 0
  let queries = 0
  let roundTrips = 0
  let responseBytes = 0
  let commitState = 'NOT_STARTED'
  let restoreState = 'NOT_STARTED'
  let transactionOpen = false
  let commitSent = false
  let restoreOpen = false
  let restoreCommitSent = false
  let warning = false
  let client
  let readbackClient
  let terminal = false
  const checkpoint = async (status, extra = {}) => sink.checkpoint({
    at: new Date().toISOString(), sessionId, stage, queryLabel, batch,
    elapsedMs: Date.now() - started, deadlineAt: new Date(deadline).toISOString(),
    queries, roundTrips, responseBytes, commitState, restoreState, status, ...extra,
  })
  const receipt = async (status, code = null) => {
    const result = { runId: manifest?.runId ?? null, sessionId, mode, status, code, stage, queryLabel, batch,
      elapsedMs: Date.now() - started, deadlineAt: new Date(deadline).toISOString(),
      queries, roundTrips, responseBytes, estimatedQueries: plan?.estimatedQueries ?? null,
      queryBudget: limits?.queryBudget ?? null, roundTripBudget: limits?.roundTripBudget ?? null,
      rowCap: limits?.rowCap ?? null, responseByteCap: limits?.responseByteCap ?? null,
      commitState, restoreState, terminalExit: status === 'PASS' ? 0 : 1,
      automaticRetry: false }
    await sink.receipt(result)
    terminal = true
    return result
  }
  const guard = () => {
    if (sink.signal?.aborted) throw new RunBlock('SIGNAL')
    if (warning) throw new RunBlock('DATABASE_WARNING')
    if (Date.now() >= deadline) throw new RunBlock('RUN_DEADLINE')
  }
  const awaitBounded = async (operation) => {
    guard()
    const remaining = deadline - Date.now()
    const timeoutMs = Math.min(limits.clientTimeoutMs, remaining)
    const code = remaining <= limits.clientTimeoutMs ? 'RUN_DEADLINE' : 'CLIENT_RESPONSE_TIMEOUT'
    let timer
    let onAbort
    try {
      const aborted = new Promise((_, reject) => {
        onAbort = () => reject(new RunBlock('SIGNAL'))
        sink.signal?.addEventListener('abort', onAbort, { once: true })
      })
      return await Promise.race([operation(), aborted, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new RunBlock(code)), timeoutMs)
      })])
    } finally {
      clearTimeout(timer)
      if (onAbort) sink.signal?.removeEventListener('abort', onAbort)
    }
  }
  const queryOn = async (connection, label, text, values = [], nextBatch = 0) => {
    guard()
    queryLabel = label
    batch = nextBatch
    if (++queries > limits.queryBudget) throw new RunBlock('QUERY_BUDGET')
    if (++roundTrips > limits.roundTripBudget) throw new RunBlock('ROUND_TRIP_BUDGET')
    await checkpoint('STARTED')
    try {
      const result = await awaitBounded(() => connection.query(text, values))
      guard()
      const serialized = JSON.stringify({ rows: result.rows ?? [], rowCount: result.rowCount ?? null })
      const bytes = Buffer.byteLength(serialized)
      responseBytes += bytes
      if ((result.rows?.length ?? 0) > limits.rowCap) throw new RunBlock('ROW_CAP')
      if (bytes > limits.responseByteCap) throw new RunBlock('RESPONSE_BYTE_CAP')
      await checkpoint('PASS', { bytes, rows: result.rows?.length ?? 0 })
      return result.rows ?? []
    } catch (error) {
      await checkpoint('BLOCK', { code: classifyQueryError(error) }).catch(() => {})
      throw error
    }
  }
  const readPages = async (connection, label, statement, valuesForCursor, cursorOf) => {
    const rows = []
    let cursor = null
    let page = 0
    do {
      const next = await queryOn(connection, label, statement, valuesForCursor(cursor, limits.rowCap), ++page)
      if (!next.length) break
      const last = cursorOf(next.at(-1))
      if (last === null || last === undefined || (cursor !== null && !(last > cursor))) throw new RunBlock('CURSOR_NOT_ADVANCING')
      rows.push(...next)
      cursor = last
      if (next.length < limits.rowCap) break
    } while (true)
    return rows
  }
  const snapshot = async (connection, label) => plan.snapshot({
    query: (name, text, values) => queryOn(connection, `${label}:${name}`, text, values),
    readPages: (name, text, values, cursorOf) => readPages(connection, `${label}:${name}`, text, values, cursorOf),
  })

  try {
    checkLimits(limits)
    validateManifest(manifest)
    assert(['rehearsal', 'apply'].includes(mode), 'BLOCK: run mode')
    if (mode === 'rehearsal') assert.equal(manifest.environment, 'disposable', 'BLOCK: disposable environment only')
    else {
      assert.equal(manifest.environment, 'production', 'BLOCK: Production environment required')
      assert.notEqual(manifest.approval.action, 'production-read', 'BLOCK: read approval cannot mutate')
      assert(authoritySourceVerified && evaluateAuthorization(manifest, approval).recordMatches,
        'BLOCK: verified, matching Production authorization required')
    }
    assert(manifest.artifacts.backup, 'BLOCK: rehearsal backup required')
    if (manifest.artifacts.executor.path !== 'src/scripts/run-executor.mjs' && mode === 'apply') {
      throw new RunBlock('EXECUTOR_NOT_BOUND')
    }
    if (plan.artifactPath && !manifest.artifacts.sql.some((file) => file.path === plan.artifactPath)) {
      throw new RunBlock('SQL_PLAN_NOT_BOUND')
    }
    assert((await stat(path.join(root, manifest.artifacts.backup.path))).size <= limits.backupByteCap, 'BLOCK: backup byte cap')
    try { await verifyManifestFiles(manifest, root) }
    catch { throw new RunBlock('MANIFEST_VERIFICATION_FAILED') }
    const backupBytes = await readFile(path.join(root, manifest.artifacts.backup.path))
    const backup = JSON.parse(backupBytes)
    assert.equal(backup.version, 1, 'BLOCK: backup version')
    if (backup.snapshotSha256 !== digest(backup.snapshot)) throw new RunBlock('BACKUP_CONTENT_CHECKSUM')
    if (!(plan.estimatedQueries <= limits.queryBudget)) throw new RunBlock('QUERY_ESTIMATE_EXCEEDS_BUDGET')
    await checkpoint('PASS', { manifestSha256: manifestHash(manifest), backupBytes: backupBytes.length })
    stage = 'connect'
    client = clientFactory()
    client.on?.('notice', (notice) => { if (['WARNING', 'ERROR', 'FATAL'].includes(notice.severity)) warning = true })
    if (++roundTrips > limits.roundTripBudget) throw new RunBlock('ROUND_TRIP_BUDGET')
    await awaitBounded(() => client.connect())
    guard()
    await checkpoint('PASS')
    stage = 'transaction'
    await queryOn(client, 'begin', 'BEGIN ISOLATION LEVEL REPEATABLE READ')
    transactionOpen = true
    await queryOn(client, 'statement-timeout', `SET LOCAL statement_timeout = '${limits.statementTimeoutMs}ms'`)
    await queryOn(client, 'lock-timeout', `SET LOCAL lock_timeout = '${limits.lockTimeoutMs}ms'`)
    stage = 'preflight'
    const before = await snapshot(client, 'before')
    compareSnapshot(backup.snapshot, before)
    await checkpoint('PASS', { snapshotSha256: digest(before) })
    stage = 'apply'
    await plan.apply({ backup: backup.snapshot, query: (name, text, values, index) => queryOn(client, name, text, values, index), rowCap: limits.rowCap })
    guard()
    stage = 'commit'
    commitSent = true
    commitState = 'SENT_UNKNOWN'
    await queryOn(client, 'commit', 'COMMIT')
    transactionOpen = false
    commitState = 'COMMITTED'
    stage = 'readback'
    readbackClient = clientFactory()
    readbackClient.on?.('notice', (notice) => { if (['WARNING', 'ERROR', 'FATAL'].includes(notice.severity)) warning = true })
    if (++roundTrips > limits.roundTripBudget) throw new RunBlock('ROUND_TRIP_BUDGET')
    await awaitBounded(() => readbackClient.connect())
    const after = await snapshot(readbackClient, 'after')
    plan.assertAfter(backup.snapshot, after)
    await checkpoint('PASS', { snapshotSha256: digest(after) })
    if (mode === 'rehearsal') {
      stage = 'restore'
      await queryOn(readbackClient, 'restore-begin', 'BEGIN')
      restoreOpen = true
      await queryOn(readbackClient, 'restore-statement-timeout', `SET LOCAL statement_timeout = '${limits.statementTimeoutMs}ms'`)
      await queryOn(readbackClient, 'restore-lock-timeout', `SET LOCAL lock_timeout = '${limits.lockTimeoutMs}ms'`)
      await plan.restore({ backup: backup.snapshot, query: (name, text, values, index) => queryOn(readbackClient, name, text, values, index), rowCap: limits.rowCap })
      restoreCommitSent = true
      restoreState = 'SENT_UNKNOWN'
      await queryOn(readbackClient, 'restore-commit', 'COMMIT')
      restoreOpen = false
      restoreState = 'RESTORED'
      const restored = await snapshot(readbackClient, 'restored')
      compareSnapshot(backup.snapshot, restored)
      await checkpoint('PASS', { snapshotSha256: digest(restored) })
    }
    stage = 'complete'
    return await receipt('PASS')
  } catch (error) {
    const code = classifyQueryError(error)
    const connectionUncertain = ['CLIENT_RESPONSE_TIMEOUT', 'RUN_DEADLINE', 'CONNECTION_DROP', 'SIGNAL', 'DATABASE_WARNING'].includes(code)
    if (commitSent && commitState !== 'COMMITTED') commitState = 'UNKNOWN'
    else if (transactionOpen && client) {
      if (connectionUncertain) commitState = 'ROLLBACK_UNKNOWN'
      else {
        try {
          await queryOn(client, 'rollback', 'ROLLBACK')
          commitState = 'ROLLED_BACK'
        } catch { commitState = 'ROLLBACK_UNKNOWN' }
      }
    }
    if (restoreCommitSent && restoreState !== 'RESTORED') restoreState = 'UNKNOWN'
    else if (restoreOpen && readbackClient) {
      if (connectionUncertain) restoreState = 'ROLLBACK_UNKNOWN'
      else {
        try {
          await queryOn(readbackClient, 'restore-rollback', 'ROLLBACK')
          restoreState = 'ROLLED_BACK'
        } catch { restoreState = 'ROLLBACK_UNKNOWN' }
      }
    }
    const status = ['UNKNOWN', 'ROLLBACK_UNKNOWN'].includes(commitState) ||
      ['UNKNOWN', 'ROLLBACK_UNKNOWN'].includes(restoreState) ? 'UNKNOWN' : 'BLOCK'
    await checkpoint(status, { code }).catch(() => {})
    return await receipt(status, code)
  } finally {
    for (const connection of [readbackClient, client]) {
      if (connection) await Promise.race([connection.end().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 1000))])
    }
    if (!terminal) await receipt('BLOCK', 'MISSING_TERMINAL_RECEIPT').catch(() => {})
  }
}
