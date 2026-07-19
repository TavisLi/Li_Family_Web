import assert from 'node:assert/strict'

import {
  attachCreatedArrayIds,
  assertTravelCopyApplyPreconditions,
  assertTravelCopyDocuments,
  assertTravelCopyWriteApproval,
  buildTravelCopyApprovalToken,
  executeTravelCollectionCopy,
  materializeTravelLocale,
} from './travel-collection-copy-package'

const localizedDraft = {
  title: { 'zh-TW': '普吉島', en: 'Phuket' },
  planningSections: [
    {
      anchor: 'overview',
      title: { 'zh-TW': '概覽', en: 'Overview' },
      links: [{ label: { 'zh-TW': '官網', en: 'Official site' }, url: 'https://example.com' }],
    },
  ],
  sourceMetadata: {
    baseProjection: {
      title: { 'zh-TW': '遷移證據', en: 'Migration evidence' },
    },
  },
}

assert.deepEqual(materializeTravelLocale(localizedDraft, 'en'), {
  title: 'Phuket',
  planningSections: [
    {
      anchor: 'overview',
      title: 'Overview',
      links: [{ label: 'Official site', url: 'https://example.com' }],
    },
  ],
  sourceMetadata: localizedDraft.sourceMetadata,
})

assert.deepEqual(
  materializeTravelLocale({ title: { 'zh-TW': '只有中文' } }, 'en'),
  { title: '只有中文' },
  'missing English values must fall back to Chinese so required localized fields remain valid',
)

assert.deepEqual(
  attachCreatedArrayIds(
    {
      planningSections: [{ title: 'Overview', links: [{ label: 'Official site' }] }],
    },
    {
      planningSections: [
        { id: 'section-1', title: '概覽', links: [{ id: 'link-1', label: '官網' }] },
      ],
    },
  ),
  {
    planningSections: [
      {
        id: 'section-1',
        title: 'Overview',
        links: [{ id: 'link-1', label: 'Official site' }],
      },
    ],
  },
)

assert.throws(
  () => attachCreatedArrayIds({ rows: [{ title: 'one' }] }, { rows: [] }),
  /array shape changed/,
)

const token = buildTravelCopyApprovalToken({
  migrations: ['migration-b', 'migration-a'],
  projects: [
    { sourceId: 2, slug: 'beta', targetCollection: 'travel-memories' },
    { sourceId: 1, slug: 'alpha', targetCollection: 'travel-plans' },
  ],
  references: { media: 12, timelineEvents: 2, featuredTravel: 1 },
})
assert.throws(
  () =>
    assertTravelCopyApplyPreconditions({
      appliedMigrations: [],
      recordBlockers: 0,
      targetRows: { travelMemories: 0, travelPlans: 0, travelRouteIdentities: 0 },
    }),
  /migrations missing/,
)
assert.throws(
  () =>
    assertTravelCopyApplyPreconditions({
      appliedMigrations: [
        '20260715_073322_phase_17_add_travel_collections',
        '20260715_094310_phase_17_expand_travel_memory_preservation',
        '20260716_045235_phase_17_align_travel_plan_sections',
        '20260716_091228_phase_17_align_travel_memory_sections',
        '20260716_094718_phase_17_add_travel_cutover_relationships',
      ],
      recordBlockers: 0,
      targetRows: { travelMemories: 0, travelPlans: 1, travelRouteIdentities: 0 },
    }),
  /targets must be empty/,
)
assert.match(token, /^phase-17-copy:[a-f0-9]{16}$/)
assert.throws(
  () =>
    assertTravelCopyWriteApproval({
      allowWrite: false,
      expectedTarget: 'db:test',
      expectedToken: token,
      providedTarget: 'db:test',
      providedToken: token,
    }),
  /requires --allow-write/,
)
assert.throws(
  () =>
    assertTravelCopyWriteApproval({
      allowWrite: true,
      expectedTarget: 'db:test',
      expectedToken: token,
      providedTarget: 'db:test',
      providedToken: 'wrong',
    }),
  /confirmation mismatch/,
)
assert.doesNotThrow(() =>
  assertTravelCopyWriteApproval({
    allowWrite: true,
    expectedTarget: 'db:test',
    expectedToken: token,
    providedTarget: 'db:test',
    providedToken: token,
  }),
)
assert.throws(
  () =>
    assertTravelCopyWriteApproval({
      allowWrite: true,
      expectedTarget: 'db:expected',
      expectedToken: token,
      providedTarget: 'db:other',
      providedToken: token,
    }),
  /target mismatch/,
)
assert.equal(
  token,
  buildTravelCopyApprovalToken({
    migrations: ['migration-a', 'migration-b'],
    projects: [
      { sourceId: 1, slug: 'alpha', targetCollection: 'travel-plans' },
      { sourceId: 2, slug: 'beta', targetCollection: 'travel-memories' },
    ],
    references: { media: 12, timelineEvents: 2, featuredTravel: 1 },
  }),
)
assert.notEqual(
  buildTravelCopyApprovalToken({
    migrations: ['migration-a'],
    projects: [
      {
        sourceId: 1,
        slug: 'alpha',
        targetCollection: 'travel-plans',
        data: { title: 'before' },
      },
    ],
    references: { media: 1, timelineEvents: 0, featuredTravel: 0 },
    referenceMappings: {
      featuredTravelSourceId: null,
      media: [{ id: 10, sourceTravelId: 1 }],
      timelineEvents: [],
    },
  }),
  buildTravelCopyApprovalToken({
    migrations: ['migration-a'],
    projects: [
      {
        sourceId: 1,
        slug: 'alpha',
        targetCollection: 'travel-plans',
        data: { title: 'after' },
      },
    ],
    references: { media: 1, timelineEvents: 0, featuredTravel: 0 },
    referenceMappings: {
      featuredTravelSourceId: null,
      media: [{ id: 10, sourceTravelId: 1 }],
      timelineEvents: [],
    },
  }),
  'approval token must change when copied content changes even if row counts stay the same',
)

