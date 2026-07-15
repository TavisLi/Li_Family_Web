import { classifyTravelPlan, type TravelPlanPresentation } from '@/lib/travel-domain'
import type { TravelProject } from '@/payload/payload-types'

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
  code: 'legacy-references' | 'migration-not-applied' | 'target-not-empty'
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

const planUnsupportedFields: (keyof TravelProject)[] = [
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
]

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

  if (hasValue(project.sourceMetadata)) {
    blockers.push({
      sourcePath: 'sourceMetadata',
      reason:
        '舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。',
    })
  }

  if (project.status === 'planning') {
    addUnsupportedFieldBlockers(project, planUnsupportedFields, blockers, 'Plan')

    if (project.members?.length) {
      mappings.push({ sourcePath: 'members', targetPath: 'members' })
    }
    if (project.party?.length) {
      mappings.push({ sourcePath: 'party', targetPath: 'guestParticipants' })
    }

    if (project.sourceSections?.length) {
      mappings.push({ sourcePath: 'sourceSections', targetPath: 'planningSections' })

      project.sourceSections.forEach((section, index) => {
        for (const field of ['displayDay', 'displayDate', 'displaySubtitle'] as const) {
          if (hasValue(section[field])) {
            blockers.push({
              sourcePath: `sourceSections[${index}].${field}`,
              reason:
                '舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。',
            })
          }
        }

        if (
          typeof section.enableThumbsUp === 'boolean' &&
          typeof section.enableThumbsDown === 'boolean' &&
          section.enableThumbsUp !== section.enableThumbsDown
        ) {
          blockers.push({
            sourcePath: `sourceSections[${index}].interactions`,
            reason:
              '目標 Plan 只有一個 voting 開關，無法保留不同的 thumb-up／thumb-down 設定。',
          })
        }
      })
    }
  } else {
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
      { sourcePath: 'externalVideos', targetPath: 'externalVideos' },
      { sourcePath: 'reminders', targetPath: 'reminders' },
    )

    if (project.sourceSections?.length) {
      blockers.push({
        sourcePath: 'sourceSections',
        reason:
          'Memory storySections 尚未承接 legacy level、display labels 與 interaction settings；需要 legacy snapshot 或逐欄 transformer。',
      })
    }
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

export function buildTravelCollectionCopyReadiness(
  projects: TravelProject[],
  environment: TravelCopyEnvironmentInventory,
  currentDate: Date = new Date(),
): TravelCollectionCopyReadiness {
  const assessments = projects.map((project) => assessTravelProjectCopy(project, currentDate))
  const globalBlockers: TravelCopyGlobalBlocker[] = []

  if (!environment.migrationApplied) {
    globalBlockers.push({
      code: 'migration-not-applied',
      reason: 'Additive travel collection migration 尚未套用。',
    })
  }

  const referenceCount = Object.values(environment.references).reduce(
    (total, count) => total + count,
    0,
  )
  if (referenceCount > 0) {
    globalBlockers.push({
      code: 'legacy-references',
      reason:
        'Media、TimelineEvents 或 HomeConfig 仍引用 travel-projects，需要 cutover policy。',
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
    `- Additive migration applied：${report.environment.migrationApplied ? 'yes' : 'no'}`,
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

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.some(hasValue)
  if (typeof value === 'object') return Object.values(value).some(hasValue)
  return true
}

function escapeMarkdown(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ')
}
