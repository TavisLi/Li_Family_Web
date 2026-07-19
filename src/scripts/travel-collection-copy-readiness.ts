import { classifyTravelPlan, type TravelPlanPresentation } from '@/lib/travel-domain'
import type { TravelProject } from '@/payload/payload-types'
import type { TravelSeed } from './seed-content'
import { buildTravelMemoryCopyDraft } from './travel-memory-copy-transformer'
import {
  buildTravelProjection,
  travelProjectionHash,
  type TravelProjection,
} from './travel-seed-reconciliation'

export type TravelCopyBlocker = {
  sourcePath: string
  reason: string
}

export type TravelCopyMapping = {
  sourcePath: string
  targetPath: string
}

export type TravelCopyWarning = {
  sourcePath: string
  reason: string
}

export type TravelProjectCopyAssessment = {
  sourceId: number
  slug: string
  targetCollection: 'travel-memories' | 'travel-plans'
  planPresentation?: TravelPlanPresentation
  readiness: 'blocked' | 'ready'
  blockers: TravelCopyBlocker[]
  mappings: TravelCopyMapping[]
  warnings: TravelCopyWarning[]
}

export type TravelCopyEnvironmentInventory = {
  migrationApplied: boolean
  targetRows: {
    travelMemories: number
    travelPlans: number
    travelRouteIdentities: number
  }
  references: {
    featuredTravel: number
    media: number
    timelineEvents: number
  }
  referenceOwners: {
    slug: string
    featuredTravel: number
    media: number
    timelineEvents: number
  }[]
}

export type TravelCopyGlobalBlocker = {
  code: 'migration-not-applied' | 'target-not-empty'
  reason: string
}

export type TravelCollectionCopyReadiness = {
  generatedAt: string
  writeReadiness: 'blocked' | 'ready'
  summary: {
    total: number
    plans: number
    activePlans: number
    archivedPlans: number
    memories: number
    ready: number
    blocked: number
  }
  environment: TravelCopyEnvironmentInventory
  fieldUsage: Record<TravelCopyInventoryField, number>
  globalBlockers: TravelCopyGlobalBlocker[]
  projects: TravelProjectCopyAssessment[]
}

const inventoryFields = [
  'externalDocIdentifier',
  'sourceMetadata',
  'coverImage',
  'galleryImages',
  'itineraryImages',
  'members',
  'summary',
  'party',
  'flights',
  'railSegments',
  'lodgings',
  'cabinAssignments',
  'dailyItinerary',
  'foodRecommendations',
  'costItems',
  'optionalActivities',
  'reminders',
  'sourceSections',
  'externalVideos',
] as const satisfies readonly (keyof TravelProject)[]

export type TravelCopyInventoryField = (typeof inventoryFields)[number]

const planApprovedDropFields = [
  'galleryImages',
  'itineraryImages',
  'flights',
  'railSegments',
  'lodgings',
  'cabinAssignments',
  'dailyItinerary',
  'foodRecommendations',
  'costItems',
  'optionalActivities',
  'reminders',
  'externalVideos',
] as const satisfies readonly (keyof TravelProject)[]

const memoryUnsupportedFields: (keyof TravelProject)[] = [
  'railSegments',
  'cabinAssignments',
  'foodRecommendations',
  'costItems',
  'optionalActivities',
]

