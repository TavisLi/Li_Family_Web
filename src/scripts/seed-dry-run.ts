import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import type { Media, TravelProject } from '../payload/payload-types'
import type { SeedContent } from './seed-content'
import { mediaRecordMatchesSeed } from './seed-media-compare'
import { attachSourceSectionMediaIds } from './travel-section-media'
import {
  buildTravelProjection,
  reconcileTravelSeed,
  type ReconciliationMode,
  type ReconciliationConflict,
  type TravelProjection,
} from './travel-seed-reconciliation'

export type DryRunAction = {
  collection: 'media' | 'travel-projects' | 'users'
  key: string
  action: 'conflict' | 'create' | 'preserve' | 'skip' | 'update'
  existingId?: number
  conflicts?: ReconciliationConflict[]
}

export type DryRunSummary = {
  creates: number
  updates: number
  skips: number
  preserves: number
  conflicts: number
  deletes: number
}

type DryRunMediaRecord = Pick<Media, 'altText' | 'id' | 'sourcePath' | 'tags' | 'type'>
type DryRunUserRecord = { id: number; slug: string }
type DryRunTravelRecord = Pick<TravelProject, 'id' | 'slug' | 'sourceMetadata'> | TravelProject

export async function buildPayloadDryRun(
  payload: Payload,
  seedContent: SeedContent,
  mode: ReconciliationMode = 'safe',
): Promise<{
  actions: DryRunAction[]
  summary: DryRunSummary
  deletionRisk: string
}> {
  const actions: DryRunAction[] = []
  // One catalog query avoids exhausting the constrained Production pooler with
  // multiple large Payload joins while keeping the dry-run read-only.
  const catalog = await readDryRunCatalog(payload)
  const travelDocs: DryRunTravelRecord[] = []
  const travelMetadataBySlug = new Map(catalog.travels.map((travel) => [travel.slug, travel]))

  for (const travel of seedContent.travels) {
    const metadataDoc = travelMetadataBySlug.get(travel.slug)

    if (!metadataDoc) {
      continue
    }

    if (!sourceMetadataFrom(metadataDoc)?.baseProjection) {
      travelDocs.push(metadataDoc)
      continue
    }

    const fullResult = await payload.find({
      collection: 'travel-projects',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: travel.slug,
        },
      },
    })
    travelDocs.push(...fullResult.docs)
  }
  const userIdBySlug = new Map(catalog.users.map((user) => [user.slug, user.id]))
  const travelBySlug = new Map(travelDocs.map((travel) => [travel.slug, travel]))
  const mediaRecordBySourcePath = new Map(
    catalog.media.flatMap((item) => (item.sourcePath ? [[item.sourcePath, item] as const] : [])),
  )

  for (const member of seedContent.members) {
    const existingId = userIdBySlug.get(member.slug)

    actions.push({
      collection: 'users',
      key: member.slug,
      action: existingId ? 'update' : 'create',
      existingId,
    })
  }

  for (const travel of seedContent.travels) {
    const existing = travelBySlug.get(travel.slug)
    const assets = seedContent.media.filter(
      (item) => item.ownerType === 'travel' && item.ownerSlug === travel.slug,
    )
    const mediaIdBySourcePath = new Map(
      assets.flatMap((item) => {
        const existingMedia = mediaRecordBySourcePath.get(item.sourcePath)
        return existingMedia ? [[item.sourcePath, Number(existingMedia.id)] as const] : []
      }),
    )
    const idsFor = (usages: string[]) =>
      assets
        .filter((item) => usages.includes(item.usage))
        .map((item) => mediaIdBySourcePath.get(item.sourcePath))
        .filter((id): id is number => typeof id === 'number')
    const coverImage = idsFor(['cover', 'gallery'])[0]
    const source = buildTravelProjection({
      ...attachSourceSectionMediaIds({ mediaBySourcePath: mediaIdBySourcePath, mediaItems: assets, travel }),
      coverImage,
      galleryImages: idsFor(['gallery', 'cover']),
      itineraryImages: idsFor(['itinerary']),
    })
    const metadata = existing ? sourceMetadataFrom(existing) : undefined
    const plan = reconcileTravelSeed({
      slug: travel.slug,
      base: metadata?.baseProjection,
      source,
      current: existing ? buildTravelProjection(existing as unknown as TravelProjection) : undefined,
      mode,
    })
    const action =
      plan.action === 'create'
        ? 'create'
        : plan.action === 'apply-source'
          ? 'update'
          : plan.action === 'conflict'
            ? 'conflict'
            : plan.action === 'preserve-current'
              ? 'preserve'
              : 'skip'

    actions.push({
      collection: 'travel-projects',
      key: travel.slug,
      action,
      existingId: existing ? Number(existing.id) : undefined,
      conflicts: plan.conflicts.length ? plan.conflicts : undefined,
    })
  }

  for (const media of seedContent.media) {
    const existing = mediaRecordBySourcePath.get(media.sourcePath)

    actions.push({
      collection: 'media',
      key: media.sourcePath,
      action: existing ? (mediaRecordMatchesSeed(existing, media) ? 'skip' : 'update') : 'create',
      existingId: existing?.id,
    })
  }

  return {
    actions,
    summary: summarizeDryRunActions(actions),
    deletionRisk: 'No delete operation is implemented by the Phase 9 seed workflow.',
  }
}

