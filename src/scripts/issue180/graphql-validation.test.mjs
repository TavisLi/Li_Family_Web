import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {realpath} from 'node:fs/promises'
import {buildConfig} from 'payload'
import {postgresAdapter} from '@payloadcms/db-postgres'
import {lexicalEditor} from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import {importProduct} from './payload-runtime.mjs'
import {graphValidation,graphQuery,assertCase,accessCases,assertGraphSchemaControl} from './gate-c-access.mjs'
const require=createRequire(await realpath(new URL(import.meta.resolve('@payloadcms/next/routes'))))
const {configToSchema}=await import(require.resolve('@payloadcms/graphql'))
const {createHandler}=await import(require.resolve('graphql-http/lib/use/fetch'))
const collections=[]
for(const name of ['Users','Media','TravelPlans','TravelMemories','TravelMemoryDays','TravelRouteIdentities']) {
 const collection=(await importProduct(process.cwd(),'payload/collections/'+name+'.ts'))[name]
 collections.push(name==='Media'?{...collection,upload:{...collection.upload,disableLocalStorage:true,staticDir:'/private/tmp/issue180-db-free-unused-uploads'}}:collection)
}
// Config/schema construction only. Never call getPayload or initialize the adapter.
// The offline guard rejects any accidental connection or credential input.
const config=await buildConfig({collections,secret:'synthetic-db-free-only',plugins:[],admin:{user:'users'},routes:{api:'/api',graphQL:'/graphql'},localization:{locales:['zh-TW','en'],defaultLocale:'zh-TW',fallback:true},custom:{supportedLocales:['zh-TW','en']},editor:lexicalEditor(),db:postgresAdapter({push:false,disableCreateDatabase:true,pool:{connectionString:'postgresql://postgres@localhost:1/issue180_db_free'}}),sharp,telemetry:false,typescript:{autoGenerate:false},graphQL:{disablePlaygroundInProduction:true}})
const {schema,validationRules}=configToSchema(config)
const handler=createHandler({schema,validationRules:(_,args,defaultRules)=>defaultRules.concat(validationRules(args))})
const preflight=await graphValidation(config)
const f={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyMemoryId:6,familyDayId:7,draftMemoryId:8,parentDraftDayId:9,draftDayId:10,approvedPlanId:11,otherDayId:12}
test('installed handler and preflight agree on every generated schema rejection',async t=>{
 let rejected=0
 for(const row of accessCases(f)) {
  const c={...row,...(row.operation==='version-by-id'?{versionId:21}:{})},schemaErrors=preflight(c)
  assertGraphSchemaControl(c,schemaErrors)
  if(!schemaErrors.length)continue
  const response=await handler(new Request('http://synthetic.invalid/graphql',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/graphql-response+json'},body:JSON.stringify({query:graphQuery(c)})}))
  const body=await response.json()
  assert.equal(response.status,400)
  assert.deepEqual(body.errors.map(error=>error.message).sort(),[...schemaErrors].sort(),JSON.stringify({role:c.role,locale:c.locale,collection:c.collection,operation:c.operation,label:c.label}))
  assert.doesNotThrow(()=>assertCase({...c,schemaErrors},{status:response.status,body},'graphql',{}))
  rejected++
 }
 assert(rejected>100)
 t.diagnostic(`matched ${rejected} real installed-handler validation responses; no resolvers or DB initialized`)
})
