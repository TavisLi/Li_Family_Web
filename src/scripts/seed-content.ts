import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { z } from 'zod'

const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

const memberSlugByName = new Map([
  ['Tavis Li', 'tavis'],
  ['Lynn Chien', 'lynn'],
  ['允生(中文网页)，Nini（英文网页）', 'nini'],
  ['Leo', 'leo'],
  ['Sophie', 'sophie'],
  ['Grandma', 'grandma'],
])

const memberRoleBySlug = {
  tavis: 'father',
  lynn: 'mother',
  nini: 'daughter',
  leo: 'son',
  sophie: 'daughter',
  grandma: 'grandmother',
} as const

const memberPersonaBySlug = {
  tavis: 'tavis',
  lynn: 'lynn',
  nini: 'academy',
  leo: 'leo',
  sophie: 'academy',
  grandma: 'heritage',
} as const

const memberAssetSlugByDir = new Map([
  ['tavis', 'tavis'],
  ['lynn', 'lynn'],
  ['nini', 'nini'],
  ['leo', 'leo'],
  ['sophie', 'sophie'],
  ['grandma', 'grandma'],
])

const travelSlugByFilename = new Map([
  ['201307海南岛8日.md', '201307-hainan'],
  ['202308东澳全览9日.md', '202308-east-australia'],
  ['202607重庆长江三峡8日.md', '202607-chongqing-yangtze-river'],
])

const travelStatusBySlug = {
  '201307-hainan': 'completed',
  '202308-east-australia': 'completed',
  '202607-chongqing-yangtze-river': 'planning',
} as const

const travelDatesBySlug = {
  '201307-hainan': {
    startDate: '2013-07-01',
    endDate: '2013-07-08',
  },
  '202308-east-australia': {
    startDate: '2023-08-01',
    endDate: '2023-08-09',
  },
  '202607-chongqing-yangtze-river': {
    startDate: '2026-07-01',
    endDate: '2026-07-08',
  },
} as const

const familyMemberSeedSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  familyRole: z.enum(['father', 'mother', 'daughter', 'son', 'grandmother', 'family']),
  profileVisibility: z.enum(['public', 'family']),
  theme: z.object({
    persona: z.enum(['neutral', 'tavis', 'lynn', 'leo', 'academy', 'heritage']),
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
  }),
  status: z.string().optional(),
  typewriter: z
    .object({
      prefix: z.string().optional(),
      rotatingWords: z.array(z.object({ word: z.string().min(1) })),
      suffix: z.string().optional(),
    })
    .optional(),
  bio: z.string().optional(),
  beliefs: z.array(z.object({ text: z.string().min(1) })).optional(),
  interests: z.array(z.object({ name: z.string().min(1), description: z.string().optional() })).optional(),
  education: z
    .array(
      z.object({
        school: z.string().min(1),
        degree: z.string().optional(),
        major: z.string().optional(),
        year: z.string().optional(),
      }),
    )
    .optional(),
  careerTimeline: z
    .array(
      z.object({
        organization: z.string().min(1),
        role: z.string().min(1),
        start: z.string().optional(),
        end: z.string().optional(),
        summary: z.string().optional(),
        highlights: z.array(z.object({ text: z.string().min(1) })).optional(),
      }),
    )
    .optional(),
  skillRadar: z
    .array(
      z.object({
        skill: z.string().min(1),
        score: z.number().min(0).max(100),
        evidence: z.string().optional(),
      }),
    )
    .optional(),
  sourceDocIdentifier: z.string().optional(),
})

const travelSeedSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['planning', 'completed']),
  isPrivate: z.boolean(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  externalDocIdentifier: z.string().min(1),
  summary: z.string().optional(),
  party: z.array(z.object({ name: z.string().min(1), note: z.string().optional() })).optional(),
  flights: z
    .array(
      z.object({
        date: z.string().optional(),
        flightNumber: z.string().min(1),
        route: z.string().min(1),
        passengers: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        terminal: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  railSegments: z
    .array(
      z.object({
        date: z.string().optional(),
        trainNumber: z.string().min(1),
        route: z.string().min(1),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        duration: z.string().optional(),
        fare: z.string().optional(),
      }),
    )
    .optional(),
  lodgings: z
    .array(
      z.object({
        dateRange: z.string().min(1),
        hotel: z.string().min(1),
        city: z.string().optional(),
        address: z.string().optional(),
        highlights: z.string().optional(),
      }),
    )
    .optional(),
  cabinAssignments: z
    .array(
      z.object({
        cabin: z.string().min(1),
        passengers: z.string().min(1),
      }),
    )
    .optional(),
  dailyItinerary: z
    .array(
      z.object({
        day: z.number().min(1),
        date: z.string().optional(),
        title: z.string().min(1),
        theme: z.string().optional(),
        segments: z.array(z.object({ activity: z.string().min(1), time: z.string().optional() })).optional(),
      }),
    )
    .optional(),
  reminders: z
    .array(
      z.object({
        category: z.string().min(1),
        items: z.array(z.object({ text: z.string().min(1) })).optional(),
      }),
    )
    .optional(),
})

const mediaSeedSchema = z.object({
  sourcePath: z.string().min(1),
  absolutePath: z.string().min(1),
  altText: z.string().min(1),
  tags: z.array(z.object({ tag: z.string().min(1) })),
  ownerType: z.enum(['home', 'member', 'travel']),
  ownerSlug: z.string().min(1),
  usage: z.enum(['avatar', 'hero', 'card', 'career', 'gallery', 'cover', 'itinerary']),
  sortOrder: z.number().int().min(0).optional(),
})

const manifestEntrySchema = z.object({
  sourcePath: z.string().min(1),
  ownerType: z.literal('travel'),
  ownerSlug: z.string().min(1),
  usage: z.enum(['cover', 'gallery', 'itinerary']),
  caption: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type FamilyMemberSeed = z.infer<typeof familyMemberSeedSchema>
export type TravelSeed = z.infer<typeof travelSeedSchema>
export type MediaSeed = z.infer<typeof mediaSeedSchema>

export interface SeedContent {
  members: FamilyMemberSeed[]
  travels: TravelSeed[]
  media: MediaSeed[]
}

export async function parseFamilyMembersConfig(filePath: string): Promise<FamilyMemberSeed[]> {
  const markdown = stripBom(await fs.readFile(filePath, 'utf8'))
  const blocks = markdown.match(/\n\d+\.\s+\*\*[\s\S]*?(?=\n\d+\.\s+\*\*|$)/g) ?? []

  return blocks.map((block) => {
    const displayName = getFieldValue(block, '呈现名称') ?? 'Family Member'
    const slug = memberSlugByName.get(displayName) ?? slugify(displayName)
    const typewriter = parseTypewriter(block)
    const interests = parseInterests(block)
    const belief = block.match(/信念「([^」]+)」/)?.[1]

    return familyMemberSeedSchema.parse({
      slug,
      displayName: displayName.replace(/\（英文网页\）|\(中文网页\)/g, ''),
      familyRole: memberRoleBySlug[slug as keyof typeof memberRoleBySlug] ?? 'family',
      profileVisibility: 'public',
      theme: {
        persona: memberPersonaBySlug[slug as keyof typeof memberPersonaBySlug] ?? 'neutral',
      },
      status: getFieldValue(block, '出生与经历') ?? getFieldValue(block, '页面风格'),
      typewriter,
      beliefs: belief ? [{ text: belief }] : undefined,
      interests,
      sourceDocIdentifier:
        slug === 'tavis' || slug === 'lynn' ? `${slug}_resume.md` : undefined,
    })
  })
}

export async function parseResumeMarkdown(filePath: string, slug: string): Promise<FamilyMemberSeed> {
  const markdown = stripBom(await fs.readFile(filePath, 'utf8'))
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug
  const bio = sectionContent(markdown, '專業摘要')
  const skillRadar = parseSkillRadar(sectionContent(markdown, '核心能力'))
  const careerTimeline = parseCareerTimeline(markdown)
  const education = parseEducation(sectionContent(markdown, '教育'))

  return familyMemberSeedSchema.parse({
    slug,
    displayName: slug === 'tavis' ? 'Tavis Li' : title.replace(/^.*?\s+/, ''),
    familyRole: memberRoleBySlug[slug as keyof typeof memberRoleBySlug] ?? 'family',
    profileVisibility: 'public',
    theme: {
      persona: memberPersonaBySlug[slug as keyof typeof memberPersonaBySlug] ?? 'neutral',
    },
    bio,
    education,
    careerTimeline,
    skillRadar,
    sourceDocIdentifier: path.basename(filePath),
  })
}

export async function parseTravelMarkdown(filePath: string): Promise<TravelSeed> {
  const raw = stripBom(await fs.readFile(filePath, 'utf8'))
  const parsed = matter(raw)
  const filename = path.basename(filePath)
  const slug = travelSlugByFilename.get(filename) ?? slugify(filename.replace(/\.md$/, ''))
  const dates = travelDatesBySlug[slug as keyof typeof travelDatesBySlug] ?? {
    startDate: '2026-01-01',
    endDate: '2026-01-01',
  }
  const title =
    typeof parsed.data.title === 'string' && parsed.data.title.trim()
      ? parsed.data.title.trim()
      : firstHeading(parsed.content) ?? filename.replace(/\.md$/, '')

  return travelSeedSchema.parse({
    slug,
    title,
    status: travelStatusBySlug[slug as keyof typeof travelStatusBySlug] ?? 'completed',
    isPrivate: false,
    startDate: dates.startDate,
    endDate: dates.endDate,
    externalDocIdentifier: filename,
    summary: parseSummary(parsed.content),
    party: parseParty(parsed.content),
    flights: parseFlights(parsed.content),
    railSegments: parseRailSegments(parsed.content),
    lodgings: parseLodgings(parsed.content),
    cabinAssignments: parseCabinAssignments(parsed.content),
    dailyItinerary: parseDailyItinerary(parsed.content),
    reminders: parseReminders(parsed.content),
  })
}

export async function buildSeedContent(projectRoot: string): Promise<SeedContent> {
  const [members, tavisResume, lynnResume, travels, media] = await Promise.all([
    parseFamilyMembersConfig(path.join(projectRoot, 'docs/family-members.md')),
    parseResumeMarkdown(path.join(projectRoot, 'content-source/profiles/tavis_resume.md'), 'tavis'),
    parseResumeMarkdown(path.join(projectRoot, 'content-source/profiles/lynn_resume.md'), 'lynn'),
    parseTravelDirectory(path.join(projectRoot, 'content-source/travels')),
    scanMediaAssets(projectRoot),
  ])

  const memberMap = new Map(members.map((member) => [member.slug, member]))
  memberMap.set('tavis', mergeMemberSeeds(memberMap.get('tavis'), tavisResume))
  memberMap.set('lynn', mergeMemberSeeds(memberMap.get('lynn'), lynnResume))

  return {
    members: [...memberMap.values()],
    travels,
    media,
  }
}

async function parseTravelDirectory(directory: string): Promise<TravelSeed[]> {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter((file) => file.endsWith('.md')).sort()

  return Promise.all(markdownFiles.map((file) => parseTravelMarkdown(path.join(directory, file))))
}

async function scanMediaAssets(projectRoot: string): Promise<MediaSeed[]> {
  const assetRoot = path.join(projectRoot, 'content-source/assets')
  const manifest = await readAssetManifest(projectRoot, assetRoot)
  const files = await walkFiles(assetRoot)

  return files
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .map((absolutePath) => {
      const sourcePath = path.relative(projectRoot, absolutePath)
      const segments = sourcePath.split(path.sep)
      const filename = path.basename(absolutePath)
      const manifestEntry = manifest.get(toAssetRelativePath(assetRoot, absolutePath))
      const usage = manifestEntry?.usage ?? mediaUsageFromPath(segments, filename)
      const owner = manifestEntry ?? mediaOwnerFromPath(segments)
      const sortOrder = manifestEntry?.sortOrder

      return mediaSeedSchema.parse({
        sourcePath,
        absolutePath,
        altText: manifestEntry?.caption?.trim() || humanizeFilename(filename),
        tags: [
          { tag: owner.ownerType },
          { tag: owner.ownerSlug },
          { tag: usage },
        ],
        ownerType: owner.ownerType,
        ownerSlug: owner.ownerSlug,
        usage,
        sortOrder,
      })
    })
    .sort(sortMediaSeeds)
}

async function readAssetManifest(
  projectRoot: string,
  assetRoot: string,
): Promise<Map<string, z.infer<typeof manifestEntrySchema>>> {
  const manifestPath = path.join(projectRoot, 'content-source/assets/manifest.json')

  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    const entries = z.array(manifestEntrySchema).parse(JSON.parse(raw))
    const manifest = new Map<string, z.infer<typeof manifestEntrySchema>>()

    for (const entry of entries) {
      const absolutePath = path.join(assetRoot, entry.sourcePath)

      manifest.set(toAssetRelativePath(assetRoot, absolutePath), entry)
    }

    return manifest
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return new Map()
    }

    throw error
  }
}

function toAssetRelativePath(assetRoot: string, absolutePath: string): string {
  return path.relative(assetRoot, absolutePath).split(path.sep).join('/')
}

function sortMediaSeeds(left: MediaSeed, right: MediaSeed): number {
  const owner = ownerKey(left.ownerType, left.ownerSlug).localeCompare(ownerKey(right.ownerType, right.ownerSlug))

  if (owner !== 0) {
    return owner
  }

  const usage = left.usage.localeCompare(right.usage)

  if (usage !== 0) {
    return usage
  }

  return (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.sourcePath.localeCompare(right.sourcePath)
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const entryPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
          return walkFiles(entryPath)
        }

        return [entryPath]
      }),
  )

  return nested.flat()
}

