import assert from 'node:assert/strict'
import test from 'node:test'
import type { Payload } from 'payload'
import { readMemoryV2Inventory } from './travel-memory-v2-import'
import type { MediaRegistry } from './travel-memory-media-registry'
import type { MemorySourceV2 } from './travel-memory-source-v2'

const ids = Array.from({length:842}, (_,i) => 842 - i)
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
function mock({unexpected=false, missingAll=false, otherOwner=false, owner}: {
  unexpected?:boolean; missingAll?:boolean; otherOwner?:boolean; owner?:number
} = {}) {
  const batches: {locale:string; ids:number[]}[]=[]
  const payload = {async find(args: {collection:string; locale:string; limit:number; where:{id:{in:number[]}}}) {
    if (args.collection === 'travel-memories' && owner !== undefined) return { docs:[{id:owner}] }
    if (args.collection !== 'media') return { docs:[] }
    const batch = args.where.id.in
    batches.push({locale:args.locale,ids:batch})
    assert.equal(args.limit, batch.length)
    assert.ok(batch.length <= 100)
    const relation = otherOwner ? 9 : owner
    const docs = batch.map(id=>({id,sourcePath:null, ...(relation === undefined ? {} :
      {relatedTravelRecord:{relationTo:'travel-memories',value:relation}})})).reverse()
    if (unexpected) docs[0]!.id = 99999
    if (missingAll && args.locale === 'all') docs.pop()
    return {docs, hasNextPage:false}
  }} as unknown as Payload
  return {batches,payload}
}

test('an 842-photo inventory batches exact IDs before and after draft creation', async () => {
  for (const owner of [undefined, 1]) {
    const {payload,batches}=mock({owner})
    const result=await readMemoryV2Inventory(payload,source,registry,'fixture')
    assert.equal(result.memory?.id,owner)
    assert.deepEqual(result.media.map(row=>row.id),ids)
    assert.deepEqual(result.allLocales?.media?.map(row=>row.id),ids)
    assert.equal(result.allLocales?.media?.[0]?.sourcePath,null)
    assert.equal(batches.length,18)
    for (const locale of ['zh-TW','all']) {
      const scoped=batches.filter(batch=>batch.locale===locale)
      assert.deepEqual(scoped.map(batch=>batch.ids.length),[100,100,100,100,100,100,100,100,42])
      assert.deepEqual(scoped.flatMap(batch=>batch.ids),ids)
    }
  }
})

test('rejects unexpected IDs, non-target Media ownership and missing all-locale readback', async () => {
  for (const [flags, pattern] of [
    [{unexpected:true}, /unexpected or duplicate/],
    [{otherOwner:true,owner:1}, /ownership mismatch/],
    [{missingAll:true}, /Media inventory mismatch/],
  ] as const) {
    await assert.rejects(readMemoryV2Inventory(mock(flags).payload,source,registry,'fixture'),pattern)
  }
})
