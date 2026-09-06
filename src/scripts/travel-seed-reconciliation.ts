import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type TravelProjection = Record<string, unknown>

export type ReconciliationMode = 'payload-wins' | 'safe' | 'source-wins'

export type ReconciliationConflict = {
  field: string
  category: TravelFieldCategory
  base: unknown
  source: unknown
  current: unknown
}

export type TravelFieldCategory =
  | 'admin-override'
  | 'faithful-source-projection'
  | 'identity-publication'
  | 'media-projection'
  | 'source-metadata'
  | 'structured-display-projection'

export type TravelReconciliationPlan = {
  slug: string
  action: 'already-converged' | 'apply-source' | 'conflict' | 'create' | 'preserve-current' | 'skip'
  patch: TravelProjection
  conflicts: ReconciliationConflict[]
}

const ignoredProjectionKeys = new Set([
  'collection',
  'createdAt',
  'dailyHighlights',
  'id',
  'itineraryImages',
  'sourceMetadata',
  'updatedAt',
])
const relationshipFields = new Set([
  'coverImage',
  'galleryImages',
  'itineraryImages',
  'media',
  'mediaItems',
  'members',
])

export function buildTravelProjection(value: TravelProjection): TravelProjection {
  return normalizeRecord(value)
}

export function travelProjectionHash(projection: TravelProjection): string {
  return createHash('sha256').update(stableStringify(projection)).digest('hex')
}