function mediaOwnerFromPath(segments: string[]): Pick<MediaSeed, 'ownerSlug' | 'ownerType'> {
  const assetsIndex = segments.indexOf('assets')
  const first = segments[assetsIndex + 1]
  const second = segments[assetsIndex + 2]

  if (first === 'members' && second) {
    return {
      ownerType: 'member',
      ownerSlug: memberAssetSlugByDir.get(second.toLowerCase()) ?? second.toLowerCase(),
    }
  }

  if (first === 'travels' && second) {
    return {
      ownerType: 'travel',
      ownerSlug: second,
    }
  }

  return {
    ownerType: 'home',
    ownerSlug: 'home',
  }
}

function mediaUsageFromPath(segments: string[], filename: string): MediaSeed['usage'] {
  if (segments.includes('cover')) {
    return 'cover'
  }

  if (segments.includes('itinerary')) {
    return 'itinerary'
  }

  if (segments.includes('gallery')) {
    return 'gallery'
  }

  const lower = filename.toLowerCase()

  if (lower.includes('avatar')) {
    return 'avatar'
  }

  if (lower.includes('hero')) {
    return 'hero'
  }

  if (lower.includes('career')) {
    return 'career'
  }

  if (lower.includes('gallery') || lower.includes('gallary')) {
    return 'gallery'
  }

  if (lower.includes('cover')) {
    return 'cover'
  }

  return 'gallery'
}

