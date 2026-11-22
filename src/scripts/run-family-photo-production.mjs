import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, open, readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

import { evaluateAuthorization, manifestHash, verifyManifestFiles } from './run-contract.mjs'
import { terminalDecision, terminalLedgerState } from './run-executor-terminal.mjs'

const target = 'iujasyrvypdcmkmorcud/postgres/public'
const entrypoint = 'src/scripts/run-family-photo-production.mjs'
const effect = 'travel-memory-family-photo-create'
const maxDeadlineMs = 3 * 60 * 60 * 1000
const outputCap = 64 * 1024
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export async function admitFamilyPhotoProduction({ root, directory, expectedManifest, expectedApproval }) {
  const read = name => readFile(path.join(directory, name))
  const manifest = JSON.parse(await read('manifest.json'))
  assert.equal(manifestHash(manifest), expectedManifest, 'BLOCK: manifest changed')
  assert.equal(manifest.environment, 'production')
  assert.equal(manifest.target, target)
  assert.equal(manifest.approval.action, 'production-media')
  assert.deepEqual(manifest.approval.allowed, ['production-media'])
  assert.deepEqual(manifest.scope.expectedEffects, [effect])
  assert(manifest.scope.include.includes('TA-MEM-REAL-001'))
  assert.deepEqual(manifest.runtime.bootstrap, { entrypoint, envNames: [] })
  for (const required of [entrypoint, 'src/scripts/run-family-photo-production-worker.mjs',
    'src/scripts/travel-memory-family-photo-production-adapter.mjs', 'src/scripts/travel-memory-family-photo-payload-io.mjs',
    'src/scripts/travel-memory-family-photo-r2-io.mjs', 'src/scripts/travel-memory-family-photo-intake.mjs']) {
    assert(manifest.artifacts.dependencies.some(({ path: file }) => file === required), 'BLOCK: runtime dependency unbound')
  }
  const relative = path.relative(await realpath(root), await realpath(directory))
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative))
  assert.equal(manifest.artifacts.executor.path, path.join(relative, 'worker.mjs'))
  const limitArtifact = path.join(relative, 'limits.json')
  assert(manifest.artifacts.dependencies.some(({ path: file }) => file === limitArtifact))
  await verifyManifestFiles(manifest, root)
  const bytes = await read('approval.json')
  // Both digests are supplied only after independently checking the Human source.
  assert.equal(sha256(bytes), expectedApproval, 'BLOCK: Human record checksum changed')
  const approval = JSON.parse(bytes)
  assert(evaluateAuthorization(manifest, approval).recordMatches, 'BLOCK: invalid or expired approval')
  const limitBytes = await read('limits.json')
  assert.equal(sha256(limitBytes), manifest.artifacts.dependencies.find(({ path: file }) => file === limitArtifact).sha256)
  const { deadlineMs } = JSON.parse(limitBytes)
  assert(Number.isSafeInteger(deadlineMs) && deadlineMs > 0 && deadlineMs <= maxDeadlineMs)
  const deadlineEpochMs = Date.parse(approval.validUntil)
  assert(deadlineEpochMs - Date.now() > deadlineMs + 3000, 'BLOCK: insufficient approval window')
  return { manifest, approval, deadlineMs, deadlineEpochMs }
}

