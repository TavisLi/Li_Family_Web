import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'

import { getPayload, type Payload } from 'payload'

import {
  buildSeedContent,
  type BlogCategorySeed,
  type BlogPostSeed,
  type FamilyMemberSeed,
  type MediaSeed,
  type TravelSeed,
} from './seed-content'
import { buildPayloadDryRun } from './seed-dry-run'
import { mediaRecordMatchesSeed, mediaSeedData } from './seed-media-compare'
import { memberEnglishLocalizedData, memberLocalizedWriteOptions } from './seed-member-locale'
import { mediaIdsBySourcePath } from './seed-media-context'
import { mediaRefreshRequestFromArgs } from './seed-media-repair'
import { attachSourceSectionMediaIds } from './travel-section-media'
import { uploadFilenameForSourcePath } from './seed-upload-name'
import {
  buildTravelProjection,
  reconciliationModeFromArgs,
  reconcileTravelSeed,
  travelProjectionHash,
  writePayloadTravelDraft,
  type ReconciliationMode,
  type TravelProjection,
} from './travel-seed-reconciliation'

interface SeedStats {
  created: number
  updated: number
  skipped: number
  failed: number
}

interface SeedContext {
  mediaBySourcePath: Map<string, number>
  mediaByOwner: Map<string, MediaSeed[]>
  categoryBySlug: Map<string, number>
  travelBySlug: Map<string, number>
  userBySlug: Map<string, number>
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../..')

async function run() {
  await loadLocalEnv(projectRoot)
  const { default: configPromise } = await import('@payload-config')
  const payload = await getPayload({ config: configPromise })
  console.log('Payload Local API initialized')
  const blogOnly = process.argv.includes('--blog-only')
  const dryRun = process.argv.includes('--dry-run')
  const phase9Only = process.argv.includes('--phase-9')
  const phase9ReadBack = process.argv.includes('--phase-9-read-back')
  const mediaRefreshRequest = mediaRefreshRequestFromArgs(process.argv)
  const reconciliationMode = reconciliationModeFromArgs(process.argv)

  const seedContent = await buildSeedContent(projectRoot)

  if (dryRun) {
    const report = await buildPayloadDryRun(payload, seedContent, reconciliationMode)

    console.log(
      JSON.stringify(
        {
          summary: report.summary,
          deletionRisk: report.deletionRisk,
          sampledActions: report.actions.slice(0, 20),
          totalActions: report.actions.length,
        },
        null,
        2,
      ),
    )
    return
  }
  const stats: SeedStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }

  const context: SeedContext = {
    mediaBySourcePath: new Map(),
    mediaByOwner: new Map(),
    categoryBySlug: new Map(),
    travelBySlug: new Map(),
    userBySlug: new Map(),
  }

  if (mediaRefreshRequest?.type === 'sources') {
    for (const sourcePath of mediaRefreshRequest.sourcePaths) {
      await refreshExistingMedia(payload, seedContent.media, sourcePath, stats)
    }
    console.log('Media refresh completed')
    console.table(stats)
    return
  }

  if (mediaRefreshRequest?.type === 'missing-current-media') {
    await refreshMissingCurrentMedia(payload, seedContent.media, stats)
    console.log('Missing current media refresh completed')
    console.table(stats)
    return
  }

  if (blogOnly) {
    await loadBlogAuthors(payload, context)
    await seedBlogCategories(payload, seedContent.blogCategories, context, stats)
    await seedBlogPosts(payload, seedContent.blogPosts, context, stats)
    console.log('Blog seed completed')
    console.table(stats)
    process.exit(0)
  }

  if (phase9ReadBack) {
    await hydrateExistingMedia(payload, seedContent.media, context, stats)
    await seedMembers(payload, seedContent.members, context, stats)
    await seedTravelProjects(payload, seedContent.travels, context, stats, reconciliationMode)
    await seedHomeConfig(payload, context, stats)

    console.log('Phase 9 read-back content sync completed')
    console.table(stats)
    return
  }

