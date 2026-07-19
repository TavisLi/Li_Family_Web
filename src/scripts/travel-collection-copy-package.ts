import { createHash } from 'node:crypto'

import type { TravelProject } from '@/payload/payload-types'
import type { TravelSeed } from './seed-content'
import { buildTravelMemoryCopyDraft } from './travel-memory-copy-transformer'
import { buildTravelPlanCopyDraft } from './travel-collection-copy-readiness'

export const travelCopyMigrationNames = [
  '20260715_073322_phase_17_add_travel_collections',
  '20260715_094310_phase_17_expand_travel_memory_preservation',
  '20260716_045235_phase_17_align_travel_plan_sections',
  '20260716_091228_phase_17_align_travel_memory_sections',
  '20260716_094718_phase_17_add_travel_cutover_relationships',
] as const

export type TravelCopyCollection = 'travel-memories' | 'travel-plans'
export type TravelCopyLocale = 'en' | 'zh-TW'

export type TravelCopyManifestRecord = {
  sourceId: number
  slug: string
  targetCollection: TravelCopyCollection
  data?: Record<string, unknown>
}

export type TravelCopyReference = {
  id: number
  sourceTravelId: number
}

export type TravelCopyReferences = {
  featuredTravelSourceId: number | null
  media: TravelCopyReference[]
  timelineEvents: TravelCopyReference[]
}

export type TravelCopyPayload = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
  updateGlobal(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

export function assertTravelCopyWriteApproval(input: {
  allowWrite: boolean
  expectedTarget: string
  expectedToken: string
  providedTarget: string | undefined
  providedToken: string | undefined
}) {
  if (!input.allowWrite) {
    throw new Error('Travel copy apply requires --allow-write')
  }
  assertTravelCopyReadbackApproval(input)
}

export function assertTravelCopyReadbackApproval(input: {
  expectedTarget: string
  expectedToken: string
  providedTarget: string | undefined
  providedToken: string | undefined
}) {
  if (input.providedToken !== input.expectedToken) {
    throw new Error(`Travel copy confirmation mismatch; expected ${input.expectedToken}`)
  }
  if (input.providedTarget !== input.expectedTarget) {
    throw new Error(`Travel copy target mismatch; expected ${input.expectedTarget}`)
  }
}

export type TravelCopyApprovalInput = {
  databaseFingerprint?: string
  implementationFingerprint?: string
  migrations: readonly string[]
  migrationFingerprints?: readonly { name: string; sha256: string }[]
  projects: readonly TravelCopyManifestRecord[]
  references: {
    featuredTravel: number
    media: number
    timelineEvents: number
  }
  referenceMappings?: TravelCopyReferences
}

export function buildTravelCopyApprovalToken(input: TravelCopyApprovalInput): string {
  const canonical = {
    databaseFingerprint: input.databaseFingerprint ?? null,
    implementationFingerprint: input.implementationFingerprint ?? null,
    migrations: [...input.migrations].sort(),
    migrationFingerprints: input.migrationFingerprints
      ? [...input.migrationFingerprints].sort((left, right) => left.name.localeCompare(right.name))
      : null,
    projects: [...input.projects]
      .sort((left, right) => left.sourceId - right.sourceId)
      .map((project) => ({
        sourceId: project.sourceId,
        slug: project.slug,
        targetCollection: project.targetCollection,
        dataHash: project.data
          ? createHash('sha256').update(stableStringify(project.data)).digest('hex')
          : null,
      })),
    references: input.references,
    referenceMappings: input.referenceMappings
      ? {
          featuredTravelSourceId: input.referenceMappings.featuredTravelSourceId,
          media: [...input.referenceMappings.media].sort((left, right) => left.id - right.id),
          timelineEvents: [...input.referenceMappings.timelineEvents].sort(
            (left, right) => left.id - right.id,
          ),
        }
      : null,
  }
  const digest = createHash('sha256').update(stableStringify(canonical)).digest('hex').slice(0, 16)
  return `phase-17-copy:${digest}`
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys(value[key])]),
  )
}

