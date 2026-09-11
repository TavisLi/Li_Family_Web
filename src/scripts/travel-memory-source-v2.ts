import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { z } from 'zod'
import type { Media, TravelMemory, TravelMemoryDay } from '../payload/payload-types'

const text = z.string().trim().min(1)
const date = z.string().date()
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const assetPath = text.refine(value => !value.startsWith('/') && !value.includes('\\') &&
  value.split('/').every(part => part !== '..' && part !== '.' && part !== ''), 'Use a relative asset path without traversal')
const youtube = z.string().url().refine(value => {
  const url = new URL(value)
  return ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname) &&
    Boolean(url.hostname === 'youtu.be' ? url.pathname.match(/^\/[\w-]{11}$/) :
      url.pathname === '/watch' ? url.searchParams.get('v')?.match(/^[\w-]{11}$/) : url.pathname.match(/^\/(?:embed|shorts)\/[\w-]{11}$/))
}, 'Use a YouTube watch, shorts, embed or youtu.be video URL')
const fields = <T extends string>(names: T[]) => Object.fromEntries(names.map(name => [name, text.optional()])) as Record<T, z.ZodOptional<typeof text>>
const flight = z.object({ ...fields(['dateLabel', 'airline', 'flightNumber', 'route', 'passengers', 'departureTime', 'arrivalTime', 'terminal', 'notes']), date: date.optional() }).strict()
const lodging = z.object({ ...fields(['dateRange', 'city', 'address', 'roomType', 'bookingChannel', 'price', 'highlights', 'notes']), hotel: text, startDate: date.optional(), endDate: date.optional() }).strict()
  .refine(value => !value.startDate || !value.endDate || value.endDate >= value.startDate, 'endDate precedes startDate')
const guest = z.object({ name: text, note: text.optional() }).strict()
const video = z.object({ title: text.optional(), url: youtube }).strict()
const placement = z.object({
  type: z.enum(['photo', 'youtube']), role: z.enum(['hero', 'inline', 'gallery']).optional(),
  media: assetPath.optional(), youtubeUrl: youtube.optional(), caption: text.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.type === 'photo' ? !value.media || value.youtubeUrl !== undefined : !value.youtubeUrl || value.media !== undefined) {
    ctx.addIssue({ code: 'custom', message: 'photo requires only media; youtube requires only youtubeUrl' })
  }
})
const moment = z.object({
  scene: text, title: text, ...fields(['time', 'location', 'body', 'transport']), placements: z.array(placement).optional(),
}).strict()
const day = z.object({
  day: z.number().int().min(1).max(99), date: date.optional(), title: text,
  ...fields(['dateLabel', 'theme', 'story', 'lodging']), dailyHeroImage: assetPath.optional(),
  moments: z.array(moment).optional(),
  meals: z.object({ breakfast: text.optional(), lunch: text.optional(), dinner: text.optional() }).strict().optional(),
}).strict()
const section = z.object({
  level: z.number().int().min(1).max(3), title: text, anchor: text,
  ...fields(['displayDay', 'displayDate', 'displaySubtitle']),
  role: z.enum(['featured-memory', 'travel-reflection', 'unforgettable-day', 'family-story', 'additional-information']).optional(),
  body: text, links: z.array(z.object({ label: text.optional(), url: z.string().url() }).strict()).optional(),
  mediaItems: z.array(assetPath).optional(),
  interactions: z.object({ commentsEnabled: z.boolean().optional(), thumbsUpEnabled: z.boolean().optional(), thumbsDownEnabled: z.boolean().optional() }).strict().optional(),
}).strict()
const reminder = z.object({ category: text, items: z.array(z.object({ entry: text, text }).strict()).optional() }).strict()
const media = z.object({
  sourcePath: assetPath, type: z.enum(['photo', 'video']), youtubeUrl: youtube.optional(), altText: text,
  tags: z.array(z.object({ tag: text }).strict()).optional(), relatedMembers: z.array(slug).optional(),
  focalX: z.number().min(0).max(100).optional(), focalY: z.number().min(0).max(100).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.type === 'video' && !value.youtubeUrl) ctx.addIssue({ code: 'custom', message: 'video requires youtubeUrl' })
  if (value.type === 'photo' && value.youtubeUrl) ctx.addIssue({ code: 'custom', message: 'photo cannot specify youtubeUrl' })
})
const metadata = z.object({
  sourceVersion: z.literal(2), locale: z.enum(['zh-TW', 'en']).default('zh-TW'),
  title: text, slug, startDate: date, endDate: date, isPrivate: z.boolean(), summary: text.optional(),
  presentationStyle: z.enum(['editorial-journal', 'cinematic-timeline', 'family-scrapbook']).optional(),
  participants: z.array(slug).optional(), originPlan: slug.optional(),
  coverImage: assetPath.optional(), galleryImages: z.array(assetPath).optional(),
}).strict().refine(value => value.endDate >= value.startDate, 'endDate precedes startDate')

