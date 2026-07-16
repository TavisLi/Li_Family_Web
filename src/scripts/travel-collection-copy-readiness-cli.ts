import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { getPayload } from 'payload'
import { buildTravelSeedContent } from './seed-content'

import {
  buildTravelCollectionCopyReadiness,
  renderTravelCollectionCopyReadinessMarkdown,
  type TravelCopyEnvironmentInventory,
} from './travel-collection-copy-readiness'

const require = createRequire(import.meta.url)
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => {
    connect(): Promise<DatabaseClient>
    end(): Promise<void>
  }
}

type QueryResult<Row> = {
  rows: Row[]
}

type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>
  release(): void
}

async function run() {
  const root = process.cwd()
  await loadLocalEnv(root)

  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error(
      'Read-only readiness refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true',
    )
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) {
    throw new Error('DATABASE_URI is required')
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('TRAVEL_COPY_READINESS_TIMEOUT')),
      120_000,
    )
  })

  try {
    const report = await Promise.race([collectReadiness(databaseUri), timeout])
    const artifactPath = process.argv.includes('--write-artifact')
      ? await writeArtifact(root, report)
      : undefined

    console.log(
      JSON.stringify(
        {
          generatedAt: report.generatedAt,
          writeReadiness: report.writeReadiness,
          summary: report.summary,
          environment: report.environment,
          globalBlockers: report.globalBlockers,
          projects: report.projects.map((project) => ({
            slug: project.slug,
            targetCollection: project.targetCollection,
            planPresentation: project.planPresentation,
            readiness: project.readiness,
            blockerPaths: project.blockers.map((blocker) => blocker.sourcePath),
            warningPaths: project.warnings.map((warning) => warning.sourcePath),
          })),
          artifactPath,
        },
        null,
        2,
      ),
    )
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function collectReadiness(databaseUri: string) {
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 0,
    limit: 100,
    locale: 'all',
    fallbackLocale: false,
    overrideAccess: true,
    pagination: false,
    sort: 'id',
  })
  const environment = await readEnvironmentInventory(databaseUri)
  const sourceBySlug = new Map(
    (await buildTravelSeedContent(process.cwd())).map((travel) => [travel.slug, travel]),
  )
  return buildTravelCollectionCopyReadiness(
    result.docs as unknown as Parameters<typeof buildTravelCollectionCopyReadiness>[0],
    environment,
    new Date(),
    sourceBySlug,
  )
}

async function readEnvironmentInventory(
  databaseUri: string,
): Promise<TravelCopyEnvironmentInventory> {
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()

  try {
    const tableResult = await client.query<{
      travel_memories: string | null
      travel_plans: string | null
      travel_route_identities: string | null
    }>(`
      select
        to_regclass('public.travel_memories')::text as travel_memories,
        to_regclass('public.travel_plans')::text as travel_plans,
        to_regclass('public.travel_route_identities')::text as travel_route_identities
    `)
    const tables = tableResult.rows[0]
    if (!tables) throw new Error('Could not inspect target travel tables')

    const referencesResult = await client.query<{
      featured_travel: number
      media: number
      timeline_events: number
    }>(`
      select
        (select count(*)::int from media where related_travel_id is not null) as media,
        (select count(*)::int from timeline_events where related_travel_id is not null) as timeline_events,
        (select count(*)::int from home_config where featured_travel_id is not null) as featured_travel
    `)
    const references = referencesResult.rows[0]
    if (!references) throw new Error('Could not inspect legacy travel references')

    const migrationsResult = await client.query<{ name: string }>(`
      select name
      from payload_migrations
      where name in (
        '20260715_073322_phase_17_add_travel_collections',
        '20260715_094310_phase_17_expand_travel_memory_preservation',
        '20260716_045235_phase_17_align_travel_plan_sections'
      )
    `)
    const appliedMigrations = new Set(migrationsResult.rows.map((row) => row.name))

    const referenceOwnersResult = await client.query<{
      featured_travel: number
      media: number
      slug: string
      timeline_events: number
    }>(`
      select
        travel_projects.slug,
        (select count(*)::int from media where related_travel_id = travel_projects.id) as media,
        (select count(*)::int from timeline_events where related_travel_id = travel_projects.id) as timeline_events,
        (select count(*)::int from home_config where featured_travel_id = travel_projects.id) as featured_travel
      from travel_projects
      where exists (select 1 from media where related_travel_id = travel_projects.id)
         or exists (select 1 from timeline_events where related_travel_id = travel_projects.id)
         or exists (select 1 from home_config where featured_travel_id = travel_projects.id)
      order by travel_projects.id
    `)

    const travelPlans = tables.travel_plans ? await tableCount(client, 'travel_plans') : 0
    const travelMemories = tables.travel_memories
      ? await tableCount(client, 'travel_memories')
      : 0
    const travelRouteIdentities = tables.travel_route_identities
      ? await tableCount(client, 'travel_route_identities')
      : 0

    return {
      migrationApplied: Boolean(
        tables.travel_plans &&
          tables.travel_memories &&
          tables.travel_route_identities &&
          appliedMigrations.has('20260715_073322_phase_17_add_travel_collections') &&
          appliedMigrations.has('20260715_094310_phase_17_expand_travel_memory_preservation') &&
          appliedMigrations.has('20260716_045235_phase_17_align_travel_plan_sections'),
      ),
      targetRows: {
        travelMemories,
        travelPlans,
        travelRouteIdentities,
      },
      references: {
        featuredTravel: references.featured_travel,
        media: references.media,
        timelineEvents: references.timeline_events,
      },
      referenceOwners: referenceOwnersResult.rows.map((owner) => ({
        slug: owner.slug,
        featuredTravel: owner.featured_travel,
        media: owner.media,
        timelineEvents: owner.timeline_events,
      })),
    }
  } finally {
    client.release()
    await pool.end()
  }
}

async function tableCount(client: DatabaseClient, table: 'travel_memories' | 'travel_plans' | 'travel_route_identities') {
  const result = await client.query<{ count: number }>(`select count(*)::int as count from ${table}`)
  return result.rows[0]?.count ?? 0
}

async function writeArtifact(
  root: string,
  report: ReturnType<typeof buildTravelCollectionCopyReadiness>,
) {
  const artifactRoot = path.join(root, 'docs/phase-artifacts/phase-17')
  const artifactPath = path.join(artifactRoot, 'travel-collection-copy-readiness.md')
  await mkdir(artifactRoot, { recursive: true })
  await writeFile(artifactPath, renderTravelCollectionCopyReadinessMarkdown(report), 'utf8')
  return path.relative(root, artifactPath)
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await readFile(path.join(root, filename), 'utf8')

      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const separatorIndex = trimmed.indexOf('=')
        if (separatorIndex === -1) continue

        const key = trimmed.slice(0, separatorIndex).trim()
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
        if (key && process.env[key] === undefined) process.env[key] = value
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') throw error
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