export function buildTravelCopyManifest(
  projects: TravelProject[],
  sourceBySlug: ReadonlyMap<string, TravelSeed>,
): TravelCopyManifestRecord[] {
  return projects.map((project) => {
    const source = sourceBySlug.get(project.slug)
    if (!source) throw new Error(`Travel copy source missing for ${project.slug}`)
    const targetCollection =
      project.status === 'planning' ? ('travel-plans' as const) : ('travel-memories' as const)
    const draft =
      project.status === 'planning'
        ? buildTravelPlanCopyDraft(project, source)
        : buildTravelMemoryCopyDraft(project, source)
    return {
      sourceId: project.id,
      slug: project.slug,
      targetCollection,
      data: draft.data as Record<string, unknown>,
    }
  })
}

export function assertTravelCopyApplyPreconditions(input: {
  appliedMigrations: readonly string[]
  recordBlockers: number
  targetRows: { travelMemories: number; travelPlans: number; travelRouteIdentities: number }
}) {
  const applied = new Set(input.appliedMigrations)
  const missing = travelCopyMigrationNames.filter((name) => !applied.has(name))
  if (missing.length) throw new Error(`Travel copy migrations missing: ${missing.join(', ')}`)
  if (input.recordBlockers > 0) throw new Error('Travel copy record blockers must be zero')
  if (Object.values(input.targetRows).some((count) => count !== 0)) {
    throw new Error('Travel copy targets must be empty before apply')
  }
}

export async function executeTravelCollectionCopy(args: {
  manifest: TravelCopyManifestRecord[]
  payload: TravelCopyPayload
  references: TravelCopyReferences
  req: unknown
}) {
  const targetBySourceId = new Map<
    number,
    { relationTo: TravelCopyCollection; value: number | string }
  >()

  for (const record of args.manifest) {
    if (!record.data) throw new Error(`Travel copy data missing for ${record.slug}`)
    const chineseData = materializeTravelLocale(record.data, 'zh-TW')
    const created = await args.payload.create({
      collection: record.targetCollection,
      data: chineseData,
      locale: 'zh-TW',
      overrideAccess: true,
      req: args.req,
    })
    if (!hasDocumentId(created)) throw new Error(`Travel copy create returned no id for ${record.slug}`)

    const englishData = attachCreatedArrayIds(
      materializeTravelLocale(record.data, 'en'),
      created,
    )
    await args.payload.update({
      collection: record.targetCollection,
      data: englishData,
      id: created.id,
      locale: 'en',
      overrideAccess: true,
      req: args.req,
    })
    targetBySourceId.set(record.sourceId, {
      relationTo: record.targetCollection,
      value: created.id,
    })
  }

  for (const reference of args.references.media) {
    await updateReference(args.payload, args.req, 'media', reference, targetBySourceId)
  }
  for (const reference of args.references.timelineEvents) {
    await updateReference(
      args.payload,
      args.req,
      'timeline-events',
      reference,
      targetBySourceId,
    )
  }
  if (args.references.featuredTravelSourceId !== null) {
    const target = requiredTarget(targetBySourceId, args.references.featuredTravelSourceId)
    await args.payload.updateGlobal({
      slug: 'home-config',
      data: { featuredTravelRecord: target },
      overrideAccess: true,
      req: args.req,
    })
  }

  return {
    copied: args.manifest.length,
    references: {
      featuredTravel: args.references.featuredTravelSourceId === null ? 0 : 1,
      media: args.references.media.length,
      timelineEvents: args.references.timelineEvents.length,
    },
  }
}

