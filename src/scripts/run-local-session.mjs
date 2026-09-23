import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { verifyManifestFiles } from './run-contract.mjs'
import { terminalDecision, terminalLedgerState } from './run-executor-terminal.mjs'

const [runDirectory] = process.argv.slice(2)
assert(runDirectory && process.argv.length === 3, 'Usage: node src/scripts/run-local-session.mjs <run-directory>')
const root = process.cwd()
const started = Date.now()
const file = (name) => path.join(runDirectory, name)
const readJson = async (name) => JSON.parse(await readFile(file(name), 'utf8'))
const exists = async (name) => access(file(name)).then(() => true, () => false)
const save = (name, value) => writeFile(file(name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
let manifest
let child
try {
  for (const name of ['checkpoints.jsonl', 'receipt.json', 'bootstrap-receipt.json', 'terminal-exit.json']) {
    assert(!(await exists(name)), 'BLOCK: run already attempted; no automatic retry')
  }
  manifest = await readJson('manifest.json')
  const limitFiles = manifest.artifacts.dependencies.filter((item) =>
    item.path.startsWith('docs/phase-artifacts/issue-105/local-closeout/') && item.path.endsWith('/limits.json'))
  assert.equal(limitFiles.length, 1, 'BLOCK: one limit file required')
  await verifyManifestFiles(manifest, root)
  const limits = JSON.parse(await readFile(path.join(root, limitFiles[0].path), 'utf8'))
  const chunks = { stdout: [], stderr: [] }
  child = spawn(process.execPath, ['src/scripts/run-local-rehearsal.mjs', runDirectory],
    { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  for (const name of ['stdout', 'stderr']) child[name].on('data', (chunk) => {
    if (Buffer.concat(chunks[name]).length < 64 * 1024) chunks[name].push(chunk)
  })
  let forced = false
  let killTimer
  const timer = setTimeout(() => {
    forced = true
    child.kill('SIGTERM')
    killTimer = setTimeout(() => child.kill('SIGKILL'), 3000)
  }, limits.deadlineMs + 5000)
  for (const name of ['SIGINT', 'SIGTERM']) process.once(name, () => child.kill(name))
  const { exitCode, signal } = await new Promise((resolve) => child.on('close', (code, reason) =>
    resolve({ exitCode: code, signal: reason })))
  clearTimeout(timer)
  clearTimeout(killTimer)
  for (const name of ['stdout', 'stderr']) await writeFile(file(`${name}.log`), Buffer.concat(chunks[name]),
    { flag: 'wx', mode: 0o600 })
  const receipt = await readJson('receipt.json').catch(() => readJson('bootstrap-receipt.json').catch(() => null))
  const checkpoints = await readFile(file('checkpoints.jsonl'), 'utf8').catch(() => '')
  let lastCheckpoint = null
  if (checkpoints.trim()) {
    try { lastCheckpoint = JSON.parse(checkpoints.trim().split('\n').at(-1)) }
    catch { lastCheckpoint = { commitState: 'UNKNOWN', restoreState: 'UNKNOWN' } }
  }
  const decision = terminalDecision({ exitCode, signal, receipt, lastCheckpoint, forcedDeadline: forced })
  const receiptPath = receipt ? (await exists('receipt.json') ? 'receipt.json' : 'bootstrap-receipt.json') :
    'supervisor-receipt.json'
  const terminal = { runId: manifest.runId, sessionId: `${manifest.runId}:${child.pid}`, actualExitCode: exitCode,
    signal, forcedDeadline: forced, elapsedMs: Date.now() - started, status: decision.status, code: decision.code,
    receiptPath, stdoutBytes: Buffer.concat(chunks.stdout).length, stderrBytes: Buffer.concat(chunks.stderr).length,
    automaticRetry: false }
  if (decision.requiresFallback) await save('supervisor-receipt.json', { ...terminal,
    commitState: lastCheckpoint?.commitState ?? 'UNKNOWN', restoreState: lastCheckpoint?.restoreState ?? 'UNKNOWN' })
  if (decision.requiresFallback || !(await exists('current-state.json'))) {
    const ledger = await readJson('ledger.json')
    const state = terminalLedgerState(manifest, ledger, decision, new Date().toISOString(), receiptPath, true)
    await writeFile(file('ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 })
    await writeFile(file('current-state.json'), `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  }
  await save('terminal-exit.json', terminal)
  process.exitCode = decision.status === 'PASS' ? 0 : 1
  console.log(JSON.stringify({ status: decision.status, code: decision.code, sessionId: terminal.sessionId,
    terminalExit: exitCode, receipt: receiptPath }))
} catch (error) {
  if (child) child.kill('SIGTERM')
  const code = error?.code === 'ENOENT' ? 'BOOTSTRAP_INPUT_MISSING' : 'BOOTSTRAP_FAILURE'
  const fallback = { runId: manifest?.runId ?? null, sessionId: `${manifest?.runId ?? 'unidentified'}:${process.pid}`,
    actualExitCode: null, status: 'BLOCK', code, stage: 'bootstrap', elapsedMs: Date.now() - started,
    commitState: 'NOT_STARTED', restoreState: 'NOT_STARTED', receiptPath: 'supervisor-receipt.json',
    automaticRetry: false }
  await save('supervisor-receipt.json', fallback)
  await save('terminal-exit.json', fallback)
  let state
  try {
    const ledger = await readJson('ledger.json')
    const decision = { status: 'BLOCK', code, requiresFallback: true }
    state = terminalLedgerState(manifest, ledger, decision, new Date().toISOString(), 'supervisor-receipt.json')
    await writeFile(file('ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 })
  } catch {
    state = { runId: manifest?.runId ?? null, stage: 'bootstrap', status: 'BLOCK',
      lastEvidencePath: 'supervisor-receipt.json', authorization: { recordMatches: false, reasons: ['NO_APPROVAL'] } }
  }
  await writeFile(file('current-state.json'), `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  process.exitCode = 1
  console.log(JSON.stringify({ status: 'BLOCK', code, receipt: 'supervisor-receipt.json' }))
}
