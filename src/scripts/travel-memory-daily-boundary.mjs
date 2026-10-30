import assert from 'node:assert/strict'
import {isDeepStrictEqual} from 'node:util'
import {sha256} from './travel-memory-review.mjs'
import {materializeReviewedDailyGraph} from './travel-memory-import-plan.mjs'

const nullable=(v,keys)=>Object.fromEntries(keys.map(k=>[k,v?.[k]??null]))
const instant=v=>v==null?null:new Date(v).toISOString()
const text=['title','location','body','transport']
// SQL NULL and an absent optional Payload field represent the same value.
// Empty strings, IDs, array order and Base JSON are never collapsed.
export function canonicalDailyGraph(graph){
 const build=days=>{
  assert(Array.isArray(days)&&days.length===9,'BLOCK: DAILY_GRAPH_COVERAGE')
  const ids=new Set(),keys=new Set()
  return days.map(d=>{
   assert(Number.isSafeInteger(d.id)&&!ids.has(d.id)&&!keys.has(d.dayKey),'BLOCK: DAILY_GRAPH_IDENTITY')
   ids.add(d.id);keys.add(d.dayKey)
   const nested=new Set()
   const identity=id=>{assert(typeof id==='string'&&id&&!nested.has(id),'BLOCK: DAILY_NESTED_IDENTITY');nested.add(id);return id}
   return {id:d.id,memory:d.memory,dayIdentity:d.dayIdentity,dayKey:d.dayKey,day:Number(d.day),date:instant(d.date),_status:d._status,
    ...nullable(d,['dailyHeroImage','dateLabel','title','theme','story','lodging']),meals:nullable(d.meals,['breakfast','lunch','dinner']),
    sourceMetadata:{...nullable(d.sourceMetadata,['sourceFile','sourceHash','parserVersion','baseProjection']),lastImportedAt:instant(d.sourceMetadata?.lastImportedAt)},
    createdAt:instant(d.createdAt),updatedAt:instant(d.updatedAt),moments:(d.moments??[]).map(m=>({id:identity(m.id),momentKey:m.momentKey,time:m.time??null,...nullable(m,text),placements:(m.placements??[]).map(p=>({id:identity(p.id),placementKey:p.placementKey,...nullable(p,['type','role','media','youtubeUrl','caption'])}))}))}
  }).sort((a,b)=>a.dayKey.localeCompare(b.dayKey))
 }
 const result={fresh:build(graph.fresh),english:build(graph.english)}
 for(let i=0;i<9;i++){
  const z=result.fresh[i],e=result.english[i]
  assert(z.dayKey===`day-0${i+1}`&&z.memory===2&&z.dayIdentity===`2:${z.dayKey}`,'BLOCK: DAILY_GRAPH_TARGET')
  assert(z.id===e.id&&z.dayKey===e.dayKey,'BLOCK: DAILY_LOCALE_IDENTITY')
 }
 return result
}
export function assertDailyGraphEquivalent(expected,actual){
 const a=canonicalDailyGraph(expected),b=canonicalDailyGraph(actual)
 assert(isDeepStrictEqual(a,b),'BLOCK: DAILY_GRAPH_DRIFT')
 return {status:'PASS',sha256:sha256(a),days:9}
}
// New Source placements may omit their technical key. Bind it before writing,
// using the accepted review identity; existing/moved keys remain untouched.
export function materializeFormalDailyGraph(plan,options){
 const result=materializeReviewedDailyGraph(plan,options)
 for(const d of result)for(const [mi,m]of d.zh.moments.entries())for(const [i,p]of m.placements.entries()){
  if(p.placementKey)continue
  const row=plan.placements.find(r=>r.dayKey===d.zh.dayKey&&r.momentKey===m.momentKey&&r.order===i)
  assert(row&&row.action==='create'&&!row.oldId&&!row.oldPlacementKey&&row.reviewId,'BLOCK: DAILY_KEY_IDENTITY')
  p.placementKey='placement:'+sha256([plan.sourceSha256,row.reviewId]).slice(0,32)
  d.en.moments[mi].placements[i].placementKey=p.placementKey
  const entry=d.idMap.find(x=>x.newKey==null&&x.oldId==null)
  if(entry)entry.newKey=p.placementKey
 }
 for(const d of result)for(const m of d.zh.moments)assert.equal(new Set(m.placements.map(p=>p.placementKey)).size,m.placements.length,'BLOCK: DAILY_KEY_COLLISION')
 return result
}

export function dailyIdentityLedger(plan,before,after,{pending=false}={}){
 const day=(graph,key)=>graph.fresh.find(d=>d.dayKey===key)
 const anchor=(dayKey,momentKey)=>({dayKey,momentKey})
 const moments=plan.moments.map(row=>{
  const d=day(after,row.dayKey),m=d.moments.find(m=>m.momentKey===row.momentKey)
  assert(m&&(pending||m.id),'BLOCK: DAILY_MOMENT_MAPPING')
  const oldKey=row.previousDay?`day-${String(row.previousDay).padStart(2,'0')}`:null
  const old=oldKey?day(before,oldKey)?.moments.find(m=>m.momentKey===row.previousKey):null
  return {reviewId:row.reviewId,oldId:old?.id??null,newId:m.id??'PAYLOAD_GENERATED_AT_APPLY',oldAnchor:old?anchor(oldKey,old.momentKey):null,newAnchor:anchor(row.dayKey,m.momentKey)}
 })
 const placements=plan.placements.map(row=>{
  const m=day(after,row.dayKey).moments.find(m=>m.momentKey===row.momentKey),p=m.placements[row.order]
  assert(p&&(pending||p.id),'BLOCK: DAILY_PLACEMENT_MAPPING')
  const oldKey=row.oldDay?`day-${String(row.oldDay).padStart(2,'0')}`:null
  const old=oldKey?day(before,oldKey)?.moments.find(m=>m.momentKey===row.oldMomentKey)?.placements.find(p=>p.placementKey===row.oldPlacementKey):null
  assert(!row.oldMomentKey||old,'BLOCK: DAILY_ORIGIN_MAPPING')
  return {reviewId:row.reviewId,action:row.action,oldId:old?.id??null,newId:p.id??'PAYLOAD_GENERATED_AT_APPLY',oldKey:old?.placementKey??null,newKey:p.placementKey,oldAnchor:old?anchor(oldKey,row.oldMomentKey):null,newAnchor:anchor(row.dayKey,row.momentKey),mediaId:p.media??null,order:row.order}
 })
 return {status:pending?'SAVED_PROJECTION':'VERIFIED_IN_TRANSACTION',moments,placements,removals:plan.removals.map(r=>({dayId:r.dayId,momentKey:r.momentKey,oldId:day(before,`day-${String(r.day).padStart(2,'0')}`)?.moments.find(m=>m.momentKey===r.momentKey)?.id??r.id})),omissions:plan.omissions.map(r=>({reviewId:r.reviewId,keeper:r.keeper,oldId:r.old?.id??null}))}
}
