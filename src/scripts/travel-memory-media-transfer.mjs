import assert from 'node:assert/strict'
import path from 'node:path'
import { readFile,realpath,stat,copyFile,mkdir } from 'node:fs/promises'
import { isDeepStrictEqual } from 'node:util'
import { sha256 } from './travel-memory-review.mjs'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'
import { evaluateAuthorization } from './run-contract.mjs'
import {constants} from 'node:fs'
import {readVerifiedMedia} from './travel-memory-verified-media-read.mjs'

// Incremental technical data only; content remains in Source v2.
export function mergeTechnicalRegistries(previous,incoming) {
  validateMediaRegistry(previous,previous.travelSlug);validateMediaRegistry(incoming,previous.travelSlug)
  const merged=structuredClone(previous)
  for(const asset of incoming.assets){const old=merged.assets.find(x=>x.assetId===asset.assetId)
    if(!old){merged.assets.push(structuredClone(asset));continue}
    for(const k of ['byteSize','mimeType','width','height'])assert.equal(old[k],asset[k],'BLOCK: Registry technical identity drift')
    for(const locator of asset.locators){const match=old.locators.find(x=>x.environment===locator.environment&&x.payloadId===locator.payloadId);if(match)assert(isDeepStrictEqual(match,locator),'BLOCK: verified locator drift');else old.locators.push(structuredClone(locator))}
    for(const file of asset.files)if(!old.files.includes(file))old.files.push(file)
    if(asset.sourcePath){assert(!old.sourcePath||old.sourcePath===asset.sourcePath,'BLOCK: alias drift');old.sourcePath=asset.sourcePath}
  }
  return validateMediaRegistry(merged,previous.travelSlug)
}
export function mergeVerifiedMediaReceipt(registry,receipt) {
  assert.equal(receipt.stage,'VERIFIED');assert.equal(receipt.originalGetSha256,receipt.assetId)
  const merged=structuredClone(registry),asset=merged.assets.find(x=>x.assetId===receipt.assetId)
  assert(asset,'BLOCK: receipt identity absent');assert.equal(receipt.inputBytes,asset.byteSize);assert.equal(receipt.originalGetBytes,asset.byteSize)
  assert(Number.isSafeInteger(receipt.mediaId)&&receipt.mediaId>0);assert.equal(receipt.locator.payloadId,receipt.mediaId)
  assert.equal(receipt.locator.verified,true);assert.equal(receipt.locator.verifiedByteHash,asset.assetId)
  const existing=asset.locators.find(l=>l.environment===receipt.locator.environment&&l.payloadId===receipt.mediaId)
  if(existing)assert.deepEqual(existing,receipt.locator);else asset.locators.push(structuredClone(receipt.locator))
  return validateMediaRegistry(merged,registry.travelSlug)
}
export async function prepareMediaUploadInputs({assets,registry,photoRoot}) {
  validateMediaRegistry(registry,registry.travelSlug)
  const root=await realpath(photoRoot),entries=[]
  for(const asset of assets){assert(!asset.locators.some(l=>l.environment==='production'&&l.verified),'BLOCK: existing photo must not upload again');assert(asset.files.length)
    const file=await realpath(path.resolve(root,asset.files[0]));assert(file.startsWith(root+path.sep),'BLOCK: input escapes photo root')
    const size=(await stat(file)).size;assert(size===asset.byteSize&&size<=32*1024*1024,'BLOCK: source byte size drift/cap')
    const bytes=await readFile(file);assert.equal('sha256:'+sha256(bytes),asset.assetId,'BLOCK: source byte hash drift')
    assert.equal(asset.mimeType,'image/jpeg','BLOCK: unreviewed upload MIME')
    entries.push({assetId:asset.assetId,inputPath:file,byteSize:size,mimeType:asset.mimeType,uploadFilename:asset.assetId.slice(7)+'.jpeg'})
  }
  assert.equal(new Set(entries.map(x=>x.assetId)).size,entries.length,'BLOCK: duplicate upload identity')
  return entries.sort((a,b)=>a.assetId.localeCompare(b.assetId))
}
// Stable allowlisted diagnostics only; never persist actual values, URLs or raw errors.
export function mediaVerificationFailureCode(error){
 const message=String(error?.message??'').split('\n')[0]
 if(/^MEDIA_(?:HTTP_STATUS_[1-5]\d{2}|URL_OUTSIDE_SCOPE|TARGET_INVALID|DEADLINE|TIMEOUT|REQUEST_ERROR|RESPONSE_ERROR|RESPONSE_ABORTED|HEADERS_MISMATCH|BYTE_LIMIT|LENGTH_MISMATCH|HASH_MISMATCH)$/.test(message))return message
 const reasons={'BLOCK: original byte size mismatch':'MEDIA_LENGTH_MISMATCH','BLOCK: original hash mismatch':'MEDIA_HASH_MISMATCH','BLOCK: original outside frozen entry set':'MEDIA_IDENTITY_DRIFT','BLOCK: created Media type drift':'MEDIA_TYPE_DRIFT','BLOCK: new Media placeholder drift':'MEDIA_PLACEHOLDER_DRIFT','BLOCK: new Media owner drift':'MEDIA_OWNER_DRIFT','BLOCK: original URL path outside pilot':'MEDIA_URL_OUTSIDE_SCOPE'}
 for(const [prefix,code]of Object.entries(reasons))if(message.startsWith(prefix))return code
 if(['ENOSPC','EIO','EACCES','EROFS'].includes(error?.code))return 'MEDIA_EVIDENCE_IO_ERROR'
 if(['ECONNRESET','ETIMEDOUT','EPIPE'].includes(error?.code))return 'MEDIA_TRANSPORT_'+error.code
 return 'MEDIA_VERIFICATION_UNKNOWN'
}
// Operation body for #105. No CLI, connection, credentials, supervisor, retry,
// rollback or deletion path. Caller supplies its durable checkpoint/receipt sink.
// The INTENT -> CREATED -> VERIFIED rules reuse the existing Slice 4C protocol.
export async function transferVerifiedMediaBatch({entries,registry,adapter,checkpoint,saveReceipt,states={},environment='disposable',authority,progress}) {
  if(environment!=='disposable'){assert.equal(environment,'production');assert.equal(authority?.humanSourceVerified,true,'BLOCK: Human source not verified');assert.equal(authority.manifest.approval.action,'production-media');assert(evaluateAuthorization(authority.manifest,authority.approval).recordMatches,'BLOCK: exact #105 Media approval absent')}
  let merged=structuredClone(registry),created=0,reused=0,consecutiveDeferred=0;const deferred=[];let circuitOpen=false
  for(const entry of entries){await progress?.begin(entry);const asset=merged.assets.find(a=>a.assetId===entry.assetId);assert(asset);const verified=asset.locators.filter(l=>l.environment===environment&&l.verified)
    if(verified.length){reused++;await progress?.end(entry);continue}
    const previous=states[entry.assetId];if(previous?.stage==='VERIFIED'){merged=mergeVerifiedMediaReceipt(merged,previous.receipt);reused++;await progress?.end(entry);continue}
    assert(!previous||previous.stage==='CREATED','BLOCK: prior INTENT/BLOCK/UNKNOWN requires manual reconciliation; no create retry')
    let doc=previous?.stage==='CREATED'?previous.created:null
    const emit=async(stage,extra={})=>{await checkpoint({stage,assetId:entry.assetId,...extra});states[entry.assetId]={stage,...extra}}
    if(!doc){assert.equal((await adapter.findFilename(entry.uploadFilename)).length,0,'BLOCK: duplicate filename/unknown prior create');await emit('INTENT')
      try{doc=await adapter.create({data:{type:'photo',altText:'照片描述待確認',relatedTravelRecord:{relationTo:'travel-memories',value:2}},locale:'zh-TW',filePath:entry.inputPath,filename:entry.uploadFilename});assert(Number.isSafeInteger(doc.id)&&doc.id>0);assert.equal(doc.filename,entry.uploadFilename);await emit('CREATED',{created:doc});created++}
      catch(error){
       if(!progress){await emit('BLOCK',{reason:'CREATE_RESULT_UNKNOWN'});throw error}
       await emit('WRITE_RESULT_UNKNOWN',{reason:'CREATE_RESULT_UNKNOWN'})
       const reconciled=await progress.reconcile(entry,error)
       if(reconciled.doc){doc=reconciled.doc;created++;await emit('CREATED',{created:doc,reconciled:true})}
       else{const item={assetId:entry.assetId,stage:reconciled.stage,writeOutcome:'NO_MEDIA_ROW'};await emit(item.stage,item);deferred.push(item);consecutiveDeferred++;await progress.end(entry);if(deferred.length>=progress.policy.maxDeferred||consecutiveDeferred>=progress.policy.maxConsecutiveDeferred){circuitOpen=true;break}continue}
      }}
    try{const bytes=await adapter.getOriginal(doc.id);assert(Buffer.isBuffer(bytes)&&bytes.length===entry.byteSize,'BLOCK: original byte size mismatch');assert.equal('sha256:'+sha256(bytes),entry.assetId,'BLOCK: original hash mismatch')
      const receipt={stage:'VERIFIED',assetId:entry.assetId,mediaId:doc.id,filename:doc.filename,inputBytes:entry.byteSize,originalGetBytes:bytes.length,originalGetSha256:entry.assetId,generatedSizes:doc.sizes??{},locator:{environment,payloadId:doc.id,verified:true,verifiedByteHash:entry.assetId}}
      await saveReceipt(receipt);merged=mergeVerifiedMediaReceipt(merged,receipt);await emit('VERIFIED',{receipt});consecutiveDeferred=0;await progress?.end(entry)
    }catch(error){
      if(progress&&error.mediaReadExhausted===true&&error.quiescent===true){await progress.quiescent();const item={assetId:entry.assetId,mediaId:doc.id,stage:'CREATED_PENDING_VERIFICATION',writeOutcome:'COMMITTED',verificationCode:mediaVerificationFailureCode(error)};await emit(item.stage,item);deferred.push(item);consecutiveDeferred++;await progress.end(entry);if(deferred.length>=progress.policy.maxDeferred||consecutiveDeferred>=progress.policy.maxConsecutiveDeferred){circuitOpen=true;break}continue}
      await emit('BLOCK',{reason:'ORIGINAL_OR_EVIDENCE_VERIFICATION_FAILED',mediaId:doc.id,verificationCode:mediaVerificationFailureCode(error)});throw error}

  }
  return {registry:merged,created,reused,automaticRetry:false,...(progress?{deferred,circuitOpen,unattempted:entries.filter(e=>!states[e.assetId]).map(e=>e.assetId)}:{})}
}

