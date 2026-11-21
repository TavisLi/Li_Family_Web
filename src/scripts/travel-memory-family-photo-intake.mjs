import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { familyPhotoObjectKey, familyPhotoVariants, photoSizes } from '../payload/family-media.ts'
import { evaluateAuthorization, verifyManifestFiles } from './run-contract.mjs'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'
import { mergeVerifiedMediaReceipt } from './travel-memory-media-transfer.mjs'
import { maxFamilyPhotoBytes as maxPhotoBytes, readFamilyPhotoObject } from './travel-memory-family-photo-object-read.mjs'

const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const allowedLocale = new Set(['zh-TW', 'en'])

function objectFacts(key, variant, bytes) {
  assert(bytes.length > 0 && bytes.length <= maxPhotoBytes, 'BLOCK: family photo size')
  return { variant, key:familyPhotoObjectKey(key,variant), bytes:bytes.length, sha256:digest(bytes), mimeType:'image/jpeg' }
}

export async function prepareFamilyPhoto(original, assetId) {
  assert(Buffer.isBuffer(original) && original.length > 0 && original.length <= maxPhotoBytes, 'BLOCK: invalid original bytes')
  const key = digest(original)
  assert.equal(assetId, 'sha256:'+key, 'BLOCK: original SHA differs')
  const image = sharp(original,{limitInputPixels:64 * 1024 * 1024,failOn:'warning'})
  const metadata = await image.metadata()
  assert.equal(metadata.format,'jpeg','BLOCK: family photo intake requires original JPEG bytes')
  const buffers = {original}
  for (const size of photoSizes) {
    buffers[size.name] = await image.clone().rotate().resize(size.width,size.height,{
      fit:'cover',position:size.position,withoutEnlargement:true,
    }).jpeg({quality:85}).toBuffer()
  }
  return { assetId, familyAssetKey:key, buffers,
    objects:familyPhotoVariants.map(variant=>objectFacts(key,variant,buffers[variant])) }
}

// S3 PutObject input for the approved, bucket-scoped adapter. The original
// must stay private at the provider as well as through Payload.
export function familyPhotoPutInput(bucket, expected, bytes) {
  assert(Buffer.isBuffer(bytes) && bytes.length <= maxPhotoBytes)
  assert.equal(bytes.length,expected.bytes,'BLOCK: staged bytes differ')
  assert.equal(digest(bytes),expected.sha256,'BLOCK: staged SHA differs')
  assert.equal(expected.mimeType,'image/jpeg')
  return {Bucket:bucket,Key:expected.key,Body:bytes,ContentType:expected.mimeType,
    ContentLength:bytes.length,CacheControl:'private, no-store',IfNoneMatch:'*'}
}

async function approvedPlan(environment, plan, authority) {
  if (environment === 'disposable') return plan
  assert.equal(environment,'production')
  const {manifest, approval, root, humanSourceVerified, planPath} = authority ?? {}
  assert.equal(humanSourceVerified,true,'BLOCK: verified Human decision required')
  assert.equal(manifest?.approval.action,'production-media')
  assert(manifest.scope.expectedEffects.includes('travel-memory-family-photo-create'), 'BLOCK: private Media effect absent')
  assert(evaluateAuthorization(manifest,approval).recordMatches,'BLOCK: exact private Media approval required')
  await verifyManifestFiles(manifest,root)
  const binding = manifest.artifacts.dependencies.find(item => item.path === planPath)
  assert(binding,'BLOCK: private Media plan not bound')
  const bytes = await readFile(path.resolve(root,binding.path))
  assert.equal(digest(bytes),binding.sha256)
  const review = JSON.parse(bytes)
  assert.equal(review.status,'READY_FOR_REVIEW','BLOCK: private Media review incomplete')
  assert.equal(review.plan?.target,manifest.target,'BLOCK: private Media target drift')
  return review.plan
}

