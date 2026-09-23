import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

import { currentState, evaluateAuthorization, evaluateEvidence, manifestHash, verifyEvidenceFiles, verifyManifestFiles } from './run-contract.mjs'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const file = (name, bytes) => ({ path: name, sha256: hash(bytes) })
const manifest = () => ({
  version: 1,
  runId: 'slice-1-fixture',
  environment: 'disposable',
  target: 'local-postgres',
  runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'node executor.mjs', envNames: ['DATABASE_URI'] }, schemaPush: 'disabled' },
  scope: {
    include: ['travel_memories_rels'], exclude: ['users', 'media'],
    expectedEffects: ['disposable transaction rolls back'], stopConditions: ['drift', 'timeout', 'unknown commit'],
    baseline: 'fixture-baseline-sha',
  },
  artifacts: {
    executor: file('executor.mjs', 'executor'), sql: [file('read.sql', 'read')], backup: null,
    dependencies: [file('package.json', '{"packageManager":"pnpm@10.28.0"}'), file('pnpm-lock.yaml', 'lock')],
  },
  approval: {
    action: 'local', allowed: ['local'], excluded: ['production-migration', 'destructive-cleanup'],
    validFrom: '2026-09-01T00:00:00.000Z', validUntil: '2026-10-01T00:00:00.000Z',
  },
})
const approved = (run) => ({
  source: 'human-review-record-1', manifestSha256: manifestHash(run),
  action: run.approval.action, environment: run.environment, target: run.target,
  scope: run.scope.include, baseline: run.scope.baseline, stopConditions: run.scope.stopConditions,
  validFrom: run.approval.validFrom, validUntil: run.approval.validUntil, revoked: false,
})
const now = new Date('2026-09-23T00:00:00.000Z')

test('checks actual artifact bytes, including backup, before accepting a manifest', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'run-contract-'))
  const run = manifest()
  run.environment = 'production'
  run.approval.action = 'production-migration'
  run.approval.allowed = ['production-migration']
  run.approval.excluded = ['production-content', 'destructive-cleanup']
  run.artifacts.backup = file('backup.json', 'backup bytes')
  await Promise.all([['executor.mjs', 'executor'], ['read.sql', 'read'], ['package.json', '{"packageManager":"pnpm@10.28.0"}'], ['pnpm-lock.yaml', 'lock'], ['backup.json', 'backup bytes']]
    .map(([name, bytes]) => writeFile(path.join(root, name), bytes)))
  assert.equal((await verifyManifestFiles(run, root)).verifiedFiles, 5)
  await writeFile(path.join(root, 'backup.json'), 'changed backup bytes')
  await assert.rejects(verifyManifestFiles(run, root), /artifact bytes changed: backup.json/)
  run.artifacts.backup = null
  await assert.rejects(verifyManifestFiles(run, root), /Production backup missing/)
})

test('reuses only a matching live human approval and names the invalidating change', () => {
  const run = manifest()
  const approval = approved(run)
  assert.deepEqual(evaluateAuthorization(run, approval, now), { recordMatches: true, sourceNeedsVerification: true, reasons: [] })
  assert.deepEqual(evaluateAuthorization(run, null, now), { recordMatches: false, sourceNeedsVerification: true, reasons: ['NO_APPROVAL'] })
  run.scope.baseline = 'changed-baseline'
  assert.deepEqual(evaluateAuthorization(run, approval, now).reasons, ['MANIFEST_CHANGED', 'BASELINE_CHANGED'])
  assert.equal(evaluateAuthorization(manifest(), approved(manifest()), new Date('2026-10-02T00:00:00Z')).recordMatches, false)
  approval.revoked = true
  assert(evaluateAuthorization(manifest(), approval, now).reasons.includes('REVOKED_OR_UNKNOWN'))
})

test('invalidates only changed dependencies for each evidence type', () => {
  const run = manifest()
  run.artifacts.backup = file('backup.json', 'backup bytes')
  const qa = {
    kind: 'preview-qa', status: 'PASS', path: 'qa.json', sha256: hash('qa'),
    dependsOn: { commit: 'a', deployment: 'd', authEntry: 'family', routes: 'r', data: 'data', schema: 'schema' },
  }
  assert.equal(evaluateEvidence(qa, { ...qa.dependsOn, executor: 'changed' }, run).valid, true)
  assert.deepEqual(evaluateEvidence(qa, { ...qa.dependsOn, authEntry: 'public' }, run).changed, ['authEntry'])
  assert.deepEqual(evaluateEvidence(qa, { ...qa.dependsOn, schema: undefined }, run).changed, ['schema'])
  const preflight = {
    kind: 'preflight', status: 'PASS', path: 'preflight.json', sha256: hash('preflight'),
    dependsOn: { manifest: 'm', executor: 'e', sql: 's', backup: 'b', schema: 'schema', data: 'data' },
  }
  assert.deepEqual(evaluateEvidence(preflight, { ...preflight.dependsOn, data: 'changed' }, run).changed, ['data'])
  assert.deepEqual(evaluateEvidence(preflight, { ...preflight.dependsOn, backup: 'changed' }, run).changed, ['backup'])
  run.artifacts.backup = null
  assert.deepEqual(evaluateEvidence(preflight, preflight.dependsOn, run), {
    valid: false, changed: ['backup'], status: 'PASS',
  })
  assert.equal(evaluateEvidence({ ...preflight, kind: 'rehearsal', dependsOn: {
    manifest: 'm', executor: 'e', sql: 's', backup: 'b', schema: 'schema',
  } }, preflight.dependsOn, run).valid, false)
})

