import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'

import matter from 'gray-matter'
import { z } from 'zod'

const execFileAsync = promisify(execFile)
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])
const bloggerTakeoutRelativePath = 'content-source/blogger/takeout-20260614T010941Z-3-001.zip'
const bloggerSampleFeedRelativePath = 'content-source/blogger/sample-feed.atom'

const memberSlugByName = new Map([
  ['Tavis Li', 'tavis'],
  ['Lynn Chien', 'lynn'],
  ['允生(中文网页)，Nini（英文网页）', 'nini'],
  ['允生(中文網頁)，Nini（英文網頁）', 'nini'],
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
  ['201307海南島8日.md', '201307-hainan'],
  ['202308东澳全览9日.md', '202308-east-australia'],
  ['202308東澳全覽9日.md', '202308-east-australia'],
  ['202602泰国普吉岛8日.md', '202602-thailand-phuket'],
  ['202602泰國普吉島8日.md', '202602-thailand-phuket'],
  ['202607重庆长江三峡8日.md', '202607-chongqing-yangtze-river'],
  ['202607重慶長江三峽8日.md', '202607-chongqing-yangtze-river'],
  ['202702泰国普吉岛7日.md', '202702-thailand-phuket'],
  ['202702泰國普吉島7日.md', '202702-thailand-phuket'],
])

const travelStatusBySlug = {
  '201307-hainan': 'completed',
  '202308-east-australia': 'completed',
  '202602-thailand-phuket': 'completed',
  '202607-chongqing-yangtze-river': 'planning',
  '202702-thailand-phuket': 'planning',
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
  '202602-thailand-phuket': {
    startDate: '2026-02-10',
    endDate: '2026-02-17',
  },
  '202607-chongqing-yangtze-river': {
    startDate: '2026-07-01',
    endDate: '2026-07-08',
  },
  '202702-thailand-phuket': {
    startDate: '2027-02-02',
    endDate: '2027-02-08',
  },
} as const

const localizedDisplayNameSchema = z.object({
  'zh-TW': z.string().min(1),
  en: z.string().min(1),
})

const familyMemberSeedSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  displayNameLocales: localizedDisplayNameSchema.optional(),
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
  publicContact: z
    .object({
      siteTitle: z.string().optional(),
      description: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
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
        milestoneMedia: z.array(z.number()).optional(),
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
        roomType: z.string().optional(),
        bookingChannel: z.string().optional(),
        price: z.string().optional(),
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
        segments: z
          .array(
            z.object({
              activity: z.string().min(1),
              time: z.string().optional(),
              transport: z.string().optional(),
              notes: z.string().optional(),
            }),
          )
          .optional(),
        meals: z
          .object({
            breakfast: z.string().optional(),
            lunch: z.string().optional(),
            dinner: z.string().optional(),
          })
          .optional(),
        lodging: z.string().optional(),
      }),
    )
    .optional(),
  foodRecommendations: z
    .array(
      z.object({
        category: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        suitableFor: z.string().optional(),
      }),
    )
    .optional(),
  costItems: z
    .array(
      z.object({
        category: z.string().min(1),
        item: z.string().min(1),
        unitPrice: z.string().optional(),
        quantity: z.string().optional(),
        subtotal: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  optionalActivities: z
    .array(
      z.object({
        city: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string().optional(),
        riskLevel: z.string().optional(),
        notes: z.string().optional(),
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
  sourceSections: z
    .array(
      z.object({
        level: z.number().int().min(1).max(3),
        title: z.string().min(1),
        anchor: z.string().min(1),
        displayDay: z.string().optional(),
        displayDate: z.string().optional(),
        displaySubtitle: z.string().optional(),
        body: z.string().min(1),
        links: z
          .array(
            z.object({
              label: z.string().min(1),
              url: z.string().url(),
            }),
          )
          .optional(),
        enableComments: z.boolean().optional(),
        enableThumbsUp: z.boolean().optional(),
        enableThumbsDown: z.boolean().optional(),
      }),
    )
    .optional(),
  externalVideos: z
    .array(
      z.object({
        title: z.string().min(1),
        youtubeUrl: z.string().url(),
      }),
    )
    .optional(),
})

const mediaSeedSchema = z.object({
  sourcePath: z.string().min(1),
  absolutePath: z.string().min(1),
  altText: z.string().min(1),
  caption: z.string().optional(),
  tags: z.array(z.object({ tag: z.string().min(1) })),
  ownerType: z.enum(['home', 'member', 'travel']),
  ownerSlug: z.string().min(1),
  usage: z.enum(['avatar', 'hero', 'card', 'career', 'gallery', 'cover', 'itinerary']),
  sortOrder: z.number().int().min(0).optional(),
  day: z.number().int().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
})

const blogCategorySeedSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
})

const lexicalTextNodeSchema = z.object({
  type: z.literal('text'),
  version: z.number(),
  text: z.string(),
  detail: z.number(),
  format: z.number(),
  mode: z.literal('normal'),
  style: z.string(),
})

const lexicalLinkNodeSchema = z.object({
  type: z.literal('link'),
  version: z.number(),
  fields: z.object({
    linkType: z.literal('custom'),
    newTab: z.boolean(),
    url: z.string(),
  }),
  format: z.string(),
  indent: z.number(),
  direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
  children: z.array(lexicalTextNodeSchema),
})

const lexicalParagraphNodeSchema = z.object({
  type: z.literal('paragraph'),
  version: z.number(),
  format: z.string(),
  indent: z.number(),
  direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
  children: z.array(z.union([lexicalTextNodeSchema, lexicalLinkNodeSchema])),
})

const lexicalContentSchema = z.object({
  root: z.object({
    type: z.literal('root'),
    version: z.number(),
    format: z.literal(''),
    indent: z.number(),
    direction: z.union([z.literal('ltr'), z.literal('rtl')]).nullable(),
    children: z.array(lexicalParagraphNodeSchema),
  }),
})

const blogPostSeedSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  authorSlug: z.literal('tavis'),
  categorySlugs: z.array(z.string().min(1)),
  tags: z.array(z.string().min(1)),
  isPrivate: z.boolean(),
  publishedDate: z.string().min(1),
  updatedDate: z.string().optional(),
  coverImageSourceUrl: z.string().optional(),
  originalUrl: z.string().optional(),
  source: z.enum(['blogger-takeout', 'phase-5-seed']),
  content: lexicalContentSchema,
})