const calls: Record<string, unknown>[] = []
let nextId = 100
const payload = {
  async create(args: Record<string, unknown>) {
    calls.push({ operation: 'create', ...args })
    return { ...(args.data as Record<string, unknown>), id: nextId++ }
  },
  async update(args: Record<string, unknown>) {
    calls.push({ operation: 'update', ...args })
    return { id: args.id }
  },
  async updateGlobal(args: Record<string, unknown>) {
    calls.push({ operation: 'updateGlobal', ...args })
    return { id: 1 }
  },
}
const req = { transactionID: 'test-transaction' }
const execution = await executeTravelCollectionCopy({
  manifest: [
    {
      sourceId: 7,
      slug: 'alpha',
      targetCollection: 'travel-plans',
      data: { title: { 'zh-TW': '甲', en: 'Alpha' }, slug: 'alpha' },
    },
  ],
  payload,
  references: {
    featuredTravelSourceId: 7,
    media: [{ id: 11, sourceTravelId: 7 }],
    timelineEvents: [{ id: 12, sourceTravelId: 7 }],
  },
  req,
})
assert.deepEqual(execution, {
  copied: 1,
  references: { featuredTravel: 1, media: 1, timelineEvents: 1 },
})
assert.equal(calls.length, 5)
assert.deepEqual(calls[0], {
  operation: 'create',
  collection: 'travel-plans',
  data: { title: '甲', slug: 'alpha' },
  locale: 'zh-TW',
  overrideAccess: true,
  req,
})
assert.deepEqual((calls[2]?.data as Record<string, unknown>).relatedTravelRecord, {
  relationTo: 'travel-plans',
  value: 100,
})
assert.deepEqual((calls[4]?.data as Record<string, unknown>).featuredTravelRecord, {
  relationTo: 'travel-plans',
  value: 100,
})

assert.doesNotThrow(() =>
  assertTravelCopyDocuments(
    [
      {
        sourceId: 7,
        slug: 'alpha',
        targetCollection: 'travel-plans',
        data: {
          title: { 'zh-TW': '甲', en: 'Alpha' },
          planningSections: [{ anchor: 'overview', title: { 'zh-TW': '概覽', en: 'Overview' } }],
        },
      },
    ],
    new Map([
      [
        'travel-plans:alpha',
        {
          id: 100,
          title: { 'zh-TW': '甲', en: 'Alpha' },
          planningSections: [
            { id: 'row-1', anchor: 'overview', title: { 'zh-TW': '概覽', en: 'Overview' } },
          ],
          createdAt: 'ignored',
        },
      ],
    ]),
  ),
)
assert.throws(
  () =>
    assertTravelCopyDocuments(
      [
        {
          sourceId: 7,
          slug: 'alpha',
          targetCollection: 'travel-plans',
          data: { title: { 'zh-TW': '甲', en: 'Alpha' } },
        },
      ],
      new Map([
        [
          'travel-plans:alpha',
          { title: { 'zh-TW': '甲', en: 'Wrong' } },
        ],
      ]),
    ),
  /content verification failed/,
)

console.log('travel collection copy package tests passed')
