import { createHash } from 'node:crypto'

export const sha256 = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex')
const copy = value => structuredClone(value)
const clean = value => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== ''))
const fields = ['time', 'location', 'title', 'body', 'transport']
const changed = (a, b, keys) => keys.filter(k => (a?.[k] ?? null) !== (b?.[k] ?? null))
export function authoredDateCandidate(day, source) {
  const match = /(\d{1,2})月(\d{1,2})日/.exec(day.title ?? '')
  return match && /^\d{4}-/.test(source.startDate ?? '') ? `${source.startDate.slice(0,4)}-${match[1].padStart(2,'0')}-${match[2].padStart(2,'0')}` : null
}
export const videoId = value => {
  try { const u = new URL(value); if (!['youtu.be', 'www.youtube.com', 'youtube.com'].includes(u.hostname) || u.protocol !== 'https:') return null
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.split('/').at(-1)
    return /^[\w-]{11}$/.test(id ?? '') ? id : null
  } catch { return null }
}

// Preserve complete prior entries, including every environment locator and file provenance.
export function mergeReviewRegistry(prior, scanned) {
  if (prior.travelSlug !== scanned.travelSlug) throw new Error('Registry owner mismatch')
  const map = new Map(prior.assets.map(a => [a.assetId, copy(a)]))
  for (const a of scanned.assets) {
    const old = map.get(a.assetId)
    if (!old) map.set(a.assetId, copy(a))
    else if (old.byteSize !== a.byteSize) throw new Error('Same hash has conflicting byte size')
  }
  return { ...copy(prior), assets: [...map.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)) }
}

