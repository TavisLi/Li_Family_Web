import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import {createRequire} from 'node:module'
import {pathToFileURL} from 'node:url'
import {flattenTopLevelFields,formatErrors} from 'payload'
import {importProduct} from './payload-runtime.mjs'
import {assertCase,createAccessClients,graphQuery,accessCases} from './gate-c-access.mjs'
const require=createRequire(import.meta.url),dist=path.dirname(require.resolve('payload'))
const {validateQueryPaths}=await import(pathToFileURL(path.join(dist,'database/queryValidation/validateQueryPaths.js')).href)
const {validateSortQuery}=await import(pathToFileURL(path.join(dist,'database/queryValidation/validateSortQuery.js')).href)
const {TravelMemoryDays}=await importProduct(process.cwd(),'payload/collections/TravelMemoryDays.ts')
const {TravelMemories}=await importProduct(process.cwd(),'payload/collections/TravelMemories.ts')
// Use the actual owning fields/access and Payload's flattened-field representation.
// Restrict to the queried fields; no database adapter or rows participate.
function fields(input) {return input.map(field=>field.fields?{...field,fields:fields(field.fields),flattenedFields:flattenTopLevelFields(fields(field.fields))}:field)}
const collections={}
for(const original of [TravelMemoryDays,TravelMemories]) {
 const selected=fields(original.fields.filter(field=>['memory','sourceMetadata'].includes(field.name)))
 collections[original.slug]={config:{...original,fields:selected,flattenedFields:flattenTopLevelFields(selected)}}
}
async function validation(role,locale,operation,hiddenPath) {
 const req={user:role==='public'?null:{id:1,role},locale,context:{},payload:{collections,config:{localization:false}}}
 const args={collectionConfig:collections['travel-memory-days'].config,overrideAccess:false,req}
 try {
  if(operation==='sort')await validateSortQuery({...args,sort:hiddenPath})
  else await validateQueryPaths({...args,where:{[hiddenPath]:{exists:true}}})
 }catch(error){return error}
}
function response(error,kind) {
 if(kind==='http')return {status:error.status,body:formatErrors(error)}
 if(kind==='graphql')return {status:200,body:{errors:[{message:error.message,path:['result'],extensions:{name:error.name,data:error.data,statusCode:error.status}}]}}
 return {status:error.status,body:{errors:[{name:error.name,message:error.message,data:error.data}]}}
}
for(const role of ['public','family'])for(const locale of ['zh-TW','en','all'])for(const operation of ['where','sort','count'])test(`installed relationship denial remains strict: ${role}/${locale}/${operation}`,async()=>{
 const hiddenPath='memory.sourceMetadata.sourceHash',error=await validation(role,locale,operation,hiddenPath)
 assert.equal(error?.name,'QueryError');assert.equal(error.status,400)
 assert.deepEqual(error.data,[{path:'sourceMetadata.sourceHash'}])
 const c={role,locale,collection:'travel-memory-days',operation,hiddenPath,sideChannel:true}
 for(const kind of ['http','graphql','local-api']) {
  assert.doesNotThrow(()=>assertCase(c,response(error,kind),kind,{}))
  for(const denialPath of ['memory.sourceMetadata.sourceHash','sourceHash','sourceMetadata.baseProjection','other.sourceMetadata.sourceHash']) {
   const bad=response(error,kind),detail=kind==='graphql'?bad.body.errors[0].extensions:bad.body.errors[0]
   bad.body.errors[0].message='The following path cannot be queried: '+denialPath;detail.data=[{path:denialPath}]
   assert.throws(()=>assertCase(c,bad,kind,{}),/UNEXPECTED_DENIAL/)
  }
  const bad=response(error,kind),detail=kind==='graphql'?bad.body.errors[0].extensions:bad.body.errors[0]
  detail.data=[{path:'sourceMetadata.baseProjection'}]
  assert.throws(()=>assertCase(c,bad,kind,{}),/UNEXPECTED_DENIAL_DATA/)
 }
})
test('Admin query validation accepts the same relationship paths',async()=>{
 for(const operation of ['where','sort','count'])assert.equal(await validation('admin','en',operation,'memory.sourceMetadata.sourceHash'),undefined)
})

test('relationship-relative denial is not accepted for unrelated collections or paths',async()=>{
 const error=await validation('public','en','where','memory.sourceMetadata.sourceHash')
 for(const kind of ['http','graphql','local-api'])for(const patch of [
  {collection:'travel-plans',hiddenPath:'memory.sourceMetadata.sourceHash'},
  {collection:'travel-memory-days',hiddenPath:'other.sourceMetadata.sourceHash'},
  {collection:'travel-memory-days',hiddenPath:'memory.sourceMetadata.baseProjection'},
 ])assert.throws(()=>assertCase({role:'public',sideChannel:true,operation:'where',...patch},response(error,kind),kind,{}),/UNEXPECTED_DENIAL_PATH/)
})

test('actual Payload relation validation cannot mutate a case reused by GraphQL',async()=>{
 const f={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyMemoryId:6,familyDayId:7,draftMemoryId:8,parentDraftDayId:9,draftDayId:10,approvedPlanId:11,otherDayId:12}
 const c=accessCases(f).find(c=>c.role==='public' && c.locale==='zh-TW' && c.collection==='travel-memory-days' && c.operation==='where' && c.hiddenPath==='memory.sourceMetadata.sourceHash')
 const before=structuredClone(c),query=graphQuery(c)
 const req={user:null,locale:'zh-TW',context:{},payload:{collections,config:{localization:false}}}
 const payload={find:async args=>{await validateQueryPaths({collectionConfig:collections['travel-memory-days'].config,overrideAccess:false,req,where:args.where});return {docs:[]}}}
 const routes={REST_GET:()=>async()=>Response.json({}),GRAPHQL_POST:()=>async()=>Response.json({})}
 const serve=async()=>({origin:'http://synthetic.invalid',request:async()=>Response.json({}),close:async()=>{}})
 const clients=await createAccessClients({payload,config:{routes:{api:'/api',graphQL:'/graphql'}},fixture:{}},{routes,serve})
 try {const result=await clients.local(c);assert.equal(result.status,400);assert.deepEqual(c,before);assert.equal(graphQuery(c),query)} finally {await clients.close()}
})