// Revocations and uncertain-write reconciliation belong to the #105 caller.
// Any unknown result stops this operation and leaves its durable INTENT.
export async function runFamilyPhotoIntake({
  plan: input, authority, environment='disposable', registry, loadOriginal, adapter, checkpoint, saveReceipt, guard,
}) {
  const plan = await approvedPlan(environment,input,authority)
  assert.equal(plan.environment,environment)
  assert.equal(plan.slug,registry.travelSlug)
  assert.equal(plan.mode,'family-photo-create')
  assert.equal(plan.ownerBasis,'ZERO_OWNER_AND_VERSION')
  assert(allowedLocale.has(plan.locale))
  assert(plan.entries.length > 0 && new Set(plan.entries.map(item=>item.assetId)).size===plan.entries.length)
  if (environment === 'production') {
    assert.equal(digest(JSON.stringify(registry)),plan.evidence?.registrySha256,'BLOCK: approved Registry SHA drift')
  }
  let merged = validateMediaRegistry(registry,plan.slug)
  for (const entry of plan.entries) {
    guard()
    const asset = merged.assets.find(item=>item.assetId===entry.assetId)
    assert(asset && !asset.locators.some(locator=>locator.environment===environment && locator.verified),
      'BLOCK: duplicate, verified or unknown family asset')
    const {sourcePath} = entry
    assert.equal(sourcePath,asset.sourcePath,'BLOCK: approved family Media alias drift')
    assert(typeof entry.altText === 'string' && entry.altText.trim() && entry.altText === entry.altText.trim())
    if (environment === 'production') {
      assert.equal(digest(entry.altText),entry.altTextSha256,'BLOCK: approved altText SHA drift')
    }
    const prepared = await prepareFamilyPhoto(await loadOriginal(entry.assetId),entry.assetId)
    assert.equal(prepared.buffers.original.length,asset.byteSize)
    assert.deepEqual(prepared.objects,entry.objects,'BLOCK: approved object bundle drift')
    assert.equal((await adapter.findMediaByFamilyKey(prepared.familyAssetKey)).length,0,'BLOCK: prior family Media exists')

    for (const object of prepared.objects) {
      guard()
      await checkpoint({assetId:entry.assetId,stage:'OBJECT_INTENT',key:object.key})
      guard()
      // The adapter must perform the server-side If-None-Match: * operation.
      await adapter.putIfAbsent(familyPhotoPutInput(plan.bucket,object,prepared.buffers[object.variant]))
      guard()
      const observed = await adapter.readVerifiedObject({bucket:plan.bucket,...object})
      assert.deepEqual(observed,{bytes:object.bytes,sha256:object.sha256,mimeType:object.mimeType},
        'BLOCK: private object readback mismatch')
      await checkpoint({assetId:entry.assetId,stage:'OBJECT_VERIFIED',key:object.key})
    }
    guard()
    await checkpoint({assetId:entry.assetId,stage:'MEDIA_INTENT'})
    guard()
    const mediaId = await adapter.createMedia({ locale:plan.locale, type:'photo', familyAssetKey:prepared.familyAssetKey,
      altText:entry.altText,mimeType:'image/jpeg',filesize:asset.byteSize, ...(sourcePath ? {sourcePath} : {}) })
    assert(Number.isSafeInteger(mediaId) && mediaId>0,'BLOCK: family Media create unknown')
    guard()
    const doc = await adapter.readMedia(mediaId,plan.locale)
    assert.equal(doc.id,mediaId)
    assert.equal(doc.familyAssetKey,prepared.familyAssetKey)
    assert.equal(doc.altText,entry.altText)
    assert.equal(doc.type,'photo')
    assert.equal(doc.mimeType,'image/jpeg')
    assert.equal(doc.filesize,asset.byteSize)
    assert.equal(doc.sourcePath ?? undefined,sourcePath,'BLOCK: family Media alias readback mismatch')
    assert(!doc.filename && !doc.relatedTravelRecord,'BLOCK: private Media route or owner drift')
    const receipt = {
      stage:'VERIFIED',assetId:entry.assetId,mediaId,inputBytes:asset.byteSize,
      originalGetBytes:asset.byteSize, originalGetSha256:entry.assetId, objects:prepared.objects,
      locator:{environment,payloadId:mediaId,verified:true,verifiedByteHash:entry.assetId, ...(sourcePath ? {sourcePath} : {})},
    }
    const next = mergeVerifiedMediaReceipt(merged,receipt)
    await saveReceipt(receipt)
    await checkpoint({assetId:entry.assetId,stage:'VERIFIED',mediaId})
    merged = next
  }
  return merged
}

// The approved caller supplies the bound bucket, scoped S3 clients, and a
// separately opened Payload reader. No credential sources are resolved here.
export async function familyPhotoIntakeAdapter({ bucket, writeStorage, readStorage, payload, readPayload, guard, signal }) {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  assert(writeStorage !== readStorage && payload !== readPayload, 'BLOCK: independent readback clients required')
  for (const storage of [writeStorage, readStorage]) {
    assert.equal(await storage.config.maxAttempts(),1,'BLOCK: storage must not retry')
  }
  const bounded = () => {
    guard()
    const item = AbortSignal.timeout(15000)
    return { abortSignal:signal ? AbortSignal.any([item,signal]) : item }
  }
  return {
    async findMediaByFamilyKey(familyAssetKey) {
      guard()
      const rows = await payload.find({collection:'media',depth:0,limit:2,
        where:{familyAssetKey:{equals:familyAssetKey}}})
      assert(!rows.hasNextPage, 'BLOCK: duplicate family Media')
      return rows.docs.map(doc=>doc.id)
    },
    async putIfAbsent(input) {
      assert.equal(input.Bucket,bucket)
      assert.equal(input.IfNoneMatch,'*')
      await writeStorage.send(new PutObjectCommand(input),bounded())
    },
    async readVerifiedObject({bucket:requested,...object}) {
      assert.equal(requested,bucket)
      const { state, bytes, sha256, mimeType } = await readFamilyPhotoObject({ storage:readStorage, bucket, object, guard, signal })
      assert.equal(state,'FOUND','BLOCK: private object readback incomplete')
      return {bytes,sha256,mimeType}
    },
    async createMedia({locale,...data}) {
      guard()
      const doc = await payload.create({collection:'media',locale,depth:0,data})
      return doc.id
    },
    async readMedia(id, locale) {
      guard()
      return readPayload.findByID({collection:'media',id,locale,fallbackLocale:false,depth:0})
    },
  }
}
