// Offline proposals only. Raw offsets and hash-bound evidence are retained; no geocoder or network.
export const minutes = t => /^\d{2}:\d{2}$/.test(t ?? '') ? Number(t.slice(0,2))*60+Number(t.slice(3,5)) : null
export function distanceKm(a,b) {
  if (!a || !b) return null
  const rad=x=>x*Math.PI/180, dlat=rad(b.latitude-a.latitude), dlon=rad(b.longitude-a.longitude)
  return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2))
}
export function rawCapture(raw, offset, gps, provenance) {
  if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(raw??'') || !/^[+-]\d{2}:\d{2}$/.test(offset??'')) return null
  const localTime=raw.slice(0,10).replaceAll(':','-')+'T'+raw.slice(11)
  return {localTime,timezone:offset,capturedAt:new Date(localTime+offset).toISOString(),gps:gps??null,provenance}
}
export function timeCandidates(metadata,moments) {
  if (!metadata?.localTime) return []
  const date=metadata.localTime.slice(0,10),t=minutes(metadata.localTime.slice(11,16))
  const day=moments.filter(m=>m.date===date&&minutes(m.source.time)!==null).sort((a,b)=>minutes(a.source.time)-minutes(b.source.time))
  return day.map((m,i)=>{const start=minutes(m.source.time),end=i+1<day.length?minutes(day[i+1].source.time):1440,inside=t>=start&&t<end
    return {id:m.reviewId,start,end,inside,elapsed:t-start,boundary:Math.min(Math.abs(t-start),Math.abs(t-end)),score:inside?0:Math.min(Math.abs(t-start),Math.abs(t-end))+1}
  }).sort((a,b)=>a.score-b.score||Math.abs(a.elapsed)-Math.abs(b.elapsed))
}
export function proposeMediaPlacements(model,metadataByAsset) {
  const temporalGpsConflicts=new Map(),gpsAssets=[...metadataByAsset].filter(([,m])=>m?.gps&&m.capturedAt)
  for(const [asset,m]of gpsAssets){const neighbours=gpsAssets.filter(([id,n])=>id!==asset&&Math.abs(Date.parse(m.capturedAt)-Date.parse(n.capturedAt))<=30*60000);if(neighbours.length<3)continue;const clusters=neighbours.map(([,n])=>neighbours.filter(([,v])=>distanceKm(n.gps,v.gps)<=3));clusters.sort((a,b)=>b.length-a.length);const cluster=clusters[0];if(cluster.length<3||cluster.length<neighbours.length*0.6)continue;const distance=Math.min(...cluster.map(([,n])=>distanceKm(m.gps,n.gps)));if(distance>10)temporalGpsConflicts.set(asset,{distanceKm:distance,samples:cluster.length})}
  const anchors=new Map(),oldDestination=new Map(model.moments.filter(m=>m.oldId).map(m=>[m.oldId,m.reviewId]))
  for (const p of model.placements) {
    p.metadata=metadataByAsset.get(p.assetId)??null
    p.timeCaution=p.metadata?'':'無已保存的可靠拍攝時間／時區；須目視及原展示資訊確認。'
    if(!temporalGpsConflicts.has(p.assetId)&&p.metadata?.gps&&p.oldMoment&&oldDestination.get(p.oldMoment)===p.destination){
      const best=timeCandidates(p.metadata,model.moments)[0]
      if(best?.inside&&best.id===p.destination&&best.boundary>=0){
        const list=anchors.get(best.id)??[];list.push({assetId:p.assetId,gps:p.metadata.gps});anchors.set(best.id,list)
      }
    }
  }
  for (const p of model.placements) {
    p.originalDestination=p.destination;p.originalProblem=p.problem
    if(p.type!=='photo') {p.needsChoice=Boolean(p.problem||!p.destination);p.assignmentReason=p.source?'Source 指定影片位置':'影片缺拍攝 metadata；依原位置／Source 對照';continue}
    const candidates=timeCandidates(p.metadata,model.moments)
    p.placementCandidates=candidates.slice(0,4).map(c=>{const points=(anchors.get(c.id)??[]).filter(a=>a.assetId!==p.assetId);const distances=points.map(a=>distanceKm(p.metadata?.gps,a.gps)).filter(x=>x!==null)
      return {...c,gpsDistanceKm:distances.length?Math.min(...distances):null,anchorSamples:points.length}
    })
    p.suggestions=p.placementCandidates.map(c=>c.id)
    if(p.metadata?.timezone==='+08:00'){const local10=new Date(Date.parse(p.metadata.capturedAt)+600*60000).toISOString().slice(0,19);p.timeAlternatives=[{label:'EXIF 原始相機時刻',localTime:p.metadata.localTime,timezone:'+08:00'},{label:'同一 UTC 換算澳洲 +10:00',localTime:local10,timezone:'+10:00'}];const alternatives=timeCandidates({...p.metadata,localTime:local10},model.moments).slice(0,2);for(const c of alternatives)if(!p.placementCandidates.some(x=>x.id===c.id))p.placementCandidates.push({...c,gpsDistanceKm:null,anchorSamples:0,alternativeClock:true})}
    const best=p.placementCandidates[0],specificProblems=[]
    if(temporalGpsConflicts.has(p.assetId)){p.temporalGpsConflict=temporalGpsConflicts.get(p.assetId);specificProblems.push(`GPS 與拍攝前後30分鐘的 ${p.temporalGpsConflict.samples} 張主要照片群相距 ${p.temporalGpsConflict.distanceKm.toFixed(1)} km；不可用 GPS 猜地點`)}
    if(!p.assetId)specificProblems.push('null relation／媒體身分待確認')
    if(!best)specificProblems.push('缺拍攝日期、時間或該日 Moment')
    if(best&&!best.inside)specificProblems.push('時間在該日第一個 Moment 之前')
    const gpsResolvesBoundary=best?.gpsDistanceKm!==null&&best?.gpsDistanceKm<=0.75&&p.placementCandidates.filter(c=>c.id!==best.id&&c.gpsDistanceKm!==null).some(c=>c.gpsDistanceKm>2)&&!p.placementCandidates.some(c=>c.id!==best.id&&c.gpsDistanceKm!==null&&c.gpsDistanceKm<=2)
    const sameRetainedMoment=Boolean(best&&oldDestination.get(p.oldMoment)===best.id&&p.originalDestination===best.id)
    if(best?.boundary<=8&&!gpsResolvesBoundary&&!sameRetainedMoment)specificProblems.push('位於相鄰行程時間前後 8 分鐘內，GPS 不足以區分')
    if(best?.elapsed>180)specificProblems.push('距行程起點逾 3 小時，可能是途中或其他活動')
    if(p.metadata?.timezone==='+08:00'&&best&&![1,9].includes(model.moments.find(m=>m.reviewId===best.id)?.day))specificProblems.push('+08:00 相機時區與澳洲行程需確認；可另比較 +10:00 時刻')
    if(best?.gpsDistanceKm>3)specificProblems.push(`GPS 與時間區間內的既有展示錨點相距 ${best.gpsDistanceKm.toFixed(1)} km`)
    if(p.old?.youtubeUrl)specificProblems.push('photo 同時有影片網址，須保全兩種資訊')
    if(p.originalDestination&&best?.inside&&best.id!==p.originalDestination)specificProblems.push('Source／保留中的既有展示位置與拍攝時間所屬區間不同')
    p.needsChoice=specificProblems.length>0
    if(!p.needsChoice){p.destination=p.source?p.destination:best.id;p.autoAssigned=!p.source;p.assignmentReason=`拍攝當地時間落在 ${model.moments.find(m=>m.reviewId===best.id).source.time}–${best.end===1440?'當日結束':String(Math.floor(best.end/60)).padStart(2,'0')+':'+String(best.end%60).padStart(2,'0')} 區間`+(best.gpsDistanceKm!==null?`；GPS 距已保存的同片段照片 ${best.gpsDistanceKm.toFixed(2)} km`:'；沒有獨立 GPS 地點錨點，位置為時間配置建議')
      p.problem=''
    } else {p.assignmentReason=specificProblems.join('；');p.problem=p.assignmentReason}
    if(!p.source&&!p.needsChoice)p.status=p.old?'移動':'新增'
  }
  // The Human requested one display per exact photograph. Every occurrence remains in the ledger.
  const groups=new Map()
  for(const p of model.placements.filter(p=>p.type==='photo'&&p.assetId)){const list=groups.get(p.assetId)??[];list.push(p);groups.set(p.assetId,list)}
  for(const rows of groups.values())if(rows.length>1){rows.sort((a,b)=>Number(Boolean(b.source))-Number(Boolean(a.source))||Number(Boolean(b.old))-Number(Boolean(a.old))||a.reviewId.localeCompare(b.reviewId));const keeper=rows[0]
    for(const p of rows.slice(1)){p.duplicateOf=keeper.reviewId;p.duplicateReason='Human：同圖只保留一次；SHA-256 exact-byte 相同。Media ID／原展示仍保存在逐項對照。';p.needsChoice=false}
  }
  for(const m of model.moments){const rows=model.placements.filter(p=>p.destination===m.reviewId&&!p.duplicateOf).sort((a,b)=>(a.metadata?.localTime??'9999').localeCompare(b.metadata?.localTime??'9999')||a.order-b.order);for(const [i,p]of rows.entries())p.order=i}
  return model
}

// Use only after an explicit Human decision that capture time takes precedence over GPS.
export function captureTimePriorityDecision(placement, moments) {
  if (placement.type !== 'photo' || !placement.assetId) return {resolved:false,reason:'缺少有效照片身分；保留原關係待確認'}
  const metadata=placement.metadata
  if (!metadata?.capturedAt || !/^[+-]\d{2}:\d{2}$/.test(metadata.timezone??'') || !metadata.localTime) return {resolved:false,reason:'缺少已保存的拍攝時間／明確時區，不能以 GPS 或檔名補日期'}
  const candidate=timeCandidates(metadata,moments)[0]
  if (!candidate?.inside) return {resolved:false,reason:'拍攝時間不在當日已編列的 Moment 區間；不猜測跨日或拍攝時鐘修正'}
  return {resolved:!placement.old?.youtubeUrl,destination:candidate.id,reason:placement.old?.youtubeUrl?'已依拍攝時間配置，但原 photo 的異常 YouTube 欄位仍需保全決定':'依 Human 指示，以含明確時區的照片拍攝時間配置；GPS 衝突保留為證據，不覆蓋時間',candidate}
}
