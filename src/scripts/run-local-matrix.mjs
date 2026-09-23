import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const [directory] = process.argv.slice(2)
assert(directory && process.argv.length === 3, 'Usage: node src/scripts/run-local-matrix.mjs <new-output-directory>')
assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
const url = new URL(process.env.DATABASE_URI ?? '')
assert.equal(url.hostname, '127.0.0.1')
assert.equal(url.port, '55444')
assert.equal(url.pathname, '/issue105')
const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Client } = require('pg')
const node = process.execPath
const run = (script, args) => spawnSync(node, [script, ...args], {
  cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 100000, maxBuffer: 1024 * 1024,
})
const backupBytes = await readFile('docs/phase-artifacts/issue-105/slice-2-example/backup.json')
const cases = [
  ['normal', 'PASS', null], ['warning', 'UNKNOWN', 'DATABASE_WARNING'],
  ['silent-exit', 'BLOCK', 'MISSING_TERMINAL_RECEIPT'], ['delay', 'PASS', null],
  ['oversized-response', 'BLOCK', 'RESPONSE_BYTE_CAP'], ['query-cancelled', 'BLOCK', 'QUERY_CANCELLED'],
  ['connection-drop', 'UNKNOWN', 'CONNECTION_DROP'], ['rollback-failure', 'UNKNOWN', 'QUERY_FAILURE'],
  ['commit-ack-loss', 'UNKNOWN', 'CONNECTION_DROP'], ['signal', 'UNKNOWN', 'SIGNAL'],
  ['deadline', 'UNKNOWN', 'RUN_DEADLINE'], ['long-wait', 'PASS', null],
]
const resetFixture = async () => {
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 })
  await client.connect()
  try {
    await client.query('DROP SCHEMA public CASCADE')
    await client.query('CREATE SCHEMA public')
    await client.query('DROP ROLE IF EXISTS retirement_reader')
  } finally { await client.end() }
  const scratch = await mkdtemp(path.join(tmpdir(), 'issue105-local-backup-'))
  const fixture = run('src/scripts/run-executor-fixture.mjs', [scratch])
  assert.equal(fixture.status, 0, fixture.stderr)
  assert.deepEqual(await readFile(path.join(scratch, 'backup.json')), backupBytes,
    'BLOCK: disposable fixture changed from bound backup bytes')
}
await mkdir(directory, { recursive: false })
const results = []
for (const [fault, expectedStatus, expectedCode] of cases) {
  await resetFixture()
  const runDirectory = path.join(directory, fault)
  const runId = `issue-105-local-${fault}`
  const manifest = run('src/scripts/run-local-manifest.mjs', [runDirectory, runId, fault])
  assert.equal(manifest.status, 0, manifest.stderr)
  const started = Date.now()
  const session = run('src/scripts/run-local-session.mjs', [runDirectory])
  const elapsedMs = Date.now() - started
  const terminal = JSON.parse(await readFile(path.join(runDirectory, 'terminal-exit.json'), 'utf8'))
  const receipt = JSON.parse(await readFile(path.join(runDirectory, terminal.receiptPath), 'utf8'))
  const state = JSON.parse(await readFile(path.join(runDirectory, 'current-state.json'), 'utf8'))
  assert.equal(session.status, expectedStatus === 'PASS' ? 0 : 1, `${fault}: ${session.stderr}`)
  assert.equal(terminal.status, expectedStatus, `${fault}: ${session.stdout}`)
  assert.equal(terminal.code, expectedCode, `${fault}: ${session.stdout}`)
  assert.equal(state.status, expectedStatus, `${fault}: state mismatch`)
  assert.equal(receipt.automaticRetry, false)
  results.push({ fault, status: terminal.status, code: terminal.code, sessionId: terminal.sessionId,
    actualExitCode: terminal.actualExitCode, commitState: receipt.commitState,
    restoreState: receipt.restoreState, elapsedMs, receiptPath: `${fault}/${terminal.receiptPath}`,
    terminalPath: `${fault}/terminal-exit.json`, currentStatePath: `${fault}/current-state.json` })
  console.log(JSON.stringify({ fault, status: terminal.status, code: terminal.code, elapsedMs }))
}
await writeFile(path.join(directory, 'matrix.json'), `${JSON.stringify({ version: 1,
  source: 'one exact disposable PostgreSQL fixture reset before each case', results }, null, 2)}\n`,
{ flag: 'wx', mode: 0o600 })
