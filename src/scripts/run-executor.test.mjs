import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { manifestHash } from './run-contract.mjs'
import { compareSnapshot, executeRun, RunBlock } from './run-executor.mjs'
import { backupFromSnapshot } from './run-executor-retirement-plan.mjs'

const sha = (value) => createHash('sha256').update(value).digest('hex')
const metadata = () => Object.fromEntries(['columns', 'constraints', 'indexes', 'sequences', 'rls', 'grants', 'policies']
  .map((key) => [key, [{ id: key, value: 'original' }]]))
const snapshot = () => ({
  targetRows: [{ table: 'travel_memories_rels', id: 1, parent_id: 1, path: 'itineraryImages' }],
  protectedRows: [{ table: 'travel_memories_rels', id: 2, path: 'galleryImages' }],
  canonicalRows: [{ id: 1, body: { title: 'original' } }],
  legacyRows: [{ id: 1, body: { day: 1 } }], metadata: metadata(),
})
const limits = () => ({ rowCap: 2, responseByteCap: 200, backupByteCap: 10000,
  queryBudget: 40, roundTripBudget: 50, deadlineMs: 1000,
  clientTimeoutMs: 100, statementTimeoutMs: 50, lockTimeoutMs: 10 })

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'issue105-executor-'))
  const backup = JSON.stringify(backupFromSnapshot(snapshot()))
  const files = { 'executor.mjs': 'executor', 'plan.mjs': 'plan', 'backup.json': backup,
    'package.json': '{"packageManager":"pnpm@10.28.0"}', 'pnpm-lock.yaml': 'lock' }
  await Promise.all(Object.entries(files).map(([name, bytes]) => writeFile(path.join(root, name), bytes)))
  const artifact = (name) => ({ path: name, sha256: sha(files[name]) })
  const manifest = {
    version: 1, runId: 'fake-rehearsal', environment: 'disposable', target: 'fake-local',
    runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'executor.mjs', envNames: [] }, schemaPush: 'disabled' },
    scope: { include: ['target'], exclude: ['protected'], expectedEffects: ['restore'], stopConditions: ['drift'], baseline: 'fixture' },
    artifacts: { executor: artifact('executor.mjs'), sql: [artifact('plan.mjs')], backup: artifact('backup.json'),
      dependencies: [artifact('package.json'), artifact('pnpm-lock.yaml')] },
    approval: { action: 'local', allowed: ['local'], excluded: ['production-migration'],
      validFrom: '2026-09-23T00:00:00.000Z', validUntil: '2026-10-01T00:00:00.000Z' },
  }
  assert(manifestHash(manifest))
  return { root, manifest }
}

function fakePlan(delayMs = 0) {
  return { estimatedQueries: 15,
    async snapshot({ query }) {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      await query('data', 'SELECT fake')
      return snapshot()
    },
    async apply({ query }) { await query('mutate', 'DELETE fake', [], 1) },
    assertAfter() {},
    async restore({ query }) { await query('restore', 'INSERT fake', [], 1) },
  }
}

function fakeClients(hook = () => undefined) {
  const clients = []
  const clientFactory = () => {
    const client = { calls: [], notices: [], active: 0, maxActive: 0,
      on(event, callback) { if (event === 'notice') this.notices.push(callback) },
      async connect() { this.calls.push('CONNECT') },
      async query(text) {
        this.calls.push(text)
        this.active += 1
        this.maxActive = Math.max(this.maxActive, this.active)
        try {
          const result = await hook(text, this)
          return result ?? { rows: [], rowCount: 0 }
        } finally { this.active -= 1 }
      },
      async end() { this.calls.push('END') },
    }
    clients.push(client)
    return client
  }
  return { clientFactory, clients }
}

async function run(hook, override = {}) {
  const { root, manifest } = await fixture()
  if (override.setup) await override.setup({ root, manifest })
  const { clientFactory, clients } = fakeClients(hook)
  const checkpoints = []
  let saved
  const sink = { signal: override.signal, checkpoint: async (item) => checkpoints.push(item), receipt: async (item) => { saved = item } }
  const receipt = await executeRun({ manifest, root, plan: override.plan ?? fakePlan(), clientFactory, sink,
    limits: { ...limits(), ...override.limits }, sessionId: 'fake-session' })
  assert.deepEqual(receipt, saved)
  return { receipt, checkpoints, clients }
}

