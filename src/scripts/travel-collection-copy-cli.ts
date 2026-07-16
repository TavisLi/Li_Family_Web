import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'

import { sql } from '@payloadcms/db-postgres'

import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import type { TravelProject } from '@/payload/payload-types'
import { buildTravelSeedContent } from './seed-content'
import { assessTravelProjectCopy } from './travel-collection-copy-readiness'
import {
  assertTravelCopyApplyPreconditions,
  assertTravelCopyDocuments,
  assertTravelCopyReadbackApproval,
  assertTravelCopyWriteApproval,
  buildTravelCopyApprovalToken,
  buildTravelCopyManifest,
  executeTravelCollectionCopy,
  travelCopyMigrationNames,
  type TravelCopyPayload,
  type TravelCopyReferences,
} from './travel-collection-copy-package'

const require = createRequire(import.meta.url)
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => {
    connect(): Promise<DatabaseClient>
    end(): Promise<void>
  }
}

type QueryResult<Row> = { rows: Row[] }
type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>
  release(): void
}

async function run() {
  const mode = process.argv[2]
  if (mode !== 'inspect' && mode !== 'apply' && mode !== 'verify') {
    throw new Error('Usage: travel-collection-copy-cli.ts <inspect|apply|verify> [--allow-write]')
  }

  const root = process.cwd()
  await loadLocalEnv(root)
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Travel copy package refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const packageState = await collectPackageState(payload, databaseUri, root)

  if (mode === 'inspect') {
    console.log(JSON.stringify({ mode, ...packageState.publicState }, null, 2))
    return
  }

  if (mode === 'verify') {
    assertTravelCopyReadbackApproval({
      expectedTarget: packageState.databaseFingerprint,
      expectedToken: packageState.approvalToken,
      providedTarget: process.env.TRAVEL_COPY_TARGET_CONFIRM,
      providedToken: process.env.TRAVEL_COPY_WRITE_CONFIRM,
    })
    await assertVerified(packageState, payload)
    console.log(JSON.stringify({ mode, verified: true, ...packageState.publicState }, null, 2))
    return
  }

  assertTravelCopyApplyPreconditions({
    appliedMigrations: packageState.sql.appliedMigrations,
    recordBlockers: packageState.recordBlockers,
    targetRows: packageState.sql.targetRows,
  })
  assertTravelCopyWriteApproval({
    allowWrite: process.argv.includes('--allow-write'),
    expectedTarget: packageState.databaseFingerprint,
    expectedToken: packageState.approvalToken,
    providedTarget: process.env.TRAVEL_COPY_TARGET_CONFIRM,
    providedToken: process.env.TRAVEL_COPY_WRITE_CONFIRM,
  })

  const req = await createLocalReq({ fallbackLocale: false, locale: 'zh-TW' }, payload)
  const startedTransaction = await initTransaction(req)
  if (!startedTransaction) throw new Error('Travel copy could not start an isolated transaction')

  try {
    await lockTravelCopyTables(payload, req)
    await assertTargetsEmptyInTransaction(payload, req)
    const transactionState = await collectTransactionalCopyState({
      databaseFingerprint: packageState.databaseFingerprint,
      implementationFingerprint: packageState.implementationFingerprint,
      migrationFingerprints: packageState.migrationFingerprints,
      payload,
      req,
      root,
    })
    if (transactionState.approvalToken !== packageState.approvalToken) {
      throw new Error('Travel copy source changed after approval; transaction refused')
    }
    const result = await executeTravelCollectionCopy({
      manifest: transactionState.manifest,
      payload: payload as unknown as TravelCopyPayload,
      references: transactionState.references,
      req,
    })
    await commitTransaction(req)
    console.log(JSON.stringify({ mode, committed: true, result }, null, 2))
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

async function lockTravelCopyTables(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
) {
  const transactionID = await req.transactionID
  const database = payload.db as unknown as {
    sessions?: Record<string, { db?: { execute(query: unknown): Promise<unknown> } }>
  }
  const transaction = transactionID ? database.sessions?.[transactionID]?.db : undefined
  if (!transaction) throw new Error('Travel copy transaction session is unavailable')
  await transaction.execute(sql.raw(`
    lock table
      travel_projects,
      media,
      timeline_events,
      home_config,
      travel_plans,
      travel_memories,
      travel_route_identities
    in share row exclusive mode
  `))
}

async function collectTransactionalCopyState(input: {
  databaseFingerprint: string
  implementationFingerprint: string
  migrationFingerprints: readonly { name: string; sha256: string }[]
  payload: Payload
  req: Awaited<ReturnType<typeof createLocalReq>>
  root: string
}) {
  const sourceBySlug = new Map(
    (await buildTravelSeedContent(input.root)).map((travel) => [travel.slug, travel]),
  )
  const legacy = await input.payload.find({
    collection: 'travel-projects',
    depth: 0,
    fallbackLocale: false,
    limit: 100,
    locale: 'all',
    overrideAccess: true,
    pagination: false,
    req: input.req,
    sort: 'id',
  })
  const manifest = buildTravelCopyManifest(
    legacy.docs as unknown as TravelProject[],
    sourceBySlug,
  )
  const references = await collectLegacyReferencesWithPayload(input.payload, input.req)
  const approvalToken = buildTravelCopyApprovalToken({
    databaseFingerprint: input.databaseFingerprint,
    implementationFingerprint: input.implementationFingerprint,
    migrationFingerprints: input.migrationFingerprints,
    migrations: travelCopyMigrationNames,
    projects: manifest,
    referenceMappings: references,
    references: {
      featuredTravel: references.featuredTravelSourceId === null ? 0 : 1,
      media: references.media.length,
      timelineEvents: references.timelineEvents.length,
    },
  })
  return { approvalToken, manifest, references }
}

async function collectLegacyReferencesWithPayload(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
): Promise<TravelCopyReferences> {
  const [media, timelineEvents, home] = await Promise.all([
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      req,
      where: { relatedTravel: { exists: true } },
    }),
    payload.find({
      collection: 'timeline-events',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      req,
      where: { relatedTravel: { exists: true } },
    }),
    payload.findGlobal({
      slug: 'home-config',
      depth: 0,
      overrideAccess: true,
      req,
    }),
  ])
  return {
    featuredTravelSourceId: relationshipId(home.featuredTravel),
    media: media.docs.flatMap((doc) => {
      const sourceTravelId = relationshipId(doc.relatedTravel)
      return sourceTravelId === null ? [] : [{ id: doc.id, sourceTravelId }]
    }),
    timelineEvents: timelineEvents.docs.flatMap((doc) => {
      const sourceTravelId = relationshipId(doc.relatedTravel)
      return sourceTravelId === null ? [] : [{ id: doc.id, sourceTravelId }]
    }),
  }
}

