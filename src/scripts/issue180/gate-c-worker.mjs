import {validationDiagnostic} from './validation-diagnostic.mjs'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFile,readFile } from 'node:fs/promises'
import {createHash} from 'node:crypto'
import { bootstrapPayload,loadFixture } from './payload-runtime.mjs'
import { runWriters } from './gate-c-writers.mjs'
import { runAccess } from './gate-c-access.mjs'
import { runRecovery } from './gate-c-recovery.mjs'
import { assertOwnedChanges,buildFailureEvidence,assertFocusedIdentity } from './gate-c-observer.mjs'
export async function assertPreservedWithEvidence(before,after,allowed,edges,save,options={}) {
 if(options.focused) {
  let failure
  try{assertOwnedChanges(before,after,allowed,edges);assertFocusedIdentity(after,allowed,edges)}catch(error){failure=error}
  const evidence=buildFailureEvidence(before,after,allowed,edges,failure?'BLOCK':'PASS')
  let reference
  try{reference=await save('observer-check-'+String(options.sequence).padStart(3,'0'),evidence)}catch(error){throw Error('OBSERVER_EVIDENCE_UNKNOWN: '+error.message,{cause:error})}
  if(evidence.status==='UNKNOWN')throw Object.assign(Error('OBSERVER_EVIDENCE_UNKNOWN: '+evidence.reason),{observerEvidence:reference})
  if(failure)throw Object.assign(failure,{observerEvidence:reference})
  return reference
 }
 try{return assertOwnedChanges(before,after,allowed,edges)} catch(error) {
  try{await save('observer-failure',buildFailureEvidence(before,after,allowed,edges))}catch(saveError){throw Error('OBSERVER_FAILURE_EVIDENCE_UNKNOWN: '+error.message,{cause:saveError})}
  throw error
 }
}
export function guardPayload(payload,boundary) {
 const operations=new Set(['find','findByID','findVersions','findVersionByID','count','create','update','delete','restoreVersion','login'])
 // This worker exclusively owns the instance until destroy(). Local API methods
 // reattach this same instance to req.payload; a Proxy breaks that identity.
 for(const key of operations) {
  const value=payload[key]
  if(typeof value!=='function')continue
  payload[key]=async(...args)=>{await boundary('payload:'+key);try{return await value.apply(payload,args)}catch(error){const diagnostic=validationDiagnostic(error,key,args[0]);if(diagnostic){error.validationDiagnostic=diagnostic;error.message='PAYLOAD_VALIDATION_FAILED'}throw error}}
 }
 return payload
}