// Same supported Payload Local API + exact original GET as Slice 4C. All network
// and create effects stay behind the separately authorized #105 operation body.
export function payloadVerifiedMediaAdapter({payload,entries,stageDir,host,deadlineAt,readOriginal=readVerifiedMedia,onOriginalBytes=()=>{}}){
  return {
    async findFilename(filename){const r=await payload.find({collection:'media',depth:0,limit:2,where:{filename:{equals:filename}}});assert(!r.hasNextPage,'BLOCK: filename ambiguity');return r.docs.map(d=>Number(d.id))},
    async create({data,locale,filePath,filename}){const entry=entries.find(e=>e.uploadFilename===filename);assert(entry&&entry.inputPath===filePath,'BLOCK: upload outside frozen entry set');assert(Date.now()<deadlineAt,'BLOCK: upload deadline');await mkdir(stageDir,{recursive:true,mode:0o700});const staged=path.join(stageDir,filename);await copyFile(filePath,staged,constants.COPYFILE_EXCL);const bytes=await readFile(staged);assert.equal(bytes.length,entry.byteSize);assert.equal('sha256:'+sha256(bytes),entry.assetId,'BLOCK: staged bytes differ');const doc=await payload.create({collection:'media',locale,depth:0,data,filePath:staged});return {id:Number(doc.id),filename:doc.filename,sizes:doc.sizes??{}}},
    async inspect(id){const doc=await payload.findByID({collection:'media',id,depth:0,locale:'zh-TW',fallbackLocale:false}),entry=entries.find(e=>e.uploadFilename===doc.filename);assert(Number(doc.id)===id&&entry,'BLOCK: original outside frozen entry set');assert.equal(doc.type,'photo','BLOCK: created Media type drift');assert.equal(doc.altText,'照片描述待確認','BLOCK: new Media placeholder drift');assert.deepEqual(doc.relatedTravelRecord,{relationTo:'travel-memories',value:2},'BLOCK: new Media owner drift');assert.equal(Number(doc.filesize),entry.byteSize);assert.equal(doc.mimeType,entry.mimeType);assert.equal(new URL(doc.url).pathname,'/'+entry.uploadFilename,'BLOCK: original URL path outside pilot');return doc},
    async getOriginal(id){const doc=await this.inspect(id),entry=entries.find(e=>e.uploadFilename===doc.filename);const r=await readOriginal({mediaId:id,assetId:entry.assetId,byteSize:entry.byteSize,mimeType:entry.mimeType,url:doc.url},{host,deadlineAt,onBytes:onOriginalBytes});return r.body},
  }
}
