import fs from 'node:fs/promises'
import type { Field } from 'payload'
import { TravelMemories } from '../payload/collections/TravelMemories'
import { TravelMemoryDays } from '../payload/collections/TravelMemoryDays'
import { Media } from '../payload/collections/Media'

// This inventory deliberately reads collection definitions, so a newly added
// field without an explicit semantic description fails the coverage audit.
const meanings: Record<string, string> = {
  title: '顯示標題', slug: '旅行網址與跨文件穩定識別', isPrivate: '家人限定或公開',
  startDate: '開始／入住日期', endDate: '結束／退房日期', summary: 'Overview 摘要',
  coverImage: 'Overview 封面照片路徑', participants: '家庭成員 slug 清單',
  guestParticipants: '外部同行者清單', name: '同行者姓名', note: '同行者備註',
  presentationStyle: 'Overview、Daily、Photos 共用版型', originPlan: '原始 Plan slug',
  galleryImages: '完整相簿照片路徑與順序', travelLedger: 'Overview 旅程資料簿',
  flights: '航班列', lodgings: '住宿列', date: '實際日期', dateLabel: '日期顯示文字',
  airline: '航空公司', flightNumber: '航班號', route: '航線', passengers: '搭機成員文字',
  departureTime: '起飛時間文字', arrivalTime: '抵達時間文字', terminal: '航廈', notes: '備註',
  dateRange: '住宿期間顯示文字', hotel: '飯店名稱', city: '城市', address: '地址',
  roomType: '房型', bookingChannel: '訂房管道', price: '價格文字', highlights: '住宿亮點',
  storySections: 'Overview 故事段落', level: '標題層級 1–3', anchor: '段落連結錨點',
  displayDay: '段落天數標籤', displayDate: '段落日期標籤', displaySubtitle: '段落副標題',
  role: '故事語意或照片使用方式', body: 'Markdown 敘事內文', links: '段落外部連結',
  label: '連結顯示文字', url: '外部連結網址', mediaItems: '段落照片路徑與順序',
  interactions: '段落互動開關', commentsEnabled: '留言開關', thumbsUpEnabled: '讚開關',
  thumbsDownEnabled: '倒讚開關', externalVideos: 'Overview 全旅程影片',
  reminders: 'Overview 補充資訊', category: '提醒分類標題', items: '提醒內容清單',
  text: 'Markdown 提醒內文', day: '第幾天（1–99）', theme: 'Daily 主題',
  story: 'Daily 故事', dailyHeroImage: 'Daily 與 Overview 日卡封面照片路徑',
  moments: '按作者順序的每日片段', time: '片段時間文字', location: '片段地點',
  transport: '交通方式', placements: '片段內照片與 YouTube 的順序',
  type: '照片／影片類型', media: '照片資產路徑', youtubeUrl: 'YouTube 網址',
  caption: '這一次使用的可見圖說（不是 altText）', meals: 'Daily 餐食',
  breakfast: '早餐', lunch: '午餐', dinner: '晚餐', lodging: 'Daily 住宿文字',
  altText: '資產無障礙描述，不作為敘事圖說', sourcePath: '相對 content-source/assets 的穩定檔案路徑',
  tags: '資產標籤', tag: '單一標籤文字', relatedMembers: '照片人物的家庭成員 slug',
  focalX: '裁切焦點水平百分比 0–100', focalY: '裁切焦點垂直百分比 0–100',
}

type Row = { path: string; classification: string; required: string; source: string; meaning: string }

export function memoryV2Coverage(): Row[] {
  const rows: Row[] = []
  function walk(fields: Field[], prefix: string) {
    for (const field of fields) {
      if (!('name' in field) || !field.name) {
        if ('fields' in field) walk(field.fields, prefix)
        continue
      }
      const path = `${prefix}.${field.name}`
      const system = field.name === 'sourceMetadata' || path.includes('.sourceMetadata.') ||
        ['dayIdentity', 'momentKey', 'placementKey'].includes(field.name)
      const derived = ['days', 'dayKey', 'memory', 'relatedTravelRecord'].includes(field.name)
      const classification = system ? 'cms/system-managed' : derived ? 'derived/importer-managed' : 'source-authorable'
      if (!system && !derived && !meanings[field.name]) throw new Error(`Unclassified field: ${path}`)
      const source = system ? '禁止手填；CMS／匯入基準管理' : derived ? ({
        days: 'Payload reverse join', dayKey: 'Day.day → day-NN',
        memory: '根文件 slug 精確解析 parent', relatedTravelRecord: '根文件 slug → travel-memories 關係',
      }[field.name] ?? '') : sourceLocation(path)
      rows.push({ path, classification, source,
        required: 'required' in field && field.required ? '必填（父項存在時）' : '可選',
        meaning: system ? '技術識別／匯入基準；不直接顯示' : derived ? source : meanings[field.name]!,
      })
      if ('fields' in field) {
        const child = field.type === 'array' ? `${path}[]` : path
        walk(field.fields, child)
        if (field.type === 'array') rows.push(systemRow(`${child}.id`))
      }
    }
  }
  walk(TravelMemories.fields, 'TravelMemories')
  walk(TravelMemoryDays.fields, 'TravelMemoryDays')
  walk(Media.fields, 'Media')
  for (const collection of ['TravelMemories', 'TravelMemoryDays', 'Media']) {
    for (const field of ['id', 'createdAt', 'updatedAt']) rows.push(systemRow(`${collection}.${field}`))
    if (collection !== 'Media') {
      for (const field of ['_status', 'versions.id', 'versions.parent', 'versions.version', 'versions.createdAt', 'versions.updatedAt', 'versions.latest', 'versions.autosave']) {
        rows.push(systemRow(`${collection}.${field}`))
      }
    }
  }
  for (const field of ['url', 'thumbnailURL', 'filename', 'mimeType', 'filesize', 'width', 'height', 'sizes']) rows.push(systemRow(`Media.${field}`))
  for (const size of ['thumbnail', 'medium', 'large']) {
    rows.push(systemRow(`Media.sizes.${size}`))
    for (const field of ['url', 'width', 'height', 'mimeType', 'filesize', 'filename']) rows.push(systemRow(`Media.sizes.${size}.${field}`))
  }
  for (const field of ['focalX', 'focalY']) rows.push({ path: `Media.${field}`, classification: 'source-authorable', required: '可選', source: `memory-media.${field}`, meaning: meanings[field]! })
  return rows
}

