import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccessClients, assertHidden, assertEquivalent, accessCases, assertCase } from './gate-c-access.mjs'

test('real route factories receive Request and route params; role headers never become evidence',async()=>{
 const calls=[]
 const routes={REST_GET:config=>async(request,args)=>{calls.push({config,request,args});return Response.json({docs:[{id:7}],totalDocs:1})},GRAPHQL_POST:config=>async(request)=>{calls.push({config,request});return Response.json({data:{TravelPlans:{docs:[{id:7}],totalDocs:1}}})}}
 let closed=0
 const serve=async dispatch=>({origin:'http://127.0.0.1:180',request:async(url,init)=>dispatch(new Request(url,init)),close:async()=>{closed++}})
 const config={routes:{api:'/api',graphQL:'/graphql'}}
 const payload={find:async args=>{calls.push(args);return {docs:[{id:7}],totalDocs:1}}}
 const clients=await createAccessClients({config,payload,fixture:{adminToken:'private-token',familyToken:'family-token'}},{routes,serve})
 assert.deepEqual((await clients.http({role:'family',collection:'travel-plans',locale:'en',where:{id:{equals:7}}})).body.docs,[{id:7}])
 assert.equal(calls[0].request.headers.get('authorization'),'JWT family-token')
 assert.equal(calls[0].request.headers.get('disableautologin'),'true')
 assert.equal(new URL(calls[0].request.url).searchParams.get('where[id][equals]'),'7')
 assert.deepEqual((await calls[0].args.params).slug,['travel-plans'])
 await clients.graphql({role:'admin',query:'query { TravelPlans { totalDocs } }'})
 assert.match(await calls[1].request.text(),/TravelPlans/)
 assert.equal(calls[1].request.headers.get('accept'),'application/graphql-response+json')
 await clients.local({role:'public',collection:'travel-plans',locale:'en'})
 assert.equal(calls[2].overrideAccess,false);assert.equal(calls[2].user,null)
 await clients.close();assert.equal(closed,1)
})

test('hidden assertion catches key, Base, nested relationship and value leaks',()=>{
 const fixture={hiddenSentinel:'private-base',geo:{provenance:'private-provenance'}}
 for(const body of [{sourceMetadata:{}},{planningSections:[{geoStops:[]}]},{memory:{geoAccessRevision:'x'}},{x:'private-base'},{x:'private-provenance'}]) assert.throws(()=>assertHidden(body,fixture),/HIDDEN/)
 assert.doesNotThrow(()=>assertHidden({docs:[{id:1,title:'Public',moments:[{title:'Moment'}]}]},fixture))
})

test('equivalence compares status, errors, count, order and relationship population',()=>{
 const a={status:200,body:{docs:[{id:1,memory:{id:3}}],totalDocs:1}}
 assert.doesNotThrow(()=>assertEquivalent(a,structuredClone(a)))
 for(const b of [{...a,status:403},{status:200,body:{...a.body,totalDocs:2}},{status:200,body:{docs:[{id:2,memory:{id:3}}],totalDocs:1}},{status:200,body:{...a.body,errors:[{message:'secret'}]}}]) assert.throws(()=>assertEquivalent(a,b),/HIDDEN_VALUE/)
})

test('matrix explicitly names all roles, locales, document/version/count/query paths',()=>{
 const f={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyMemoryId:6,familyDayId:7,draftMemoryId:8,parentDraftDayId:9,draftDayId:10,approvedPlanId:11,otherDayId:12}
 const cases=accessCases(f)
 for(const role of ['public','family','admin'])for(const locale of ['zh-TW','en']) {
  const selected=cases.filter(c=>c.role===role && c.locale===locale)
  for(const operation of ['find','by-id','versions','version-by-id','count','where','sort','relationship','draft'])assert(selected.some(c=>c.operation===operation),operation)
 }
 assert(cases.some(c=>c.label==='published-day-draft-parent'))
 assert(cases.some(c=>c.label==='draft-day-published-parent'))
 assert(cases.some(c=>c.label==='published-approved-public'))
 assert(cases.some(c=>c.label==='published-approved-day-public-parent'))
})

for(const kind of ['http','graphql','local-api'])test('SP1 rejects backend, transport-shaped and mixed denials: '+kind,()=>{
 const c={role:'public',sideChannel:true,operation:'where',label:'protected',hiddenPath:'sourceMetadata.baseProjection'}
 const expected={message:'The following path cannot be queried: sourceMetadata.baseProjection',name:'QueryError',data:[{path:c.hiddenPath}]}
 const error=kind==='graphql'?{message:expected.message,path:['result'],extensions:{name:expected.name,data:expected.data,statusCode:400}}:expected
 const response=errors=>({status:kind==='graphql'?200:400,body:{errors}})
 assert.doesNotThrow(()=>assertCase(c,response([error]),kind,{}))
 for(const bad of [{status:500,body:{errors:[error]}},response([{message:'unexpected backend failure'}]),response([error,{message:'timeout'}]),response([{...error,message:'restore backend connection lost'}])])assert.throws(()=>assertCase(c,bad,kind,{}),/REJECTION|DENIAL/)
 for(const operation of ['by-id','versions','version-by-id'])assert.throws(()=>assertCase({...c,sideChannel:false,visible:false,operation},{status:500,body:{errors:[{message:'backend failure'}]}},kind,{}),/REJECTION|DENIAL/)
 const schema={...c,schemaErrors:['Field "private" is not defined by type "Where".']}
 assert.throws(()=>assertCase(schema,{status:400,body:{errors:[{message:schema.schemaErrors[0]},{message:'backend failure'}]}},'graphql',{}),/REJECTION/)
})

