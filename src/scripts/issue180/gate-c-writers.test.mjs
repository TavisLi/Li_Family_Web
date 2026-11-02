import test from 'node:test'
import assert from 'node:assert/strict'
import {fixtureSources,importProduct} from './payload-runtime.mjs'
import {stableIdentities,verifyV2GeoRefusal} from './gate-c-writers.mjs'
import {runWriters,requireV2Roundtrip,inspectV2Roundtrip} from './gate-c-writers.mjs'
import {realpath} from 'node:fs/promises'

test('V2 blocks protected geo in another configured locale before any mutation',async()=>{
 const {planMemoryV2,importMemoryV2}=await importProduct(process.cwd(),'scripts/travel-memory-v2-import.ts'),source=fixtureSources().v2Source
 const created=planMemoryV2(source,{days:[],media:[],members:[],plans:[]})
 const memory={id:1,...created.parent.data,sourceMetadata:{baseProjection:created.nextEnvelope}},day={id:2,memory:1,...created.days[0].data}
 let writes=0
 const payload={config:{localization:{localeCodes:['zh-TW','en'],defaultLocale:'zh-TW'}},find:async({collection,locale})=>({docs:collection==='travel-memories'?[memory]:collection==='travel-memory-days'?[locale==='en'||locale==='all'?{...day,moments:day.moments.map(m=>({...m,geo:{name:locale==='all'?{en:'protected','zh-TW':null}:'protected'}}))}:day]:[],hasNextPage:false}),create:async()=>{writes++;throw Error('UNEXPECTED_WRITE')},update:async()=>{writes++;throw Error('UNEXPECTED_WRITE')}}
 payload.db={sessions:{tx:{db:{execute:async()=>({rows:[{locked:true,isolation:'read committed'}]})}}},beginTransaction:async()=> 'tx',rollbackTransaction:async()=>{}}
 const req={payload,context:{}}
 await assert.rejects(importMemoryV2(payload,source,{apply:true,assetRoot:'/unused',sourceFile:'synthetic',environment:'disposable',req}),/BLOCK:.*geo/)
 assert.equal(writes,0)
})

test('v2 roundtrip blocks and saves bounded conflict evidence without treating failure as expected success',async()=>{
 const saved=[],ctx={save:async(name,value)=>{saved.push({name,value});return {path:name+'.json',sha256:'a'.repeat(64)}}},evidence={source:{slug:'synthetic'},readBack:{id:1},ownedDays:[]}
 await requireV2Roundtrip(ctx,{missingBase:false,conflicts:[],parent:{}},evidence);assert.equal(saved.length,0)
 await assert.rejects(requireV2Roundtrip(ctx,{missingBase:false,conflicts:['$.title'],parent:{}},evidence),/V2_ROUNDTRIP_CONFLICT/)
 assert.equal(saved[0].name,'memory-v2-roundtrip-conflict');assert.deepEqual(saved[0].value.conflicts,['$.title']);assert.equal(saved[0].value.readBack.id,1)
 await assert.rejects(requireV2Roundtrip({save:async()=>{throw Error('disk')}},{missingBase:true,conflicts:[]},evidence),/V2_ROUNDTRIP_EVIDENCE_UNKNOWN/)
 await assert.rejects(requireV2Roundtrip(ctx,{missingBase:false,conflicts:['x'.repeat(1100000)]},evidence),/V2_ROUNDTRIP_EVIDENCE_UNKNOWN/)
})
test('v2 roundtrip records actual dry-run read results without extra queries and preserves failures',async()=>{
 let calls=0;const payload={find:async args=>{calls++;return {docs:[{id:7,slug:args.collection}]}}},source={slug:'synthetic'},options={apply:true}
 const result=await inspectV2Roundtrip(payload,source,options,async(p,s,o)=>{assert.equal(o.apply,false);assert.equal(s,source);const found=await p.find({collection:'travel-memories',locale:'zh-TW',where:{slug:{equals:s.slug}}});assert.equal(found.docs[0].id,7);return {missingBase:true,conflicts:['$.summary']}})
 assert.equal(calls,1);assert.equal(result.reads[0].docs[0].id,7);assert.equal(result.repeat.missingBase,true)
 await assert.rejects(inspectV2Roundtrip({find:async()=>{throw Error('READ_FAILED')}},source,options,async p=>p.find({collection:'travel-memories'})),/READ_FAILED/)
 await assert.rejects(inspectV2Roundtrip({find:async()=>({docs:[{data:'x'.repeat(1100000)}]})},source,options,async p=>p.find({collection:'travel-memories'})),/V2_ROUNDTRIP_EVIDENCE_UNKNOWN/)
})
test('v2 read evidence wraps the installed importer dry-run path',async()=>{
 const {importMemoryV2}=await importProduct(process.cwd(),'scripts/travel-memory-v2-import.ts'),f=fixtureSources(),calls=[]
 const payload={find:async args=>{calls.push(args);return {docs:[]}},create:async()=>{throw Error('UNEXPECTED_WRITE')},update:async()=>{throw Error('UNEXPECTED_WRITE')}}
 const {repeat,reads}=await inspectV2Roundtrip(payload,f.v2Source,{apply:true,assetRoot:'/unused',sourceFile:'synthetic',environment:'disposable'},importMemoryV2)
 assert.equal(repeat.missingBase,false);assert.deepEqual(repeat.conflicts,[]);assert(reads.length>0);assert.equal(reads.length,calls.length)
 assert.deepEqual(reads.map(r=>r.collection),calls.map(c=>c.collection))
})