function relationshipId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'number') {
    return value.id
  }
  return null
}

async function assertTargetsEmptyInTransaction(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
) {
  const results = await Promise.all(
    (['travel-plans', 'travel-memories', 'travel-route-identities'] as const).map(
      (collection) =>
        payload.find({
          collection,
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          req,
        }),
    ),
  )
  if (results.some((result) => result.totalDocs !== 0)) {
    throw new Error('Travel copy targets changed after approval; transaction refused')
  }
}

async function collectPackageState(payload: Payload, databaseUri: string, root: string) {
  const sourceBySlug = new Map(
    (await buildTravelSeedContent(root)).map((travel) => [travel.slug, travel]),
  )
  const legacy = await payload.find({
    collection: 'travel-projects',
    depth: 0,
    fallbackLocale: false,
    limit: 100,
    locale: 'all',
    overrideAccess: true,
    pagination: false,
    sort: 'id',
  })
  const projects = legacy.docs as unknown as TravelProject[]
  const assessments = projects.map((project) =>
    assessTravelProjectCopy(project, new Date(), sourceBySlug.get(project.slug)),
  )
  const recordBlockers = assessments.reduce(
    (total, assessment) => total + assessment.blockers.length,
    0,
  )
  const manifest = recordBlockers === 0 ? buildTravelCopyManifest(projects, sourceBySlug) : []
  const references = await collectLegacyReferences(databaseUri)
  const sql = await readSqlState(databaseUri)
  const referenceCounts = {
    featuredTravel: references.featuredTravelSourceId === null ? 0 : 1,
    media: references.media.length,
    timelineEvents: references.timelineEvents.length,
  }
  const databaseFingerprint = buildDatabaseFingerprint(databaseUri)
  const implementationFingerprint = await readImplementationFingerprint(root)
  const migrationFingerprints = await readMigrationFingerprints(root)
  const approvalToken = buildTravelCopyApprovalToken({
    databaseFingerprint,
    implementationFingerprint,
    migrations: travelCopyMigrationNames,
    migrationFingerprints,
    projects: manifest,
    references: referenceCounts,
    referenceMappings: references,
  })

  return {
    approvalToken,
    databaseFingerprint,
    implementationFingerprint,
    migrationFingerprints,
    manifest,
    recordBlockers,
    references,
    sql,
    publicState: {
      approvalToken,
      databaseFingerprint,
      appliedMigrations: sql.appliedMigrations,
      missingMigrations: travelCopyMigrationNames.filter(
        (name) => !sql.appliedMigrations.includes(name),
      ),
      projects: assessments.map((assessment) => ({
        blockers: assessment.blockers,
        slug: assessment.slug,
        targetCollection: assessment.targetCollection,
      })),
      recordBlockers,
      references: referenceCounts,
      shadowReferences: sql.shadowReferences,
      shadowReferenceMappings: sql.shadowReferenceMappings,
      targetRows: sql.targetRows,
      targetSlugs: sql.targetSlugs,
      writeCommand:
        `TRAVEL_COPY_TARGET_CONFIRM=${databaseFingerprint} ` +
        `TRAVEL_COPY_WRITE_CONFIRM=${approvalToken} ` +
        'pnpm run seed:travel:copy apply -- --allow-write',
    },
  }
}

