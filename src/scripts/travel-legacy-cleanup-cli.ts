import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { promisify } from 'node:util'

import { sql, type MigrateUpArgs } from '@payloadcms/db-postgres'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import * as cleanupMigration from '@/migrations/20260719_025401'
import {
  assertTravelLegacyCleanupPreconditions,
  assertTravelLegacyCleanupReadback,
  assertTravelLegacyCleanupWriteApproval,
  buildTravelLegacyCleanupApprovalToken,
  phase17LegacyCleanupBatch,
  phase17LegacyCleanupMigration,
  type TravelLegacyCleanupState,
} from './travel-legacy-cleanup-package'

const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const execFileAsync = promisify(execFile)
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => {
    connect(): Promise<DatabaseClient>
    end(): Promise<void>
  }
}

type QueryResult<Row> = { rows: Row[] }
type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(statement: string): Promise<QueryResult<Row>>
  release(): void
}
type TransactionDatabase = MigrateUpArgs['db']

async function run() {
  const mode = process.argv[2]
  if (mode !== 'inspect' && mode !== 'apply' && mode !== 'verify') {
    throw new Error('Usage: travel-legacy-cleanup-cli.ts <inspect|apply|verify> [--allow-write]')
  }

  const root = process.cwd()
  await loadLocalEnv(root)
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Legacy cleanup refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')

  if (mode === 'verify') {
    const readback = await collectReadback(databaseUri)
    assertTravelLegacyCleanupReadback(readback)
    console.log(JSON.stringify({ mode, verified: true, ...readback }, null, 2))
    return
  }

  const state = await collectState(databaseUri, root)
  assertTravelLegacyCleanupPreconditions(state)
  const approvalToken = buildTravelLegacyCleanupApprovalToken(state)

  if (mode === 'inspect') {
    console.log(JSON.stringify({
      mode,
      approvalToken,
      ...state,
      writeCommand:
        `TRAVEL_CLEANUP_TARGET_CONFIRM=${state.databaseFingerprint} ` +
        `TRAVEL_CLEANUP_WRITE_CONFIRM=${approvalToken} ` +
        `TRAVEL_CLEANUP_BACKUP_CONFIRM=${state.backup.reference} ` +
        'pnpm run seed:travel:cleanup apply -- --allow-write',
    }, null, 2))
    return
  }

  assertTravelLegacyCleanupWriteApproval({
    allowWrite: process.argv.includes('--allow-write'),
    expectedTarget: state.databaseFingerprint,
    expectedToken: approvalToken,
    expectedBackup: state.backup.reference,
    providedTarget: process.env.TRAVEL_CLEANUP_TARGET_CONFIRM,
    providedToken: process.env.TRAVEL_CLEANUP_WRITE_CONFIRM,
    providedBackup: process.env.TRAVEL_CLEANUP_BACKUP_CONFIRM,
  })

  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const req = await createLocalReq({}, payload)
  if (!(await initTransaction(req))) throw new Error('Legacy cleanup could not start an isolated transaction')

  try {
    const db = await transactionDatabase(payload, req)
    await db.execute(sql.raw(`
      lock table
        payload_migrations, travel_projects, travel_plans, travel_memories,
        travel_route_identities, media, media_rels, timeline_events,
        timeline_events_rels, home_config, home_config_rels,
        payload_locked_documents_rels
      in share row exclusive mode
    `))
    const transactionState = await collectStateFromTransaction(db, databaseUri, root)
    assertTravelLegacyCleanupPreconditions(transactionState)
    if (buildTravelLegacyCleanupApprovalToken(transactionState) !== approvalToken) {
      throw new Error('Legacy cleanup state changed after approval; transaction refused')
    }

    await cleanupMigration.up({ db, payload, req })
    await payload.create({
      collection: 'payload-migrations',
      data: { batch: phase17LegacyCleanupBatch, name: phase17LegacyCleanupMigration },
      overrideAccess: true,
      req,
    })
    const readback = await collectReadbackFromTransaction(db)
    assertTravelLegacyCleanupReadback(readback)
    await commitTransaction(req)
    console.log(JSON.stringify({ mode, committed: true, batch: phase17LegacyCleanupBatch, readback }, null, 2))
  } catch (error) {
    await killTransaction(req)
    throw error
  } finally {
    await payload.destroy()
  }
}

async function collectState(databaseUri: string, root: string): Promise<TravelLegacyCleanupState> {
  return withClient(databaseUri, async (client) => buildState({
    databaseUri,
    root,
    history: (await client.query<{ batch: number | null; name: string }>(historySql)).rows,
    inventory: requiredRow((await client.query<InventoryRow>(inventorySql)).rows[0], 'cleanup inventory'),
    schema: requiredRow((await client.query<SchemaRow>(schemaSql)).rows[0], 'legacy schema inventory'),
  }))
}

