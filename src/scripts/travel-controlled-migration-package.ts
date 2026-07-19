import { createHash } from 'node:crypto'

export const phase17ControlledMigrationNames = [
  '20260715_073322_phase_17_add_travel_collections',
  '20260715_094310_phase_17_expand_travel_memory_preservation',
  '20260716_045235_phase_17_align_travel_plan_sections',
  '20260716_091228_phase_17_align_travel_memory_sections',
  '20260716_094718_phase_17_add_travel_cutover_relationships',
] as const

export const phase17ControlledMigrationBatch = 6

export const phase17ExpectedMigrationHistory = [
  { batch: -1, name: 'dev' },
  { batch: 1, name: '20260619_055511_phase_7_time_capsule' },
  { batch: 2, name: '20260624_143753_add_user_role' },
  { batch: 3, name: '20260625_234308_travel_source_sections' },
  { batch: 4, name: '20260628_130305_member_profile_config' },
  { batch: 1, name: '20260630_150145_travel_source_section_interactions' },
  { batch: null, name: '20260701_123939_add_travel_source_section_display_title_fields' },
  { batch: 5, name: '20260711_141901' },
] as const

export type ControlledMigrationInventory = {
  featuredTravel: number
  legacyProjects: number
  media: number
  timelineEvents: number
}

export type ControlledMigrationState = {
  databaseFingerprint: string
  implementationFingerprint: string
  inventory: ControlledMigrationInventory
  migrationFingerprints: readonly { name: string; sha256: string }[]
  migrationHistory: readonly { batch: number | null; name: string }[]
  targetObjects: {
    homeConfigRelationships: boolean
    lockedDocumentMemoryColumn: boolean
    lockedDocumentPlanColumn: boolean
    mediaMemoryColumn: boolean
    mediaPlanColumn: boolean
    timelineMemoryColumn: boolean
    timelinePlanColumn: boolean
    travelMemories: boolean
    travelPlans: boolean
    travelRouteIdentities: boolean
  }
}

export function buildControlledMigrationApprovalToken(state: ControlledMigrationState) {
  return `phase-17-migrate:${createHash('sha256')
    .update(
      JSON.stringify({
        ...state,
        migrationFingerprints: [...state.migrationFingerprints].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        migrationHistory: [...state.migrationHistory].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }),
    )
    .digest('hex')
    .slice(0, 16)}`
}

export function buildControlledMigrationReadbackToken(state: ControlledMigrationState) {
  return buildControlledMigrationApprovalToken({
    ...state,
    migrationHistory: phase17ExpectedMigrationHistory,
    targetObjects: {
      homeConfigRelationships: false,
      lockedDocumentMemoryColumn: false,
      lockedDocumentPlanColumn: false,
      mediaMemoryColumn: false,
      mediaPlanColumn: false,
      timelineMemoryColumn: false,
      timelinePlanColumn: false,
      travelMemories: false,
      travelPlans: false,
      travelRouteIdentities: false,
    },
  })
}

export function assertControlledMigrationPreconditions(state: ControlledMigrationState) {
  if (
    JSON.stringify(state.migrationHistory) !==
    JSON.stringify(phase17ExpectedMigrationHistory)
  ) {
    throw new Error('Controlled migration history does not match the approved baseline')
  }
  if (Object.values(state.targetObjects).some(Boolean)) {
    throw new Error('Controlled migration requires all Phase 17 target schema objects to be absent')
  }
  const expectedInventory: ControlledMigrationInventory = {
    featuredTravel: 1,
    legacyProjects: 5,
    media: 12,
    timelineEvents: 2,
  }
  if (JSON.stringify(state.inventory) !== JSON.stringify(expectedInventory)) {
    throw new Error('Controlled migration inventory does not match the approved baseline')
  }
  if (
    JSON.stringify(state.migrationFingerprints.map(({ name }) => name)) !==
    JSON.stringify(phase17ControlledMigrationNames)
  ) {
    throw new Error('Controlled migration files do not match the approved migration list')
  }
}

export function assertControlledMigrationWriteApproval(input: {
  allowWrite: boolean
  expectedTarget: string
  expectedToken: string
  providedTarget: string | undefined
  providedToken: string | undefined
}) {
  if (!input.allowWrite) throw new Error('Controlled migration requires --allow-write')
  if (input.providedTarget !== input.expectedTarget) {
    throw new Error('Controlled migration target confirmation mismatch')
  }
  if (input.providedToken !== input.expectedToken) {
    throw new Error('Controlled migration approval confirmation mismatch')
  }
}
