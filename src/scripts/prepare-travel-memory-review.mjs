import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { parseMemorySourceV2 } from './travel-memory-source-v2.ts'
import { validateMediaRegistry } from './travel-memory-media-registry.ts'
import { buildTravelReview, mergeReviewRegistry, renderTravelReview, sha256 } from './travel-memory-review.mjs'

// Local files only. No database, credentials, environment loader, upload, or apply dependency.
export async function prepareTravelReview(config) {
  const read = async p => JSON.parse(await readFile(p,'utf8'))
  const batch = await read(config.batch)
  const original = await readFile(config.original)
  if (sha256(original) !== batch.sourceSha256) throw new Error('Original Source hash drift')
  const syntaxSource = await readFile(config.source,'utf8')
  const source = parseMemorySourceV2(syntaxSource)
  const prior = validateMediaRegistry(await read(config.priorRegistry), source.slug)
  const scanned = validateMediaRegistry(await read(config.scannedRegistry), source.slug)
  const registry = validateMediaRegistry(mergeReviewRegistry(prior, scanned), source.slug)
  const current = await read(config.current)
  const model = buildTravelReview({batch,source,current:current.days,english:current.english,registry,scanned,
    aliases:config.aliases,freshness:config.freshness,questions:config.questions})
  model.syntaxSource = syntaxSource
  model.nonDailyChanges = config.nonDailyChanges ?? []
  model.oldLabels = Object.fromEntries(current.days.flatMap(d=>(d.moments??[]).map((m,i)=>[`old:${d.day}:${i}`,`Day ${d.day} ${m.time??''} ${m.title??m.momentKey}`])))
  model.thumbnails = {}
  const imageEvidence = [], fileInventory = []
  const pixels = new Map()
  const perceptual = []
  const imageKey = async bytes => sha256(await sharp(bytes).rotate().resize(64,64,{fit:'fill'}).removeAlpha().raw().toBuffer())
  const differenceHash = async bytes => {
    const pixels = await sharp(bytes).rotate().resize(9,8,{fit:'fill'}).greyscale().raw().toBuffer()
    return Array.from({length:64},(_,i)=>pixels[Math.floor(i/8)*9+i%8]>pixels[Math.floor(i/8)*9+i%8+1]?'1':'0').join('')
  }
  for (const file of config.savedImageFiles ?? []) {
    const bytes = await readFile(file), id=`sha256:${sha256(bytes)}`
    if (!prior.assets.some(a=>a.assetId===id)) throw new Error('Saved Media image bytes not in prior Registry')
    model.thumbnails[id]=`data:image/jpeg;base64,${(await sharp(bytes).rotate().resize(360,260,{fit:'inside',withoutEnlargement:true}).jpeg({quality:65}).toBuffer()).toString('base64')}`
    const key = await imageKey(bytes);pixels.set(key,[...(pixels.get(key)??[]),id]);imageEvidence.push({file,assetId:id,pixel64Sha256:key})
    if(!perceptual.some(p=>p.assetId===id))perceptual.push({assetId:id,differenceHash:await differenceHash(bytes)})
  }
  for(const a of scanned.assets) {
    for(const file of a.files){const bytes=await readFile(path.join(config.photoRoot,file));if(`sha256:${sha256(bytes)}`!==a.assetId)throw new Error(`Photo bytes drift: ${file}`);fileInventory.push({file,assetId:a.assetId,bytes:bytes.length})}
    const bytes=await readFile(path.join(config.photoRoot,a.files[0]));
    model.thumbnails[a.assetId]=`data:image/jpeg;base64,${(await sharp(bytes).rotate().resize(360,260,{fit:'inside',withoutEnlargement:true}).jpeg({quality:65}).toBuffer()).toString('base64')}`
    const key=await imageKey(bytes),exact=pixels.get(key)??[],dh=await differenceHash(bytes)
    const similar=perceptual.map(p=>({...p,distance:[...dh].filter((b,i)=>b!==p.differenceHash[i]).length})).filter(p=>p.distance<=5).sort((a,b)=>a.distance-b.distance)
    const candidates=[...new Set([...exact,...similar.map(p=>p.assetId)])]
    for(const p of model.placements.filter(p=>p.assetId===a.assetId))if(candidates.length){p.pixelCandidates=candidates;p.problem+='；與本地舊圖相似（dHash <=5/64），僅為衍生圖候選，需目視確認；不授予舊 Media 身分或上傳許可'}
    imageEvidence.push({file:a.files[0],assetId:a.assetId,pixel64Sha256:key,priorCandidates:candidates,perceptualCandidates:similar})
  }
  for(const p of model.placements) {
    p.thumbnailAvailable=Boolean(model.thumbnails[p.assetId])
    p.identityImpact=p.old&&p.destination&&model.moments.find(m=>m.reviewId===p.destination)?.oldId!==p.oldMoment?'跨 Moment 搬移可能重建 placement ID；原 key、Media ID 保留於對照。直接 anchor／互動依賴需確認。':p.old?'原 ID/key/Media 關係保留；若為最新新增項目，實際 ID 待查。':'新展示／新照片候選，尚無寫入／上傳授權。'
  }
  model.photoInventorySha256=sha256(fileInventory)
  const summary={batchId:model.batchId,sourceSha256:model.sourceSha256,sourceMoments:model.moments.length,
    momentStatus:Object.fromEntries(['新增','保留','修改'].map(s=>[s,model.moments.filter(m=>m.status===s).length])),removalCandidates:model.removals.length,
    placementStatus:Object.fromEntries(['新增','保留','移動','修改','待確認'].map(s=>[s,model.placements.filter(p=>p.status===s).length])),
    oldPlacements:model.placements.filter(p=>p.old).length,unassigned:model.placements.filter(p=>!p.destination).length,
    nullRelations:model.placements.filter(p=>p.old?.type==='photo'&&!p.old.media).length,
    scannedImages:scanned.assets.length,priorAssets:prior.assets.length,unionAssets:registry.assets.length,
    byteMatches:scanned.assets.filter(a=>prior.assets.some(p=>p.assetId===a.assetId)).length,
    existingMediaOutsideDaily:model.placements.filter(p=>p.existingMedia).length,
    pixelCandidateImages:imageEvidence.filter(x=>x.priorCandidates?.length).length,
    thumbnails:Object.keys(model.thumbnails).length,placementsMissingThumbnails:model.placements.filter(p=>p.type==='photo'&&!p.thumbnailAvailable).length,
    allOldOccurrencesAccountedFor:model.placements.filter(p=>p.old).length===current.days.reduce((n,d)=>n+(d.moments??[]).reduce((n,m)=>n+(m.placements??[]).length,0),0),
    allOldReassigned:false,productionApplyReady:false,productionApplyAuthorized:false}
  // Model binding excludes thumbnails; source, mappings, metadata and all evidence paths are bound.
  const {thumbnails,...bound}=model;model.modelSha256=sha256(bound)
  await mkdir(config.output,{recursive:false})
  const save=async(n,v)=>writeFile(path.join(config.output,n),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600})
  await save('registry.json',registry);await save('review-model.json',model);await save('summary.json',summary)
  await save('file-inventory.json',fileInventory);await save('image-evidence.json',imageEvidence)
  await writeFile(path.join(config.output,'review.html'),await renderTravelReview(model,await readFile(new URL('./travel-memory-review.html',import.meta.url),'utf8')),{flag:'wx',mode:0o600})
  return summary
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==4||process.argv[2]!=='--config')throw new Error('Usage: node --import tsx src/scripts/prepare-travel-memory-review.mjs --config <local-config.json>')
  console.log(JSON.stringify(await prepareTravelReview(JSON.parse(await readFile(process.argv[3],'utf8')))))
}
