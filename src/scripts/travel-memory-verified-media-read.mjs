import https from 'node:https'
import {createHash} from 'node:crypto'

export function validateMediaReadTarget(item, host) {
  const u=new URL(item.url)
  if(u.protocol!=='https:'||u.hostname!==host||u.port||u.username||u.password||u.search||u.hash)throw Error('MEDIA_URL_OUTSIDE_SCOPE')
  if(!Number.isSafeInteger(item.mediaId)||item.mediaId<=0||!Number.isSafeInteger(item.byteSize)||item.byteSize<=0||item.byteSize>10*1024*1024||!/^sha256:[a-f0-9]{64}$/.test(item.assetId)||!['image/jpeg','image/png','image/webp'].includes(item.mimeType))throw Error('MEDIA_TARGET_INVALID')
}
// One exact GET, no redirect/retry/credentials; callers supply the approved object list and budget.
export async function readVerifiedMedia(item,{host,deadlineAt,onBytes=()=>{},request=https.get,requireClosed=false,settleTimeoutMs=2000}) {
  validateMediaReadTarget(item,host)
  const timeout=Math.min(15000,deadlineAt-Date.now());if(timeout<=0)throw Error('MEDIA_DEADLINE')
  return new Promise((resolve,reject)=>{
    let settled=false,req,timer,response,requestClosed=false,responseClosed=false,closeTimer,pendingError
    const completeFailure=()=>{if(pendingError&&requestClosed&&(!response||responseClosed)){clearTimeout(closeTimer);pendingError.quiescent=true;reject(pendingError)}}
    const fail=code=>{if(settled)return;settled=true;clearTimeout(timer);const error=code instanceof Error?code:Error(code);if(!requireClosed){req?.destroy();reject(error);return}pendingError=error;response?.destroy();req?.destroy();completeFailure();if(!requestClosed||response&&!responseClosed)closeTimer=setTimeout(()=>{reject(Object.assign(Error('MEDIA_READ_NOT_QUIESCENT'),{quiescent:false}))},settleTimeoutMs)}
    req=request(item.url,{agent:false,timeout,headers:{Accept:item.mimeType,'Accept-Encoding':'identity','User-Agent':'LiFamily-Slice4-Verified-Media-Read/1'}},res=>{
      response=res;res.on('close',()=>{responseClosed=true;completeFailure()})
      if(res.statusCode!==200){res.destroy();fail('MEDIA_HTTP_STATUS_'+res.statusCode);return}
      if(res.headers['content-type']?.split(';')[0]!==item.mimeType||Number(res.headers['content-length'])!==item.byteSize){res.destroy();fail('MEDIA_HEADERS_MISMATCH');return}
      const parts=[];let bytes=0;const hash=createHash('sha256')
      res.on('data',chunk=>{if(settled)return;bytes+=chunk.length;try{onBytes(chunk.length)}catch(error){fail(error);return}if(bytes>item.byteSize){res.destroy();fail('MEDIA_BYTE_LIMIT');return}parts.push(chunk);hash.update(chunk)})
      res.on('end',()=>{if(settled)return;if(bytes!==item.byteSize){fail('MEDIA_LENGTH_MISMATCH');return}if('sha256:'+hash.digest('hex')!==item.assetId){fail('MEDIA_HASH_MISMATCH');return}settled=true;clearTimeout(timer);resolve({body:Buffer.concat(parts),bytes,assetId:item.assetId})})
      res.on('error',()=>fail('MEDIA_RESPONSE_ERROR'));res.on('aborted',()=>fail('MEDIA_RESPONSE_ABORTED'))
    })
    req.on('close',()=>{requestClosed=true;completeFailure()});timer=setTimeout(()=>fail('MEDIA_TIMEOUT'),timeout);req.on('timeout',()=>fail('MEDIA_TIMEOUT'));req.on('error',()=>fail('MEDIA_REQUEST_ERROR'))
  })
}
