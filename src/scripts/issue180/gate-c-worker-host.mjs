import {assertValidationDiagnostic} from './validation-diagnostic.mjs'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { writeFile,readFile } from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {StringDecoder} from 'node:string_decoder'
import { observeDatabase,ownershipEdges,assertOwnedChanges,assertFocusedIdentity,buildFailureEvidence,hasFocusedTargetEvidence } from './gate-c-observer.mjs'
import { workerWarningLines } from './warnings.mjs'
export const MAX_WORKER_OUTPUT_BYTES=8*1024*1024
const workerOutputSha=bytes=>createHash('sha256').update(bytes).digest('hex')
export async function verifyObserverEvidence(directory,refs,runId,manifestSha256,{allowBlock=false,requireTarget=!allowBlock}={}) {
 assert(Array.isArray(refs) && refs.length>0 && refs.length<=32,'OBSERVER_READBACK_UNKNOWN')
 const seen=new Set(),sha=value=>createHash('sha256').update(value).digest('hex');let targetSeen=false
 for(const [index,ref] of refs.entries()) {
  assert(/^observer-check-[0-9]{3}\.json$/.test(ref.path) && /^[a-f0-9]{64}$/.test(ref.sha256) && !seen.has(ref.path),'OBSERVER_READBACK_REFERENCE');seen.add(ref.path)
  assert.equal(ref.path,'observer-check-'+String(index+1).padStart(3,'0')+'.json','OBSERVER_READBACK_SEQUENCE')
  const bytes=await readFile(path.join(directory,ref.path));assert(bytes.length<=1100000 && sha(bytes)===ref.sha256,'OBSERVER_READBACK_HASH_DRIFT')
  const doc=JSON.parse(bytes);assert(doc.runId===runId && doc.manifestSha256===manifestSha256,'OBSERVER_READBACK_BINDING')
  assert(doc.status==='PASS' || doc.status==='BLOCK','OBSERVER_READBACK_UNKNOWN')
  assert(allowBlock || doc.status==='PASS','OBSERVER_READBACK_NOT_PASS')
  const {runId:ignoredRun,manifestSha256:ignoredManifest,evidenceSha256,...body}=doc
  assert(ignoredRun===runId && ignoredManifest===manifestSha256 && sha(JSON.stringify(body))===evidenceSha256,'OBSERVER_EVIDENCE_HASH_DRIFT')
  assert(sha(JSON.stringify(body.before))===body.beforeSha256 && sha(JSON.stringify(body.after))===body.afterSha256,'OBSERVER_SNAPSHOT_HASH_DRIFT')
  assert.deepEqual({...body,evidenceSha256},buildFailureEvidence(body.before,body.after,body.allowed,body.edges,doc.status),'OBSERVER_READBACK_INCONSISTENT')
  if(doc.status==='PASS'){assertOwnedChanges(body.before,body.after,body.allowed,body.edges);assertFocusedIdentity(body.after,body.allowed,body.edges);targetSeen ||= hasFocusedTargetEvidence(body.after,body.allowed,body.edges)}
 }
 assert(!requireTarget || targetSeen,'OBSERVER_TARGET_IDENTITY_UNKNOWN')
 return refs
}

