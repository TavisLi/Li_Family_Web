import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'

import { getPayload, type Payload } from 'payload'

import { buildSeedContent, type FamilyMemberSeed, type MediaSeed, type TravelSeed } from './seed-content'

interface SeedStats {
  created: number
  updated: number
  skipped: number
  failed: number
}

interface SeedContext {
  mediaBySourcePath: Map<string, number>
  mediaByOwner: Map<string, MediaSeed[]>
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../..')

async function run() {
  await loadLocalEnv(projectRoot)
  const { default: configPromise } = await import('@payload-config')
  const payload = await getPayload({ config: configPromise })
  console.log('Payload Local API initialized')

  const seedContent = await buildSeedContent(projectRoot)
  const stats: SeedStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  }

  const context: SeedContext = {
    mediaBySourcePath: new Map(),
    mediaByOwner: new Map(),
  }

  await seedMedia(payload, seedContent.media, context, stats)
  await seedMembers(payload, seedContent.members, context, stats)
  await seedTravelProjects(payload, seedContent.travels, context, stats)
  await seedHomeConfig(payload, context, stats)

  console.log('Seed completed')
  console.table(stats)
  process.exit(0)
}

async function seedMedia(
  payload: Payload,
  mediaItems: MediaSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${mediaItems.length} media assets...`)

  for (const item of mediaItems) {
    try {
      const index = mediaItems.indexOf(item) + 1
      if (index === 1 || index % 10 === 0 || index === mediaItems.length) {
        console.log(`Media progress: ${index}/${mediaItems.length}`)
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

      const data = {
        type: 'photo' as const,
        altText: item.altText,
        sourcePath: item.sourcePath,
        tags: item.tags,
      }

      const existingDoc = existing.docs[0]

      if (existingDoc) {
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

async function seedMembers(
  payload: Payload,
  members: FamilyMemberSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${members.length} family members...`)

  for (const member of members) {
    try {
      const assets = ownerMedia(context, 'member', member.slug)
      const avatar = firstMediaId(context, assets, 'avatar')
      const heroImage = firstMediaId(context, assets, 'hero')
      const cardImage = avatar ?? heroImage
      const galleryImages = mediaIds(context, assets, ['gallery', 'hero', 'avatar'])
      const resumeMilestoneImages = mediaIds(context, assets, ['career'])
      const data = {
        ...member,
        email: `family+${member.slug}@web-li.local`,
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
        await payload.update({
          collection: 'users',
          id: existingDoc.id,
          data,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'users',
          data: {
            ...data,
            password: process.env.SEED_DEFAULT_PASSWORD ?? 'WebLi-Phase2-Seed-2026!',
          },
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed member: ${member.slug}`, error)
    }
  }
}

async function seedTravelProjects(
  payload: Payload,
  travels: TravelSeed[],
  context: SeedContext,
  stats: SeedStats,
) {
  console.log(`Seeding ${travels.length} travel projects...`)

  for (const travel of travels) {
    try {
      const assets = ownerMedia(context, 'travel', travel.slug)
      const coverImage = firstMediaId(context, assets, 'cover') ?? firstMediaId(context, assets, 'gallery')
      const galleryImages = mediaIds(context, assets, ['gallery', 'cover'])
      const itineraryImages = mediaIds(context, assets, ['itinerary'])
      const data = {
        ...travel,
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
        await payload.update({
          collection: 'travel-projects',
          id: existingDoc.id,
          data,
        })
        stats.updated += 1
      } else {
        await payload.create({
          collection: 'travel-projects',
          data,
        })
        stats.created += 1
      }
    } catch (error) {
      stats.failed += 1
      console.error(`Failed to seed travel project: ${travel.slug}`, error)
    }
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
  const stagedFilePath = path.join(directory, path.basename(sourcePath))
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
