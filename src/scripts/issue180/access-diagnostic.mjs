import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const sha=value=>createHash('sha256').update(value).digest('hex')
const safeKeys=new Set('data result docs errors extensions message path locations name statusCode code sourceMetadata sourceFile sourceHash parserVersion baseProjection geo geoStops geoAccessRevision name latitude longitude crs provenance originalCRS approval snapshot audience confirmedBy planningSections moments memory id title _status isPrivate anchor momentKey stopKey totalDocs limit page totalPages pagingCounter hasNextPage hasPrevPage nextPage prevPage'.split(' '))
const kind=value=>value===null?'null':Array.isArray(value)?'array':typeof value
export function accessFailureDiagnostic(c,response,transport,error,beforeResponse) {
 let remaining=96
 const shape=(value,depth=0)=>{
  const type=kind(value)
  if(--remaining<0 || depth>7)return {type,truncated:true}
  if(type==='array')return {type,length:value.length,items:value.slice(0,2).map(item=>shape(item,depth+1))}
  if(type==='object')return {type,fields:Object.entries(value).slice(0,16).map(([key,child])=>({key:safeKeys.has(key)?key:'REDACTED_KEY',shape:shape(child,depth+1)}))}
  return {type}
 }
 const schemaErrors=c.schemaErrors ?? [],errors=Array.isArray(response.body?.errors)?response.body.errors:[]
 const summary={context:Object.fromEntries(['role','locale','collection','operation','label'].map(key=>[key,String(c[key] ?? '').replace(/[^a-zA-Z0-9_.:-]/g,'?').slice(0,120)])),transport,assertionCode:/^[A-Z_]+/.exec(error.message)?.[0] ?? 'OTHER',httpStatus:response.status,responseSHA256:sha(JSON.stringify(response)),beforeResponseSHA256:beforeResponse?sha(JSON.stringify(beforeResponse)):null,expectedSchemaErrorHashes:schemaErrors.slice(0,16).map(message=>sha(message)),actualErrorCount:errors.length,errors:errors.slice(0,16).map(item=>({messageSHA256:sha(String(item?.message)),expectedIndex:schemaErrors.indexOf(item?.message),classification:item?.message==='Argument "locale" has invalid value all.'?'LOCALE_ARGUMENT_INVALID':/^Value "all" does not exist in .* enum\.$/.test(item?.message)?'LOCALE_ENUM_INVALID':'OTHER',pathType:kind(item?.path),pathIsResult:JSON.stringify(item?.path)==='["result"]',extensionStatusCode:Number.isInteger(item?.extensions?.statusCode)?item?.extensions.statusCode:null,extensionKeys:Object.keys(item?.extensions ?? {}).slice(0,16).map(key=>safeKeys.has(key)?key:'REDACTED_KEY')})),bodyShape:shape(response.body),truncated:errors.length>16 || schemaErrors.length>16 || remaining<0}
 assert(Buffer.byteLength(JSON.stringify(summary))<=16384,'ACCESS_DIAGNOSTIC_CAP')
 return summary
}