async function readDryRunCatalog(payload: Payload): Promise<{
  users: DryRunUserRecord[]
  travels: DryRunTravelRecord[]
  media: DryRunMediaRecord[]
}> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT
      (
        SELECT COALESCE(json_agg(json_build_object('id', users.id, 'slug', users.slug)), '[]'::json)
        FROM users
      ) AS users,
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', travel_projects.id,
              'slug', travel_projects.slug,
              'sourceMetadata', json_build_object(
                'sourceFile', travel_projects.source_metadata_source_file,
                'sourceHash', travel_projects.source_metadata_source_hash,
                'parserVersion', travel_projects.source_metadata_parser_version,
                'lastImportedAt', travel_projects.source_metadata_last_imported_at,
                'baseProjection', travel_projects.source_metadata_base_projection
              )
            )
          ),
          '[]'::json
        )
        FROM travel_projects
      ) AS travels,
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', media_catalog.id,
              'type', media_catalog.type,
              'sourcePath', media_catalog.source_path,
              'altText', media_catalog.alt_text,
              'tags', media_catalog.tags
            )
            ORDER BY media_catalog.id
          ),
          '[]'::json
        )
        FROM (
          SELECT
            media.id,
            media.type,
            media.source_path,
            media_locales.alt_text,
            COALESCE(
              json_agg(
                json_build_object('tag', media_tags_locales.tag)
                ORDER BY media_tags._order
              ) FILTER (WHERE media_tags_locales.tag IS NOT NULL),
              '[]'::json
            ) AS tags
          FROM media
          LEFT JOIN media_locales
            ON media_locales._parent_id = media.id
            AND media_locales._locale::text = 'zh-TW'
          LEFT JOIN media_tags
            ON media_tags._parent_id = media.id
          LEFT JOIN media_tags_locales
            ON media_tags_locales._parent_id = media_tags.id
            AND media_tags_locales._locale::text = 'zh-TW'
          GROUP BY media.id, media.type, media.source_path, media_locales.alt_text
        ) AS media_catalog
      ) AS media
  `)
  const rows = isRecord(result) && Array.isArray(result.rows) ? result.rows : []
  const row = rows[0]

  if (!isRecord(row)) {
    return { users: [], travels: [], media: [] }
  }

  return {
    users: Array.isArray(row.users)
      ? row.users.flatMap((user) =>
          isRecord(user) && typeof user.id === 'number' && typeof user.slug === 'string'
            ? [{ id: user.id, slug: user.slug }]
            : [],
        )
      : [],
    travels: Array.isArray(row.travels)
      ? row.travels.flatMap((travel) =>
          isRecord(travel) && typeof travel.id === 'number' && typeof travel.slug === 'string'
            ? [travel as DryRunTravelRecord]
            : [],
        )
      : [],
    media: Array.isArray(row.media)
      ? row.media.flatMap((media) => {
          if (
            !isRecord(media) ||
            typeof media.id !== 'number' ||
            (media.type !== 'photo' && media.type !== 'video') ||
            typeof media.altText !== 'string'
          ) {
            return []
          }

          return [{
            id: media.id,
            type: media.type,
            altText: media.altText,
            sourcePath: typeof media.sourcePath === 'string' ? media.sourcePath : null,
            tags: Array.isArray(media.tags)
              ? media.tags.flatMap((tag) =>
                  isRecord(tag) && typeof tag.tag === 'string' ? [{ tag: tag.tag }] : [],
                )
              : [],
          }]
        })
      : [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sourceMetadataFrom(value: unknown): { baseProjection?: TravelProjection } | undefined {
  if (!value || typeof value !== 'object' || !('sourceMetadata' in value)) {
    return undefined
  }

  const metadata = value.sourceMetadata
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }

  const baseProjection = 'baseProjection' in metadata ? metadata.baseProjection : undefined
  return {
    baseProjection:
      baseProjection && typeof baseProjection === 'object' && !Array.isArray(baseProjection)
        ? (baseProjection as TravelProjection)
        : undefined,
  }
}

export function summarizeDryRunActions(actions: DryRunAction[]): DryRunSummary {
  return actions.reduce<DryRunSummary>(
    (summary, item) => {
      if (item.action === 'create') {
        summary.creates += 1
      } else if (item.action === 'update') {
        summary.updates += 1
      } else if (item.action === 'skip') {
        summary.skips += 1
      } else if (item.action === 'preserve') {
        summary.preserves += 1
      } else {
        summary.conflicts += 1
      }

      return summary
    },
    {
      creates: 0,
      updates: 0,
      skips: 0,
      preserves: 0,
      conflicts: 0,
      deletes: 0,
    },
  )
}
