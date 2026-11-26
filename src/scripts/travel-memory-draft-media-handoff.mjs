import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalSha = value => sha256(JSON.stringify(value))
const cap = 16 * 1024 * 1024
const hex = /^[a-f0-9]{64}$/

export function buildDraftMediaHandoff({ manifestSha256, runId, supervisor, worker, workerStarted, review,
  registry, prepared, before, after, receipts, verifyPreservation, mergeReceipt }) {
  assert.match(manifestSha256, hex)
  const { plan, limits } = review
  assert.equal(review.status, 'READY_FOR_REVIEW')
  assert.equal(plan.environment, 'production')
  assert.equal(plan.mode, 'family-photo-create')
  assert.equal(plan.ownerBasis, 'ZERO_OWNER_AND_VERSION')
  const operations = plan.entries.length
  assert(operations > 0 && operations === limits.mediaCreates && operations === prepared.entries.length)
  assert.equal(receipts.length, operations)
  assert.equal(canonicalSha(registry), plan.evidence.registrySha256)
  assert(Number.isSafeInteger(workerStarted.pid) && workerStarted.pid > 0)
  const sessionId = `${runId}:${workerStarted.pid}`
  assert.equal(workerStarted.manifestSha256, manifestSha256)
  for (const terminal of [supervisor, worker]) {
    assert.equal(terminal.status, 'PASS')
    assert.equal(terminal.code, 'FAMILY_PHOTO_PRODUCTION_VERIFIED')
    assert.equal(terminal.automaticRetry, false)
    assert.equal(terminal.manifestSha256, manifestSha256)
    assert.equal(terminal.sessionId, sessionId)
  }
  assert.equal(worker.phase, 'preservation')
  assert.equal(worker.verified, operations)
  assert.equal(worker.terminalExit, 0)
  assert.equal(supervisor.requiresFallback, false)

  let objectCount = 0
  let uploadBytes = 0
  for (const [index, entry] of plan.entries.entries()) {
    const receipt = receipts[index]
    assert.equal(receipt.stage, 'VERIFIED')
    assert.equal(receipt.assetId, entry.assetId)
    assert.deepEqual(receipt.objects, entry.objects)
    assert.equal(receipt.locator.environment, plan.environment)
    assert.equal(receipt.locator.sourcePath, entry.sourcePath)
    objectCount += receipt.objects.length
    uploadBytes += receipt.objects.reduce((size, object) => size + object.bytes, 0)
  }
  assert.equal(objectCount, limits.storagePuts)
  assert.equal(uploadBytes, limits.uploadBytes)
  const [projectRef, database, schema] = plan.target.split('/')
  const scope = { environment: plan.environment, slug: plan.slug, locale: plan.locale, bucket: plan.bucket,
    accountId: plan.accountId, target: { projectRef, database, schema } }
  const preservation = verifyPreservation({ prepared, registry, scope, before: before.media, after: after.media, receipts })
  assert(preservation.status === 'PASS' && preservation.verified === operations)
  assert.equal(after.media.protectedState.originId, plan.evidence.originPlanId)
  assert.deepEqual(preservation, after.preservation)
  const merged = receipts.reduce(mergeReceipt, registry)
  return { registry: merged, counts: { photos: operations, objects: objectCount, uploadBytes }, preservation }
}

async function main([directory, expectedManifest, ...rest]) {
  assert(directory && !rest.length && hex.test(expectedManifest))
  const root = await realpath(process.cwd())
  const git = (...args) => execFileSync('/usr/bin/git', args, { encoding: 'utf8', timeout: 5000 }).trim()
  const packet = await realpath(directory)
  assert(packet.startsWith(root + path.sep))
  const packetPath = path.relative(root, packet).split(path.sep).join('/')
  assert.equal(git('status', '--porcelain', '--untracked-files=all', '--', '.', `:(exclude)${packetPath}/**`), '')
  const load = file => import(pathToFileURL(path.join(root, 'src/scripts', file)).href)
  const { manifestHash, verifyManifestFiles } = await load('run-contract.mjs')
  const { familyPhotoPreservationReadback: verifyPreservation } = await load('travel-memory-family-photo-preservation.mjs')
  const { mergeVerifiedMediaReceipt: mergeReceipt } = await load('travel-memory-media-transfer.mjs')
  const bounded = async file => {
    const canonical = await realpath(file)
    assert(canonical.startsWith(root + path.sep))
    const attributes = await stat(canonical)
    assert(attributes.isFile() && attributes.size > 0 && attributes.size <= cap)
    const bytes = await readFile(canonical)
    assert(bytes.length <= cap)
    return bytes
  }
  const manifest = JSON.parse(await bounded(path.join(packet, 'manifest.json')))
  assert.equal(manifestHash(manifest), expectedManifest)
  assert.equal(manifest.approval.action, 'production-media')
  await verifyManifestFiles(manifest, root)
  assert.deepEqual(manifest.scope.expectedEffects, ['travel-memory-family-photo-create'])
  const artifact = async file => {
    const binding = manifest.artifacts.dependencies.find(artifact => artifact.path === file)
    assert(binding)
    const bytes = await bounded(path.join(root, file))
    assert.equal(sha256(bytes), binding.sha256)
    return JSON.parse(bytes)
  }
  const { review, registry, prepared } = await artifact(path.join(path.relative(root, packet), 'case.json'))
  const [reviewInput, registryInput, preparedInput] = await Promise.all([review, registry, prepared].map(artifact))
  assert.equal(reviewInput.plan.target, manifest.target)
  const read = file => bounded(path.join(packet, 'attempt-01', file))
  const [supervisor, worker, workerStarted, before, after] = await Promise.all(
    ['supervisor-receipt.json', 'receipt.json', 'worker-started.json', 'before.json', 'after.json']
      .map(async file => JSON.parse(await read(file))),
  )
  const receiptBytes = await read('assets.jsonl')
  const receipts = receiptBytes.toString('utf8').trimEnd().split('\n').map(line => JSON.parse(line))
  const result = buildDraftMediaHandoff({ manifestSha256: expectedManifest, runId: manifest.runId,
    supervisor, worker, workerStarted, review: reviewInput, registry: registryInput, prepared: preparedInput,
    before, after, receipts, verifyPreservation, mergeReceipt })
  const bytes = JSON.stringify(result.registry, null, 2) + '\n'
  await writeFile(path.join(packet, 'verified-registry.json'), bytes, { flag: 'wx', mode: 0o600, flush: true })
  return { status: 'PASS', counts: result.counts, registrySha256: sha256(bytes), uploadManifestSha256: expectedManifest,
    scope: 'local-draft-media-handoff', contentWriteAuthorized: false }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    console.log(JSON.stringify(await main(process.argv.slice(2))))
  } catch {
    console.log(JSON.stringify({ status: 'BLOCK', code: 'DRAFT_MEDIA_HANDOFF_UNVERIFIED' }))
    process.exitCode = 1
  }
}