test('normal path uses sequential queries, bounded checkpoints and a terminal receipt', async () => {
  const { receipt, checkpoints, clients } = await run()
  assert.equal(receipt.status, 'PASS')
  assert.equal(receipt.commitState, 'COMMITTED')
  assert.equal(receipt.restoreState, 'RESTORED')
  assert.equal(receipt.terminalExit, 0)
  assert.equal(receipt.automaticRetry, false)
  assert(clients.every((client) => client.maxActive === 1))
  assert(checkpoints.some((item) => item.stage === 'preflight' && item.queryLabel === 'before:data' &&
    Number.isInteger(item.elapsedMs) && Number.isInteger(item.responseBytes) && item.deadlineAt))
})

test('bounded delayed responses complete within the same deadline', async () => {
  const { receipt } = await run((text) => text === 'SELECT fake'
    ? new Promise((resolve) => setTimeout(() => resolve({ rows: [{ id: 1 }], rowCount: 1 }), 15))
    : undefined)
  assert.equal(receipt.status, 'PASS')
  assert(receipt.elapsedMs >= 30)
})

test('row and actual serialized-response byte caps stop oversized results', async () => {
  for (const [rows, expected] of [
    [[{ id: 1 }, { id: 2 }, { id: 3 }], 'ROW_CAP'],
    [[{ payload: 'x'.repeat(300) }], 'RESPONSE_BYTE_CAP'],
  ]) {
    const { receipt } = await run((text) => text === 'SELECT fake' ? { rows, rowCount: rows.length } : undefined)
    assert.equal(receipt.code, expected)
    assert.equal(receipt.commitState, 'ROLLED_BACK')
  }
})

test('manifest bytes and backup content checksum are separate gates', async () => {
  const changedFile = await run(undefined, { setup: async ({ root }) => writeFile(path.join(root, 'plan.mjs'), 'changed plan') })
  assert.equal(changedFile.receipt.code, 'MANIFEST_VERIFICATION_FAILED')
  const changedContent = await run(undefined, { setup: async ({ root, manifest }) => {
    const backup = backupFromSnapshot(snapshot())
    backup.snapshot.canonicalRows[0].body.title = 'changed without updating inner hash'
    const bytes = JSON.stringify(backup)
    await writeFile(path.join(root, 'backup.json'), bytes)
    manifest.artifacts.backup.sha256 = sha(bytes)
  } })
  assert.equal(changedContent.receipt.code, 'BACKUP_CONTENT_CHECKSUM')
})

test('statement, lock, cancellation, connection and client timeout remain distinct', async () => {
  const cases = [
    [{ code: '57014', message: 'canceling statement due to statement timeout' }, 'STATEMENT_TIMEOUT'],
    [{ code: '55P03', message: 'lock not available' }, 'LOCK_TIMEOUT'],
    [{ code: '57014', message: 'canceling statement due to user request' }, 'QUERY_CANCELLED'],
    [{ code: '08006', message: 'connection lost' }, 'CONNECTION_DROP'],
  ]
  for (const [failure, code] of cases) {
    const { receipt } = await run((text) => { if (text === 'SELECT fake') throw Object.assign(new Error(failure.message), { code: failure.code }) })
    assert.equal(receipt.code, code)
  }
  const { receipt } = await run((text) => text === 'SELECT fake' ? new Promise(() => {}) : undefined,
    { limits: { clientTimeoutMs: 30, statementTimeoutMs: 20, lockTimeoutMs: 5 } })
  assert.equal(receipt.code, 'CLIENT_RESPONSE_TIMEOUT')
})