  await seedMedia(payload, seedContent.media, context, stats)
  await seedMembers(payload, seedContent.members, context, stats)

  if (phase9Only) {
    await seedTravelProjects(payload, seedContent.travels, context, stats, reconciliationMode)
    await seedHomeConfig(payload, context, stats)

    console.log('Phase 9 content seed completed')
    console.table(stats)
    return
  }

  await seedBlogCategories(payload, seedContent.blogCategories, context, stats)
  await seedBlogPosts(payload, seedContent.blogPosts, context, stats)
  await seedTravelProjects(payload, seedContent.travels, context, stats, reconciliationMode)
  await seedPhase7DemoData(payload, context, stats)
  await seedHomeConfig(payload, context, stats)

  console.log('Seed completed')
  console.table(stats)
  process.exit(0)
}

async function hydrateExistingMedia(
  payload: Payload,
  mediaItems: MediaSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Reading ${mediaItems.length} existing media assets...`)

  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 2000,
    pagination: false,
  })
  const existingMediaIds = mediaIdsBySourcePath(result.docs)

  for (const item of mediaItems) {
    const id = existingMediaIds.get(item.sourcePath)

    if (!id) {
      stats.failed += 1
      console.error(`Missing media required for Phase 9 read-back sync: ${item.sourcePath}`)
      continue
    }

    context.mediaBySourcePath.set(item.sourcePath, id)
    addOwnerMedia(context, item)
  }
}

async function seedMedia(
  payload: Payload,
  mediaItems: MediaSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${mediaItems.length} media assets...`)

  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 2000,
    pagination: false,
  })
  const existingBySourcePath = new Map(
    existing.docs.flatMap((doc) => (doc.sourcePath ? [[doc.sourcePath, doc] as const] : [])),
  )
  console.log(`Loaded ${existingBySourcePath.size} existing media records for diff-based seed.`)

  for (const [index, item] of mediaItems.entries()) {
    try {
      const displayIndex = index + 1
      if (displayIndex === 1 || displayIndex % 50 === 0 || displayIndex === mediaItems.length) {
        console.log(`Media progress: ${displayIndex}/${mediaItems.length}`)
      }

      const data = mediaSeedData(item)
      const existingDoc = existingBySourcePath.get(item.sourcePath)

      if (existingDoc) {
        if (mediaRecordMatchesSeed(existingDoc, item)) {
          context.mediaBySourcePath.set(item.sourcePath, Number(existingDoc.id))
          stats.skipped += 1
          addOwnerMedia(context, item)
          continue
        }

        const updated = await payload.update({
          collection: 'media',
          id: existingDoc.id,
          data,
        })
        context.mediaBySourcePath.set(item.sourcePath, Number(updated.id))
        stats.updated += 1
      } else {
        const stagedFilePath = await stageUploadFile(item.absolutePath)
        const created = await payload
          .create({
            collection: 'media',
            data,
            filePath: stagedFilePath,
          })
          .finally(() => removeStagedFile(stagedFilePath))
        context.mediaBySourcePath.set(item.sourcePath, Number(created.id))
        stats.created += 1
      }

      addOwnerMedia(context, item)
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed media: ${item.sourcePath}`, error)
    }
  }
}

async function refreshExistingMedia(
  payload: Payload,
  mediaItems: MediaSeed[],
  sourcePath: string,
  stats: SeedStats,
) {
  const item = mediaItems.find((media) => media.sourcePath === sourcePath)

  if (!item) {
    throw new Error(`No source media found for refresh: ${sourcePath}`)
  }

  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    where: {
      sourcePath: {
        equals: item.sourcePath,
      },
    },
  })
  const existingDoc = existing.docs[0]

  if (!existingDoc) {
    throw new Error(`No existing media record found for refresh: ${sourcePath}`)
  }

  const stagedFilePath = await stageUploadFile(item.absolutePath)

  try {
    await payload.update({
      collection: 'media',
      id: existingDoc.id,
      data: {
        type: 'photo',
        altText: item.altText,
        sourcePath: item.sourcePath,
        tags: item.tags,
      },
      filePath: stagedFilePath,
    })
    stats.updated += 1
    console.log(`Refreshed media object: ${sourcePath}`)
  } finally {
    await removeStagedFile(stagedFilePath)
  }
}

async function refreshMissingCurrentMedia(payload: Payload, mediaItems: MediaSeed[], stats: SeedStats) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 2000,
    pagination: false,
  })
  const existingBySourcePath = new Map(result.docs.map((media) => [media.sourcePath, media]))
  const missingSourcePaths: string[] = []
  let nextItemIndex = 0

  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (nextItemIndex < mediaItems.length) {
        const item = mediaItems[nextItemIndex]
        nextItemIndex += 1
        const existing = existingBySourcePath.get(item.sourcePath)

        if (!existing) {
          throw new Error(`No existing media record found for refresh: ${item.sourcePath}`)
        }

        const mediumUrl = existing.sizes?.medium?.url ?? existing.url

        if (!mediumUrl || !(await publicMediaUrlExists(mediumUrl))) {
          missingSourcePaths.push(item.sourcePath)
        }
      }
    }),
  )

  console.log(`Detected ${missingSourcePaths.length} missing current media objects`)

  for (const sourcePath of missingSourcePaths) {
    await refreshExistingMedia(payload, mediaItems, sourcePath, stats)
  }
}

async function publicMediaUrlExists(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'HEAD' })

      if (response.status !== 429) {
        return response.ok
      }
    } catch {
      // A transient network failure is retried below before a media object is refreshed.
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  }

  return false
}

async function seedMembers(
  payload: Payload,
  members: FamilyMemberSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${members.length} family members...`)

  for (const member of members) {
    try {
      const { displayNameLocales, ...memberData } = member
      const assets = ownerMedia(context, 'member', member.slug)
      const avatar = firstMediaId(context, assets, 'avatar')
      const heroImage = firstMediaId(context, assets, 'hero')
      const cardImage = avatar ?? heroImage
      const galleryImages = mediaIds(context, assets, ['gallery', 'hero', 'avatar'])
      const resumeMilestoneImages = mediaIds(context, assets, ['career'])
      const data = {
        ...memberData,
        email: `family+${member.slug}@web-li.local`,
        role: member.slug === 'tavis' ? ('admin' as const) : ('family' as const),
        avatar,
        heroImage,
        cardImage,
        galleryImages,
        resumeMilestoneImages,
      }

      const existing = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: member.slug,
          },
        },
      })

      const existingDoc = existing.docs[0]

      if (existingDoc) {
        const updated = await payload.update({
          collection: 'users',
          id: existingDoc.id,
          ...memberLocalizedWriteOptions(),
          data,
        })
        context.userBySlug.set(member.slug, Number(updated.id))
        if (displayNameLocales?.en) {
          await payload.update({
            collection: 'users',
            id: updated.id,
            locale: 'en',
            data: memberEnglishLocalizedData(data, displayNameLocales.en),
          })
        }
        stats.updated += 1
      } else {
        const created = await payload.create({
          collection: 'users',
          ...memberLocalizedWriteOptions(),
          data: {
            ...data,
            password: process.env.SEED_DEFAULT_PASSWORD ?? 'WebLi-Phase2-Seed-2026!',
          },
        })
        context.userBySlug.set(member.slug, Number(created.id))
        if (displayNameLocales?.en) {
          await payload.update({
            collection: 'users',
            id: created.id,
            locale: 'en',
            data: memberEnglishLocalizedData(data, displayNameLocales.en),
          })
        }
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed member: ${member.slug}`, error)
    }
  }
}

async function loadBlogAuthors(payload: Payload, context: SeedContext) {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    where: {
      slug: {
        equals: 'tavis',
      },
    },
  })
  const tavis = result.docs[0]

  if (!tavis) {
    throw new Error('Blog seed requires an existing Tavis user. Run pnpm run seed once first.')
  }

  context.userBySlug.set('tavis', Number(tavis.id))
}

async function seedBlogCategories(
  payload: Payload,
  categories: BlogCategorySeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${categories.length} blog categories...`)

  for (const category of categories) {
    try {
      const existing = await payload.find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: category.slug,
          },
        },
      })
      const existingDoc = existing.docs[0]

      if (existingDoc) {
        const updated = await payload.update({
          collection: 'categories',
          id: existingDoc.id,
          data: category,
        })
        context.categoryBySlug.set(category.slug, Number(updated.id))
        stats.updated += 1
      } else {
        const created = await payload.create({
          collection: 'categories',
          data: category,
        })
        context.categoryBySlug.set(category.slug, Number(created.id))
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed blog category: ${category.slug}`, error)
    }
  }
}

async function seedBlogPosts(
  payload: Payload,
  posts: BlogPostSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${posts.length} blog posts...`)

  for (const post of posts) {
    try {
      const author = context.userBySlug.get(post.authorSlug)

      if (!author) {
        throw new Error(`Author not found for blog post: ${post.authorSlug}`)
      }

      const categoryIds = post.categorySlugs
        .map((slug) => context.categoryBySlug.get(slug))
        .filter((id): id is number => typeof id === 'number')
      const data = {
        title: post.title,
        slug: post.slug,
        author,
        categories: categoryIds,
        isPrivate: post.isPrivate,
        publishedDate: post.publishedDate,
        coverImage: undefined,
        content: post.content,
        tags: post.tags.map((tag) => ({ tag })),
      }
      const existing = await payload.find({
        collection: 'posts',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: post.slug,
          },
        },
      })
      const existingDoc = existing.docs[0]

      if (existingDoc) {
        await payload.update({
          collection: 'posts',
          id: existingDoc.id,
          data,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'posts',
          data,
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed blog post: ${post.slug}`, error)
    }
  }
}

async function seedTravelProjects(
  payload: Payload,
  travels: TravelSeed[],
  context: SeedContext,
  stats: SeedStats,
  mode: ReconciliationMode,
) {
  console.log(`Seeding ${travels.length} travel projects...`)

  for (const travel of travels) {
    try {
      const assets = ownerMedia(context, 'travel', travel.slug)
      const coverImage = firstMediaId(context, assets, 'cover') ?? firstMediaId(context, assets, 'gallery')
      const galleryImages = mediaIds(context, assets, ['gallery', 'cover'])
      const itineraryImages = mediaIds(context, assets, ['itinerary'])
      const data = {
        ...attachSourceSectionMediaIds({
          mediaBySourcePath: context.mediaBySourcePath,
          mediaItems: assets,
          travel,
        }),
        coverImage,
        galleryImages,
        itineraryImages,
      }

      const existing = await payload.find({
        collection: 'travel-projects',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: travel.slug,
          },
        },
      })

      const existingDoc = existing.docs[0]

      if (existingDoc) {
        const source = buildTravelProjection(data as TravelProjection)
        const current = buildTravelProjection(existingDoc as unknown as TravelProjection)
        const metadata = travelSourceMetadata(existingDoc)
        const plan = reconcileTravelSeed({
          slug: travel.slug,
          base: metadata?.baseProjection,
          source,
          current,
          mode,
        })
        const nextMetadata = {
          sourceFile: travel.externalDocIdentifier,
          sourceHash: travelProjectionHash(source),
          parserVersion: 'phase-16-v1',
          baseProjection: source,
          ...(plan.action === 'apply-source' ? { lastImportedAt: new Date().toISOString() } : {}),
        }

        if (plan.action === 'conflict') {
          console.error(
            `Travel reconciliation conflict (${travel.slug}): ${plan.conflicts.map((item) => item.field).join(', ')}`,
          )

          if (!Object.keys(plan.patch).length) {
            stats.skipped += 1
            continue
          }

          const updated = await payload.update({
            collection: 'travel-projects',
            id: existingDoc.id,
            data: {
              ...plan.patch,
              sourceMetadata: {
                ...nextMetadata,
                lastImportedAt: new Date().toISOString(),
                baseProjection: {
                  ...(metadata?.baseProjection ?? {}),
                  ...plan.patch,
                },
              },
            },
          })
          context.travelBySlug.set(travel.slug, Number(updated.id))
          stats.updated += 1
          continue
        }

        if (mode === 'payload-wins' && process.argv.includes('--export-payload-drafts')) {
          const draftPath = await writePayloadTravelDraft({
            artifactRoot: path.join(projectRoot, 'docs/phase-artifacts/phase-16/exports'),
            slug: travel.slug,
            sourceFile: travel.externalDocIdentifier,
            current,
          })
          console.log(`Payload reconciliation draft: ${draftPath}`)
        }

        if (plan.action === 'preserve-current' && metadata && mode === 'safe') {
          stats.skipped += 1
          context.travelBySlug.set(travel.slug, Number(existingDoc.id))
          continue
        }

        const updated = await payload.update({
          collection: 'travel-projects',
          id: existingDoc.id,
          data:
            plan.action === 'apply-source'
              ? { ...plan.patch, sourceMetadata: nextMetadata }
              : { sourceMetadata: nextMetadata },
        })
        context.travelBySlug.set(travel.slug, Number(updated.id))
        stats.updated += 1
      } else {
        const source = buildTravelProjection(data as TravelProjection)
        const created = await payload.create({
          collection: 'travel-projects',
          data: {
            ...data,
            sourceMetadata: {
              sourceFile: travel.externalDocIdentifier,
              sourceHash: travelProjectionHash(source),
              parserVersion: 'phase-16-v1',
              lastImportedAt: new Date().toISOString(),
              baseProjection: source,
            },
          },
        })
        context.travelBySlug.set(travel.slug, Number(created.id))
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed travel project: ${travel.slug}`, error)
    }
  }
}

