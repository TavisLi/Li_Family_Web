import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { manifestHash } from './run-contract.mjs'

const run = (directory) => spawnSync(process.execPath, ['src/scripts/run-local-session.mjs', directory],
  { cwd: process.cwd(), encoding: 'utf8' })
const read = async (directory, name) => JSON.parse(await readFile(path.join(directory, name), 'utf8'))

test('parent bootstrap writes receipt and terminal evidence even when manifest is malformed', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-local-bootstrap-'))
  await writeFile(path.join(directory, 'manifest.json'), '{broken')
  const result = run(directory)
  assert.equal(result.status, 1)
  assert.equal((await read(directory, 'supervisor-receipt.json')).status, 'BLOCK')
  assert.equal((await read(directory, 'terminal-exit.json')).code, 'BOOTSTRAP_FAILURE')
  assert.equal((await read(directory, 'current-state.json')).status, 'BLOCK')
})

test('parent bootstrap writes a contract ledger event when a bound input is missing', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-local-bootstrap-'))
  const make = spawnSync(process.execPath, ['src/scripts/run-local-manifest.mjs', directory,
    'issue-105-local-missing-input', 'normal'], { cwd: process.cwd(), encoding: 'utf8' })
  assert.equal(make.status, 0, make.stderr)
  const manifest = await read(directory, 'manifest.json')
  manifest.artifacts.dependencies.find((item) => item.path.endsWith('/limits.json')).path =
    'docs/phase-artifacts/issue-105/local-closeout/missing/limits.json'
  const ledger = await read(directory, 'ledger.json')
  ledger.manifestSha256 = manifestHash(manifest)
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest))
  await writeFile(path.join(directory, 'ledger.json'), JSON.stringify(ledger))
  const result = run(directory)
  assert.equal(result.status, 1)
  const receipt = await read(directory, 'supervisor-receipt.json')
  const state = await read(directory, 'current-state.json')
  assert.equal(receipt.code, 'BOOTSTRAP_INPUT_MISSING')
  assert.equal(state.status, 'BLOCK')
  assert.equal(state.lastEvidencePath, 'supervisor-receipt.json')
  assert.equal((await read(directory, 'ledger.json')).events.at(-1).stage, 'supervisor')
})
