import test from 'node:test'
import assert from 'node:assert/strict'
import {assertPlanSeedDiagnosticScope,runPlanSeedDiagnostic} from './gate-c-runner.mjs'
import {runPreparedGroups} from './gate-c-worker.mjs'
import {prepareVerification,proposePlanSeedDiagnostic} from './gate-c-cli.mjs'
import {prepareOwnership,runLifecycle} from './lifecycle.mjs'
import {manifestHash} from '../run-contract.mjs'
import {mkdtemp,mkdir,readFile,rm} from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
const row=(table,id,value)=>({table,key:JSON.stringify([id]),value:{id,...value}})
const targetBefore=[row('travel_plans',1,{}),row('travel_route_identities',8,{owner_key:'travel-plans:1'})],targetAfter=[...targetBefore,row('travel_route_identities_rels',21,{parent_id:8,path:'owner',travel_plans_id:1,travel_memories_id:null})],targetAllowed=[{collection:'travel-plans',id:1},{collection:'travel-route-identities',id:8}],targetEdges=[{table_name:'travel_route_identities_rels',column_name:'parent_id',parent_table:'travel_route_identities',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_plans_id',parent_table:'travel_plans',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_memories_id',parent_table:'travel_memories',parent_column:'id'}]

test('plan-seed diagnostic scope fails closed for missing or expanded cases',()=>{
 const manifest=include=>({scope:{include}})
 assert.throws(()=>assertPlanSeedDiagnosticScope({}),/DIAGNOSTIC_SCOPE_MISSING/)
 assert.throws(()=>assertPlanSeedDiagnosticScope(manifest(['case:plan-seed'])),/DIAGNOSTIC_SCOPE_NOT_APPROVED/)
 assert.throws(()=>assertPlanSeedDiagnosticScope(manifest(['issue180-gate-c-plan-seed-diagnostic'])),/DIAGNOSTIC_SCOPE_NOT_APPROVED/)
 assert.throws(()=>assertPlanSeedDiagnosticScope(manifest(['issue180-gate-c-plan-seed-diagnostic','case:plan-seed','case:admin'])),/DIAGNOSTIC_SCOPE_EXPANDED/)
 assert.throws(()=>assertPlanSeedDiagnosticScope(manifest(['issue180-gate-c-plan-seed-diagnostic','case:plan-seed','issue180-gate-c-full'])),/DIAGNOSTIC_SCOPE_EXPANDED/)
 assert.doesNotThrow(()=>assertPlanSeedDiagnosticScope(manifest(['issue180-gate-c-plan-seed-diagnostic','case:plan-seed'])))
})
for(const failure of [false,true])test('focused lifecycle reaches owned cleanup after '+(failure?'failure':'success'),async t=>{
 const scratch=await mkdtemp(path.join(os.tmpdir(),'i180-focused-life-'));t.after(()=>rm(scratch,{recursive:true,force:true}))
 const runId='issue180-'+randomBytes(16).toString('hex'),owner=await prepareOwnership(scratch,runId),directory=path.join(scratch,'evidence');await mkdir(directory)
 const prep=await prepareVerification(),now=Date.now(),manifest=proposePlanSeedDiagnostic(prep,{runId,validFrom:new Date(now-1000).toISOString(),validUntil:new Date(now+60000).toISOString(),preparationPath:'synthetic-preparation.json',preparationSHA256:'a'.repeat(64)})
 // admission verifies repository artifacts, so use an existing bound file as the synthetic preparation entry.
 manifest.artifacts.dependencies=manifest.artifacts.dependencies.filter(x=>x.path!=='synthetic-preparation.json')
 const approval={source:'TEST',manifestSha256:manifestHash(manifest),action:'local',environment:'disposable',target:manifest.target,scope:manifest.scope.include,baseline:manifest.scope.baseline,stopConditions:manifest.scope.stopConditions,validFrom:manifest.approval.validFrom,validUntil:manifest.approval.validUntil,revoked:false}
 const binding=JSON.parse(await readFile('scripts/rehearsal/baselines/issue180/binding.json')),calls=[]
 const life={initialize:async()=>calls.push('initialize'),start:async()=>calls.push('start'),createDatabase:async()=>calls.push('create'),query:async()=>({stdout:'1'}),cleanup:async()=>{calls.push('cleanup');return {databaseAbsent:true,serverStopped:true,directoryAbsent:true}},getWarnings:()=>[],getCleanupEvidence:()=>({})}
 const diagnosticRunner=context=>runPlanSeedDiagnostic(context,{migration:async()=>calls.push('migration'),worker:async workerContext=>{
  assert.equal(workerContext.scope,'plan-seed-diagnostic')
  const deps={bootstrapPayload:async()=>({payload:{},config:{},close:async()=>calls.push('worker-close')}),loadFixture:async()=>({}),runWriters:async(ctx,opts)=>{assert.equal(opts.focused,true);calls.push('plan-seed');if(failure)throw Error('DIAGNOSTIC_FAILED');await ctx.assertPreserved(targetBefore,targetAfter,targetAllowed);await ctx.save('plan-seed',{status:'PASS'});return [{id:'plan-seed',status:'PASS'}]},runAccess:async()=>{throw Error('ACCESS_ENTERED')},runRecovery:async()=>{throw Error('RECOVERY_ENTERED')}}
  return runPreparedGroups({owner,root:process.cwd(),directory,deadline:now+30000,manifestSha256:context.manifestSha256,scope:workerContext.scope},async method=>method==='ownershipEdges'?targetEdges:[],deps)
 }})
 const result=await runLifecycle({root:process.cwd(),binding,manifest,approval,ownership:{runId,target:manifest.target},verifySource:async()=>true,owner,directory,deadline:now+30000,group:'plan-seed-diagnostic',command:async()=>{},launch:()=>{},lifecycleFactory:()=>life,diagnosticRunner})
 assert.equal(result.status,failure?'BLOCK':'PASS');assert.equal(result.gateC,'PARTIAL_NOT_FULL');assert.equal(result.cleanup.directoryAbsent,true);assert.deepEqual(calls,['initialize','start','create','migration','plan-seed','worker-close','cleanup'])
})