export function assertTravelCopyDocuments(
  manifest: TravelCopyManifestRecord[],
  targetDocuments: ReadonlyMap<string, Record<string, unknown>>,
) {
  for (const record of manifest) {
    if (!record.data) throw new Error(`Travel copy data missing for ${record.slug}`)
    const actual = targetDocuments.get(`${record.targetCollection}:${record.slug}`)
    if (!actual) throw new Error(`Travel copy target document missing for ${record.slug}`)
    const actualProjection = projectExpectedShape(actual, record.data, record.slug)
    if (stableStringify(actualProjection) !== stableStringify(record.data)) {
      throw new Error(`Travel copy target content verification failed for ${record.slug}`)
    }
  }
}

function projectExpectedShape(actual: unknown, expected: unknown, path: string): unknown {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      throw new Error(`Travel copy target array shape changed at ${path}`)
    }
    return expected.map((item, index) =>
      projectExpectedShape(actual[index], item, `${path}.${index}`),
    )
  }
  if (isRecord(expected)) {
    if (!isRecord(actual)) throw new Error(`Travel copy target object missing at ${path}`)
    return Object.fromEntries(
      Object.entries(expected).map(([key, value]) => [
        key,
        projectExpectedShape(actual[key], value, `${path}.${key}`),
      ]),
    )
  }
  return actual
}

async function updateReference(
  payload: TravelCopyPayload,
  req: unknown,
  collection: 'media' | 'timeline-events',
  reference: TravelCopyReference,
  targetBySourceId: ReadonlyMap<
    number,
    { relationTo: TravelCopyCollection; value: number | string }
  >,
) {
  await payload.update({
    collection,
    id: reference.id,
    data: { relatedTravelRecord: requiredTarget(targetBySourceId, reference.sourceTravelId) },
    locale: 'zh-TW',
    overrideAccess: true,
    req,
  })
}

function requiredTarget(
  targetBySourceId: ReadonlyMap<
    number,
    { relationTo: TravelCopyCollection; value: number | string }
  >,
  sourceTravelId: number,
) {
  const target = targetBySourceId.get(sourceTravelId)
  if (!target) throw new Error(`Legacy reference points to unknown travel ${sourceTravelId}`)
  return target
}

export function materializeTravelLocale<T>(value: T, locale: TravelCopyLocale): T {
  return materializeValue(value, locale, []) as T
}

function materializeValue(value: unknown, locale: TravelCopyLocale, path: string[]): unknown {
  if (path.join('.') === 'sourceMetadata.baseProjection') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => materializeValue(item, locale, path))
  }
  if (!isRecord(value)) {
    return value
  }
  if (isLocalizedValue(value)) {
    const selected = value[locale] ?? value['zh-TW'] ?? value.en
    return materializeValue(selected, locale, path)
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      materializeValue(nested, locale, [...path, key]),
    ]),
  )
}

function isLocalizedValue(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => key === 'zh-TW' || key === 'en')
}

export function attachCreatedArrayIds<T>(localizedData: T, createdDoc: unknown): T {
  return attachIds(localizedData, createdDoc, []) as T
}

function attachIds(value: unknown, createdValue: unknown, path: string[]): unknown {
  if (Array.isArray(value)) {
    if (!Array.isArray(createdValue) || value.length !== createdValue.length) {
      throw new Error(`Travel copy array shape changed at ${path.join('.') || '<root>'}`)
    }
    return value.map((item, index) => {
      const createdItem = createdValue[index]
      const attached = attachIds(item, createdItem, [...path, String(index)])
      if (!isRecord(attached) || !isRecord(createdItem) || !hasDocumentId(createdItem)) {
        return attached
      }
      return { ...attached, id: createdItem.id }
    })
  }
  if (!isRecord(value) || !isRecord(createdValue)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      attachIds(nested, createdValue[key], [...path, key]),
    ]),
  )
}

function hasDocumentId(value: Record<string, unknown>): value is Record<string, unknown> & {
  id: number | string
} {
  return typeof value.id === 'number' || typeof value.id === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
