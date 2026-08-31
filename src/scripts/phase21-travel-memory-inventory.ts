import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => {
    connect(): Promise<DatabaseClient>
    end(): Promise<void>
  }
}

type QueryResult<Row> = { rows: Row[] }
type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Row>>
  release(): void
}

type InventoryRow = {
  slug: string
  status: string | null
  participant_count: string
  guest_participant_count: string
  gallery_image_count: string
  itinerary_image_count: string
  flight_count: string
  lodging_count: string
  daily_highlight_count: string
  story_section_count: string
  external_video_count: string
  reminder_count: string
  day_count: string
  moment_count: string
  placement_count: string
  photo_placement_count: string
  youtube_placement_count: string
  missing_moment_key_count: string
  missing_placement_key_count: string
  caption_count: string
  media_related_record_count: string
  media_related_member_link_count: string
}

export const phase21InventorySql = `
select
  memory.slug,
  memory._status::text as status,
  (select count(*) from travel_memories_rels rel where rel.parent_id = memory.id and rel.path = 'participants') as participant_count,
  (select count(*) from travel_memories_guest_participants item where item._parent_id = memory.id) as guest_participant_count,
  (select count(*) from travel_memories_rels rel where rel.parent_id = memory.id and rel.path = 'galleryImages') as gallery_image_count,
  (select count(*) from travel_memories_rels rel where rel.parent_id = memory.id and rel.path = 'itineraryImages') as itinerary_image_count,
  (select count(*) from travel_memories_travel_ledger_flights item where item._parent_id = memory.id) as flight_count,
  (select count(*) from travel_memories_travel_ledger_lodgings item where item._parent_id = memory.id) as lodging_count,
  (select count(*) from travel_memories_daily_highlights item where item._parent_id = memory.id) as daily_highlight_count,
  (select count(*) from travel_memories_story_sections item where item._parent_id = memory.id) as story_section_count,
  (select count(*) from travel_memories_external_videos item where item._parent_id = memory.id) as external_video_count,
  (select count(*) from travel_memories_reminders item where item._parent_id = memory.id) as reminder_count,
  (select count(*) from travel_memory_days day where day.memory_id = memory.id) as day_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id where day.memory_id = memory.id) as moment_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id join travel_memory_days_moments_placements placement on placement._parent_id = moment.id where day.memory_id = memory.id) as placement_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id join travel_memory_days_moments_placements placement on placement._parent_id = moment.id where day.memory_id = memory.id and placement.type = 'photo') as photo_placement_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id join travel_memory_days_moments_placements placement on placement._parent_id = moment.id where day.memory_id = memory.id and placement.type = 'youtube') as youtube_placement_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id where day.memory_id = memory.id and nullif(btrim(moment.moment_key), '') is null) as missing_moment_key_count,
  (select count(*) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id join travel_memory_days_moments_placements placement on placement._parent_id = moment.id where day.memory_id = memory.id and nullif(btrim(placement.placement_key), '') is null) as missing_placement_key_count,
  (select count(distinct placement.id) from travel_memory_days day join travel_memory_days_moments moment on moment._parent_id = day.id join travel_memory_days_moments_placements placement on placement._parent_id = moment.id join travel_memory_days_moments_placements_locales locale on locale._parent_id = placement.id where day.memory_id = memory.id and nullif(btrim(locale.caption), '') is not null) as caption_count,
  (select count(distinct owner.parent_id) from media_rels owner where owner.travel_memories_id = memory.id and owner.path = 'relatedTravelRecord') as media_related_record_count,
  (select count(*) from media_rels owner join media_rels member_link on member_link.parent_id = owner.parent_id and member_link.path = 'relatedMembers' where owner.travel_memories_id = memory.id and owner.path = 'relatedTravelRecord') as media_related_member_link_count
from travel_memories memory
where memory.slug = any($1::text[])
order by memory.slug
`

async function run() {
  await loadLocalEnv(process.cwd())
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Phase 21 inventory refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')

  const slugs = ['201307-hainan', '202308-east-australia', '202702-thailand-phuket']
  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  const client = await pool.connect()

  try {
    const result = await client.query<InventoryRow>(phase21InventorySql, [slugs])
    console.log(
      JSON.stringify(
        {
          mode: 'read-only',
          targetFingerprint: databaseFingerprint(databaseUri),
          expectedSlugs: slugs,
          missingSlugs: slugs.filter((slug) => !result.rows.some((row) => row.slug === slug)),
          memories: result.rows.map(normalizeCounts),
        },
        null,
        2,
      ),
    )
  } finally {
    client.release()
    await pool.end()
  }
}

function normalizeCounts(row: InventoryRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      key.endsWith('_count') ? Number(value) : value,
    ]),
  )
}

function databaseFingerprint(databaseUri: string) {
  const url = new URL(databaseUri)
  return {
    hostHash: createHash('sha256').update(url.hostname).digest('hex').slice(0, 12),
    database: url.pathname.replace(/^\//, ''),
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

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
