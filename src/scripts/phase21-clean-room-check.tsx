import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Payload } from 'payload'

import type { Media, TravelMemoryDay } from '@/payload/payload-types'
import {
  toTravelMemoryDayView, toTravelMemoryGallery, toTravelMemoryOverview,
  travelMemoryPresentationStyles, type TravelMemorySource,
} from '@/lib/travel-memory'
import {
  TravelMemoryDayPage, TravelMemoryGalleryPage, TravelMemoryOverviewPage,
} from '@/features/travel/travel-memory-pages'
import { buildScopedMemorySeedContent } from './seed-content'
import { buildTravelSeedTarget } from './travel-seed-target'
import { buildTravelMemoryDayProjections } from './travel-memory-day-projections'
import { buildPhase19TravelMemoryBackfillPlan } from './phase19-travel-memory-backfill'
import { buildPayloadDryRun } from './seed-dry-run'

// Local synthetic filesystem + fake read-only DB boundary, never Payload init.
// This is not a DB import, browser/access test, or Production health check.
const root = await mkdtemp(path.join(tmpdir(), 'phase21-clean-room-'))
const slug = '209904-clean-room-coast'
const requestedAlt = 'Synthetic blue square above a white line'
const requestedCaption = '我們一起記住的清晨'
try {
  const assetDirectory = path.join(root, 'content-source/assets/travels', slug)
  await mkdir(assetDirectory, { recursive: true })
  await mkdir(path.join(root, 'content-source/travels'), { recursive: true })
  await mkdir(path.join(root, 'docs'), { recursive: true })
  const template = (await readFile('docs/templates/travel-memory-source-template.md', 'utf8'))
    .replace('Clean-room journey [https://youtu.be/dQw4w9WgXcQ]',
      'Clean-room journey [https://youtu.be/dQw4w9WgXcQ]\n20260402 Daily film [https://youtu.be/aqz-KE-bpKQ]')
  await writeFile(path.join(root, 'content-source/travels/memory.md'), template)
  await writeFile(path.join(root, 'docs/travel-projects.md'), [
    '## Travel Memories', '### Synthetic coast',
    '- **呈現名稱**：Clean-room Family Coast Memory',
    `- **Canonical slug**：\`${slug}\``,
    '- **Source**：`content-source/travels/memory.md`',
  ].join('\n'))
  // A valid tiny PNG is sufficient for a filesystem/projection test; no upload.
  await writeFile(path.join(assetDirectory, 'coast.png'), Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64',
  ))
  await writeFile(path.join(assetDirectory, 'manifest.json'), JSON.stringify([{
    sourcePath: `travels/${slug}/coast.png`, ownerType: 'travel', ownerSlug: slug,
    usage: 'itinerary', day: 2, sectionId: 'dawn', time: '06:30',
    location: '海風鎮', altText: requestedAlt, caption: requestedCaption,
  }]))

  const content = await buildScopedMemorySeedContent(root, [slug])
  assert.equal(content.travels.length, 1)
  assert.equal(content.media.length, 1)
  assert.deepEqual([content.members, content.blogPosts, content.blogCategories], [[], [], []])
  const travel = content.travels[0]!
  const asset = content.media[0]!
  assert.equal(travel.isPrivate, true)
  assert.equal(travel.startDate, '2026-04-01')
  assert.equal(asset.caption, requestedCaption)
  assert.equal(asset.altText, requestedAlt, 'manifest altText must not be replaced by caption')
  const manifestPath = path.join(assetDirectory, 'manifest.json')
  const manifest = await readFile(manifestPath, 'utf8')
  const withoutAlt = JSON.parse(manifest) as Record<string, unknown>[]
  delete withoutAlt[0]!.altText
  await writeFile(manifestPath, JSON.stringify(withoutAlt))
  await assert.rejects(buildScopedMemorySeedContent(root, [slug]), /altText/)
  withoutAlt[0]!.altText = '  '
  await writeFile(manifestPath, JSON.stringify(withoutAlt))
  await assert.rejects(buildScopedMemorySeedContent(root, [slug]))
  await writeFile(manifestPath, manifest)
  const projection = buildTravelMemoryDayProjections(travel, content.media)
  assert.deepEqual(projection.unmatchedMedia, [])
  assert.deepEqual(projection.duplicatePlacements, [])
  assert.equal(projection.days.length, 2)
  assert.equal(projection.unassignedVideos.length, 1, 'the template video belongs to the whole trip')
  const sourcePlacement = projection.days[1]!.moments.flatMap(moment => moment.placements)[0]!
  assert.equal(sourcePlacement.caption, requestedCaption)
  assert.equal(sourcePlacement.mediaSourcePath, asset.sourcePath)

  const target = buildTravelSeedTarget(travel, travel)
  assert.equal(target.source.sourceFormat, undefined, 'parser discriminator is not runtime content')
  const parentId = 901
  const mediaId = 902
  const plan = buildPhase19TravelMemoryBackfillPlan({
    travels: content.travels, mediaItems: content.media,
    memories: [{ id: parentId, slug, presentationStyle: null }],
    mediaIdsBySourcePath: new Map([[asset.sourcePath, mediaId]]), currentDays: [],
  })
  assert.deepEqual(plan.missingMedia, [])
  assert.deepEqual(plan.missingMemories, [])
  assert.deepEqual(plan.duplicatePlacements, [])
  assert.deepEqual(plan.styleUpdates, [], 'new slug does not need a style whitelist entry')
  assert.equal(plan.dayCreates.length, 2)
  assert.ok(plan.dayPlans.every(day => day.action === 'create'))

  async function dryRun(
    parentCollection: 'travel-memories' | 'travel-plans' | null,
    mediaExists = true,
    seed = content,
    currentDays: Record<string, unknown>[] = [],
  ) {
    let queries = 0
    const fakePayload = {
      db: { drizzle: { async execute() {
        queries += 1
        if (queries === 1) return { rows: [{ users: [], travels: parentCollection
          ? [{ id: parentId, slug, collection: parentCollection }] : [] }] }
        assert.equal(queries, 2, 'unexpected DB query')
        return { rows: mediaExists ? [{ id: mediaId, type: 'photo', source_path: asset.sourcePath,
          alt_text: asset.altText, tags: asset.tags }] : [] }
      } } },
      async find(args: { collection: string }) {
        assert.equal(args.collection, 'travel-memory-days')
        return { docs: currentDays }
      },
    } as unknown as Payload // Fake only at the DB boundary, not domain helpers.
    const result = await buildPayloadDryRun(fakePayload, seed)
    assert.equal(queries, 2)
    assert.ok(result.actions.every(action => ['media', 'travel-memories', 'travel-memory-days'].includes(action.collection)))
    assert.equal(result.summary.deletes, 0)
    return result
  }
  const emptyCatalog = await dryRun(null)
  assert.ok(emptyCatalog.actions.some(action => action.collection === 'travel-memories' && action.action === 'create'))
  const firstRunDays = emptyCatalog.actions.filter(action => action.collection === 'travel-memory-days')
  assert.deepEqual(firstRunDays.map(action => action.key), [`${slug}:day-01`, `${slug}:day-02`])
  assert.ok(firstRunDays.every(action => action.action === 'create' && action.existingId === undefined))
  assert.deepEqual(firstRunDays[0]?.dependsOn, [{ collection: 'travel-memories', key: slug }])
  assert.deepEqual(firstRunDays[1]?.dependsOn, [{ collection: 'travel-memories', key: slug }])
  assert.equal(emptyCatalog.summary.creates, 3)
  const newMedia = await dryRun(null, false)
  assert.equal(newMedia.summary.creates, 4)
  assert.equal(newMedia.summary.conflicts, 0)
  assert.deepEqual(
    newMedia.actions.find(action => action.key === `${slug}:day-02`)?.dependsOn,
    [
      { collection: 'travel-memories', key: slug },
      { collection: 'media', key: asset.sourcePath },
    ],
  )
  const existingParent = await dryRun('travel-memories')
  assert.equal(existingParent.actions.filter(action => action.collection === 'travel-memory-days' && action.action === 'create').length, 2)
  const existingParentNewMedia = await dryRun('travel-memories', false)
  assert.equal(existingParentNewMedia.summary.conflicts, 0)
  assert.deepEqual(
    existingParentNewMedia.actions.find(action => action.key === `${parentId}:day-02`)?.dependsOn,
    [{ collection: 'media', key: asset.sourcePath }],
  )
  const currentOnlyDay = {
    ...plan.dayCreates[1], id: 999, dayIdentity: `${parentId}:day-02`,
    title: 'Admin-only preserved title', sourceMetadata: null,
  }
  const preservedWithNewMedia = await dryRun('travel-memories', false, content, [currentOnlyDay])
  const preservedDay = preservedWithNewMedia.actions.find(action => action.key === `${parentId}:day-02`)
  assert.equal(preservedDay?.action, 'preserve')
  assert.deepEqual(preservedDay?.dependsOn, [{ collection: 'media', key: asset.sourcePath }])
  const collision = await dryRun('travel-plans')
  assert.equal(collision.summary.conflicts, 1)
  assert.equal(collision.actions.filter(action => action.collection === 'travel-memory-days').length, 0)
  assert.deepEqual(collision.actions.find(action => action.collection === 'travel-memories')?.conflicts?.map(item => item.field), ['collection'])
  const unmatchedMedia = { ...asset, day: 99, sectionId: 'outside-trip' }
  const unmatched = await dryRun(null, true, { ...content, media: [unmatchedMedia] })
  assert.equal(unmatched.summary.conflicts, 1)
  assert.deepEqual(unmatched.actions.find(action => action.action === 'conflict')?.conflicts?.map(item => item.field), ['moments.placements.media'])
  const duplicated = await dryRun(null, true, { ...content, media: [asset, { ...asset }] })
  assert.equal(duplicated.summary.conflicts, 1)
  assert.deepEqual(duplicated.actions.find(action => action.action === 'conflict')?.conflicts?.map(item => item.field), ['moments.placements'])

  // Synthetic hydrated documents from real materialized projections. No claim
  // that Payload validators/hooks/access controls have been exercised here.
  const media: Media = { id: mediaId, altText: asset.altText, type: 'photo',
    url: '/synthetic-coast.png', width: 1, height: 1, createdAt: '', updatedAt: '' }
  const days = plan.dayCreates.map((row, index) => {
    const day = { ...row, id: 910 + index, createdAt: '', updatedAt: '' } as unknown as TravelMemoryDay
    return { ...day, moments: day.moments?.map(moment => ({ ...moment,
      placements: moment.placements?.map(placement => ({ ...placement,
        ...(placement.type === 'photo' ? { media } : {}),
      })),
    })) }
  })
  const rendered: string[] = []
  for (const style of travelMemoryPresentationStyles) {
    const memory = { ...target.data, presentationStyle: style } as unknown as TravelMemorySource
    const overview = renderToStaticMarkup(<TravelMemoryOverviewPage memory={toTravelMemoryOverview(memory, days)} />)
    for (const value of ['Alex', 'EX101', '08:00', '09:10', 'Example Air', '海風家庭旅店', `/travel/${slug}/day/day-02`]) {
      assert.ok(overview.includes(value), `${style} Overview: ${value}`)
    }
    for (const day of days) {
      const view = toTravelMemoryDayView(memory, day, days)
      assert.ok(view)
      const html = renderToStaticMarkup(<TravelMemoryDayPage view={view} />)
      assert.ok(html.includes('接駁車'))
      if (day.day === 2) assert.ok(html.includes(requestedCaption))
      rendered.push(`${style}/day/${day.dayKey}`)
    }
    const gallery = toTravelMemoryGallery(memory, days)
    assert.equal(gallery.items.filter(item => item.type === 'photo').length, 1)
    assert.equal(gallery.items.filter(item => item.type === 'youtube').length, 2, 'daily film is deduplicated against parent videos')
    const html = renderToStaticMarkup(<TravelMemoryGalleryPage gallery={gallery} />)
    assert.ok(html.includes(requestedCaption))
    assert.ok(html.includes(`alt="${requestedAlt}"`))
    assert.ok(html.includes(`/travel/${slug}/day/day-02`))
    const selected = toTravelMemoryGallery(memory, days, { dayKey: 'day-02', type: 'youtube' })
    assert.equal(selected.items.length, 1, 'only the daily film belongs to the selected day')
    assert.equal(selected.items[0]?.type, 'youtube')
    assert.equal(selected.items[0]?.dayKey, 'day-02')
    assert.equal(toTravelMemoryGallery(memory, days, { dayKey: 'day-01', type: 'youtube' }).items.length, 0)
    rendered.push(`${style}/overview`, `${style}/photos`)
  }
  console.log(JSON.stringify({
    status: 'LOCAL_CLEAN_ROOM_PROJECTION_PASS',
    scope: slug, requestedAlt, actualAlt: asset.altText,
    mediaReadyBeforeParent: emptyCatalog.summary,
    newParentAndMedia: newMedia.summary,
    existingParent: existingParent.summary,
    existingParentAndNewMedia: existingParentNewMedia.summary,
    preservedCurrentAndNewMedia: preservedWithNewMedia.summary,
    collision: collision.summary,
    invalidMedia: { unmatched: unmatched.summary, duplicate: duplicated.summary },
    dependencyContract: 'collection+stable key only; no synthetic database IDs',
    rendered,
    productionConnections: 0, persistentWrites: 0,
    exclusions: ['real Payload import/hooks/access', 'browser/layout/image loading', 'R2/YouTube requests', 'Production'],
  }, null, 2))
} finally {
  await rm(root, { recursive: true })
}
