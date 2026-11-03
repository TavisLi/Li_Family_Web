import test from 'node:test'
import assert from 'node:assert/strict'
import {realpath} from 'node:fs/promises'
import {importProduct} from './payload-runtime.mjs'
const {guardTravelGeoIdentity,travelGeoField}=await importProduct(process.cwd(),'payload/collections/travel-geo.ts')
const {geoApprovalValue}=await importProduct(process.cwd(),'payload/collections/travel-geo-review.ts')
const {beforeValidate}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeValidate/index.js'))
const {beforeChange}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeChange/index.js'))
const empty={snapshot:null,audience:null,confirmedBy:null}
for(const kind of ['plan','memory']) {
 const wrap=geo=>kind==='plan'?{planningSections:[{anchor:'s',geoStops:[{stopKey:'one',geo}]}]}:{moments:[{momentKey:'one',geo}]}
 const read=data=>kind==='plan'?data.planningSections[0].geoStops[0].geo:data.moments[0].geo
 const collection={slug:'synthetic',fields:kind==='plan'?[{name:'planningSections',type:'array',fields:[{name:'geoStops',type:'array',fields:[travelGeoField()]}]}]:[{name:'moments',type:'array',fields:[travelGeoField()]}]}
 for(const scenario of ['create-omitted','create-null','update-null','edit-approved','restore','revoke'])test(`${kind}: ${scenario} traverses installed Payload without reviving approval`,async()=>{
  const geo={latitude:25,longitude:121,...(scenario==='create-omitted'?{}:{approval:null})}
  const original=scenario.startsWith('create')?undefined:wrap({...geo,latitude:24,approval:scenario==='update-null'?null:{snapshot:'old',audience:'public',confirmedBy:'1'}})
  const incoming=wrap(geo)
  const req={context:{},payload:{config:{}},t:key=>key}
  const args={collection,data:incoming,doc:structuredClone(original??{}),context:{},operation:original?'update':'create',overrideAccess:true,req}
  await beforeValidate(args)
  const data=guardTravelGeoIdentity(kind,incoming,original,scenario==='revoke',scenario==='restore')
  assert.deepEqual(read(data).approval,empty)
  assert.equal(geoApprovalValue(read(data).approval),null)
  await beforeChange({...args,data,docWithLocales:structuredClone(original??{})})
  assert.equal(read(data).latitude,25)
 })
 test(`${kind}: field-first forged approval still rejected`,async()=>{
  for(const approval of [{snapshot:'forged'},{audience:'public'},{confirmedBy:'1'},'forged']) {
   const data=wrap({approval})
   if(typeof approval==='object')await beforeValidate({collection,data,doc:{},context:{},operation:'create',overrideAccess:true,req:{context:{},payload:{config:{}},t:key=>key}})
   assert.throws(()=>guardTravelGeoIdentity(kind,data),/explicit Admin review/)
  }
 })
 test(`${kind}: unrelated edit preserves a valid approval`,()=>{
  const approval={snapshot:'valid',audience:'family',confirmedBy:'1'},original=wrap({latitude:25,approval})
  assert.deepEqual(read(guardTravelGeoIdentity(kind,wrap({latitude:25}),original)).approval,approval)
 })
}
test('actual loadFixture first plan follows field validation then collection guard then field change',async()=>{
 const {loadFixture}=await import('./payload-runtime.mjs')
 const {readFile}=await import('node:fs/promises')
 const operation=await readFile(await realpath('node_modules/payload/dist/collections/operations/create.js'),'utf8')
 assert(operation.indexOf('data = await beforeValidate(')<operation.indexOf('collectionConfig.hooks.beforeValidate?.length'))
 const collection={slug:'synthetic',fields:[{name:'planningSections',type:'array',fields:[{name:'geoStops',type:'array',fields:[travelGeoField()]}]}]}
 let users=0,plans=0
 const payload={create:async args=>{
  if(args.collection==='users')return {...args.data,id:++users}
  assert.equal(args.collection,'travel-plans');plans++
  const input={collection,data:structuredClone(args.data),doc:{},context:{},operation:'create',overrideAccess:false,req:{context:{},payload:{config:{}},t:key=>key}}
  await beforeValidate(input)
  input.data=guardTravelGeoIdentity('plan',input.data)
  await beforeChange({...input,docWithLocales:{}})
  assert.equal(geoApprovalValue(input.data.planningSections[0].geoStops[0].geo.approval),null)
  throw Error('STOP_AFTER_VALIDATED_PLAN_NO_DATABASE')
 }}
 await assert.rejects(loadFixture({payload,root:process.cwd()}),/STOP_AFTER_VALIDATED_PLAN_NO_DATABASE/)
 assert.equal(users,2);assert.equal(plans,1)
})
