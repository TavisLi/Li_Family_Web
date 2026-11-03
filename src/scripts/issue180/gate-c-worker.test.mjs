import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {runPreparedGroups,guardPayload} from './gate-c-worker.mjs'

for(const failure of [null,'B','C','D'])test('worker owns Payload close and stops subsequent groups: '+failure,async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-worker-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const calls=[],input={owner:{directory,database:'synthetic',runId:'test-only'},root:process.cwd(),directory,deadline:Date.now()+5000,manifestSha256:'a'.repeat(64)}
 const group=name=>async ctx=>{calls.push(name);await ctx.checkpoint(name);if(failure===name)throw Error('TEST_FAILURE_'+name);await ctx.save(name.toLowerCase(),{status:'PASS'});return [{id:name,status:'PASS'}]}
 const deps={bootstrapPayload:async args=>{assert(!args.options.uri.includes('password'));return {payload:{},config:{},close:async()=>calls.push('close')}},loadFixture:async()=>({admin:{id:1}}),runWriters:group('B'),runAccess:group('C'),runRecovery:group('D')}
 const bridge=async method=>{assert(['ownershipEdges','observe','checkpoint'].includes(method));return []}
 if(failure)await assert.rejects(runPreparedGroups(input,bridge,deps),new RegExp('TEST_FAILURE_'+failure))
 else {assert.equal((await runPreparedGroups(input,bridge,deps)).length,3);const saved=JSON.parse(await readFile(path.join(directory,'b.json')));assert.equal(saved.manifestSha256,input.manifestSha256);assert.equal(saved.runId,'test-only')}
 assert.equal(calls.at(-1),'close');assert.equal(calls.includes('D'),!failure || failure==='D');if(failure==='B')assert(!calls.includes('C'))
})
test('each top-level Payload operation checks owned warning/deadline admission before starting',async()=>{
 let blocked=false,writes=0
 const payload={db:{sentinel:true},update:async function(){assert.equal(this,payload);writes++;return writes}}
 const guarded=guardPayload(payload,async()=>{if(blocked)throw Error('WARNING_STOP')})
 assert.equal(guarded,payload);assert.equal(guarded.db,payload.db);assert.equal(await guarded.update({}),1)
 blocked=true;await assert.rejects(guarded.update({}),/WARNING_STOP/);assert.equal(writes,1)
})
for(const failure of [false,true])test('focused worker runs only plan-seed and closes on '+(failure?'failure':'success'),async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-focused-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const calls=[],input={owner:{directory,database:'synthetic',runId:'test-only'},root:process.cwd(),directory,deadline:Date.now()+5000,manifestSha256:'a'.repeat(64),scope:'plan-seed-diagnostic'}
 const deps={bootstrapPayload:async()=>({payload:{},config:{},close:async()=>calls.push('close')}),loadFixture:async()=>({}),runWriters:async(ctx,opts)=>{assert.equal(opts.focused,true);calls.push('plan-seed');if(failure)throw Error('TEST_FAIL');await ctx.assertPreserved([],[],[]);return [{id:'plan-seed',status:'PASS'}]},runAccess:async()=>{throw Error('ACCESS_ENTERED')},runRecovery:async()=>{throw Error('RECOVERY_ENTERED')}}
 const bridge=async method=>{assert(['ownershipEdges','observe','checkpoint'].includes(method));return []}
 if(failure)await assert.rejects(runPreparedGroups(input,bridge,deps),/TEST_FAIL/);else {const result=await runPreparedGroups(input,bridge,deps);assert.equal(result[0].id,'plan-seed');assert.equal(result[0].observerEvidence.length,1)}
 assert.deepEqual(calls,['plan-seed','close'])
})
test('completion IPC sends compact records and waits for send callback',async()=>{
 const {sendWorkerResult}=await import('./gate-c-worker.mjs'),records=Array.from({length:17},(_,i)=>({id:'case-'+i,status:i===16?'PENDING_FINAL_CLEANUP':'PASS',cases:[{data:'x'.repeat(50000)}]}))
 let sent,callback,settled=false
 records[0].observerEvidence=[{path:'observer-check-001.json',sha256:'a'.repeat(64)}]
 const pending=sendWorkerResult({send:(value,cb)=>{sent=value;callback=cb}},records).then(()=>{settled=true})
 await Promise.resolve();assert.equal(settled,false);assert(Buffer.byteLength(JSON.stringify(sent))<4096);assert.equal(sent.records.length,17);assert.equal('cases' in sent.records[0],false);assert.deepEqual(sent.records[0].observerEvidence,records[0].observerEvidence)
 callback(null);await pending;assert.equal(settled,true)
 await assert.rejects(sendWorkerResult({send:(_value,cb)=>cb(Error('IPC_FAILED'))},records),/IPC_FAILED/)
})
test('real Node IPC sends large case artifacts as a compact completed message',async()=>{
 const {spawn}=await import('node:child_process'),{pathToFileURL}=await import('node:url')
 const moduleURL=pathToFileURL(path.join(process.cwd(),'src/scripts/issue180/gate-c-worker.mjs')).href
 const script=`const {sendWorkerResult}=await import(process.argv[1]);const rows=Array.from({length:17},(_,i)=>({id:'case-'+i,status:'PASS',cases:[{data:'x'.repeat(50000)}]}));await sendWorkerResult(process,rows);process.disconnect()`
 const child=spawn(process.execPath,['--conditions=react-server','--input-type=module','-e',script,moduleURL],{stdio:['ignore','ignore','pipe','ipc'],env:{PATH:'/usr/bin:/bin',NODE_ENV:'test'}})
 let message,stderr='';child.on('message',value=>{message=value});child.stderr.on('data',data=>{stderr+=data.toString()})
 const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('IPC_TEST_TIMEOUT'))},5000);child.once('error',reject);child.once('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal})})})
 assert.deepEqual(result,{code:0,signal:null},stderr);assert.equal(message.kind,'complete');assert.equal(message.records.length,17);assert(Buffer.byteLength(JSON.stringify(message))<4096)
})
test('Payload close is attempted once and its checkpoints identify completion',async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-close-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 for(const fail of [false,true]) {
  const events=[],input={owner:{directory,database:'synthetic',runId:'test-only'},root:process.cwd(),directory,deadline:Date.now()+5000,manifestSha256:'a'.repeat(64)}
  const deps={bootstrapPayload:async()=>({payload:{},close:async()=>{events.push('close');if(fail)throw Error('CLOSE_FAILED')}}),loadFixture:async()=>({}),runWriters:async()=>[],runAccess:async()=>[],runRecovery:async()=>[]}
  const bridge=async(method,args)=>{if(method==='checkpoint')events.push(args.name);return []}
  if(fail)await assert.rejects(runPreparedGroups(input,bridge,deps),/CLOSE_FAILED/);else await runPreparedGroups(input,bridge,deps)
  assert.deepEqual(events,fail?['worker:payload-close:start','close']:['worker:payload-close:start','close','worker:payload-close:complete'])
 }
})
