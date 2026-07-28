import { createHash } from 'node:crypto'

export const phase17LegacyCleanupMigration = '20260719_025401'
export const phase17LegacyCleanupBatch = 8

export const phase17RequiredMigrations = [
  { batch: 6, name: '20260715_073322_phase_17_add_travel_collections' },
  { batch: 6, name: '20260715_094310_phase_17_expand_travel_memory_preservation' },
  { batch: 6, name: '20260716_045235_phase_17_align_travel_plan_sections' },
  { batch: 6, name: '20260716_091228_phase_17_align_travel_memory_sections' },
  { batch: 6, name: '20260716_094718_phase_17_add_travel_cutover_relationships' },
  { batch: 7, name: '20260717_121714_phase_17_secure_travel_data_api' },
] as const

export type TravelLegacyCleanupInventory = {
  homeLegacy: number
  homeShadow: number
  invalidMappings: number
  legacyProjects: number
  mediaLegacy: number
  mediaShadow: number
  memories: number
  plans: number
  routeIdentities: number
  timelineLegacy: number
  timelineShadow: number
}

export type TravelLegacyCleanupState = {
  backup: { reference: string; createdAt: string; verifiedAt: string }
  databaseFingerprint: string
  deployment: { commitSha: string; status: string; verifiedAt: string }
  implementationCommitSha: string
  implementationFingerprint: string
  inventory: TravelLegacyCleanupInventory
  legacyColumnsPresent: boolean
  legacyTableCount: number
  migrationHistory: readonly { batch: number | null; name: string }[]
}

const expectedInventory: TravelLegacyCleanupInventory = {
  homeLegacy: 1,
  homeShadow: 1,
  invalidMappings: 0,
  legacyProjects: 5,
  mediaLegacy: 12,
  mediaShadow: 12,
  memories: 3,
  plans: 2,
  routeIdentities: 5,
  timelineLegacy: 2,
  timelineShadow: 2,
}

export function buildTravelLegacyCleanupApprovalToken(state: TravelLegacyCleanupState) {
  return `phase-17-cleanup:${createHash('sha256')
    .update(JSON.stringify(normalizeState(state)))
    .digest('hex')
    .slice(0, 16)}`
}

export function assertTravelLegacyCleanupPreconditions(state: TravelLegacyCleanupState) {
  if (state.deployment.status !== 'success' || !/^[0-9a-f]{40}$/.test(state.deployment.commitSha)) {
    throw new Error('Legacy cleanup requires the reviewed Phase 17 runtime deployment to be successful')
  }
  if (state.deployment.commitSha !== state.implementationCommitSha) {
    throw new Error('Legacy cleanup requires the deployed commit to match the reviewed local cleanup checkout')
  }
  if (!state.deployment.verifiedAt) {
    throw new Error('Legacy cleanup requires a recorded runtime verification time')
  }
  if (!state.backup.reference || !state.backup.createdAt || !state.backup.verifiedAt) {
    throw new Error('Legacy cleanup requires a verified pre-cleanup backup reference')
  }
  if (JSON.stringify(state.inventory) !== JSON.stringify(expectedInventory)) {
    throw new Error('Legacy cleanup inventory does not match the approved 5 / 2 / 3 / 5 and 12 / 2 / 1 baseline')
  }
  if (state.legacyTableCount !== 33 || !state.legacyColumnsPresent) {
    throw new Error('Legacy cleanup requires all 33 legacy tables and four legacy relationship columns')
  }
  for (const required of phase17RequiredMigrations) {
    if (!state.migrationHistory.some((record) => record.batch === required.batch && record.name === required.name)) {
      throw new Error(`Legacy cleanup requires migration ${required.name} in batch ${required.batch}`)
    }
  }
  if (state.migrationHistory.some((record) => record.name === phase17LegacyCleanupMigration)) {
    throw new Error('Legacy cleanup migration is already recorded')
  }
}

export function assertTravelLegacyCleanupWriteApproval(input: {
  allowWrite: boolean
  expectedTarget: string
  expectedToken: string
  providedTarget: string | undefined
  providedToken: string | undefined
  providedBackup: string | undefined
  expectedBackup: string
}) {
  if (!input.allowWrite) throw new Error('Legacy cleanup requires --allow-write')
  if (input.providedTarget !== input.expectedTarget) throw new Error('Legacy cleanup target confirmation mismatch')
  if (input.providedToken !== input.expectedToken) throw new Error('Legacy cleanup approval token mismatch')
  if (input.providedBackup !== input.expectedBackup) throw new Error('Legacy cleanup backup confirmation mismatch')
}

export function assertTravelLegacyCleanupReadback(state: {
  inventory: Pick<TravelLegacyCleanupInventory, 'memories' | 'plans' | 'routeIdentities'>
  legacyColumnsPresent: boolean
  legacyTableCount: number
  migrationHistory: readonly { batch: number | null; name: string }[]
}) {
  if (state.legacyTableCount !== 0 || state.legacyColumnsPresent) {
    throw new Error('Legacy cleanup read-back found legacy schema objects')
  }
  if (JSON.stringify(state.inventory) !== JSON.stringify({ memories: 3, plans: 2, routeIdentities: 5 })) {
    throw new Error('Legacy cleanup read-back found target inventory drift')
  }
  if (!state.migrationHistory.some(
    (record) => record.batch === phase17LegacyCleanupBatch && record.name === phase17LegacyCleanupMigration,
  )) {
    throw new Error('Legacy cleanup migration record is missing from batch 8')
  }
}

function normalizeState(state: TravelLegacyCleanupState): TravelLegacyCleanupState {
  return {
    ...state,
    migrationHistory: [...state.migrationHistory].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
  }
}
