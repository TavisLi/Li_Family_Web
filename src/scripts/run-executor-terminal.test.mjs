import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { terminalDecision, terminalLedgerState } from './run-executor-terminal.mjs'

test('a real silent child exit cannot become PASS or imply zero writes', async () => {
  const silent = spawnSync(process.execPath, ['-e', 'process.exit(0)'])
  assert.equal(silent.status, 0)
  const decision = terminalDecision({ exitCode: silent.status, signal: silent.signal, receipt: null, lastCheckpoint: null })
  assert.deepEqual(decision, { status: 'BLOCK', code: 'MISSING_TERMINAL_RECEIPT', requiresFallback: true })
  const manifest = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-1-example/manifest.json', 'utf8'))
  const ledger = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-1-example/ledger.json', 'utf8'))
  const state = terminalLedgerState(manifest, ledger, decision)
  assert.equal(state.status, 'BLOCK')
  assert.equal(state.lastEvidencePath, 'supervisor-receipt.json')
  assert.equal(terminalDecision({ exitCode: 0, receipt: null,
    lastCheckpoint: { commitState: 'SENT_UNKNOWN' } }).status, 'UNKNOWN')
})

test('bootstrap failure still leaves a receipt, actual exit and current-state', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-bootstrap-'))
  const runId = 'issue-105-slice2-bootstrap-test'
  const make = spawnSync(process.execPath, ['src/scripts/run-executor-fixture-manifest.mjs', directory, runId],
    { encoding: 'utf8' })
  assert.equal(make.status, 0, make.stderr)
  const env = { ...process.env, PAYLOAD_ENABLE_DEV_SCHEMA_PUSH: 'false' }
  delete env.DATABASE_URI
  const result = spawnSync(process.execPath, ['src/scripts/run-executor-session.mjs', directory], { encoding: 'utf8', env })
  assert.equal(result.status, 1)
  const [receipt, terminal, state] = await Promise.all(['bootstrap-receipt.json', 'terminal-exit.json', 'current-state.json']
    .map(async (name) => JSON.parse(await readFile(path.join(directory, name), 'utf8'))))
  assert.equal(receipt.stage, 'bootstrap')
  assert.equal(receipt.commitState, 'NOT_STARTED')
  assert.equal(receipt.terminalExit, 1)
  assert.equal(terminal.actualExitCode, 1)
  assert.equal(state.status, 'BLOCK')
})
