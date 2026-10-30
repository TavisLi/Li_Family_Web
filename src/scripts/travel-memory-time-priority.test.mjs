import test from 'node:test'
import assert from 'node:assert/strict'
import {captureTimePriorityDecision,rawCapture} from './travel-memory-metadata-placement.mjs'
const moments=[{reviewId:'morning',date:'2023-08-11',source:{time:'08:30'}},{reviewId:'afternoon',date:'2023-08-11',source:{time:'14:30'}}]
const photo={type:'photo',assetId:'sha256:fixture',metadata:rawCapture('2023:08:11 14:30:00','+10:00',{latitude:0,longitude:0},'synthetic'),problem:'GPS conflict',destination:'morning'}
test('explicit time precedence resolves a boundary despite GPS and previous destination',()=>{const d=captureTimePriorityDecision(photo,moments);assert.equal(d.destination,'afternoon');assert.equal(d.resolved,true);assert.equal(photo.destination,'morning');assert.equal(photo.metadata.gps.latitude,0)})
test('long same-day interval stays with the preceding Moment, not nearest next start',()=>{const d=captureTimePriorityDecision({...photo,metadata:rawCapture('2023:08:11 13:00:00','+10:00',null,'synthetic')},moments);assert.equal(d.destination,'morning');assert.equal(d.resolved,true)})
test('missing time/offset, null relation and before-first-Moment remain unresolved',()=>{for(const p of [{...photo,metadata:null},{...photo,assetId:null},{...photo,metadata:{...photo.metadata,timezone:null}},{...photo,metadata:rawCapture('2023:08:11 07:00:00','+10:00',null,'synthetic')}])assert.equal(captureTimePriorityDecision(p,moments).resolved,false)})
test('an anomalous photo field is retained for a separate content decision',()=>{const d=captureTimePriorityDecision({...photo,old:{youtubeUrl:'legacy text'}},moments);assert.equal(d.destination,'afternoon');assert.equal(d.resolved,false)})
