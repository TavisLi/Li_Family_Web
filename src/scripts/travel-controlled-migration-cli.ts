import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { sql, type MigrateUpArgs } from '@payloadcms/db-postgres'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import * as addTravelCollections from '@/migrations/20260715_073322_phase_17_add_travel_collections'
import * as expandTravelMemory from '@/migrations/20260715_094310_phase_17_expand_travel_memory_preservation'
import * as alignTravelPlanSections from '@/migrations/20260716_045235_phase_17_align_travel_plan_sections'
import * as alignTravelMemorySections from '@/migrations/20260716_091228_phase_17_align_travel_memory_sections'
import * as addTravelCutoverRelationships from '@/migrations/20260716_094718_phase_17_add_travel_cutover_relationships'
import {
  assertControlledMigrationPreconditions,
  assertControlledMigrationWriteApproval,
  buildControlledMigrationApprovalToken,
  buildControlledMigrationReadbackToken,
  phase17ControlledMigrationBatch,
  phase17ControlledMigrationNames,
  phase17ExpectedMigrationHistory,
  type ControlledMigrationState,
} from './travel-controlled-migration-package'

const controlledMigrations = [
  { name: phase17ControlledMigrationNames[0], up: addTravelCollections.up },
  { name: phase17ControlledMigrationNames[1], up: expandTravelMemory.up },
  { name: phase17ControlledMigrationNames[2], up: alignTravelPlanSections.up },
  { name: phase17ControlledMigrationNames[3], up: alignTravelMemorySections.up },
  { name: phase17ControlledMigrationNames[4], up: addTravelCutoverRelationships.up },
] as const

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
type TransactionDatabase = MigrateUpArgs['db']

