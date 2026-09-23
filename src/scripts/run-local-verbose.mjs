import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { verifyManifestFiles } from './run-contract.mjs'

const [directory, root] = process.argv.slice(2)
assert(directory && root && process.argv.length === 4,
  'Usage: node src/scripts/run-local-verbose.mjs <run-directory> <repository-root>')
const readJson = async (name) => JSON.parse(await readFile(path.join(directory, name), 'utf8'))
const manifest = await readJson('manifest.json')
assert.equal(manifest.environment, 'disposable', 'BLOCK: verbose baseline is local only')
await verifyManifestFiles(manifest, root)
const terminal = await readJson('terminal-exit.json')
const [ledger, state, receipt, rawCheckpoints] = await Promise.all([
  readJson('ledger.json'), readJson('current-state.json'), readJson(terminal.receiptPath),
  readFile(path.join(directory, 'checkpoints.jsonl'), 'utf8').catch(() => ''),
])
const checkpoints = rawCheckpoints.trim() ? rawCheckpoints.trim().split('\n').map((line) => JSON.parse(line)) : []
console.log(JSON.stringify({ manifest, ledger, checkpoints, receipt, terminal, state }))
