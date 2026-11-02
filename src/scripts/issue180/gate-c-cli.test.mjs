import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir,rm,symlink} from 'node:fs/promises'
import {randomBytes,createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
import {prepareVerification,proposeVerification,proposePlanSeedDiagnostic,executeVerification,assertRuntimeBindingMatch} from './gate-c-cli.mjs'
import {allCases} from './gate-c-runner.mjs'
import {manifestHash} from '../run-contract.mjs'
import {buildFailureEvidence} from './gate-c-observer.mjs'
const physical=(table,id,value)=>({table,key:JSON.stringify([id]),value:{id,...value}})
const targetBefore=[physical('travel_plans',1,{}),physical('travel_route_identities',8,{owner_key:'travel-plans:1'})],targetAfter=[...targetBefore,physical('travel_route_identities_rels',21,{parent_id:8,path:'owner',travel_plans_id:1,travel_memories_id:null})],targetAllowed=[{collection:'travel-plans',id:1},{collection:'travel-route-identities',id:8}],targetEdges=[{table_name:'travel_route_identities_rels',column_name:'parent_id',parent_table:'travel_route_identities',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_plans_id',parent_table:'travel_plans',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_memories_id',parent_table:'travel_memories',parent_column:'id'}]

async function packet(t,focused=false) {
 const preparation=await prepareVerification(),runId='issue180-'+randomBytes(16).toString('hex'),preparationPath='.rehearsal-runs/'+runId+'-test-prep.json'
 await mkdir('.rehearsal-runs',{recursive:true});const bytes=JSON.stringify(preparation,null,2)+'\n';await writeFile(preparationPath,bytes,{flag:'wx'})
 t.after(()=>rm(preparationPath));t.after(()=>rm(path.join('.rehearsal-runs/issue180-gate-c',runId),{recursive:true,force:true}))
 const manifest=(focused?proposePlanSeedDiagnostic:proposeVerification)(preparation,{runId,preparationPath,preparationSHA256:createHash('sha256').update(bytes).digest('hex'),validFrom:new Date(Date.now()-1000).toISOString(),validUntil:new Date(Date.now()+600000).toISOString()})
 const sourceBytes=Buffer.from('SYNTHETIC TEST ONLY; NO HUMAN APPROVAL'),approval={source:'test-only',manifestSha256:manifestHash(manifest),action:'local',environment:'disposable',target:manifest.target,scope:manifest.scope.include,baseline:manifest.scope.baseline,stopConditions:manifest.scope.stopConditions,validFrom:manifest.approval.validFrom,validUntil:manifest.approval.validUntil,revoked:false}
 return {preparation,preparationPath,manifest,approval,sourceBytes,sourceReadback:{manifestSha256:manifestHash(manifest),sourceSha256:createHash('sha256').update(sourceBytes).digest('hex'),operator:'TEST-NOT-HUMAN'}}
}
for(const failure of [false,true])test('focused admission isolates plan-seed and retains cleanup on '+(failure?'failure':'success'),async t=>{
 const p=await packet(t,true),d=drivers()
 d.run=async input=>{assert.deepEqual(input.cases,['plan-seed']);d.calls.push('main');if(failure)return d.persist(input,{status:'BLOCK',failure:{message:'TEST_FAILURE'},warnings:[],caseResults:[],cleanup:{databaseAbsent:true,serverStopped:true,directoryAbsent:true}})
  const bytes=JSON.stringify({status:'PASS',scope:'TEST_ONLY'});await writeFile(path.join(input.directory,'plan-seed.json'),bytes,{flag:'wx'})
  const observed=Buffer.from(JSON.stringify({runId:input.manifest.runId,manifestSha256:manifestHash(input.manifest),...buildFailureEvidence(targetBefore,targetAfter,targetAllowed,targetEdges,'PASS')}));await writeFile(path.join(input.directory,'observer-check-001.json'),observed,{flag:'wx'})
  return d.persist(input,{status:'PASS',warnings:[],caseResults:[{id:'plan-seed',status:'PASS',evidence:'plan-seed.json',sha256:createHash('sha256').update(bytes).digest('hex'),observerEvidence:[{path:'observer-check-001.json',sha256:createHash('sha256').update(observed).digest('hex')}]}],cleanup:{databaseAbsent:true,serverStopped:true,directoryAbsent:true}})}
 const result=await executeVerification(p,d);assert.equal(result.status,failure?'BLOCK':'PASS');assert.equal(result.scope,'plan-seed-diagnostic-only');assert.equal(result.gateC,'NOT_EVALUATED');assert.deepEqual(d.calls,['owner','main'])
 assert.equal(result.phaseReceipts[0].status,failure?'BLOCK':'PASS')
})
test('focused admission rejects expanded manifest before allocating resources',async t=>{
 const p=await packet(t,true),d=drivers(),manifest=structuredClone(p.manifest);manifest.scope.include.push('case:admin')
 const digest=manifestHash(manifest),approval={...p.approval,manifestSha256:digest,scope:manifest.scope.include},sourceReadback={...p.sourceReadback,manifestSha256:digest}
 await assert.rejects(executeVerification({...p,manifest,approval,sourceReadback},d),/DIAGNOSTIC_SCOPE_EXPANDED/);assert.deepEqual(d.calls,[])
})
test('missing diagnostic marker cannot select focused execution',async t=>{
 const p=await packet(t,true),d=drivers(),manifest=structuredClone(p.manifest);manifest.scope.include=manifest.scope.include.filter(x=>x!=='issue180-gate-c-plan-seed-diagnostic')
 const digest=manifestHash(manifest),approval={...p.approval,manifestSha256:digest,scope:manifest.scope.include},sourceReadback={...p.sourceReadback,manifestSha256:digest}
 await assert.rejects(executeVerification({...p,manifest,approval,sourceReadback},d),/SCOPE_OR_ARTIFACT_DRIFT/);assert.deepEqual(d.calls,[])
})
function drivers() {
 const calls=[],cleanup={databaseAbsent:true,serverStopped:true,directoryAbsent:true}
 const persist=async(input,result)=>{await writeFile(path.join(input.directory,'receipt.json'),JSON.stringify({...result,manifestSha256:manifestHash(input.manifest)}),{flag:'wx'});return result}
 return {calls,persist,loopback:async()=>{},command:async(file,args)=>({stdout:args.includes('-axo')?`${process.pid} ${process.ppid} ${process.pid}`:String(process.pid),stderr:''}),makeOwner:async()=>{calls.push('owner');return {synthetic:true}},run:async input=>{
  calls.push('main');const caseResults=[]
  for(const id of allCases) {
   if(id==='cleanup'){caseResults.push({id,status:'PENDING_FINAL_CLEANUP'});continue}
   const bytes=JSON.stringify({status:'PASS',scope:'TEST_ONLY'});await writeFile(path.join(input.directory,id+'.json'),bytes,{flag:'wx'})
   caseResults.push({id,status:'PASS',evidence:id+'.json',sha256:createHash('sha256').update(bytes).digest('hex')})
  }
  return persist(input,{status:'PASS',caseResults,cleanup})
 },probe:async input=>{calls.push(input.cleanupProbe);return persist(input,{status:'BLOCK',failure:{message:input.cleanupProbe==='failure'?'EXPECTED_CLEANUP_FAILURE':'INTERRUPTED'},warnings:[],cleanup})}}
}
test('full proposal binds every case, prerequisite bytes and allowed local effects without inherited smoke exclusions',async t=>{
 const p=await packet(t)
 assert.equal(p.preparation.executionAuthorization,'ABSENT');assert.equal(p.preparation.platformProcessInspection,'UNKNOWN')
 assert.equal(p.preparation.runtimeBindings.node.version,'v24.21.0')
 assert.equal(p.preparation.runtimeBindings.pnpm.version,'10.28.0')
 assert.match(p.preparation.runtimeBindings.payload.entry.path,/\/payload\/dist\/index\.js$/)
 assert.match(p.preparation.runtimeBindings.sharp.native.addon.path,/sharp-darwin-arm64-0\.35\.5\.node$/)
 assert.match(p.preparation.runtimeBindings.sharp.libvips.binary.path,/libvips-cpp\.8\.18\.7\.dylib$/)
 assert(p.preparation.runtimeBindings.nodeModules.realpath)
 for(const id of allCases)assert(p.manifest.scope.include.includes('case:'+id))
 assert(p.manifest.scope.include.some(item=>item.includes('retain and verify empty template0 public schema') && item.includes('restore DB')))
 assert(p.manifest.scope.include.some(item=>item.includes('live column relative order') && item.includes('absolute ordinal differences') && item.includes('restore DB absence evidence')))
 assert(p.manifest.scope.include.some(item=>item.includes('compact completion IPC') && item.includes('worker-exit-evidence.json')))
 assert(p.manifest.scope.expectedEffects.some(item=>item.includes('retain verified empty template0 public namespace on restore target')))
 assert(!p.manifest.scope.exclude.some(item=>['migration','Payload','Gate C matrix'].includes(item)))
 assert.match(p.manifest.runtime.bootstrap.entrypoint,/gate-c-cli/)
 assert(p.manifest.artifacts.dependencies.some(file=>file.path===p.preparationPath))
})
test('runtime binding path or hash drift is a hard block',()=>{
 const expected={node:{path:'/runtime/node',sha256:'a'},sharp:{entry:{path:'/deps/sharp',sha256:'b'}}}
 assertRuntimeBindingMatch(expected,structuredClone(expected))
 for(const actual of [{...expected,node:{...expected.node,path:'/other/node'}},{...expected,sharp:{entry:{path:'/deps/sharp',sha256:'changed'}}}])assert.throws(()=>assertRuntimeBindingMatch(expected,actual),/RUNTIME_DEPENDENCY_DRIFT/)
})
test('full entry refuses missing source, wrong target, drifted bytes and process privilege denial before allocation',async t=>{
 const p=await packet(t),d=drivers()
 await assert.rejects(executeVerification({...p,sourceReadback:null},d),/SOURCE_READBACK_REQUIRED/)
 await assert.rejects(executeVerification({...p,approval:{...p.approval,target:'production'}},d),/APPROVAL_NOT_VALID/)
 const changed=structuredClone(p.manifest);changed.scope.include=changed.scope.include.filter(item=>item!=='case:admin')
 await assert.rejects(executeVerification({...p,manifest:changed,approval:{...p.approval,manifestSha256:manifestHash(changed),scope:changed.scope.include},sourceReadback:{...p.sourceReadback,manifestSha256:manifestHash(changed)}},d),/SCOPE_OR_ARTIFACT_DRIFT/)
 await assert.rejects(executeVerification(p,{...d,command:async()=>{throw Error('PROCESS_DENIED')}}),/PROCESS_DENIED/)
 await assert.rejects(executeVerification(p,{...d,command:async()=>({stdout:String(process.pid)})}),/PLATFORM_FULL_PROCESS_INSPECTION_UNAVAILABLE/)
 await assert.rejects(executeVerification(p,{...d,loopback:async()=>{throw Error('LOOPBACK_DENIED')}}),/LOOPBACK_DENIED/)
 await writeFile(p.preparationPath,JSON.stringify(p.preparation,null,4))
 await assert.rejects(executeVerification(p,d),/PREPARATION_BYTES_CHANGED/)
 assert.deepEqual(d.calls,[])
})
test('identical preparation bytes behind a substituted symlink are refused before platform admission',async t=>{
 const p=await packet(t),d=drivers(),other=p.preparationPath+'.other'
 await writeFile(other,await readFile(p.preparationPath),{flag:'wx'});t.after(()=>rm(other))
 await rm(p.preparationPath);await symlink(path.basename(other),p.preparationPath)
 await assert.rejects(executeVerification(p,d),/PREPARATION_FILE_UNSAFE/);assert.deepEqual(d.calls,[])
})
test('one exact suite admits all 20 cases only after normal, failure and abort cleanup evidence',async t=>{
 const p=await packet(t),d=drivers(),result=await executeVerification(p,d)
 assert.equal(result.status,'PASS');assert.deepEqual(d.calls,['owner','main','owner','failure','owner','abort'])
 assert.equal(result.caseResults.length,20);assert(result.caseResults.every(row=>row.status==='PASS'))
 const receipt=JSON.parse(await readFile(path.join(result.directory,'receipt.json')))
 assert.equal(receipt.manifestSha256,manifestHash(p.manifest));assert.equal(receipt.productionReadiness,'UNKNOWN')
 await assert.rejects(executeVerification(p,d),/EEXIST/)
 assert.equal(d.calls.length,6,'NO_RETRY_LATCH_REQUIRED')
})
test('main failure or cleanup UNKNOWN stops later probes and saves suite BLOCK receipt',async t=>{
 for(const unknown of [false,true]){
  const p=await packet(t),d=drivers()
  if(unknown)d.probe=async input=>d.persist(input,{status:'BLOCK',failure:{message:'EXPECTED_CLEANUP_FAILURE'},warnings:[],cleanup:{status:'UNKNOWN'}})
  else d.run=async input=>d.persist(input,{status:'BLOCK',failure:{message:'TEST_MAIN_FAILURE'},cleanup:{status:'UNKNOWN'}})
  const result=await executeVerification(p,d);assert.equal(result.status,'BLOCK');assert(result.failure)
  assert(!d.calls.includes('abort'));assert.equal(JSON.parse(await readFile(path.join(result.directory,'receipt.json'))).status,'BLOCK')
 }
})
test('case artifact drift prevents suite PASS and later cleanup probes',async t=>{
 const p=await packet(t),d=drivers(),run=d.run
 d.run=async input=>{const result=await run(input);await writeFile(path.join(input.directory,'plan-seed.json'),'changed');return result}
 const result=await executeVerification(p,d);assert.equal(result.status,'BLOCK');assert.match(result.failure.message,/CASE_BYTES_CHANGED/)
 assert.deepEqual(d.calls,['owner','main'])
})
test('incomplete CLI inputs reject without loading Payload or provision',()=>{
 const result=spawnSync(process.execPath,['src/scripts/issue180/gate-c-cli.mjs','execute'],{encoding:'utf8',timeout:5000,env:{PATH:'/usr/bin:/bin'}})
 assert.equal(result.status,2);assert.match(result.stderr,/BLOCK/)
})
test('worker warning in main receipt is retained in terminal BLOCK and prevents probes',async t=>{
 const p=await packet(t),d=drivers(),warning={source:'worker-output',lines:['[23:02:45] WARN: sharp not installed']}
 d.run=async input=>{d.calls.push('main');return d.persist(input,{status:'BLOCK',failure:{message:'WORKER_WARNING'},warnings:[warning],caseResults:[],cleanup:{databaseAbsent:true,serverStopped:true,directoryAbsent:true}})}
 const result=await executeVerification(p,d),receipt=JSON.parse(await readFile(path.join(result.directory,'receipt.json')))
 assert.equal(receipt.status,'BLOCK');assert.deepEqual(receipt.warnings,[warning]);assert.deepEqual(d.calls,['owner','main'])
})
test('warnings in an incorrectly PASS main receipt force terminal BLOCK',async t=>{
 const p=await packet(t),d=drivers(),warning={source:'worker-output',lines:['[23:02:45] WARN: synthetic']}
 d.run=async input=>{d.calls.push('main');return d.persist(input,{status:'PASS',warnings:[warning],caseResults:[],cleanup:{databaseAbsent:true,serverStopped:true,directoryAbsent:true}})}
 const result=await executeVerification(p,d),receipt=JSON.parse(await readFile(path.join(result.directory,'receipt.json')))
 assert.equal(receipt.status,'BLOCK');assert.match(receipt.failure.message,/WARNING_STOP/);assert.deepEqual(receipt.warnings,[warning]);assert.deepEqual(d.calls,['owner','main'])
})
