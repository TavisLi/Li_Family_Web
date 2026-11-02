import test from 'node:test'
import assert from 'node:assert/strict'
import {validationDiagnostic,assertValidationDiagnostic} from './validation-diagnostic.mjs'
import {guardPayload} from './gate-c-worker.mjs'
test('validation trace retains safe paths but no values, messages, IDs or stack',async()=>{
 const err=Object.assign(Error('secret value'),{name:'ValidationError',data:{errors:[{path:'title',message:'secret'},{path:'private-id',value:'private'}]}})
 let caught;try{await guardPayload({update:async()=>{throw err}},async()=>{}).update({collection:'travel-memories',locale:'en',data:{title:'secret'}})}catch(e){caught=e}
 assert.equal(caught.message,'PAYLOAD_VALIDATION_FAILED');assert.equal(caught.validationDiagnostic.locale,'en');assert.equal(caught.validationDiagnostic.fields[0].path,'title');assert(!JSON.stringify(caught.validationDiagnostic).includes('secret'));assertValidationDiagnostic(caught.validationDiagnostic)
})
test('unknown fields and unbounded diagnostic payloads are refused',()=>{
 const d=validationDiagnostic({name:'ValidationError',data:{errors:Array.from({length:20},()=>({path:'title'}))}},'update',{collection:'travel-memories',locale:'en'})
 assert.equal(d.fields.length,16);assert.equal(d.truncated,true);assertValidationDiagnostic(d);assert.throws(()=>assertValidationDiagnostic({...d,secret:'private'}));assert.throws(()=>assertValidationDiagnostic({...d,fields:['x'.repeat(5000)]}))
})