const manifestEntrySchema = z.object({
  sourcePath: z.string().min(1),
  ownerType: z.literal('travel'),
  ownerSlug: z.string().min(1),
  usage: z.enum(['cover', 'gallery', 'itinerary']),
  caption: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  day: z.number().int().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
})

export type FamilyMemberSeed = z.infer<typeof familyMemberSeedSchema>
export type TravelSeed = z.infer<typeof travelSeedSchema>
export type MediaSeed = z.infer<typeof mediaSeedSchema>
export type BlogCategorySeed = z.infer<typeof blogCategorySeedSchema>
export type BlogPostSeed = z.infer<typeof blogPostSeedSchema>

const SOURCE_SECTION_BOUNDARY_BODY = '__SECTION_BOUNDARY__'
const REMINDER_SOURCE_SECTION_INTRO =
  '提醒、取消政策與待確認項目集中放在這裡，讓出發前需要注意的事情一眼可查。'
export type LexicalContentSeed = z.infer<typeof lexicalContentSchema>

export type TravelCatalogEntry = {
  slug: string
  title: string
  status: 'planning' | 'completed'
  sourceFile: string
}

export interface SeedContent {
  members: FamilyMemberSeed[]
  travels: TravelSeed[]
  media: MediaSeed[]
  blogCategories: BlogCategorySeed[]
  blogPosts: BlogPostSeed[]
}

export interface BloggerTakeoutSeed {
  categories: BlogCategorySeed[]
  posts: BlogPostSeed[]
}

export async function parseFamilyMembersConfig(filePath: string): Promise<FamilyMemberSeed[]> {
  const markdown = stripBom(await fs.readFile(filePath, 'utf8'))
  const blocks = markdown.match(/\n\d+\.\s+\*\*[\s\S]*?(?=\n\d+\.\s+\*\*|$)/g) ?? []

  return blocks.map((block) => {
    const configuredDisplayName =
      getFieldValue(block, ['呈现名称', '呈現名稱', '呈現名稱(中文網頁/英文網頁)']) ??
      'Family Member'
    const [chineseDisplayName, englishDisplayName] = configuredDisplayName
      .split('/')
      .map((value) => value.trim())
    const displayName = englishDisplayName || chineseDisplayName || configuredDisplayName
    const slug = memberSlugByName.get(displayName) ?? slugify(displayName)
    const typewriter = parseTypewriter(block)
    const interests = parseInterests(block)
    const belief = block.match(/信念「([^」]+)」/)?.[1]

    return familyMemberSeedSchema.parse({
      slug,
      displayName: chineseDisplayName || displayName,
      displayNameLocales:
        chineseDisplayName && englishDisplayName
          ? {
              'zh-TW': chineseDisplayName,
              en: englishDisplayName,
            }
          : undefined,
      familyRole: memberRoleBySlug[slug as keyof typeof memberRoleBySlug] ?? 'family',
      profileVisibility: 'public',
      theme: {
        persona: memberPersonaBySlug[slug as keyof typeof memberPersonaBySlug] ?? 'neutral',
      },
      status:
        getFieldValue(block, ['出生与经历', '出生與經歷']) ??
        getFieldValue(block, ['页面风格', '頁面風格']),
      typewriter,
      beliefs: belief ? [{ text: belief }] : undefined,
      interests,
      sourceDocIdentifier:
        slug === 'tavis' || slug === 'lynn' ? `${slug}_resume.md` : undefined,
    })
  })
}

