import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {buildTravelReview,mergeReviewRegistry,renderTravelReview,videoId} from './travel-memory-review.mjs'
const a={assetId:'sha256:'+'a'.repeat(64),byteSize:10,files:['old.jpg'],sourcePath:'travels/test/old.jpg',locators:[{environment:'production',payloadId:10,verified:true,verifiedByteHash:'sha256:'+'a'.repeat(64)},{environment:'production',payloadId:11,verified:true,verifiedByteHash:'sha256:'+'a'.repeat(64)}]}
const prior={version:1,travelSlug:'test',assets:[a]},scan={version:1,travelSlug:'test',assets:[{...a,files:['new.jpg'],locators:[]},{assetId:'sha256:'+'b'.repeat(64),byteSize:20,files:['other.jpg'],locators:[]}]}
const merged=mergeReviewRegistry(prior,scan);assert.deepEqual(merged.assets[0],a);assert.equal(merged.assets.length,2);assert.throws(()=>mergeReviewRegistry(prior,{...scan,assets:[{...a,byteSize:11}]}),/conflicting/)
const current=[{id:1,day:1,moments:[{id:'m1',momentKey:'one',title:'Old',placements:[{id:'p1',placementKey:'p1',type:'photo',media:10,caption:'caption'},{id:'p2',placementKey:'p2',type:'photo',media:11}]},{id:'m2',momentKey:'gone',title:'Gone',placements:[{id:'null',placementKey:'null',type:'photo',media:null},{id:'v',placementKey:'v',type:'youtube',youtubeUrl:'https://youtu.be/abcdefghijk'}]}]}]
const source={slug:'test',days:[{day:1,date:'2023-08-10',moments:[{scene:'one',title:'New',placements:[{type:'photo',media:'travels/test/exact-alias',caption:'updated'}]},{scene:'new',title:'New moment',placements:[{type:'youtube',youtubeUrl:'https://www.youtube.com/watch?v=abcdefghijk'}]}]}]}
const model=buildTravelReview({batch:{batchId:'batch',sourceSha256:'c'.repeat(64)},source,current,english:structuredClone(current),registry:merged,scanned:scan,aliases:{'travels/test/exact-alias':10},freshness:{}})
assert.equal(model.moments[0].momentKey,'one');assert.equal(model.moments[0].old.id,'m1');assert.equal(model.removals.length,1)
assert.equal(model.placements.filter(p=>p.old).length,4,'Every occurrence, duplicate-byte Media relation and null row retained')
assert.equal(model.placements.find(p=>p.old?.id==='p1').caption,'updated');assert.equal(model.placements.find(p=>p.old?.id==='p2').mediaId,11)
assert.equal(model.placements.find(p=>p.old?.id==='v').status,'移動');assert.equal(model.placements.find(p=>p.old?.id==='null').destination,'')
assert.deepEqual(current[0].moments[0].title,'Old');assert.deepEqual(model.english,current)
assert.equal(videoId('javascript:alert(1)'),null);assert.equal(videoId('https://evil.example/abcdefghijk'),null)
const html=await renderTravelReview({text:'</script><img src=x onerror=alert(1)>'},'const model=/*REVIEW_DATA*/null')
assert(!html.includes('</script>'));assert(html.includes('\\u003c'))
const template=await readFile(new URL('./travel-memory-review.html',import.meta.url),'utf8')
assert(template.includes("connect-src 'none'"));assert(!/localStorage|fetch\(|XMLHttpRequest|innerHTML/.test(template))
console.log('Travel review PASS: incremental Registry, exact aliases, repeated occurrences, captions, moves, explicit removals, null relation, language preservation, safe HTML')
const hashedCurrent=structuredClone(current);const {sha256}=await import('./travel-memory-review.mjs');hashedCurrent[0].moments[0].momentKey='scene:'+sha256('test:1:one').slice(0,24)
const hashed=buildTravelReview({batch:{},source,current:hashedCurrent,registry:merged,scanned:scan,aliases:{'travels/test/exact-alias':10}})
assert.equal(hashed.moments[0].old.id,'m1','Existing importer-derived scene key is retained')
const extraRegistry=structuredClone(merged);extraRegistry.assets[0].locators.push({environment:'production',payloadId:99,verified:true,verifiedByteHash:a.assetId})
const allMedia=buildTravelReview({batch:{},source,current,registry:extraRegistry,scanned:scan,aliases:{'travels/test/exact-alias':10}})
assert(allMedia.placements.some(p=>p.existingMedia&&p.mediaId===99&&!p.destination),'Non-daily verified Media remains a separate review item')
const {authoredDateCandidate}=await import('./travel-memory-review.mjs')
assert.equal(authoredDateCandidate({title:'8月11日（週五）'},{startDate:'2023-08-07'}),'2023-08-11')
assert.equal(authoredDateCandidate({title:'Unknown'},{startDate:'2023-08-07'}),null)
