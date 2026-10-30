import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { sha256 } from './travel-memory-review.mjs'
import { parseMemorySourceV2 } from './travel-memory-source-v2.ts'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'

const momentText = ['title','location','body','transport']
const dailyFields = ['date','dateLabel','title','theme','story','meals','lodging']
const picked = (v, keys) => Object.fromEntries(keys.filter(k=>Object.hasOwn(v??{},k)).map(k=>[k,structuredClone(v[k])]))
const nonempty = v => v !== null && v !== undefined && v !== ''
export function compileReviewedDailyPlan({sourceBytes,model,decisions,registry}) {
  const source = parseMemorySourceV2(String(sourceBytes))
  validateMediaRegistry(registry,source.slug)
  assert.equal(decisions.modelSha256,model.modelSha256,'BLOCK: review model binding')
  assert.equal(decisions.sourceSha256,model.sourceSha256,'BLOCK: original Source binding')
  const {thumbnails,modelSha256,...bound}=model
  assert.equal(sha256(bound),modelSha256,'BLOCK: model bytes drift')
  assert.equal(source.slug,registry.travelSlug)
  const omitted=p=>{const group=p.visualDuplicateGroup??p.assetId;return Boolean(p.assetId&&(decisions.preferredPhotos?.[group]?decisions.preferredPhotos[group]!==p.reviewId:p.duplicateOf))}
  const momentRows=[],placementRows=[],oldToNew=[],dayPlans=[]
  const removed=model.removals.filter(r=>(decisions.removals[r.reviewId]??(model.policy?.removeAbsentMoments?'remove':'pending'))==='remove')
  for(const day of source.days){const candidates=model.moments.filter(m=>m.day===day.day);assert.equal(candidates.length,day.moments.length)
    const dayKey=`day-${String(day.day).padStart(2,'0')}`,current=model.current.find(d=>d.dayKey===dayKey)
    assert(current,'BLOCK: saved target Day absent')
    const english=model.english.find(d=>d.dayKey===dayKey)
    assert(english,'BLOCK: saved English Day absent')
    const moments=day.moments.map((next,index)=>{const mapping=candidates[index];assert.equal(next.momentKey,mapping.momentKey,'BLOCK: authored Moment mapping drift')
      const previous=mapping.old,keepId=previous?.day===day.day&&previous?.id
      momentRows.push({reviewId:mapping.reviewId,dayKey,momentKey:next.momentKey,previousId:previous?.id??null,nextId:keepId||null,previousDay:previous?.day??null,previousKey:previous?.momentKey??null,action:previous?'update':'create',changedFields:momentText.concat('time').filter(k=>!isDeepStrictEqual(next[k]??null,previous?.[k]??null)),order:index,anchorImpact:previous&&!keepId?'cross-Day: new ID required; old anchor retained in mapping':'same parent identity can continue after fresh verification'})
      const active=model.placements.filter(p=>!omitted(p)&&decisions.placements[p.reviewId].destination===mapping.reviewId).toSorted((a,b)=>decisions.placements[a.reviewId].order-decisions.placements[b.reviewId].order)
      assert.equal(active.length,next.placements?.length??0,'BLOCK: placement coverage differs')
      assert.equal(new Set(active.map(p=>decisions.placements[p.reviewId].order)).size,active.length,'BLOCK: placement order collision')
      const placements=active.map((p,i)=>{const target=next.placements[i],state=decisions.placements[p.reviewId],sameParent=p.old&&p.oldMoment===mapping.oldId,entry=registry.assets.find(a=>a.assetId===p.assetId),locators=entry?.locators.filter(l=>l.environment==='production'&&l.verified)??[],locator=p.mediaId?locators.find(l=>l.payloadId===p.mediaId):locators.length===1?locators[0]:undefined
        if(p.type==='photo'&&!p.legacyEmptyRelation)assert.equal(target.media,p.assetId,'BLOCK: Source media differs from review')
        assert.equal(target.caption??'',state.caption,'BLOCK: caption differs from accepted review');assert.equal(target.role,state.role)
        if(p.mediaId)assert(locator,'BLOCK: existing Media locator absent or ambiguous')
        const oldParent=[...model.moments.map(m=>m.old).filter(Boolean),...model.removals].find(m=>m.reviewId===p.oldMoment)
        const row={oldMomentKey:oldParent?.momentKey??null,reviewId:p.reviewId,type:p.type,assetId:p.assetId??null,mediaId:locator?.payloadId??null,oldMediaId:p.mediaId??null,dayKey,momentKey:next.momentKey,placementKey:target.placementKey??null,oldPlacementKey:p.old?.placementKey??null,oldId:p.old?.id??null,nextId:sameParent?p.old.id??null:null,oldMoment:p.oldMoment??null,oldDay:p.oldDay??null,order:i,caption:state.caption,oldCaption:p.old?.caption??null,role:state.role,legacyNull:!!p.legacyEmptyRelation,action:!p.old?'create':sameParent?'retain-or-update':'move',captionChanged:!!p.old&&(p.old.caption??'')!==state.caption,orderChanged:!!p.old&&p.oldOrder!==i,anchorImpact:p.old&&!sameParent?'placement rebuilt; no old-anchor continuity claim':p.old?'retain ID/key after fresh verification':'new placement'}
        placementRows.push(row);if(p.old)oldToNew.push({reviewId:p.reviewId,old:structuredClone(p.old),destination:{dayKey,momentKey:next.momentKey,placementKey:target.placementKey??null},omitted:false})
        return {...structuredClone(target),...(row.nextId?{id:row.nextId}:{}),...(locator?{media:locator.payloadId}:{}),...(p.legacyEmptyRelation?{media:null}:{})}
      })
      return {...structuredClone(next),...(keepId?{id:keepId}:{}),placements}
    })
    dayPlans.push({dayKey,dayId:current.id,before:structuredClone(current),englishBefore:structuredClone(english),data:{...picked(day,dailyFields),moments}})
  }
  const omissions=[]
  for(const p of model.placements.filter(omitted)){const g=p.visualDuplicateGroup??p.assetId,keeper=decisions.preferredPhotos?.[g]??p.duplicateOf;assert(placementRows.some(row=>row.reviewId===keeper),'BLOCK: omitted media has no active destination');const row={reviewId:p.reviewId,assetId:p.assetId,mediaId:p.mediaId??null,keeper,old:p.old??null};omissions.push(row);if(p.old)oldToNew.push({...row,omitted:true})}
  assert.equal(oldToNew.length,model.placements.filter(p=>p.old).length,'BLOCK: old occurrence unaccounted')
  for(const r of removed)for(const p of model.placements.filter(p=>p.oldMoment===r.reviewId))assert(oldToNew.some(row=>row.reviewId===p.reviewId),'BLOCK: removed Moment media destination missing')
  const uploads=[...new Set(placementRows.filter(p=>p.type==='photo'&&p.assetId&&!p.mediaId).map(p=>p.assetId))].sort().map(id=>structuredClone(registry.assets.find(a=>a.assetId===id)))
  assert(uploads.every(Boolean))
  return {version:1,kind:'reviewed-daily-import-plan-v1',slug:source.slug,sourceSha256:sha256(sourceBytes),reviewModelSha256:modelSha256,freshCurrent:false,applyReady:false,dayPlans,moments:momentRows,placements:placementRows,removals:removed,omissions,oldToNew,uploads,policy:{mediaDelete:false,altTextUpdate:false,nonDailyWrite:false,historyPrune:false,otherLocale:'carry nonempty values by original identity; refuse loss/collision; new translations blank; fresh locale observation required',nullRelation:'preserve exact old identity/media:null; stop if fresh relationship differs'}}
}

