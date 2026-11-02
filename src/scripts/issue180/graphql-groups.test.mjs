import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import {createRequire} from 'node:module'
import {realpath} from 'node:fs/promises'
import {pathToFileURL} from 'node:url'
import {graphql,GraphQLSchema,GraphQLObjectType,GraphQLInt} from 'graphql'
import {importProduct} from './payload-runtime.mjs'
import {assertHidden,assertCase,assertEquivalent} from './gate-c-access.mjs'
const require=createRequire(import.meta.url),payloadDist=path.dirname(require.resolve('payload'))
const graphRequire=createRequire(await realpath(new URL(import.meta.resolve('@payloadcms/next/routes'))))
const graphDist=path.dirname(graphRequire.resolve('@payloadcms/graphql'))
const {buildObjectType}=await import(pathToFileURL(path.join(graphDist,'schema/buildObjectType.js')).href)
const {afterRead}=await import(pathToFileURL(path.join(payloadDist,'fields/hooks/afterRead/index.js')).href)
const {sourceMetadataField}=await importProduct(process.cwd(),'payload/collections/travel-shared-fields.ts')
const {travelGeoField,travelGeoAccessRevisionField}=await importProduct(process.cwd(),'payload/collections/travel-geo.ts')
const fields=[sourceMetadataField(),travelGeoField(),travelGeoAccessRevisionField()]
const config={defaultDepth:0,maxDepth:0,localization:false}
const type=buildObjectType({name:'ProtectedGroups',parentName:'ProtectedGroups',config,fields,graphqlResult:{types:{groupTypes:{},arrayTypes:{},blockTypes:{}}},baseFields:{id:{type:GraphQLInt}}})
const schema=new GraphQLSchema({query:new GraphQLObjectType({name:'Query',fields:{result:{type}}})})
const query='{ result { id geoAccessRevision sourceMetadata { sourceFile sourceHash parserVersion baseProjection } geo { name latitude longitude crs provenance originalCRS approval { snapshot audience confirmedBy } } } }'
const original={id:42,geoAccessRevision:'private-epoch',sourceMetadata:{sourceFile:'private-file',sourceHash:'private-hash',parserVersion:'private-parser',baseProjection:{private:'private-base'}},geo:{name:'Private',latitude:0,longitude:121,crs:'WGS84',provenance:'private-provenance',originalCRS:null,approval:{snapshot:'private-snapshot',audience:'public',confirmedBy:'private-admin'}}}
const fixture={hiddenSentinel:'private-base',geo:{provenance:'private-provenance'}}
async function execute(role,locale,doc=original) {
 const req={user:role==='public'?null:{id:1,role},locale,context:{},payload:{config}}
 const redacted=await afterRead({collection:{fields},doc:structuredClone(doc),depth:0,locale,overrideAccess:false,req,context:{}})
 if(role!=='admin'){assert.equal(Object.hasOwn(redacted,'sourceMetadata'),false);assert.equal(Object.hasOwn(redacted,'geo'),false)}
 const result=await graphql({schema,source:query,rootValue:{result:redacted}})
 assert.equal(result.errors,undefined)
 return {status:200,body:JSON.parse(JSON.stringify(result))}
}
for(const role of ['public','family'])for(const locale of ['zh-TW','en'])test(`installed GraphQL resolver produces only null protected group leaves: ${role}/${locale}`,async()=>{
 const response=await execute(role,locale)
 assert.deepEqual(response.body.data.result.sourceMetadata,{sourceFile:null,sourceHash:null,parserVersion:null,baseProjection:null})
 assert.deepEqual(response.body.data.result.geo,{name:null,latitude:null,longitude:null,crs:null,provenance:null,originalCRS:null,approval:{snapshot:null,audience:null,confirmedBy:null}})
 assert.doesNotThrow(()=>assertCase({role,locale,collection:'travel-plans',operation:'by-id',id:42,visible:true,label:'public-control'},response,'graphql',fixture))
 const changed=structuredClone(original);changed.sourceMetadata.baseProjection={different:'still-private'};changed.geo.latitude=24;changed.geo.provenance='other-private'
 assertEquivalent(response,await execute(role,locale,changed))
})
test('GraphQL null-container recognition rejects actual data and malformed containers',async()=>{
 const clean=await execute('public','en')
 const mutations=[doc=>{doc.sourceMetadata.sourceHash='secret'},doc=>{doc.sourceMetadata.baseProjection={}},doc=>{doc.sourceMetadata.baseProjection=[]},doc=>{doc.sourceMetadata.unknown=null},doc=>{delete doc.sourceMetadata.sourceFile},doc=>{doc.geo.latitude=0},doc=>{doc.geo.name=''},doc=>{doc.geo.latitude=false},doc=>{doc.geo.approval.snapshot='secret'},doc=>{doc.geo.approval={}},doc=>{doc.geo={}},doc=>{doc.geoStops=[]}]
 for(const mutate of mutations){const response=structuredClone(clean);mutate(response.body.data.result);assert.throws(()=>assertHidden(response.body,fixture,'graphql'),/HIDDEN/)}
 for(const kind of ['http','local-api'])assert.throws(()=>assertHidden(clean.body,fixture,kind),/HIDDEN_FIELD/)
})
test('Admin GraphQL retains real protected values for its positive control',async()=>{
 const response=await execute('admin','en')
 assert.equal(response.body.data.result.sourceMetadata.sourceHash,'private-hash')
 assert.equal(response.body.data.result.geo.latitude,0)
 assert.deepEqual(response.body.data.result.sourceMetadata.baseProjection,{private:'private-base'})
})
