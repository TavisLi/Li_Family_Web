import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileEvidenceSink } from './run-executor-evidence.mjs'
import { manifestHash, verifyManifestFiles } from './run-contract.mjs'
import { familyPhotoIntakeAdapter, runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'

const [directory] = process.argv.slice(2)
assert(directory && process.argv.length === 3, 'BLOCK: fixture run directory')
const root = process.cwd()
const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'))
const sessionId = `${manifest.runId}:${process.pid}`
const signal = new AbortController()
for (const name of ['SIGINT', 'SIGTERM']) process.once(name, () => signal.abort())
let sink
try {
  assert.equal(manifest.environment, 'disposable')
  assert.equal(manifest.target, 'local-family-fixture')
  assert.equal(manifest.approval.action, 'local')
  assert.deepEqual(manifest.scope.expectedEffects, ['local-family-private-intake'])
  await verifyManifestFiles(manifest, root)
  const fixturePaths = manifest.artifacts.dependencies.filter(item => item.path.endsWith('/family-private-fixture.json'))
  assert.equal(fixturePaths.length, 1, 'BLOCK: one bound fixture required')
  const fixture = JSON.parse(await readFile(path.join(root, fixturePaths[0].path), 'utf8'))
  const original = Buffer.from(fixture.originalBase64, 'base64')
  assert(original.length > 0 && original.length <= 32768, 'BLOCK: synthetic fixture size')
  const sha = createHash('sha256').update(original).digest('hex')
  const objects = fixture.plan.entries[0].objects
  assert.equal(fixture.plan.entries.length, 1)
  assert.equal(fixture.plan.entries[0].assetId, `sha256:${sha}`)
  assert.deepEqual(objects.map(item => item.key), ['original', 'thumbnail', 'medium', 'large']
    .map(variant => `family-media/${sha}/${variant}.jpeg`))
  const stored = new Map()
  const keySet = new Set(objects.map(item => item.key))
  const attempted = new Set()
  const config = { maxAttempts: async () => 1 }
  const writeStorage = { config, async send(command, { abortSignal }) {
    abortSignal.throwIfAborted()
    const x = command.input
    assert.equal(command.constructor.name, 'PutObjectCommand')
    assert.equal(x.Bucket, fixture.plan.bucket)
    assert(keySet.has(x.Key) && !attempted.has(x.Key))
    assert.equal(x.IfNoneMatch, '*')
    attempted.add(x.Key)
    stored.set(x.Key, { body: Buffer.from(x.Body), length: x.ContentLength, mime: x.ContentType })
  } }
  const readStorage = { config, async send(command, { abortSignal }) {
    abortSignal.throwIfAborted()
    assert.equal(command.constructor.name, 'GetObjectCommand')
    assert.equal(command.input.Bucket, fixture.plan.bucket)
    assert(keySet.has(command.input.Key))
    const x = stored.get(command.input.Key)
    assert(x, 'BLOCK: fixture object missing')
    return { ContentLength: x.length, ContentType: x.mime, Body: { transformToWebStream: () => new Blob([x.body]).stream() } }
  } }
  let document
  let creates = 0
  const payload = { async find() { return { docs: [], hasNextPage: false } }, async create({ data }) {
    assert.equal(++creates, 1)
    assert.equal(data.familyAssetKey, sha)
    document = { ...data, id: 1 }
    return document
  } }
  const readPayload = { async findByID({ id }) { assert.equal(id, 1); return structuredClone(document) } }
  const guard = () => signal.signal.throwIfAborted()
  const adapter = await familyPhotoIntakeAdapter({ bucket: fixture.plan.bucket, writeStorage, readStorage,
    payload, readPayload, guard, signal: signal.signal })
  sink = fileEvidenceSink(directory, manifest, signal.signal)
  await sink.start()
  const checkpoint = async event => sink.checkpoint({ at: new Date().toISOString(), runId: manifest.runId, sessionId,
    stage: event.stage, status: 'PASS', commitState: 'NOT_REQUESTED', restoreState: 'NOT_REQUESTED', automaticRetry: false })
  let saved
  await runFamilyPhotoIntake({ plan: fixture.plan, registry: fixture.registry, loadOriginal: async () => original,
    adapter, checkpoint, saveReceipt: async receipt => { saved = receipt }, guard })
  assert.equal(saved?.stage, 'VERIFIED')
  assert.equal(stored.size, 4)
  const receipt = { runId: manifest.runId, manifestSha256: manifestHash(manifest), sessionId, mode: 'disposable',
    status: 'PASS', code: 'FAMILY_FIXTURE_VERIFIED', stage: 'verified', terminalExit: 0,
    commitState: 'NOT_REQUESTED', restoreState: 'NOT_REQUESTED', automaticRetry: false,
    productionConnections: 0, fixtureObjects: 4, fixtureMedia: 1 }
  await sink.receipt(receipt)
  console.log(JSON.stringify({ status: receipt.status, code: receipt.code }))
} catch {
  const receipt = { runId: manifest.runId, sessionId, status: 'BLOCK', code: 'FAMILY_FIXTURE_STOP', stage: 'bootstrap',
    terminalExit: 1, commitState: 'NOT_REQUESTED', restoreState: 'NOT_REQUESTED', automaticRetry: false }
  if (sink) await sink.receipt(receipt).catch(() => {})
  else await writeFile(path.join(directory, 'bootstrap-receipt.json'), `${JSON.stringify(receipt)}\n`, { flag: 'wx', mode: 0o600 }).catch(() => {})
  process.exitCode = 1
}