export function assessTravelProjectCopy(
  project: TravelProject,
  currentDate: Date = new Date(),
  source?: TravelSeed,
): TravelProjectCopyAssessment {
  const blockers: TravelCopyBlocker[] = []
  const warnings: TravelCopyWarning[] = []
  const mappings: TravelCopyMapping[] = [
    { sourcePath: 'title', targetPath: 'title' },
    { sourcePath: 'slug', targetPath: 'slug' },
    { sourcePath: 'isPrivate', targetPath: 'isPrivate' },
    { sourcePath: 'startDate', targetPath: 'startDate' },
    { sourcePath: 'endDate', targetPath: 'endDate' },
    { sourcePath: 'summary', targetPath: 'summary' },
    { sourcePath: 'coverImage', targetPath: 'coverImage' },
  ]

  if (project.status === 'planning') {
    addApprovedDropWarnings(project, planApprovedDropFields, warnings)

    if (!source) {
      blockers.push({
        sourcePath: 'sourceMetadata',
        reason: '找不到與 Plan slug 對應的即時 Source；不能完成 Base／Source／Current 證據檢查。',
      })
    } else {
      try {
        buildTravelPlanCopyDraft(project, source)
        mappings.push({
          sourcePath: 'sourceMetadata.baseProjection',
          targetPath: 'sourceMetadata (rebuilt Plan Base/hash)',
        })
      } catch (error) {
        blockers.push({
          sourcePath: 'sourceMetadata',
          reason: error instanceof Error ? error.message : '無法重建 Plan Base／hash。',
        })
      }
    }

    if (project.members?.length) {
      mappings.push({ sourcePath: 'members', targetPath: 'members' })
    }
    if (project.party?.length) {
      mappings.push({ sourcePath: 'party', targetPath: 'guestParticipants' })
    }

    if (project.sourceSections?.length) {
      mappings.push({ sourcePath: 'sourceSections', targetPath: 'planningSections' })
    }
  } else {
    if (!source) {
      blockers.push({
        sourcePath: 'sourceMetadata',
        reason: '找不到與 Memory slug 對應的即時 Source；不能完成 Base／Source／Current 證據檢查。',
      })
    } else {
      try {
        buildTravelMemoryCopyDraft(project, source)
        mappings.push({
          sourcePath: 'sourceMetadata.baseProjection',
          targetPath: 'sourceMetadata (rebuilt Memory Base/hash)',
        })
      } catch (error) {
        blockers.push({
          sourcePath: 'sourceMetadata',
          reason: error instanceof Error ? error.message : '無法重建 Memory Base／hash。',
        })
      }
    }
    addUnsupportedFieldBlockers(project, memoryUnsupportedFields, blockers, 'Memory')
    mappings.push(
      { sourcePath: 'members', targetPath: 'participants' },
      { sourcePath: 'party', targetPath: 'guestParticipants' },
      { sourcePath: 'galleryImages', targetPath: 'galleryImages' },
      { sourcePath: 'itineraryImages', targetPath: 'itineraryImages' },
      { sourcePath: 'flights', targetPath: 'travelLedger.flights' },
      { sourcePath: 'flights[].date', targetPath: 'travelLedger.flights[].dateLabel' },
      { sourcePath: 'flights[].passengers', targetPath: 'travelLedger.flights[].passengers' },
      { sourcePath: 'flights[].terminal', targetPath: 'travelLedger.flights[].terminal' },
      { sourcePath: 'lodgings', targetPath: 'travelLedger.lodgings' },
      { sourcePath: 'lodgings[].dateRange', targetPath: 'travelLedger.lodgings[].dateRange' },
      { sourcePath: 'dailyItinerary', targetPath: 'dailyHighlights' },
      { sourcePath: 'dailyItinerary[].date', targetPath: 'dailyHighlights[].dateLabel' },
      { sourcePath: 'sourceSections', targetPath: 'storySections' },
      { sourcePath: 'externalVideos', targetPath: 'externalVideos' },
      { sourcePath: 'reminders', targetPath: 'reminders' },
    )

  }

  return {
    sourceId: project.id,
    slug: project.slug,
    targetCollection: project.status === 'planning' ? 'travel-plans' : 'travel-memories',
    planPresentation:
      project.status === 'planning' ? classifyTravelPlan(project.endDate, currentDate) : undefined,
    readiness: blockers.length ? 'blocked' : 'ready',
    blockers,
    mappings,
    warnings,
  }
}

type PlanningSectionCopy = {
  level: number
  title: unknown
  anchor: string
  displayDay?: unknown
  displayDate?: unknown
  displaySubtitle?: unknown
  body: unknown
  links?: { label?: unknown; url: string }[]
  mediaItems?: unknown[]
  interactions: {
    commentsEnabled: boolean
    thumbsUpEnabled: boolean
    thumbsDownEnabled: boolean
  }
}

type TravelPlanProjection = TravelProjection & {
  slug: string
  planningSections?: PlanningSectionCopy[]
}

