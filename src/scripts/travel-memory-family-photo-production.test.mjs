import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import test from 'node:test'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { manifestHash } from './run-contract.mjs'
import { superviseFamilyPhotoProduction } from './run-family-photo-production.mjs'
import { familyPhotoPayloadClient } from './travel-memory-family-photo-payload-io.mjs'
import { boundFamilyPhotoR2 } from './travel-memory-family-photo-r2-io.mjs'

const sha = b => createHash('sha256').update(b).digest('hex')
const accountId = 'a'.repeat(32)
const bucket = 'fixture-photos'
const key = 'family-media/' + 'a'.repeat(64) + '/original.jpeg'
const bytes = Buffer.from('synthetic bytes')
const objects = [{ key, bytes: bytes.length, mimeType: 'image/jpeg' }]
const signal = new AbortController().signal
const guard = () => signal.throwIfAborted()

test('real AWS SDK dispatch is bounded to one conditional PUT, and replay never reaches the provider', async () => {
  let requests = 0
  const storage = new S3Client({ endpoint: 'https://' + accountId + '.r2.cloudflarestorage.com', region: 'auto',
    credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic', sessionToken: 'synthetic' },
    forcePathStyle: true, maxAttempts: 1, requestChecksumCalculation: 'WHEN_REQUIRED',
    requestHandler: { async handle(request) {
      requests++
      assert.equal(request.method, 'PUT')
      assert.equal(request.headers['if-none-match'], '*')
      return { response: { statusCode: 200, headers: {}, body: Readable.from([]) } }
    } },
  })
  const io = await boundFamilyPhotoR2({ storage, accountId, bucket, objects, phase: 'write', guard })
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentLength: bytes.length,
    ContentType: 'image/jpeg', IfNoneMatch: '*' })
  await io.send(command)
  await assert.rejects(io.send(command), /repeated/)
  await assert.rejects(io.send(new GetObjectCommand({ Bucket: bucket, Key: key + '.other' })), /outside scope/)
  assert.deepEqual(io.counters(), { requests: 1, sentBytes: bytes.length, responseBytes: 0 })
  assert.equal(requests, 1)
})

test('R2 readback charges excess bytes and fails before returning them to the verifier', async () => {
  const storage = new S3Client({ endpoint: 'https://' + accountId + '.r2.cloudflarestorage.com', region: 'auto',
    credentials: { accessKeyId: 'synthetic', secretAccessKey: 'synthetic' }, forcePathStyle: true, maxAttempts: 1,
    responseChecksumValidation: 'WHEN_REQUIRED',
    requestHandler: { async handle() {
      return { response: { statusCode: 200, headers: {}, body: Readable.from([Buffer.alloc(bytes.length + 1)]) } }
    } },
  })
  const io = await boundFamilyPhotoR2({ storage, accountId, bucket, objects, phase: 'readback', guard })
  const response = await io.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  await assert.rejects(response.Body.transformToByteArray(), /R2 response cap/)
  assert.equal(io.counters().responseBytes, bytes.length + 1)
})

test('authenticated Payload roles stay distinct, reject override and cap raw response bodies', async () => {
  const requests = []
  const config = { session: 'synthetic.session.value', expectedId: 7, signal, guard }
  const admin = await familyPhotoPayloadClient({ ...config, role: 'admin', fetcher: async (url, options) => {
    assert.equal(options.redirect, 'error')
    requests.push(options.method)
    if (url.includes('/api/users/me?')) return Response.json({ user: { id: 7, collection: 'users', role: 'admin' } })
    return Response.json({ doc: { id: 4 } })
  } })
  const input = { collection: 'media', user: admin.actor, depth: 0, locale: 'zh-TW',
    data: { altText: 'Fixture', familyAssetKey: 'a'.repeat(64), filesize: 1, mimeType: 'image/jpeg', type: 'photo' } }
  await assert.rejects(admin.create({ ...input, overrideAccess: true }), /access or scope/)
  assert.equal((await admin.create({ ...input, overrideAccess: false })).id, 4)
  assert.deepEqual(requests, ['GET', 'POST'])
  await assert.rejects(familyPhotoPayloadClient({ ...config, role: 'family', fetcher: async () =>
    Response.json({ user: { id: 7, collection: 'users', role: 'admin' } }) }), /identity drift/)
  await assert.rejects(familyPhotoPayloadClient({ ...config, role: 'family', fetcher: async () =>
    Response.json('x'.repeat(256 * 1024)) }), /response cap/)
})

