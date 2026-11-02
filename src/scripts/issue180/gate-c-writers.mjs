import assert from 'node:assert/strict'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { importProduct } from './payload-runtime.mjs'

export function flattenPhysical(snapshot) {
 return snapshot.flatMap(row=>row.key==='rows' && Array.isArray(row.value)?row.value.map(value=>({table:row.table,key:JSON.stringify(value.id ?? value),value})): [row])
}
export const isHistoryTable=table=>/^_(?:travel_.*|geo_stops)_v(?:_|$)/.test(table)
export function assertHistoricalRows(before,after) {
 const index=new Map(flattenPhysical(after).map(row=>[JSON.stringify([row.table,row.key]),row.value]))
 let preserved=0
 for(const row of flattenPhysical(before).filter(row=>isHistoryTable(row.table))) {
  const actual=index.get(JSON.stringify([row.table,row.key]));assert(actual,'HISTORY_ROW_REMOVED')
  const normalize=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='latest'))
  assert.deepEqual(normalize(actual),normalize(row.value),'HISTORY_CONTENT_CHANGED');preserved++
 }
 return {preservedRows:preserved}
}
export function stableIdentities(value) {
 if(Array.isArray(value))return value.map(stableIdentities)
 if(!value || typeof value!=='object')return null
 const result={}
 for(const [key,child] of Object.entries(value)) {
  if(['id','anchor','dayKey','momentKey','stopKey','placementKey'].includes(key))result[key]=child
  else if(Array.isArray(child))result[key]=stableIdentities(child)
 }
 return result
}
export async function verifyV2GeoRefusal(payload,source,options,{planMemoryV2,importMemoryV2,readMemoryV2Inventory}) {
 const inventory=await readMemoryV2Inventory(payload,source)
 const plan=planMemoryV2(source,inventory)
 assert(!plan.missingBase,'GEO_PROBE_MISSING_BASE')
 assert.deepEqual(plan.conflicts,['geo: legacy importer cannot safely preserve geo and its Base'],'GEO_PROBE_CONFOUNDED')
 // A synthetic projection with geo removed only exercises the planner. It does
 // not prove that Payload can persist and read back a document without geo.
 const strip=value=>Array.isArray(value)?value.map(strip):value && typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='geo').map(([key,child])=>[key,strip(child)])):value
 const noGeo=strip(inventory),control=planMemoryV2(source,noGeo)
 assert(!control.missingBase && control.conflicts.length===0,'GEO_PROBE_NO_GEO_PLANNER_CONTROL')
 await assert.rejects(importMemoryV2(payload,source,options),{name:'Error',message:'BLOCK: geo: legacy importer cannot safely preserve geo and its Base'})
 return {geoRefusal:true,geoRefusalNoMutationCheckedByCaller:true,noGeoPlannerControl:true,noGeoNormalImport:'UNKNOWN_REQUIRES_PAYLOAD_READBACK',missingBase:false,conflicts:plan.conflicts}
}
export async function writerScope({read,observe},collection,id) {
 if(collection==='travel-memory-days')return [{collection,id}]
 const doc=await read(collection,id)
 assert(typeof doc.slug==='string' && doc.slug.length>0,'ROUTE_SCOPE_SLUG_REQUIRED')
 const routes=(await observe()).filter(row=>row.table==='travel_route_identities' && row.value.slug===doc.slug)
 assert(routes.length<=1 && routes.every(row=>row.value.id!=null),'ROUTE_SCOPE_AMBIGUOUS')
 return [{collection,id},...routes.map(row=>({collection:'travel-route-identities',id:row.value.id}))]
}
export async function requireV2Roundtrip(ctx,repeat,evidence) {
 if(!repeat.missingBase && !repeat.conflicts.length)return
 const value={status:'BLOCK',missingBase:repeat.missingBase,conflicts:repeat.conflicts,plan:repeat,...evidence}
 assert(Buffer.byteLength(JSON.stringify(value))<=1024*1024,'V2_ROUNDTRIP_EVIDENCE_UNKNOWN: CAP')
 let reference
 try{reference=await ctx.save('memory-v2-roundtrip-conflict',value)}catch(error){throw Error('V2_ROUNDTRIP_EVIDENCE_UNKNOWN: '+error.message,{cause:error})}
 assert(reference && /^[a-f0-9]{64}$/.test(reference.sha256) && reference.path==='memory-v2-roundtrip-conflict.json','V2_ROUNDTRIP_EVIDENCE_UNKNOWN: READBACK')
 throw Object.assign(Error('V2_ROUNDTRIP_CONFLICT: '+JSON.stringify(reference)),{roundtripEvidence:reference})
}
export async function inspectV2Roundtrip(payload,source,options,importV2) {
 const reads=[]
 const observed=new Proxy(payload,{get(target,key){const value=Reflect.get(target,key);if(key!=='find')return value;return async args=>{const result=await value.call(target,args);reads.push({collection:args.collection,locale:args.locale,where:args.where ?? null,docs:result.docs});assert(Buffer.byteLength(JSON.stringify(reads))<=1024*1024,'V2_ROUNDTRIP_EVIDENCE_UNKNOWN: CAP');return result}}})
 const repeat=await importV2(observed,source,{...options,apply:false})
 return {repeat,reads}
}
export const v2EnglishSentinel=Object.freeze({title:'English synthetic V2 memory',summary:'English v2 sentinel'})
export async function runWriters(ctx,{focused=false}={}) {
 const {payload,fixture:f}=ctx
 const load=file=>importProduct(ctx.root,file)
 const [{buildTravelSeedTarget,writeTravelSeedTarget},v2Importer,geoWrite,review,{createLocalReq}]=await Promise.all([
  load('scripts/travel-seed-target.ts'),load('scripts/travel-memory-v2-import.ts'),load('scripts/travel-geo-write.ts'),load('payload/collections/travel-geo-review.ts'),import('payload')])
 const {importMemoryV2}=v2Importer
 const opts={locale:'zh-TW',depth:0,user:f.admin,overrideAccess:false}
 const store={find:args=>payload.find({...args,...opts}),create:args=>payload.create({...args,...opts}),update:args=>payload.update({...args,...opts})}
 const read=(collection,id,locale='all')=>payload.findByID({...opts,collection,id,locale,fallbackLocale:false,draft:true})
 const records=[]
 async function record(id,work) {
  await ctx.checkpoint('writer:'+id)
  const result=await work();const row={id,status:'PASS',...result}
  await ctx.save(id,row);records.push(row)
 }
 const scope=(collection,id)=>writerScope({read,observe:ctx.observe},collection,id)
 async function preserved(before,allowed=[]) {
  const after=await ctx.observe();await ctx.assertPreserved(before,after,allowed);assertHistoricalRows(before,after)
 }
 async function edit(collection,id,data,locale='zh-TW') {
  const before=await ctx.observe(),identities=stableIdentities(await read(collection,id))
  const result=await payload.update({...opts,collection,id,data,locale})
  assert.deepEqual(stableIdentities(await read(collection,id)),identities,'SPARSE_EDIT_IDENTITY_CHANGED')
  await preserved(before,await scope(collection,id));return result
 }
 async function v1(source) {
  const target=buildTravelSeedTarget(source,source),before=await ctx.observe()
  const created=await writeTravelSeedTarget({store,target,mode:'safe'})
  assert.equal(created.action,'create','SUPPORTED_V1_CREATE_REQUIRED')
  await preserved(before,await scope(target.collection,created.id))
  const en={title:'English writer sentinel',summary:'English must remain'}
  if(target.collection==='travel-plans') {
   const initial=await read(target.collection,created.id,'zh-TW')
   en.planningSections=initial.planningSections.map(section=>({id:section.id,anchor:section.anchor,level:section.level,title:'English '+section.title,body:'English '+section.body}))
  }
  await edit(target.collection,created.id,en,'en')
  const identities=stableIdentities(await read(target.collection,created.id))
  const baseline=await read(target.collection,created.id,'en'),next=structuredClone(source);next.summary='Source-only change'
  const beforeUpdate=await ctx.observe()
  const updated=await writeTravelSeedTarget({store,target:buildTravelSeedTarget(next,next),mode:'safe'})
  assert.equal(updated.action,'apply-source','SUPPORTED_V1_UPDATE_REQUIRED')
  await preserved(beforeUpdate,await scope(target.collection,created.id))
  assert.deepEqual(stableIdentities(await read(target.collection,created.id)),identities,'V1_IDENTITY_CHANGED')
  assert.equal((await read(target.collection,created.id,'en')).summary,baseline.summary,'OTHER_LOCALE_CHANGED')
  await edit(target.collection,created.id,{summary:'Admin-only preserved'})
  let beforeDenied=await ctx.observe()
  const currentOnly=await writeTravelSeedTarget({store,target:buildTravelSeedTarget(next,next),mode:'safe'})
  assert(['preserve-current','skip','already-converged'].includes(currentOnly.action),'CURRENT_ONLY_NOT_PRESERVED')
  await preserved(beforeDenied)
  const conflict=structuredClone(next);conflict.summary='Different Source change'
  beforeDenied=await ctx.observe()
  assert.equal((await writeTravelSeedTarget({store,target:buildTravelSeedTarget(conflict,conflict),mode:'safe'})).action,'conflict')
  await preserved(beforeDenied)
  await edit(target.collection,created.id,{sourceMetadata:{baseProjection:null}})
  beforeDenied=await ctx.observe()
  const missing=await writeTravelSeedTarget({store,target:buildTravelSeedTarget(conflict,conflict),mode:'safe'})
  assert(['preserve-current','conflict'].includes(missing.action),'MISSING_BASE_OVERWRITE')
  await preserved(beforeDenied)
  return {id:created.id,collection:target.collection}
 }
 await record('plan-seed',async()=>{
  const supported=await v1(f.legacyPlanSource),before=await ctx.observe()
  const source={...f.legacyPlanSource,slug:(await read('travel-plans',f.targetPlanId)).slug}
  const denied=await writeTravelSeedTarget({store,target:buildTravelSeedTarget(source,source),mode:'source-wins'})
  assert.equal(denied.action,'conflict','GEO_LEGACY_WRITER_NOT_REFUSED');await preserved(before)
  return {supported,safeRefusal:true,sourceCurrentMissingBase:'PASS'}
 })
 if(focused)return records
 await record('memory-v1',async()=>{
  const before=await ctx.observe();let storeCalls=0
  const forbidden=async()=>{storeCalls++;throw Error('RETIRED_MEMORY_STORE_IO')}
  const target=buildTravelSeedTarget(f.legacyMemorySource,f.legacyMemorySource)
  for(const mode of ['safe','source-wins','payload-wins'])await assert.rejects(writeTravelSeedTarget({store:{find:forbidden,create:forbidden,update:forbidden},target,mode}),{name:'Error',message:'MEMORY_V1_RETIRED: use --memory-v2 <file>; legacy Memory writes are disabled'})
  assert.equal(storeCalls,0);await preserved(before)
  return {retired:true,storeCalls,mutations:0,normalMemoryWriter:'memory-v2'}
 })
 await record('memory-v2',async()=>{
  const options={apply:true,assetRoot:path.join(ctx.owner.directory,'home'),sourceFile:'synthetic-memory-v2',environment:'disposable',req:await createLocalReq({user:f.admin},payload)}
  const beforeCreate=await ctx.observe()
  const created=await importMemoryV2(payload,f.v2Source,options);assert(created.applied,'V2_WRITE_NOT_APPLIED')
  const ownedDays=await payload.find({...opts,collection:'travel-memory-days',where:{memory:{equals:created.memoryId}},limit:100})
  const allowed=[...await scope('travel-memories',created.memoryId),...ownedDays.docs.map(day=>({collection:'travel-memory-days',id:day.id}))]
  await preserved(beforeCreate,allowed)
  const readBack=await read('travel-memories',created.memoryId);assert.equal(readBack.sourceMetadata.parserVersion,'memory-source-v2')
  const {repeat,reads}=await inspectV2Roundtrip(payload,f.v2Source,options,importMemoryV2);await requireV2Roundtrip(ctx,repeat,{source:f.v2Source,readBack,ownedDays:ownedDays.docs,reads})
  const source={...f.legacyMemorySource,slug:readBack.slug},before=await ctx.observe()
  await assert.rejects(writeTravelSeedTarget({store,target:buildTravelSeedTarget(source,source),mode:'source-wins'}),{name:'Error',message:'MEMORY_V1_RETIRED: use --memory-v2 <file>; legacy Memory writes are disabled'})
  await preserved(before)
  await edit('travel-memories',created.memoryId,{...v2EnglishSentinel},'en')
  const next={...f.v2Source,summary:'Source-only v2 change'},beforeSource=await ctx.observe()
  const changed=await importMemoryV2(payload,next,options);assert(changed.applied)
  assert.equal((await read('travel-memories',created.memoryId,'zh-TW')).summary,next.summary)
  assert.equal((await read('travel-memories',created.memoryId,'en')).summary,'English v2 sentinel')
  await preserved(beforeSource,allowed)
  const afterDays=await payload.find({...opts,collection:'travel-memory-days',where:{memory:{equals:created.memoryId}},limit:100})
  assert.deepEqual(afterDays.docs.map(stableIdentities),ownedDays.docs.map(stableIdentities),'V2_IDENTITY_CHANGED')
  await edit('travel-memories',created.memoryId,{summary:'Current-only v2 preserved'})
  const beforeCurrent=await ctx.observe()
  await importMemoryV2(payload,next,options)
  assert.equal((await read('travel-memories',created.memoryId,'zh-TW')).summary,'Current-only v2 preserved');await preserved(beforeCurrent,allowed)
  let deniedBefore=await ctx.observe()
  await assert.rejects(importMemoryV2(payload,{...next,summary:'Conflicting v2 Source'},options),/BLOCK:/);await preserved(deniedBefore)
  await edit('travel-memories',created.memoryId,{sourceMetadata:{baseProjection:null}})
  deniedBefore=await ctx.observe();await assert.rejects(importMemoryV2(payload,next,options),/BLOCK: missing v2 baseline/);await preserved(deniedBefore)
  const geoSource={...f.v2Source,slug:f.v2Source.slug+'-geo-control'},beforeControl=await ctx.observe()
  const control=await importMemoryV2(payload,geoSource,options);assert(control.applied,'V2_NO_GEO_APPLY_CONTROL')
  const geoDays=await payload.find({...opts,collection:'travel-memory-days',where:{memory:{equals:control.memoryId}},limit:100})
  assert.equal(geoDays.docs.length,1,'GEO_PROBE_DAY_MAPPING')
  assert.deepEqual(geoDays.docs[0].moments.map(m=>m.momentKey),geoSource.days[0].moments.map(m=>m.momentKey),'GEO_PROBE_MOMENT_MAPPING')
  const geoAllowed=[...await scope('travel-memories',control.memoryId),...geoDays.docs.map(day=>({collection:'travel-memory-days',id:day.id}))]
  await preserved(beforeControl,geoAllowed)
  const beforeMapping=await ctx.observe()
  await assert.rejects(importMemoryV2(payload,{...geoSource,originPlan:'synthetic-missing-plan'},options),{name:'Error',message:'plan synthetic-missing-plan: expected one exact relationship, found 0'})
  await preserved(beforeMapping)
  await edit('travel-memory-days',geoDays.docs[0].id,{moments:geoDays.docs[0].moments.map(m=>({...m,geo:{...f.geo,name:f.geo.name['zh-TW'],approval:null}}))})
  const beforeGeo=await ctx.observe(),geoProbe=await verifyV2GeoRefusal(payload,geoSource,options,v2Importer)
  await preserved(beforeGeo)
  return {memoryId:created.memoryId,roundtrip:true,legacyMemoryEntryRetired:true,...geoProbe,noGeoNormalImport:'PASS_REAL_PAYLOAD_ROUNDTRIP',geoControlMemoryId:control.memoryId,noGeoApplyControl:true,missingBaseRefusal:true,mappingRefusal:'exact missing plan relationship; before geo injection',reconciliation:['Source-only','Current-only','conflict','Missing Base'],legacyParity:'only supported shapes tested'}
 })
 await record('admin',async()=>{
  const before=await ctx.observe(),english=await read('travel-plans',f.targetPlanId,'en')
  const doc=await read('travel-plans',f.targetPlanId),section=doc.planningSections[0],stop=section.geoStops[0]
  await payload.update({...opts,collection:'travel-plans',id:doc.id,data:{summary:'Admin sparse edit'}})
  const sparse=await read('travel-plans',doc.id)
  assert.equal(sparse.planningSections[0].id,section.id);assert.equal(sparse.planningSections[0].geoStops[0].stopKey,stop.stopKey)
  assert.equal((await read('travel-plans',doc.id,'en')).summary,english.summary)
  await preserved(before,await scope('travel-plans',doc.id))
  const owner=['plan',doc.id,section.anchor,stop.stopKey],identity=JSON.stringify(owner)
  // Explicit synthetic fixture Base setup. This is not a product adoption path.
  const current=await read('travel-plans',doc.id)
  const value=review.geoContent(current.planningSections[0].geoStops[0].geo)
  const atlasIdentity=(await load('lib/travel-atlas.ts')).travelAtlasOwnerIdentity(owner)
  await edit('travel-plans',doc.id,{sourceMetadata:{...current.sourceMetadata,baseProjection:{...current.sourceMetadata.baseProjection,atlasGeoV1:{[atlasIdentity]:value}}}})
  const req=await createLocalReq({user:f.admin},payload)
  let target=await review.readGeoReviewTarget(req,'plan',doc.id)
  const beforeApprove=await ctx.observe()
  await review.reviewTravelGeo(req,'plan',doc.id,{action:'approve',expectedRevision:review.geoReviewRevision(target.doc),sectionOrDayKey:section.anchor,itemKey:stop.stopKey,audience:'public'})
  await preserved(beforeApprove,await scope('travel-plans',doc.id))
  target=await review.readGeoReviewTarget(req,'plan',doc.id)
  assert(target.doc.planningSections[0].geoStops[0].geo.approval?.snapshot,'APPROVAL_NOT_BOUND')
  const source={...value,latitude:24.15,longitude:120.68},beforeWrite=await ctx.observe()
  const write=await geoWrite.writeTravelGeo(req,'plan',doc.id,owner,source,review.geoReviewRevision(target.doc))
  assert.equal(write.action,'update');await preserved(beforeWrite,await scope('travel-plans',doc.id))
  target=await review.readGeoReviewTarget(req,'plan',doc.id)
  const saved=target.doc.planningSections[0].geoStops[0].geo
  assert.equal(saved.latitude,24.15);assert.equal(saved.longitude,120.68);assert(!saved.approval?.snapshot,'APPROVAL_NOT_INVALIDATED')
  const beforeInjection=await ctx.observe()
  await assert.rejects(geoWrite.writeTravelGeo(req,'plan',doc.id,owner,{...source,approval:{snapshot:'source-forged'}},review.geoReviewRevision(target.doc)),/Geo requires/)
  await preserved(beforeInjection)
  await edit('travel-plans',doc.id,review.geoRowPatch(target.doc,'plan',owner,{...source,longitude:120.69,name:source.name['zh-TW']}))
  target=await review.readGeoReviewTarget(req,'plan',doc.id)
  let beforeGeo=await ctx.observe()
  assert.equal((await geoWrite.writeTravelGeo(req,'plan',doc.id,owner,source,review.geoReviewRevision(target.doc))).action,'preserve')
  await preserved(beforeGeo)
  beforeGeo=await ctx.observe()
  await assert.rejects(geoWrite.writeTravelGeo(req,'plan',doc.id,owner,{...source,latitude:24.16},review.geoReviewRevision(target.doc)),/Geo reconciliation conflict/)
  await preserved(beforeGeo)
  const metadata=target.doc.sourceMetadata
  await edit('travel-plans',doc.id,{sourceMetadata:{...metadata,baseProjection:{...metadata.baseProjection,atlasGeoV1:{}}}})
  target=await review.readGeoReviewTarget(req,'plan',doc.id);beforeGeo=await ctx.observe()
  assert.equal((await geoWrite.writeTravelGeo(req,'plan',doc.id,owner,source,review.geoReviewRevision(target.doc))).action,'preserve','MISSING_GEO_BASE_NOT_PRESERVED')
  await preserved(beforeGeo)
  let dayTarget=await review.readGeoReviewTarget(req,'memory',f.dayId)
  const dayOwner=['memory',f.memoryId,dayTarget.doc.dayKey,f.momentKey],dayIdentity=(await load('lib/travel-atlas.ts')).travelAtlasOwnerIdentity(dayOwner)
  const dayValue=review.geoContent(dayTarget.doc.moments[0].geo),parentMetadata=dayTarget.parent.sourceMetadata,originalEnvelope=structuredClone(parentMetadata.baseProjection)
  await edit('travel-memories',f.memoryId,{sourceMetadata:{...parentMetadata,baseProjection:{...originalEnvelope,atlasGeoV1:{[dayIdentity]:dayValue}}}})
  dayTarget=await review.readGeoReviewTarget(req,'memory',f.dayId)
  const beforeDay=await ctx.observe(),dayKeys=stableIdentities(dayTarget.doc),daySource={...dayValue,latitude:26,longitude:122}
  assert.equal((await geoWrite.writeTravelGeo(req,'memory',f.dayId,dayOwner,daySource,review.geoReviewRevision(dayTarget.doc,dayTarget.parent))).action,'update')
  await preserved(beforeDay,[...await scope('travel-memories',f.memoryId),...await scope('travel-memory-days',f.dayId)])
  dayTarget=await review.readGeoReviewTarget(req,'memory',f.dayId)
  assert.deepEqual(stableIdentities(dayTarget.doc),dayKeys,'DAY_GEO_IDENTITY_CHANGED')
  assert.equal(dayTarget.doc.moments[0].geo.latitude,26);assert.equal(dayTarget.doc.moments[0].geo.longitude,122)
  const nextEnvelope=dayTarget.parent.sourceMetadata.baseProjection,{atlasGeoV1,...retained}=nextEnvelope
  assert.deepEqual(retained,originalEnvelope,'PARENT_BASE_OTHER_DOMAINS_CHANGED');assert.deepEqual(atlasGeoV1[dayIdentity],daySource)
  await edit('travel-memory-days',f.dayId,review.geoRowPatch(dayTarget.doc,'memory',dayOwner,{...daySource,name:daySource.name['zh-TW'],longitude:123}))
  dayTarget=await review.readGeoReviewTarget(req,'memory',f.dayId)
  const beforeDayConflict=await ctx.observe()
  await assert.rejects(geoWrite.writeTravelGeo(req,'memory',f.dayId,dayOwner,{...daySource,latitude:27},review.geoReviewRevision(dayTarget.doc,dayTarget.parent)),/Geo reconciliation conflict/)
  await preserved(beforeDayConflict)
  return {stableOwner:identity,approvalBinding:true,invalidation:true,sourceApprovalRefused:true,atomicPair:true,parentBase:{owner:dayIdentity,atomicWrite:true,otherLocaleAndDomainEnvelopePreserved:true},reconciliation:['Source-only','Current-only','cross-axis conflict','Missing Base']}
 })
 await record('locales',async()=>{
  for(const [collection,id] of [['travel-plans',f.targetPlanId],['travel-memories',f.memoryId],['travel-memory-days',f.dayId]]) {
   const all=await read(collection,id);assert(all.title['zh-TW'] && all.title.en,'BOTH_LOCALES_REQUIRED')
  }
  return {locales:['zh-TW','en'],omittedLocalePreservation:'checked at supported writer boundaries'}
 })
 await record('non-target',async()=>{
  const before=ctx.fixtureBefore,after=await ctx.observe()
  // Dedicated sentinel trip is compared exactly; per-write global checks above
  // validate other physical rows using exact relationship-owned allowances.
  const other=flattenPhysical(before).filter(row=>row.table==='travel_plans' && row.value.id===f.otherPlanId)
  const found=flattenPhysical(after).filter(row=>row.table==='travel_plans' && row.value.id===f.otherPlanId)
  assert(other.length===1 && isDeepStrictEqual(other,found),'NON_TARGET_TRIP_CHANGED')
  return {nonTargetTrip:f.otherPlanId,history:assertHistoricalRows(before,after),perWriterPhysicalChecks:true}
 })
 return records
}