export type MemorySourceV2 = z.infer<typeof metadata> & {
  flights?: z.infer<typeof flight>[]; lodgings?: z.infer<typeof lodging>[];
  guestParticipants?: z.infer<typeof guest>[]; externalVideos?: z.infer<typeof video>[];
  storySections?: z.infer<typeof section>[]; days?: z.infer<typeof day>[];
  reminders?: z.infer<typeof reminder>[]; assets?: z.infer<typeof media>[];
}

const tables = {
  航班: { target: 'flights', schema: flight, columns: ['date', 'dateLabel', 'airline', 'flightNumber', 'route', 'passengers', 'departureTime', 'arrivalTime', 'terminal', 'notes'] },
  住宿: { target: 'lodgings', schema: lodging, columns: ['startDate', 'endDate', 'dateRange', 'hotel', 'city', 'address', 'roomType', 'bookingChannel', 'price', 'highlights', 'notes'] },
  同行者: { target: 'guestParticipants', schema: guest, columns: ['name', 'note'] },
  影片: { target: 'externalVideos', schema: video, columns: ['title', 'url'] },
} as const
const blocks = {
  'memory-story': { target: 'storySections', schema: section },
  'memory-day': { target: 'days', schema: day },
  'memory-reminder': { target: 'reminders', schema: reminder },
  'memory-media': { target: 'assets', schema: media },
} as const

