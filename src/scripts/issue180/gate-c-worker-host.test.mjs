import test from 'node:test'
import assert from 'node:assert/strict'
import {EventEmitter} from 'node:events'
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {buildFailureEvidence} from './gate-c-observer.mjs'
import os from 'node:os'
import path from 'node:path'
import {runVerificationWorker,verifyObserverEvidence} from './gate-c-worker-host.mjs'
const row=(table,id,value)=>({table,key:JSON.stringify([id]),value:{id,...value}})
const targetBefore=[row('travel_plans',1,{}),row('travel_route_identities',8,{owner_key:'travel-plans:1'})],targetAfter=[...targetBefore,row('travel_route_identities_rels',21,{parent_id:8,path:'owner',travel_plans_id:1,travel_memories_id:null})],targetAllowed=[{collection:'travel-plans',id:1},{collection:'travel-route-identities',id:8}],targetEdges=[{table_name:'travel_route_identities_rels',column_name:'parent_id',parent_table:'travel_route_identities',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_plans_id',parent_table:'travel_plans',parent_column:'id'},{table_name:'travel_route_identities_rels',column_name:'travel_memories_id',parent_table:'travel_memories',parent_column:'id'}]

async function harness(t,drive) {
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-host-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.pid=987654;child.connected=true
 const killed=[],calls=[]
 child.kill=signal=>{killed.push(signal);queueMicrotask(()=>{child.emit('exit',null,signal);child.emit('close',null,signal)});return true}
 child.send=message=>queueMicrotask(()=>drive(child,message))
 const input={root:process.cwd(),directory,owner:{directory,database:'synthetic',runId:'synthetic'},manifestSha256:'a'.repeat(64),options:{deadline:Date.now()+3000},checkpoint:async name=>calls.push(name),lifecycle:{query:async text=>({stdout:JSON.stringify({synthetic:text})}),verifyClientAbsence:async pid=>({pid,processGroupAbsence:'VERIFIED'})}}
 const deps={spawn:(file,args,options)=>{assert.equal(file,process.execPath);assert(args.includes('--conditions=react-server'));assert.equal(options.cwd,path.join(directory,'home'));assert(!('DATABASE_URI' in options.env));assert(!('NODE_OPTIONS' in options.env));return child}}
 return {input,deps,killed,calls,directory}
}
test('worker host bounds sanitized IPC, waits for close and independent client absence',async t=>{
 const h=await harness(t,(child,message)=>{
  if(message.kind==='start')child.emit('message',{kind:'rpc',id:1,method:'sql',args:{text:'synthetic-only'}})
  else {assert.deepEqual(message.result,{synthetic:'synthetic-only'});child.emit('message',{kind:'complete',records:Array.from({length:17},(_,i)=>({id:i}))});child.emit('exit',0,null);child.emit('close',0,null)}
 })
 assert.equal((await runVerificationWorker(h.input,h.deps)).length,17)
 assert.deepEqual(h.killed,[]);assert.equal(JSON.parse(await readFile(path.join(h.directory,'worker-absence.json'))).processGroupAbsence,'VERIFIED')
})
test('focused worker host denies recovery and arbitrary SQL before dispatch',async t=>{
 for(const method of ['backup','sql','restoreToOwnedDatabase']) {
  const h=await harness(t,(child,message)=>{if(message.kind==='start')child.emit('message',{kind:'rpc',id:1,method,args:{}})})
  h.input.scope='plan-seed-diagnostic'
  await assert.rejects(runVerificationWorker(h.input,h.deps),/WORKER_SCOPE_METHOD_DENIED/)
 }
})
test('focused worker host accepts exactly one plan-seed result',async t=>{
 let ref;const h=await harness(t,(child,message)=>{if(message.kind==='start'){assert.equal(message.input.scope,'plan-seed-diagnostic');child.emit('message',{kind:'complete',records:[{id:'plan-seed',status:'PASS',observerEvidence:[ref]}]});child.emit('exit',0,null);child.emit('close',0,null)}})
 const bytes=Buffer.from(JSON.stringify({runId:'synthetic',manifestSha256:h.input.manifestSha256,...buildFailureEvidence(targetBefore,targetAfter,targetAllowed,targetEdges,'PASS')},null,2)+'\n');ref={path:'observer-check-001.json',sha256:createHash('sha256').update(bytes).digest('hex')};await writeFile(path.join(h.directory,ref.path),bytes)
 h.input.scope='plan-seed-diagnostic';assert.equal((await runVerificationWorker(h.input,h.deps))[0].observerEvidence[0].sha256,ref.sha256)
})
test('independent observer evidence read-back blocks drift and missing evidence',async t=>{
 const h=await harness(t,()=>{}),bytes=Buffer.from(JSON.stringify({runId:'synthetic',manifestSha256:h.input.manifestSha256,...buildFailureEvidence([],[],[],[],'PASS')})),ref={path:'observer-check-001.json',sha256:createHash('sha256').update(bytes).digest('hex')}
 await writeFile(path.join(h.directory,ref.path),bytes);await verifyObserverEvidence(h.directory,[ref],'synthetic',h.input.manifestSha256,{requireTarget:false})
 await writeFile(path.join(h.directory,ref.path),'changed');await assert.rejects(verifyObserverEvidence(h.directory,[ref],'synthetic',h.input.manifestSha256),/OBSERVER_READBACK_HASH_DRIFT/)
 await assert.rejects(verifyObserverEvidence(h.directory,[],'synthetic',h.input.manifestSha256),/OBSERVER_READBACK_UNKNOWN/)
})
test('BLOCK evidence can be preserved on failure but cannot produce focused PASS',async t=>{
 const h=await harness(t,()=>{}),bytes=Buffer.from(JSON.stringify({runId:'synthetic',manifestSha256:h.input.manifestSha256,...buildFailureEvidence([],[],[],[],'BLOCK')})),ref={path:'observer-check-001.json',sha256:createHash('sha256').update(bytes).digest('hex')}
 await writeFile(path.join(h.directory,ref.path),bytes)
 await verifyObserverEvidence(h.directory,[ref],'synthetic',h.input.manifestSha256,{allowBlock:true})
 await assert.rejects(verifyObserverEvidence(h.directory,[ref],'synthetic',h.input.manifestSha256),/OBSERVER_READBACK_NOT_PASS/)
})
test('focused failure propagates independently read-back observer evidence',async t=>{
 let ref;const h=await harness(t,(child,message)=>{if(message.kind==='start')child.emit('message',{kind:'failed',message:'NON_TARGET',observerEvidence:[ref]})})
 const wrong=structuredClone(targetAfter);wrong.at(-1).value.travel_plans_id=2
 const bytes=Buffer.from(JSON.stringify({runId:'synthetic',manifestSha256:h.input.manifestSha256,...buildFailureEvidence(targetBefore,wrong,targetAllowed,targetEdges,'BLOCK')}));ref={path:'observer-check-001.json',sha256:createHash('sha256').update(bytes).digest('hex')};await writeFile(path.join(h.directory,ref.path),bytes);h.input.scope='plan-seed-diagnostic'
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{assert.match(error.message,/WORKER_FAILED/);assert.deepEqual(error.observerEvidence,[ref]);assert.equal(error.observerEvidenceStatus,undefined);return true})
})
test('focused completion with unreadable evidence retains references and UNKNOWN',async t=>{
 const ref={path:'observer-check-001.json',sha256:'a'.repeat(64)},h=await harness(t,(child,message)=>{if(message.kind==='start'){child.emit('message',{kind:'complete',records:[{id:'plan-seed',status:'PASS',observerEvidence:[ref]}]});child.emit('exit',0,null);child.emit('close',0,null)}})
 h.input.scope='plan-seed-diagnostic';await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{assert.equal(error.observerEvidenceStatus,'UNKNOWN');assert.deepEqual(error.observerEvidence,[ref]);return true})
})
for(const drift of [false,true])test('v2 conflict evidence host read-back '+(drift?'marks drift UNKNOWN':'retains BLOCK evidence'),async t=>{
 let ref;const h=await harness(t,(child,message)=>{if(message.kind==='start')child.emit('message',{kind:'failed',message:'V2_ROUNDTRIP_CONFLICT',roundtripEvidence:ref})})
 const bytes=Buffer.from(JSON.stringify({runId:'synthetic',manifestSha256:h.input.manifestSha256,status:'BLOCK',conflicts:['$.title']}));ref={path:'memory-v2-roundtrip-conflict.json',sha256:createHash('sha256').update(bytes).digest('hex')};await writeFile(path.join(h.directory,ref.path),drift?Buffer.from('changed'):bytes)
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{assert.match(error.message,/V2_ROUNDTRIP_CONFLICT/);assert.equal(error.roundtripEvidenceStatus,drift?'UNKNOWN':'VERIFIED');return true})
})
for(const kind of ['warning','json-warning','method','incomplete','absent'])test('worker host stops or rejects '+kind+' without later business calls',async t=>{
 const h=await harness(t,(child,message)=>{
  if(message.kind!=='start')return
  if(kind==='warning'){child.stderr.emit('data',Buffer.from('WAR'));child.stderr.emit('data',Buffer.from('NING: synthetic\n'))}
  if(kind==='json-warning')child.stderr.emit('data',Buffer.from('{"level":40,"msg":"synthetic"}\n'))
  if(kind==='method')child.emit('message',{kind:'rpc',id:1,method:'external-connect',args:{}})
  if(['incomplete','absent'].includes(kind)){child.emit('message',{kind:'complete',records:Array(kind==='absent'?17:16).fill({})});child.emit('exit',0,null);child.emit('close',0,null)}
 })
 if(kind==='absent')h.input.lifecycle.verifyClientAbsence=async()=>{throw Error('CLIENT_PROCESS_ABSENCE_UNKNOWN')}
  await assert.rejects(runVerificationWorker(h.input,h.deps),new RegExp(kind.endsWith('warning')?'WORKER_WARNING':kind==='method'?'WORKER_METHOD_DENIED':kind==='incomplete'?'WORKER_CASE_COUNT':'CLIENT_PROCESS_ABSENCE_UNKNOWN'))
  if(['warning','json-warning','method'].includes(kind))assert.deepEqual(h.killed,['SIGTERM'])
})
test('worker failure aborts its in-flight SQL transport and awaits settlement before returning',async t=>{
 let settled=false
 const h=await harness(t,(child,message)=>{if(message.kind==='start')child.emit('message',{kind:'rpc',id:1,method:'sql',args:{text:'synthetic-blocked'}})})
 h.input.lifecycle.query=async(text,{signal})=>new Promise((resolve,reject)=>{
  signal.addEventListener('abort',()=>{settled=true;reject(Error('SYNTHETIC_SQL_ABORTED'))},{once:true})
  queueMicrotask(()=>h.deps.child.stderr.emit('data',Buffer.from('WARNING: synthetic\n')))
 })
 const spawn=h.deps.spawn;h.deps.spawn=(...args)=>{const child=spawn(...args);h.deps.child=child;return child}
 await assert.rejects(runVerificationWorker(h.input,h.deps),/WORKER_WARNING/);assert(settled)
})
test('an exited worker is never signalled again while waiting for pipe close',async t=>{
 const h=await harness(t,(child,message)=>{
  if(message.kind==='start'){child.emit('exit',0,null);child.stderr.emit('data',Buffer.from('WARNING: synthetic late\n'));child.emit('close',0,null)}
 })
 await assert.rejects(runVerificationWorker(h.input,h.deps),/WORKER_WARNING/);assert.deepEqual(h.killed,[])
})
test('Payload pretty WARN is stopped and propagated as warning evidence',async t=>{
 const h=await harness(t,(child,message)=>{
  if(message.kind==='start'){
   child.stderr.emit('data',Buffer.from('[23:02:45] \u001b[33mWA'))
   child.stderr.emit('data',Buffer.from('RN\u001b[39m: \u001b[36mImage resizing is enabled; sharp not installed\u001b[39m\n'))
   child.emit('message',{kind:'complete',records:Array(17).fill({})})
   child.emit('exit',0,null);child.emit('close',0,null)
  }
 })
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{
  assert.match(error.message,/WORKER_WARNING/)
  assert.ok(error.workerWarnings?.some(w=>w.lines.some(line=>line.includes('sharp not installed'))))
  return true
 })
})
test('worker output above the former 1 MiB limit is preserved and read back byte-for-byte',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){
  const chunk=Buffer.from('synthetic QueryError: expected denial\n'),size=1024*1024+8192
  for(let offset=0;offset<size;offset+=chunk.length)child.stderr.emit('data',chunk.subarray(0,Math.min(chunk.length,size-offset)))
  child.emit('message',{kind:'complete',records:Array(17).fill({})});child.emit('exit',0,null);child.emit('close',0,null)
 }})
 const records=await runVerificationWorker(h.input,h.deps),saved=await readFile(path.join(h.directory,'worker.log'))
 const evidence=JSON.parse(await readFile(path.join(h.directory,'worker-output-evidence.json'),'utf8'))
 assert.equal(records.length,17);assert(saved.length>1024*1024)
 assert.equal(createHash('sha256').update(saved).digest('hex'),evidence.sha256)
 assert.equal(evidence.runId,'synthetic');assert.equal(evidence.manifestSha256,h.input.manifestSha256);assert.equal(evidence.readback,'VERIFIED')
})
test('warning split across noisy chunks is detected without unbounded rescan',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){
  child.stderr.emit('data',Buffer.from('x'.repeat(64*1024)+'\n[23:02:45] \u001b[33mWA'))
  child.stderr.emit('data',Buffer.from('RN\u001b[39m: synthetic warning\n'))
  child.emit('message',{kind:'complete',records:Array(17).fill({})});child.emit('exit',0,null);child.emit('close',0,null)
 }})
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>error.workerWarnings?.some(w=>w.lines.some(line=>line.includes('synthetic warning'))))
})
test('worker output cap stops execution, stores bounded evidence and preserves later worker failure',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){
  child.stderr.emit('data',Buffer.alloc(8*1024*1024+1,0x78))
  child.emit('message',{kind:'failed',message:'UNEXPECTED_QUERY_FAILURE'})
 }})
 let failure;await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{failure=error;return /WORKER_OUTPUT_CAP/.test(error.message)})
 assert.equal(failure.originalWorkerFailure?.message,'UNEXPECTED_QUERY_FAILURE');assert.equal(failure.effects,'UNKNOWN');assert.equal(failure.workerOutputEvidenceStatus,'VERIFIED')
 const saved=await readFile(path.join(h.directory,'worker.log'))
 assert.equal(saved.length,8*1024*1024);assert.equal(createHash('sha256').update(saved).digest('hex'),failure.workerOutputEvidence.sha256)
 const metadataBytes=await readFile(path.join(h.directory,'worker-output-evidence.json')),metadata=JSON.parse(metadataBytes)
 assert.equal(metadata.runId,'synthetic');assert.equal(metadata.manifestSha256,h.input.manifestSha256);assert.equal(metadata.truncated,true)
 assert.equal(metadata.bytes,8*1024*1024);assert.equal(metadata.limit,8*1024*1024);assert.equal(metadata.readback,'VERIFIED')
 assert.equal(createHash('sha256').update(metadataBytes).digest('hex'),failure.workerOutputEvidence.metadataSha256)
})
test('warning arriving after a prior failure is still included in warning evidence',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){
  child.emit('message',{kind:'failed',message:'synthetic failure'})
  child.stderr.emit('data',Buffer.from('[23:02:45] WARN: synthetic late\n'))
 }})
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{
  assert.match(error.message,/WORKER_FAILED/);assert.ok(error.workerWarnings?.some(w=>w.lines[0].includes('synthetic late')));return true
 })
})
test('host saves and independently hashes redacted validation evidence',async t=>{
 const {validationDiagnostic}=await import('./validation-diagnostic.mjs')
 const diagnostic=validationDiagnostic({name:'ValidationError',data:{errors:[{path:'title'}]}},'update',{collection:'travel-memories',locale:'en'})
 const h=await harness(t,(child,message)=>{if(message.kind==='start')child.emit('message',{kind:'failed',message:'PAYLOAD_VALIDATION_FAILED',validationDiagnostic:diagnostic})})
 await assert.rejects(runVerificationWorker(h.input,h.deps),asyncError=>{assert.equal(asyncError.validationEvidenceStatus,'VERIFIED');return true})
 const bytes=await readFile(path.join(h.input.directory,'validation-diagnostic.json')),d=JSON.parse(bytes);assert.equal(d.diagnostic.locale,'en');assert.equal(d.manifestSha256,h.input.manifestSha256)
})
for(const [code,signal,sendComplete] of [[0,null,false],[2,null,false],[null,'SIGTERM',false],[2,null,true]])test('incomplete worker exit saves bound exit evidence '+String(code)+':'+String(signal)+':'+sendComplete,async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){if(sendComplete)child.emit('message',{kind:'complete',records:Array(17).fill({})});child.emit('exit',code,signal);child.emit('close',code,signal)}})
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{assert.match(error.message,/WORKER_EXIT_OR_RESULT_UNKNOWN/);assert.equal(error.workerExitEvidenceStatus,'VERIFIED');assert.equal(error.workerExitEvidence.path,'worker-exit-evidence.json');return true})
 const evidence=JSON.parse(await readFile(path.join(h.directory,'worker-exit-evidence.json')))
 assert.equal(evidence.runId,'synthetic');assert.equal(evidence.manifestSha256,h.input.manifestSha256);assert.equal(evidence.exitCode,code);assert.equal(evidence.signal,signal);assert.equal(evidence.completionReceived,sendComplete)
})
test('missing worker exit evidence prevents PASS without overwriting existing file',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){child.emit('message',{kind:'complete',records:Array(17).fill({})});child.emit('exit',0,null);child.emit('close',0,null)}})
 await writeFile(path.join(h.directory,'worker-exit-evidence.json'),'existing')
 await assert.rejects(runVerificationWorker(h.input,h.deps),error=>{assert.match(error.message,/WORKER_EXIT_EVIDENCE_UNKNOWN/);assert.equal(error.workerExitEvidenceStatus,'UNKNOWN');return true})
 assert.equal(await readFile(path.join(h.directory,'worker-exit-evidence.json'),'utf8'),'existing')
})
test('malformed completion is recorded as received but not accepted',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){child.emit('message',{kind:'complete'});child.emit('exit',0,null);child.emit('close',0,null)}})
 await assert.rejects(runVerificationWorker(h.input,h.deps),/WORKER_EXIT_OR_RESULT_UNKNOWN/)
 const evidence=JSON.parse(await readFile(path.join(h.directory,'worker-exit-evidence.json')))
 assert.equal(evidence.completionReceived,true);assert.equal(evidence.resultIsArray,false);assert.equal(evidence.recordCount,null)
})
test('successful worker cleanup record references independently hashed exit evidence',async t=>{
 const h=await harness(t,(child,message)=>{if(message.kind==='start'){const records=Array.from({length:16},(_,i)=>({id:'case-'+i,status:'PASS'}));records.push({id:'cleanup',status:'PENDING_FINAL_CLEANUP'});child.emit('message',{kind:'complete',records});child.emit('exit',0,null);child.emit('close',0,null)}})
 const records=await runVerificationWorker(h.input,h.deps),ref=records.at(-1).workerExitEvidence,bytes=await readFile(path.join(h.directory,ref.path))
 assert.equal(ref.sha256,createHash('sha256').update(bytes).digest('hex'));const evidence=JSON.parse(bytes)
 assert.equal(evidence.exitCode,0);assert.equal(evidence.signal,null);assert.equal(evidence.completionReceived,true);assert.equal(evidence.recordCount,17)
})