async function collectStateFromTransaction(
  db: TransactionDatabase,
  databaseUri: string,
  root: string,
): Promise<TravelLegacyCleanupState> {
  return buildState({
    databaseUri,
    root,
    history: await queryRows(db, historySql),
    inventory: requiredRow((await queryRows<InventoryRow>(db, inventorySql))[0], 'transaction cleanup inventory'),
    schema: requiredRow((await queryRows<SchemaRow>(db, schemaSql))[0], 'transaction legacy schema inventory'),
  })
}

async function buildState(input: {
  databaseUri: string
  root: string
  history: readonly { batch: number | null; name: string }[]
  inventory: InventoryRow
  schema: SchemaRow
}): Promise<TravelLegacyCleanupState> {
  return {
    backup: {
      reference: process.env.TRAVEL_CLEANUP_BACKUP_REFERENCE ?? '',
      createdAt: process.env.TRAVEL_CLEANUP_BACKUP_CREATED_AT ?? '',
      verifiedAt: process.env.TRAVEL_CLEANUP_BACKUP_VERIFIED_AT ?? '',
    },
    databaseFingerprint: buildDatabaseFingerprint(input.databaseUri),
    deployment: {
      commitSha: process.env.TRAVEL_CLEANUP_DEPLOYMENT_SHA ?? '',
      status: process.env.TRAVEL_CLEANUP_DEPLOYMENT_STATUS ?? '',
      verifiedAt: process.env.TRAVEL_CLEANUP_DEPLOYMENT_VERIFIED_AT ?? '',
    },
    implementationCommitSha: await readImplementationCommitSha(input.root),
    implementationFingerprint: await readImplementationFingerprint(input.root),
    inventory: mapInventory(input.inventory),
    legacyColumnsPresent: input.schema.legacy_columns === 4,
    legacyTableCount: input.schema.legacy_tables,
    migrationHistory: input.history,
  }
}

async function collectReadback(databaseUri: string) {
  return withClient(databaseUri, async (client) => buildReadback(
    (await client.query<{ batch: number | null; name: string }>(historySql)).rows,
    requiredRow((await client.query<ReadbackInventoryRow>(readbackInventorySql)).rows[0], 'cleanup read-back inventory'),
    requiredRow((await client.query<SchemaRow>(schemaSql)).rows[0], 'cleanup read-back schema'),
  ))
}

async function collectReadbackFromTransaction(db: TransactionDatabase) {
  return buildReadback(
    await queryRows(db, historySql),
    requiredRow((await queryRows<ReadbackInventoryRow>(db, readbackInventorySql))[0], 'transaction read-back inventory'),
    requiredRow((await queryRows<SchemaRow>(db, schemaSql))[0], 'transaction read-back schema'),
  )
}

function buildReadback(
  migrationHistory: readonly { batch: number | null; name: string }[],
  inventory: ReadbackInventoryRow,
  schema: SchemaRow,
) {
  return {
    inventory: { memories: inventory.memories, plans: inventory.plans, routeIdentities: inventory.route_identities },
    legacyColumnsPresent: schema.legacy_columns !== 0,
    legacyTableCount: schema.legacy_tables,
    migrationHistory,
  }
}

type InventoryRow = {
  home_legacy: number; home_shadow: number; legacy_projects: number
  invalid_mappings: number
  media_legacy: number; media_shadow: number; memories: number; plans: number
  route_identities: number; timeline_legacy: number; timeline_shadow: number
}
type ReadbackInventoryRow = Pick<InventoryRow, 'memories' | 'plans' | 'route_identities'>
type SchemaRow = { legacy_columns: number; legacy_tables: number }

