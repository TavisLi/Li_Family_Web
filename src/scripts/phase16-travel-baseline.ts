import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import { buildSeedContent, type MediaSeed } from './seed-content'
import { attachSourceSectionMediaIds } from './travel-section-media'
import {
  buildTravelProjection,
  travelProjectionHash,
  type TravelProjection,
} from './travel-seed-reconciliation'

const parserVersion = 'phase-16-v1'
const require = createRequire(import.meta.url)
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => {
    connect(): Promise<DatabaseClient>
    end(): Promise<void>
  }
}

type QueryResult<Row> = {
  rows: Row[]
  rowCount: number | null
}

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
    throw new Error('Usage: phase16-travel-baseline.ts <inspect|apply|verify>')
  }

  await loadLocalEnv(process.cwd())
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) {
    throw new Error('DATABASE_URI is required')
  }

  const seedContent = await buildSeedContent(process.cwd())
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()

  try {
    const before = await readState(client)

    if (mode === 'inspect') {
      console.log(JSON.stringify(before, null, 2))
      return
    }

    if (mode === 'verify') {
      assertVerifiedState(before, seedContent.travels.length)
      console.log(JSON.stringify(before, null, 2))
      return
    }

    if (before.rows !== seedContent.travels.length || before.baselines !== 0) {
      throw new Error('Baseline precondition changed; refusing Production write')
    }

    const mediaResult = await client.query<{ id: number; source_path: string }>(
      `select id, source_path from media where source_path like 'content-source/assets/travels/%'`,
    )
    const mediaBySourcePath = new Map(
      mediaResult.rows.map((media) => [media.source_path, media.id]),
    )

    await client.query('begin')

    for (const travel of seedContent.travels) {
      const assets = seedContent.media.filter(
        (media) => media.ownerType === 'travel' && media.ownerSlug === travel.slug,
      )
      const projection = travelProjection(travel, assets, mediaBySourcePath)
      const result = await client.query(
        `update travel_projects
         set source_metadata_source_file = $1,
             source_metadata_source_hash = $2,
             source_metadata_parser_version = $3,
             source_metadata_base_projection = $4::jsonb,
             updated_at = now()
         where slug = $5
           and source_metadata_base_projection is null
           and source_metadata_source_file is null`,
        [
          travel.externalDocIdentifier,
          travelProjectionHash(projection),
          parserVersion,
          JSON.stringify(projection),
          travel.slug,
        ],
      )

      if (result.rowCount !== 1) {
        throw new Error(`Baseline precondition failed for ${travel.slug}`)
      }
    }

    await client.query('commit')
    const after = await readState(client)
    assertVerifiedState(after, seedContent.travels.length)
    console.log(JSON.stringify({ before, after }, null, 2))
  } catch (error) {
    await client.query('rollback').catch(() => undefined)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
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

function travelProjection(
  travel: Awaited<ReturnType<typeof buildSeedContent>>['travels'][number],
  assets: MediaSeed[],
  mediaBySourcePath: Map<string, number>,
): TravelProjection {
  const idsFor = (usages: MediaSeed['usage'][]) =>
    assets
      .filter((media) => usages.includes(media.usage))
      .map((media) => mediaBySourcePath.get(media.sourcePath))
      .filter((id): id is number => typeof id === 'number')
  const coverImage = idsFor(['cover'])[0] ?? idsFor(['gallery'])[0]

  return buildTravelProjection({
    ...attachSourceSectionMediaIds({ mediaBySourcePath, mediaItems: assets, travel }),
    coverImage,
    galleryImages: idsFor(['gallery', 'cover']),
    itineraryImages: idsFor(['itinerary']),
  })
}

async function readState(client: DatabaseClient) {
  const result = await client.query<{
    rows: number
    baselines: number
    source_files: number
    published_fingerprint: string
  }>(`
    select
      count(*)::int as rows,
      count(*) filter (where source_metadata_base_projection is not null)::int as baselines,
      count(*) filter (where source_metadata_source_file is not null)::int as source_files,
      md5(
        jsonb_agg(
          to_jsonb(travel_projects)
            - 'source_metadata_source_file'
            - 'source_metadata_source_hash'
            - 'source_metadata_parser_version'
            - 'source_metadata_last_imported_at'
            - 'source_metadata_base_projection'
            - 'updated_at'
          order by id
        )::text
      ) as published_fingerprint
    from travel_projects
  `)

  return result.rows[0]
}

function assertVerifiedState(
  state: Awaited<ReturnType<typeof readState>>,
  expectedRows: number,
) {
  if (!state || state.rows !== expectedRows || state.baselines !== expectedRows) {
    throw new Error('Travel baseline verification failed')
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