for(const kind of ['http','graphql','local-api'])test('SP2 checks independent 0/1 counts, draft totals and full pagination: '+kind,()=>{
 const wrap=body=>({status:200,body:kind==='graphql'?{data:{result:body}}:body})
 for(const visible of [false,true]) {
  const count={role:'public',operation:'count',label:'known',expectedCount:visible?1:0}
  assert.doesNotThrow(()=>assertCase(count,wrap({totalDocs:visible?1:0}),kind,{}))
  assert.throws(()=>assertCase(count,wrap({totalDocs:999}),kind,{}),/COUNT/)
  const draft={role:'public',visible,operation:'draft',label:'known',expectedId:7}
  assert.throws(()=>assertCase(draft,wrap({docs:visible?[{id:7}]:[],totalDocs:23}),kind,{}),/COUNT/)
 }
 const c={role:'public',operation:'list-all',label:'all',expectedVisibleIds:[1,2],expectedHiddenIds:[3]}
 const good={docs:[{id:2},{id:1}],totalDocs:2,limit:100,page:1,totalPages:1,pagingCounter:1,hasNextPage:false,hasPrevPage:false,nextPage:null,prevPage:null}
 assert.doesNotThrow(()=>assertCase(c,wrap(good),kind,{}))
 for(const patch of [{totalDocs:999},{docs:[{id:1},{id:2},{id:4}]},{docs:[{id:1},{id:1}]},{page:2},{totalPages:99},{hasNextPage:true},{limit:1}])assert.throws(()=>assertCase(c,wrap({...good,...patch}),kind,{}),/LIST/)
})

test('SP2 full-list oracle includes observer-only legacy/writer rows and parent Day access',()=>{
 const f={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyMemoryId:6,familyDayId:7,draftMemoryId:8,parentDraftDayId:9,draftDayId:10,approvedPlanId:11,otherDayId:12}
 const physical=[{table:'travel_plans',key:'[-180]',value:{id:-180,_status:'published',is_private:false}},{table:'travel_memories',key:'[4]',value:{id:4,_status:'published',is_private:false}},{table:'travel_memories',key:'[6]',value:{id:6,_status:'published',is_private:true}},{table:'travel_memory_days',key:'[5]',value:{id:5,memory_id:4,_status:'published'}},{table:'travel_memory_days',key:'[7]',value:{id:7,memory_id:6,_status:'published'}},{table:'travel_memory_days',key:'[10]',value:{id:10,memory_id:4,_status:'draft'}}]
 const cases=accessCases(f,physical),list=(role,collection)=>cases.find(c=>c.role===role && c.locale==='zh-TW' && c.collection===collection && c.operation==='list-all')
 assert.deepEqual(list('public','travel-plans').expectedVisibleIds,[-180])
 assert.deepEqual(list('public','travel-memory-days').expectedVisibleIds,[5])
 assert.deepEqual(list('family','travel-memory-days').expectedVisibleIds,[5,7])
 assert.deepEqual(list('admin','travel-memory-days').expectedVisibleIds,[5,7,10])
 for(const c of cases.filter(c=>c.operation==='count' && !c.sideChannel))assert([0,1].includes(c.expectedCount))
})
for(const kind of ['http','graphql','local-api'])test('SP1 retains precise version/by-ID denial and authorized success controls: '+kind,async()=>{
 const {Forbidden,NotFound,QueryError,formatErrors}=await import('payload')
 const wrap=(error)=>({status:kind==='graphql'?200:error.status,body:kind==='graphql'?{errors:[{message:error.message,path:['result'],extensions:{name:error.name,data:error.data,statusCode:error.status}}]}:kind==='http'?formatErrors(error):{errors:[{name:error.name,message:error.message,data:error.data}]}})
 for(const [operation,error] of [['versions',new Forbidden()],['version-by-id',new Forbidden()],['by-id',new NotFound()]])assert.doesNotThrow(()=>assertCase({role:'family',operation,visible:false},wrap(error),kind,{}))
 const query=new QueryError([{path:'sourceMetadata.sourceHash'}])
 assert.doesNotThrow(()=>assertCase({role:'public',operation:'where',sideChannel:true,hiddenPath:'sourceMetadata.sourceHash'},wrap(query),kind,{}))
 const c={role:'admin',operation:'by-id',visible:true,id:7,label:'authorized-control'},body={id:7,sourceMetadata:{baseProjection:{valid:true}}}
 assert.doesNotThrow(()=>assertCase(c,{status:200,body:kind==='graphql'?{data:{result:body}}:body},kind,{}))
 assert.throws(()=>assertCase(c,{status:500,body:{errors:[{message:'backend failure'}]}},kind,{}),/EXPECTED_SUCCESS/)
})