const historySql = 'select batch::int as batch, name from payload_migrations order by id'
const inventorySql = `select
  (select count(*)::int from travel_projects) legacy_projects,
  (select count(*)::int from travel_plans) plans,
  (select count(*)::int from travel_memories) memories,
  (select count(*)::int from travel_route_identities) route_identities,
  (select count(*)::int from media where related_travel_id is not null) media_legacy,
  (select count(*)::int from media_rels where path = 'relatedTravelRecord' and (travel_plans_id is not null or travel_memories_id is not null)) media_shadow,
  (select count(*)::int from timeline_events where related_travel_id is not null) timeline_legacy,
  (select count(*)::int from timeline_events_rels where path = 'relatedTravelRecord' and (travel_plans_id is not null or travel_memories_id is not null)) timeline_shadow,
  (select count(*)::int from home_config where featured_travel_id is not null) home_legacy,
  (select count(*)::int from home_config_rels where path = 'featuredTravelRecord' and (travel_plans_id is not null or travel_memories_id is not null)) home_shadow,
  (select count(*)::int from (
    select media.id from media
      join travel_projects legacy on legacy.id = media.related_travel_id
      where media.related_travel_id is not null and not exists (
        select 1 from media_rels shadow
          left join travel_plans plan on plan.id = shadow.travel_plans_id
          left join travel_memories memory on memory.id = shadow.travel_memories_id
          where shadow.parent_id = media.id and shadow.path = 'relatedTravelRecord'
            and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
              or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
      )
    union all
    select timeline_events.id from timeline_events
      join travel_projects legacy on legacy.id = timeline_events.related_travel_id
      where timeline_events.related_travel_id is not null and not exists (
        select 1 from timeline_events_rels shadow
          left join travel_plans plan on plan.id = shadow.travel_plans_id
          left join travel_memories memory on memory.id = shadow.travel_memories_id
          where shadow.parent_id = timeline_events.id and shadow.path = 'relatedTravelRecord'
            and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
              or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
      )
    union all
    select home_config.id from home_config
      join travel_projects legacy on legacy.id = home_config.featured_travel_id
      where home_config.featured_travel_id is not null and not exists (
        select 1 from home_config_rels shadow
          left join travel_plans plan on plan.id = shadow.travel_plans_id
          left join travel_memories memory on memory.id = shadow.travel_memories_id
          where shadow.parent_id = home_config.id and shadow.path = 'featuredTravelRecord'
            and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
              or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
      )
  ) invalid) invalid_mappings`
const readbackInventorySql = `select
  (select count(*)::int from travel_plans) plans,
  (select count(*)::int from travel_memories) memories,
  (select count(*)::int from travel_route_identities) route_identities`
const schemaSql = `select
  (select count(*)::int from information_schema.tables where table_schema = 'public' and (table_name = 'travel_projects' or table_name like 'travel_projects_%')) legacy_tables,
  (select count(*)::int from information_schema.columns where table_schema = 'public' and
    (table_name, column_name) in (('media','related_travel_id'), ('timeline_events','related_travel_id'), ('home_config','featured_travel_id'), ('payload_locked_documents_rels','travel_projects_id'))) legacy_columns`

function mapInventory(row: InventoryRow) {
  return {
    homeLegacy: row.home_legacy, homeShadow: row.home_shadow,
    invalidMappings: row.invalid_mappings,
    legacyProjects: row.legacy_projects,
    mediaLegacy: row.media_legacy, mediaShadow: row.media_shadow,
    memories: row.memories, plans: row.plans, routeIdentities: row.route_identities,
    timelineLegacy: row.timeline_legacy, timelineShadow: row.timeline_shadow,
  }
}

async function transactionDatabase(payload: Payload, req: Awaited<ReturnType<typeof createLocalReq>>) {
  const transactionID = await req.transactionID
  const adapter = payload.db as unknown as { sessions?: Record<string, { db?: TransactionDatabase }> }
  const db = transactionID ? adapter.sessions?.[transactionID]?.db : undefined
  if (!db) throw new Error('Legacy cleanup transaction session is unavailable')
  return db
}

async function queryRows<Row extends Record<string, unknown>>(db: TransactionDatabase, statement: string) {
  const result = (await db.execute(sql.raw(statement))) as unknown as QueryResult<Row>
  return result.rows
}

async function withClient<Result>(databaseUri: string, operation: (client: DatabaseClient) => Promise<Result>) {
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()
  try { return await operation(client) } finally { client.release(); await pool.end() }
}

function buildDatabaseFingerprint(databaseUri: string) {
  const parsed = new URL(databaseUri)
  const identity = [parsed.protocol, parsed.username, parsed.hostname, parsed.port, parsed.pathname].join('|')
  return `db:${createHash('sha256').update(identity).digest('hex').slice(0, 12)}`
}

async function readImplementationFingerprint(root: string) {
  const contents = await Promise.all([
    'src/migrations/20260719_025401.ts',
    'src/migrations/20260719_025401.json',
    'src/scripts/travel-legacy-cleanup-cli.ts',
    'src/scripts/travel-legacy-cleanup-package.ts',
  ].map((file) => readFile(path.join(root, file))))
  return `impl:${createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0, 12)}`
}

async function readImplementationCommitSha(root: string) {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })
  return stdout.trim()
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

run()
  .then(() => process.exit(0))
  .catch((error) => { console.error(error); process.exit(1) })