function buildDatabaseFingerprint(databaseUri: string) {
  const parsed = new URL(databaseUri)
  const identity = [
    parsed.protocol,
    parsed.username,
    parsed.hostname,
    parsed.port,
    parsed.pathname,
  ].join('|')
  return `db:${createHash('sha256').update(identity).digest('hex').slice(0, 12)}`
}

async function readMigrationFingerprints(root: string) {
  return Promise.all(
    travelCopyMigrationNames.map(async (name) => {
      const contents = await Promise.all(
        ['ts', 'json'].map((extension) =>
          readFile(path.join(root, 'src/migrations', `${name}.${extension}`)),
        ),
      )
      return {
        name,
        sha256: createHash('sha256').update(Buffer.concat(contents)).digest('hex'),
      }
    }),
  )
}

async function readImplementationFingerprint(root: string) {
  const files = [
    'src/scripts/travel-collection-copy-cli.ts',
    'src/scripts/travel-collection-copy-package.ts',
  ]
  const contents = await Promise.all(files.map((file) => readFile(path.join(root, file))))
  return `impl:${createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0, 12)}`
}

async function collectLegacyReferences(databaseUri: string): Promise<TravelCopyReferences> {
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()
  try {
    const [media, timelineEvents, home] = await Promise.all([
      client.query<{ id: number; source_travel_id: number }>(`
        select id, related_travel_id as source_travel_id
        from media
        where related_travel_id is not null
        order by id
      `),
      client.query<{ id: number; source_travel_id: number }>(`
        select id, related_travel_id as source_travel_id
        from timeline_events
        where related_travel_id is not null
        order by id
      `),
      client.query<{ featured_travel_id: number | null }>(`
        select featured_travel_id from home_config order by id limit 1
      `),
    ])
    return {
      featuredTravelSourceId: home.rows[0]?.featured_travel_id ?? null,
      media: media.rows.map((row) => ({ id: row.id, sourceTravelId: row.source_travel_id })),
      timelineEvents: timelineEvents.rows.map((row) => ({
        id: row.id,
        sourceTravelId: row.source_travel_id,
      })),
    }
  } finally {
    client.release()
    await pool.end()
  }
}

