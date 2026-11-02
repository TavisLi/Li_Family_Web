import {accessFailureDiagnostic} from './access-diagnostic.mjs'
import assert from 'node:assert/strict'
import { Forbidden,NotFound } from 'payload'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { isDeepStrictEqual } from 'node:util'
import { realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const roles=['public','family','admin'],locales=['zh-TW','en','all']
const graphNames={'travel-plans':['TravelPlan','TravelPlans'],'travel-memories':['TravelMemory','TravelMemories'],'travel-memory-days':['TravelMemoryDay','TravelMemoryDays']}
const privateKeys=new Set(['geo','geoStops','geoAccessRevision','sourceMetadata'])
const maxBody=2*1024*1024

function nullGraphQLGroup(key,value) {
 const exact=(node,keys)=>node && typeof node==='object' && !Array.isArray(node) && isDeepStrictEqual(Object.keys(node).sort(),[...keys].sort())
 if(key==='sourceMetadata')return exact(value,['sourceFile','sourceHash','parserVersion','baseProjection']) && Object.values(value).every(item=>item===null)
 if(key==='geo')return exact(value,['name','latitude','longitude','crs','provenance','originalCRS','approval']) && Object.entries(value).every(([name,item])=>name==='approval'?exact(item,['snapshot','audience','confirmedBy']) && Object.values(item).every(leaf=>leaf===null):item===null)
 return false
}
export function assertHidden(value,fixture,kind) {
 const sentinels=[fixture.hiddenSentinel,fixture.geo?.provenance,fixture.geoAlternate?.provenance].filter(Boolean)
 function visit(node) {
  if(typeof node==='string') for(const marker of sentinels) assert(!node.includes(marker),'HIDDEN_VALUE_LEAK')
  if(node && typeof node==='object') for(const [key,child] of Object.entries(node)) {
   // Payload's GraphQL group resolver reconstructs absent groups. Only its exact
   // selected all-null shape is data-free; REST/Local keep the omission contract.
   assert(!privateKeys.has(key) || child==null || (kind==='graphql' && nullGraphQLGroup(key,child)),'HIDDEN_FIELD_LEAK:'+key)
   visit(child)
  }
 }
 visit(value)
}
export function assertEquivalent(before,after) {assert(isDeepStrictEqual(before,after),'HIDDEN_VALUE_RESPONSE_DIFFERENCE')}
// Exact independent psql counts, never inferred from the API response under test.
// DISTINCT counts owning documents once across multiple matching child rows.
export async function bindAccessCounts(cases,sql) {
 const cache=new Map()
 for(const c of cases.filter(c=>c.operation==='count' && c.sideChannel && c.role==='admin')) {
  const table={'travel-plans':'travel_plans','travel-memories':'travel_memories','travel-memory-days':'travel_memory_days'}[c.collection]
  assert(table,'ACCESS_COUNT_COLLECTION_UNKNOWN')
  assert(typeof c.hiddenPath==='string','ACCESS_COUNT_PATH_UNKNOWN')
  const columns={'sourceMetadata.sourceHash':'source_metadata_source_hash','sourceMetadata.baseProjection':'source_metadata_base_projection','geoAccessRevision':'geo_access_revision'}
  let joins='',column=columns[c.hiddenPath] && 'owner.'+columns[c.hiddenPath]
  if(c.collection==='travel-plans' && c.hiddenPath.startsWith('planningSections.geoStops.')) {
   const name={'planningSections.geoStops.geo.latitude':'geo_latitude','planningSections.geoStops.geo.provenance':'geo_provenance','planningSections.geoStops.stopKey':'stop_key'}[c.hiddenPath]
   if(name){joins=' JOIN public.travel_plans_planning_sections section ON section._parent_id=owner.id JOIN public.geo_stops child ON child._parent_id=section.id';column='child.'+name}
  }
  if(c.collection==='travel-memory-days' && c.hiddenPath.startsWith('moments.geo.')) {
   const name={'moments.geo.latitude':'geo_latitude','moments.geo.provenance':'geo_provenance'}[c.hiddenPath]
   if(name){joins=' JOIN public.travel_memory_days_moments child ON child._parent_id=owner.id';column='child.'+name}
  }
  if(c.collection==='travel-memory-days' && c.hiddenPath==='memory.sourceMetadata.sourceHash') {
   joins=' JOIN public.travel_memories parent ON parent.id=owner.memory_id';column='parent.source_metadata_source_hash'
  }
  assert(column,'ACCESS_COUNT_PATH_UNKNOWN')
  const key=c.collection+':'+c.hiddenPath
  c.expectedCountSQL=`SELECT count(DISTINCT owner.id) FROM public.${table} owner${joins} WHERE ${column} IS NOT NULL`
  if(!cache.has(key)) {
   const count=await sql(c.expectedCountSQL)
   assert(Number.isSafeInteger(count) && count>=0,'ACCESS_COUNT_OBSERVER_UNKNOWN');cache.set(key,count)
  }
  c.expectedCount=cache.get(key)
 }
 return cases
}
export function assertAccessCaseDefinitions(cases) {
 for(const c of cases) {
  if(c.operation==='count' && (!c.sideChannel || c.role==='admin'))assert(Number.isSafeInteger(c.expectedCount) && c.expectedCount>=0,'ACCESS_COUNT_EXPECTATION_MISSING:'+c.collection+':'+c.label)
  if(c.operation==='draft')assert(c.expectedId!=null && typeof c.visible==='boolean','ACCESS_DRAFT_EXPECTATION_MISSING')
  if(c.operation==='by-id')assert(c.id!=null && typeof c.visible==='boolean','ACCESS_DOCUMENT_EXPECTATION_MISSING')
  if(c.operation==='version-by-id')assert(c.versionId!=null,'ACCESS_VERSION_EXPECTATION_MISSING')
  if(c.operation==='list-all')assert(Array.isArray(c.expectedVisibleIds) && Array.isArray(c.expectedHiddenIds),'ACCESS_LIST_EXPECTATION_MISSING')
 }
}

const encode=value=>JSON.stringify(value)
function appendQuery(params,value,prefix) {
 if(value && typeof value==='object') for(const [key,child] of Object.entries(value)) appendQuery(params,child,prefix?`${prefix}[${key}]`:key)
 else if(value!==undefined) params.set(prefix,String(value))
}

// A wire transport over an owned, ephemeral IPv4 loopback listener. No Next dev
// server, shell, external endpoint or replacement access policy participates.
export async function serveAccessRoutes(dispatch,{timeoutMs=15000,signal}={}) {
 const server=createServer(async(req,res)=>{
  try {
   assert(['GET','POST'].includes(req.method),'ACCESS_METHOD_DENIED')
   const chunks=[];let length=0
   for await(const chunk of req) {length+=chunk.length;assert(length<=maxBody,'ACCESS_BODY_LIMIT');chunks.push(chunk)}
   const request=new Request(`http://127.0.0.1:${server.address().port}${req.url}`,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})})
   const response=await dispatch(request)
   res.statusCode=response.status
   for(const [key,value] of response.headers) res.setHeader(key,value)
   const body=Buffer.from(await response.arrayBuffer());assert(body.length<=maxBody,'ACCESS_RESPONSE_LIMIT');res.end(body)
  } catch {res.statusCode=500;res.end('{"error":"ACCESS_ROUTE_FAILURE"}')}
 })
 server.requestTimeout=timeoutMs;server.headersTimeout=timeoutMs;server.keepAliveTimeout=1
 const close=async()=>{server.closeAllConnections();if(server.listening) await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()))}
 try {server.listen(0,'127.0.0.1');await once(server,'listening')} catch(error) {await close();throw error}
 const origin=`http://127.0.0.1:${server.address().port}`
 return {origin,request:(url,init)=>fetch(url,{...init,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs)}),close}
}