function sourceLocation(path: string): string {
  if (path.startsWith('Media.')) return path.replace('Media.', 'memory-media.')
  if (path.startsWith('TravelMemoryDays.')) return path.replace('TravelMemoryDays.', 'memory-day.')
  const relative = path.replace('TravelMemories.', '')
  if (relative.startsWith('travelLedger.flights')) return relative.replace('travelLedger.flights', '航班表')
  if (relative.startsWith('travelLedger.lodgings')) return relative.replace('travelLedger.lodgings', '住宿表')
  if (relative.startsWith('guestParticipants')) return relative.replace('guestParticipants', '同行者表')
  if (relative.startsWith('externalVideos')) return relative.replace('externalVideos', '影片表')
  if (relative.startsWith('storySections')) return relative.replace('storySections[]', 'memory-story').replace('storySections', 'memory-story')
  if (relative.startsWith('reminders')) return relative.replace('reminders[]', 'memory-reminder').replace('reminders', 'memory-reminder')
  if (relative === 'travelLedger') return '航班表＋住宿表'
  return `frontmatter.${relative}`
}

function systemRow(path: string): Row {
  return { path, classification: 'cms/system-managed', required: '系統管理', source: '禁止手填', meaning: 'Payload／storage／version 管理；versions.version 重用完整 document 欄位契約' }
}

export function renderMemoryV2Coverage(): string {
  const rows = memoryV2Coverage()
  const count = (kind: string) => rows.filter(row => row.classification === kind).length
  return `# Travel Memory Source v2 欄位契約\n\n由 src/scripts/travel-memory-v2-coverage.ts 依 Collection 產生。包含 container、array row ID、upload 與 version envelope；version document 的巢狀內容引用本表，不重複計數。\n\n總數 ${rows.length}；source-authorable ${count('source-authorable')}；derived/importer-managed ${count('derived/importer-managed')}；cms/system-managed ${count('cms/system-managed')}。未分類 0。\n\n## 所有作者欄位共用規則\n\n- Source 路徑使用下表位置與同名欄位；projectMemoryV2 保留 scalar／group，relationship 使用 slug 或 sourcePath 精確解析。完整語法見 [唯一模板](templates/travel-memory-source-template.md)。\n- 新建省略可選值：不建立該選項；Payload checkbox 預設仍依 schema（privacy true、互動 true、placement role inline）；缺少 style 時 runtime fallback editorial-journal。必填欄位在匯入前驗證。\n- 更新省略：保留 Current，不表示刪除。包括 nested fields、array items、語系；空值不作刪除指令。v2 不提供刪除語法。缺 Base 保留，雙方不同修改同欄位產生 conflict。\n- locale 為 zh-TW 或 en；文字依該 locale 投影，非 localized 欄位為全語系共用。未提供的語系不寫入；UI fallback 遵循 Payload 設定。\n- 表格欄位皆為文字，日期用 YYYY-MM-DD；role／type／boolean／number 依 schema 驗證。故事與 Day 的富語意內容使用具型別 fenced YAML；不填 DB ID 或 technical key。\n- Production 影響欄描述資料用途；是否顯示仍取決於現行 renderer 與版型。寫入 source 不等於發布。\n\n| Payload 路徑 | 分類 | required | Source／映射 | 語意與 Production 影響 |\n| --- | --- | --- | --- | --- |\n${rows.map(row => `| ${row.path} | ${row.classification} | ${row.required} | ${row.source} | ${row.meaning} |`).join('\n')}\n`
}

if (process.argv.includes('--write-coverage')) {
  await fs.writeFile('docs/travel-memory-source-v2-coverage.md', renderMemoryV2Coverage())
}
