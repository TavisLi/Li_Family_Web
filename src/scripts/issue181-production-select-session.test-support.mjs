import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { admitIssue181 } from './issue181-source-admission.mjs'
import { issue181CatalogKind, issue181CatalogLimits, issue181SqlArtifactPath, assertIssue181CatalogPlan, readIssue181Catalog } from './issue181-production-catalog-read.mjs'
import { createIssue134PostgresIo } from './issue134-transaction-io.mjs'
import { fileEvidenceSink } from './run-executor-evidence.mjs'
import { manifestHash } from './run-contract.mjs'

// DB-free test fixture only. Never import from a production runner; transport and approval are synthetic.
async function executeIssue181Session({ manifest, approval, root, runDirectory, confirmApprovalSource, Client, now, clock = Date.now }) {
  const sink = fileEvidenceSink(runDirectory, manifest, undefined, { approval })
  await sink.start()
  const counters = { queries: 0, roundTrips: 0, requestBytes: 0, responseBytes: 0 }
  let io, client, stage = 'admission', status = 'BLOCK', code = 'ADMISSION_BLOCK', result, failure
  let transportTermination = 'NOT_NEEDED'
  const started = clock()
  let timeout, timedOut = false, warning = false, connectionError = false
  const guard = () => {
    assert(!timedOut && clock() - started < issue181CatalogLimits.deadlineMs, 'UNKNOWN: deadline')
    assert(!warning, 'BLOCK: server warning')
    assert(!connectionError, 'UNKNOWN: connection error')
    assert(counters.queries <= issue181CatalogLimits.queryBudget && counters.roundTrips <= issue181CatalogLimits.roundTripBudget &&
      counters.responseBytes <= issue181CatalogLimits.totalBytes, 'BLOCK: I/O budget')
  }
  try {
    await Promise.race([admitIssue181({ manifest, approval, root, confirmApprovalSource, now }),
      new Promise((_, reject) => { timeout = setTimeout(() => { timedOut = true; reject(new Error('UNKNOWN: timeout')) }, issue181CatalogLimits.deadlineMs) })])
    clearTimeout(timeout)
    guard()
    const limitsArtifact = manifest.artifacts.dependencies.filter((item) => item.path.endsWith('/limits.json'))
    assert.equal(limitsArtifact.length, 1, 'BLOCK: limits cardinality')
    const limits = JSON.parse(await readFile(path.join(root, limitsArtifact[0].path), 'utf8'))
    assert.deepEqual(limits, issue181CatalogLimits, 'BLOCK: limits mismatch')
    const sql = await readFile(path.join(root, issue181SqlArtifactPath))
    const migrationPath = 'src/migrations/20261031_052622_issue180_optional_geo.ts'
    const migrationSha256 = '252ceab99cedd36c1c2cd91acb839182df4687918dda17963c3ce03510fec966'
    assert(manifest.artifacts.dependencies.some((item) => item.path === migrationPath && item.sha256 === migrationSha256),
      'BLOCK: migration binding')
    assertIssue181CatalogPlan(manifest, { kind: issue181CatalogKind, limits, queries: JSON.parse(sql.toString('utf8')) },
      { main: '8eaa11653c3666b370ea9d2c5588b54f64ae838d', migrationPath, migrationSha256 })
    assert.equal(typeof Client, 'function', 'BLOCK: transport unavailable')
    guard()
    io = createIssue134PostgresIo({ Client, counters, limits, guard, getStage: () => stage,
      recoveryReserve: { queries: 0, roundTrips: 0 } })
    client = new Client({ statement_timeout: limits.statementTimeoutMs, lock_timeout: limits.lockTimeoutMs })
    assert.equal(Number(client.connectionParameters?.statement_timeout), limits.statementTimeoutMs, 'BLOCK: statement timeout startup binding')
    assert.equal(Number(client.connectionParameters?.lock_timeout), limits.lockTimeoutMs, 'BLOCK: lock timeout startup binding')
    const startup = client.getStartupConf?.()
    assert.equal(startup?.statement_timeout, String(limits.statementTimeoutMs), 'BLOCK: statement timeout startup bytes')
    assert.equal(startup?.lock_timeout, String(limits.lockTimeoutMs), 'BLOCK: lock timeout startup bytes')
    client.on?.('notice', () => { warning = true })
    client.on?.('error', () => { connectionError = true })
    stage = 'connect'
    await sink.checkpoint({ at: new Date().toISOString(), stage, status: 'STARTED', automaticRetry: false })
    const remaining = Math.max(1, limits.deadlineMs - (clock() - started))
    const work = (async () => {
      await client.connect()
      guard()
      stage = 'catalog'
      await sink.checkpoint({ at: new Date().toISOString(), stage, status: 'STARTED', automaticRetry: false })
      result = await readIssue181Catalog({ query: (text) => client.query({ text, query_timeout: limits.statementTimeoutMs }), guard }, manifest, sql)
      guard()
    })()
    await Promise.race([work, new Promise((_, reject) => { timeout = setTimeout(() => { timedOut = true; reject(new Error('UNKNOWN: timeout')) }, remaining) })])
    assert.equal(counters.queries, 7, 'BLOCK: query count')
    assert.equal(counters.roundTrips, 7, 'BLOCK: round trip count')
    status = 'PASS'; code = 'ISSUE181_SELECT_COMPLETE'
  } catch (error) {
    failure = { name: String(error?.name ?? 'Error'), code: typeof error?.code === 'string' ? error.code : null,
      message: String(error?.message ?? 'unknown').replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED]').slice(0, 1000) }
    status = timedOut || /^UNKNOWN:|^Query read timeout/i.test(String(error?.message)) ? 'UNKNOWN' : 'BLOCK'
    code = status === 'UNKNOWN' ? 'SESSION_UNKNOWN' : 'SESSION_BLOCK'
  } finally {
    clearTimeout(timeout)
    if (client) {
      if (status === 'UNKNOWN') {
        timedOut = true
        if (typeof client.connection?.stream?.destroy === 'function') {
          try { client.connection.stream.destroy(); transportTermination = 'DESTROY_REQUESTED_UNCONFIRMED' }
          catch { transportTermination = 'DESTROY_FAILED' }
        } else transportTermination = 'DESTROY_UNAVAILABLE'
      }
      else if (typeof client.end === 'function') await client.end().catch(() => { status = 'UNKNOWN'; code = 'DISCONNECT_UNKNOWN' })
    }
    io?.restore()
  }
  const receipt = { runId: manifest.runId, manifestSha256: manifestHash(manifest), sessionId: `${manifest.runId}:${process.pid}`,
    status, code, stage, terminalExit: status === 'PASS' ? 0 : 1,
    automaticRetry: false, failure: failure ?? null, transportTermination, queries: counters.queries, roundTrips: counters.roundTrips,
    requestBytes: counters.requestBytes, responseBytes: counters.responseBytes,
    commitState: 'NOT_STARTED', restoreState: 'NOT_STARTED' }
  await sink.receipt(receipt)
  return { receipt, result: status === 'PASS' ? result : undefined }
}