test('warning, full-run deadline, rollback failure and commit acknowledgement loss fail closed', async () => {
  const warning = await run((text, client) => {
    if (text === 'SELECT fake') client.notices.forEach((callback) => callback({ severity: 'WARNING' }))
  })
  assert.equal(warning.receipt.code, 'DATABASE_WARNING')
  assert.notEqual(warning.receipt.status, 'PASS')
  const deadline = await run((text) => text === 'SELECT fake' ? new Promise(() => {}) : undefined,
    { plan: fakePlan(70), limits: { deadlineMs: 100, clientTimeoutMs: 60, statementTimeoutMs: 40, lockTimeoutMs: 5 } })
  assert.equal(deadline.receipt.code, 'RUN_DEADLINE')
  const rollback = await run((text) => {
    if (text === 'SELECT fake') throw new RunBlock('INJECTED_QUERY_FAILURE')
    if (text === 'ROLLBACK') throw new Error('rollback failed')
  })
  assert.equal(rollback.receipt.status, 'UNKNOWN')
  assert.equal(rollback.receipt.commitState, 'ROLLBACK_UNKNOWN')
  const commit = await run((text) => {
    if (text === 'COMMIT') throw Object.assign(new Error('acknowledgement lost'), { code: '08006' })
  })
  assert.equal(commit.receipt.status, 'UNKNOWN')
  assert.equal(commit.receipt.commitState, 'UNKNOWN')
  assert.equal(commit.receipt.automaticRetry, false)
  assert(!('productionWrites' in commit.receipt))
})

test('query and round-trip budgets, signal, and restore failures remain terminal', async () => {
  const plan = { ...fakePlan(), estimatedQueries: 1 }
  const budget = await run(undefined, { plan, limits: { queryBudget: 3 } })
  assert.equal(budget.receipt.code, 'QUERY_BUDGET')
  const trips = await run(undefined, { plan, limits: { queryBudget: 12, roundTripBudget: 12 } })
  assert.equal(trips.receipt.code, 'ROUND_TRIP_BUDGET', JSON.stringify(trips.receipt))
  const abort = new AbortController()
  const signalled = await run((text) => { if (text === 'SELECT fake') abort.abort() }, { signal: abort.signal })
  assert.equal(signalled.receipt.code, 'SIGNAL')
  assert.notEqual(signalled.receipt.status, 'PASS')
  const restore = await run((text) => { if (text === 'INSERT fake') throw new Error('restore failed') })
  assert.equal(restore.receipt.status, 'BLOCK')
  assert.equal(restore.receipt.commitState, 'COMMITTED')
  assert.equal(restore.receipt.restoreState, 'ROLLED_BACK')
  let commits = 0
  const restoreAck = await run((text) => {
    if (text === 'COMMIT' && ++commits === 2) throw Object.assign(new Error('restore ack lost'), { code: '08006' })
  })
  assert.equal(restoreAck.receipt.status, 'UNKNOWN')
  assert.equal(restoreAck.receipt.restoreState, 'UNKNOWN')
})

test('drift classifier covers outside rows, path, missing row, non-target content and metadata', () => {
  const baseline = snapshot()
  const changed = (update) => { const value = structuredClone(baseline); update(value); return value }
  const cases = [
    [changed((value) => value.targetRows.push({ table: 'travel_memories_rels', id: 99, path: 'itineraryImages' })), 'TARGET_ADDED_OUTSIDE_BACKUP'],
    [changed((value) => { value.targetRows[0].path = 'dailyHighlights.1.mediaItems' }), 'TARGET_PATH_CHANGED'],
    [changed((value) => { value.targetRows = [] }), 'TARGET_MISSING'],
    [changed((value) => { value.protectedRows[0].path = 'galleryImages2' }), 'NON_TARGET_RELATION_DRIFT'],
    [changed((value) => { value.canonicalRows[0].body.title = 'changed' }), 'CANONICAL_CONTENT_DRIFT'],
    [changed((value) => { value.metadata.constraints[0].value = 'changed' }), 'SCHEMA_DRIFT'],
    [changed((value) => { value.metadata.indexes[0].value = 'changed' }), 'SCHEMA_DRIFT'],
    [changed((value) => { value.metadata.sequences[0].value = 'changed' }), 'SCHEMA_DRIFT'],
    [changed((value) => { value.metadata.rls[0].value = 'changed' }), 'SECURITY_DRIFT'],
    [changed((value) => { value.metadata.grants[0].value = 'changed' }), 'SECURITY_DRIFT'],
    [changed((value) => { value.metadata.policies[0].value = 'changed' }), 'SECURITY_DRIFT'],
    [changed((value) => { value.legacyRows[0].body.day = 99 }), 'LEGACY_CONTENT_DRIFT'],
  ]
  for (const [value, code] of cases) assert.throws(() => compareSnapshot(baseline, value), (error) => error.code === code)
})