export type TravelPlanCopyDraft = {
  data: TravelPlanProjection & {
    sourceMetadata: {
      sourceFile: string
      sourceHash: string
      parserVersion: 'phase-17-plan-v1'
      baseProjection: TravelPlanProjection
    }
  }
  baseProjection: TravelPlanProjection
  expectedSourceHash: string
}

export function buildTravelPlanCopyDraft(
  project: TravelProject,
  source: TravelSeed,
): TravelPlanCopyDraft {
  if (project.status !== 'planning') {
    throw new Error('Travel Plan copy draft requires a planning TravelProject.')
  }

  const legacyBase = project.sourceMetadata?.baseProjection
  if (!isRecord(legacyBase)) {
    throw new Error('舊 Plan 缺少可轉換的 Base projection。')
  }

  const sourceFile = project.sourceMetadata?.sourceFile ?? project.externalDocIdentifier
  if (!sourceFile) {
    throw new Error('舊 Plan 缺少 source file identity。')
  }

  const currentProjection = buildTravelPlanProjection(project as unknown as Record<string, unknown>)
  const baseProjection = buildTravelProjection(
    buildTravelPlanProjection(legacyBase),
  ) as TravelPlanProjection

  if (source.slug !== project.slug) {
    throw new Error('Plan Source slug 與 Payload Current 不一致。')
  }
  if (source.externalDocIdentifier !== sourceFile) {
    throw new Error('Plan Source file identity 與舊 migration evidence 不一致。')
  }

  const liveSourceProjection = buildTravelProjection(
    buildTravelPlanProjection(source as unknown as Record<string, unknown>),
  ) as TravelPlanProjection
  if (
    JSON.stringify(comparablePlanSource(baseProjection)) !==
    JSON.stringify(comparablePlanSource(liveSourceProjection))
  ) {
    throw new Error('Plan Source 已相對舊 Base 改變；必須先重新執行 reconciliation。')
  }
  const expectedSourceHash = travelProjectionHash(baseProjection)

  return {
    data: {
      ...currentProjection,
      sourceMetadata: {
        sourceFile,
        sourceHash: expectedSourceHash,
        parserVersion: 'phase-17-plan-v1',
        baseProjection,
      },
    },
    baseProjection,
    expectedSourceHash,
  }
}

function comparablePlanSource(projection: TravelPlanProjection): TravelProjection {
  const comparable: TravelProjection = {}
  for (const field of [
    'title',
    'slug',
    'isPrivate',
    'startDate',
    'endDate',
    'summary',
    'guestParticipants',
  ]) {
    if (hasValue(projection[field]) || typeof projection[field] === 'boolean') {
      comparable[field] = projection[field]
    }
  }

  if (projection.planningSections) {
    comparable.planningSections = projection.planningSections.map(
      ({ mediaItems: _mediaItems, ...section }) => section,
    )
  }

  return buildTravelProjection(comparable)
}

export function buildTravelPlanProjection(value: Record<string, unknown>): TravelPlanProjection {
  if (typeof value.slug !== 'string' || !value.slug) {
    throw new Error('舊 Plan 缺少 canonical slug。')
  }

  const projection: TravelPlanProjection = { slug: value.slug }
  for (const field of [
    'title',
    'isPrivate',
    'startDate',
    'endDate',
    'summary',
    'coverImage',
    'members',
    '_status',
  ] as const) {
    if (hasValue(value[field]) || typeof value[field] === 'boolean') {
      projection[field] = value[field]
    }
  }

  if (Array.isArray(value.party) && value.party.length) {
    projection.guestParticipants = value.party.flatMap((participant) => {
      if (!isRecord(participant) || !hasValue(participant.name)) return []
      return [{ name: participant.name, note: participant.note }]
    })
  }

  if (Array.isArray(value.sourceSections) && value.sourceSections.length) {
    projection.planningSections = value.sourceSections.map(mapPlanningSection)
    assertUniqueAnchors(projection.planningSections, 'Plan')
  }

  return projection
}