test('plan-seed first English update traverses Payload required localized section validation',async()=>{
 const {beforeValidate}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeValidate/index.js'))
 const {beforeChange}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeChange/index.js'))
 const {text,textarea}=await import(await realpath('node_modules/payload/dist/fields/validations.js'))
 const {TravelPlans}=await importProduct(process.cwd(),'payload/collections/TravelPlans.ts'),section=TravelPlans.fields.find(f=>f.name==='planningSections')
 const fields=section.fields.filter(f=>['title','body'].includes(f.name)).map(f=>({...f,validate:f.name==='title'?text:textarea}))
 const collection={slug:'travel-plans',fields:[{name:'planningSections',type:'array',fields}]},req={locale:'en',context:{},t:k=>k,payload:{config:{localization:{locales:[{code:'zh-TW'},{code:'en'}],localeCodes:['zh-TW','en'],defaultLocale:'zh-TW'}}}}
 let created
 const payload={find:async()=>({docs:[]}),create:async({data})=>{created={...data,id:6,planningSections:data.planningSections.map((s,i)=>({...s,id:'section-'+i}))};return {id:6}},findByID:async()=>created,
  update:async({data,locale})=>{assert.equal(locale,'en');assert.deepEqual(data.planningSections.map(s=>({id:s.id,anchor:s.anchor,level:s.level})),created.planningSections.map(s=>({id:s.id,anchor:s.anchor,level:s.level})));assert.equal(data.planningSections[0].title,'English Synthetic section');assert.equal(data.planningSections[0].body,'English Source body');const doc={id:6,planningSections:created.planningSections.map(s=>({id:s.id,anchor:s.anchor}))},docWithLocales={id:6,planningSections:created.planningSections.map(s=>({id:s.id,title:{'zh-TW':s.title},body:{'zh-TW':s.body}}))};const input=await beforeValidate({collection,data,doc,operation:'update',overrideAccess:true,req,context:{}});await beforeChange({collection,data:input,doc,docWithLocales,operation:'update',overrideAccess:true,req,context:{}});throw Error('STOP_AFTER_VALIDATION')}}
 const ctx={payload,fixture:{...fixtureSources(),admin:{id:1}},root:process.cwd(),observe:async()=>[{table:'travel_route_identities',value:{id:9,slug:'synthetic-writer-plan'}}],assertPreserved:async()=>{},checkpoint:async()=>{},save:async()=>{}}
 await assert.rejects(runWriters(ctx,{focused:true}),/STOP_AFTER_VALIDATION/)
 for(const [field,validate] of [['title',text],['body',textarea]])assert.equal(validate('',{...fields.find(f=>f.name===field),req}),'validation:required')
})

