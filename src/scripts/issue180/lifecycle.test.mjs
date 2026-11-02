import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { prepareOwnership, verifyOwnership, createLifecycle } from './lifecycle.mjs'

const runId = 'issue180-' + 'a'.repeat(32)
test('start before initialization refuses before any launcher or command', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'issue180-lifecycle-test-'))
  try {
    const owner = await prepareOwnership(root, runId); let invoked = false
    const life = createLifecycle({ owner, command: async () => { invoked = true }, launch: () => { invoked = true } })
    await assert.rejects(life.start({ deadline: Date.now()+1000 }), /INITIALIZE_REQUIRED/)
    assert.equal(invoked, false)
  } finally { await rm(root, { recursive: true, force: true }) }
})
test('ownership drift blocks commands and preserves resources', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'issue180-owner-test-'))
  try {
    const owner = await prepareOwnership(root, runId); let invoked = false
    await writeFile(path.join(owner.directory, 'owner.json'), '{}')
    await assert.rejects(verifyOwnership(owner), /owner marker drift/)
    const life = createLifecycle({ owner, command: async () => { invoked = true }, launch: () => { invoked = true } })
    await assert.rejects(life.start({ deadline: Date.now()+1000 }), /owner marker drift/)
    assert.equal(invoked, false)
    assert.equal(await readFile(path.join(owner.directory, 'owner.json'), 'utf8'), '{}')
  } finally { await rm(root, { recursive: true, force: true }) }
})
test('expired cleanup deadline does not trigger commands or removal', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'issue180-unknown-test-'))
  try {
    const owner = await prepareOwnership(root, runId)
    let invoked = false
    const life = createLifecycle({ owner, command: async () => { invoked = true }, launch: () => { invoked = true } })
    await assert.rejects(life.cleanup({ deadline: Date.now()-1 }), /DEADLINE/)
    assert.equal(invoked, false)
    await verifyOwnership(owner)
  } finally { await rm(root, { recursive: true, force: true }) }
})
test('init failure preserves original failure and cleanup UNKNOWN in #105 receipt', async () => {
  const { createHash } = await import('node:crypto')
  const { manifestHash } = await import('../run-contract.mjs')
  const { runLifecycle } = await import('./lifecycle.mjs')
  const root = process.cwd(), scratch = await mkdtemp(path.join(os.tmpdir(), 'issue180-receipt-test-'))
  try {
    const owner = await prepareOwnership(scratch, runId), evidence = path.join(scratch, 'evidence')
    await mkdir(evidence)
    const artifact = async name => ({ path: name, sha256: createHash('sha256').update(await readFile(path.join(root, name))).digest('hex') })
    const now = Date.now(), manifest = { version: 1, runId, environment: 'disposable', target: `owned-unix:${runId}`,
      runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'lifecycle', envNames: [] }, schemaPush: 'disabled' },
      scope: { include: ['synthetic'], exclude: ['production'], expectedEffects: ['none'], stopConditions: ['drift'], baseline: 'synthetic' },
      artifacts: { executor: await artifact('src/scripts/issue180/lifecycle.mjs'), sql: [], backup: null, dependencies: await Promise.all(['package.json','pnpm-lock.yaml','src/scripts/issue180/child.mjs','src/scripts/issue180/warnings.mjs','src/scripts/issue180/foreground.mjs','src/scripts/issue180/executor.mjs','src/scripts/issue180/binding.mjs','src/scripts/run-contract.mjs','src/scripts/run-executor-evidence.mjs','scripts/rehearsal/baselines/issue180/binding.json'].map(artifact)) },
      approval: { action: 'local', allowed: ['local'], excluded: ['production-migration'], validFrom: new Date(now-1000).toISOString(), validUntil: new Date(now+60000).toISOString() } }
    const approval = { source: 'synthetic-not-human', manifestSha256: manifestHash(manifest), action: 'local', environment: 'disposable', target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
    const binding = JSON.parse(await readFile('scripts/rehearsal/baselines/issue180/binding.json'))
    const result = await runLifecycle({ root, binding, manifest, approval, ownership: { runId, target: manifest.target }, verifySource: async () => true, owner, directory: evidence, deadline: now+30000,
      command: async file => { if (path.basename(file) === 'pg_config') return { stdout: 'PostgreSQL 17.11' }; throw new Error('SYNTHETIC_FAILURE') },
      launch: () => { throw new Error('must never launch after init failure') } })
    assert.equal(result.status, 'BLOCK'); assert.equal(result.failure.message, 'SYNTHETIC_FAILURE'); assert.equal(result.cleanup.status, 'UNKNOWN')
    const receipt = JSON.parse(await readFile(path.join(evidence, 'receipt.json'), 'utf8'))
    assert.equal(receipt.failure.message, 'SYNTHETIC_FAILURE'); assert.equal(receipt.effects, 'UNKNOWN'); await verifyOwnership(owner)
  } finally { await rm(scratch, { recursive: true, force: true }) }
})
