import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { manifestHash, validateManifest } from '../run-contract.mjs'
import { fileEvidenceSink } from '../run-executor-evidence.mjs'

test('Issue 158 sink writes truthful #105 authorization state from supplied run evidence', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue158-contract-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const generated = spawnSync(process.execPath, ['src/scripts/run-local-manifest.mjs', directory,
    'issue-105-local-issue158-contract-test', 'normal'], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'))
  manifest.approval.validFrom = new Date(Date.now() - 1000).toISOString()
  manifest.approval.validUntil = new Date(Date.now() + 60000).toISOString()
  validateManifest(manifest)
  const ledger = { version: 1, runId: manifest.runId, manifestSha256: manifestHash(manifest), events: [] }
  await writeFile(path.join(directory, 'ledger.json'), JSON.stringify(ledger))
  const approval = { source: 'test-only-human-source', manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope.include,
    baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions,
    validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  const sink = fileEvidenceSink(directory, manifest, undefined, { approval })
  await sink.start()
  await sink.checkpoint({ at: new Date().toISOString(), stage: 'local-test' })
  await sink.receipt({ status: 'PASS', stage: 'complete' })
  const writtenLedger = JSON.parse(await readFile(path.join(directory, 'ledger.json'), 'utf8'))
  assert.deepEqual(Object.keys(writtenLedger.events.at(-1)).sort(),
    ['at', 'evidencePath', 'sequence', 'stage', 'status'])
  const state = JSON.parse(await readFile(path.join(directory, 'current-state.json'), 'utf8'))
  assert.equal(state.authorization.recordMatches, true)
  assert.equal(state.authorization.sourceNeedsVerification, true)
  const withoutSource = path.join(directory, 'no-source')
  await mkdir(withoutSource)
  const secondLedger = { ...ledger, events: [] }
  await writeFile(path.join(withoutSource, 'ledger.json'), JSON.stringify(secondLedger))
  const second = fileEvidenceSink(withoutSource, manifest)
  await second.start()
  await second.checkpoint({ at: new Date().toISOString(), stage: 'local-test' })
  await second.receipt({ status: 'PASS', stage: 'complete' })
  const noApproval = JSON.parse(await readFile(path.join(withoutSource, 'current-state.json'), 'utf8'))
  assert.deepEqual(noApproval.authorization.reasons, ['NO_APPROVAL'])
})