export function classifyTravelField(field: string): TravelFieldCategory {
  const root = field.split(/[.[]/, 1)[0]

  if (['slug', 'status', 'startDate', 'endDate', 'title', 'isPrivate'].includes(root ?? '')) {
    return 'identity-publication'
  }

  if (root === 'sourceMetadata' || root === 'externalDocIdentifier') {
    return 'source-metadata'
  }

  if (['coverImage', 'galleryImages', 'itineraryImages'].includes(root ?? '') || field.includes('.mediaItems')) {
    return 'media-projection'
  }

  if (['planningSections', 'sourceSections', 'storySections'].includes(root ?? '')) {
    return 'faithful-source-projection'
  }

  if (root === 'moments' || field.includes('.placements')) {
    return 'faithful-source-projection'
  }

  if (['members'].includes(root ?? '') || /enableComments|enableThumbs/.test(field)) {
    return 'admin-override'
  }

  return 'structured-display-projection'
}

export function reconciliationModeFromArgs(args: string[]): ReconciliationMode {
  const selected = [
    args.includes('--source-wins') ? 'source-wins' : undefined,
    args.includes('--payload-wins') ? 'payload-wins' : undefined,
  ].filter((mode): mode is ReconciliationMode => Boolean(mode))

  if (selected.length > 1) {
    throw new Error('Select only one travel reconciliation mode.')
  }

  return selected[0] ?? 'safe'
}

export async function writePayloadTravelDraft(input: {
  artifactRoot: string
  slug: string
  sourceFile?: string
  current: TravelProjection
}): Promise<string> {
  const destination = path.join(input.artifactRoot, `${input.slug}.payload-draft.md`)
  await mkdir(input.artifactRoot, { recursive: true })
  const content = [
    '---',
    `travelSlug: ${JSON.stringify(input.slug)}`,
    `sourceFile: ${JSON.stringify(input.sourceFile ?? '')}`,
    'artifactType: payload-reconciliation-draft',
    '---',
    '',
    '# Payload travel reconciliation draft',
    '',
    'This review artifact does not replace the original content source.',
    '',
    '```json',
    JSON.stringify(input.current, null, 2),
    '```',
    '',
  ].join('\n')

  await writeFile(destination, content, 'utf8')
  return destination
}

export function reconcileTravelSeed(input: {
  slug: string
  base?: TravelProjection
  source: TravelProjection
  current?: TravelProjection
  mode?: ReconciliationMode
}): TravelReconciliationPlan {
  const mode = input.mode ?? 'safe'

  if (!input.current) {
    return { slug: input.slug, action: 'create', patch: input.source, conflicts: [] }
  }

  if (!input.base) {
    return { slug: input.slug, action: 'preserve-current', patch: {}, conflicts: [] }
  }

  const patch: TravelProjection = {}
  const conflicts: ReconciliationConflict[] = []
  let currentOnlyChanges = 0
  let convergedChanges = 0

  for (const field of new Set([
    ...Object.keys(input.base),
    ...Object.keys(input.source),
    ...Object.keys(input.current),
  ])) {
    const base = input.base[field]
    const source = input.source[field]
    const current = input.current[field]
    const sourceChanged = !sameValue(base, source)
    const currentChanged = !sameValue(base, current)

    if (sourceChanged && !currentChanged) {
      patch[field] = source
    } else if (!sourceChanged && currentChanged) {
      currentOnlyChanges += 1
    } else if (sourceChanged && currentChanged && sameValue(source, current)) {
      convergedChanges += 1
    } else if (sourceChanged && currentChanged) {
      if (mode === 'source-wins') {
        patch[field] = source
      } else if (mode === 'payload-wins') {
        currentOnlyChanges += 1
      } else {
        const arrayPlan = reconcileStableArray(field, base, source, current)

        if (arrayPlan) {
          conflicts.push(...arrayPlan.conflicts)
          if (arrayPlan.sourceChanged && !arrayPlan.conflicts.length) {
            patch[field] = arrayPlan.value
          }
          if (arrayPlan.currentChanged) currentOnlyChanges += 1
        } else if (stableArrayIdentity(field)) {
          // A supported array without complete unique identities is unsafe to
          // decompose. Keep the full parent conflict for owner review.
          conflicts.push({ field, category: classifyTravelField(field), base, source, current })
        } else {
          conflicts.push(...describeConflicts(field, base, source, current))
        }
      }
    }
  }

  if (conflicts.length) {
    return { slug: input.slug, action: 'conflict', patch, conflicts }
  }

  if (Object.keys(patch).length) {
    return { slug: input.slug, action: 'apply-source', patch, conflicts }
  }

  if (convergedChanges) {
    return { slug: input.slug, action: 'already-converged', patch, conflicts }
  }

  if (currentOnlyChanges) {
    return { slug: input.slug, action: 'preserve-current', patch, conflicts }
  }

  return { slug: input.slug, action: 'skip', patch, conflicts }
}

type StableArrayPlan = {
  value: unknown[]
  conflicts: ReconciliationConflict[]
  sourceChanged: boolean
  currentChanged: boolean
}

type StableRecordPlan = Omit<StableArrayPlan, 'value'> & {
  value: Record<string, unknown>
}

function reconcileStableArray(
  field: string,
  base: unknown,
  source: unknown,
  current: unknown,
): StableArrayPlan | undefined {
  const identity = stableArrayIdentity(field)
  if (!identity || !Array.isArray(base) || !Array.isArray(source) || !Array.isArray(current)) {
    return undefined
  }

  const baseItems = recordsByStableIdentity(base, identity)
  const sourceItems = recordsByStableIdentity(source, identity)
  const currentItems = recordsByStableIdentity(current, identity)
  if (!baseItems || !sourceItems || !currentItems) return undefined

  const value: unknown[] = []
  const conflicts: ReconciliationConflict[] = []
  let sourceChanged = false
  let currentChanged = false

  // Preserve the published Current ordering when a safe item-level patch is built.
  for (const key of orderedStableKeys(currentItems, sourceItems, baseItems)) {
    const baseItem = baseItems.get(key)
    const sourceItem = sourceItems.get(key)
    const currentItem = currentItems.get(key)

    if (!baseItem || !sourceItem || !currentItem) {
      return undefined
    }

    const merged = mergeStableRecord(`${field}[${key}]`, baseItem, sourceItem, currentItem)
    value.push(merged.value)
    conflicts.push(...merged.conflicts)
    sourceChanged ||= merged.sourceChanged
    currentChanged ||= merged.currentChanged
  }

  return { value, conflicts, sourceChanged, currentChanged }
}

function stableArrayIdentity(
  field: string,
): ((item: Record<string, unknown>) => string | undefined) | undefined {
  if (field === 'flights') {
    return (item) => compositeIdentity(item, ['flightNumber', 'date', 'route'])
  }

  if (field === 'dailyHighlights' || field === 'dailyItinerary') {
    return (item) =>
      typeof item.day === 'number' && Number.isInteger(item.day) && item.day > 0
        ? `day-${item.day}`
        : undefined
  }

  if (
    field === 'planningSections' ||
    field === 'sourceSections' ||
    field === 'storySections'
  ) {
    return (item) =>
      typeof item.anchor === 'string' && item.anchor.trim() ? item.anchor : undefined
  }

  if (field === 'lodgings') {
    return (item) => compositeIdentity(item, ['dateRange', 'hotel', 'city'])
  }

  if (field === 'moments' || field.endsWith('.moments')) {
    return (item) =>
      typeof item.momentKey === 'string' && item.momentKey.trim()
        ? item.momentKey
        : undefined
  }

  if (field === 'placements' || field.endsWith('.placements')) {
    return (item) =>
      typeof item.placementKey === 'string' && item.placementKey.trim()
        ? item.placementKey
        : undefined
  }

  return undefined
}

function compositeIdentity(
  item: Record<string, unknown>,
  keys: string[],
): string | undefined {
  const values = keys.map((key) => item[key])
  return values.every((value) => typeof value === 'string' && value.trim())
    ? values.join('|')
    : undefined
}

function recordsByStableIdentity(
  items: unknown[],
  identity: (item: Record<string, unknown>) => string | undefined,
): Map<string, Record<string, unknown>> | undefined {
  const result = new Map<string, Record<string, unknown>>()

  for (const item of items) {
    if (!isRecord(item)) return undefined
    const key = identity(item)
    if (!key || result.has(key)) return undefined
    result.set(key, item)
  }

  return result
}

function orderedStableKeys(
  ...maps: Map<string, Record<string, unknown>>[]
): string[] {
  return [...new Set(maps.flatMap((map) => [...map.keys()]))]
}

function mergeStableRecord(
  path: string,
  base: Record<string, unknown>,
  source: Record<string, unknown>,
  current: Record<string, unknown>,
): StableRecordPlan {
  const value: Record<string, unknown> = {}
  const conflicts: ReconciliationConflict[] = []
  let sourceChanged = false
  let currentChanged = false

  for (const key of new Set([...Object.keys(base), ...Object.keys(source), ...Object.keys(current)])) {
    const baseValue = base[key]
    const sourceValue = source[key]
    const currentValue = current[key]
    const sourceValueChanged = !sameValue(baseValue, sourceValue)
    const currentValueChanged = !sameValue(baseValue, currentValue)

    if (sourceValueChanged && !currentValueChanged) {
      value[key] = sourceValue
      sourceChanged = true
    } else if (!sourceValueChanged && currentValueChanged) {
      value[key] = currentValue
      currentChanged = true
    } else if (sourceValueChanged && currentValueChanged && !sameValue(sourceValue, currentValue)) {
      const nestedField = `${path}.${key}`
      const nestedArray = reconcileStableArray(
        nestedField,
        baseValue,
        sourceValue,
        currentValue,
      )

      if (nestedArray) {
        value[key] = nestedArray.value
        conflicts.push(...nestedArray.conflicts)
        sourceChanged ||= nestedArray.sourceChanged
        currentChanged ||= nestedArray.currentChanged
      } else {
        value[key] = currentValue
        currentChanged = true
        conflicts.push({
          field: nestedField,
          category: classifyTravelField(nestedField),
          base: baseValue,
          source: sourceValue,
          current: currentValue,
        })
      }
    } else {
      value[key] = currentValue
    }
  }

  return { value, conflicts, sourceChanged, currentChanged }
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function describeConflicts(
  field: string,
  base: unknown,
  source: unknown,
  current: unknown,
): ReconciliationConflict[] {
  if (field !== 'sourceSections') {
    return [{ field, category: classifyTravelField(field), base, source, current }]
  }

  const baseByAnchor = sectionsByAnchor(base)
  const sourceByAnchor = sectionsByAnchor(source)
  const currentByAnchor = sectionsByAnchor(current)
  const details: ReconciliationConflict[] = []

  for (const anchor of new Set([
    ...baseByAnchor.keys(),
    ...sourceByAnchor.keys(),
    ...currentByAnchor.keys(),
  ])) {
    const baseSection = baseByAnchor.get(anchor)
    const sourceSection = sourceByAnchor.get(anchor)
    const currentSection = currentByAnchor.get(anchor)

    for (const key of new Set([
      ...Object.keys(baseSection ?? {}),
      ...Object.keys(sourceSection ?? {}),
      ...Object.keys(currentSection ?? {}),
    ])) {
      const baseValue = baseSection?.[key]
      const sourceValue = sourceSection?.[key]
      const currentValue = currentSection?.[key]

      if (
        !sameValue(baseValue, sourceValue) &&
        !sameValue(baseValue, currentValue) &&
        !sameValue(sourceValue, currentValue)
      ) {
        details.push({
          field: `sourceSections[${anchor}].${key}`,
          category: classifyTravelField(`sourceSections[${anchor}].${key}`),
          base: baseValue,
          source: sourceValue,
          current: currentValue,
        })
      }
    }
  }

  return details.length
    ? details
    : [{ field, category: classifyTravelField(field), base, source, current }]
}

function sectionsByAnchor(value: unknown): Map<string, Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return new Map()
  }

  return new Map(
    value.flatMap((section) => {
      if (!isRecord(section) || typeof section.anchor !== 'string') {
        return []
      }

      return [[section.anchor, section] as const]
    }),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, item]) =>
          !ignoredProjectionKeys.has(key) && item !== undefined && item !== null,
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, normalizeValue(item, key)]),
  )
}

function normalizeValue(value: unknown, field: string): unknown {
  if (relationshipFields.has(field)) {
    if (Array.isArray(value)) {
      return value.map(relationshipId)
    }

    return relationshipId(value)
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10)
  }

  if (Array.isArray(value)) {
    return value.map((item) => (isRecord(item) ? normalizeRecord(item) : item))
  }

  return isRecord(value) ? normalizeRecord(value) : value
}

function relationshipId(value: unknown): unknown {
  return isRecord(value) && ('id' in value) ? value.id : value
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}
