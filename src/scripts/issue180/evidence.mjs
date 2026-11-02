import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { evaluateAuthorization, manifestHash } from '../run-contract.mjs'
import { fileEvidenceSink } from '../run-executor-evidence.mjs'

// Called only after an independently approved manifest and source check.
// The caller owns directory creation and must not reuse an existing run directory.
export async function recordBlockedRun({ directory, manifest, approval, verifySource, reason }) {
  if (!evaluateAuthorization(manifest, approval).recordMatches) throw new Error('SOURCE_UNVERIFIED')
  if (await verifySource(approval?.source, manifestHash(manifest)) !== true) throw new Error('SOURCE_UNVERIFIED')
  const digest = manifestHash(manifest)
  await writeFile(path.join(directory, 'ledger.json'), JSON.stringify({ version: 1, runId: manifest.runId,
    manifestSha256: digest, events: [] }), { flag: 'wx', mode: 0o600 })
  const sink = fileEvidenceSink(directory, manifest, undefined, { approval })
  await sink.start()
  await sink.checkpoint({ at: new Date().toISOString(), stage: 'admission', message: reason })
  await sink.receipt({ manifestSha256: digest, status: 'BLOCK', stage: 'admission', reason,
    productionConnections: 0, automaticRetry: false })
}
