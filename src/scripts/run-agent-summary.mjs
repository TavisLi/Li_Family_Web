import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { currentState, manifestHash, verifyEvidenceFiles, verifyManifestFiles } from './run-contract.mjs'

const readJson = async (directory, name) => JSON.parse(await readFile(path.join(directory, name), 'utf8'))
const optional = async (directory, name) => readJson(directory, name).catch((error) => {
  if (error.code === 'ENOENT') return null
  throw error
})

export function compactRunState({ manifest, state, receipt, terminal, previous = null }) {
  const result = {
    runId: manifest.runId, status: terminal?.status ?? state.status, stage: state.stage,
    code: terminal?.code ?? receipt?.code ?? null, evidencePath: state.lastEvidencePath,
    sessionId: terminal?.sessionId ?? receipt?.sessionId ?? null,
    terminalExit: terminal?.actualExitCode ?? null,
    commitState: receipt?.commitState ?? null, restoreState: receipt?.restoreState ?? null,
    approval: state.authorization.recordMatches ? 'SOURCE_VERIFICATION_REQUIRED' : state.authorization.reasons,
    invalidatedEvidence: state.evidence.filter((item) => !item.valid).map((item) => ({ path: item.path, changed: item.changed })),
  }
  return previous && JSON.stringify(previous) === JSON.stringify(result) ? null : result
}

export function approvalProposal(manifest, state) {
  return {
    manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope,
    runtime: manifest.runtime, artifactHashes: manifest.artifacts,
    approvalRecord: state.authorization.recordMatches ? 'MATCHES_BUT_SOURCE_REQUIRES_VERIFICATION' :
      state.authorization.reasons,
    evidenceStatus: state.status,
  }
}

export function readOnlyRetryDecision({ state, sourceVerified, operation, failureCode, attempts, maxAttempts }) {
  const reasons = []
  if (operation !== 'read') reasons.push('MUTATION_NO_AUTO_RETRY')
  if (!state.authorization.recordMatches || !sourceVerified) reasons.push('APPROVAL_UNVERIFIED')
  if (state.status !== 'BLOCK' || !['CLIENT_RESPONSE_TIMEOUT', 'CONNECTION_DROP'].includes(failureCode)) {
    reasons.push('NOT_RETRYABLE_READ_FAILURE')
  }
  if (!Number.isSafeInteger(attempts) || attempts < 0 || !Number.isSafeInteger(maxAttempts) ||
      maxAttempts < 1 || attempts >= maxAttempts) reasons.push('RETRY_ENVELOPE_EXHAUSTED')
  if (state.status === 'UNKNOWN') reasons.push('UNKNOWN_PRIOR_OUTCOME')
  return { allowed: reasons.length === 0, reasons }
}

export async function verifiedRunSummary(directory, root, previous = null, mode = 'state') {
  const manifest = await readJson(directory, 'manifest.json')
  await verifyManifestFiles(manifest, root)
  const [ledger, evidence, dependencies, approval, receipt, terminal] = await Promise.all([
    readJson(directory, 'ledger.json'), readJson(directory, 'evidence.json'), readJson(directory, 'dependencies.json'),
    optional(directory, 'approval.json'), optional(directory, 'receipt.json'), optional(directory, 'terminal-exit.json'),
  ])
  await verifyEvidenceFiles(evidence, directory)
  const state = currentState(manifest, ledger, approval, evidence, dependencies)
  return mode === 'approval' ? approvalProposal(manifest, state) :
    compactRunState({ manifest, state, receipt, terminal, previous })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [directory, root, mode = 'state', previousPath] = process.argv.slice(2)
  if (!directory || !root || !['state', 'approval'].includes(mode)) {
    throw new Error('Usage: node src/scripts/run-agent-summary.mjs <run-directory> <repository-root> [state|approval] [previous-json]')
  }
  const previous = previousPath ? JSON.parse(await readFile(previousPath, 'utf8')) : null
  const summary = await verifiedRunSummary(directory, root, previous, mode)
  if (summary) console.log(JSON.stringify(summary))
}
