import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { familyPhotoPutInput, prepareFamilyPhoto, runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'
import { observeFamilyPhotoObjects } from './travel-memory-family-photo-object-read.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const original = await sharp({create:{width:48,height:32,channels:3,background:'#477562'}})
  .jpeg().withMetadata({orientation:1}).toBuffer()
const assetId='sha256:'+sha(original)
const prepared=await prepareFamilyPhoto(original,assetId)
const registry={version:1,travelSlug:'fixture-family',assets:[{
  assetId,filename:'fixture.jpeg',files:['fixture.jpeg'],mimeType:'image/jpeg', width:48,height:32,byteSize:original.length,
  provenance:'local-file',locators:[],
}]}
const entry={assetId,altText:'Synthetic forest',objects:prepared.objects}
const plan={environment:'disposable',slug:registry.travelSlug,mode:'family-photo-create',ownerBasis:'ZERO_OWNER_AND_VERSION',
  bucket:'family-fixture',locale:'zh-TW',entries:[entry]}
function fixture({ duplicate=false, conflicted=false, badReadback=false }={}) {
  const objects=new Map()
  const steps=[]
  const receipts=[]
  let created
  const adapter={
    async findMediaByFamilyKey(key) {
      assert.equal(key,prepared.familyAssetKey)
      return duplicate?[88]:[]
    },
    async putIfAbsent(input) {
      assert.equal(input.IfNoneMatch,'*')
      assert.equal(input.Bucket,plan.bucket)
      assert.equal(input.CacheControl,'private, no-store')
      if(conflicted) throw new Error('PreconditionFailed')
      assert(!objects.has(input.Key))
      objects.set(input.Key,input.Body)
    },
    async readVerifiedObject(object) {
      const bytes=objects.get(object.key)
      return {bytes:bytes.length,sha256:badReadback?'wrong':sha(bytes),mimeType:'image/jpeg'}
    },
    async createMedia(doc) {
      assert.equal(objects.size,4)
      assert.equal(doc.familyAssetKey,prepared.familyAssetKey)
      assert.equal(doc.altText,entry.altText)
      assert.equal(doc.relatedTravelRecord,undefined)
      assert.equal(doc.filename,undefined)
      created={...doc,id:99}
      return created.id
    },
    async readMedia(id, locale) {
      assert.equal(id,99)
      assert.equal(locale,'zh-TW')
      return created
    },
  }
  const options={plan,registry,loadOriginal:async()=>original,adapter,
    checkpoint:async item=>steps.push(item.stage),saveReceipt:async item=>receipts.push(item),guard(){}}
  return {options,steps,receipts,objects}
}

test('four exact private variants preserve the original and omit EXIF from derivatives', async()=>{
  assert.deepEqual(prepared.buffers.original,original)
  assert.deepEqual(prepared.objects.map(item=>item.variant),['original','thumbnail','medium','large'])
  for (const {variant,key,sha256} of prepared.objects) {
    assert.equal(key,`family-media/${prepared.familyAssetKey}/${variant}.jpeg`)
    assert.equal(sha(prepared.buffers[variant]),sha256)
    if(variant!=='original') assert.equal((await sharp(prepared.buffers[variant]).metadata()).exif,undefined)
  }
  const object=prepared.objects[0]
  await assert.rejects(prepareFamilyPhoto(original,'sha256:'+'a'.repeat(64)),/SHA differs/)
  assert.throws(()=>familyPhotoPutInput(plan.bucket,object,Buffer.alloc(original.length)),/staged SHA/)
})

test('all originals and variants read back before creating an unowned private Media row', async()=>{
  const {options,steps,receipts}=fixture()
  const result=await runFamilyPhotoIntake(options)
  assert.equal(result.assets[0].locators[0].payloadId,99)
  assert.deepEqual(steps,['OBJECT_INTENT','OBJECT_VERIFIED','OBJECT_INTENT','OBJECT_VERIFIED',
    'OBJECT_INTENT','OBJECT_VERIFIED','OBJECT_INTENT','OBJECT_VERIFIED','MEDIA_INTENT','VERIFIED'])
  assert.equal(receipts.length,1)
  assert.equal(receipts[0].originalGetSha256,assetId)
  assert.equal(registry.assets[0].locators.length,0)
})

test('carries the exact approved optional alias through Media creation and independent readback', async()=>{
  const {options,steps}=fixture()
  const sourcePath=`travels/${plan.slug}/photos/fixture.jpeg`
  options.registry=structuredClone(registry)
  options.registry.assets[0].sourcePath=sourcePath
  await assert.rejects(runFamilyPhotoIntake(options),/alias drift/)
  assert.deepEqual(steps,[])
  options.plan={...plan,entries:[{...entry,sourcePath}]}
  const result=await runFamilyPhotoIntake(options)
  assert.equal(result.assets[0].locators[0].sourcePath,sourcePath)
})

test('missing authority, duplicate row, conditional conflict and bad readback stop before Media creation', async()=>{
  const unapproved=fixture()
  await assert.rejects(runFamilyPhotoIntake({...unapproved.options,environment:'production'}),/Human decision/)
  assert.deepEqual(unapproved.steps,[])
  for(const [flags,pattern] of [
    [{duplicate:true},/prior family Media/],[{conflicted:true},/PreconditionFailed/],[{badReadback:true},/object readback mismatch/],
  ]) {
    const run=fixture(flags)
    await assert.rejects(runFamilyPhotoIntake(run.options),pattern)
    assert(!run.steps.includes('MEDIA_INTENT'))
    assert.equal(run.receipts.length,0)
  }
})

function readFixture(send) {
  const observations = []
  const controller = new AbortController()
  const storage = { config: { maxAttempts: async () => 1 }, send }
  const options = { bucket: plan.bucket, entries: [entry], storage, signal: controller.signal,
    guard() {}, saveObservation: async (id, value) => { observations.push({ assetId: id, ...value }) } }
  return { observations, controller, options }
}

function providerError(name, httpStatusCode) {
  return Object.assign(new Error(name), { name, $metadata: { httpStatusCode } })
}

test('exact private GETs return byte evidence and accept only explicit NoSuchKey 404 as absent', async () => {
  const requests = []
  const { options, observations } = readFixture(async (command, { abortSignal }) => {
    assert(command instanceof GetObjectCommand)
    assert(abortSignal instanceof AbortSignal)
    const object = entry.objects[requests.length]
    requests.push(command.input)
    assert.deepEqual(command.input, { Bucket: plan.bucket, Key: object.key })
    if (object.variant !== 'original') throw providerError('NoSuchKey', 404)
    return { ContentLength: original.length, ContentType: object.mimeType,
      Body: { transformToWebStream: () => new Blob([original]).stream() } }
  })
  await observeFamilyPhotoObjects(options)
  assert.equal(requests.length, 4)
  assert.deepEqual(observations[0], { assetId, key: entry.objects[0].key,
    state: 'FOUND', bytes: original.length, sha256: sha(original), mimeType: 'image/jpeg' })
  assert.deepEqual(observations.slice(1).map(item => item.state), Array(3).fill('ABSENT_CONFIRMED'))
})

test('invalid roster, missing bucket and denied access do not become absent observations', async () => {
  let calls = 0
  const unscoped = readFixture(async () => { calls++ })
  unscoped.options.entries = [{ ...entry, objects: [{ ...entry.objects[0], key: 'other.jpeg' }, ...entry.objects.slice(1)] }]
  await assert.rejects(observeFamilyPhotoObjects(unscoped.options), /family-media/)
  assert.equal(calls, 0)
  for (const error of [providerError('NoSuchBucket', 404), providerError('AccessDenied', 403), providerError('NotFound', 404)]) {
    const { options, observations } = readFixture(async () => { throw error })
    await assert.rejects(observeFamilyPhotoObjects(options), error)
    assert.deepEqual(observations, [])
  }
})

test('incomplete bodies stop before the next key, and abort cancels a stalled read', async () => {
  let calls = 0
  const partial = readFixture(async () => {
    calls++
    return { ContentLength: original.length, ContentType: 'image/jpeg',
      Body: { transformToWebStream: () => new Blob([original.subarray(0, 1)]).stream() } }
  })
  await assert.rejects(observeFamilyPhotoObjects(partial.options), /incomplete private object body/)
  assert.equal(calls, 1)
  assert.deepEqual(partial.observations, [{ assetId, key: entry.objects[0].key, state: 'UNKNOWN' }])

  let cancelled = false
  const stall = readFixture(async () => ({
    ContentLength: original.length, ContentType: 'image/jpeg',
    Body: { transformToWebStream: () => new ReadableStream({
      start() { setImmediate(() => stall.controller.abort()) },
      cancel() { cancelled = true },
    }) },
  }))
  await assert.rejects(observeFamilyPhotoObjects(stall.options), { name: 'AbortError' })
  assert(cancelled)
  assert.deepEqual(stall.observations, [])
})

test('oversize content is discarded and a conflicting object cannot yield hash evidence', async () => {
  let cancelled = false
  const { options, observations } = readFixture(async command => {
    if (command.input.Key !== entry.objects[0].key) throw providerError('NoSuchKey', 404)
    return { ContentLength: original.length, ContentType: 'image/jpeg',
      Body: { transformToWebStream: () => new ReadableStream({
        start(reader) { reader.enqueue(Buffer.alloc(original.length + 1)) },
        cancel() { cancelled = true },
      }) } }
  })
  await observeFamilyPhotoObjects(options)
  assert(cancelled)
  assert.deepEqual(observations[0], { assetId, key: entry.objects[0].key, state: 'CONFLICT' })
})