export async function parseTravelCatalog(
  filePath: string,
  travelDirectory: string,
): Promise<TravelCatalogEntry[]> {
  const markdown = stripBom(await fs.readFile(filePath, 'utf8'))
  const entries: TravelCatalogEntry[] = []
  let status: TravelCatalogEntry['status'] | undefined
  let current: Partial<TravelCatalogEntry> | undefined

  const finishCurrent = () => {
    if (!current) {
      return
    }

    if (!status || !current.slug || !current.title || !current.sourceFile) {
      throw new Error(`Incomplete travel catalog entry: ${JSON.stringify(current)}`)
    }

    entries.push({
      slug: current.slug,
      title: current.title,
      status,
      sourceFile: current.sourceFile,
    })
    current = undefined
  }

  for (const line of markdown.split('\n')) {
    if (line.includes('規劃中的旅遊項目')) {
      finishCurrent()
      status = 'planning'
      continue
    }

    if (line.includes('已完成的旅遊項目信息')) {
      finishCurrent()
      status = 'completed'
      continue
    }

    if (/^\d+\.\s+\*\*.+\*\*/.test(line)) {
      finishCurrent()
      current = {}
      continue
    }

    if (!current) {
      continue
    }

    const title = getFieldValue(line, ['呈現名稱'])
    const slug = getFieldValue(line, ['Canonical slug'])
    const sourceFile = line.includes('數據源') ? line.match(/`([^`]+\.md)`/)?.[1] : undefined

    if (title) {
      current.title = title
    }
    if (slug) {
      current.slug = slug
    }
    if (sourceFile) {
      current.sourceFile = sourceFile
    }
  }

  finishCurrent()

  const sourceFiles = new Set<string>()
  const slugs = new Set<string>()

  for (const entry of entries) {
    if (sourceFiles.has(entry.sourceFile) || slugs.has(entry.slug)) {
      throw new Error(`Duplicate travel catalog mapping: ${entry.slug} / ${entry.sourceFile}`)
    }

    await fs.access(path.join(travelDirectory, entry.sourceFile))
    sourceFiles.add(entry.sourceFile)
    slugs.add(entry.slug)
  }

  return entries
}

export async function parseResumeMarkdown(filePath: string, slug: string): Promise<FamilyMemberSeed> {
  const markdown = stripBom(await fs.readFile(filePath, 'utf8'))
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug
  const bio = firstAvailableSection(markdown, ['專業摘要', '基本資料'])
  const skillRadar = parseSkillRadar(firstAvailableSection(markdown, ['核心能力', '專業']))
  const careerTimeline = parseCareerTimeline(markdown)
  const education = parseEducation(firstAvailableSection(markdown, ['教育']))

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

export async function parseTravelMarkdown(
  filePath: string,
  catalogEntry?: TravelCatalogEntry,
): Promise<TravelSeed> {
  const raw = stripBom(await fs.readFile(filePath, 'utf8'))
  const parsed = matter(raw)
  const filename = path.basename(filePath)
  const slug = catalogEntry?.slug ?? travelSlugByFilename.get(filename) ?? slugify(filename.replace(/\.md$/, ''))
  const dates = travelDatesBySlug[slug as keyof typeof travelDatesBySlug] ?? {
    startDate: '2026-01-01',
    endDate: '2026-01-01',
  }
  const markdownTitle =
    typeof parsed.data.title === 'string' && parsed.data.title.trim()
      ? parsed.data.title.trim()
      : firstHeading(parsed.content) ?? filename.replace(/\.md$/, '')

  return travelSeedSchema.parse({
    slug,
    title: catalogEntry?.title ?? markdownTitle,
    status: catalogEntry?.status ?? travelStatusBySlug[slug as keyof typeof travelStatusBySlug] ?? 'completed',
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
    foodRecommendations: parseFoodRecommendations(parsed.content),
    costItems: parseCostItems(parsed.content),
    optionalActivities: parseOptionalActivities(parsed.content),
    reminders: parseReminders(parsed.content),
    sourceSections: parseSourceSections(parsed.content),
    externalVideos: parseExternalVideos(parsed.content),
  })
}

export async function buildSeedContent(projectRoot: string): Promise<SeedContent> {
  const [members, tavisResume, lynnResume, catalog, media, bloggerSample] = await Promise.all([
    parseFamilyMembersConfig(path.join(projectRoot, 'docs/family-members.md')),
    parseResumeMarkdown(path.join(projectRoot, 'content-source/profiles/tavis_resume.md'), 'tavis'),
    parseResumeMarkdown(path.join(projectRoot, 'content-source/profiles/lynn_resume.md'), 'lynn'),
    parseTravelCatalog(
      path.join(projectRoot, 'docs/travel-projects.md'),
      path.join(projectRoot, 'content-source/travels'),
    ),
    scanMediaAssets(projectRoot),
    parseBloggerSeedSource(projectRoot, { limit: 8 }),
  ])
  const travels = await parseTravelDirectory(path.join(projectRoot, 'content-source/travels'), catalog)

  const memberMap = new Map(members.map((member) => [member.slug, member]))
  memberMap.set('tavis', mergeMemberSeeds(memberMap.get('tavis'), tavisResume))
  memberMap.set('lynn', mergeMemberSeeds(memberMap.get('lynn'), lynnResume))

  return {
    blogCategories: mergeBlogCategories(bloggerSample.categories, phase5BlogCategories()),
    blogPosts: [...bloggerSample.posts, ...phase5BlogPosts()],
    members: [...memberMap.values()],
    travels,
    media,
  }
}

export async function parseBloggerTakeoutArchive(
  archivePath: string,
  options: {
    limit?: number
  } = {},
): Promise<BloggerTakeoutSeed> {
  await assertBloggerFeedExists(archivePath)
  const { stdout } = await execFileAsync('unzip', ['-p', archivePath, 'Takeout/Blogger/Blogs/*/feed.atom'], {
    maxBuffer: 12 * 1024 * 1024,
  })

  return parseBloggerFeedXml(stdout, options)
}

export async function parseBloggerSeedSource(
  projectRoot: string,
  options: {
    limit?: number
  } = {},
): Promise<BloggerTakeoutSeed> {
  const archivePath = path.join(projectRoot, bloggerTakeoutRelativePath)

  try {
    await fs.access(archivePath)
    return parseBloggerTakeoutArchive(archivePath, options)
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  const sampleFeedPath = path.join(projectRoot, bloggerSampleFeedRelativePath)
  const sampleFeed = await fs.readFile(sampleFeedPath, 'utf8')

  return parseBloggerFeedXml(sampleFeed, options)
}

export function parseBloggerFeedXml(
  xml: string,
  options: {
    limit?: number
  } = {},
): BloggerTakeoutSeed {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1] ?? '')
  const posts: BlogPostSeed[] = []
  const categoryMap = new Map<string, BlogCategorySeed>()
  const usedSlugs = new Set<string>()

  for (const entry of entries) {
    if (tagValue(entry, 'blogger:type') !== 'POST' || tagValue(entry, 'blogger:status') !== 'LIVE') {
      continue
    }

    const title = tagValue(entry, 'title') || 'Untitled Blog Post'
    const filename = tagValue(entry, 'blogger:filename')
    const originalUrl = filename ? `https://skywalkertw.blogspot.com${filename}` : undefined
    const labels = categoryTerms(entry)
    const categorySlugs = labels.map((label) => {
      const category = blogCategorySeedSchema.parse({
        title: label,
        slug: slugify(label),
        description: `Imported Blogger label: ${label}`,
      })
      categoryMap.set(category.slug, category)

      return category.slug
    })
    const html = tagValue(entry, 'content')
    const publishedDate = tagValue(entry, 'published') || tagValue(entry, 'blogger:created') || new Date().toISOString()
    const updatedDate = tagValue(entry, 'updated')
    const baseSlug = filename ? filename.replace(/^\//, '').replace(/\.html$/, '') : title
    const slug = uniqueSlug(slugify(baseSlug), usedSlugs)
    const coverImageSourceUrl = firstImageUrl(html)

    posts.push(blogPostSeedSchema.parse({
      title,
      slug,
      authorSlug: 'tavis',
      categorySlugs,
      tags: labels,
      isPrivate: false,
      publishedDate,
      updatedDate,
      coverImageSourceUrl,
      originalUrl,
      source: 'blogger-takeout',
      content: htmlToLexicalContent(html, {
        originalUrl,
        updatedDate,
      }),
    }))

    if (options.limit && posts.length >= options.limit) {
      break
    }
  }

  return {
    categories: [...categoryMap.values()].sort((left, right) => left.slug.localeCompare(right.slug)),
    posts,
  }
}

