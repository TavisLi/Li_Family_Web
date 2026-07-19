import assert from 'node:assert/strict'
import type { Payload } from 'payload'

import { buildPayloadDryRun, sampleDryRunActions, summarizeDryRunActions } from './seed-dry-run'
import { buildTravelSeedTarget, travelSeedBaseProjection } from './travel-seed-target'

const summary = summarizeDryRunActions([
  { collection: 'users', key: 'tavis', action: 'update', existingId: 7 },
  { collection: 'travel-memories', key: '202602-thailand-phuket', action: 'create' },
  { collection: 'media', key: 'content-source/assets/members/tavis/tavis-avatar.jpeg', action: 'update', existingId: 42 },
  { collection: 'media', key: 'content-source/assets/members/tavis/tavis-hero.jpeg', action: 'skip', existingId: 43 },
  { collection: 'travel-plans', key: 'archived-plan', action: 'preserve', existingId: 44 },
  { collection: 'travel-plans', key: 'conflicted-plan', action: 'conflict', existingId: 45 },
])

assert.deepEqual(summary, {
  creates: 1,
  updates: 2,
  skips: 1,
  preserves: 1,
  conflicts: 1,
  deletes: 0,
})

assert.deepEqual(
  sampleDryRunActions([
    {
      collection: 'travel-plans',
      key: 'conflicted-plan',
      action: 'conflict',
      conflicts: [
        {
          field: 'sourceSections[resources].links',
          category: 'faithful-source-projection',
          base: [{ label: 'Base' }],
          source: [{ label: 'Source' }],
          current: [{ label: 'Admin' }],
        },
      ],
    },
  ]),
  [
    {
      collection: 'travel-plans',
      key: 'conflicted-plan',
      action: 'conflict',
      conflicts: [
        {
          field: 'sourceSections[resources].links',
          category: 'faithful-source-projection',
        },
      ],
    },
  ],
)

let catalogQuery = 0
const planningReport = await buildPayloadDryRun(
  {
    db: {
      drizzle: {
        async execute() {
          catalogQuery += 1
          return catalogQuery === 1
            ? { rows: [{ users: [], travels: [] }] }
            : { rows: [] }
        },
      },
    },
  } as unknown as Payload,
  {
    members: [],
    media: [],
    blogCategories: [],
    blogPosts: [],
    travels: [
      {
        slug: '202801-family-plan',
        title: '2028 家庭旅行計畫',
        status: 'planning',
        isPrivate: true,
        startDate: '2028-01-10',
        endDate: '2028-01-16',
        externalDocIdentifier: '202801家庭旅行7日.md',
        sourceSections: [
          {
            level: 2,
            title: '行前確認',
            anchor: 'preflight',
            body: '確認護照與行李。',
          },
        ],
      },
    ],
  },
)

assert.deepEqual(planningReport.actions, [
  {
    collection: 'travel-plans',
    key: '202801-family-plan',
    action: 'create',
    existingId: undefined,
    conflicts: undefined,
  },
])

const localizedPlanningTravel = {
  slug: '202801-family-plan',
  title: '2028 家庭旅行計畫',
  status: 'planning' as const,
  isPrivate: true,
  startDate: '2028-01-10',
  endDate: '2028-01-16',
  externalDocIdentifier: '202801家庭旅行7日.md',
  sourceSections: [
    {
      level: 2,
      title: '行前確認',
      anchor: 'preflight',
      body: '確認護照與行李。',
    },
  ],
}
const localizedPlanningTarget = buildTravelSeedTarget(
  localizedPlanningTravel,
  localizedPlanningTravel,
)
const localizedDryRunTarget = buildTravelSeedTarget(localizedPlanningTravel, {
  ...localizedPlanningTravel,
  coverImage: undefined,
  galleryImages: [],
  itineraryImages: [],
})
assert.deepEqual(localizedDryRunTarget.source, localizedPlanningTarget.source)
const localizedPlanningBase = {
  ...localizedPlanningTarget.source,
  title: { 'zh-TW': localizedPlanningTravel.title, en: '2028 Family Travel Plan' },
  planningSections: [
    {
      level: 2,
      title: { 'zh-TW': '行前確認', en: 'Preflight' },
      anchor: 'preflight',
      body: { 'zh-TW': '確認護照與行李。', en: 'Check passports and bags.' },
      interactions: {
        commentsEnabled: true,
        thumbsUpEnabled: true,
        thumbsDownEnabled: true,
      },
    },
  ],
}
let localizedCatalogQuery = 0
assert.deepEqual(
  travelSeedBaseProjection({ sourceMetadata: { baseProjection: localizedPlanningBase } }),
  localizedPlanningTarget.source,
)
const localizedPlanningReport = await buildPayloadDryRun(
  {
    db: {
      drizzle: {
        async execute() {
          localizedCatalogQuery += 1
          return localizedCatalogQuery === 1
            ? {
                rows: [
                  {
                    users: [],
                    travels: [
                      {
                        id: 302,
                        slug: localizedPlanningTravel.slug,
                        collection: 'travel-plans',
                        sourceMetadata: { baseProjection: localizedPlanningBase },
                      },
                    ],
                  },
                ],
              }
            : { rows: [] }
        },
      },
    },
    async find() {
      return {
        docs: [
          {
            id: 302,
            ...localizedPlanningTarget.source,
            sourceMetadata: { baseProjection: localizedPlanningBase },
          },
        ],
      }
    },
  } as unknown as Payload,
  {
    members: [],
    media: [],
    blogCategories: [],
    blogPosts: [],
    travels: [localizedPlanningTravel],
  },
)

assert.equal(localizedPlanningReport.actions[0]?.collection, 'travel-plans')
assert.equal(localizedPlanningReport.actions[0]?.action, 'skip')

let crossCollectionCatalogQuery = 0
let crossCollectionFindCalls = 0
const crossCollectionReport = await buildPayloadDryRun(
  {
    db: {
      drizzle: {
        async execute() {
          crossCollectionCatalogQuery += 1
          return crossCollectionCatalogQuery === 1
            ? {
                rows: [
                  {
                    users: [],
                    travels: [
                      {
                        id: 401,
                        slug: localizedPlanningTravel.slug,
                        collection: 'travel-memories',
                        sourceMetadata: { baseProjection: localizedPlanningBase },
                      },
                    ],
                  },
                ],
              }
            : { rows: [] }
        },
      },
    },
    async find() {
      crossCollectionFindCalls += 1
      return { docs: [] }
    },
  } as unknown as Payload,
  {
    members: [],
    media: [],
    blogCategories: [],
    blogPosts: [],
    travels: [localizedPlanningTravel],
  },
)

assert.equal(crossCollectionFindCalls, 0)
assert.deepEqual(crossCollectionReport.actions, [
  {
    collection: 'travel-plans',
    key: localizedPlanningTravel.slug,
    action: 'conflict',
    existingId: 401,
    conflicts: [
      {
        field: 'collection',
        category: 'identity-publication',
        base: 'travel-memories',
        source: 'travel-plans',
        current: 'travel-memories',
      },
    ],
  },
])
