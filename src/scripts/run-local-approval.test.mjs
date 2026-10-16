import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { manifestHash } from './run-contract.mjs'
import { localApprovalGate } from './run-local-approval.mjs'

test('verified local approval is reusable and its manifest-bound read retry envelope is finite', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-local-approval-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const generated = spawnSync(process.execPath, ['src/scripts/run-local-manifest.mjs', directory,
    'issue-105-local-approval-test', 'normal'], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'))
  const approval = { source: 'test-only-local-decision', manifestSha256: manifestHash(manifest),
    action: manifest.approval.action, environment: manifest.environment, target: manifest.target,
    scope: manifest.scope.include, baseline: manifest.scope.baseline,
    stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom,
    validUntil: manifest.approval.validUntil, revoked: false }
  let sourceChecks = 0
  const verifySource = async ({ source, target, action }) => {
    sourceChecks += 1
    return source === 'test-only-local-decision' && target === '127.0.0.1:55444/issue105' && action === 'local'
  }
  // The synthetic manifest has a fixed historical window; do not use the wall clock.
  const now = new Date((Date.parse(manifest.approval.validFrom) + Date.parse(manifest.approval.validUntil)) / 2)
  const input = { manifest, now, root: process.cwd(), approval, verifySource, operation: 'read',
    failureCode: 'CLIENT_RESPONSE_TIMEOUT', stateStatus: 'BLOCK', priorRetries: 0 }
  const first = await localApprovalGate(input)
  const reused = await localApprovalGate(input)
  assert.deepEqual(first, { reuseApproval: true, retryAllowed: true, maxRetries: 1, reasons: [] })
  assert.deepEqual(reused, first)
  assert.equal(sourceChecks, 2) // source read-back is not a second approval request
  for (const timestamp of [Date.parse(manifest.approval.validFrom) - 1, Date.parse(manifest.approval.validUntil) + 1]) {
    const outsideWindow = await localApprovalGate({ ...input, now: new Date(timestamp) })
    assert.deepEqual(outsideWindow, { reuseApproval: false, retryAllowed: false, maxRetries: 1,
      reasons: ['EXPIRED_OR_NOT_YET_VALID', 'SOURCE_UNVERIFIED'] })
  }
  assert.equal(sourceChecks, 2) // invalid time windows never reach source verification
  assert.equal((await localApprovalGate({ ...input, priorRetries: 1 })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, operation: 'mutation' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, stateStatus: 'UNKNOWN' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, failureCode: 'SCHEMA_DRIFT' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, verifySource: async () => false })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, approval: { ...approval, baseline: 'drift' } })).retryAllowed, false)
})
