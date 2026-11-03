import test from 'node:test'
import assert from 'node:assert/strict'
import {accessFailureDiagnostic} from './access-diagnostic.mjs'
import {assertAccessResponse} from './gate-c-access.mjs'
const c={role:'public',locale:'all',collection:'travel-plans',operation:'by-id',label:'published-public',schemaErrors:['Value "all" does not exist in "LocaleInputType" enum.']}
const response={status:400,body:{errors:[{message:c.schemaErrors[0]},{message:'Argument "locale" has invalid value all.',path:['result'],extensions:{statusCode:500,stack:'private-stack',data:{secret:'private-data'}}},{message:'private-unexpected-error'}],data:{result:{sourceMetadata:{sourceHash:'private-source'},privateKey:'private-value'}}}}
test('bounded access failure diagnostic retains error mismatch structure without values',()=>{
 const value=accessFailureDiagnostic(c,response,'graphql',Error('UNEXPECTED_GRAPHQL_REJECTION'))
 const bytes=JSON.stringify(value)
 for(const secret of ['private-stack','private-data','private-unexpected-error','private-source','privateKey','private-value'])assert(!bytes.includes(secret))
 assert.equal(value.errors[0].expectedIndex,0);assert.equal(value.errors[1].classification,'LOCALE_ARGUMENT_INVALID');assert.equal(value.errors[1].pathIsResult,true);assert.equal(value.errors[1].extensionStatusCode,500)
 assert.equal(value.responseSHA256.length,64)
 const large=structuredClone(response);large.body.errors=Array.from({length:100},()=>({message:'x'.repeat(10000)}))
 const capped=accessFailureDiagnostic(c,large,'graphql',Error('UNEXPECTED_GRAPHQL_REJECTION'))
 assert.equal(capped.errors.length,16);assert(capped.truncated);assert(Buffer.byteLength(JSON.stringify(capped))<=16384)
})
test('failed assertions keep original error and persist read-back evidence reference or UNKNOWN',async()=>{
 for(const saveFails of [false,true]) {
  let saved
  const ctx={save:async(name,value)=>{saved={name,value};if(saveFails)throw Error('private-write-failure');return {path:name+'.json',sha256:'a'.repeat(64)}}}
  await assert.rejects(assertAccessResponse(ctx,c,{status:response.status,body:{errors:response.body.errors}},'graphql',{}),error=>{
   assert.match(error.message,/UNEXPECTED_GRAPHQL_REJECTION/)
   assert.match(error.message,saveFails?/access evidence UNKNOWN/:/access-assertion-failure.json sha256=a{64}/)
   assert(!error.message.includes('private-write-failure'));return true
  })
  assert.equal(saved.name,'access-assertion-failure');assert.equal(saved.value.context.collection,'travel-plans')
 }
})
test('hidden-equivalence failures also preserve bounded evidence',async()=>{
 let saved
 const ctx={save:async(name,value)=>{saved=value;return {path:name+'.json',sha256:'b'.repeat(64)}}}
 await assert.rejects(assertAccessResponse(ctx,c,{status:200,body:{id:2}},'graphql',{}, {status:200,body:{id:1}}),/HIDDEN_VALUE_RESPONSE_DIFFERENCE.*access evidence/)
 assert.equal(saved.beforeResponseSHA256.length,64)
})
