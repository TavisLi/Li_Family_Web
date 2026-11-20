import assert from 'node:assert/strict'
import test from 'node:test'
import type { Payload } from 'payload'
import { readMemoryV2Inventory } from './travel-memory-v2-import'
import type { MediaRegistry } from './travel-memory-media-registry'
import type { MemorySourceV2 } from './travel-memory-source-v2'

const ids = Array.from({length:201}, (_,i) => 201 - i)
const assets = ids.map(id => ({assetId: 'sha256:' + id.toString(16).padStart(64,'0'), type:'photo' as const, altText:'Synthetic photo'}))
const source: MemorySourceV2 = {
  sourceVersion:2, slug:'fixture-memory', locale:'zh-TW', title:'Fixture', isPrivate:true,
  startDate:'2026-04-01', endDate:'2026-04-01', assets,
}
const registry: MediaRegistry = {version:1, travelSlug:source.slug, assets:assets.map((asset,index) => ({
  assetId:asset.assetId, filename:'fixture.jpeg', mimeType:'image/jpeg', width:1, height:1, byteSize:1,
  files:['fixture.jpeg'], provenance:'local-file',
  locators:[{environment:'fixture',payloadId:ids[index]!,verified:true,verifiedByteHash:asset.assetId}],
}))}
function mock({unexpected=false, missingAll=false, otherOwner=false} = {}) {
  const batches: {locale:string; ids:number[]}[]=[]
  const payload = {async find(args: {collection:string; locale:string; limit:number; where:{id:{in:number[]}}}) {
    if (args.collection !== 'media') return { docs:[] }
    const batch = args.where.id.in
    batches.push({locale:args.locale,ids:batch})
    assert.equal(args.limit, batch.length)
    assert.ok(batch.length <= 100)
    const docs = batch.map(id=>({id,sourcePath:null, ...(otherOwner ?
      {relatedTravelRecord:{relationTo:'travel-memories',value:9}} : {})})).reverse()
    if (unexpected) docs[0]!.id = 99999
    if (missingAll && args.locale === 'all') docs.pop()
    return {docs, hasNextPage:false}
  }} as unknown as Payload
  return {batches,payload}
}

test('new draft reads only exact Media IDs and preserves inventory order in both locale modes', async () => {
  const {payload,batches}=mock()
  const result=await readMemoryV2Inventory(payload,source,registry,'fixture')
  assert.deepEqual(result.media.map(row=>row.id),ids)
  assert.deepEqual(result.allLocales?.media?.map(row=>row.id),ids)
  assert.equal(result.allLocales?.media?.[0]?.sourcePath,null)
  assert.deepEqual(batches.map(batch=>[batch.locale,batch.ids.length]),
    [['zh-TW',100],['zh-TW',100],['zh-TW',1],['all',100],['all',100],['all',1]])
  assert.deepEqual(batches.slice(0,3).flatMap(batch=>batch.ids),ids)
})

test('rejects unexpected IDs, non-target Media ownership and missing all-locale readback', async () => {
  for (const [flags, pattern] of [
    [{unexpected:true}, /unexpected or duplicate/],
    [{otherOwner:true}, /ownership mismatch/],
    [{missingAll:true}, /Media inventory mismatch/],
  ] as const) {
    await assert.rejects(readMemoryV2Inventory(mock(flags).payload,source,registry,'fixture'),pattern)
  }
})