// The parent retains the real postmaster handle. The child has only an explicit
// synthetic environment/cwd, actual Payload operations and an allowlisted IPC.
export function runVerificationWorker({lifecycle,owner,root,directory,options,checkpoint,manifestSha256,scope},deps={spawn}) {
 assert(scope===undefined || scope==='plan-seed-diagnostic','WORKER_SCOPE_DENIED')
 return new Promise((resolve,reject)=>{
  const rpcController=new AbortController(),workOptions={...options,signal:options.signal?AbortSignal.any([options.signal,rpcController.signal]):rpcController.signal}
  const child=deps.spawn(process.execPath,['--conditions=react-server',path.join(root,'src/scripts/issue180/gate-c-worker.mjs')],{
   cwd:path.join(owner.directory,'home'),detached:true,stdio:['ignore','pipe','pipe','ipc'],
   env:{PATH:path.dirname(process.execPath)+':/usr/bin:/bin',HOME:path.join(owner.directory,'home'),TMPDIR:path.join(owner.directory,'home'),NODE_ENV:'production',PAYLOAD_ENABLE_DEV_SCHEMA_PUSH:'false'},
  })
  let bytes=0,logChunks=[],warningText='',workerWarnings=[],failure,complete,completionReceived=false,closed=false,exited=false,escalation,watchdog,busy=false,latest=0,inFlight=Promise.resolve(),outputTruncated=false
  const warningDecoder=new StringDecoder('utf8')
  const stop=error=>{
   if(failure)return;failure=error;rpcController.abort()
   if(!exited && !closed){child.kill('SIGTERM');escalation=setTimeout(()=>{if(!exited && !closed)child.kill('SIGKILL')},3000)}
   watchdog=setTimeout(()=>reject(Object.assign(failure,{workerExit:'UNKNOWN'})),8000)
  }
  const abort=()=>stop(Error('WORKER_INTERRUPTED'))
  const timer=setTimeout(()=>stop(Error('WORKER_DEADLINE')),Math.max(1,options.deadline-Date.now()))
  options.signal?.addEventListener('abort',abort,{once:true})
  const rememberWarnings=text=>{
   warningText+=text
   const lines=warningText.split(/\r?\n/);warningText=lines.pop() ?? ''
   for(const line of lines){const found=workerWarningLines(line);if(found.length)workerWarnings.push(...found.slice(0,64-workerWarnings.length).map(value=>value.slice(0,4096)))}
  }
  const collect=chunk=>{
   const value=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk),remaining=MAX_WORKER_OUTPUT_BYTES-bytes,kept=value.subarray(0,Math.max(0,remaining))
   if(kept.length){logChunks.push(kept);bytes+=kept.length}
   rememberWarnings(warningDecoder.write(value))
   if(value.length>remaining){outputTruncated=true;const error=Object.assign(Error('WORKER_OUTPUT_CAP'),{effects:'UNKNOWN'});if(workerWarnings.length)error.workerWarnings=[{source:'worker-output',lines:workerWarnings}];stop(error)}
   else if(workerWarnings.length&&!failure)stop(Object.assign(Error('WORKER_WARNING'),{effects:'UNKNOWN',workerWarnings:[{source:'worker-output',lines:workerWarnings}]}))
  }
  child.stdout.on('data',collect);child.stderr.on('data',collect)
  child.once('error',error=>stop(error))
  child.once('exit',()=>{exited=true})
  child.on('message',async message=>{
   if(failure){if(message?.kind==='failed' && !failure.originalWorkerFailure){const original=String(message.message ?? 'WORKER_FAILED').slice(0,4096);failure.originalWorkerFailure={message:original,truncated:String(message.message ?? '').length>4096}}return}
   try {
    assert(Buffer.byteLength(JSON.stringify(message))<=16*1024*1024,'WORKER_MESSAGE_CAP')
    if(message.kind==='complete'){assert(!completionReceived && !busy,'WORKER_DUPLICATE_OR_PREMATURE_COMPLETE');completionReceived=true;complete=message.records;return}
    if(message.kind==='failed')throw Object.assign(Error('WORKER_FAILED: '+message.message),{observerEvidence:message.observerEvidence,roundtripEvidence:message.roundtripEvidence,validationDiagnostic:message.validationDiagnostic?assertValidationDiagnostic(message.validationDiagnostic):undefined})
    assert(message.kind==='rpc' && Number.isSafeInteger(message.id) && message.id>latest && !busy,'WORKER_RPC_ORDER')
    if(scope==='plan-seed-diagnostic')assert(['observe','ownershipEdges','checkpoint'].includes(message.method),'WORKER_SCOPE_METHOD_DENIED')
    latest=message.id;busy=true
    const args=message.args ?? {},methods={
     sql:async()=>JSON.parse((await lifecycle.query(args.text,workOptions)).stdout),
     commandSQL:()=>lifecycle.query(args.text,workOptions),
     observe:()=>observeDatabase(lifecycle,workOptions,args),
     ownershipEdges:()=>ownershipEdges(async text=>JSON.parse((await lifecycle.query(text,workOptions)).stdout)),
     checkpoint:async()=>{assert(typeof args.name==='string' && args.name.length<200,'CHECKPOINT_NAME');await checkpoint(args.name);return true},
     backup:()=>lifecycle.backup(args.args[0],workOptions),
     createOwnedRecoveryDatabase:()=>lifecycle.createOwnedRecoveryDatabase(workOptions),
     restoreToOwnedDatabase:()=>lifecycle.restoreToOwnedDatabase(args.args[0],args.args[1],workOptions),
     queryOwnedRecoveryDatabase:()=>lifecycle.queryOwnedRecoveryDatabase(args.args[0],args.args[1],workOptions),
     dropOwnedRecoveryDatabase:()=>lifecycle.dropOwnedRecoveryDatabase(args.args[0],workOptions),
    }
    assert(Object.hasOwn(methods,message.method),'WORKER_METHOD_DENIED')
    let reply
    try {inFlight=methods[message.method]();reply={kind:'reply',id:message.id,result:await inFlight}}
    catch(error){reply={kind:'reply',id:message.id,error:error.message};stop(Object.assign(Error('WORKER_RPC_FAILED:'+message.method+':'+error.message),{stdout:error.stdout,stderr:error.stderr}))}
    busy=false
    if(child.connected)child.send(reply)
   } catch(error){busy=false;stop(error)}
  })
  child.once('close',async(code,signal)=>{
   closed=true;clearTimeout(timer);clearTimeout(escalation);options.signal?.removeEventListener('abort',abort)
   let workerExitEvidence,workerExitEvidenceStatus='UNKNOWN',workerExitEvidenceError
   try {
    const body={version:1,runId:owner.runId,manifestSha256,exitCode:code,signal,completionReceived,resultIsArray:Array.isArray(complete),recordCount:Array.isArray(complete)?complete.length:null}
    const bytes=Buffer.from(JSON.stringify(body)+'\n'),file=path.join(directory,'worker-exit-evidence.json')
    await writeFile(file,bytes,{flag:'wx',mode:0o600});const saved=await readFile(file);assert(saved.equals(bytes),'WORKER_EXIT_EVIDENCE_READBACK_CHANGED')
    workerExitEvidence={path:'worker-exit-evidence.json',sha256:workerOutputSha(saved)};workerExitEvidenceStatus='VERIFIED'
   }catch(error){workerExitEvidenceError=error.message}
   try {
    await inFlight.catch(()=>{});clearTimeout(watchdog)
    rememberWarnings(warningDecoder.end())
    if(warningText){const found=workerWarningLines(warningText);if(found.length)workerWarnings.push(...found.slice(0,64-workerWarnings.length).map(value=>value.slice(0,4096)))}
    const log=Buffer.concat(logChunks,bytes),logPath=path.join(directory,'worker.log')
    try{
     await writeFile(logPath,log,{flag:'wx',mode:0o600})
     const saved=await readFile(logPath);assert(saved.equals(log),'WORKER_OUTPUT_READBACK_CHANGED')
     const body={version:1,runId:owner.runId,manifestSha256,path:'worker.log',sha256:workerOutputSha(saved),bytes:saved.length,limit:MAX_WORKER_OUTPUT_BYTES,truncated:outputTruncated,readback:'VERIFIED'}
     const metadata=Buffer.from(JSON.stringify(body)+'\n'),metadataPath=path.join(directory,'worker-output-evidence.json')
     await writeFile(metadataPath,metadata,{flag:'wx',mode:0o600})
     const savedMetadata=await readFile(metadataPath);assert(savedMetadata.equals(metadata),'WORKER_OUTPUT_METADATA_READBACK_CHANGED')
     const evidence={path:body.path,sha256:body.sha256,bytes:body.bytes,limit:body.limit,truncated:body.truncated,readback:'VERIFIED',metadataPath:'worker-output-evidence.json',metadataSha256:workerOutputSha(savedMetadata)}
     if(failure){failure.workerOutputEvidence=evidence;failure.workerOutputEvidenceStatus='VERIFIED'}
    }catch(error){
     if(failure){failure.workerOutputEvidenceStatus='UNKNOWN';failure.workerOutputEvidenceError=error.message}
     else failure=Object.assign(Error('WORKER_OUTPUT_EVIDENCE_UNKNOWN'),{effects:'UNKNOWN',workerOutputEvidenceStatus:'UNKNOWN',workerOutputEvidenceError:error.message})
    }
    if(failure?.validationDiagnostic) {
     try {
      const value={runId:owner.runId,manifestSha256,status:'BLOCK',diagnostic:assertValidationDiagnostic(failure.validationDiagnostic)},file='validation-diagnostic.json',bytes=Buffer.from(JSON.stringify(value))
      await writeFile(path.join(directory,file),bytes,{flag:'wx',mode:0o600})
      const saved=await readFile(path.join(directory,file));assert(saved.equals(bytes),'VALIDATION_READBACK_CHANGED')
      failure.validationEvidence={path:file,sha256:createHash('sha256').update(saved).digest('hex')};failure.validationEvidenceStatus='VERIFIED'
     }catch(error){failure.validationEvidenceStatus='UNKNOWN';failure.validationEvidenceError=error.message}
    }
    if(failure?.roundtripEvidence) {
     try{const ref=failure.roundtripEvidence;assert(ref.path==='memory-v2-roundtrip-conflict.json' && /^[a-f0-9]{64}$/.test(ref.sha256),'V2_EVIDENCE_REFERENCE');const bytes=await readFile(path.join(directory,ref.path));assert(bytes.length<=1100000 && createHash('sha256').update(bytes).digest('hex')===ref.sha256,'V2_EVIDENCE_HASH_DRIFT');const doc=JSON.parse(bytes);assert(doc.runId===owner.runId && doc.manifestSha256===manifestSha256 && doc.status==='BLOCK','V2_EVIDENCE_BINDING');failure.roundtripEvidenceStatus='VERIFIED'}catch(error){failure.roundtripEvidenceStatus='UNKNOWN';failure.roundtripEvidenceError=error.message}
    }
    if(scope==='plan-seed-diagnostic') {
     const refs=failure?.observerEvidence ?? complete?.[0]?.observerEvidence
     try{await verifyObserverEvidence(directory,refs,owner.runId,manifestSha256,{allowBlock:Boolean(failure)})}catch(error){if(failure){failure.observerEvidenceStatus='UNKNOWN';failure.observerEvidenceError=error.message}else throw Object.assign(error,{observerEvidence:refs,observerEvidenceStatus:'UNKNOWN',observerEvidenceError:error.message})}
    }
    if(failure){
     if(workerWarnings.length)failure.workerWarnings=[{source:'worker-output',lines:workerWarnings}]
     throw failure
    }
    assert(!workerWarnings.length,'WORKER_WARNING')
    assert(workerExitEvidenceStatus==='VERIFIED','WORKER_EXIT_EVIDENCE_UNKNOWN')
    assert(code===0 && !signal && Array.isArray(complete),'WORKER_EXIT_OR_RESULT_UNKNOWN')
    assert(complete.length===(scope==='plan-seed-diagnostic'?1:17),'WORKER_CASE_COUNT')
    if(scope==='plan-seed-diagnostic')assert(complete[0]?.id==='plan-seed' && complete[0]?.status==='PASS','WORKER_SCOPE_RESULT')
    const absence=await lifecycle.verifyClientAbsence(child.pid,options)
    await writeFile(path.join(directory,'worker-absence.json'),JSON.stringify({manifestSha256,runId:owner.runId,...absence}),{flag:'wx',mode:0o600})
    const cleanupRecord=complete.find(row=>row?.id==='cleanup')
    if(cleanupRecord)cleanupRecord.workerExitEvidence=workerExitEvidence
    resolve(complete)
   } catch(error){error.workerExitEvidence=workerExitEvidence;error.workerExitEvidenceStatus=workerExitEvidenceStatus;error.workerExitEvidenceError=workerExitEvidenceError;reject(error)}
  })
  if(options.signal?.aborted)abort()
  else child.send({kind:'start',input:{owner,root,directory,deadline:options.deadline,manifestSha256,...(scope?{scope}:{})}})
 })
}
