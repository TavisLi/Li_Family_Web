import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSeedContent, type SeedContent } from './seed-content'

export type SourceCoverageAudit = {
  catalog: Array<{
    slug: string
    title: string
    status: 'planning' | 'completed'
    sourceFile: string
    routePath: string
    flights: number
    lodgings: number
    dailyItinerary: number
    sourceSections: number
    externalVideos: number
    media: {
      cover: number
      gallery: number
      itinerary: number
    }
  }>
  integrity: {
    missingTravelRecords: string[]
    missingCoverMedia: string[]
    missingStructuredContent: string[]
    missingSourceSections: string[]
    missingRoutePaths: string[]
  }
  avatarSourcePaths: string[]
  mutationPlan: {
    status: 'source-only'
    creates: 'unknown until protected Payload read-back'
    updates: 'unknown until protected Payload read-back'
    skips: 'unknown until protected Payload read-back'
    deletes: 0
    deletionRisk: 'No delete operation is part of the Phase 9 seed workflow.'
  }
}

export function buildSourceCoverageAudit(seedContent: SeedContent): SourceCoverageAudit {
  const mediaByTravel = new Map<string, SeedContent['media']>()

  for (const item of seedContent.media) {
    if (item.ownerType !== 'travel') {
      continue
    }

    const items = mediaByTravel.get(item.ownerSlug) ?? []
    items.push(item)
    mediaByTravel.set(item.ownerSlug, items)
  }

  const catalog = seedContent.travels.map((travel) => {
    const media = mediaByTravel.get(travel.slug) ?? []
    const countUsage = (usage: 'cover' | 'gallery' | 'itinerary') =>
      media.filter((item) => item.usage === usage).length

    return {
      slug: travel.slug,
      title: travel.title,
      status: travel.status,
      sourceFile: travel.externalDocIdentifier,
      routePath: `/travel/${travel.slug}`,
      flights: travel.flights?.length ?? 0,
      lodgings: travel.lodgings?.length ?? 0,
      dailyItinerary: travel.dailyItinerary?.length ?? 0,
      sourceSections: travel.sourceSections?.length ?? 0,
      externalVideos: travel.externalVideos?.length ?? 0,
      media: {
        cover: countUsage('cover'),
        gallery: countUsage('gallery'),
        itinerary: countUsage('itinerary'),
      },
    }
  })

  return {
    catalog,
    integrity: {
      missingTravelRecords: catalog.filter((item) => !item.sourceFile).map((item) => item.slug),
      missingCoverMedia: catalog.filter((item) => item.media.cover === 0).map((item) => item.slug),
      missingStructuredContent: catalog
        .filter((item) => item.flights === 0 || item.lodgings === 0 || item.dailyItinerary === 0)
        .map((item) => item.slug),
      missingSourceSections: catalog
        .filter((item) => item.sourceSections === 0)
        .map((item) => item.slug),
      missingRoutePaths: catalog
        .filter((item) => item.routePath !== `/travel/${item.slug}`)
        .map((item) => item.slug),
    },
    avatarSourcePaths: seedContent.media
      .filter(
        (item) =>
          item.ownerType === 'member' &&
          (item.ownerSlug === 'tavis' || item.ownerSlug === 'lynn') &&
          item.usage === 'avatar',
      )
      .map((item) => item.sourcePath),
    mutationPlan: {
      status: 'source-only',
      creates: 'unknown until protected Payload read-back',
      updates: 'unknown until protected Payload read-back',
      skips: 'unknown until protected Payload read-back',
      deletes: 0,
      deletionRisk: 'No delete operation is part of the Phase 9 seed workflow.',
    },
  }
}

async function main() {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(dirname, '../..')
  const audit = buildSourceCoverageAudit(await buildSeedContent(projectRoot))

  console.log(JSON.stringify(audit, null, 2))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Source audit failed:', error)
    process.exit(1)
  })
}
