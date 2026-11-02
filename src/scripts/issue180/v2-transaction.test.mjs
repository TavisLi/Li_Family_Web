import test from 'node:test'
import assert from 'node:assert/strict'
import {createLocalReq} from 'payload'
import {guardPayload} from './gate-c-worker.mjs'
import {importProduct,fixtureSources} from './payload-runtime.mjs'
const {importMemoryV2}=await importProduct(process.cwd(),'scripts/travel-memory-v2-import.ts')
const source=fixtureSources().v2Source
function backend() {
 let rows={'travel-memories':[],'travel-memory-days':[],media:[]},saved,next=1,writes=0
 const events=[],s={fail:null,englishGeo:false,rows:()=>rows,events}
 const payload={db:{sessions:{},beginTransaction:async()=>{events.push('begin');saved=structuredClone(rows);payload.db.sessions.tx={db:{execute:async()=>{events.push('lock');return {rows:[{locked:true,isolation:'read committed'}]}}}};return 'tx'},commitTransaction:async()=>events.push('commit'),rollbackTransaction:async()=>{events.push('rollback');rows=saved}},
  find:async args=>{if(args.req)assert.equal(args.req.transactionID,'tx');events.push('read:'+args.locale);let docs=(rows[args.collection]??[]).filter(r=>Object.entries(args.where??{}).every(([k,v])=>r[k]===v.equals));docs=structuredClone(docs)
   if(args.locale==='all' && s.englishGeo)for(const d of docs)if(d.moments)d.moments[0].geo.name={en:'Private', 'zh-TW':null}
   return {docs,hasNextPage:false}},
  create:async args=>{assert.equal(args.req?.transactionID,'tx');writes++;events.push('write');if(s.fail===args.collection)throw Error('injected write failure');const d={...structuredClone(args.data),id:next++};if(d.moments)d.moments=d.moments.map(m=>({...m,id:'m1',geo:{name:null,latitude:null,longitude:null,crs:null,provenance:null,originalCRS:null,approval:{snapshot:null,audience:null,confirmedBy:null}}}));rows[args.collection].push(d);return structuredClone(d)},
  update:async args=>{assert.equal(args.req?.transactionID,'tx');writes++;events.push('write');if(s.fail===args.collection)throw Error('injected write failure');const d=rows[args.collection].find(r=>r.id===args.id);Object.assign(d,structuredClone(args.data));return structuredClone(d)}}
 const req={payload,context:{},i18n:{t:k=>k},user:null}
 return {...s,payload,req,get writes(){return writes},set fail(v){s.fail=v},set englishGeo(v){s.englishGeo=v}}
}
const options=b=>({apply:true,assetRoot:'/unused',sourceFile:'synthetic',req:b.req})
test('all-null Payload geo permits V2 create and repeat in one locked transaction',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));await importMemoryV2(b.payload,source,options(b));assert.equal(b.rows()['travel-memory-days'].length,1);assert(b.events.includes('lock'));assert.equal(b.events.at(-1),'commit')
})

test('another locale geo rejects before all writes and rolls back',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));const before=structuredClone(b.rows()),writes=b.writes;b.englishGeo=true
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/geo: legacy importer/);assert.equal(b.writes,writes);assert.deepEqual(b.rows(),before);assert.equal(b.events.at(-1),'rollback')
})
test('a child failure rolls back parent and Base; no partial import survives',async()=>{
 const b=backend();b.fail='travel-memory-days';await assert.rejects(importMemoryV2(b.payload,source,options(b)),/injected write failure/);assert.deepEqual(b.rows()['travel-memories'],[]);assert.equal(b.events.at(-1),'rollback')
})
test('inventory drift is rejected before the first mutation',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));const writes=b.writes,find=b.payload.find;let reads=0;b.payload.find=async a=>{const out=await find(a);if(++reads>4 && out.docs[0])out.docs[0].updatedAt='drift';return out}
 await assert.rejects(importMemoryV2(b.payload,{...source,summary:'next'},options(b)),/inventory changed/);assert.equal(b.writes,writes)
})
test('new Media is rejected before a record or file can be created',async()=>{
 const b=backend(),withAsset={...source,assets:[{type:'photo',sourcePath:'travels/'+source.slug+'/photos/synthetic.png',altText:'Synthetic'}]}
 await assert.rejects(importMemoryV2(b.payload,withAsset,options(b)),/new Media requires separate verified intake/);assert.equal(b.writes,0)
})
test('nonempty, malformed and unknown geo values remain protected',async()=>{
 for(const geo of [{latitude:0},{name:''},{latitude:false},{unknown:null},{approval:{snapshot:'x'}},{name:{fr:null}},{name:{en:'Private'}},[],false]) {
  const b=backend();await importMemoryV2(b.payload,source,options(b));b.rows()['travel-memory-days'][0].moments[0].geo=geo;const writes=b.writes
  await assert.rejects(importMemoryV2(b.payload,source,options(b)),/geo: legacy importer/);assert.equal(b.writes,writes)
 }
})
test('geo Base remains protected even when Current geo is empty',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));b.rows()['travel-memories'][0].sourceMetadata.baseProjection.atlasGeoV1={};const writes=b.writes
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/geo: legacy importer/);assert.equal(b.writes,writes)
})
test('failed content read-back rolls back and cannot advance Base',async()=>{
 const b=backend(),find=b.payload.find;b.payload.find=async a=>{const out=await find(a);if(b.writes && a.collection==='travel-memory-days' && out.docs[0])out.docs[0].title='corrupt';return out}
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/content read-back mismatch/);assert.deepEqual(b.rows()['travel-memories'],[])
})
test('failed Base read-back rolls back content and metadata',async()=>{
 const b=backend(),update=b.payload.update;b.payload.update=async a=>{const out=await update(a);if(a.data.sourceMetadata)b.rows()['travel-memories'][0].sourceMetadata.baseProjection={corrupt:true};return out}
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/Base read-back mismatch/);assert.deepEqual(b.rows()['travel-memories'],[])
})
test('lock rejection prevents inventory and writes',async()=>{
 const b=backend(),begin=b.payload.db.beginTransaction;b.payload.db.beginTransaction=async()=>{const id=await begin();b.payload.db.sessions.tx.db.execute=async()=>({rows:[{locked:false,isolation:'read committed'}]});return id}
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/Travel geo write conflict/);assert.equal(b.writes,0);assert(!b.events.some(e=>e.startsWith('read:')))
})
test('rollback and commit acknowledgement errors retain UNKNOWN, never retry',async()=>{
 const b=backend();b.fail='travel-memory-days';b.payload.db.rollbackTransaction=async()=>{throw Error('rollback unavailable')}
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),e=>e instanceof AggregateError && /UNKNOWN/.test(e.message) && e.errors.length===2)
 const c=backend();c.payload.db.commitTransaction=async()=>{throw Error('commit acknowledgement lost')}
 await assert.rejects(importMemoryV2(c.payload,source,options(c)),/effects UNKNOWN; do not retry/)
})