// Pure materialization, not an executor. The caller must supply a fresh, exact
// baseline and verified Registry; this never invents IDs or a live transaction.
export function materializeReviewedDay(dayPlan,{fresh,english,expectedFreshSha256,registry,rows,origins=[],expectedOriginsSha256=null,transferredPlacementIds=[]}) {
  if(origins.length)assert.equal(sha256(origins),expectedOriginsSha256,'BLOCK: fresh origin graph drift')
  assert.equal(sha256({fresh,english}),expectedFreshSha256,'BLOCK: fresh Current drift')
  assert.equal(fresh.dayKey,dayPlan.dayKey);assert.equal(fresh.memory,2);assert.equal(english.id,fresh.id)
  const result={...structuredClone(fresh),...structuredClone(dayPlan.data)},en={...structuredClone(english),moments:[]},idMap=[]
  if(Object.hasOwn(dayPlan.data,'date'))en.date=result.date
  const usedEnglishMoments=new Set(),usedEnglishPlacements=new Set()
  for(const m of result.moments){const spec=dayPlan.data.moments.find(x=>x.momentKey===m.momentKey),same=(fresh.moments??[]).find(x=>x.momentKey===m.momentKey)
    if(same)m.id=same.id;else delete m.id
    delete m.scene;for(const k of momentText)m[k]=spec[k]??null;m.time=spec.time??null
    const oldEn=(english.moments??[]).find(x=>x.id===same?.id),enMoment={...picked(m,['id','momentKey','time']),...picked(oldEn,momentText),placements:[]};if(oldEn)usedEnglishMoments.add(oldEn.id)
    for(const [i,p]of m.placements.entries()){const row=rows.find(r=>r.dayKey===dayPlan.dayKey&&r.momentKey===m.momentKey&&r.order===i);assert(row,'BLOCK: exact placement mapping absent')
      const origin=[{zh:fresh,en:english},...origins].find(d=>row.oldDay?d.zh.dayKey===`day-${String(row.oldDay).padStart(2,'0')}`:d.zh.id===fresh.id)??{zh:fresh,en:english}
      let old=(origin.zh.moments??[]).flatMap(x=>x.placements??[]).find(x=>row.oldId&&x.id===row.oldId)
      if(!old&&row.oldMomentKey&&row.oldPlacementKey){const parents=(origin.zh.moments??[]).filter(m=>m.momentKey===row.oldMomentKey);assert.equal(parents.length,1,'BLOCK: fresh original Moment key ambiguous');const matches=parents[0].placements.filter(p=>p.placementKey===row.oldPlacementKey);assert.equal(matches.length,1,'BLOCK: fresh original placement key ambiguous');old=matches[0]}
      if(row.oldId||row.oldMomentKey){assert(old,'BLOCK: original placement ID absent from fresh Day');assert.equal(old.media??null,row.oldMediaId??null,'BLOCK: fresh media relationship drift')}
      if(row.type==='photo'){assert(!/(?:https?:\/\/|youtu\.be|youtube\.com)/i.test(old?.youtubeUrl??''),'BLOCK: legacy photo video URL requires explicit resource mapping');p.youtubeUrl=null}
      if(row.type==='youtube'&&old?.media!=null)p.media=old.media
      if(row.legacyNull){assert(old&&old.type==='photo'&&old.media==null,'BLOCK: legacy null changed');p.media=null;delete p.legacyUnresolvedMedia}
      else if(row.type==='photo'){const a=registry.assets.find(a=>a.assetId===row.assetId),locators=a?.locators.filter(l=>l.environment==='production'&&l.verified&&(!row.mediaId||l.payloadId===row.mediaId))??[];assert.equal(locators.length,1,'BLOCK: new assetId requires verified locator');p.media=locators[0].payloadId}
      if(same&&(same.placements??[]).some(x=>x.id===old?.id))p.id=old.id;else delete p.id
      const ep=(origin.en.moments??[]).flatMap(x=>x.placements??[]).find(x=>x.id===old?.id);if(ep)usedEnglishPlacements.add(ep.id)
      enMoment.placements.push({...picked(p,['id','placementKey','type','role','media','youtubeUrl']),...(Object.hasOwn(ep??{},'caption')?{caption:ep.caption}:{})});idMap.push({oldId:row.oldId,newId:p.id??null,oldKey:row.oldPlacementKey,newKey:p.placementKey,anchor:row.anchorImpact})
    }en.moments.push(enMoment)
  }
  for(const om of english.moments??[]){if(!usedEnglishMoments.has(om.id))assert(!momentText.some(k=>nonempty(om[k])),'BLOCK: removed/moved Moment has other-language text requiring explicit transfer decision');for(const p of om.placements??[])if(!usedEnglishPlacements.has(p.id)&&!transferredPlacementIds.includes(p.id))assert(!nonempty(p.caption),'BLOCK: omitted placement has other-language caption requiring explicit transfer decision')}
  return {zh:result,en,idMap,writeReady:false,requires:'#105 locked transaction, Current anchor, bounded writes, unchanged-history and independent read-back; real Payload move/remove rehearsal before pilot'}
}