export async function runPreparedGroups(input,bridge,deps={bootstrapPayload,loadFixture,runWriters,runAccess,runRecovery}) {
 assert(input && input.owner && input.root && input.directory && input.manifestSha256,'WORKER_INPUT_REQUIRED')
 assert(input.scope===undefined || input.scope==='plan-seed-diagnostic','WORKER_SCOPE_DENIED')
 const controller=new AbortController(),abort=()=>controller.abort()
 process.once('SIGINT',abort);process.once('SIGTERM',abort)
 const options={deadline:input.deadline,signal:controller.signal,uri:`postgresql://postgres@localhost:5432/${input.owner.database}?host=${encodeURIComponent(path.join(input.owner.directory,'socket'))}`}
 const session=await deps.bootstrapPayload({owner:input.owner,root:input.root,options})
 let closeAttempted=false
 try {
  const payload=guardPayload(session.payload,name=>bridge('checkpoint',{name}))
  const fixture=await deps.loadFixture({payload,root:input.root,options})
  const evidenceRefs=[];let evidenceBytes=0
  const ctx={...session,payload,fixture,owner:input.owner,root:input.root,directory:input.directory,options,
   observe:arg=>bridge('observe',arg ?? {}),sql:text=>bridge('sql',{text}),commandSQL:text=>bridge('commandSQL',{text}),
   checkpoint:name=>bridge('checkpoint',{name}),
   save:async(name,value)=>{assert(/^[a-z][a-z0-9-]*$/.test(name),'EVIDENCE_NAME');const file=name+'.json',bytes=Buffer.from(JSON.stringify({runId:input.owner.runId,manifestSha256:input.manifestSha256,...value},null,2)+'\n');if(name.startsWith('observer-check-')){evidenceBytes+=bytes.length;assert(bytes.length<=1100000 && evidenceBytes<=8*1024*1024,'OBSERVER_EVIDENCE_CAP')}await writeFile(path.join(input.directory,file),bytes,{flag:'wx',mode:0o600});const readback=await readFile(path.join(input.directory,file));assert(readback.equals(bytes),'OBSERVER_EVIDENCE_READBACK');return {path:file,sha256:createHash('sha256').update(readback).digest('hex')}},
   lifecycle:Object.fromEntries(['backup','createOwnedRecoveryDatabase','restoreToOwnedDatabase','queryOwnedRecoveryDatabase','dropOwnedRecoveryDatabase'].map(method=>[method,(...args)=>bridge(method,{args})])),
  }
  const edges=await bridge('ownershipEdges',{})
  ctx.assertPreserved=async(before,after,allowed=[])=>{try{const ref=await assertPreservedWithEvidence(before,after,allowed,edges,ctx.save,{focused:input.scope==='plan-seed-diagnostic',sequence:evidenceRefs.length+1});if(input.scope==='plan-seed-diagnostic')evidenceRefs.push(ref);return ref}catch(error){if(error.observerEvidence)evidenceRefs.push(error.observerEvidence);throw error}}
  ctx.dbSql=(await import('@payloadcms/db-postgres')).sql
  ctx.fixtureBefore=await ctx.observe()
  const records=[]
  try{records.push(...await deps.runWriters(ctx,{focused:input.scope==='plan-seed-diagnostic'}))}catch(error){if(input.scope==='plan-seed-diagnostic')error.observerEvidence=evidenceRefs;throw error}
  if(input.scope==='plan-seed-diagnostic'){assert(evidenceRefs.length>0,'OBSERVER_EVIDENCE_MISSING');records[0].observerEvidence=evidenceRefs}
  if(input.scope!=='plan-seed-diagnostic'){records.push(...await deps.runAccess(ctx));records.push(...await deps.runRecovery(ctx))}
  await bridge('checkpoint',{name:'worker:payload-close:start'})
  closeAttempted=true;await session.close()
  await bridge('checkpoint',{name:'worker:payload-close:complete'})
  return records
 } finally {
  if(!closeAttempted)await session.close()
  process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort)
 }
}

// Detailed case payloads are already persisted/read back as bound artifacts.
// Send only identifiers/status over IPC and wait for delivery before disconnect.
export async function sendWorkerResult(channel,records) {
 assert(Array.isArray(records),'WORKER_RESULT_REQUIRED')
 const compact=records.map(({id,status,observerEvidence})=>{
  assert(typeof id==='string' && typeof status==='string','WORKER_RESULT_INVALID')
  return {id,status,...(observerEvidence?{observerEvidence}:{})}
 })
 await new Promise((resolve,reject)=>channel.send({kind:'complete',records:compact},error=>error?reject(error):resolve()))
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 assert(process.send && process.connected,'WORKER_REQUIRES_OWNED_IPC')
 process.on('warning',warning=>process.send?.({kind:'failed',message:'WORKER_NODE_WARNING:'+warning.name+':'+warning.message}))
 const pending=new Map();let sequence=0,started=false,tail=Promise.resolve()
 const request=(method,args)=>new Promise((resolve,reject)=>{
  const id=++sequence
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('WORKER_RPC_TIMEOUT'))},180000)
  pending.set(id,{resolve,reject,timer});process.send({kind:'rpc',id,method,args})
 })
 const bridge=(method,args)=>{const result=tail.catch(()=>{}).then(()=>request(method,args));tail=result;return result}
 process.on('message',async message=>{
  if(message.kind==='reply') {
   const item=pending.get(message.id);if(!item)return
   clearTimeout(item.timer);pending.delete(message.id)
   if(message.error)item.reject(Error(message.error));else item.resolve(message.result)
  } else if(message.kind==='start' && !started) {
   started=true
   try {const records=await runPreparedGroups(message.input,bridge);await sendWorkerResult(process,records);process.disconnect()}
   catch(error) {process.send({kind:'failed',message:error.message,...(error.validationDiagnostic?{validationDiagnostic:error.validationDiagnostic}:{}),...(error.observerEvidence?{observerEvidence:error.observerEvidence}:{}),...(error.roundtripEvidence?{roundtripEvidence:error.roundtripEvidence}:{})});process.disconnect();process.exitCode=2}
  }
 })
}