export async function createAccessClients({payload,config,fixture,options={}},{routes,serve=serveAccessRoutes}={}) {
 routes ??= await import('@payloadcms/next/routes')
 config=await config
 const get=routes.REST_GET(config),post=routes.GRAPHQL_POST(config)
 const api=config.routes.api,graphPath=api+config.routes.graphQL
 const transport=await serve(request=>{
  const url=new URL(request.url)
  if(url.pathname===graphPath) return post(request)
  assert(url.pathname.startsWith(api+'/'),'ACCESS_ROUTE_OUTSIDE_API')
  return get(request,{params:Promise.resolve({slug:url.pathname.slice(api.length+1).split('/').map(decodeURIComponent)})})
 },{timeoutMs:options.requestTimeoutMs ?? 15000,signal:options.signal})
 const headers=role=>{
  const result={'DisableAutologin':'true','Content-Type':'application/json'}
  if(role!=='public') {const token=fixture[role+'Token'];assert(typeof token==='string' && token,'ACCESS_AUTH_TOKEN_MISSING');result.Authorization='JWT '+token}
  return result
 }
 async function json(response) {
  const body=await response.text();assert(Buffer.byteLength(body)<=maxBody,'ACCESS_RESPONSE_LIMIT')
  return {status:response.status,body:JSON.parse(body)}
 }
 return {
  close:transport.close,
  http:async({role,collection,id,versionId,operation,locale,fallback,...query})=>{
   const params=new URLSearchParams();appendQuery(params,{locale,'fallback-locale':fallback ?? 'none',depth:operation==='relationship'?3:0,limit:100,...query})
   const tail=operation==='versions'?'/versions':operation==='version-by-id'?'/versions/'+versionId:operation==='count'?'/count':id!=null?'/'+id:''
   return json(await transport.request(`${transport.origin}${api}/${collection}${tail}?${params}`,{method:'GET',headers:headers(role)}))
  },
  graphql:async({role,query})=>json(await transport.request(transport.origin+graphPath,{method:'POST',headers:{...headers(role),Accept:'application/graphql-response+json'},body:encode({query})})),
  local:async({role,operation,collection,id,versionId,locale,fallback,...query})=>{
   const args={collection,locale,fallbackLocale:fallback ?? false,depth:operation==='relationship'?3:0,limit:100,...structuredClone(query),overrideAccess:false,user:role==='public'?null:fixture[role]}
   try {
    const body=operation==='versions'?await payload.findVersions(args):operation==='version-by-id'?await payload.findVersionByID({...args,id:versionId}):operation==='count'?await payload.count(args):id!=null?await payload.findByID({...args,id}):await payload.find(args)
    return {status:200,body}
   } catch(error) {
    const status=error.status ?? error.statusCode
    assert([400,401,403,404].includes(status),'UNEXPECTED_LOCAL_API_ERROR:'+error.name)
    return {status,body:{errors:[{name:error.name,message:error.message,data:error.data ?? null}]}}
   }
  },
 }
}

