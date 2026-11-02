import test from 'node:test'
import assert from 'node:assert/strict'
import {accessCases,assertCase,bindAccessCounts,assertAccessCaseDefinitions} from './gate-c-access.mjs'
const f={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyMemoryId:6,familyDayId:7,draftMemoryId:8,parentDraftDayId:9,draftDayId:10,approvedPlanId:11,otherDayId:12}
const matrix=()=>accessCases(f).map(c=>({...c,...(c.operation==='version-by-id'?{versionId:21}:{})}))
test('whole access matrix refuses missing expected counts before response assertions',async()=>{
 const cases=matrix();assert.throws(()=>assertAccessCaseDefinitions(cases),/ACCESS_COUNT_EXPECTATION_MISSING/)
 const queries=[];await bindAccessCounts(cases,async text=>{queries.push(text);return text.includes('geo_provenance')?0:5})
 assert.doesNotThrow(()=>assertAccessCaseDefinitions(cases))
 assert.equal(queries.length,15,'one independent query per collection/path, reused across locales')
 assert.equal(cases.filter(c=>c.operation==='count' && c.sideChannel && c.role==='admin').length,45)
 for(const sql of queries)assert.match(sql,/^SELECT count\(DISTINCT owner.id\) FROM public\.[a-z_]+ owner.* WHERE [a-z_.]+ IS NOT NULL$/)
 assert(queries.includes('SELECT count(DISTINCT owner.id) FROM public.travel_plans owner JOIN public.travel_plans_planning_sections section ON section._parent_id=owner.id JOIN public.geo_stops child ON child._parent_id=section.id WHERE child.geo_latitude IS NOT NULL'))
 assert(queries.includes('SELECT count(DISTINCT owner.id) FROM public.travel_memory_days owner JOIN public.travel_memories parent ON parent.id=owner.memory_id WHERE parent.source_metadata_source_hash IS NOT NULL'))
 for(const c of cases.filter(c=>c.operation==='count' && c.sideChannel && c.role==='admin')) {
  const expected=c.hiddenPath.includes('provenance')?0:5
  assert.equal(c.expectedCount,expected)
  for(const kind of ['http','graphql','local-api']) {
   const wrap=totalDocs=>({status:200,body:kind==='graphql'?{data:{result:{totalDocs}}}:{totalDocs}})
   assert.doesNotThrow(()=>assertCase(c,wrap(expected),kind,{}))
   assert.throws(()=>assertCase(c,wrap(expected+1),kind,{}),/DOCUMENT_COUNT_MISMATCH/)
  }
 }
})
test('missing or unknown count evidence never accepts a response-derived expectation',async()=>{
 for(const count of [undefined,null,NaN,Infinity,-1,0.5,'5',{}])await assert.rejects(bindAccessCounts(matrix(),async()=>count),/ACCESS_COUNT_OBSERVER_UNKNOWN/)
 for(const patch of [{collection:'users'},{hiddenPath:'unreviewed.field'}])await assert.rejects(bindAccessCounts([{role:'admin',operation:'count',sideChannel:true,collection:'travel-plans',hiddenPath:'geoAccessRevision',...patch}],async()=>5),/ACCESS_COUNT_.*UNKNOWN/)
 for(const kind of ['http','graphql','local-api'])assert.throws(()=>assertCase({role:'admin',operation:'count'}, {status:200,body:kind==='graphql'?{data:{result:{totalDocs:5}}}:{totalDocs:5}},kind,{}),/ACCESS_COUNT_EXPECTATION_MISSING/)
})
test('case-definition preflight covers all positive response branches',async()=>{
 const cases=await bindAccessCounts(matrix(),async()=>5)
 for(const [operation,patch] of [['draft',{expectedId:undefined}],['by-id',{id:undefined}],['version-by-id',{versionId:undefined}],['list-all',{expectedVisibleIds:undefined}],['count',{expectedCount:undefined}]]) {
  const c=cases.find(c=>c.operation===operation && !c.sideChannel)
  assert.throws(()=>assertAccessCaseDefinitions([{...c,...patch}]),/EXPECTATION_MISSING/)
 }
})

test('runAccess preflights the full matrix, closes on failure and preserves assertion case context',async()=>{
 const {runAccess}=await import('./gate-c-access.mjs')
 for(const unknownCount of [false,true]) {
  const checkpoints=[],saved=[];let requests=0,closed=0
  const ctx={fixture:f,config:{},checkpoint:async name=>checkpoints.push(name),observe:async()=>[],sql:async()=>unknownCount?undefined:5,save:async(name,value)=>{saved.push({name,value});return {path:name+'.json',sha256:'a'.repeat(64)}}}
  const clients={local:async()=>({status:200,body:{docs:[{id:21}]}}),http:async()=>{requests++;return {status:200,body:{id:999}}},close:async()=>closed++}
  await assert.rejects(runAccess(ctx,{clientsFactory:async()=>clients,validateGraph:async()=>()=>[]}),unknownCount?/ACCESS_COUNT_OBSERVER_UNKNOWN/:/ACCESS_EXPECTED_DOCUMENT_MISSING/)
  assert.equal(closed,1);assert.equal(requests,unknownCount?0:1)
  if(!unknownCount) {
   assert.equal(checkpoints.at(-1),'access-assert:http:public:zh-TW:travel-plans:published-public')
   assert.equal(saved[0].name,'access-count-oracles');assert.equal(saved[0].value.oracles.length,15)
  }
 }
})