function travelSourceMetadata(value: unknown): { baseProjection?: TravelProjection } | undefined {
  if (!value || typeof value !== 'object' || !('sourceMetadata' in value)) {
    return undefined
  }

  const metadata = value.sourceMetadata
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }

  const baseProjection = 'baseProjection' in metadata ? metadata.baseProjection : undefined
  return {
    baseProjection:
      baseProjection && typeof baseProjection === 'object' && !Array.isArray(baseProjection)
        ? (baseProjection as TravelProjection)
        : undefined,
  }
}

async function seedPhase7DemoData(payload: Payload, context: SeedContext, stats: SeedStats) {
  console.log('Seeding Phase 7 demo data...')

  const homeAssets = ownerMedia(context, 'home', 'home')
  const tavisId = context.userBySlug.get('tavis')
  const lynnId = context.userBySlug.get('lynn')
  const hainanTravelId = context.travelBySlug.get('201307-hainan')
  const eastAustraliaTravelId = context.travelBySlug.get('202308-east-australia')
  const heroImage = firstMediaId(context, homeAssets, 'gallery')
  const galleryImages = mediaIds(context, homeAssets, ['gallery']).slice(0, 3)

  const timelineSeeds = [
    {
      title: '海南三灣的夏日海風',
      slug: '2013-hainan-family-summer',
      eventDate: '2013-07-03T00:00:00.000Z',
      year: 2013,
      summary: '亞龍灣、海棠灣與石梅灣把一家人的度假記憶串成第一段公開時空膠囊。',
      description: '這筆公開事件用來讓訪客也能看見 Web Li 的家庭時間線質感。',
      images: galleryImages.slice(0, 1),
      relatedTravel: hainanTravelId,
      relatedMembers: [tavisId, lynnId].filter((id): id is number => typeof id === 'number'),
      sourceType: 'travel' as const,
      isPrivate: false,
      sortOrder: 10,
    },
    {
      title: '東澳旅行裡只有家人知道的小片段',
      slug: '2023-east-australia-private-memory',
      eventDate: '2023-08-06T00:00:00.000Z',
      year: 2023,
      summary: '墨爾本、企鵝歸巢與藍山之外，還有只留給家人的旅途細節。',
      description: '這筆私密事件驗證家人模式下的完整時間線與訪客模式隔離。',
      images: galleryImages.slice(1, 2),
      relatedTravel: eastAustraliaTravelId,
      relatedMembers: [tavisId, lynnId].filter((id): id is number => typeof id === 'number'),
      sourceType: 'travel' as const,
      isPrivate: true,
      sortOrder: 20,
    },
  ]

  const timelineBySlug = new Map<string, number>()

  for (const event of timelineSeeds) {
    try {
      const existing = await payload.find({
        collection: 'timeline-events',
        depth: 0,
        limit: 1,
        where: {
          slug: {
            equals: event.slug,
          },
        },
      })
      const existingDoc = existing.docs[0]

      if (existingDoc) {
        const updated = await payload.update({
          collection: 'timeline-events',
          id: existingDoc.id,
          data: event,
        })
        timelineBySlug.set(event.slug, Number(updated.id))
        stats.updated += 1
      } else {
        const created = await payload.create({
          collection: 'timeline-events',
          data: event,
        })
        timelineBySlug.set(event.slug, Number(created.id))
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed timeline event: ${event.slug}`, error)
    }
  }

  const completedTimelineId = timelineBySlug.get('2023-east-australia-private-memory')
  const bucketSeeds = [
    {
      title: '整理一套家庭年度相簿',
      description: '先把散落照片收攏，再挑出能放進首頁與時間線的版本。',
      status: 'pool' as const,
      priority: 2,
      createdBy: tavisId,
      coverImage: heroImage,
      isPrivate: true,
    },
    {
      title: '完成重慶三峽行前願望清單',
      description: '把防暑、航班、長輩小孩照顧事項整理成全家都看得懂的版本。',
      status: 'in-progress' as const,
      priority: 1,
      createdBy: tavisId,
      coverImage: heroImage,
      isPrivate: true,
    },
    {
      title: '把東澳旅行影片放回家庭記憶裡',
      description: '已完成的願望，示範 bucket item 與 timeline event 的長期關聯。',
      status: 'completed' as const,
      priority: 3,
      createdBy: lynnId,
      completedBy: lynnId,
      completedAt: '2026-06-12T12:00:00.000Z',
      coverImage: heroImage,
      isPrivate: true,
      timelineEvent: completedTimelineId,
    },
  ]

  for (const bucket of bucketSeeds) {
    try {
      const existing = await payload.find({
        collection: 'bucket-items',
        depth: 0,
        limit: 1,
        where: {
          title: {
            equals: bucket.title,
          },
        },
      })
      const existingDoc = existing.docs[0]

      if (existingDoc) {
        await payload.update({
          collection: 'bucket-items',
          id: existingDoc.id,
          data: bucket,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'bucket-items',
          data: bucket,
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed bucket item: ${bucket.title}`, error)
    }
  }

  try {
    const wrapped = {
      year: 2026,
      status: 'published' as const,
      publishedAt: '2026-12-15T00:00:00.000Z',
      heroMedia: heroImage,
      summary: '這一年，家人把旅行、文字、照片與共同願望慢慢接回同一條時間線。',
      stats: [
        { label: '旅行企劃', value: '3', note: '從海南、東澳到重慶三峽，路線逐步進入 Payload。' },
        { label: '家庭願望', value: '3', note: '願望池、進行中與已實現都有可驗證資料。' },
        { label: '時空事件', value: '2+', note: '公開與私密事件分別驗證雙模隱私。' },
      ],
      blocks: [
        {
          kind: 'travel' as const,
          title: '把遠方放回家裡',
          body: '每一次旅行都不只是頁面，也會成為未來年度報告的故事素材。',
          accent: 'Travel',
        },
        {
          kind: 'wish' as const,
          title: '願望完成時，時間線會亮起來',
          body: '共同願望完成後會自動建立 TimelineEvents，讓小事也能長期保存。',
          accent: 'Wish',
        },
      ],
      isPrivate: true,
    }
    const existing = await payload.find({
      collection: 'wrapped-snapshots',
      depth: 0,
      limit: 1,
      where: {
        year: {
          equals: wrapped.year,
        },
      },
    })
    const existingDoc = existing.docs[0]

    if (existingDoc) {
      await payload.update({
        collection: 'wrapped-snapshots',
        id: existingDoc.id,
        data: wrapped,
      })
      stats.updated += 1
    } else {
      await payload.create({
        collection: 'wrapped-snapshots',
        data: wrapped,
      })
      stats.created += 1
    }
  } catch (error) {
    stats.failed += 1
    console.error('Failed to seed wrapped snapshot', error)
  }
}