export function accessCases(f,physical) {
 const inventory=collection=>physical?.filter(row=>row.table===collection.replaceAll('-','_')).flatMap(row=>row.key==='rows'?row.value:[row.value])
 const observerVisible=(row,role,collection)=>{
  if(role==='admin')return true
  if(row._status!=='published')return false
  const parent=collection==='travel-memory-days'?inventory('travel-memories').find(parent=>String(parent.id)===String(row.memory_id)):row
  assert(parent,'ACCESS_OBSERVER_PARENT_MISSING')
  return parent._status==='published' && (role==='family' || parent.is_private===false)
 }

 const docs=[['travel-plans',f.publicPlanId,'published-public',r=>true],['travel-plans',f.familyPlanId,'published-family',r=>r!=='public'],['travel-plans',f.draftPlanId,'draft-plan',r=>r==='admin'],['travel-memories',f.memoryId,'published-parent',r=>true],['travel-memories',f.familyMemoryId,'published-family-parent',r=>r!=='public'],['travel-memories',f.draftMemoryId,'draft-parent',r=>r==='admin'],['travel-memory-days',f.dayId,'published-day-public-parent',r=>true],['travel-memory-days',f.familyDayId,'published-day-family-parent',r=>r!=='public'],['travel-memory-days',f.parentDraftDayId,'published-day-draft-parent',r=>r==='admin'],['travel-memory-days',f.draftDayId,'draft-day-published-parent',r=>r==='admin']]
 const result=[]
 docs.push(['travel-plans',f.approvedPlanId,'published-approved-public',()=>true],['travel-memory-days',f.otherDayId,'published-approved-day-public-parent',()=>true])
 for(const role of roles)for(const locale of locales) {
  for(const [collection,id,label,visible] of docs) {
   assert(id!=null,'ACCESS_FIXTURE_ID_MISSING:'+label)
   result.push({role,locale,collection,id,label,operation:'by-id',visible:visible(role)})
   if(locale==='zh-TW')result.push({role,locale,fallback:'en',collection,id,label:label+'-fallback-en',operation:'by-id',visible:visible(role)})
   result.push({role,locale,collection,operation:'count',label:label+'-count',where:{id:{equals:id}},expectedCount:visible(role)?1:0})
   result.push({role,locale,collection,label:label+'-draft-query',where:{id:{equals:id}},draft:true,operation:'draft',visible:visible(role),expectedId:id})
  }
  for(const collection of Object.keys(graphNames)) {
   const collectionDocs=docs.filter(row=>row[0]===collection)
   result.push({role,locale,collection,operation:'list-all',label:'unfiltered-list',expectedVisibleIds:physical?inventory(collection).filter(row=>observerVisible(row,role,collection)).map(row=>row.id):collectionDocs.filter(row=>row[3](role)).map(row=>row[1]),expectedHiddenIds:physical?inventory(collection).filter(row=>!observerVisible(row,role,collection)).map(row=>row.id):collectionDocs.filter(row=>!row[3](role)).map(row=>row[1])})
   const target=collection==='travel-plans'?f.publicPlanId:collection==='travel-memories'?f.memoryId:f.dayId
   for(const operation of ['find','relationship','count','versions','version-by-id']) result.push({role,locale,collection,operation,label:operation,...(operation==='count'?{expectedCount:1}:{}),...(operation==='relationship'?{id:target}:{}),...(operation.startsWith('version')?{where:{parent:{equals:target}}}:{where:{id:{equals:target}}})})
   const paths=collection==='travel-plans'?['planningSections.geoStops.geo.latitude','planningSections.geoStops.geo.provenance','planningSections.geoStops.stopKey','sourceMetadata.sourceHash','sourceMetadata.baseProjection','geoAccessRevision']:collection==='travel-memory-days'?['moments.geo.latitude','moments.geo.provenance','sourceMetadata.sourceHash','sourceMetadata.baseProjection','geoAccessRevision','memory.sourceMetadata.sourceHash']:['sourceMetadata.sourceHash','sourceMetadata.baseProjection','geoAccessRevision']
   for(const hiddenPath of paths) {
    result.push({role,locale,collection,operation:'where',label:'where:'+hiddenPath,hiddenPath,where:{[hiddenPath]:{exists:true}},sideChannel:true})
    result.push({role,locale,collection,operation:'sort',label:'sort:'+hiddenPath,hiddenPath,sort:hiddenPath,sideChannel:true})
    result.push({role,locale,collection,operation:'count',label:'count:'+hiddenPath,hiddenPath,where:{[hiddenPath]:{exists:true}},sideChannel:true})
   }
  }
 }
 return result
}
const geoSelection='geo { name latitude longitude crs provenance originalCRS approval { snapshot audience confirmedBy } }'
const sourceSelection='geoAccessRevision sourceMetadata { sourceFile sourceHash parserVersion baseProjection }'
function selection(collection,relationship=false) {
 if(collection==='travel-plans') return `id title _status isPrivate ${sourceSelection} planningSections { anchor title geoStops { stopKey ${geoSelection} } }`
 if(collection==='travel-memories') return `id title _status isPrivate ${sourceSelection}`
 return `id title _status dayKey ${sourceSelection} moments { momentKey title ${geoSelection} } memory { id title _status isPrivate ${relationship?sourceSelection:''} }`
}
function graphValue(value) {
 if(Array.isArray(value))return '['+value.map(graphValue).join(',')+']'
 if(value && typeof value==='object') return '{'+Object.entries(value).map(([key,item])=>key.replaceAll('.','_')+':'+graphValue(item)).join(',')+'}'
 return typeof value==='string'?encode(value):String(value)
}
export function graphQuery(c) {
 const [singular,plural]=graphNames[c.collection],locale=c.locale.replaceAll('-','_')
 // Locale enum tokens are emitted separately from JSON string values.
 const localeArgs=`locale:${locale},fallbackLocale:${c.fallback?.replaceAll('-','_') ?? 'none'}`
 const fields=selection(c.collection,c.operation==='relationship')
 const versionFields=fields.replace(/^id /,'')
 if(c.operation==='version-by-id') return `query { result:version${singular}(id:${graphValue(c.versionId)},${localeArgs}) { id version { ${versionFields} } } }`
 if(c.operation==='versions') return `query { result:versions${plural}(${localeArgs},limit:100,where:${graphValue(c.where)}) { totalDocs docs { id version { ${versionFields} } } } }`
 if(c.id!=null) return `query { result:${singular}(id:${graphValue(c.id)},${localeArgs}${c.draft?',draft:true':''}) { ${fields} } }`
 const where=c.where?',where:'+graphValue(c.where):'',sort=c.sort?',sort:'+encode(c.sort):'',draft=c.draft?',draft:true':''
 if(c.operation==='count') return `query { result:count${plural}(locale:${locale}${where}) { totalDocs } }`
 return `query { result:${plural}(${localeArgs},limit:100${where}${sort}${draft}) { totalDocs limit page totalPages pagingCounter hasNextPage hasPrevPage nextPage prevPage docs { ${fields} } } }`
}
export async function graphValidation(config) {
 const require=createRequire(await realpath(fileURLToPath(import.meta.resolve('@payloadcms/next/routes'))))
 const {configToSchema}=await import(require.resolve('@payloadcms/graphql'))
 const {parse,validate,specifiedRules}=await import('graphql'),{schema,validationRules}=configToSchema(await config)
 return c=>{const document=parse(graphQuery(c));return validate(schema,document,specifiedRules.concat(validationRules({schema,document,variableValues:{}}))).map(error=>error.message)}
}
export function assertGraphSchemaControl(c,schemaErrors) {
 assert(!schemaErrors.length || schemaErrors.every(message=>(c.sideChannel && /^Field .* is not defined by type /.test(message)) || (c.locale==='all' && (/^Value "all" does not exist in .* enum/.test(message) || message==='Argument "locale" has invalid value all.'))),'INVALID_POSITIVE_GRAPHQL_CONTROL:'+JSON.stringify(schemaErrors))
}

