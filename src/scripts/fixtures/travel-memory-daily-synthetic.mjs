import {sha256} from '../travel-memory-review.mjs'

// No saved Current, photo bytes, environment, or remote target is consulted.
export function syntheticDailyFixture() {
 const registry={version:1,travelSlug:'synthetic-travel',assets:[]}
 const graph={fresh:[],english:[]},plan={version:1,slug:'synthetic-travel',sourceSha256:sha256('synthetic Source'),dayPlans:[],moments:[],placements:[],removals:[],omissions:[]}
 for(let day=1;day<=9;day++){
  const dayKey=`day-${String(day).padStart(2,'0')}`,id=100+day,media=500+day
  for(const [label,payloadId]of [['old',media],['new',600+day]]){
   const filename=`${label}-${day}.jpeg`,assetId='sha256:'+sha256(filename)
   registry.assets.push({assetId,files:[filename],filename,mimeType:'image/jpeg',width:1,height:1,byteSize:1,provenance:'local-file',locators:[{environment:'production',payloadId,verified:true,verifiedByteHash:assetId}]})
  }
  const moments=[
   {id:`m${day}-target`,momentKey:'target',title:'合成目的',placements:[{id:`p${day}-keep`,placementKey:'keep',type:'photo',role:'inline',media,caption:'合成舊圖說'},{id:`p${day}-null`,placementKey:'null',type:'photo',role:'inline',media:null}]},
   {id:`m${day}-origin`,momentKey:'origin',title:'合成來源',placements:[{id:`p${day}-move`,placementKey:`move-${day}`,type:'photo',role:'inline',media,caption:null},{id:`p${day}-omit`,placementKey:'duplicate',type:'photo',media,caption:null}]},
   {id:`m${day}-empty`,momentKey:'empty',title:'合成空片段',placements:[]},
  ]
  const fresh={id,memory:2,dayIdentity:`2:${dayKey}`,dayKey,day,date:`2099-01-${String(day).padStart(2,'0')}`,title:'合成每日',lodging:null,dailyHeroImage:media,_status:'published',sourceMetadata:{baseProjection:{fixture:day}},createdAt:'2099-01-01T00:00:00Z',updatedAt:'2099-01-01T00:00:00Z',moments}
  const english=structuredClone(fresh);english.title='Synthetic day'
  for(const m of english.moments){m.title=m.momentKey==='origin'?null:'Synthetic '+m.momentKey;for(const p of m.placements)p.caption=p.placementKey.startsWith('move')?'Synthetic transferred caption':null}
  graph.fresh.push(fresh);graph.english.push(english)
 }
 for(const [index,fresh]of graph.fresh.entries()){
  const origin=graph.fresh[(index+1)%9],dayKey=fresh.dayKey,day=fresh.day,asset=registry.assets.find(a=>a.filename===`new-${day}.jpeg`)
  const specs=[
   {old:fresh.moments[0].placements[0],parent:'target',source:fresh,action:'retain-or-update'},
   {old:fresh.moments[0].placements[1],parent:'target',source:fresh,action:'retain-or-update',legacyNull:true},
   {old:origin.moments[1].placements[0],parent:'origin',source:origin,action:'move'},
   {asset,action:'create'},
  ]
  const placements=specs.map((s,order)=>{
   const assetId=s.asset?.assetId??registry.assets.find(a=>a.locators[0].payloadId===s.old.media)?.assetId
   plan.placements.push({reviewId:`review-${day}-${order}`,dayKey,momentKey:'target',order,type:'photo',action:s.action,assetId:assetId??null,mediaId:s.old?.media??s.asset?.locators[0].payloadId??null,oldMediaId:s.old?.media??null,oldId:s.old?.id??null,oldDay:s.source?.day??null,oldMomentKey:s.old?s.parent:null,oldPlacementKey:s.old?.placementKey??null,placementKey:s.old?.placementKey??null,legacyNull:!!s.legacyNull})
   return {type:'photo',role:'inline',...(s.old?{placementKey:s.old.placementKey}:{}),...(s.legacyNull?{legacyUnresolvedMedia:true}:{media:assetId}),caption:'合成新圖說'}
  })
  plan.dayPlans.push({dayKey,dayId:fresh.id,data:{title:'合成新每日',moments:[{momentKey:'target',title:'合成新目的',placements},{momentKey:'empty',title:'合成空片段',placements:[]}]}})
  for(const key of ['target','empty'])plan.moments.push({reviewId:`moment-${day}-${key}`,dayKey,momentKey:key,previousDay:day,previousKey:key})
  plan.removals.push({id:fresh.moments[1].id,dayId:fresh.id,day,momentKey:'origin'})
  plan.omissions.push({reviewId:`omitted-${day}`,keeper:`review-${day}-0`,old:fresh.moments[1].placements[1]})
 }
 return {graph,plan,registry,counts:{moments:18,placements:36,removals:9,omissions:9,generated:9}}
}