async function seedHomeConfig(payload: Payload, context: SeedContext, stats: SeedStats) {
  try {
    const homeAssets = ownerMedia(context, 'home', 'home')
    const heroBackground = firstMediaId(context, homeAssets, 'gallery')

    await payload.updateGlobal({
      slug: 'home-config',
      data: {
        heroTitle: 'Welcome to Web Li',
        heroSubtitle: '一座為家庭記憶、旅行足跡與共同願望而生的數位大廳。',
        heroBackground,
        announcement: 'Phase-2 seed pipeline is ready for family content imports.',
      },
    })
    stats.updated += 1
  } catch (error) {
    stats.failed += 1
    console.error('Failed to seed home config', error)
  }
}

function addOwnerMedia(context: SeedContext, media: MediaSeed) {
  const key = ownerKey(media.ownerType, media.ownerSlug)
  const list = context.mediaByOwner.get(key) ?? []
  list.push(media)
  context.mediaByOwner.set(key, list)
}

function ownerMedia(
  context: SeedContext,
  ownerType: MediaSeed['ownerType'],
  ownerSlug: string,
): MediaSeed[] {
  return context.mediaByOwner.get(ownerKey(ownerType, ownerSlug)) ?? []
}

function firstMediaId(
  context: SeedContext,
  mediaItems: MediaSeed[],
  usage: MediaSeed['usage'],
): number | undefined {
  const item = mediaItems.find((media) => media.usage === usage)

  return item ? context.mediaBySourcePath.get(item.sourcePath) : undefined
}

