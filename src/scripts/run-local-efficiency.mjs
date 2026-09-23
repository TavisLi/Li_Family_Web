import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import path from 'node:path'

import { manifestHash } from './run-contract.mjs'
import { localApprovalGate } from './run-local-approval.mjs'

const [runsDirectory, destination] = process.argv.slice(2)
assert(runsDirectory && destination && process.argv.length === 4,
  'Usage: node src/scripts/run-local-efficiency.mjs <runs-directory> <new-report-path>')
const root = process.cwd()
const matrix = JSON.parse(await readFile(path.join(runsDirectory, 'matrix.json'), 'utf8'))
const measured = []
for (const item of matrix.results) {
  const directory = path.join(runsDirectory, item.fault)
  const capture = (script) => {
    const started = performance.now()
    const result = spawnSync(process.execPath, [script, directory, root],
      { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 })
    assert.equal(result.status, 0, `${item.fault}: ${result.stderr}`)
    return { bytes: Buffer.byteLength(result.stdout), elapsedMs: Number((performance.now() - started).toFixed(3)),
      value: JSON.parse(result.stdout) }
  }
  const verbose = capture('src/scripts/run-local-verbose.mjs')
  const compact = capture('src/scripts/run-agent-summary.mjs')
  assert.equal(verbose.value.terminal.status, compact.value.status)
  assert.equal(verbose.value.terminal.code, compact.value.code)
  assert.equal(compact.value.status, item.status)
  assert.equal(compact.value.code, item.code)
  assert(item.status === 'PASS' || ['BLOCK', 'UNKNOWN'].includes(item.status))
  measured.push({ fault: item.fault, status: item.status, code: item.code,
    verboseStdoutBytes: verbose.bytes, compactStdoutBytes: compact.bytes,
    verboseCliElapsedMs: verbose.elapsedMs, compactCliElapsedMs: compact.elapsedMs,
    runElapsedMs: item.elapsedMs, verboseToolCalls: 1, compactToolCalls: 1,
    verboseEmptyPolls: 0, compactEmptyPolls: 0 })
}
const manifest = JSON.parse(await readFile(path.join(runsDirectory, 'normal', 'manifest.json'), 'utf8'))
const approval = { source: 'test-only-local-approval-fixture', manifestSha256: manifestHash(manifest),
  action: manifest.approval.action, environment: manifest.environment, target: manifest.target,
  scope: manifest.scope.include, baseline: manifest.scope.baseline,
  stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom,
  validUntil: manifest.approval.validUntil, revoked: false }
let sourceReadbacks = 0
const verifySource = async ({ source }) => {
  sourceReadbacks += 1
  return source === 'test-only-local-approval-fixture'
}
const input = { manifest, root, approval, verifySource, operation: 'read',
  failureCode: 'CLIENT_RESPONSE_TIMEOUT', stateStatus: 'BLOCK', priorRetries: 0 }
const first = await localApprovalGate(input)
const reused = await localApprovalGate(input)
assert(first.reuseApproval && reused.reuseApproval && first.retryAllowed && reused.retryAllowed)
assert.equal((await localApprovalGate({ ...input, priorRetries: 1 })).retryAllowed, false)
const sum = (key) => measured.reduce((total, item) => total + item[key], 0)
const verboseBytes = sum('verboseStdoutBytes')
const compactBytes = sum('compactStdoutBytes')
const report = { version: 1, method: 'actual CLI stdout captured from the same recorded disposable runs',
  baseline: 'local verbose full-artifact formatter, not a historical #101 execution',
  tokenTelemetry: null, tokenMetric: 'stdout bytes are a proxy; no token count claimed',
  scenarios: measured, approvalReplay: { source: 'test-only local fixture, not a Human approval',
    fixtureApprovalRecords: 1, actualHumanApprovalRounds: 0, repeatedApprovalRequests: 0, sourceReadbacks,
    maxReadRetries: first.maxRetries, mutationAutoRetries: 0 },
  totals: { verboseStdoutBytes: verboseBytes, compactStdoutBytes: compactBytes,
    reductionPercent: Number(((verboseBytes - compactBytes) / verboseBytes * 100).toFixed(2)),
    verboseToolCalls: sum('verboseToolCalls'), compactToolCalls: sum('compactToolCalls'),
    verboseEmptyPolls: 0, compactEmptyPolls: 0,
    verboseCliElapsedMs: Number(sum('verboseCliElapsedMs').toFixed(3)),
    compactCliElapsedMs: Number(sum('compactCliElapsedMs').toFixed(3)) } }
assert(report.totals.reductionPercent >= 50, 'BLOCK: actual CLI stdout reduction below 50%')
await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })
console.log(JSON.stringify({ status: 'PASS', scenarios: measured.length,
  reductionPercent: report.totals.reductionPercent, destination }))