async function syncJson(file, value, flag = 'wx') {
  const handle = await open(file, flag, 0o600)
  try {
    await handle.writeFile(JSON.stringify(value) + '\n')
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export async function superviseFamilyPhotoProduction({ root, directory, expectedManifest, expectedApproval }) {
  const admitted = await admitFamilyPhotoProduction({ root, directory, expectedManifest, expectedApproval })
  const ledgerPath = path.join(directory, 'ledger.json')
  const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
  assert.deepEqual(ledger, { version: 1, runId: admitted.manifest.runId, manifestSha256: expectedManifest, events: [] })
  const attempt = path.join(directory, 'attempt-01')
  await mkdir(attempt, { mode: 0o700 })
  const started = performance.now()
  await syncJson(path.join(attempt, 'started.json'), { manifestSha256: expectedManifest, supervisorPid: process.pid, at: new Date().toISOString() })
  // A second check closes the admission-to-spawn gap and rechecks the executable.
  await admitFamilyPhotoProduction({ root, directory, expectedManifest, expectedApproval })
  const remainingMs = Math.min(admitted.deadlineMs - (performance.now() - started), admitted.deadlineEpochMs - Date.now() - 3000)
  assert(remainingMs > 0, 'BLOCK: deadline before worker start')
  const child = spawn(process.execPath, ['--import', 'tsx', path.join(root, admitted.manifest.artifacts.executor.path),
    directory, expectedManifest, expectedApproval], { cwd: root, env: {}, stdio: ['ignore', 'pipe', 'pipe'] })
  const sessionId = `${admitted.manifest.runId}:${child.pid}`
  let outputBytes = 0
  let forced
  let killTimer
  const stop = reason => {
    if (forced) return
    forced = reason
    child.kill('SIGTERM')
    killTimer = setTimeout(() => child.kill('SIGKILL'), 3000)
  }
  const interrupt = () => stop('SUPERVISOR_INTERRUPTED')
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
    outputBytes += chunk.length
    if (outputBytes > outputCap) stop('OUTPUT_CAP')
  })
  const timer = setTimeout(() => stop('RUN_DEADLINE'), Math.max(1, remainingMs))
  let ended
  try {
    ended = await new Promise(resolve => {
      child.once('error', () => stop('WORKER_ERROR'))
      child.once('close', (exitCode, signal) => resolve({ exitCode, signal }))
    })
  } finally {
    clearTimeout(timer)
    clearTimeout(killTimer)
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
  }
  const receipt = await open(path.join(attempt, 'receipt.json'), 'r').then(async handle => {
    try {
      const { size } = await handle.stat()
      if (size > 16384) return null
      return JSON.parse(await handle.readFile('utf8'))
    } finally {
      await handle.close()
    }
  }).catch(() => null)
  const workerStart = await readFile(path.join(attempt, 'worker-started.json'), 'utf8').then(JSON.parse).catch(() => null)
  const valid = workerStart?.pid === child.pid && workerStart?.manifestSha256 === expectedManifest &&
    receipt?.sessionId === sessionId && receipt.manifestSha256 === expectedManifest &&
    ['PASS', 'BLOCK', 'UNKNOWN'].includes(receipt.status) && receipt.automaticRetry === false
  // Once spawned, an unverified terminal outcome cannot rule out an external write.
  const decision = terminalDecision({ ...ended, signal: ended.signal || forced, receipt: valid ? receipt : null,
    lastCheckpoint: { commitState: 'UNKNOWN' }, forcedDeadline: forced === 'RUN_DEADLINE' })
  const terminal = { ...decision, code: forced || decision.code, sessionId, manifestSha256: expectedManifest,
    outputBytes, automaticRetry: false }
  const receiptPath = 'attempt-01/supervisor-receipt.json'
  await syncJson(path.join(directory, receiptPath), terminal)
  const state = terminalLedgerState(admitted.manifest, ledger, decision, new Date().toISOString(), receiptPath, true)
  await syncJson(ledgerPath, ledger, 'w')
  await syncJson(path.join(directory, 'current-state.json'), state, 'w')
  return terminal
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [directory, expectedManifest, expectedApproval, ...rest] = process.argv.slice(2)
  try {
    assert(directory && expectedManifest && expectedApproval && !rest.length)
    const { status, code } = await superviseFamilyPhotoProduction({
      root: process.cwd(), directory: path.resolve(directory), expectedManifest, expectedApproval,
    })
    console.log(JSON.stringify({ status, code }))
    process.exitCode = status === 'PASS' ? 0 : 1
  } catch {
    const consumed = directory && await realpath(path.join(directory, 'attempt-01')).then(() => true, () => false)
    console.log(JSON.stringify(consumed ? { status: 'UNKNOWN', code: 'INCOMPLETE_SUPERVISOR_RECEIPT' } :
      { status: 'BLOCK', code: 'PRODUCTION_ADMISSION_FAILED' }))
    process.exitCode = 1
  }
}