async function parseTravelDirectory(
  directory: string,
  catalog: TravelCatalogEntry[],
): Promise<TravelSeed[]> {
  const files = await fs.readdir(directory)
  const markdownFiles = files.filter((file) => file.endsWith('.md')).sort()
  const catalogBySourceFile = new Map(catalog.map((entry) => [entry.sourceFile, entry]))

  if (markdownFiles.length !== catalogBySourceFile.size) {
    throw new Error('Travel catalog and Markdown source count do not match')
  }

  return Promise.all(
    markdownFiles.map((file) => {
      const catalogEntry = catalogBySourceFile.get(file)

      if (!catalogEntry) {
        throw new Error(`Travel Markdown is missing from catalog: ${file}`)
      }

      return parseTravelMarkdown(path.join(directory, file), catalogEntry)
    }),
  )
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
        caption: manifestEntry?.caption,
        tags: [
          { tag: owner.ownerType },
          { tag: owner.ownerSlug },
          { tag: usage },
          ...manifestMetadataTags(manifestEntry),
        ],
        ownerType: owner.ownerType,
        ownerSlug: owner.ownerSlug,
        usage,
        sortOrder,
        day: manifestEntry?.day,
        sectionId: manifestEntry?.sectionId,
        time: manifestEntry?.time,
        location: manifestEntry?.location,
      })
    })
    .sort(sortMediaSeeds)
}

async function readAssetManifest(
  projectRoot: string,
  assetRoot: string,
): Promise<Map<string, z.infer<typeof manifestEntrySchema>>> {
  const globalManifestPath = path.join(projectRoot, 'content-source/assets/manifest.json')
  const manifests = new Map<string, z.infer<typeof manifestEntrySchema>>()
  const addEntries = (entries: z.infer<typeof manifestEntrySchema>[]) => {
    for (const entry of entries) {
      const absolutePath = path.join(assetRoot, entry.sourcePath)

      manifests.set(toAssetRelativePath(assetRoot, absolutePath), entry)
    }
  }

  addEntries(await readManifestEntries(globalManifestPath))

  const travelAssetRoot = path.join(assetRoot, 'travels')
  try {
    const travelDirs = await fs.readdir(travelAssetRoot, { withFileTypes: true })
    const localManifestPaths = travelDirs
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(travelAssetRoot, entry.name, 'manifest.json'))
      .sort((left, right) => left.localeCompare(right))

    for (const manifestPath of localManifestPaths) {
      addEntries(await readManifestEntries(manifestPath))
    }
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw error
    }
  }

  return manifests
}