function mapPlanningSection(section: unknown): PlanningSectionCopy {
  if (
    !isRecord(section) ||
    typeof section.level !== 'number' ||
    typeof section.anchor !== 'string' ||
    !hasValue(section.title) ||
    !hasValue(section.body)
  ) {
    throw new Error('舊 Plan 含有無法轉換的 source section。')
  }

  const mapped: PlanningSectionCopy = {
    level: section.level,
    title: section.title,
    anchor: section.anchor,
    body: section.body,
    interactions: {
      commentsEnabled: section.enableComments !== false,
      thumbsUpEnabled: section.enableThumbsUp !== false,
      thumbsDownEnabled: section.enableThumbsDown !== false,
    },
  }

  for (const field of ['displayDay', 'displayDate', 'displaySubtitle'] as const) {
    if (hasValue(section[field])) mapped[field] = section[field]
  }

  if (Array.isArray(section.links) && section.links.length) {
    mapped.links = section.links.flatMap((link) => {
      if (!isRecord(link) || typeof link.url !== 'string') return []
      return [{ label: link.label, url: link.url }]
    })
  }

  if (Array.isArray(section.mediaItems) && section.mediaItems.length) {
    mapped.mediaItems = section.mediaItems
  }

  return mapped
}

export function buildTravelCollectionCopyReadiness(
  projects: TravelProject[],
  environment: TravelCopyEnvironmentInventory,
  currentDate: Date = new Date(),
  sourceBySlug: ReadonlyMap<string, TravelSeed>,
): TravelCollectionCopyReadiness {
  const assessments = projects.map((project) =>
    assessTravelProjectCopy(project, currentDate, sourceBySlug.get(project.slug)),
  )
  const globalBlockers: TravelCopyGlobalBlocker[] = []

  if (!environment.migrationApplied) {
    globalBlockers.push({
      code: 'migration-not-applied',
      reason: 'Phase 17 target collection migrations 尚未完整套用。',
    })
  }

  if (Object.values(environment.targetRows).some((count) => count > 0)) {
    globalBlockers.push({
      code: 'target-not-empty',
      reason: '目標 collections 並非空表，copy 必須先 reconciliation，不能假設為首次匯入。',
    })
  }

  const plans = assessments.filter((assessment) => assessment.targetCollection === 'travel-plans')
  const memories = assessments.filter(
    (assessment) => assessment.targetCollection === 'travel-memories',
  )
  const ready = assessments.filter((assessment) => assessment.readiness === 'ready').length
  const fieldUsage = Object.fromEntries(
    inventoryFields.map((field) => [
      field,
      projects.filter((project) => hasValue(project[field])).length,
    ]),
  ) as Record<TravelCopyInventoryField, number>

  return {
    generatedAt: currentDate.toISOString(),
    writeReadiness:
      globalBlockers.length || ready !== assessments.length ? 'blocked' : 'ready',
    summary: {
      total: assessments.length,
      plans: plans.length,
      activePlans: plans.filter((assessment) => assessment.planPresentation === 'active').length,
      archivedPlans: plans.filter((assessment) => assessment.planPresentation === 'archived').length,
      memories: memories.length,
      ready,
      blocked: assessments.length - ready,
    },
    environment,
    fieldUsage,
    globalBlockers,
    projects: assessments,
  }
}