test('deterministic fixtures compile through actual installed writer planners without a DB',async()=>{
 const root=process.cwd(),f=fixtureSources()
 const {buildTravelSeedTarget}=await importProduct(root,'scripts/travel-seed-target.ts')
 const {buildPhase19TravelMemoryBackfillPlan}=await importProduct(root,'scripts/phase19-travel-memory-backfill.ts')
 const {planMemoryV2}=await importProduct(root,'scripts/travel-memory-v2-import.ts')
 const plan=buildTravelSeedTarget(f.legacyPlanSource,f.legacyPlanSource)
 assert.equal(plan.collection,'travel-plans');assert.equal(plan.data.planningSections[0].anchor,'source-section')
 const day=buildPhase19TravelMemoryBackfillPlan({memories:[{id:1,slug:f.legacyMemorySource.slug}],travels:[f.legacyMemorySource],mediaItems:[],mediaIdsBySourcePath:new Map(),currentDays:[],mode:'safe'})
 assert.equal(day.dayCreates.length,1);assert(day.dayCreates[0].moments[0].momentKey)
 const v2=planMemoryV2(f.v2Source,{days:[],media:[],members:[],plans:[]},undefined,'disposable')
 assert(!v2.missingBase);assert.deepEqual(v2.conflicts,[]);assert.equal(v2.parent.action,'create');assert.equal(v2.days[0].action,'create')
 assert.equal(v2.days[0].data.moments[0].momentKey,'source-v2-moment')
})
test('collection hooks and review imports share one scoped TypeScript module graph',async()=>{
 const root=process.cwd(),a=await importProduct(root,'payload/collections/travel-geo.ts'),b=await importProduct(root,'payload/collections/travel-geo.ts')
 assert.equal(a,b)
 const hook=a.travelGeoGuard('plan'),req={context:{}}
 const original={planningSections:[{id:'section',anchor:'s',geoStops:[{id:'stop',stopKey:'k',geo:{latitude:25,longitude:121,approval:null}}]}]}
 const data={planningSections:[{id:'section',anchor:'s',geoStops:[{id:'stop',stopKey:'k',geo:{approval:{snapshot:'synthetic-only'}}}]}]}
 assert.throws(()=>hook({data,originalDoc:original,req}),/explicit Admin review/)
 await b.withTravelGeoApproval(req,async()=>assert.equal(hook({data,originalDoc:original,req}).planningSections[0].geoStops[0].geo.approval.snapshot,'synthetic-only'))
 assert.throws(()=>hook({data,originalDoc:original,req}),/explicit Admin review/)
})
test('geo runtime assertions use actual atomic comparison and preserve Missing Base',async()=>{
 const {reconcileTravelGeo}=await importProduct(process.cwd(),'lib/travel-geo-value.ts'),base=fixtureSources().geo
 assert.equal(reconcileTravelGeo({...base,latitude:26},base,base).action,'update')
 assert.equal(reconcileTravelGeo({...base,latitude:26},base,{...base,longitude:122}).action,'conflict')
 assert.equal(reconcileTravelGeo(base,undefined,{...base,longitude:122}).action,'preserve')
 assert.equal(reconcileTravelGeo(base,base,{...base,longitude:122}).action,'preserve')
})
test('stable identity comparison includes nested row IDs and every domain key',()=>{
 const row={id:1,title:'a',planningSections:[{id:'s',anchor:'section',geoStops:[{id:'g',stopKey:'stop'}]}],moments:[{id:'m',momentKey:'moment',placements:[{id:'p',placementKey:'placement'}]}]}
 assert.deepEqual(stableIdentities(row),stableIdentities({...row,title:'b'}))
 for(const field of ['id','stopKey']) {
  const changed=structuredClone(row);changed.planningSections[0].geoStops[0][field]='changed'
  assert.notDeepEqual(stableIdentities(row),stableIdentities(changed))
 }
})