function mergeMemberSeeds(base: FamilyMemberSeed | undefined, resume: FamilyMemberSeed): FamilyMemberSeed {
  if (!base) {
    return resume
  }

  return familyMemberSeedSchema.parse({
    ...base,
    bio: resume.bio ?? base.bio,
    education: resume.education ?? base.education,
    careerTimeline: resume.careerTimeline ?? base.careerTimeline,
    skillRadar: resume.skillRadar ?? base.skillRadar,
    sourceDocIdentifier: resume.sourceDocIdentifier ?? base.sourceDocIdentifier,
  })
}

function parseTypewriter(block: string): FamilyMemberSeed['typewriter'] {
  const line = block
    .split('\n')
    .find((item) => item.includes('打字机') || item.includes('打字機'))

  if (!line) {
    return undefined
  }

  const quoted = [...line.matchAll(/「([^」]+)」/g)].map((match) => match[1] ?? '')
  const rotatingWords =
    line
      .match(/\[([^\]]+)\]/)?.[1]
      ?.split(',')
      .map((word) => word.replace(/['‘’]/g, '').trim())
      .filter(Boolean)
      .map((word) => ({ word })) ?? []

  return {
    prefix: quoted[0],
    rotatingWords,
    suffix: quoted[1],
  }
}

function parseInterests(block: string): FamilyMemberSeed['interests'] {
  const line = block.split('\n').find((item) => item.includes('兴趣') || item.includes('爱好'))
  const raw = line?.match(/[（(]([^）)]+)[）)]/)?.[1]

  if (!raw) {
    return undefined
  }

  return raw
    .split(/[、，,]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

function getFieldValue(block: string, field: string): string | undefined {
  return block.match(new RegExp(`\\*\\*${field}\\*\\*：([^\\n]+)`))?.[1]?.trim()
}

function parseSkillRadar(section: string): FamilyMemberSeed['skillRadar'] {
  const weights = [96, 94, 91, 89, 86, 84]

  return section
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .map((line, index) => {
      const match = line.match(/\*\*([^*]+)\*\*：(.+)/)

      return {
        skill: match?.[1]?.trim() ?? line.replace(/^-\s*/, '').trim(),
        score: weights[index] ?? 82,
        evidence: match?.[2]?.trim(),
      }
    })
}

function parseCareerTimeline(markdown: string): FamilyMemberSeed['careerTimeline'] {
  const career = sectionContent(markdown, '職業經歷')

  return career
    .split(/\n(?=###\s+)/)
    .filter((block) => block.trim().startsWith('### '))
    .map((block) => {
      const heading = block.match(/^###\s+(.+?)\s*[—-]\s*(.+)$/m)
      const dateRange = block.match(/>\s+\*\*(.+?)\*\*/)?.[1]?.trim() ?? ''
      const body = block.replace(/^###.+$/m, '').replace(/>\s+\*\*.+?\*\*/, '').trim()
      const organization = heading?.[1]?.trim() ?? 'Unknown Organization'
      const role = heading?.[2]?.trim() ?? 'Unknown Role'
      const [start, end] = dateRange.split('~').map((item) => item.trim())
      const highlights = body
        .split('\n')
        .filter((line) => line.trim().startsWith('- '))
        .slice(0, 6)
        .map((line) => ({ text: line.replace(/^-\s*/, '').trim() }))

      return {
        organization,
        role,
        start,
        end,
        summary: firstParagraph(body),
        highlights,
      }
    })
}

function parseEducation(section: string): FamilyMemberSeed['education'] {
  return markdownTableRows(section)
    .map((cells) => ({
      degree: cells[0],
      school: cells[1] ?? '',
      major: cells[2],
      year: cells[3],
    }))
    .filter((item) => item.school)
}

function parseSummary(markdown: string): string | undefined {
  return markdown
    .split('\n')
    .find((line) => line.includes('行程概覽') || line.includes('呈現名稱') || line.includes('核心內容'))
    ?.replace(/^-\s*\*\*[^*]+\*\*：/, '')
    .trim()
}

function parseParty(markdown: string): TravelSeed['party'] {
  const line = markdown.split('\n').find((item) => item.includes('出行人'))
  const names = line?.match(/：(.+?)（/)?.[1]

  return names
    ?.split('、')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

function parseFlights(markdown: string): NonNullable<TravelSeed['flights']> {
  const section = sectionAfterHeading(markdown, '航班信息')

  return markdownTableRows(section)
    .filter((cells) => cells.some((cell) => /[A-Z]{1,3}\d{2,4}/.test(cell)) || cells[1]?.includes('中華航空'))
    .map((cells) => {
      const flightNumber = cells.find((cell) => /[A-Z]{1,3}\d{2,4}/.test(cell)) ?? cells[1] ?? '航班'
      const isLongFormat = cells.length >= 9

      return {
        date: cells[0],
        airline: isLongFormat ? cells[2] : undefined,
        flightNumber,
        route: isLongFormat ? `${cells[4] ?? ''}→${cells[6] ?? ''}` : cells[2] ?? `${cells[2] ?? ''}→${cells[3] ?? ''}`,
        passengers: isLongFormat ? undefined : cells[3],
        departureTime: isLongFormat ? cells[5] : cells[4],
        arrivalTime: isLongFormat ? cells[7] : cells[5],
        terminal: isLongFormat ? undefined : cells[6],
        notes: isLongFormat ? cells[8] : cells[7],
      }
    })
}

function parseRailSegments(markdown: string): TravelSeed['railSegments'] {
  const section = sectionAfterHeading(markdown, '返程高鐵')

  return markdownTableRows(section)
    .filter((cells) => cells.length >= 6 && /[DG]\d+/.test(cells[1] ?? ''))
    .map((cells) => ({
      date: cells[0],
      trainNumber: cells[1] ?? '',
      route: cells[2] ?? '',
      departureTime: cells[3],
      arrivalTime: cells[4],
      duration: cells[5],
      fare: cells[6],
    }))
}

function parseLodgings(markdown: string): TravelSeed['lodgings'] {
  const section = sectionAfterHeading(markdown, '住宿安排')

  return markdownTableRows(section)
    .filter((cells) => cells.length >= 3 && Boolean(cells[0]) && Boolean(cells[1]))
    .map((cells) => ({
      dateRange: cells[0] ?? '',
      hotel: cells[1] ?? '',
      address: cells[2],
      highlights: cells[3],
    }))
}

function parseCabinAssignments(markdown: string): TravelSeed['cabinAssignments'] {
  const section = sectionAfterHeading(markdown, '游輪艙房分配')

  return markdownTableRows(section)
    .filter((cells) => cells.length >= 2 && cells[0] !== '艙房')
    .map((cells) => ({
      cabin: cells[0] ?? '',
      passengers: cells[1] ?? '',
    }))
}

function parseDailyItinerary(markdown: string): NonNullable<TravelSeed['dailyItinerary']> {
  const matches = [
    ...markdown.matchAll(/##\s+\**(?:[^\n]*?)Day\s+(\d+)\s*[·．.-]\s*([^\n*]+)\**([\s\S]*?)(?=\n##\s+\**(?:[^\n]*?)Day\s+\d+|$)/gi),
  ]

  return matches.map((match) => ({
    day: Number(match[1]),
    title: cleanMarkdown(match[2] ?? '').trim(),
    segments: (match[3] ?? '')
      .split('\n')
      .filter((line) => line.trim().startsWith('- '))
      .slice(0, 8)
      .map((line) => ({ activity: cleanMarkdown(line.replace(/^-\s*/, '').trim()) })),
  }))
}

function parseReminders(markdown: string): TravelSeed['reminders'] {
  const lines = markdown
    .split('\n')
    .filter((line) => /提示|提醒|注意|⚠️/.test(line))
    .slice(0, 10)

  return lines.length
    ? [
        {
          category: '旅行提醒',
          items: lines.map((line) => ({ text: cleanMarkdown(line.replace(/^>\s*/, '').trim()) })),
        },
      ]
    : undefined
}

function sectionContent(markdown: string, heading: string): string {
  const pattern = new RegExp(`##\\s+${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n---\\n\\n##(?!#)|\\n##(?!#)\\s+|$)`)

  return markdown.match(pattern)?.[1]?.trim() ?? ''
}

function sectionAfterHeading(markdown: string, heading: string): string {
  const escaped = escapeRegExp(heading)
  const pattern = new RegExp(`#{1,3}\\s+\\**[^\\n]*${escaped}[^\\n]*\\**\\n([\\s\\S]*?)(?=\\n#{1,3}\\s+|$)`)

  return markdown.match(pattern)?.[1]?.trim() ?? ''
}

function markdownTableRows(markdown: string): string[][] {
  return markdown
    .split('\n')
    .filter((line) => line.trim().startsWith('|') && !/^\|\s*-/.test(line.trim()))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cleanMarkdown(cell.trim())),
    )
    .filter((cells) => cells.some(Boolean))
}

function firstHeading(markdown: string): string | undefined {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
}

function firstParagraph(markdown: string): string | undefined {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => cleanMarkdown(paragraph.trim()))
    .find((paragraph) => paragraph && !paragraph.startsWith('- '))
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/\*\*/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function humanizeFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function ownerKey(ownerType: MediaSeed['ownerType'], ownerSlug: string): string {
  return `${ownerType}:${ownerSlug}`
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
