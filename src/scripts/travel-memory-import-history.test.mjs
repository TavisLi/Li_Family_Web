import test from 'node:test'
import assert from 'node:assert/strict'
import {assertReviewedHistoryPreserved} from './travel-memory-import-plan.mjs'
const before={tables:{versions:{rows:30,sha256:'a'.repeat(64)}},rootsByDay:{24:[{id:1,latest:true}]}},after={tables:structuredClone(before.tables),currentRoots:{24:[{id:1,latest:false},{id:2,latest:false},{id:3,latest:true}]}}
test('reuse compact retained-history digests and explicit append counts; no pruning',()=>assert.equal(assertReviewedHistoryPreserved(before,after,{24:2}).pruned,0))
test('same row count/different historical bytes, lost roots, append count and latest drift stop',()=>{for(const change of [x=>x.tables.versions.sha256='b'.repeat(64),x=>x.currentRoots[24][0].id=999,x=>x.currentRoots[24].pop(),x=>x.currentRoots[24][0].latest=true]){const x=structuredClone(after);change(x);assert.throws(()=>assertReviewedHistoryPreserved(before,x,{24:2}),/BLOCK/)}})
