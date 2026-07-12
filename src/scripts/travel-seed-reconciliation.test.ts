import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  buildTravelProjection,
  classifyTravelField,
  reconciliationModeFromArgs,
  reconcileTravelSeed,
  travelProjectionHash,
  writePayloadTravelDraft,
} from './travel-seed-reconciliation'

const plan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  base: { summary: '舊版摘要' },
  source: { summary: '來源新版摘要' },
  current: { summary: '舊版摘要' },
  mode: 'safe',
})

assert.equal(plan.action, 'apply-source')
assert.deepEqual(plan.patch, { summary: '來源新版摘要' })
assert.deepEqual(plan.conflicts, [])

const adminEditPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: '來源摘要' },
  source: { summary: '來源摘要' },
  current: { summary: 'Admin 修正版摘要' },
})

assert.equal(adminEditPlan.action, 'preserve-current')
assert.deepEqual(adminEditPlan.patch, {})

const conflictPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { sourceSections: [{ anchor: 'day-1', body: '原行程' }] },
  source: { sourceSections: [{ anchor: 'day-1', body: '來源改版行程' }] },
  current: { sourceSections: [{ anchor: 'day-1', body: 'Admin 改版行程' }] },
})

assert.equal(conflictPlan.action, 'conflict')
assert.equal(conflictPlan.conflicts[0]?.field, 'sourceSections[day-1].body')
assert.equal(conflictPlan.conflicts[0]?.category, 'faithful-source-projection')
assert.deepEqual(conflictPlan.patch, {})

const partialSafePlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base', status: 'planning' },
  source: { summary: 'Source', status: 'completed' },
  current: { summary: 'Payload', status: 'planning' },
})

assert.equal(partialSafePlan.action, 'conflict')
assert.deepEqual(partialSafePlan.patch, { status: 'completed' })

const sourceWinsPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base' },
  source: { summary: 'Source' },
  current: { summary: 'Payload' },
  mode: 'source-wins',
})

assert.equal(sourceWinsPlan.action, 'apply-source')
assert.deepEqual(sourceWinsPlan.patch, { summary: 'Source' })

const payloadWinsPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: { summary: 'Base' },
  source: { summary: 'Source' },
  current: { summary: 'Payload' },
  mode: 'payload-wins',
})

assert.equal(payloadWinsPlan.action, 'preserve-current')

assert.equal(
  reconcileTravelSeed({
    slug: '202702-thailand-phuket',
    base: { summary: 'Base' },
    source: { summary: '共同新版' },
    current: { summary: '共同新版' },
  }).action,
  'already-converged',
)

assert.equal(
  reconcileTravelSeed({
    slug: 'new-planning-travel',
    source: { status: 'planning' },
  }).action,
  'create',
)

const legacyPlan = reconcileTravelSeed({
  slug: '202607-chongqing-yangtze-river',
  source: { summary: 'Source' },
  current: { summary: 'Payload Admin' },
})

assert.equal(legacyPlan.action, 'preserve-current')

const normalized = buildTravelProjection({
  id: 42,
  slug: '202702-thailand-phuket',
  startDate: '2027-02-02T00:00:00.000Z',
  coverImage: { id: 7, altText: 'cover' },
  sourceSections: [{ id: 'row-id', anchor: 'day-1', body: '行程' }],
  sourceMetadata: { parserVersion: 'old' },
})

assert.deepEqual(normalized, {
  slug: '202702-thailand-phuket',
  startDate: '2027-02-02',
  coverImage: 7,
  sourceSections: [{ anchor: 'day-1', body: '行程' }],
})
assert.equal(travelProjectionHash(normalized), travelProjectionHash({ ...normalized }))

assert.deepEqual(
  buildTravelProjection({
    flights: [{ airline: null, flightNumber: 'BR1' }],
  }),
  buildTravelProjection({
    flights: [{ flightNumber: 'BR1' }],
  }),
)

const adminLinkLabelPlan = reconcileTravelSeed({
  slug: '202702-thailand-phuket',
  base: {
    sourceSections: [
      { anchor: 'resources', links: [{ label: 'https://example.com', url: 'https://example.com' }] },
    ],
  },
  source: {
    sourceSections: [
      { anchor: 'resources', links: [{ label: 'https://example.com', url: 'https://example.com' }] },
    ],
  },
  current: {
    sourceSections: [
      { anchor: 'resources', links: [{ label: 'Admin 編輯標籤', url: 'https://example.com' }] },
    ],
  },
})

assert.equal(adminLinkLabelPlan.action, 'preserve-current')
assert.deepEqual(adminLinkLabelPlan.patch, {})
assert.equal(reconciliationModeFromArgs(['node', 'seed.ts']), 'safe')
assert.equal(reconciliationModeFromArgs(['node', 'seed.ts', '--source-wins']), 'source-wins')
assert.throws(
  () => reconciliationModeFromArgs(['node', 'seed.ts', '--source-wins', '--payload-wins']),
  /only one travel reconciliation mode/i,
)

const artifactRoot = await mkdtemp(path.join(tmpdir(), 'phase-16-export-'))
const draftPath = await writePayloadTravelDraft({
  artifactRoot,
  slug: '202702-thailand-phuket',
  sourceFile: 'content-source/travels/202702泰國普吉島7日.md',
  current: { summary: 'Payload Admin 修正版' },
})
const draft = await readFile(draftPath, 'utf8')

assert.match(draftPath, /\.payload-draft\.md$/)
assert.match(draft, /Payload Admin 修正版/)
assert.doesNotMatch(draftPath, /content-source\/travels/)
assert.equal(classifyTravelField('galleryImages'), 'media-projection')
assert.equal(classifyTravelField('dailyItinerary'), 'structured-display-projection')
