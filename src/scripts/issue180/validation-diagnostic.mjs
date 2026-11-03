import assert from 'node:assert/strict'
export function validationDiagnostic(error,operation,args={}) {
 if(error?.name!=='ValidationError')return undefined
 const fields=Array.isArray(error.data?.errors)?error.data.errors:[]
 return {kind:'PAYLOAD_VALIDATION',operation:['create','update','restoreVersion'].includes(operation)?operation:'other',collection:['travel-plans','travel-memories','travel-memory-days','media'].includes(args.collection)?args.collection:'redacted',locale:['zh-TW','en','all'].includes(args.locale)?args.locale:'default',callsite:'guardPayload:'+operation,fields:fields.slice(0,16).map(e=>({path:/^(title|summary|planningSections\.[0-9]{1,3}\.(title|body)|moments\.[0-9]{1,3}\.(title|body))$/.test(e.path)?e.path:'redacted',code:'VALIDATION_REJECTED'})),truncated:fields.length>16}
}
export function assertValidationDiagnostic(value) {
 assert(value && Buffer.byteLength(JSON.stringify(value))<=4096,'VALIDATION_DIAGNOSTIC_CAP')
 const clean=validationDiagnostic({name:'ValidationError',data:{errors:value.fields?.map(f=>({path:f.path}))}},value.operation,{collection:value.collection,locale:value.locale})
 assert(clean && JSON.stringify({...clean,truncated:value.truncated})===JSON.stringify(value),'VALIDATION_DIAGNOSTIC_UNSAFE')
 return value
}
