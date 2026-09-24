import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { manifestHash } from './run-contract.mjs'
import { localApprovalGate } from './run-local-approval.mjs'

test('verified local approval is reusable and its manifest-bound read retry envelope is finite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-local-approval-'))
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
  const input = { manifest, root: process.cwd(), approval, verifySource, operation: 'read',
    failureCode: 'CLIENT_RESPONSE_TIMEOUT', stateStatus: 'BLOCK', priorRetries: 0 }
  const first = await localApprovalGate(input)
  const reused = await localApprovalGate(input)
  assert.deepEqual(first, { reuseApproval: true, retryAllowed: true, maxRetries: 1, reasons: [] })
  assert.deepEqual(reused, first)
  assert.equal(sourceChecks, 2) // source read-back is not a second approval request
  assert.equal((await localApprovalGate({ ...input, priorRetries: 1 })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, operation: 'mutation' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, stateStatus: 'UNKNOWN' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, failureCode: 'SCHEMA_DRIFT' })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, verifySource: async () => false })).retryAllowed, false)
  assert.equal((await localApprovalGate({ ...input, approval: { ...approval, baseline: 'drift' } })).retryAllowed, false)
})