export function assertReviewedHistoryPreserved(before,after,expectedAppendsByDay){
  assert.deepEqual(after.tables,before.tables,'BLOCK: retained historical content changed')
  for(const [day,roots]of Object.entries(before.rootsByDay)){const current=after.currentRoots[day];assert(Array.isArray(current),'BLOCK: missing Day history');assert.equal(current.length,roots.length+(expectedAppendsByDay[day]??0),'BLOCK: version append count differs');for(const root of roots)assert(current.some(x=>x.id===root.id),'BLOCK: historical root lost');assert.equal(current.filter(x=>x.latest).length,1,'BLOCK: latest pointer incomplete')}
  return {status:'PASS',pruned:0}
}

// Independent observation check; new IDs are returned as an explicit anchor map.
export function assertReviewedDayReadback(expected,{zh,en}){
  const semantic=day=>({dayKey:day.dayKey,date:day.date?new Date(day.date).toISOString():null,fields:picked(day,['title','dateLabel','theme','story','meals','lodging']),moments:day.moments.map(m=>({momentKey:m.momentKey,time:m.time??null,...Object.fromEntries(momentText.map(k=>[k,m[k]??null])),placements:(m.placements??[]).map(p=>({placementKey:p.placementKey,type:p.type,role:p.role??null,media:p.media??null,youtubeUrl:p.youtubeUrl??null,caption:p.caption??null}))}))})
  const anchors=[]
  for(const [locale,actual]of [['zh',zh],['en',en]]){const wanted=expected[locale];assert.equal(actual.id,wanted.id,'BLOCK: Day ID drift');assert.deepEqual(semantic(actual),semantic(wanted),'BLOCK: content/relationship/locale read-back mismatch');for(const k of Object.keys(wanted).filter(k=>!dailyFields.includes(k)&&!['moments','updatedAt'].includes(k)))assert.deepEqual(actual[k],wanted[k],'BLOCK: unrelated Day field changed')
    const ids=new Set();for(const [i,m]of actual.moments.entries()){const prior=wanted.moments[i];assert(m.id&&!ids.has(m.id),'BLOCK: missing/duplicate actual Moment ID');ids.add(m.id);if(prior.id)assert.equal(m.id,prior.id,'BLOCK: stable Moment ID lost');for(const [j,p]of m.placements.entries()){const pp=prior.placements[j];assert(p.id&&!ids.has(p.id),'BLOCK: missing/duplicate actual placement ID');ids.add(p.id);if(pp.id)assert.equal(p.id,pp.id,'BLOCK: stable placement ID lost');if(locale==='zh')anchors.push({momentKey:m.momentKey,placementKey:p.placementKey,actualMomentId:m.id,actualPlacementId:p.id,priorId:pp.id??null})}}
  }return {status:'PASS',anchors}
}