async function packet(t, worker, deadlineMs = 3000) {
  const root = await mkdtemp(path.join(tmpdir(), 'ta-mem-supervisor-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await symlink(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir')
  const directory = path.join(root, 'packet')
  await mkdir(directory)
  await mkdir(path.join(root, 'src/scripts'), { recursive: true })
  const file = async (relative, content) => {
    await writeFile(path.join(root, relative), content)
    return { path: relative, sha256: sha(content) }
  }
  const bootstrap = 'src/scripts/run-family-photo-production.mjs'
  const runtimeFiles = await Promise.all([bootstrap, 'run-family-photo-production-worker.mjs',
    'travel-memory-family-photo-production-adapter.mjs', 'travel-memory-family-photo-payload-io.mjs',
    'travel-memory-family-photo-r2-io.mjs', 'travel-memory-family-photo-intake.mjs']
    .map(name => file(name.includes('/') ? name : 'src/scripts/' + name, 'fixture')))
  const manifest = {
    version: 1, runId: 'synthetic-supervisor', environment: 'production', target: 'iujasyrvypdcmkmorcud/postgres/public',
    runtime: { node: process.versions.node, pnpm: 'fixture', bootstrap: { entrypoint: bootstrap, envNames: [] }, schemaPush: 'disabled' },
    scope: { include: ['TA-MEM-REAL-001'], exclude: ['cleanup'], baseline: 'fixture',
      expectedEffects: ['travel-memory-family-photo-create'], stopConditions: ['unknown'] },
    artifacts: { executor: await file('packet/worker.mjs', worker), sql: [await file('metadata.sql', 'SELECT 1')],
      backup: await file('backup.json', '{}'), dependencies: [...runtimeFiles,
        await file('package.json', '{"packageManager":"pnpm@fixture"}'), await file('pnpm-lock.yaml', ''),
        await file('packet/limits.json', JSON.stringify({ deadlineMs }))] },
    approval: { action: 'production-media', allowed: ['production-media'], excluded: ['release'],
      validFrom: new Date(Date.now() - 1000).toISOString(), validUntil: new Date(Date.now() + 60000).toISOString() },
  }
  const expectedManifest = manifestHash(manifest)
  const approval = { source: 'synthetic fixture authority', manifestSha256: expectedManifest, action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline,
    stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom,
    validUntil: manifest.approval.validUntil, revoked: false }
  await file('packet/manifest.json', JSON.stringify(manifest))
  await file('packet/ledger.json', JSON.stringify({ version: 1, runId: manifest.runId, manifestSha256: expectedManifest, events: [] }))
  const { sha256: expectedApproval } = await file('packet/approval.json', JSON.stringify(approval))
  return { root, directory, expectedManifest, expectedApproval }
}

test('Supervisor admits only exact approval, records a terminal result and refuses reuse', async t => {
  const input = await packet(t, `
import {writeFile} from 'node:fs/promises'
const [dir, manifestSha256] = process.argv.slice(2)
await writeFile(dir + '/attempt-01/worker-started.json', JSON.stringify({pid:process.pid, manifestSha256}))
await writeFile(dir + '/attempt-01/receipt.json', JSON.stringify({sessionId:'synthetic-supervisor:' + process.pid,
 manifestSha256, status:'PASS', code:'FIXTURE', terminalExit:0, automaticRetry:false }))
`)
  await assert.rejects(superviseFamilyPhotoProduction({ ...input, expectedApproval: '0'.repeat(64) }), /checksum changed/)
  assert.equal((await superviseFamilyPhotoProduction(input)).status, 'PASS')
  await assert.rejects(superviseFamilyPhotoProduction(input))
})

test('Supervisor stops on deadline or output cap and reports uncertainty when the receipt is missing', async t => {
  for (const [source, cap, reason] of [
    ['setInterval(() => {}, 100)', 1000, 'RUN_DEADLINE'],
    ['process.stdout.write("x".repeat(100000)); setInterval(() => {}, 100)', 3000, 'OUTPUT_CAP'],
    ['process.exit(0)', 3000, 'MISSING_TERMINAL_RECEIPT'],
  ]) {
    const input = await packet(t, source, cap)
    const result = await superviseFamilyPhotoProduction(input)
    assert.equal(result.status, 'UNKNOWN')
    assert.equal(result.code, reason)
    const saved = JSON.parse(await readFile(path.join(input.directory, 'attempt-01/supervisor-receipt.json')))
    assert.equal(saved.automaticRetry, false)
  }
})