test('requires actual evidence bytes before the inspector may reuse PASS evidence', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'run-evidence-'))
  const evidence = [{ path: 'qa.json', sha256: hash('original') }]
  await writeFile(path.join(root, 'qa.json'), 'original')
  assert.equal(await verifyEvidenceFiles(evidence, root), 1)
  await writeFile(path.join(root, 'qa.json'), 'changed')
  await assert.rejects(verifyEvidenceFiles(evidence, root), /evidence bytes changed/)
})

test('derives one current state from the ordered ledger and preserves UNKNOWN', () => {
  const run = manifest()
  const ledger = {
    version: 1, runId: run.runId, manifestSha256: manifestHash(run),
    events: [{ sequence: 1, at: '2026-09-23T00:00:00Z', stage: 'commit', status: 'UNKNOWN', evidencePath: 'receipt.json' }],
  }
  const state = currentState(run, ledger, approved(run), [], {}, now)
  assert.equal(state.status, 'UNKNOWN')
  assert.equal(state.lastEvidencePath, 'receipt.json')
  ledger.events.push({ sequence: 2, at: '2026-09-23T00:01:00Z', stage: 'retry', status: 'PASS', evidencePath: 'retry.json' })
  assert.throws(() => currentState(run, ledger, approved(run), [], {}, now), /event after terminal failure/)
})

test('inspector writes a summary without inventing approval or accepting backup-free preflight', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'run-contract-inspect-'))
  const run = manifest()
  const dependsOn = { manifest: 'm', executor: 'e', sql: 's', backup: 'b', schema: 'schema', data: 'data' }
  const inputs = {
    'manifest.json': run,
    'ledger.json': { version: 1, runId: run.runId, manifestSha256: manifestHash(run), events: [] },
    'evidence.json': [{ kind: 'preflight', status: 'PASS', path: 'preflight.json', sha256: hash('evidence bytes'), dependsOn }],
    'dependencies.json': dependsOn,
  }
  await Promise.all([
    ...Object.entries(inputs).map(([name, value]) => writeFile(path.join(directory, name), JSON.stringify(value))),
    ...[['executor.mjs', 'executor'], ['read.sql', 'read'], ['package.json', '{"packageManager":"pnpm@10.28.0"}'], ['pnpm-lock.yaml', 'lock']]
      .map(([name, bytes]) => writeFile(path.join(directory, name), bytes)),
    writeFile(path.join(directory, 'preflight.json'), 'evidence bytes'),
  ])
  const result = spawnSync(process.execPath, ['src/scripts/run-contract-inspect.mjs', directory, directory], {
    cwd: new URL('../..', import.meta.url), encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  const summary = JSON.parse(await readFile(path.join(directory, 'current-state.json'), 'utf8'))
  assert.equal(summary.status, 'PENDING')
  assert.deepEqual(summary.authorization.reasons, ['NO_APPROVAL'])
  assert.equal(summary.verifiedFiles, 4)
  assert.equal(summary.verifiedEvidenceFiles, 1)
  assert.deepEqual(summary.evidence[0].changed, ['backup'])
  assert.equal(summary.evidence[0].valid, false)
})

test('checked-in Slice 1 example replays from the current artifact bytes', async () => {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const directory = new URL('../../docs/phase-artifacts/issue-105/slice-1-example/', import.meta.url)
  const read = async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'))
  const [run, ledger, evidence, dependencies, saved] = await Promise.all([
    read('manifest.json'), read('ledger.json'), read('evidence.json'), read('dependencies.json'), read('current-state.json'),
  ])
  const verified = await verifyManifestFiles(run, root)
  const verifiedEvidenceFiles = await verifyEvidenceFiles(evidence, directory)
  assert.deepEqual({ ...currentState(run, ledger, null, evidence, dependencies, now), verifiedFiles: verified.verifiedFiles, verifiedEvidenceFiles }, saved)
})