async function readManifestEntries(
  manifestPath: string,
): Promise<z.infer<typeof manifestEntrySchema>[]> {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8')

    return z.array(manifestEntrySchema).parse(JSON.parse(raw))
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return []
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

function manifestMetadataTags(
  manifestEntry: z.infer<typeof manifestEntrySchema> | undefined,
): { tag: string }[] {
  if (!manifestEntry) {
    return []
  }

  return [
    manifestEntry.day ? `day-${String(manifestEntry.day).padStart(2, '0')}` : undefined,
    manifestEntry.sectionId ? `section:${manifestEntry.sectionId}` : undefined,
    manifestEntry.location ? `location:${slugify(manifestEntry.location)}` : undefined,
  ]
    .filter((tag): tag is string => Boolean(tag))
    .map((tag) => ({ tag }))
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
    publicContact: resume.publicContact ?? base.publicContact,
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
  const explicitLine = block
    .split('\n')
    .find((item) => item.includes('愛好/組件') || item.includes('爱好/组件'))
  const fallbackLine = block
    .split('\n')
    .find((item) => ['兴趣嗜好', '興趣嗜好'].some((label) => item.includes(label)))
  const raw = explicitLine
    ? explicitLine
        .replace(/^.*?：/, '')
        .split(/[（(]/)[0]
        ?.trim()
    : fallbackLine?.match(/[（(]([^）)]+)[）)]/)?.[1]

  if (!raw) {
    return undefined
  }

  return raw
    .split(/[、，,]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

function getFieldValue(block: string, fields: string | string[]): string | undefined {
  const candidates = Array.isArray(fields) ? fields : [fields]

  return candidates
    .map((field) =>
      block.match(new RegExp(`\\*\\*${escapeRegExp(field)}\\*\\*：([^\\n]+)`))?.[1]?.trim(),
    )
    .find((value): value is string => Boolean(value))
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
  const career = firstAvailableSection(markdown, ['職業經歷', '經歷'])

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
  const rows = markdownTableRows(section)
  const headers = rows[0] ?? []
  const dataRows = rows.slice(1)

  return dataRows
    .map((cells) => ({
      degree: cellByHeader(headers, cells, ['學位']) ?? undefined,
      school: cellByHeader(headers, cells, ['學校']) ?? '',
      major: cellByHeader(headers, cells, ['專業', '備注']) ?? undefined,
      year: cellByHeader(headers, cells, ['年份', '畢業年份']) ?? undefined,
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
    .filter((cells) => isFlightRow(cells))
    .map((cells) => {
      const flightIndex = cells.findIndex((cell) => /[A-Z]{1,3}\d{2,4}/.test(cell) || cell === 'TBD')
      const flightNumber = flightIndex >= 0 ? cells[flightIndex] ?? '航班' : cells[1] ?? '航班'
      const route = cells.find((cell) => cell.includes('→'))
      const timeRange = cells.find((cell) => /\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/.test(cell))
      const [departureTime, arrivalTime] = timeRange?.split(/\s*[–-]\s*/).map((time) => time.trim()) ?? []
      const isHainanFormat = flightIndex < 0 && cells[1]?.includes('中華航空')

      return {
        date: cells[0],
        airline: isHainanFormat ? cells[1] : flightNumber.match(/\(([^)]+)\)/)?.[1],
        flightNumber,
        route: route ?? (isHainanFormat ? `${cells[2] ?? ''}→${cells[3] ?? ''}` : cells[2] ?? ''),
        passengers: flightIndex === 2 ? cells[0] : undefined,
        departureTime,
        arrivalTime,
        notes: cells.at(-1),
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
  const rows = markdownTableRows(section)
  const headers = rows[0] ?? []

  return rows
    .slice(1)
    .filter((cells) => cells.length >= 3 && Boolean(cells[0]) && Boolean(cells[1]))
    .map((cells) => ({
      dateRange: cells[0] ?? '',
      city: cellByHeader(headers, cells, ['城市']),
      hotel: cellByHeader(headers, cells, ['酒店']) ?? cells[1] ?? '',
      address: cellByHeader(headers, cells, ['地址']),
      roomType: cellByHeader(headers, cells, ['房型']),
      bookingChannel: cellByHeader(headers, cells, ['預訂管道']),
      price: cellByHeader(headers, cells, ['價格']),
      highlights: cellByHeader(headers, cells, ['核心亮點', '備注', '確認號']) ?? cells.at(-1),
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

function parseExternalVideos(markdown: string): TravelSeed['externalVideos'] {
  const section = sectionAfterHeading(markdown, '外部影片')

  return section
    .split('\n')
    .flatMap((line) => {
      const match = line.match(/^\s*(.*?)\s*\[([^\]]+)\]\s*$/)

      if (!match || !isYouTubeUrl(match[2] ?? '')) {
        return []
      }

      return [{
        title: cleanMarkdown(match[1] ?? '') || 'YouTube 旅行影片',
        youtubeUrl: match[2] ?? '',
      }]
    })
}

function parseDailyItinerary(markdown: string): NonNullable<TravelSeed['dailyItinerary']> {
  const matches = [
    ...markdown.matchAll(/##\s+\**(?:[^\n]*?)Day\s+(\d+)\s*[·．.-]\s*([^\n*]+)\**([\s\S]*?)(?=\n##\s+\**(?:[^\n]*?)Day\s+\d+|$)/gi),
  ]

  return matches.map((match) => {
    const content = match[3] ?? ''

    return {
      day: Number(match[1]),
      title: cleanMarkdown(match[2] ?? '').trim(),
      segments: parseDailySegments(content),
      meals: parseDailyMeals(content),
      lodging: parseDailyLodging(content),
    }
  })
}

function parseDailySegments(
  content: string,
): NonNullable<NonNullable<TravelSeed['dailyItinerary']>[number]['segments']> {
  const tableRows = markdownTableRows(content)
  const header = tableRows[0] ?? []
  const hasItineraryTable = header.some((cell) => cell.includes('時間')) && header.some((cell) => cell.includes('安排'))

  if (hasItineraryTable) {
    return tableRows
      .slice(1)
      .filter((cells) => Boolean(cells[1]))
      .slice(0, 12)
      .map((cells) => ({
        time: cells[0],
        activity: cells[1] ?? '',
        transport: cells[2],
        notes: cells[3],
      }))
  }

  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .slice(0, 12)
    .map((line) => ({ activity: cleanMarkdown(line.replace(/^\s*-\s*/, '').trim()) }))
}

function parseDailyMeals(
  content: string,
): NonNullable<NonNullable<TravelSeed['dailyItinerary']>[number]['meals']> | undefined {
  const fields = {
    breakfast: mealValue(content, '早餐'),
    lunch: mealValue(content, '午餐'),
    dinner: mealValue(content, '晚餐'),
  }

  return Object.values(fields).some(Boolean) ? fields : undefined
}

function parseDailyLodging(content: string): string | undefined {
  return mealValue(content, '住宿')
}

function mealValue(content: string, label: string): string | undefined {
  return content
    .split('\n')
    .find((line) => new RegExp(`^\\s*-\\s*\\*\\*${escapeRegExp(label)}\\*\\*：`).test(line))
    ?.replace(new RegExp(`^\\s*-\\s*\\*\\*${escapeRegExp(label)}\\*\\*：`), '')
    .trim()
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

function parseFoodRecommendations(markdown: string): TravelSeed['foodRecommendations'] {
  const section = sectionAfterHeading(markdown, '美食推薦匯總')

  return markdownTableRows(section)
    .filter((cells) => cells.length >= 3 && !['類型', '項目'].includes(cells[0] ?? ''))
    .map((cells) => ({
      category: cells[0],
      name: cells[1] ?? '',
      description: cells[2],
      suitableFor: cells[3],
    }))
    .filter((item) => item.name)
}

function parseCostItems(markdown: string): TravelSeed['costItems'] {
  const section = sectionAfterHeading(markdown, '費用匯總')

  return markdownTableRows(section)
    .filter((cells) => cells.length >= 2 && !['項目', '類型'].includes(cells[0] ?? ''))
    .map((cells) => ({
      category: '費用',
      item: cells[0] ?? '',
      unitPrice: cells[1],
      quantity: cells[2],
      subtotal: cells[3] ?? cells[1],
      notes: cells[4],
    }))
    .filter((item) => item.item && !item.item.includes('小計'))
}

function parseOptionalActivities(markdown: string): TravelSeed['optionalActivities'] {
  const options = new Map<string, NonNullable<TravelSeed['optionalActivities']>[number]>()
  const addOption = (name: string, details: Partial<NonNullable<TravelSeed['optionalActivities']>[number]> = {}) => {
    const cleanName = cleanMarkdown(name)

    if (!cleanName || options.has(cleanName)) {
      return
    }

    options.set(cleanName, {
      name: cleanName,
      ...details,
    })
  }

  for (const day of parseDailyItinerary(markdown)) {
    for (const segment of day.segments ?? []) {
      const text = [segment.activity, segment.notes].filter(Boolean).join(' · ')

      if (/選項|可選|自費/.test(text)) {
        addOption(text, {
          description: `Day ${day.day}：${text}`,
          notes: segment.transport,
        })
      }
    }
  }

  for (const item of parseCostItems(markdown) ?? []) {
    if (/自費|演出|白帝城|升船機|索道|扶梯/.test(item.item)) {
      addOption(item.item, {
        price: [item.unitPrice, item.subtotal].filter(Boolean).join(' · '),
        notes: item.notes,
      })
    }
  }

  return [...options.values()]
}

function parseSourceSections(markdown: string): NonNullable<TravelSeed['sourceSections']> {
  const lines = markdown.split('\n')
  const sections: NonNullable<TravelSeed['sourceSections']> = []
  let current:
    | {
        level: number
        title: string
        bodyLines: string[]
      }
    | undefined

  const flush = () => {
    if (!current) {
      return
    }

    const body = current.bodyLines.join('\n').trim()

    if (body || current.level === 1) {
      const fallbackFields = fallbackFieldsForSourceSection(current.title, current.level)
      const sectionBody = body || fallbackFields.body
      const dailyTitle = dailyTitlePartsFromSourceTitle(current.title)

      sections.push({
        level: current.level,
        title: current.title,
        anchor: slugify(current.title),
        displayDay: dailyTitle?.day,
        displayDate: dailyTitle?.date,
        displaySubtitle: dailyTitle?.subtitle,
        body: sectionBody,
        links: body ? extractLinks(body) : undefined,
        enableComments: fallbackFields.enableComments,
        enableThumbsUp: fallbackFields.enableThumbsUp,
        enableThumbsDown: fallbackFields.enableThumbsDown,
      })
    }

    current = undefined
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)

    if (heading) {
      flush()
      current = {
        level: heading[1]?.length ?? 1,
        title: cleanMarkdown(heading[2] ?? '旅行章節'),
        bodyLines: [],
      }
      continue
    }

    if (!current || line.trim() === '---') {
      continue
    }

    current.bodyLines.push(line)
  }

  flush()

  return sections
}

function fallbackFieldsForSourceSection(title: string, level: number): {
  body: string
  enableComments?: boolean
  enableThumbsUp?: boolean
  enableThumbsDown?: boolean
} {
  if (level === 1 && /注意事項|提醒|安全/.test(title)) {
    return {
      body: REMINDER_SOURCE_SECTION_INTRO,
      enableComments: false,
      enableThumbsUp: false,
      enableThumbsDown: false,
    }
  }

  return {
    body: SOURCE_SECTION_BOUNDARY_BODY,
  }
}

function dailyTitlePartsFromSourceTitle(
  title: string,
): { day: string; date: string; subtitle: string } | undefined {
  const match = title.match(/^\s*((?:🚢|🌿)?\s*Day\s+\d+)\s*[·.-]?\s*(.*)$/i)

  if (!match) {
    return undefined
  }

  const rest = match[2]?.trim() ?? ''
  const [date = '', ...subtitleParts] = rest.split(/\s*[—–-]\s*/)
  const subtitle = subtitleParts.join(' — ').trim()

  return {
    day: cleanMarkdown(match[1]?.trim() ?? ''),
    date: cleanMarkdown(date.trim()),
    subtitle: cleanMarkdown(subtitle),
  }
}

function extractLinks(markdown: string): NonNullable<NonNullable<TravelSeed['sourceSections']>[number]['links']> | undefined {
  const links = new Map<string, { label: string; url: string }>()
  const addLink = (label: string, url: string) => {
    if (!isHttpUrl(url)) {
      return
    }

    links.set(url, {
      label: cleanMarkdown(label) || url,
      url,
    })
  }

  for (const match of markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    addLink(match[1] ?? '', match[2] ?? '')
  }

  for (const match of markdown.matchAll(/(^|[\s：:])((https?:\/\/)[^\s<>()]+)(?=$|\s)/g)) {
    const url = (match[2] ?? '').replace(/[，。,.)）]+$/, '')
    addLink(url, url)
  }

  return links.size ? [...links.values()] : undefined
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sectionContent(markdown: string, heading: string): string {
  const pattern = new RegExp(`##\\s+${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n---\\n\\n##(?!#)|\\n##(?!#)\\s+|$)`)

  return markdown.match(pattern)?.[1]?.trim() ?? ''
}

function firstAvailableSection(markdown: string, headings: string[]): string {
  for (const heading of headings) {
    const content =
      sectionContent(markdown, heading) ||
      sectionAfterHeading(markdown, heading) ||
      sectionAfterPlainLabel(markdown, heading)

    if (content) {
      return content
    }
  }

  return ''
}

function sectionAfterPlainLabel(markdown: string, label: string): string {
  const lines = markdown.split('\n')
  const labelIndex = lines.findIndex((line) => line.trim() === label)

  if (labelIndex < 0) {
    return ''
  }

  const content = lines.slice(labelIndex + 1)
  const endIndex = content.findIndex((line) => /^(---|#{1,3}\s+)/.test(line.trim()))

  return content.slice(0, endIndex < 0 ? undefined : endIndex).join('\n').trim()
}

function sectionAfterHeading(markdown: string, heading: string): string {
  const lines = markdown.split('\n')
  const headingIndex = lines.findIndex((line) => {
    const match = line.match(/^(#{1,3})\s+/)
    return Boolean(match && line.includes(heading))
  })

  if (headingIndex < 0) {
    return ''
  }

  const level = lines[headingIndex]?.match(/^(#{1,3})\s+/)?.[1].length ?? 1
  const content = lines.slice(headingIndex + 1)
  const endIndex = content.findIndex((line) => {
    const nextLevel = line.match(/^(#{1,3})\s+/)?.[1].length
    return nextLevel !== undefined && nextLevel <= level
  })

  return content.slice(0, endIndex < 0 ? undefined : endIndex).join('\n').trim()
}

function isFlightRow(cells: string[]): boolean {
  if (cells.some((cell) => ['日期', '乘機人', '方向'].includes(cell))) {
    return false
  }

  return (
    cells.some((cell) => /[A-Z]{1,3}\d{2,4}/.test(cell) || cell === 'TBD') ||
    cells[1]?.includes('中華航空') === true
  )
}

function cellByHeader(headers: string[], cells: string[], labels: string[]): string | undefined {
  const index = headers.findIndex((header) => labels.some((label) => header.includes(label)))

  return index >= 0 ? cells[index] : undefined
}

function isYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    return (
      host === 'youtu.be' ||
      (host === 'youtube.com' && (url.pathname === '/watch' || url.pathname.startsWith('/shorts/')))
    )
  } catch {
    return false
  }
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
  const asciiSlug = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

  if (asciiSlug) {
    return asciiSlug
  }

  return `item-${hashString(value)}`
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

async function assertBloggerFeedExists(archivePath: string): Promise<void> {
  const { stdout } = await execFileAsync('unzip', ['-Z1', archivePath], {
    maxBuffer: 4 * 1024 * 1024,
  })
  const feedPath = stdout
    .split('\n')
    .find((entry) => /^Takeout\/Blogger\/Blogs\/.+\/feed\.atom$/.test(entry))

  if (!feedPath) {
    throw new Error(`Blogger feed.atom not found in ${archivePath}`)
  }
}

function phase5BlogCategories(): BlogCategorySeed[] {
  return [
    blogCategorySeedSchema.parse({
      title: 'Family Note',
      slug: 'family-note',
      description: 'Phase-5 deterministic family Blog sample.',
    }),
    blogCategorySeedSchema.parse({
      title: 'Private Memory',
      slug: 'private-memory',
      description: 'Private Blog sample for family-only access checks.',
    }),
  ]
}

function phase5BlogPosts(): BlogPostSeed[] {
  return [
    blogPostSeedSchema.parse({
      title: 'Phase-5 公開家庭短箋',
      slug: 'phase-5-public-family-note',
      authorSlug: 'tavis',
      categorySlugs: ['family-note'],
      tags: ['Family', 'Phase 5'],
      isPrivate: false,
      publishedDate: '2026-06-14T00:00:00.000Z',
      source: 'phase-5-seed',
      content: textToLexicalContent([
        '這是一篇公開的 Phase-5 Blog seed，用來驗證列表頁、文章頁與公開 SEO metadata。',
        '內容透過 Payload posts collection 與 Lexical richText 輸出，不使用前台靜態假資料。',
      ]),
    }),
    blogPostSeedSchema.parse({
      title: 'Phase-5 家人限定筆記',
      slug: 'phase-5-private-family-note',
      authorSlug: 'tavis',
      categorySlugs: ['private-memory', 'family-note'],
      tags: ['Private', 'Family', 'Reflection'],
      isPrivate: true,
      publishedDate: '2026-06-14T00:10:00.000Z',
      source: 'phase-5-seed',
      content: textToLexicalContent([
        '這是一篇私密文章 seed，用來驗證未登入訪客不可讀取私密文章。',
        '登入態完整驗證會依照 Phase-6 Auth 狀態補做。',
      ]),
    }),
    blogPostSeedSchema.parse({
      title: 'Phase-5 無封面容錯文章',
      slug: 'phase-5-missing-cover-fallback',
      authorSlug: 'tavis',
      categorySlugs: ['family-note'],
      tags: ['Fallback', 'ImageFallback'],
      isPrivate: false,
      publishedDate: '2026-06-14T00:20:00.000Z',
      source: 'phase-5-seed',
      content: textToLexicalContent([
        '這篇文章刻意不提供 coverImage，用來驗證 Blog UI 必須渲染 ImageFallback。',
      ]),
    }),
  ]
}

function mergeBlogCategories(
  left: BlogCategorySeed[],
  right: BlogCategorySeed[],
): BlogCategorySeed[] {
  const categories = new Map<string, BlogCategorySeed>()

  for (const category of [...left, ...right]) {
    categories.set(category.slug, category)
  }

  return [...categories.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

function tagValue(entry: string, tagName: string): string | undefined {
  const escaped = escapeRegExp(tagName)
  const match =
    entry.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`)) ??
    entry.match(new RegExp(`<${escaped}(?:\\s[^>]*)?\\/>`))

  if (!match?.[1]) {
    return undefined
  }

  return decodeXml(match[1]).trim()
}

function categoryTerms(entry: string): string[] {
  return [...entry.matchAll(/<category\b[^>]*\bterm='([^']+)'[^>]*\/>/g)]
    .map((match) => decodeXmlAttribute(match[1] ?? '').trim())
    .filter(Boolean)
}

function firstImageUrl(html: string | undefined): string | undefined {
  if (!html) {
    return undefined
  }

  return decodeXml(html).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]
}

function htmlToLexicalContent(
  html: string | undefined,
  metadata: {
    originalUrl?: string
    updatedDate?: string
  } = {},
): LexicalContentSeed {
  const decoded = decodeXml(html ?? '')
  const text = decoded
    .replace(/<!--more-->/g, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .split(/\n{2,}/)
    .map((paragraph) => decodeXml(paragraph).replace(/[ \t]+\n/g, '\n').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 24)

  const paragraphs = text.length ? text : ['Blogger 匯入文章內容待整理。']

  if (metadata.originalUrl || metadata.updatedDate) {
    const metadataChildren = [
      metadata.originalUrl ? linkNode(metadata.originalUrl, 'Skywalker TW Blogspot') : null,
      metadata.updatedDate ? textNode(` 原更新時間：${metadata.updatedDate}`) : null,
    ].filter((node): node is ReturnType<typeof textNode> | ReturnType<typeof linkNode> => Boolean(node))

    return lexicalContentSchema.parse({
      root: {
        type: 'root',
        version: 1,
        format: '',
        indent: 0,
        direction: null,
        children: [
          ...paragraphs.map((paragraph) => paragraphNode([textNode(paragraph)])),
          paragraphNode([
            textNode('原文連結：'),
            ...metadataChildren,
          ]),
        ],
      },
    })
  }

  return textToLexicalContent(paragraphs)
}

function textToLexicalContent(paragraphs: string[]): LexicalContentSeed {
  return lexicalContentSchema.parse({
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: null,
      children: paragraphs.map((paragraph) => paragraphNode([textNode(paragraph)])),
    },
  })
}

function paragraphNode(children: Array<ReturnType<typeof textNode> | ReturnType<typeof linkNode>>) {
  return {
    type: 'paragraph' as const,
    version: 1,
    format: '',
    indent: 0,
    direction: null,
    children,
  }
}

function textNode(text: string) {
  return {
    type: 'text' as const,
    version: 1,
    text,
    detail: 0,
    format: 0,
    mode: 'normal' as const,
    style: '',
  }
}

function linkNode(url: string, text: string) {
  return {
    type: 'link' as const,
    version: 3,
    fields: {
      linkType: 'custom' as const,
      newTab: true,
      url,
    },
    format: '',
    indent: 0,
    direction: null,
    children: [textNode(text)],
  }
}

function uniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  const safeBase = baseSlug || 'blog-post'
  let slug = safeBase
  let index = 2

  while (usedSlugs.has(slug)) {
    slug = `${safeBase}-${index}`
    index += 1
  }

  usedSlugs.add(slug)

  return slug
}

function decodeXml(value: string): string {
  return decodeXmlAttribute(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function decodeXmlAttribute(value: string): string {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, codepoint: string) => String.fromCodePoint(Number(codepoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codepoint: string) =>
      String.fromCodePoint(Number.parseInt(codepoint, 16)),
    )
}

function hashString(value: string): string {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0
  }

  return hash.toString(36)
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
