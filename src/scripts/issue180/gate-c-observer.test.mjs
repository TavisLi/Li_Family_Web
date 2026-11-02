import test from 'node:test'
import assert from 'node:assert/strict'
import {assertOwnedChanges,ownershipEdges,buildFailureEvidence} from './gate-c-observer.mjs'
import {assertHistoricalRows} from './gate-c-writers.mjs'
import {assertPreservedWithEvidence} from './gate-c-worker.mjs'
const row=(table,id,value)=>({table,key:JSON.stringify([id]),value:{id,...value}})
const before=[row('travel_plans',1,{title:'target'}),row('travel_plans',2,{title:'other'}),row('travel_plans_locales',3,{_parent_id:1,title:'local'}),row('_travel_plans_v',4,{parent_id:1,latest:true,version_title:'old'})]
const edges=[{table_name:'travel_plans_locales',column_name:'_parent_id',parent_table:'travel_plans',parent_column:'id'},{table_name:'_travel_plans_v',column_name:'parent_id',parent_table:'travel_plans',parent_column:'id'}]
const routeEdges=[{table_name:'travel_route_identities_rels',column_name:'parent_id',parent_table:'travel_route_identities',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_plans_id',parent_table:'travel_plans',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_memories_id',parent_table:'travel_memories',parent_column:'id'}]
const owners=[row('travel_plans',1,{}),row('travel_plans',2,{}),row('travel_route_identities',8,{owner_key:'travel-plans:1'})],allowed=[{collection:'travel-plans',id:1},{collection:'travel-route-identities',id:8}]
const rel=value=>row('travel_route_identities_rels',21,{parent_id:8,path:'owner',travel_plans_id:1,travel_memories_id:null,...value})
test('relation ownership requires all FK and exact owner identity on addition and deletion',()=>{
 assert.doesNotThrow(()=>assertOwnedChanges(owners,[...owners,rel({})],allowed,routeEdges))
 assert.doesNotThrow(()=>assertOwnedChanges([...owners,rel({})],owners,allowed,routeEdges))
 for(const invalid of [rel({travel_plans_id:2}),rel({parent_id:9}),rel({path:'other'}),rel({travel_plans_id:null}),rel({travel_memories_id:2})])assert.throws(()=>assertOwnedChanges(owners,[...owners,invalid],allowed,routeEdges),/BLOCK/)
 assert.throws(()=>assertOwnedChanges(owners,[...owners,rel({})],allowed,routeEdges.slice(0,2)),/BLOCK/)
 const bad=structuredClone(owners);bad[2].value.owner_key='travel-plans:2'
 assert.throws(()=>assertOwnedChanges(bad,[...bad,rel({})],allowed,routeEdges),/BLOCK/)
 assert.throws(()=>assertOwnedChanges([...owners,rel({travel_plans_id:2})],owners,allowed,routeEdges),/BLOCK/)
 assert.throws(()=>assertOwnedChanges([...owners,rel({})],[...owners,rel({travel_plans_id:2})],allowed,routeEdges),/BLOCK/)
})
test('catalog lookup includes relation parent and both owner FKs',async()=>{
 let query;await ownershipEdges(async sql=>{query=sql;return []})
 assert.match(query,/travel_route_identities_rels/);assert.match(query,/travel_plans_id/);assert.match(query,/travel_memories_id/)
})
test('failure evidence retains bounded snapshots, changes, FK and owner decisions with hashes',()=>{
 const evidence=buildFailureEvidence(owners,[...owners,rel({travel_plans_id:2})],allowed,routeEdges)
 assert.equal(evidence.status,'BLOCK');assert.equal(evidence.changes[0].kind,'added');assert.equal(evidence.changes[0].after.value.travel_plans_id,2)
 assert.equal(evidence.ownerDecisions[0].permitted,false);assert.equal(evidence.edges.length,3);assert.match(evidence.evidenceSha256,/^[a-f0-9]{64}$/)
 const removed=buildFailureEvidence([...owners,rel({})],owners,allowed,routeEdges);assert.equal(removed.changes[0].kind,'removed')
 const capped=buildFailureEvidence(owners,[...owners,row('unrelated',99,{data:'x'.repeat(1100000)})],allowed,routeEdges);assert.equal(capped.status,'UNKNOWN');assert.equal(capped.after,undefined)
})
test('worker preserves evidence before propagating a guard failure and fails closed on save error',async()=>{
 let saved;await assert.rejects(assertPreservedWithEvidence(owners,[...owners,rel({travel_plans_id:2})],allowed,routeEdges,async(name,value)=>{saved={name,value}}),/BLOCK/)
 assert.equal(saved.name,'observer-failure');assert.equal(saved.value.changes[0].kind,'added')
 await assert.rejects(assertPreservedWithEvidence(owners,[...owners,rel({travel_plans_id:2})],allowed,routeEdges,async()=>{throw Error('disk')}),/OBSERVER_FAILURE_EVIDENCE_UNKNOWN/)
})
test('focused success saves observer before-after evidence and rejects save failure',async()=>{
 const saved=[]
 await assertPreservedWithEvidence(owners,[...owners,rel({})],allowed,routeEdges,async(name,value)=>{saved.push({name,value});return {name,sha256:'a'.repeat(64)}},{focused:true,sequence:1})
 assert.equal(saved.length,1);assert.equal(saved[0].value.status,'PASS');assert.equal(saved[0].value.changes[0].kind,'added')
 await assert.rejects(assertPreservedWithEvidence(owners,[...owners,rel({})],allowed,routeEdges,async()=>{throw Error('disk')},{focused:true,sequence:1}),/OBSERVER.*UNKNOWN/)
 const failed=[];await assert.rejects(assertPreservedWithEvidence(owners,[...owners,rel({travel_plans_id:2})],allowed,routeEdges,async(name,value)=>{failed.push({name,value});return {path:name+'.json',sha256:'b'.repeat(64)}},{focused:true,sequence:1}),/BLOCK/)
 assert.equal(failed[0].value.status,'BLOCK');assert.equal(failed[0].value.ownerDecisions[0].permitted,false)
 await assert.rejects(assertPreservedWithEvidence(owners,owners,allowed,routeEdges,async()=>({path:'observer-check-001.json',sha256:'c'.repeat(64)}),{focused:true,sequence:1}),/FOCUSED_OWNER_IDENTITY_UNKNOWN/)
})
test('physical allowances follow exact owned identities, never whole tables',()=>{
 const after=structuredClone(before);after[0].value.title='edit';after[2].value.title='local edit'
 assert.doesNotThrow(()=>assertOwnedChanges(before,after,[{collection:'travel-plans',id:1}],edges))
 after[1].value.title='lost'
 assert.throws(()=>assertOwnedChanges(before,after,[{collection:'travel-plans',id:1}],edges),/non-target row changed/)
})
test('old version content and IDs remain immutable while latest bookkeeping may change',()=>{
 const after=structuredClone(before);after[3].value.latest=false
 assert.equal(assertHistoricalRows(before,after).preservedRows,1)
 after[3].value.version_title='lost';assert.throws(()=>assertHistoricalRows(before,after),/HISTORY_CONTENT_CHANGED/)
 assert.throws(()=>assertHistoricalRows(before,after.slice(0,3)),/HISTORY_ROW_REMOVED/)
})
test('custom geo stop version tables and localized copies cannot disappear or change',()=>{
 for(const table of ['_geo_stops_v','_geo_stops_v_locales']) {
  const before=[row(table,9,{geo_latitude:25,name:'合成位置'})]
  assert.throws(()=>assertHistoricalRows(before,[]),/HISTORY_ROW_REMOVED/)
  assert.throws(()=>assertHistoricalRows(before,[row(table,9,{geo_latitude:26,name:'合成位置'})]),/HISTORY_CONTENT_CHANGED/)
 }
})
test('target route identity permits only timestamp bookkeeping with stable proven ownership',()=>{
 const permit=[{collection:'travel-plans',id:1}],initial=[...owners,rel({})],changed=structuredClone(initial)
 initial[2].value.updated_at='old';changed[2].value.updated_at='new'
 assert.doesNotThrow(()=>assertOwnedChanges(initial,changed,permit,routeEdges))
 for(const mutate of [r=>{r[2].value.owner_key='travel-plans:2'},r=>{r[2].value.slug='other'},r=>{r[3].value.travel_plans_id=2},r=>{r.splice(3,1)},r=>{r.push({...structuredClone(r[3]),key:'[22]',value:{...r[3].value,id:22}})}]) {
  const bad=structuredClone(changed);mutate(bad);assert.throws(()=>assertOwnedChanges(initial,bad,permit,routeEdges),/BLOCK/)
 }
 assert.throws(()=>assertOwnedChanges(initial,changed,permit,routeEdges.slice(0,2)),/BLOCK/)
})
test('oversized failure evidence retains bounded identity and relationship context',()=>{
 const permit=[{collection:'travel-plans',id:1}],initial=[...owners,rel({})],changed=structuredClone(initial)
 initial[2].value.updated_at='old';changed[2].value.updated_at='new';changed.push(row('large',99,{data:'x'.repeat(1100000)}))
 const evidence=buildFailureEvidence(initial,changed,permit,routeEdges)
 assert.equal(evidence.status,'UNKNOWN');assert.equal(evidence.reason,'FAILURE_EVIDENCE_CAP')
 assert.equal(evidence.identityChanges[0].before.value.owner_key,'travel-plans:1')
 assert.equal(evidence.identityChanges[0].after.value.updated_at,'new')
 assert.equal(evidence.identityRelations.before[0].value.travel_plans_id,1)
 assert(Buffer.byteLength(JSON.stringify(evidence))<=1024*1024)
})
test('installed afterChange hook updates an existing target route identity',async()=>{
 const {importProduct}=await import('./payload-runtime.mjs')
 const {syncTravelRouteIdentity}=await importProduct(process.cwd(),'payload/collections/travel-slug-guard.ts')
 const calls=[],payload={find:async args=>{calls.push(['find',args.where]);return {docs:[{id:8}]}},update:async args=>{calls.push(['update',args]);return {id:8}}}
 const doc={id:1,slug:'synthetic'},req={payload,context:{}}
 assert.equal(await syncTravelRouteIdentity('travel-plans')({doc,req}),doc)
 assert.deepEqual(calls[0][1],{ownerKey:{equals:'travel-plans:1'}})
 assert.equal(calls[1][1].id,8);assert.equal(calls[1][1].data.ownerKey,'travel-plans:1');assert.equal(calls[1][1].req,req)
})
