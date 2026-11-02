import test from 'node:test'
import assert from 'node:assert/strict'
import { assertUnchanged,snapshotDigest } from './snapshot-assertions.mjs'
const before=[{table:'days',key:'day-1',value:{locales:{en:'A','zh-TW':'甲'},base:{key:'a'},placements:['x']}},{table:'days',key:'day-2',value:{sentinel:true}}]
test('allows exact intended row while checking all other physical identities',()=>{
 const changed=structuredClone(before);changed[0].value.locales.en='B';assert.equal(assertUnchanged(before,changed,[{table:'days',key:'day-1'}]).preserved,1)
 changed[1].value.sentinel=false;assert.throws(()=>assertUnchanged(before,changed,[{table:'days',key:'day-1'}]),/non-target row changed/)
})
test('detects additions, deletions and duplicate identities',()=>{
 assert.throws(()=>assertUnchanged(before,before.slice(0,1)),/added or removed/)
 assert.throws(()=>assertUnchanged(before,[...before,{table:'days',key:'day-3',value:{}}]),/added or removed/)
 assert.throws(()=>snapshotDigest([...before,before[0]]),/duplicate/)
})
test('digest is insensitive to row ordering and sensitive to locale changes',()=>{
 assert.equal(snapshotDigest(before),snapshotDigest([...before].reverse()))
 const changed=structuredClone(before);changed[0].value.locales.en='changed';assert.notEqual(snapshotDigest(before),snapshotDigest(changed))
})
