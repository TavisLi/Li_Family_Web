import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { evaluateAuthorization, manifestHash, verifyManifestFiles } from './run-contract.mjs'

const policyPath = 'docs/phase-artifacts/issue-105/local-closeout/read-retry-policy.json'

// verifySource is supplied by the Human decision channel, never by this package.
export async function localApprovalGate({ manifest, root, approval, verifySource, operation,
  failureCode, stateStatus, priorRetries, now = new Date() }) {
  await verifyManifestFiles(manifest, root)
  assert.equal(manifest.environment, 'disposable', 'BLOCK: local gate environment')
  assert.equal(manifest.approval.action, 'local', 'BLOCK: local gate action')
  assert(manifest.artifacts.dependencies.some((item) => item.path === policyPath), 'BLOCK: retry policy unbound')
  const policy = JSON.parse(await readFile(path.join(root, policyPath), 'utf8'))
  assert.equal(policy.version, 1, 'BLOCK: retry policy version')
  assert.equal(policy.operation, 'read', 'BLOCK: retry policy operation')
  assert(Number.isSafeInteger(policy.maxAttempts) && policy.maxAttempts >= 0 && policy.maxAttempts <= 3,
    'BLOCK: retry policy attempts')
  const authorization = evaluateAuthorization(manifest, approval, now)
  const sourceVerified = approval && authorization.recordMatches &&
    await verifySource({ source: approval.source, manifestSha256: manifestHash(manifest),
      target: manifest.target, scope: manifest.scope, action: approval.action }) === true
  const reasons = [...authorization.reasons]
  if (!sourceVerified) reasons.push('SOURCE_UNVERIFIED')
  if (operation !== policy.operation) reasons.push('MUTATION_NO_AUTO_RETRY')
  if (stateStatus !== 'BLOCK' || !policy.retryableCodes.includes(failureCode)) reasons.push('NOT_RETRYABLE')
  if (!Number.isSafeInteger(priorRetries) || priorRetries < 0 || priorRetries >= policy.maxAttempts) {
    reasons.push('RETRY_ENVELOPE_EXHAUSTED')
  }
  if (policy.stopStatuses.includes(stateStatus)) reasons.push('TERMINAL_OUTCOME')
  return { reuseApproval: Boolean(sourceVerified), retryAllowed: reasons.length === 0,
    maxRetries: policy.maxAttempts, reasons }
}
