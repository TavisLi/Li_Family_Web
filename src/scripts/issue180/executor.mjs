import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateAuthorization, verifyManifestFiles } from '../run-contract.mjs'
import { verifyBinding } from './binding.mjs'

// No live driver is imported. Admission is independently testable without a DB.
export async function admission({ root, binding, manifest, approval, ownership, now = new Date(), signal }) {
  assert(!signal?.aborted, 'INTERRUPTED')
  assert(manifest, 'MISSING_MANIFEST')
  assert.equal(manifest.environment, 'disposable', 'ILLEGAL_ENVIRONMENT')
  assert.equal(manifest.approval.action, 'local', 'ILLEGAL_ACTION')
  assert(/^issue180-[a-f0-9]{32}$/.test(manifest.runId), 'ILLEGAL_RUN_ID')
  assert.equal(manifest.target, `owned-unix:${manifest.runId}`, 'ILLEGAL_TARGET')
  assert(ownership && ownership.runId === manifest.runId && ownership.target === manifest.target,
    'OWNERSHIP_MISMATCH')
  assert(now.getTime() < Date.parse(manifest.approval.validUntil), 'TIMEOUT')
  const auth = evaluateAuthorization(manifest, approval, now)
  assert(auth.recordMatches, auth.reasons.join(','))
  await verifyBinding(root, binding)
  await verifyManifestFiles(manifest, root)
  assert(!signal?.aborted, 'INTERRUPTED')
  return { status: 'ADMISSION_ONLY', sourceNeedsVerification: auth.sourceNeedsVerification }
}

export async function offline(root) {
  const binding = JSON.parse(await readFile(path.join(root, 'scripts/rehearsal/baselines/issue180/binding.json')))
  await verifyBinding(root, binding)
  return { status: 'BLOCK', phase: 'offline-preparation', approvalGenerated: false,
    databaseStarted: false, databaseConnected: false, migrationExecuted: false,
    blockers: ['NEW_EXACT_EXECUTION_APPROVAL_REQUIRED', 'MIGRATION_BASELINE_FIDELITY_UNPROVEN'],
    preparationEntrypoint:'src/scripts/issue180/gate-c-cli.mjs',
    runtimeTests: 'UNKNOWN' }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
  if (process.argv[2] !== '--offline') {
    console.error('BLOCK: live execution unavailable; use --offline for DB-free preparation')
    process.exitCode = 2
  } else {
    offline(root).then(result => { console.log(JSON.stringify(result, null, 2)); process.exitCode = 2 })
      .catch(error => { console.error(`BLOCK: ${error.message}`); process.exitCode = 2 })
  }
}
