import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {importProduct} from './payload-runtime.mjs'
import {assertHidden} from './gate-c-access.mjs'
const require=createRequire(import.meta.url)
const {afterRead}=await import(pathToFileURL(path.join(path.dirname(require.resolve('payload')),'fields/hooks/afterRead/index.js')).href)
const {TravelPlans}=await importProduct(process.cwd(),'payload/collections/TravelPlans.ts')
const field=TravelPlans.fields.find(field=>field.name==='planningSections')
const collection={...TravelPlans,fields:[field]}
const geo={name:{'zh-TW':'合成地點',en:'Synthetic'},latitude:25,longitude:121,provenance:'synthetic-private-provenance',approval:{snapshot:'synthetic-private-base',audience:'public',confirmedBy:'synthetic-admin'}}
async function read(role,locale,stops,overrideAccess=false) {
 const req={user:role==='public'?null:{id:1,role},locale,context:{},payload:{config:{defaultDepth:0,maxDepth:0,localization:{defaultLocale:'zh-TW',locales:[{code:'zh-TW'},{code:'en'}]}}}}
 let doc={id:1,planningSections:[{id:'section-id',anchor:'section',level:2,title:{'zh-TW':'標題',en:'Title'},body:{'zh-TW':'內文',en:'Body'},geoStops:structuredClone(stops)}]}
 doc=await afterRead({collection,context:req.context,depth:0,doc,locale,overrideAccess,req})
 const fieldsOnly=structuredClone(doc)
 // Match the installed find/findByID pipeline: collection hooks follow fields.
 for(const hook of TravelPlans.hooks?.afterRead ?? [])doc=await hook({collection,context:req.context,doc,findMany:false,overrideAccess,req}) ?? doc
 return {fieldsOnly,doc}
}
for(const role of ['public','family'])for(const locale of ['zh-TW','en','all'])test(`installed afterRead omits protected geoStops for ${role}/${locale}`,async()=>{
 let emptyResponse
 for(const stops of [[],[{id:'stop-id',stopKey:'stable-stop',geo}]]) {
  const {fieldsOnly,doc}=await read(role,locale,stops)
  assert.deepEqual(fieldsOnly.planningSections[0].geoStops,[],'Payload normalizes denied arrays to []')
  assertHidden(doc,{hiddenSentinel:geo.approval.snapshot,geo})
  assert.equal(Object.hasOwn(doc.planningSections[0],'geoStops'),false)
  if(emptyResponse)assert.deepEqual(doc,emptyResponse,'Stop existence must not affect the response')
  else emptyResponse=structuredClone(doc)
  assert.equal(doc.planningSections[0].id,'section-id');assert.equal(doc.planningSections[0].anchor,'section')
  assert.deepEqual(doc.planningSections[0].title,fieldsOnly.planningSections[0].title)
 }
})
for(const [role,overrideAccess] of [['admin',false],['public',true]])test(`geoStops remain readable for ${role}/override=${overrideAccess}`,async()=>{
 const {doc}=await read(role,'all',[{id:'stop-id',stopKey:'stable-stop',geo}],overrideAccess)
 assert.equal(doc.planningSections[0].geoStops[0].stopKey,'stable-stop')
 assert.equal(doc.planningSections[0].geoStops[0].geo.provenance,geo.provenance)
 assert.equal(doc.planningSections[0].geoStops[0].geo.approval.snapshot,geo.approval.snapshot)
})

test('Plan afterRead preserves an excluded planningSections selection',async()=>{
 const doc={id:1,title:'Selected public title'},req={user:null}
 let result=doc
 for(const hook of TravelPlans.hooks.afterRead)result=await hook({doc:result,req,overrideAccess:false}) ?? result
 assert.deepEqual(result,doc);assert.equal(Object.hasOwn(result,'planningSections'),false)
})