// Resolve missing post-H6 IDs by exact original parent/key paths, and cross-Day
// origins from one hash-bound fresh graph. Never match by caption, title or GPS.
export function materializeReviewedDailyGraph(plan,{fresh,english,expectedGraphSha256,registry}){
  assert.equal(sha256({fresh,english}),expectedGraphSha256,'BLOCK: fresh graph drift')
  const origins=fresh.map(d=>{const e=english.find(x=>x.id===d.id);assert(e&&d.memory===2,'BLOCK: graph owner/locale incomplete');return {zh:d,en:e}}),transferred=[]
  for(const row of plan.placements.filter(r=>r.oldMomentKey)){const origin=origins.find(d=>d.zh.dayKey===`day-${String(row.oldDay).padStart(2,'0')}`),parent=origin?.zh.moments.filter(m=>m.momentKey===row.oldMomentKey);assert(parent?.length===1,'BLOCK: original parent absent');const p=parent[0].placements.filter(p=>p.placementKey===row.oldPlacementKey);assert.equal(p.length,1,'BLOCK: original placement identity ambiguous');transferred.push(p[0].id)}
  return plan.dayPlans.map(d=>{const origin=origins.find(x=>x.zh.dayKey===d.dayKey);assert(origin,'BLOCK: fresh target Day missing');return materializeReviewedDay(d,{fresh:origin.zh,english:origin.en,expectedFreshSha256:sha256({fresh:origin.zh,english:origin.en}),registry,rows:plan.placements,origins,expectedOriginsSha256:sha256(origins),transferredPlacementIds:transferred})})
}
