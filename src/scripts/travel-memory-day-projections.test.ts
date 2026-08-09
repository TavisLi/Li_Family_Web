import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { parseTravelMarkdown, type MediaSeed } from './seed-content'
import { buildTravelMemoryDayProjections } from './travel-memory-day-projections'

const projectRoot = process.cwd()

const hainan = await parseTravelMarkdown(
  path.join(projectRoot, 'content-source/travels/201307海南島8日.md'),
)
const manifest = JSON.parse(
  await readFile(
    path.join(projectRoot, 'content-source/assets/travels/201307-hainan/manifest.json'),
    'utf8',
  ),
) as Array<{
  caption?: string
  day?: number
  location?: string
  ownerSlug: string
  sectionId?: string
  sortOrder?: number
  sourcePath: string
  time?: string
  usage: 'cover' | 'gallery' | 'itinerary'
}>

const hainanMedia: MediaSeed[] = manifest.map((item) => ({
  absolutePath: path.join(projectRoot, 'content-source/assets', item.sourcePath),
  altText: item.caption ?? item.sourcePath,
  caption: item.caption,
  day: item.day,
  location: item.location,
  ownerSlug: item.ownerSlug,
  ownerType: 'travel',
  sectionId: item.sectionId,
  sortOrder: item.sortOrder,
  sourcePath: `content-source/assets/${item.sourcePath}`,
  tags: [],
  time: item.time,
  usage: item.usage,
}))

const hainanProjection = buildTravelMemoryDayProjections(hainan, hainanMedia)
const hainanPhotos = hainanProjection.days.flatMap((day) =>
  day.moments.flatMap((moment) => moment.placements.filter((item) => item.type === 'photo')),
)

assert.equal(hainanProjection.days.length, 8)
assert.equal(hainanPhotos.length, 11)
assert.deepEqual(hainanProjection.unmatchedMedia, [])
assert.deepEqual(hainanProjection.unassignedVideos, [])
assert.equal('presentationStyle' in hainanProjection, false)

const day3 = hainanProjection.days.find((day) => day.dayKey === 'day-03')
assert.ok(day3)
assert.equal(
  day3.moments.find((moment) => moment.momentKey === 'nanshan-sea-guanyin')
    ?.placements[0]?.caption,
  '南山文化旅遊區的海上觀音。',
)
assert.equal(
  day3.moments.find((moment) => moment.momentKey === 'luhuitou-overlook')
    ?.placements[0]?.caption,
  '登上鹿回頭公園，俯瞰三亞灣與市區海岸線。',
)

const day8 = hainanProjection.days.find((day) => day.dayKey === 'day-08')
assert.ok(day8)
assert.equal(
  day8.moments.find(
    (moment) => moment.momentKey === 'shimei-bay-le-meridien-lagoon-pool',
  )?.time,
  '10:30',
)
assert.equal(
  day8.moments.find(
    (moment) => moment.momentKey === 'shimei-bay-le-meridien-beach',
  )?.time,
  '12:30',
)

const phuket = await parseTravelMarkdown(
  path.join(projectRoot, 'content-source/travels/202602泰國普吉島8日.md'),
)
const phuketProjection = buildTravelMemoryDayProjections(phuket, [])
assert.equal(phuketProjection.unassignedVideos.length, 0)
assert.equal(
  phuketProjection.days.flatMap((day) =>
    day.moments.flatMap((moment) =>
      moment.placements.filter((item) => item.type === 'youtube'),
    ),
  ).length,
  10,
)

const australia = await parseTravelMarkdown(
  path.join(projectRoot, 'content-source/travels/202308東澳全覽9日.md'),
)
const australiaProjection = buildTravelMemoryDayProjections(australia, [])
assert.equal(australiaProjection.unassignedVideos.length, 6)
for (const day of australiaProjection.days) {
  const keys = day.moments.map((moment) => moment.momentKey)
  assert.equal(
    new Set(keys).size,
    keys.length,
    `${day.dayKey} should not contain duplicate moment keys`,
  )
}

console.log('travel memory day projection tests passed')
