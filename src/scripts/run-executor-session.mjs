import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { terminalDecision, terminalLedgerState } from './run-executor-terminal.mjs'

const [runDirectory] = process.argv.slice(2)
assert(runDirectory && process.argv.length === 3, 'Usage: node src/scripts/run-executor-session.mjs <run-directory>')
const root = process.cwd()
const readJson = async (name) => JSON.parse(await readFile(path.join(runDirectory, name), 'utf8'))
const exists = async (name) => access(path.join(runDirectory, name)).then(() => true, () => false)
for (const name of ['checkpoints.jsonl', 'receipt.json', 'bootstrap-receipt.json', 'terminal-exit.json']) {
  assert(!(await exists(name)), 'BLOCK: run already attempted; no automatic retry')
}
const manifest = await readJson('manifest.json')
const limits = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-2-example/limits.json', 'utf8'))
const started = Date.now()
const child = spawn(process.execPath, ['src/scripts/run-executor-rehearsal.mjs', runDirectory],
  { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
const chunks = { stdout: [], stderr: [] }
for (const name of ['stdout', 'stderr']) child[name].on('data', (chunk) => {
  // Preserve bounded raw diagnostics on disk, never echo a database response.
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
for (const name of ['stdout', 'stderr']) await writeFile(path.join(runDirectory, `${name}.log`), Buffer.concat(chunks[name]), { flag: 'wx', mode: 0o600 })
const receipt = await readJson('receipt.json').catch(() => readJson('bootstrap-receipt.json').catch(() => null))
const checkpoints = await readFile(path.join(runDirectory, 'checkpoints.jsonl'), 'utf8').catch(() => '')
let lastCheckpoint = null
if (checkpoints.trim()) {
  try { lastCheckpoint = JSON.parse(checkpoints.trim().split('\n').at(-1)) }
  catch { lastCheckpoint = { commitState: 'UNKNOWN', restoreState: 'UNKNOWN' } }
}
const decision = terminalDecision({ exitCode, signal, receipt, lastCheckpoint, forcedDeadline: forced })
const terminal = { runId: manifest.runId, sessionId: `${manifest.runId}:${child.pid}`, actualExitCode: exitCode,
  signal, forcedDeadline: forced, elapsedMs: Date.now() - started, status: decision.status, code: decision.code,
  receiptPath: receipt ? (await exists('receipt.json') ? 'receipt.json' : 'bootstrap-receipt.json') : 'supervisor-receipt.json',
  stdoutBytes: Buffer.concat(chunks.stdout).length, stderrBytes: Buffer.concat(chunks.stderr).length,
  automaticRetry: false }
if (decision.requiresFallback) {
  await writeFile(path.join(runDirectory, 'supervisor-receipt.json'), `${JSON.stringify({ ...terminal,
    commitState: lastCheckpoint?.commitState ?? 'UNKNOWN', restoreState: lastCheckpoint?.restoreState ?? 'UNKNOWN' }, null, 2)}\n`,
  { flag: 'wx', mode: 0o600 })
}
if (decision.requiresFallback || !(await exists('current-state.json'))) {
  const ledger = await readJson('ledger.json')
  const state = terminalLedgerState(manifest, ledger, decision, new Date().toISOString(), terminal.receiptPath, true)
  await writeFile(path.join(runDirectory, 'ledger.json'), `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 })
  await writeFile(path.join(runDirectory, 'current-state.json'), `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
}
await writeFile(path.join(runDirectory, 'terminal-exit.json'), `${JSON.stringify(terminal, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
process.exitCode = decision.status === 'PASS' ? 0 : 1
console.log(JSON.stringify({ status: decision.status, code: decision.code, sessionId: terminal.sessionId,
  terminalExit: exitCode, receipt: path.join(runDirectory, terminal.receiptPath) }))