export function buildTravelReview({ batch, source, current, english = [], registry, scanned, aliases = {}, freshness, questions = [] }) {
  const byAsset = new Map(registry.assets.map(a => [a.assetId, a]))
  const byMedia = new Map()
  for (const a of registry.assets) for (const l of a.locators) if (l.environment === 'production' && l.verified && l.verifiedByteHash === a.assetId) byMedia.set(l.payloadId, a)
  const lookup = ref => {
    if (!ref) return { assetId: null, mediaId: null, problem: 'null photo relation' }
    if (typeof ref === 'number') return { assetId: byMedia.get(ref)?.assetId ?? null, mediaId: ref, problem: byMedia.has(ref) ? '' : 'Media byte 身分缺口' }
    if (aliases[ref]) return lookup(aliases[ref])
    const found = registry.assets.filter(a => a.assetId === ref || a.sourcePath === ref)
    if (found.length !== 1) return { assetId: null, mediaId: null, problem: `未解析別名 ${ref}` }
    const ids = found[0].locators.filter(l => l.environment === 'production' && l.verified).map(l => l.payloadId)
    return { assetId: found[0].assetId, mediaId: ids.length === 1 ? ids[0] : null, problem: ids.length > 1 ? '相同 bytes 有多個既有 Media ID，須保留原關係' : '' }
  }
  const oldMoments = current.flatMap(d => (d.moments ?? []).map((m, i) => ({ ...copy(m), reviewId: `old:${d.day}:${i}`, day: d.day, dayId: d.id, order: i })))
  const moments = (source.days ?? []).flatMap(d => (d.moments ?? []).map((m, i) => {
    const derivedKey = `scene:${sha256(`${source.slug}:${d.day}:${m.scene}`).slice(0,24)}`
    const candidates = oldMoments.filter(o => o.day === d.day && (m.momentKey ? o.momentKey === m.momentKey : o.momentKey === m.scene || o.momentKey === derivedKey))
    const old = candidates.length === 1 ? candidates[0] : null
    const base = current.find(o => o.day === d.day)?.sourceMetadata?.baseProjection?.moments?.find(o => o.momentKey === old?.momentKey)
    return { reviewId: `new:${d.day}:${i}`, day: d.day, date: d.date ?? current.find(o=>o.day===d.day)?.date?.slice(0,10), source: copy(m), oldId: old?.reviewId ?? null, old: old ? copy(old) : null,
      dateCandidate: authoredDateCandidate(d, source),
      base: base ? copy(base) : null, currentBaseChanges: base && old ? changed(base, old, fields) : [],
      momentKey: old?.momentKey ?? m.momentKey ?? derivedKey,
      changed: changed(old, m, fields), orderChanged: !!old && old.order !== i, status: old ? changed(old, m, fields).length || old.order !== i ? '修改' : '保留' : '新增' }
  }))
  const removals = oldMoments.filter(o => !moments.some(n => n.oldId === o.reviewId)).map(o => ({ ...o, status: '移除候選', english: english.find(d => d.day === o.day)?.moments?.find(m => m.momentKey === o.momentKey) ?? null }))
  const oldPlacements = oldMoments.flatMap(m => (m.placements ?? []).map((p, i) => ({ reviewId: `placement:${m.reviewId}:${i}`, oldMoment: m.reviewId,
    oldDay: m.day, oldOrder: i, old: copy(p), ...p.type === 'youtube' ? { assetId: null, mediaId: null, videoId: videoId(p.youtubeUrl), problem: videoId(p.youtubeUrl) ? '' : '無效影片網址' } : lookup(p.media) })))
  const used = new Set(), placements = []
  const identity = p => p.type === 'youtube' ? `video:${p.videoId}` : p.mediaId ? `media:${p.mediaId}` : p.assetId ? `asset:${p.assetId}` : null
  for (const m of moments) for (const [i, p] of (m.source.placements ?? []).entries()) {
    const resolved = p.type === 'youtube' ? { assetId: null, mediaId: null, videoId: videoId(p.youtubeUrl), problem: videoId(p.youtubeUrl) ? '' : '無效影片網址' } : lookup(p.media)
    const key = identity({ ...p, ...resolved })
    const candidates = key ? oldPlacements.filter(o => !used.has(o.reviewId) && identity({ ...o.old, ...o }) === key) : []
    const sameMoment = candidates.filter(o => o.oldMoment === m.oldId)
    const match = sameMoment.length === 1 ? sameMoment[0] : candidates.length === 1 ? candidates[0] : null
    if (match) used.add(match.reviewId)
    placements.push({ ...resolved, reviewId: match?.reviewId ?? `source:${m.reviewId}:${i}`, old: match?.old ?? null,
      oldMoment: match?.oldMoment ?? null, oldDay: match?.oldDay ?? null, oldOrder: match?.oldOrder ?? null,
      source: copy(p), destination: m.reviewId, caption: p.caption ?? '', order: i, type: p.type,
      status: match ? match.oldMoment !== m.oldId ? '移動' : changed(match.old, p, ['caption', 'role']).length || match.oldOrder !== i ? '修改' : '保留' : '新增',
      problem: resolved.problem || (candidates.length > 1 && !match ? '多次展示對應不唯一；須逐項確認' : ''), candidates: candidates.map(o => o.reviewId) })
  }
  for (const o of oldPlacements.filter(o => !used.has(o.reviewId))) {
    const dest = moments.find(m => m.oldId === o.oldMoment)
    const oldMoment = oldMoments.find(m => m.reviewId === o.oldMoment)
    const renamed = moments.filter(m => m.day === o.oldDay && m.source.title === oldMoment.title && m.source.time === oldMoment.time)
    const proposal = !dest && renamed.length === 1 ? renamed[0] : null
    placements.push({ ...o, source: null, destination: dest?.reviewId ?? proposal?.reviewId ?? '', caption: o.old.caption ?? '', order: o.oldOrder, type: o.old.type,
      status: proposal ? '移動' : '待確認', problem: o.problem || (proposal ? '同日同標題同時間的明確搬移候選，尚待人工確認' : 'Source 未列此一次展示；保留／搬移須逐項確認') })
  }
  const presentAssets = new Set(placements.map(p => p.assetId).filter(Boolean))
  for (const a of scanned.assets.filter(a => !presentAssets.has(a.assetId))) placements.push({ reviewId: `input:${a.assetId}`, old: null, source: null, oldMoment: null,
    type: 'photo', assetId: a.assetId, mediaId: (a.locators ?? []).find(l => l.environment === 'production' && l.verified)?.payloadId ?? null,
    destination: '', caption: '', order: 0, status: '待確認', problem: '本批照片尚未配置', filename: a.filename })
  const representedMedia = new Set(placements.map(p=>p.mediaId).filter(Boolean))
  for (const [mediaId,a] of byMedia) if (!representedMedia.has(mediaId)) placements.push({
    reviewId:`existing-media:${mediaId}`,old:null,source:null,oldMoment:null,type:'photo',assetId:a.assetId,mediaId,
    destination:'',caption:'',order:0,status:'待確認',filename:a.filename,existingMedia:true,
    problem:'保存 Registry 中的既有 Media 尚無每日展示；可能屬封面／相簿。須確認 Current 用途及目的 Moment，不更動非每日關係。',
  })
  const scannedById = new Map(scanned.assets.map(a => [a.assetId, a]))
  for (const p of placements) {
    const a = scannedById.get(p.assetId) ?? byAsset.get(p.assetId)
    p.filename = p.filename ?? a?.filename ?? (p.type === 'youtube' ? p.source?.youtubeUrl ?? p.old?.youtubeUrl : `Media ${p.mediaId ?? '?'}`)
    if (p.type === 'photo' && p.old?.youtubeUrl) p.problem += '；photo 同時含有影片網址，須確認保全方式'
    p.metadata = scannedById.has(p.assetId) ? clean({ capturedAt: a.capturedAt, timezone: a.timezone, gps: a.gps }) : null
    if (p.metadata?.capturedAt) {
      const offset = /^([+-])(\d{2}):(\d{2})$/.exec(p.metadata.timezone ?? '')
      if (offset && /Z$/.test(p.metadata.capturedAt)) {
        const minutes = (Number(offset[2])*60+Number(offset[3]))*(offset[1] === '-' ? -1 : 1)
        p.metadata.localTime = new Date(Date.parse(p.metadata.capturedAt)+minutes*60000).toISOString().slice(0,19)
        const date = p.metadata.localTime.slice(0,10), time = p.metadata.localTime.slice(11,16)
        p.suggestions = moments.filter(m => (m.date ?? m.dateCandidate) === date).sort((a,b) => Math.abs(toMinutes(a.source.time)-toMinutes(time))-Math.abs(toMinutes(b.source.time)-toMinutes(time))).slice(0,3).map(m=>m.reviewId)
      }
    }
    if (!p.metadata?.timezone) p.timeCaution = '無本批已知時區 metadata，不能以檔名／GPS 推定日期'
  }
  return { version: 1, ...batch, source: copy(source), current: copy(current), english: copy(english), moments, removals, placements, freshness, questions,
    limitations: ['保存快照非即時 Production。成功寫入後投影重建的新增 ID 尚缺直接快照。', '共用 Moment／placement 的移除、搬移或時間變更會影響 en 結構；英文不自動翻譯或刪除。', 'Media records/files/altText、封面、相簿、privacy、參與者及非每日內容不納入套用；原稿其他區塊僅保留為材料。', '本頁只產生候選及內容決定；不建立 #105 approval，不宣稱 apply READY。'] }
}
function toMinutes(t) { const m=/^(\d{2}):(\d{2})$/.exec(t??''); return m ? Number(m[1])*60+Number(m[2]) : -10000 }

export async function renderTravelReview(model, template) {
  const payload = JSON.stringify(model).replaceAll('<', '\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029')
  return template.replace('/*REVIEW_DATA*/null', payload)
}
