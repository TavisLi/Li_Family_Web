import assert from 'node:assert/strict'
import {isDeepStrictEqual} from 'node:util'
import {sha256} from './travel-memory-review.mjs'
import {withIssue134BoundedInserts} from './issue134-payload-update.mjs'
import {readIssue134AdditiveDay} from './issue134-additive-runtime.mjs'
import {assertIssue134AdditiveRuntimeRetention} from './issue134-additive-retention.mjs'
import {assertReviewedDayReadback} from './travel-memory-import-plan.mjs'
const fields=['date','dateLabel','title','theme','story','meals','lodging','moments']
const pick=(v,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(v,k)).map(k=>[k,structuredClone(v[k])]))
const localeShape=d=>d.moments.map(m=>({key:m.momentKey,values:['title','body','location','transport'].map(k=>m[k]??null),placements:m.placements.map(p=>({key:p.placementKey,caption:p.caption??null}))}))
// Validate the entire graph before the first Day write. The #105 caller owns
// locks, durable before-image, history guards, COMMIT and independent read-back.
export async function updateReviewedDailyGraph(payload,expected,{req,beforeGraph,expectedGraphSha256}){
 assert(req?.transactionID,'BLOCK: #105 locked transaction required')
 assert.equal(sha256(beforeGraph),expectedGraphSha256,'BLOCK: bound before graph drift')
 assert.equal(expected.length,9,'BLOCK: nine reviewed Days required')
 const ids=expected.map(d=>d.zh.id),keys=expected.map(d=>d.zh.dayKey)
 assert.equal(new Set(ids).size,9,'BLOCK: duplicate Day identity')
 assert.deepEqual([...keys].sort(),Array.from({length:9},(_,i)=>`day-${String(i+1).padStart(2,'0')}`))
 assert.equal(beforeGraph.fresh.length,9);assert.equal(beforeGraph.english.length,9)
 assert.deepEqual(beforeGraph.fresh.map(d=>d.id).sort((a,b)=>a-b),[...ids].sort((a,b)=>a-b))
 const actual={fresh:[],english:[]}
 for(const old of beforeGraph.fresh){
  actual.fresh.push(await readIssue134AdditiveDay(payload,old.id,{locale:'zh-TW',req}))
 }
 for(const old of beforeGraph.english){
  actual.english.push(await readIssue134AdditiveDay(payload,old.id,{locale:'en',req}))
 }
 assert.equal(sha256(actual),expectedGraphSha256,'BLOCK: any Day drift stops before first write')
 for(const day of expected){assert.equal(day.zh.memory,2);assert.equal(day.en.memory,2);assert.equal(day.zh.id,day.en.id)}
 const results=[]
 for(const day of expected){
  const fresh=actual.fresh.find(d=>d.id===day.zh.id),english=actual.english.find(d=>d.id===day.zh.id)
  assert(fresh&&english,'BLOCK: missing Day before-image')
  try{results.push(await updateReviewedDailyDay(payload,day,{req,expectedFreshSha256:sha256({fresh,english})}))}catch(error){error.dayId=day.zh.id;error.safeComparison={stack:String(error.stack??'').split('\n').filter(l=>/^\s+at /.test(l)).slice(0,4),actualType:typeof error.actual,expectedType:typeof error.expected,actualKeys:error.actual&&typeof error.actual==='object'?Object.keys(error.actual).filter(k=>/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k)).slice(0,20):[],expectedKeys:error.expected&&typeof error.expected==='object'?Object.keys(error.expected).filter(k=>/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k)).slice(0,20):[]};if(!error.code||error.code==='ERR_ASSERTION')error.code='ISSUE134_DAILY_DAY_FAILURE';throw error}
 }
 return{status:'VERIFIED_IN_TRANSACTION',days:results,expectedAppendsByDay:Object.fromEntries(results.map(r=>[r.dayId,r.expectedVersionAppends])),commitAuthorized:false,independentReadbackRequired:true}
}
// Scoped operation inside the existing #105 locked transaction. No credentials,
// connection, COMMIT, rollback, deletion API, or retry are created here.
export async function updateReviewedDailyDay(payload,expected,{req,expectedFreshSha256}){
 assert(req?.transactionID,'BLOCK: #105 locked transaction required');assertIssue134AdditiveRuntimeRetention(payload)
 const id=expected.zh.id,beforeZh=await readIssue134AdditiveDay(payload,id,{locale:'zh-TW',req}),beforeEn=await readIssue134AdditiveDay(payload,id,{locale:'en',req})
 assert.equal(sha256({fresh:beforeZh,english:beforeEn}),expectedFreshSha256,'BLOCK: fresh Day drift before write')
 const all=await readIssue134AdditiveDay(payload,id,{locale:'all',req}),now=new Date().toISOString()
 await withIssue134BoundedInserts(payload.db,()=>payload.db.createVersion({collectionSlug:'travel-memory-days',parent:id,versionData:all,createdAt:now,updatedAt:now,autosave:false,returning:false,req}))
 const update=async(locale,data)=>withIssue134BoundedInserts(payload.db,()=>payload.update({collection:'travel-memory-days',id,data,locale,fallbackLocale:false,depth:0,draft:beforeZh._status==='draft',overrideAccess:true,overrideLock:false,select:{id:true},req}))
 const data=pick(expected.zh,fields)
 // Payload interprets a bare calendar date in the process timezone. Bind the
 // Source date to UTC explicitly so locale/server timezone cannot shift it.
 if(/^\d{4}-\d{2}-\d{2}$/.test(data.date??''))data.date+= 'T00:00:00.000Z'
 await update('zh-TW',data);let en=await readIssue134AdditiveDay(payload,id,{locale:'en',req}),localeWrites=1
 if(!isDeepStrictEqual(localeShape(en),localeShape(expected.en))){const moments=en.moments.map((m,i)=>{const intended=expected.en.moments[i];assert.equal(m.momentKey,intended.momentKey,'BLOCK: English structure drift');return {...m,...Object.fromEntries(['title','body','location','transport'].map(k=>[k,intended[k]??null])),placements:m.placements.map((p,j)=>{assert.equal(p.placementKey,intended.placements[j].placementKey);return {...p,caption:intended.placements[j].caption??null}})}});await update('en',{moments});localeWrites++;en=await readIssue134AdditiveDay(payload,id,{locale:'en',req})}
 const zh=await readIssue134AdditiveDay(payload,id,{locale:'zh-TW',req}),readback=assertReviewedDayReadback(expected,{zh,en})
 return {status:'VERIFIED_IN_TRANSACTION',dayId:id,localeWrites,expectedVersionAppends:1+localeWrites,anchors:readback.anchors,commitAuthorized:false,historyReadbackRequired:true}
}