function mediaIds(
  context: SeedContext,
  mediaItems: MediaSeed[],
  usages: MediaSeed['usage'][],
): number[] {
  return mediaItems
    .filter((media) => usages.includes(media.usage))
    .map((media) => context.mediaBySourcePath.get(media.sourcePath))
    .filter((id): id is number => typeof id === 'number')
}

function ownerKey(ownerType: MediaSeed['ownerType'], ownerSlug: string): string {
  return `${ownerType}:${ownerSlug}`
}

async function stageUploadFile(sourcePath: string): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'web-li-seed-'))
  const stagedFilePath = path.join(directory, uploadFilenameForSourcePath(sourcePath))
  await copyFile(sourcePath, stagedFilePath)

  return stagedFilePath
}

async function removeStagedFile(stagedFilePath: string) {
  await rm(path.dirname(stagedFilePath), {
    force: true,
    recursive: true,
  })
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    const envPath = path.join(root, filename)

    try {
      const content = await import('node:fs/promises').then((fs) => fs.readFile(envPath, 'utf8'))
      for (const line of content.split('\n')) {
        const trimmed = line.trim()

        if (!trimmed || trimmed.startsWith('#')) {
          continue
        }

        const separatorIndex = trimmed.indexOf('=')

        if (separatorIndex === -1) {
          continue
        }

        const key = trimmed.slice(0, separatorIndex).trim()
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

        if (key && process.env[key] === undefined) {
          process.env[key] = value
        }
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') {
        throw error
      }
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

run().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
