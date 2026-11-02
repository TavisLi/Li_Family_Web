import test from 'node:test'
import assert from 'node:assert/strict'
import {realpath} from 'node:fs/promises'
import {importProduct,fixtureSources} from './payload-runtime.mjs'
const {travelGeoGuard,travelGeoStopsField}=await importProduct(process.cwd(),'payload/collections/travel-geo.ts')
const {buildTravelSeedTarget,writeTravelSeedTarget}=await importProduct(process.cwd(),'scripts/travel-seed-target.ts')
const {beforeValidate}=await import(await realpath('node_modules/payload/dist/fields/hooks/beforeValidate/index.js'))
test('actual plan-seed create accepts Payload null optional geoStops',async()=>{
 const source=fixtureSources().legacyPlanSource,target=buildTravelSeedTarget(source,source),req={context:{},payload:{config:{}},t:key=>key}
 const result=await writeTravelSeedTarget({target,mode:'safe',store:{find:async()=>({docs:[]}),create:async({data})=>{
  const collection={slug:'synthetic',fields:[{name:'planningSections',type:'array',fields:[travelGeoStopsField()]}]}
  await beforeValidate({collection,data,doc:{},context:{},operation:'create',overrideAccess:true,req})
  assert(data.planningSections[0].geoStops == null)
  const saved=travelGeoGuard('plan')({data,originalDoc:{},operation:'create',req})
  assert.deepEqual(saved.planningSections[0].geoStops,[]);return {id:1}
 }}})
 assert.equal(result.action,'create')
})
test('empty optional arrays accept null; existing rows and malformed values remain protected',()=>{
 const req={context:{}},hook=travelGeoGuard('memory')
 for(const placements of [null,undefined])assert.doesNotThrow(()=>hook({data:{moments:[{momentKey:'m',placements}]},originalDoc:{},operation:'create',req}))
 for(const value of [null,undefined,false,{},''])assert.throws(()=>hook({data:{moments:value},originalDoc:{id:1,moments:[{momentKey:'m',geo:{latitude:25}}]},operation:'update',req}),/removal/)
 for(const placements of [null,undefined])assert.throws(()=>hook({data:{moments:[{momentKey:'m',placements}]},originalDoc:{id:1,moments:[{momentKey:'m',placements:[{placementKey:'p'}]}]},operation:'update',req}),/removal/)
})