export function parseMemorySourceV2(markdown: string): MemorySourceV2 {
  const parsed = matter(markdown)
  const result: Record<string, unknown> = metadata.parse(parsed.data)
  let body = parsed.content.replace(/<!--[^]*?-->/g, '')
  body = body.replace(/^```([^\n]+)\n([^]*?)^```\s*$/gm, (_, language: string, yaml: string) => {
    const block = blocks[language as keyof typeof blocks]
    if (!block) throw new Error(`Unknown v2 block: ${language}`)
    const value = block.schema.safeParse(matter(`---\n${yaml}\n---`).data)
    if (!value.success) throw new Error(`${language}: ${value.error.message}`)
    const items = (result[block.target] ?? []) as unknown[]
    items.push(value.data)
    result[block.target] = items
    return ''
  })
  for (const [heading, table] of Object.entries(tables)) {
    const pattern = new RegExp(`^# ${heading}\\s*\\n((?:\\|[^\\n]*\\n?)+)`, 'gm')
    let count = 0
    body = body.replace(pattern, (_, content: string) => {
      if (++count > 1) throw new Error(`Duplicate table: ${heading}`)
      const rows = content.trim().split('\n').map(line => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|')))
      const headers = rows.shift()!
      if (new Set(headers).size !== headers.length || headers.some(header => !(table.columns as readonly string[]).includes(header))) {
        throw new Error(`${heading}: unknown or duplicate columns: ${headers.join(', ')}`)
      }
      const separator = rows.shift()
      if (!separator || separator.length !== headers.length || separator.some(cell => !/^:?-{3,}:?$/.test(cell))) throw new Error(`${heading}: invalid table separator`)
      result[table.target] = rows.map((cells, index) => {
        if (cells.length !== headers.length) throw new Error(`${heading} row ${index + 1}: incorrect cell count`)
        return table.schema.parse(Object.fromEntries(headers.flatMap((key, i) => cells[i] ? [[key, cells[i]]] : [])))
      })
      return ''
    })
  }
  // Rich content belongs inside typed blocks: prose outside them must not be
  // silently discarded. H1 labels are purely human-readable separators.
  const remainder = body.replace(/^# (?:故事|每日|提醒|資產)(?: .*)?$/gm, '').trim()
  if (remainder) throw new Error(`Unrecognized v2 content: ${remainder.slice(0, 100)}`)
  const source = result as MemorySourceV2
  unique(source.days?.map(item => String(item.day)), 'day')
  unique(source.storySections?.map(item => item.anchor), 'story anchor')
  unique(source.assets?.map(item => item.sourcePath), 'asset sourcePath')
  unique(source.participants, 'participant')
  for (const item of source.reminders ?? []) unique(item.items?.map(row => row.entry), `reminder ${item.category} entry`)
  for (const item of source.days ?? []) {
    unique(item.moments?.map(moment => moment.scene), `day ${item.day} scene`)
    for (const scene of item.moments ?? []) unique(scene.placements?.map(placementIdentity), `day ${item.day} ${scene.scene} placement`)
  }
  for (const item of source.assets ?? []) {
    if (!item.sourcePath.startsWith(`travels/${source.slug}/`)) throw new Error(`Asset must belong to travels/${source.slug}/: ${item.sourcePath}`)
    unique(item.relatedMembers, 'relatedMembers')
  }
  return source
}

function unique(values: string[] | undefined, label: string) {
  if (values && new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`)
}

function placementIdentity(value: { media?: string; youtubeUrl?: string }): string {
  if (value.media) return value.media
  const url = new URL(value.youtubeUrl!)
  return `youtube:${url.searchParams.get('v') ?? url.pathname.split('/').pop()}`
}

export type MemoryV2Resolver = {
  member(slug: string): number
  plan(slug: string): number
  media(sourcePath: string): number
}
type ParentContent = Pick<TravelMemory, 'title' | 'slug' | 'startDate' | 'endDate' | 'isPrivate'> & Partial<Omit<TravelMemory, 'id' | 'sourceMetadata' | 'createdAt' | 'updatedAt' | 'days'>>
type DayContent = Omit<TravelMemoryDay, 'id' | 'memory' | 'dayIdentity' | 'createdAt' | 'updatedAt' | 'sourceMetadata'>
type AssetContent = Pick<Media, 'sourcePath' | 'type' | 'altText'> & Partial<Pick<Media, 'youtubeUrl' | 'tags' | 'relatedMembers' | 'focalX' | 'focalY'>>

export function projectMemoryV2(source: MemorySourceV2, resolve: MemoryV2Resolver): {
  memory: ParentContent; days: DayContent[]; assets: AssetContent[]
} {
  const { sourceVersion: _version, locale: _locale, days, assets, flights, lodgings, participants, originPlan, coverImage, galleryImages, storySections, reminders, ...parent } = source
  const memory: ParentContent = {
    ...parent, startDate: iso(parent.startDate), endDate: iso(parent.endDate),
    ...(participants ? { participants: participants.map(resolve.member) } : {}),
    ...(originPlan ? { originPlan: resolve.plan(originPlan) } : {}),
    ...(coverImage ? { coverImage: resolve.media(coverImage) } : {}),
    ...(galleryImages ? { galleryImages: galleryImages.map(resolve.media) } : {}),
    ...(reminders ? { reminders: reminders.map(({ items, ...group }) => ({
      ...group,
      ...(items ? { items: items.map(({ entry, ...item }) => ({ ...item,
        id: createHash('sha256').update(`${source.slug}:reminder:${group.category}:${entry}`).digest('hex').slice(0, 24),
      })) } : {}),
    })) } : {}),
    ...(flights || lodgings ? { travelLedger: {
      ...(flights ? { flights: flights.map(item => ({ ...item, ...(item.date ? { date: iso(item.date) } : {}) })) } : {}),
      ...(lodgings ? { lodgings: lodgings.map(item => ({ ...item, ...(item.startDate ? { startDate: iso(item.startDate) } : {}), ...(item.endDate ? { endDate: iso(item.endDate) } : {}) })) } : {}),
    } } : {}),
    ...(storySections ? { storySections: storySections.map(({ mediaItems, ...item }) => ({
      ...item, ...(mediaItems ? { mediaItems: mediaItems.map(resolve.media) } : {}),
    })) } : {}),
  }
  return {
    memory,
    days: (days ?? []).map(({ dailyHeroImage, moments, ...item }) => ({
      ...item, dayKey: `day-${String(item.day).padStart(2, '0')}`,
      ...(item.date ? { date: iso(item.date) } : {}),
      ...(dailyHeroImage ? { dailyHeroImage: resolve.media(dailyHeroImage) } : {}),
      ...(moments ? { moments: moments.map(({ scene, placements, ...moment }) => ({
        ...moment, momentKey: `scene:${createHash('sha256').update(`${source.slug}:${item.day}:${scene}`).digest('hex').slice(0, 24)}`,
        ...(placements ? { placements: placements.map(({ media, ...item }) => ({
          ...item, placementKey: placementIdentity({ ...item, media }), ...(media ? { media: resolve.media(media) } : {}),
        })) } : {}),
      })) } : {}),
    })),
    assets: (assets ?? []).map(({ relatedMembers, ...item }) => ({
      ...item, ...(relatedMembers ? { relatedMembers: relatedMembers.map(resolve.member) } : {}),
    })),
  }
}

function iso(value: string): string { return `${value}T00:00:00.000Z` }
