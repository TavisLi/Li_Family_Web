import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'
import { manifestHash } from '../run-contract.mjs'
import { admission, offline } from './executor.mjs'
import { verifyBinding } from './binding.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const read = name => readFile(path.join(root, name))
const binding = JSON.parse(await read('scripts/rehearsal/baselines/issue180/binding.json'))
const now = new Date('2026-10-31T12:00:00Z')
async function packet() {
  const file = async name => ({ path: name, sha256: createHash('sha256').update(await read(name)).digest('hex') })
  const runId = 'issue180-' + 'a'.repeat(32)
  const manifest = { version: 1, runId, environment: 'disposable', target: `owned-unix:${runId}`,
    runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'node src/scripts/issue180/executor.mjs', envNames: [] }, schemaPush: 'disabled' },
    scope: { include: ['synthetic-travel'], exclude: ['production'], expectedEffects: ['none in offline test'], stopConditions: ['drift', 'timeout'], baseline: binding.files[binding.baseline] },
    artifacts: { executor: await file('src/scripts/issue180/executor.mjs'), sql: [], backup: null,
      dependencies: await Promise.all(['package.json', 'pnpm-lock.yaml'].map(file)) },
    approval: { action: 'local', allowed: ['local'], excluded: ['production-migration'], validFrom: '2026-10-31T11:00:00Z', validUntil: '2026-10-31T13:00:00Z' } }
  // Synthetic test-only authorization; never persisted or used to run a database.
  const approval = { source: 'SYNTHETIC-TEST-NOT-HUMAN-APPROVAL', manifestSha256: manifestHash(manifest), action: 'local', environment: 'disposable', target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  return { root, binding, manifest, approval, now, ownership: { runId, target: manifest.target } }
}
test('valid synthetic admission does not claim source verification or execution', async () => {
  assert.deepEqual(await admission(await packet()), { status: 'ADMISSION_ONLY', sourceNeedsVerification: true })
})
for (const [name, change, reason] of [
  ['missing approval', p => { p.approval = null }, /NO_APPROVAL/],
  ['expired approval', p => { p.now = new Date('2026-10-31T14:00:00Z') }, /TIMEOUT/],
  ['scope mismatch', p => { p.approval.scope = ['other'] }, /SCOPE_CHANGED/],
  ['illegal target', p => { p.manifest.target = 'postgres://remote' }, /ILLEGAL_TARGET/],
  ['ownership mismatch', p => { p.ownership.runId = 'other' }, /OWNERSHIP_MISMATCH/],
  ['missing ownership', p => { p.ownership = null }, /OWNERSHIP_MISMATCH/],
  ['interrupted', p => { p.signal = AbortSignal.abort() }, /INTERRUPTED/],
  ['binding drift', p => { p.binding = { ...p.binding, files: { ...p.binding.files, 'pnpm-lock.yaml': '0'.repeat(64) } } }, /binding drift/],
  ['wrong Node version', p => { p.binding = { ...p.binding, node: '0.0.0' } }, /Node version/],
  ['missing binding', p => { p.binding = null }, /./],
]) test(name + ' refuses before any live driver exists', async () => {
  const p = await packet(); change(p); await assert.rejects(admission(p), reason)
})
test('mapping contents cannot contradict historical baseline despite matching file bindings', async () => {
  await assert.rejects(verifyBinding(root, { ...binding, baseline: binding.historicalMapping }), /./)
})
test('CLI is DB-free, reports BLOCK and exits nonzero; environment secrets are not echoed', async () => {
  const result = spawnSync(process.execPath, ['src/scripts/issue180/executor.mjs', '--offline'], {
    cwd: root, encoding: 'utf8', env: { PATH: process.env.PATH, DATABASE_URI: 'SENTINEL-DO-NOT-READ' }, timeout: 10000,
  })
  assert.equal(result.status, 2)
  assert(!result.stdout.includes('SENTINEL'))
  const value = JSON.parse(result.stdout)
  assert.equal(value.databaseStarted, false)
  assert.equal(value.migrationExecuted, false)
  assert.equal((await offline(root)).approvalGenerated, false)
})
test('unverified source cannot create ledger or receipt', async () => {
  const { recordBlockedRun } = await import('./evidence.mjs')
  await assert.rejects(recordBlockedRun({ directory: '/must-not-exist', manifest: (await packet()).manifest,
    approval: null, verifySource: async () => false, reason: 'test' }), /SOURCE_UNVERIFIED/)
})
test('matrix accounts for every fixture scenario with explicit unexecuted status', async () => {
  const { fixture } = await import('./fixture.mjs')
  const matrix = JSON.parse(await read('scripts/rehearsal/baselines/issue180/matrix.json'))
  assert.deepEqual(matrix.map(item => item.id).sort(), [...fixture.scenarios].sort())
  assert(matrix.every(item => item.operation && item.assertion && item.runtimeResult === 'UNKNOWN'))
})
test('existing #105 sink writes a BLOCK receipt only for verified synthetic approval', async () => {
  const { mkdtemp, readFile: get, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { recordBlockedRun } = await import('./evidence.mjs')
  const p = await packet()
  const realNow = Date.now()
  p.manifest.approval.validFrom = new Date(realNow - 60000).toISOString()
  p.manifest.approval.validUntil = new Date(realNow + 60000).toISOString()
  p.approval.validFrom = p.manifest.approval.validFrom
  p.approval.validUntil = p.manifest.approval.validUntil
  p.approval.manifestSha256 = manifestHash(p.manifest)
  const directory = await mkdtemp(path.join(tmpdir(), 'issue180-evidence-test-'))
  try {
    await recordBlockedRun({ directory, manifest: p.manifest, approval: p.approval,
      verifySource: async source => source === 'SYNTHETIC-TEST-NOT-HUMAN-APPROVAL', reason: 'fixture-only' })
    const receipt = JSON.parse(await get(path.join(directory, 'receipt.json'), 'utf8'))
    const ledger = JSON.parse(await get(path.join(directory, 'ledger.json'), 'utf8'))
    assert.equal(receipt.status, 'BLOCK')
    assert.equal(receipt.manifestSha256, manifestHash(p.manifest))
    assert.equal(ledger.events.at(-1).status, 'BLOCK')
    await assert.rejects(recordBlockedRun({ directory, manifest: p.manifest, approval: p.approval,
      verifySource: async () => true, reason: 'must-not-retry' }), /EEXIST/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
