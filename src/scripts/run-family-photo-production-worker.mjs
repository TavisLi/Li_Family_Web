import assert from 'node:assert/strict'
import { open, readFile } from 'node:fs/promises'
import path from 'node:path'

import { admitFamilyPhotoProduction } from './run-family-photo-production.mjs'
import { runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'
import { familyPhotoProductionAdapter } from './travel-memory-family-photo-production-adapter.mjs'
import { familyPhotoWriterLimits } from './travel-memory-family-photo-writer.mjs'

const caseSlug = '202607-chongqing-yangtze-river-memory'

async function record(directory, name, contents, flag) {
  const handle = await open(path.join(directory, name), flag, 0o600)
  try {
    await handle.writeFile(JSON.stringify(contents) + '\n')
    await handle.sync()
  } finally {
    await handle.close()
  }
}

// The case packet entry binds the verified credential sources, independent
// observations, backing files and preservation checks in its approved SHA.
export async function runFamilyPhotoProductionWorker({ root, directory, expectedManifest, expectedApproval, bind }) {
  const admitted = await admitFamilyPhotoProduction({ root, directory, expectedManifest, expectedApproval })
  const { manifest, approval, deadlineMs, deadlineEpochMs } = admitted
  const attempt = path.join(directory, 'attempt-01')
  const started = JSON.parse(await readFile(path.join(attempt, 'started.json'), 'utf8'))
  assert.equal(started.manifestSha256, expectedManifest)
  assert.equal(started.supervisorPid, process.ppid, 'BLOCK: detached worker')
  await record(attempt, 'worker-started.json', { pid: process.pid, manifestSha256: expectedManifest }, 'wx')
  const startMs = Date.parse(started.at)
  assert(Number.isFinite(startMs) && startMs <= Date.now())
  const endMs = Math.min(startMs + deadlineMs, deadlineEpochMs)
  const controller = new AbortController()
  const stop = () => controller.abort()
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  const timer = setTimeout(stop, Math.max(1, endMs - Date.now()))
  const guard = () => {
    controller.signal.throwIfAborted()
    assert(Date.now() < endMs, 'BLOCK: Writer deadline')
  }
  let phase = 'bootstrap'
  let mutationIntent = false
  let verified = 0
  let clients, context
  const verifiedReceipts = []
  const summary = (status, code) => ({
    status, code, phase, sessionId: `${manifest.runId}:${process.pid}`,
    manifestSha256: expectedManifest, terminalExit: status === 'PASS' ? 0 : 1,
    automaticRetry: false, verified,
  })
  let receipt
  try {
    guard()
    context = await bind({ manifest, signal: controller.signal, guard, endMs })
    const { planPath, registry, loadOriginal, observeCurrent, verifyPreservation } = context
    assert(manifest.artifacts.dependencies.some(({ path: file }) => file === planPath))
    const review = JSON.parse(await readFile(path.join(root, planPath), 'utf8'))
    assert.equal(review.plan.slug, caseSlug)
    phase = 'authenticated-adapter'
    clients = await familyPhotoProductionAdapter({ review, writer: context.writer, reader: context.reader,
      readerCredentials: context.readerCredentials, issueWriter: context.issueWriter, guard, signal: controller.signal, endMs })
    phase = 'intake'
    await runFamilyPhotoIntake({ environment: 'production', registry, loadOriginal, adapter: clients.adapter,
      authority: { manifest, approval, root, humanSourceVerified: true, planPath, observeCurrent },
      checkpoint: async event => {
        guard()
        if (event.stage.endsWith('_INTENT')) mutationIntent = true
        await record(attempt, 'checkpoints.jsonl', { ...event, at: new Date().toISOString() }, 'a')
      },
      saveReceipt: async result => {
        await record(attempt, 'assets.jsonl', result, 'a')
        verifiedReceipts.push(result)
        verified++
      },
      guard,
    })
    phase = 'preservation'
    guard()
    assert.equal(verified, familyPhotoWriterLimits.assets)
    assert.equal(await verifyPreservation(verifiedReceipts), true, 'BLOCK: data preservation unverified')
    guard()
    receipt = summary('PASS', 'FAMILY_PHOTO_PRODUCTION_VERIFIED')
  } catch {
    receipt = summary(mutationIntent ? 'UNKNOWN' : 'BLOCK',
      mutationIntent ? 'FAMILY_PHOTO_STOP_AFTER_INTENT' : 'FAMILY_PHOTO_STOP_BEFORE_INTENT')
  } finally {
    clients?.close()
    context?.close?.()
    clearTimeout(timer)
    process.off('SIGTERM', stop)
    process.off('SIGINT', stop)
  }
  await record(attempt, 'receipt.json', receipt, 'wx')
  return receipt.terminalExit
}