test('SP5 actual importer refuses protected geo and labels the no-geo planner control UNKNOWN',async()=>{
 const {planMemoryV2,importMemoryV2,readMemoryV2Inventory}=await importProduct(process.cwd(),'scripts/travel-memory-v2-import.ts'),f=fixtureSources()
 const plan=planMemoryV2(f.v2Source,{days:[],media:[],members:[],plans:[]})
 const memory={id:1,...plan.parent.data,sourceMetadata:{baseProjection:plan.nextEnvelope}}
 const day={id:2,memory:1,...plan.days[0].data};day.moments[0].id='moment-row'
 const payloadFor=(m,d)=>({find:async({collection})=>({docs:collection==='travel-memories'?[m]:collection==='travel-memory-days'?[d]:[]}),create:async()=>{throw Error('UNEXPECTED_WRITE')},update:async()=>{throw Error('UNEXPECTED_WRITE')}})
 const options={apply:true,assetRoot:'/unused',sourceFile:'synthetic',environment:'disposable'}
 const geoDay=structuredClone(day);geoDay.moments[0].geo=f.geo
 const result=await verifyV2GeoRefusal(payloadFor(memory,geoDay),f.v2Source,options,{planMemoryV2,importMemoryV2:async(p,s,o)=>{const plan=await importMemoryV2(p,s,{...o,apply:false});if(plan.conflicts.length)throw Error('BLOCK: '+plan.conflicts.join('; '));throw Error('UNEXPECTED_APPLY')},readMemoryV2Inventory})
 assert.equal(result.geoRefusal,true);assert.equal(result.geoRefusalNoMutationCheckedByCaller,true);assert.equal(result.noGeoPlannerControl,true);assert.equal(result.noGeoNormalImport,'UNKNOWN_REQUIRES_PAYLOAD_READBACK')
 await assert.rejects(verifyV2GeoRefusal(payloadFor({...memory,sourceMetadata:{}},geoDay),f.v2Source,options,{planMemoryV2,importMemoryV2,readMemoryV2Inventory}),/GEO_PROBE_MISSING_BASE/)
 await assert.rejects(verifyV2GeoRefusal(payloadFor(memory,geoDay),f.v2Source,options,{planMemoryV2,readMemoryV2Inventory,importMemoryV2:async()=>{throw Error('BLOCK: mapping mismatch')}}),/mapping mismatch/)
})
test('scope registry uses owned observer while Payload access remains denied for every role',async()=>{
 const {TravelRouteIdentities}=await importProduct(process.cwd(),'payload/collections/TravelRouteIdentities.ts')
 const {executeAccess}=await import(await (await import('node:fs/promises')).realpath('node_modules/payload/dist/auth/executeAccess.js'))
 for(const user of [null,{id:1,role:'admin'},{id:2,role:'family'}]) {
  const req={user,t:()=> 'You are not allowed to perform this action.'}
  assert.equal(await TravelRouteIdentities.access.read({req}),false)
  await assert.rejects(executeAccess({req},TravelRouteIdentities.access.read),/You are not allowed to perform this action/ )
 }
 const {writerScope}=await import('./gate-c-writers.mjs')
 const payload={find:async args=>{assert.equal(args.collection,'travel-route-identities');assert.equal(args.overrideAccess,false);return executeAccess({req:{user:args.user,t:()=> 'You are not allowed to perform this action.'}},TravelRouteIdentities.access.read)}}
 const opts={user:{id:1,role:'admin'},overrideAccess:false,locale:'zh-TW',depth:0}
 const calls=[],read=async(collection,id)=>{calls.push({collection,id});return {slug:'synthetic-only'}}
 const observe=async()=>[{table:'travel_route_identities',value:{id:8,slug:'synthetic-only'}},{table:'travel_route_identities',value:{id:9,slug:'other'}},{table:'unrelated',value:{id:10,slug:'synthetic-only'}}]
 assert.deepEqual(await writerScope({read,observe,payload,opts},'travel-plans',5),[{collection:'travel-plans',id:5},{collection:'travel-route-identities',id:8}])
 assert.deepEqual(calls,[{collection:'travel-plans',id:5}])
 assert.deepEqual(await writerScope({read,observe,payload,opts},'travel-memory-days',7),[{collection:'travel-memory-days',id:7}])
 await assert.rejects(writerScope({read:async()=>({slug:'synthetic-only'}),observe:async()=>[{table:'travel_route_identities',value:{id:1,slug:'synthetic-only'}},{table:'travel_route_identities',value:{id:2,slug:'synthetic-only'}}]},'travel-plans',5),/ROUTE_SCOPE_AMBIGUOUS/)
})
test('Memory V2 first English sentinel satisfies installed localized Title validation',async()=>{
 const {v2EnglishSentinel}=await import('./gate-c-writers.mjs')
 const {beforeValidate}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeValidate/index.js')),{beforeChange}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeChange/index.js')),{text,textarea}=await import(await realpath('node_modules/payload/dist/fields/validations.js'))
 const {TravelMemories}=await importProduct(process.cwd(),'payload/collections/TravelMemories.ts')
 const collection={slug:'travel-memories',fields:TravelMemories.fields.filter(f=>['title','summary'].includes(f.name)).map(f=>({...f,validate:f.name==='title'?text:textarea}))},req={locale:'en',context:{},t:k=>k,payload:{config:{localization:{locales:[{code:'zh-TW'},{code:'en'}],localeCodes:['zh-TW','en'],defaultLocale:'zh-TW'}}}}
 const doc={id:1},docWithLocales={id:1,title:{'zh-TW':'Synthetic',en:null}},input=await beforeValidate({collection,data:{...(v2EnglishSentinel??{summary:'English v2 sentinel'})},doc,operation:'update',overrideAccess:true,req,context:{}})
 await beforeChange({collection,data:input,doc,docWithLocales,operation:'update',overrideAccess:true,req,context:{}})
})