function resultBody(response,kind) {return kind==='graphql'?response.body.data?.result:response.body}
function denied(response,kind) {return response.status>=400 || (kind==='graphql' && Boolean(response.body.errors?.length))}
function assertDenial(c,response,kind) {
 const errors=response.body.errors
 assert(Array.isArray(errors) && errors.length===1,'UNEXPECTED_DENIAL_REJECTION')
 const error=errors[0],details=kind==='graphql'?error.extensions:error
 const status=kind==='graphql'?details?.statusCode:response.status
 assert(kind==='graphql'?response.status===200 && isDeepStrictEqual(error.path,['result']):[400,403,404].includes(response.status),'UNEXPECTED_DENIAL_STATUS')
 if(c.sideChannel) {
  assert.equal(status,400,'UNEXPECTED_DENIAL_STATUS')
  assert.equal(details?.name,'QueryError','UNEXPECTED_DENIAL_TYPE')
  // Payload validates this relationship hop in the target collection's namespace.
  const denialPath=c.collection==='travel-memory-days' && c.hiddenPath==='memory.sourceMetadata.sourceHash'?'sourceMetadata.sourceHash':c.hiddenPath
  assert.equal(error.message,'The following path cannot be queried: '+denialPath,'UNEXPECTED_DENIAL_PATH')
  assert(isDeepStrictEqual(details.data,[{path:denialPath}]),'UNEXPECTED_DENIAL_DATA')
 } else {
  const expected=c.operation==='versions'||c.operation==='version-by-id'?new Forbidden():new NotFound()
  assert.equal(status,expected.status,'UNEXPECTED_DENIAL_STATUS')
  assert.equal(error.message,expected.message,'UNEXPECTED_DENIAL_MESSAGE')
  if(kind!=='http')assert.equal(details?.name,expected.name,'UNEXPECTED_DENIAL_TYPE')
 }
}
export function assertCase(c,response,kind,fixture) {
 const body=resultBody(response,kind)
 if(c.role!=='admin')assertHidden(response.body,fixture,kind)
 const protectedVersion=c.operation==='versions'||c.operation==='version-by-id'
 if(kind==='graphql' && c.schemaErrors?.length) {
  assert((c.sideChannel || c.locale==='all') && response.status===400,'UNEXPECTED_GRAPHQL_REJECTION_STATUS')
  const errors=response.body.errors ?? []
  assert(isDeepStrictEqual(errors.map(error=>error.message).sort(),[...c.schemaErrors].sort()) && errors.every(error=>!error.path && !error.extensions?.statusCode),'UNEXPECTED_GRAPHQL_REJECTION')
  return
 }
 if(c.sideChannel && c.role!=='admin') {assertDenial(c,response,kind);return}
 if(protectedVersion && c.role!=='admin') {assertDenial(c,response,kind);return}
 if(c.visible===false) {
  if(c.operation==='draft') {assert(!denied(response,kind),'DRAFT_QUERY_UNEXPECTED_ERROR');assert.equal(body.docs.length,0,'DRAFT_COLLECTION_LEAK');assert.equal(body.totalDocs,0,'DRAFT_COUNT_LEAK')}
  else if(kind==='graphql' && !denied(response,kind))assert.equal(body,null,'INACCESSIBLE_DOCUMENT_RETURNED:'+c.label)
  else assertDenial(c,response,kind)
  return
 }
 assert(!denied(response,kind),'ACCESS_EXPECTED_SUCCESS:'+c.label+':'+encode(response.body))
 assert(body!=null,'ACCESS_EMPTY_RESULT:'+c.label)
 if(c.operation==='list-all') {
  assert(Array.isArray(body.docs),'UNFILTERED_LIST_INCOMPLETE')
  const ids=body.docs.map(row=>String(row.id)).sort(),expected=c.expectedVisibleIds.map(String).sort()
  assert(isDeepStrictEqual(ids,expected),'UNFILTERED_LIST_MEMBERSHIP')
  assert.equal(body.totalDocs,expected.length,'UNFILTERED_LIST_TOTAL')
  for(const [key,value] of Object.entries({limit:100,page:1,totalPages:Math.max(1,Math.ceil(expected.length/100)),pagingCounter:1,hasNextPage:false,hasPrevPage:false,nextPage:null,prevPage:null}))assert.equal(body[key],value,'UNFILTERED_LIST_PAGINATION:'+key)
 }
 if(c.operation==='count'){assert(Number.isSafeInteger(c.expectedCount) && c.expectedCount>=0,'ACCESS_COUNT_EXPECTATION_MISSING');assert.equal(body.totalDocs,c.expectedCount,'DOCUMENT_COUNT_MISMATCH')}
 if(c.operation==='draft'){assert.equal(body.totalDocs,1,'DRAFT_COUNT_MISMATCH');assert.equal(body.docs.length,1,'DRAFT_COUNT_MISMATCH')}
 if(c.visible===true) assert(c.operation==='draft'?body.docs.some(doc=>String(doc.id)===String(c.expectedId)):String(body.id)===String(c.id),'ACCESS_EXPECTED_DOCUMENT_MISSING')
 if(c.role==='admin' && ['published-public','published-day-public-parent','published-approved-public','published-approved-day-public-parent'].includes(c.label)) {
  assert(body.sourceMetadata?.baseProjection,'ADMIN_BASE_CONTROL_MISSING')
  const raw=c.collection==='travel-plans'?body.planningSections?.flatMap(s=>s.geoStops ?? []).find(s=>s.geo)?.geo:body.moments?.find(m=>m.geo)?.geo
  assert(raw?.latitude!=null && raw?.provenance,'ADMIN_GEO_CONTROL_MISSING')
  if(c.label.includes('approved'))assert(raw.approval?.snapshot && raw.approval.audience==='public','APPROVED_PUBLIC_FIXTURE_MISSING')
 }
}

