import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { fileEvidenceSink } from './run-executor-evidence.mjs'
import { executeRun } from './run-executor.mjs'
import { retirementPlan } from './run-executor-retirement-plan.mjs'

const [runDirectory] = process.argv.slice(2)
if (!runDirectory || process.argv.length !== 3) throw new Error('Usage: node src/scripts/run-executor-rehearsal.mjs <run-directory>')
const root = process.cwd()
const started = Date.now()
const abort = new AbortController()
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => abort.abort())
let sink
let manifest
try {
  manifest = JSON.parse(await readFile(path.join(runDirectory, 'manifest.json'), 'utf8'))
  const limitsPath = 'docs/phase-artifacts/issue-105/slice-2-example/limits.json'
  assert(manifest.artifacts.dependencies.some((file) => file.path === limitsPath), 'BLOCK: limit checksum missing')
  const limits = JSON.parse(await readFile(path.join(root, limitsPath), 'utf8'))
  assert.equal(process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH, 'false', 'BLOCK: schema push')
  const url = new URL(process.env.DATABASE_URI ?? '')
  assert(['postgres:', 'postgresql:'].includes(url.protocol) && url.hostname === '127.0.0.1' &&
    url.port === '55444' && url.pathname === '/issue105' && url.username && url.password,
  'BLOCK: disposable loopback database target')
  assert.equal(manifest.target, '127.0.0.1:55444/issue105', 'BLOCK: manifest target')
  assert.equal(manifest.environment, 'disposable', 'BLOCK: disposable manifest')
  assert.equal(manifest.runtime.bootstrap.entrypoint, 'src/scripts/run-executor-session.mjs', 'BLOCK: bootstrap entrypoint')
  assert(manifest.artifacts.sql.some((file) => file.path === retirementPlan.artifactPath), 'BLOCK: SQL plan checksum missing')
  assert(manifest.artifacts.dependencies.some((file) => file.path === 'src/scripts/run-executor-evidence.mjs'), 'BLOCK: evidence sink checksum missing')
  sink = fileEvidenceSink(runDirectory, manifest, abort.signal)
  await sink.start()
  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { Client } = require('pg')
  const clientFactory = () => new Client({ connectionString: url.toString(), connectionTimeoutMillis: limits.clientTimeoutMs,
    query_timeout: limits.clientTimeoutMs, application_name: 'issue105-disposable-rehearsal' })
  const result = await executeRun({ manifest, root, plan: retirementPlan, clientFactory, sink, limits,
    sessionId: `${manifest.runId}:${process.pid}` })
  process.exitCode = result.terminalExit
  console.log(JSON.stringify({ status: result.status, code: result.code, stage: result.stage,
    sessionId: result.sessionId, receipt: path.join(runDirectory, 'receipt.json') }))
} catch (error) {
  const code = error?.code ?? 'BOOTSTRAP_FAILURE'
  const result = { runId: manifest?.runId ?? null, sessionId: `${manifest?.runId ?? 'unidentified'}:${process.pid}`,
    status: 'BLOCK', code, stage: 'bootstrap', queryLabel: null, batch: 0, elapsedMs: Date.now() - started,
    deadlineAt: null, queries: 0, roundTrips: 0, responseBytes: 0,
    commitState: 'NOT_STARTED', restoreState: 'NOT_STARTED', terminalExit: 1, automaticRetry: false }
  await writeFile(path.join(runDirectory, 'bootstrap-receipt.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 }).catch(() => {})
  process.exitCode = 1
  console.error(JSON.stringify({ status: 'BLOCK', code, receipt: path.join(runDirectory, 'bootstrap-receipt.json') }))
}
