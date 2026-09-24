import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { currentState, verifyEvidenceFiles, verifyManifestFiles } from './run-contract.mjs'

const [runDirectory, repositoryRoot] = process.argv.slice(2)
if (!runDirectory || !repositoryRoot) {
  throw new Error('Usage: node src/scripts/run-contract-inspect.mjs <run-directory> <repository-root>')
}

const readJson = async (name) => JSON.parse(await readFile(path.join(runDirectory, name), 'utf8'))
const manifest = await readJson('manifest.json')
const verified = await verifyManifestFiles(manifest, repositoryRoot)
const [ledger, evidence, current] = await Promise.all([
  readJson('ledger.json'), readJson('evidence.json'), readJson('dependencies.json'),
])
const verifiedEvidenceFiles = await verifyEvidenceFiles(evidence, runDirectory)
let approval = null
try {
  approval = await readJson('approval.json')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const state = { ...currentState(manifest, ledger, approval, evidence, current), verifiedFiles: verified.verifiedFiles, verifiedEvidenceFiles }
const destination = path.join(runDirectory, 'current-state.json')
const temporary = `${destination}.${process.pid}.tmp`
await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' })
await rename(temporary, destination)
console.log(destination)