async function readSqlState(databaseUri: string) {
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()
  try {
    const migrations = await client.query<{ name: string }>(`
      select name from payload_migrations
      where name like '2026071%phase_17%'
      order by name
    `)
    const tables = await client.query<{
      travel_memories: string | null
      travel_plans: string | null
      travel_route_identities: string | null
    }>(`
      select
        to_regclass('public.travel_memories')::text as travel_memories,
        to_regclass('public.travel_plans')::text as travel_plans,
        to_regclass('public.travel_route_identities')::text as travel_route_identities
    `)
    const tableState = tables.rows[0]
    const targetRows = {
      travelMemories: tableState?.travel_memories
        ? await tableCount(client, 'travel_memories')
        : 0,
      travelPlans: tableState?.travel_plans ? await tableCount(client, 'travel_plans') : 0,
      travelRouteIdentities: tableState?.travel_route_identities
        ? await tableCount(client, 'travel_route_identities')
        : 0,
    }
    const targetSlugs = {
      travelMemories: tableState?.travel_memories
        ? await tableSlugs(client, 'travel_memories')
        : [],
      travelPlans: tableState?.travel_plans ? await tableSlugs(client, 'travel_plans') : [],
      travelRouteIdentities: tableState?.travel_route_identities
        ? await tableSlugs(client, 'travel_route_identities')
        : [],
    }
    const cutoverApplied = migrations.rows.some(
      (row) => row.name === '20260716_094718_phase_17_add_travel_cutover_relationships',
    )
    const shadowState = cutoverApplied
      ? await readShadowState(client)
      : {
          mappings: { featuredTravel: [], media: [], timelineEvents: [] },
          references: { featuredTravel: 0, media: 0, timelineEvents: 0 },
        }
    return {
      appliedMigrations: migrations.rows.map((row) => row.name),
      shadowReferenceMappings: shadowState.mappings,
      shadowReferences: shadowState.references,
      targetRows,
      targetSlugs,
    }
  } finally {
    client.release()
    await pool.end()
  }
}

async function tableCount(
  client: DatabaseClient,
  table: 'travel_memories' | 'travel_plans' | 'travel_route_identities',
) {
  const result = await client.query<{ count: number }>(`select count(*)::int as count from ${table}`)
  return result.rows[0]?.count ?? 0
}

async function tableSlugs(
  client: DatabaseClient,
  table: 'travel_memories' | 'travel_plans' | 'travel_route_identities',
) {
  const result = await client.query<{ slug: string }>(`select slug from ${table} order by slug`)
  return result.rows.map((row) => row.slug)
}

async function readShadowState(client: DatabaseClient) {
  const [media, timelineEvents, featuredTravel] = await Promise.all([
    readShadowMapping(client, 'media_rels', 'relatedTravelRecord'),
    readShadowMapping(client, 'timeline_events_rels', 'relatedTravelRecord'),
    readShadowMapping(client, 'home_config_rels', 'featuredTravelRecord'),
  ])
  return {
    mappings: { featuredTravel, media, timelineEvents },
    references: {
      featuredTravel: featuredTravel.length,
      media: media.length,
      timelineEvents: timelineEvents.length,
    },
  }
}

async function readShadowMapping(
  client: DatabaseClient,
  table: 'home_config_rels' | 'media_rels' | 'timeline_events_rels',
  relationshipPath: 'featuredTravelRecord' | 'relatedTravelRecord',
) {
  const result = await client.query<{
    owner_id: number
    relation_to: 'travel-memories' | 'travel-plans'
    target_slug: string
  }>(`
    select
      rels.parent_id as owner_id,
      case
        when rels.travel_plans_id is not null then 'travel-plans'
        else 'travel-memories'
      end as relation_to,
      coalesce(plans.slug, memories.slug) as target_slug
    from ${table} rels
    left join travel_plans plans on plans.id = rels.travel_plans_id
    left join travel_memories memories on memories.id = rels.travel_memories_id
    where rels.path = '${relationshipPath}'
    order by rels.parent_id
  `)
  return result.rows.map((row) => ({
    ownerId: row.owner_id,
    relationTo: row.relation_to,
    targetSlug: row.target_slug,
  }))
}