export async function assertAccessResponse(ctx,c,response,kind,fixture,beforeResponse) {
 try {if(beforeResponse){assertHidden(response.body,fixture,kind);assertEquivalent(beforeResponse,response)}else assertCase(c,response,kind,fixture)} catch(error) {
  try {
   const ref=await ctx.save('access-assertion-failure',accessFailureDiagnostic(c,response,kind,error,beforeResponse))
   assert(ref.path==='access-assertion-failure.json' && /^[a-f0-9]{64}$/.test(ref.sha256),'ACCESS_DIAGNOSTIC_REFERENCE')
   error.message+=' [access evidence: '+ref.path+' sha256='+ref.sha256+']'
  }catch {error.message+=' [access evidence UNKNOWN: SAVE_OR_READBACK_FAILED]'}
  throw error
 }
}

function sqlLiteral(value) {return value==null?'NULL':"'"+String(value).replaceAll("'","''")+"'"}
function fixtureId(value) {assert(Number.isSafeInteger(Number(value)) && Number(value)>0,'ACCESS_INVALID_FIXTURE_ID');return String(Number(value))}
async function hiddenVariation(ctx) {
 const f=ctx.fixture,plan=fixtureId(f.publicPlanId),memory=fixtureId(f.memoryId),day=fixtureId(f.dayId)
 const specs=[{table:'geo_stops',key:'id',where:`_parent_id IN (SELECT id FROM travel_plans_planning_sections WHERE _parent_id=${plan})`,columns:['geo_latitude','geo_longitude','geo_provenance','geo_approval_snapshot']},{table:'travel_memory_days_moments',key:'id',where:`_parent_id=${day}`,columns:['geo_latitude','geo_longitude','geo_provenance','geo_approval_snapshot']},...[["travel_plans",plan],["travel_memories",memory],["travel_memory_days",day]].map(([table,id])=>({table,key:'id',where:`id=${id}`,columns:['source_metadata_base_projection','source_metadata_source_hash','geo_access_revision']}))]
 const captured=[]
 for(const s of specs) {
  const rows=await ctx.sql(`SELECT coalesce(json_agg(t),'[]') FROM (SELECT ${[s.key,...s.columns].join(',')} FROM ${s.table} WHERE ${s.where}) t`)
  assert(rows.length>0,'HIDDEN_VARIATION_FIXTURE_MISSING:'+s.table);captured.push({...s,rows})
 }
 return {
  apply:async()=>{
   for(const s of captured) {
    const set=s.columns.map(column=>column==='source_metadata_base_projection'?`${column}='{"hiddenVariation":"issue180-alternate-private-base"}'::jsonb`:column==='geo_latitude'?`${column}=24.15`:column==='geo_longitude'?`${column}=120.68`:`${column}='issue180-alternate-private-value'`).join(',')
    await ctx.sql(`WITH changed AS (UPDATE ${s.table} SET ${set} WHERE ${s.where} RETURNING 1) SELECT count(*) FROM changed`)
   }
  },
  restore:async()=>{
   for(const s of captured)for(const row of s.rows) {
    const set=s.columns.map(column=>`${column}=${column==='source_metadata_base_projection'?(row[column]==null?'NULL':sqlLiteral(encode(row[column]))+'::jsonb'):sqlLiteral(row[column])}`).join(',')
    await ctx.sql(`WITH changed AS (UPDATE ${s.table} SET ${set} WHERE ${s.key}=${sqlLiteral(row[s.key])} RETURNING 1) SELECT count(*) FROM changed`)
   }
  },
 }
}

