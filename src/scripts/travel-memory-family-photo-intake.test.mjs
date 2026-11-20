import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import sharp from 'sharp'
import { familyPhotoPutInput, prepareFamilyPhoto, runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'

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