export function renderTravelCollectionCopyReadinessMarkdown(
  report: TravelCollectionCopyReadiness,
): string {
  const lines = [
    '# Phase 17 Travel Collection Copy Readiness',
    '',
    `產生時間：${report.generatedAt}`,
    '',
    `**Data-copy write readiness：${report.writeReadiness.toUpperCase()}**`,
    '',
    '## 摘要',
    '',
    '| 指標 | 數量 |',
    '| --- | ---: |',
    `| 舊 TravelProjects | ${report.summary.total} |`,
    `| Travel Plans | ${report.summary.plans} |`,
    `| Active Plans | ${report.summary.activePlans} |`,
    `| Archived Plans | ${report.summary.archivedPlans} |`,
    `| Travel Memories | ${report.summary.memories} |`,
    `| Record-level ready | ${report.summary.ready} |`,
    `| Record-level blocked | ${report.summary.blocked} |`,
    '',
    '## Environment',
    '',
    `- Target migrations applied：${report.environment.migrationApplied ? 'yes' : 'no'}`,
    `- Target rows：plans ${report.environment.targetRows.travelPlans}／memories ${report.environment.targetRows.travelMemories}／route identities ${report.environment.targetRows.travelRouteIdentities}`,
    `- Legacy references：media ${report.environment.references.media}／timeline events ${report.environment.references.timelineEvents}／featured travel ${report.environment.references.featuredTravel}`,
    '',
    '### Legacy reference owners',
    '',
    '| Slug | Media | TimelineEvents | FeaturedTravel |',
    '| --- | ---: | ---: | ---: |',
    ...report.environment.referenceOwners.map(
      (owner) =>
        `| ${owner.slug} | ${owner.media} | ${owner.timelineEvents} | ${owner.featuredTravel} |`,
    ),
    '',
    '## Global blockers',
    '',
    ...(report.globalBlockers.length
      ? report.globalBlockers.map(
          (blocker) => '- `' + blocker.code + '`：' + escapeMarkdown(blocker.reason),
        )
      : ['- 無。']),
    '',
    '## 非空欄位使用數',
    '',
    '| 舊欄位 | 非空 records |',
    '| --- | ---: |',
    ...Object.entries(report.fieldUsage)
      .filter(([, count]) => count > 0)
      .map(([field, count]) => '| `' + field + '` | ' + count + ' |'),
    '',
    '## 逐筆判定',
    '',
    '| Slug | Target | Plan 顯示 | Readiness | Blockers |',
    '| --- | --- | --- | --- | ---: |',
    ...report.projects.map(
      (project) =>
        '| `' +
        project.slug +
        '` | `' +
        project.targetCollection +
        '` | ' +
        (project.planPresentation ?? '—') +
        ' | ' +
        project.readiness +
        ' | ' +
        project.blockers.length +
        ' |',
    ),
    '',
    '## Record blockers',
    '',
    ...report.projects.flatMap((project) => [
      `### ${project.slug}`,
      '',
      ...(project.blockers.length
        ? project.blockers.map(
            (blocker) =>
              '- `' + blocker.sourcePath + '`：' + escapeMarkdown(blocker.reason),
          )
        : ['- 無 record-level blocker。']),
      ...(project.warnings.length
        ? [
            '',
            'Warnings：',
            ...project.warnings.map(
              (warning) =>
                '- `' + warning.sourcePath + '`：' + escapeMarkdown(warning.reason),
            ),
          ]
        : []),
      ...(project.mappings.length
        ? [
            '',
            'Mappings：',
            ...project.mappings.map(
              (mapping) =>
                '- `' + mapping.sourcePath + '` → `' + mapping.targetPath + '`',
            ),
          ]
        : []),
      '',
    ]),
    '## 結論',
    '',
    report.writeReadiness === 'ready'
      ? '所有 record 與 environment gates 已通過，仍需另行取得 data-copy write 批准。'
      : '目前只完成唯讀 inventory／copy dry-run；blockers 歸零並取得明確批准前，不得執行 data-copy write。',
    '',
  ]

  return lines.join('\n')
}

function addUnsupportedFieldBlockers(
  project: TravelProject,
  fields: (keyof TravelProject)[],
  blockers: TravelCopyBlocker[],
  targetLabel: 'Memory' | 'Plan',
) {
  for (const field of fields) {
    if (hasValue(project[field])) {
      blockers.push({
        sourcePath: field,
        reason: `目標 ${targetLabel} schema 尚未承接此欄位。`,
      })
    }
  }
}

function addApprovedDropWarnings(
  project: TravelProject,
  fields: readonly (keyof TravelProject)[],
  warnings: TravelCopyWarning[],
) {
  for (const field of fields) {
    if (hasValue(project[field])) {
      warnings.push({
        sourcePath: field,
        reason:
          '網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。',
      })
    }
  }
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.some(hasValue)
  if (typeof value === 'object') return Object.values(value).some(hasValue)
  return true
}

function escapeMarkdown(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertUniqueAnchors(
  sections: readonly { anchor: string }[],
  targetLabel: 'Memory' | 'Plan',
) {
  const anchors = new Set<string>()
  for (const section of sections) {
    if (anchors.has(section.anchor)) {
      throw new Error(`${targetLabel} sections 含有重複 anchor：${section.anchor}。`)
    }
    anchors.add(section.anchor)
  }
}