async function run() {
  const mode = process.argv[2]
  if (mode !== 'inspect' && mode !== 'apply' && mode !== 'verify') {
    throw new Error('Usage: travel-controlled-migration-cli.ts <inspect|apply|verify> [--allow-write]')
  }

  const root = process.cwd()
  await loadLocalEnv(root)
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Controlled migration refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')

  const state = await collectState(databaseUri, root)
  const approvalToken =
    mode === 'verify'
      ? buildControlledMigrationReadbackToken(state)
      : buildControlledMigrationApprovalToken(state)

  if (mode === 'inspect') {
    assertControlledMigrationPreconditions(state)
    console.log(JSON.stringify({ mode, ...publicState(state, approvalToken) }, null, 2))
    return
  }

  if (mode === 'verify') {
    assertReadbackApproval(state, approvalToken)
    assertControlledMigrationReadback(state)
    console.log(JSON.stringify({ mode, verified: true, ...publicState(state, approvalToken) }, null, 2))
    return
  }

  assertControlledMigrationPreconditions(state)
  assertControlledMigrationWriteApproval({
    allowWrite: process.argv.includes('--allow-write'),
    expectedTarget: state.databaseFingerprint,
    expectedToken: approvalToken,
    providedTarget: process.env.TRAVEL_MIGRATION_TARGET_CONFIRM,
    providedToken: process.env.TRAVEL_MIGRATION_WRITE_CONFIRM,
  })

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)
  const started = await initTransaction(req)
  if (!started) throw new Error('Controlled migration could not start an isolated transaction')

  try {
    const db = await transactionDatabase(payload, req)
    await db.execute(sql.raw(`
      lock table
        payload_migrations,
        travel_projects,
        media,
        timeline_events,
        home_config,
        media_rels,
        timeline_events_rels
      in share row exclusive mode
    `))
    const transactionState = await collectStateFromTransaction(db, databaseUri, root)
    assertControlledMigrationPreconditions(transactionState)
    if (buildControlledMigrationApprovalToken(transactionState) !== approvalToken) {
      throw new Error('Controlled migration state changed after approval; transaction refused')
    }

    for (const migration of controlledMigrations) {
      await migration.up({ db, payload, req })
      await payload.create({
        collection: 'payload-migrations',
        data: { batch: phase17ControlledMigrationBatch, name: migration.name },
        overrideAccess: true,
        req,
      })
    }
    await assertTransactionReadback(db)
    await commitTransaction(req)
    console.log(
      JSON.stringify(
        {
          mode,
          committed: true,
          batch: phase17ControlledMigrationBatch,
          migrations: phase17ControlledMigrationNames,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

function publicState(state: ControlledMigrationState, approvalToken: string) {
  return {
    approvalToken,
    databaseFingerprint: state.databaseFingerprint,
    implementationFingerprint: state.implementationFingerprint,
    inventory: state.inventory,
    migrationFingerprints: state.migrationFingerprints,
    migrationHistory: state.migrationHistory,
    targetObjects: state.targetObjects,
    writeCommand:
      `TRAVEL_MIGRATION_TARGET_CONFIRM=${state.databaseFingerprint} ` +
      `TRAVEL_MIGRATION_WRITE_CONFIRM=${approvalToken} ` +
      'pnpm run seed:travel:migrate-controlled apply -- --allow-write',
  }
}

async function collectState(databaseUri: string, root: string): Promise<ControlledMigrationState> {
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()
  try {
    const [history, tables, inventory] = await Promise.all([
      client.query<{ batch: number | null; name: string }>(`
        select batch::int as batch, name from payload_migrations order by id
      `),
      client.query<{
        home_config_rels: string | null
        locked_document_memory_column: boolean
        locked_document_plan_column: boolean
        media_memory_column: boolean
        media_plan_column: boolean
        timeline_memory_column: boolean
        timeline_plan_column: boolean
        travel_memories: string | null
        travel_plans: string | null
        travel_route_identities: string | null
      }>(`
        select
          to_regclass('public.home_config_rels')::text as home_config_rels,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_memories_id') as locked_document_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_plans_id') as locked_document_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_memories_id') as media_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_plans_id') as media_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_memories_id') as timeline_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_plans_id') as timeline_plan_column,
          to_regclass('public.travel_memories')::text as travel_memories,
          to_regclass('public.travel_plans')::text as travel_plans,
          to_regclass('public.travel_route_identities')::text as travel_route_identities
      `),
      client.query<{
        featured_travel: number
        legacy_projects: number
        media: number
        timeline_events: number
      }>(`
        select
          (select count(*)::int from travel_projects) as legacy_projects,
          (select count(*)::int from media where related_travel_id is not null) as media,
          (select count(*)::int from timeline_events where related_travel_id is not null) as timeline_events,
          (select count(*)::int from home_config where featured_travel_id is not null) as featured_travel
      `),
    ])
    return buildState({
      databaseUri,
      history: history.rows,
      inventory: requiredRow(inventory.rows[0], 'migration inventory'),
      root,
      tables: requiredRow(tables.rows[0], 'target table state'),
    })
  } finally {
    client.release()
    await pool.end()
  }
}

async function collectStateFromTransaction(
  db: TransactionDatabase,
  databaseUri: string,
  root: string,
): Promise<ControlledMigrationState> {
  const history = await queryRows<{ batch: number | null; name: string }>(
    db,
    `select batch::int as batch, name from payload_migrations order by id`,
  )
  const tables = requiredRow(
    (
      await queryRows<{
        home_config_rels: string | null
        locked_document_memory_column: boolean
        locked_document_plan_column: boolean
        media_memory_column: boolean
        media_plan_column: boolean
        timeline_memory_column: boolean
        timeline_plan_column: boolean
        travel_memories: string | null
        travel_plans: string | null
        travel_route_identities: string | null
      }>(
        db,
        `select
          to_regclass('public.home_config_rels')::text as home_config_rels,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_memories_id') as locked_document_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_plans_id') as locked_document_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_memories_id') as media_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_plans_id') as media_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_memories_id') as timeline_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_plans_id') as timeline_plan_column,
          to_regclass('public.travel_memories')::text as travel_memories,
          to_regclass('public.travel_plans')::text as travel_plans,
          to_regclass('public.travel_route_identities')::text as travel_route_identities`,
      )
    )[0],
    'transaction target table state',
  )
  const inventory = requiredRow(
    (
      await queryRows<{
        featured_travel: number
        legacy_projects: number
        media: number
        timeline_events: number
      }>(
        db,
        `select
          (select count(*)::int from travel_projects) as legacy_projects,
          (select count(*)::int from media where related_travel_id is not null) as media,
          (select count(*)::int from timeline_events where related_travel_id is not null) as timeline_events,
          (select count(*)::int from home_config where featured_travel_id is not null) as featured_travel`,
      )
    )[0],
    'transaction migration inventory',
  )
  return buildState({ databaseUri, history, inventory, root, tables })
}

async function buildState(input: {
  databaseUri: string
  history: readonly { batch: number | null; name: string }[]
  inventory: {
    featured_travel: number
    legacy_projects: number
    media: number
    timeline_events: number
  }
  root: string
  tables: {
    home_config_rels: string | null
    locked_document_memory_column: boolean
    locked_document_plan_column: boolean
    media_memory_column: boolean
    media_plan_column: boolean
    timeline_memory_column: boolean
    timeline_plan_column: boolean
    travel_memories: string | null
    travel_plans: string | null
    travel_route_identities: string | null
  }
}): Promise<ControlledMigrationState> {
  return {
    databaseFingerprint: buildDatabaseFingerprint(input.databaseUri),
    implementationFingerprint: await readImplementationFingerprint(input.root),
    inventory: {
      featuredTravel: input.inventory.featured_travel,
      legacyProjects: input.inventory.legacy_projects,
      media: input.inventory.media,
      timelineEvents: input.inventory.timeline_events,
    },
    migrationFingerprints: await readMigrationFingerprints(input.root),
    migrationHistory: input.history,
    targetObjects: {
      homeConfigRelationships: input.tables.home_config_rels !== null,
      lockedDocumentMemoryColumn: input.tables.locked_document_memory_column,
      lockedDocumentPlanColumn: input.tables.locked_document_plan_column,
      mediaMemoryColumn: input.tables.media_memory_column,
      mediaPlanColumn: input.tables.media_plan_column,
      timelineMemoryColumn: input.tables.timeline_memory_column,
      timelinePlanColumn: input.tables.timeline_plan_column,
      travelMemories: input.tables.travel_memories !== null,
      travelPlans: input.tables.travel_plans !== null,
      travelRouteIdentities: input.tables.travel_route_identities !== null,
    },
  }
}

async function assertTransactionReadback(db: TransactionDatabase) {
  const migrations = await queryRows<{ batch: number; name: string }>(
    db,
    `select batch::int as batch, name from payload_migrations
     where name like '2026071%phase_17%'
     order by name`,
  )
  if (
    JSON.stringify(migrations) !==
    JSON.stringify(
      [...phase17ControlledMigrationNames]
        .sort()
        .map((name) => ({ batch: phase17ControlledMigrationBatch, name })),
    )
  ) {
    throw new Error('Controlled migration transaction record verification failed')
  }
  const tables = requiredRow(
    (
      await queryRows<{
        home_config_rels: string | null
        locked_document_memory_column: boolean
        locked_document_plan_column: boolean
        media_memory_column: boolean
        media_plan_column: boolean
        timeline_memory_column: boolean
        timeline_plan_column: boolean
        travel_memories: string | null
        travel_plans: string | null
        travel_route_identities: string | null
      }>(
        db,
        `select
          to_regclass('public.home_config_rels')::text as home_config_rels,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_memories_id') as locked_document_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payload_locked_documents_rels' and column_name = 'travel_plans_id') as locked_document_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_memories_id') as media_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'media_rels' and column_name = 'travel_plans_id') as media_plan_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_memories_id') as timeline_memory_column,
          exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timeline_events_rels' and column_name = 'travel_plans_id') as timeline_plan_column,
          to_regclass('public.travel_memories')::text as travel_memories,
          to_regclass('public.travel_plans')::text as travel_plans,
          to_regclass('public.travel_route_identities')::text as travel_route_identities`,
      )
    )[0],
    'transaction readback tables',
  )
  if (Object.values(tables).some((table) => table === null)) {
    throw new Error('Controlled migration transaction table verification failed')
  }
}

function assertControlledMigrationReadback(state: ControlledMigrationState) {
  const expectedHistory = [
    ...phase17ExpectedMigrationHistory,
    ...phase17ControlledMigrationNames.map((name) => ({
      batch: phase17ControlledMigrationBatch,
      name,
    })),
  ]
  if (JSON.stringify(state.migrationHistory) !== JSON.stringify(expectedHistory)) {
    throw new Error('Controlled migration readback history mismatch')
  }
  if (Object.values(state.targetObjects).some((exists) => !exists)) {
    throw new Error('Controlled migration readback target schema mismatch')
  }
  if (
    JSON.stringify(state.inventory) !==
    JSON.stringify({ featuredTravel: 1, legacyProjects: 5, media: 12, timelineEvents: 2 })
  ) {
    throw new Error('Controlled migration changed legacy inventory')
  }
}

function assertReadbackApproval(state: ControlledMigrationState, approvalToken: string) {
  if (process.env.TRAVEL_MIGRATION_TARGET_CONFIRM !== state.databaseFingerprint) {
    throw new Error('Controlled migration verify target confirmation mismatch')
  }
  if (process.env.TRAVEL_MIGRATION_WRITE_CONFIRM !== approvalToken) {
    throw new Error('Controlled migration verify approval confirmation mismatch')
  }
}

async function transactionDatabase(
  payload: Payload,
  req: Awaited<ReturnType<typeof createLocalReq>>,
) {
  const transactionID = await req.transactionID
  const adapter = payload.db as unknown as {
    sessions?: Record<string, { db?: TransactionDatabase }>
  }
  const db = transactionID ? adapter.sessions?.[transactionID]?.db : undefined
  if (!db) throw new Error('Controlled migration transaction session is unavailable')
  return db
}

async function queryRows<Row extends Record<string, unknown>>(
  db: TransactionDatabase,
  statement: string,
) {
  const result = (await db.execute(sql.raw(statement))) as unknown as QueryResult<Row>
  return result.rows
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
    phase17ControlledMigrationNames.map(async (name) => {
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
  const contents = await Promise.all(
    [
      'src/scripts/travel-controlled-migration-cli.ts',
      'src/scripts/travel-controlled-migration-package.ts',
    ].map((file) => readFile(path.join(root, file))),
  )
  return `impl:${createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0, 12)}`
}

function requiredRow<Row>(row: Row | undefined, label: string): Row {
  if (!row) throw new Error(`Could not read ${label}`)
  return row
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