test('other-locale mutation during write is detected and rolled back',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));b.rows()['travel-memories'][0].summary={en:'Keep English','zh-TW':null};const before=structuredClone(b.rows()),find=b.payload.find,update=b.payload.update
 // The boundary projects the source locale and all-locale shapes separately.
 b.payload.find=async a=>{const out=await find(a);if(a.locale!=='all')for(const d of out.docs)if(d.summary && typeof d.summary==='object')d.summary=d.summary['zh-TW'];return out}
 b.payload.update=async a=>{const out=await update(a);if(a.data.summary)b.rows()['travel-memories'][0].summary={en:'Overwritten','zh-TW':a.data.summary};return out}
 await assert.rejects(importMemoryV2(b.payload,{...source,summary:'New Source'},options(b)),/other locale changed/);assert.deepEqual(b.rows(),before)
})
test('new Media and missing Base cannot gain approval from an empty Current geo',async()=>{
 const b=backend();await importMemoryV2(b.payload,source,options(b));b.rows()['travel-memories'][0].sourceMetadata.baseProjection=null;const writes=b.writes
 await assert.rejects(importMemoryV2(b.payload,source,options(b)),/missing v2 baseline/);assert.equal(b.writes,writes)
})
test('an existing Media row must be locked before any content mutation',async()=>{
 const b=backend(),item={id:20,sourcePath:'travels/'+source.slug+'/photos/synthetic.png',type:'photo',altText:'Synthetic'};b.rows().media.push(item)
 const begin=b.payload.db.beginTransaction;b.payload.db.beginTransaction=async()=>{const id=await begin();let locks=0;b.payload.db.sessions.tx.db.execute=async()=>++locks===1?{rows:[{locked:true,isolation:'read committed'}]}:{rows:[]};return id}
 const withAsset={...source,assets:[{type:'photo',sourcePath:item.sourcePath,altText:'Synthetic'}]}
 await assert.rejects(importMemoryV2(b.payload,withAsset,options(b)),/Media lock identity mismatch/);assert.equal(b.writes,0)
})
test('existing Media metadata rolls back with a failed parent Base update',async()=>{
 const b=backend(),sourcePath='travels/'+source.slug+'/photos/synthetic.png',asset={type:'photo',sourcePath,altText:'Old'}
 b.rows().media.push({...asset,id:20})
 const begin=b.payload.db.beginTransaction;b.payload.db.beginTransaction=async()=>{const id=await begin();b.payload.db.sessions.tx.db.execute=async()=>({rows:[{locked:true,isolation:'read committed',id:20}]});return id}
 const original={...source,assets:[asset]};await importMemoryV2(b.payload,original,options(b))
 b.rows()['travel-memories'][0].sourceMetadata.baseProjection.locales['zh-TW'].assets[sourcePath]=asset
 const before=structuredClone(b.rows());b.fail='travel-memories'
 await assert.rejects(importMemoryV2(b.payload,{...original,assets:[{...asset,altText:'New'}]},options(b)),/injected write failure/);assert.deepEqual(b.rows(),before)
})

test('installed Local API request construction preserves guarded identity across V2 apply and repeat',async()=>{
 const b=backend(),find=b.payload.find,checkpoints=[]
 // Reproduce the installed local API boundary without a DB: it always reattaches
 // the underlying Payload instance to the caller-supplied request.
 b.payload.find=async args=>{await createLocalReq(args,b.payload);return find(args)}
 const guarded=guardPayload(b.payload,async name=>checkpoints.push(name))
 const req=await createLocalReq({req:b.req},guarded)
 await importMemoryV2(guarded,source,{...options(b),req})
 assert.equal(req.transactionID,undefined)
 await importMemoryV2(guarded,source,{...options(b),req})
 assert.equal(req.payload,guarded,'Local API must preserve importer Payload identity')
 assert(checkpoints.includes('payload:find'));assert.equal(b.events.filter(e=>e==='commit').length,2)
})

test('V2 request guards distinguish foreign Payload from an active transaction before DB IO',async()=>{
 for(const [change,reason] of [[req=>{req.payload={}},'payload mismatch'],[req=>{req.transactionID='existing'},'active transaction']]) {
  const b=backend();change(b.req)
  await assert.rejects(importMemoryV2(b.payload,source,options(b)),new RegExp(reason))
  assert.deepEqual(b.events,[]);assert.equal(b.writes,0)
 }
})
