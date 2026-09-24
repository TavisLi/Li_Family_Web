import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import { readOnlyRetryDecision, verifiedRunSummary } from './run-agent-summary.mjs'

const directory = 'docs/phase-artifacts/issue-105/slice-2-example/run'

test('verified summary is compact, delta aware, and does not invent approval', async () => {
  const state = await verifiedRunSummary(directory, process.cwd())
  assert.equal(state.status, 'PASS')
  assert.equal(state.terminalExit, 0)
  assert.deepEqual(state.approval, ['NO_APPROVAL'])
  assert.equal(await verifiedRunSummary(directory, process.cwd(), state), null)
  const proposal = await verifiedRunSummary(directory, process.cwd(), null, 'approval')
  assert.equal(proposal.environment, 'disposable')
  assert.deepEqual(proposal.approvalRecord, ['NO_APPROVAL'])
  assert.equal(proposal.artifactHashes.backup.path, 'docs/phase-artifacts/issue-105/slice-2-example/backup.json')
  const raw = await readFile(path.join(directory, 'checkpoints.jsonl'))
  assert(Buffer.byteLength(JSON.stringify(state)) < raw.length / 4)
})

test('only a source-verified read may retry inside a finite approval envelope', () => {
  const state = { status: 'BLOCK', authorization: { recordMatches: true } }
  const options = { state, sourceVerified: true, operation: 'read', failureCode: 'CLIENT_RESPONSE_TIMEOUT',
    attempts: 0, maxAttempts: 1 }
  assert.deepEqual(readOnlyRetryDecision(options), { allowed: true, reasons: [] })
  assert.equal(readOnlyRetryDecision({ ...options, operation: 'mutation' }).allowed, false)
  assert.equal(readOnlyRetryDecision({ ...options, attempts: 1 }).allowed, false)
  assert.equal(readOnlyRetryDecision({ ...options, sourceVerified: false }).allowed, false)
  assert.equal(readOnlyRetryDecision({ ...options, state: { ...state, status: 'UNKNOWN' } }).allowed, false)
  assert.equal(readOnlyRetryDecision({ ...options, failureCode: 'SCHEMA_DRIFT' }).allowed, false)
})