async function assertVerified(
  state: Awaited<ReturnType<typeof collectPackageState>>,
  payload: Payload,
) {
  assertTravelCopyApplyPreconditions({
    appliedMigrations: state.sql.appliedMigrations,
    recordBlockers: state.recordBlockers,
    targetRows: { travelMemories: 0, travelPlans: 0, travelRouteIdentities: 0 },
  })
  const expectedRows = state.manifest.reduce(
    (counts, record) => ({
      travelMemories: counts.travelMemories + (record.targetCollection === 'travel-memories' ? 1 : 0),
      travelPlans: counts.travelPlans + (record.targetCollection === 'travel-plans' ? 1 : 0),
      travelRouteIdentities: counts.travelRouteIdentities + 1,
    }),
    { travelMemories: 0, travelPlans: 0, travelRouteIdentities: 0 },
  )
  if (JSON.stringify(state.sql.targetRows) !== JSON.stringify(expectedRows)) {
    throw new Error('Travel copy target row verification failed')
  }
  const expectedSlugs = {
    travelMemories: state.manifest
      .filter((record) => record.targetCollection === 'travel-memories')
      .map((record) => record.slug)
      .sort(),
    travelPlans: state.manifest
      .filter((record) => record.targetCollection === 'travel-plans')
      .map((record) => record.slug)
      .sort(),
    travelRouteIdentities: state.manifest.map((record) => record.slug).sort(),
  }
  if (JSON.stringify(state.sql.targetSlugs) !== JSON.stringify(expectedSlugs)) {
    throw new Error('Travel copy target slug verification failed')
  }
  const expectedReferences = {
    featuredTravel: state.references.featuredTravelSourceId === null ? 0 : 1,
    media: state.references.media.length,
    timelineEvents: state.references.timelineEvents.length,
  }
  if (JSON.stringify(state.sql.shadowReferences) !== JSON.stringify(expectedReferences)) {
    throw new Error('Travel copy relationship verification failed')
  }
  const targetBySourceId = new Map(
    state.manifest.map((record) => [
      record.sourceId,
      { relationTo: record.targetCollection, targetSlug: record.slug },
    ]),
  )
  const expectedReferenceMappings = {
    featuredTravel:
      state.references.featuredTravelSourceId === null
        ? []
        : [
            requiredReferenceTarget(
              targetBySourceId,
              state.references.featuredTravelSourceId,
            ),
          ],
    media: state.references.media.map((reference) => ({
      ownerId: reference.id,
      ...requiredReferenceTarget(targetBySourceId, reference.sourceTravelId),
    })),
    timelineEvents: state.references.timelineEvents.map((reference) => ({
      ownerId: reference.id,
      ...requiredReferenceTarget(targetBySourceId, reference.sourceTravelId),
    })),
  }
  if (
    JSON.stringify({
      ...state.sql.shadowReferenceMappings,
      featuredTravel: state.sql.shadowReferenceMappings.featuredTravel.map(
        ({ relationTo, targetSlug }) => ({ relationTo, targetSlug }),
      ),
    }) !==
    JSON.stringify(expectedReferenceMappings)
  ) {
    throw new Error('Travel copy relationship owner mapping verification failed')
  }
  const [plans, memories] = await Promise.all([
    payload.find({
      collection: 'travel-plans',
      depth: 0,
      fallbackLocale: false,
      limit: 100,
      locale: 'all',
      overrideAccess: true,
      pagination: false,
    }),
    payload.find({
      collection: 'travel-memories',
      depth: 0,
      fallbackLocale: false,
      limit: 100,
      locale: 'all',
      overrideAccess: true,
      pagination: false,
    }),
  ])
  const targetDocuments = new Map<string, Record<string, unknown>>()
  for (const [collection, docs] of [
    ['travel-plans', plans.docs],
    ['travel-memories', memories.docs],
  ] as const) {
    for (const doc of docs) {
      if (typeof doc.slug === 'string') {
        targetDocuments.set(`${collection}:${doc.slug}`, doc as unknown as Record<string, unknown>)
      }
    }
  }
  assertTravelCopyDocuments(state.manifest, targetDocuments)
}

function requiredReferenceTarget(
  targetBySourceId: ReadonlyMap<
    number,
    { relationTo: 'travel-memories' | 'travel-plans'; targetSlug: string }
  >,
  sourceTravelId: number,
) {
  const target = targetBySourceId.get(sourceTravelId)
  if (!target) throw new Error(`Legacy reference points to unknown travel ${sourceTravelId}`)
  return target
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await readFile(path.join(root, filename), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const separator = trimmed.indexOf('=')
        if (separator === -1) continue
        const key = trimmed.slice(0, separator).trim()
        const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
        if (key && process.env[key] === undefined) process.env[key] = value
      }
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
