import { getPayload } from 'payload'

import { buildTravelSeedContent } from './seed-content'
import {
  attachCreatedArrayIds,
  materializeTravelLocale,
  type TravelCopyPayload,
} from './travel-collection-copy-package'
import { buildTravelProjection, travelProjectionHash } from './travel-seed-reconciliation'

async function run() {
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')
  assertDisposableLocalDatabase(databaseUri)
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Local fixture refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const existing = await payload.count({ collection: 'travel-projects', overrideAccess: true })
  if (existing.totalDocs !== 0) throw new Error('Local fixture requires empty travel-projects')

  const targetBySlug = new Map<string, number>()
  for (const travel of await buildTravelSeedContent(process.cwd())) {
    const baseProjection = buildTravelProjection(travel)
    const data = {
      ...baseProjection,
      _status: 'published',
      sourceMetadata: {
        baseProjection,
        parserVersion: 'phase-17-local-rehearsal',
        sourceFile: travel.externalDocIdentifier,
        sourceHash: travelProjectionHash(baseProjection),
      },
    }
    const created = await payload.create({
      collection: 'travel-projects',
      data: materializeTravelLocale(data, 'zh-TW') as never,
      locale: 'zh-TW',
      overrideAccess: true,
    })
    await payload.update({
      collection: 'travel-projects',
      id: created.id,
      data: attachCreatedArrayIds(
        materializeTravelLocale(data, 'en'),
        created,
      ) as never,
      locale: 'en',
      overrideAccess: true,
    })
    targetBySlug.set(travel.slug, created.id)
  }

  const chongqingId = requiredTravelId(targetBySlug, '202607-chongqing-yangtze-river')
  for (let index = 1; index <= 12; index += 1) {
    await (payload as unknown as TravelCopyPayload).create({
      collection: 'media',
      data: {
        altText: `Phase 17 local media ${index}`,
        relatedTravel: chongqingId,
        type: 'photo',
      },
      locale: 'zh-TW',
      overrideAccess: true,
    })
  }

  for (const event of [
    { slug: 'local-hainan', travelSlug: '201307-hainan', year: 2013 },
    { slug: 'local-east-australia', travelSlug: '202308-east-australia', year: 2023 },
  ]) {
    await payload.create({
      collection: 'timeline-events',
      data: {
        eventDate: `${event.year}-01-01T00:00:00.000Z`,
        isPrivate: true,
        relatedTravel: requiredTravelId(targetBySlug, event.travelSlug),
        slug: event.slug,
        sourceType: 'travel',
        title: `Phase 17 local ${event.travelSlug}`,
        year: event.year,
      },
      locale: 'zh-TW',
      overrideAccess: true,
    })
  }

  await payload.updateGlobal({
    slug: 'home-config',
    data: {
      featuredTravel: chongqingId,
      heroTitle: 'Phase 17 local rehearsal',
    },
    locale: 'zh-TW',
    overrideAccess: true,
  })

  console.log(JSON.stringify({ createdTravels: targetBySlug.size, media: 12, timelineEvents: 2 }))
}

function assertDisposableLocalDatabase(databaseUri: string) {
  const url = new URL(databaseUri)
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !url.pathname.includes('phase17')) {
    throw new Error('Local fixture only accepts a localhost database whose name contains phase17')
  }
}

function requiredTravelId(targetBySlug: ReadonlyMap<string, number>, slug: string) {
  const id = targetBySlug.get(slug)
  if (!id) throw new Error(`Local fixture travel missing: ${slug}`)
  return id
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