export async function runAccess(ctx,{clientsFactory=createAccessClients,validateGraph=graphValidation}={}) {
 await ctx.checkpoint('access-fixture-preflight')
 const clients=await clientsFactory(ctx)
 const before=await ctx.observe(),records=[]
 let variation
 try {
  const versionIds={}
  for(const collection of Object.keys(graphNames)) {
   const target=collection==='travel-plans'?ctx.fixture.publicPlanId:collection==='travel-memories'?ctx.fixture.memoryId:ctx.fixture.dayId
   const found=await clients.local({role:'admin',locale:'zh-TW',collection,operation:'versions',where:{parent:{equals:target}}})
   assert(found.status===200 && found.body.docs.length>0,'ACCESS_VERSION_FIXTURE_MISSING:'+collection)
   versionIds[collection]=found.body.docs[0].id
  }
  const validate=await validateGraph(ctx.config)
  const cases=accessCases(ctx.fixture,before).map(c=>{
   const row={...c,...(c.operation==='version-by-id'?{versionId:versionIds[c.collection]}:{})}
   const schemaErrors=validate(row)
   assertGraphSchemaControl(c,schemaErrors)
   return {...row,schemaErrors}
  })
  await bindAccessCounts(cases,ctx.sql)
  assertAccessCaseDefinitions(cases)
  const countOracleEvidence=await ctx.save('access-count-oracles',{source:'independent-owned-psql',oracles:[...new Map(cases.filter(c=>c.expectedCountSQL).map(c=>[c.collection+':'+c.hiddenPath,{collection:c.collection,path:c.hiddenPath,query:c.expectedCountSQL,count:c.expectedCount}])).values()]})
  const baseline={}
  for(const kind of ['http','graphql','local-api']) {
   const rows=[]
   for(const c of cases) {
    await ctx.checkpoint('access:'+kind+':'+c.role+':'+c.locale+':'+c.label)
    const response=kind==='http'?await clients.http(c):kind==='graphql'?await clients.graphql({role:c.role,query:graphQuery(c)}):await clients.local(c)
    await ctx.checkpoint('access-assert:'+kind+':'+c.role+':'+c.locale+':'+c.collection+':'+c.label)
    await assertAccessResponse(ctx,c,response,kind,ctx.fixture)
    rows.push({case:c,response})
   }
   baseline[kind]=rows
  }
  variation=await hiddenVariation(ctx)
  await variation.apply()
  for(const kind of Object.keys(baseline)) {
   for(const {case:c,response:beforeResponse} of baseline[kind].filter(r=>r.case.role!=='admin')) {
    await ctx.checkpoint('hidden-equivalence:'+kind)
    const afterResponse=kind==='http'?await clients.http(c):kind==='graphql'?await clients.graphql({role:c.role,query:graphQuery(c)}):await clients.local(c)
    await ctx.checkpoint('access-assert:equivalence:'+kind+':'+c.role+':'+c.locale+':'+c.collection+':'+c.label)
    await assertAccessResponse(ctx,c,afterResponse,kind,{...ctx.fixture,hiddenSentinel:'issue180-alternate-private-base',geo:{provenance:'issue180-alternate-private-value'}},beforeResponse)
   }
  }
  await variation.restore();variation=null
  assert(isDeepStrictEqual(before,await ctx.observe()),'ACCESS_READ_OR_VARIATION_CHANGED_PHYSICAL_ROWS')
  for(const kind of Object.keys(baseline)) {
   const record={id:kind,status:'PASS',countOracleEvidence,transport:kind==='http'?'wire HTTP to owned loopback REST_GET handler':kind==='graphql'?'wire HTTP to owned loopback GRAPHQL_POST handler':'Payload Local API overrideAccess:false',routeFactory:kind==='http'?'@payloadcms/next/routes REST_GET':kind==='graphql'?'@payloadcms/next/routes GRAPHQL_POST':null,sourceRoute:kind==='http'?'src/app/(payload)/api/[...slug]/route.ts':kind==='graphql'?'src/app/(payload)/api/graphql/route.ts':null,cases:baseline[kind].map(({case:c,response})=>({role:c.role,locale:c.locale,collection:c.collection,operation:c.operation,label:c.label,status:response.status,...(kind==='graphql' && c.schemaErrors.length?{queryability:'SCHEMA_REJECTED',schemaErrors:c.schemaErrors}:{})})),hiddenValueEquivalence:'PASS',physicalRowsPreserved:true,limits:{nextUI:'NOT_TESTED',production:'NOT_ACCESSED'}}
   await ctx.save(kind,record);records.push(record)
  }
  return records
 } finally {
  try {if(variation) {await variation.restore();assert(isDeepStrictEqual(before,await ctx.observe()),'ACCESS_FAILURE_RESTORE_MISMATCH')}} finally {await clients.close()}
 }
}
