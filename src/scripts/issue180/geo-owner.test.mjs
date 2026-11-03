import test from 'node:test'
import assert from 'node:assert/strict'
import {importProduct} from './payload-runtime.mjs'
const {travelGeoGuard}=await importProduct(process.cwd(),'payload/collections/travel-geo.ts')
const hook=travelGeoGuard('memory'),data={memory:7,dayKey:'day-01',moments:[{momentKey:'one',geo:{latitude:25,longitude:121}}]},req={context:{}}
test('actual create hook accepts Payload empty originalDoc with new Day owner',()=>{
 const result=hook({data:structuredClone(data),originalDoc:{},operation:'create',req})
 assert.equal(result.memory,7);assert.equal(result.dayKey,'day-01');assert.ok(result.geoAccessRevision)
})
test('update retains owner and rejects reparenting and day identity changes',()=>{
 const originalDoc={id:9,...structuredClone(data)}
 assert.doesNotThrow(()=>hook({data:{memory:{id:7},dayKey:'day-01'},originalDoc,operation:'update',req}))
 for(const patch of [{memory:8},{dayKey:'day-02'}])assert.throws(()=>hook({data:patch,originalDoc,operation:'update',req}),/identity change/)
 assert.throws(()=>hook({data,originalDoc:{},operation:'update',req}),/identity change/)
})
test('create operation still rejects forged approvals and preserves stable-key checks',()=>{
 assert.throws(()=>hook({data:{...data,moments:[{momentKey:'one',geo:{approval:{snapshot:'forged'}}}]},originalDoc:{},operation:'create',req}),/explicit Admin review/)
 assert.throws(()=>hook({data:{...data,moments:[{momentKey:'one'},{momentKey:'one'}]},originalDoc:{},operation:'create',req}),/unique/)
})
test('actual fixture creates and updates through all parent and Day owner hooks',async()=>{
 const {loadFixture}=await import('./payload-runtime.mjs')
 const records=new Map(),counts={plan:0,parent:0,memory:0};let id=0
 const kind=collection=>({'travel-plans':'plan','travel-memories':'parent','travel-memory-days':'memory'})[collection]
 const payload={create:async args=>{
  if(args.collection==='users')return {...args.data,id:++id}
  const k=kind(args.collection),doc={id:++id,...travelGeoGuard(k)({data:structuredClone(args.data),originalDoc:{},operation:'create',req})}
  records.set(doc.id,doc);counts[k]++
  if(k==='memory' && doc.dayKey==='day-03')throw Error('STOP_AFTER_ALL_OWNERS_NO_DATABASE')
  return doc
 },update:async args=>{
  const originalDoc=records.get(args.id),patch=travelGeoGuard(kind(args.collection))({data:structuredClone(args.data),originalDoc,operation:'update',req})
  const doc={...originalDoc,...patch};records.set(args.id,doc);return doc
 }}
 await assert.rejects(loadFixture({payload,root:process.cwd()}),/STOP_AFTER_ALL_OWNERS_NO_DATABASE/)
 assert.deepEqual(counts,{plan:5,parent:3,memory:5})
})
