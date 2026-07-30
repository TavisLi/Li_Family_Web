import { createHash } from 'node:crypto'

export const phase17LegacyCleanupMigration = '20260719_025401'
export const phase17LegacyCleanupBatch = 8
export const phase17NoBackupWaiverConfirmation =
  'I_ACCEPT_IRREVERSIBLE_PHASE_17_LEGACY_DATA_LOSS'

export const phase17RequiredMigrations = [
  { batch: -1, name: 'dev' },
  { batch: 1, name: '20260619_055511_phase_7_time_capsule' },
  { batch: 2, name: '20260624_143753_add_user_role' },
  { batch: 3, name: '20260625_234308_travel_source_sections' },
  { batch: 4, name: '20260628_130305_member_profile_config' },
  { batch: 1, name: '20260630_150145_travel_source_section_interactions' },
  { batch: 5, name: '20260711_141901' },
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
  publicPublishedMemories: number
  publicPublishedPlans: number
  routeIdentities: number
  timelineLegacy: number
  timelineShadow: number
}

export type TravelLegacyCleanupState = {
  backup: { reference: string; createdAt: string; verifiedAt: string }
  noBackupWaiver?: { acceptedAt: string; confirmation: string }
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
  mediaLegacy: 22,
  mediaShadow: 22,
  memories: 3,
  plans: 2,
  publicPublishedMemories: 3,
  publicPublishedPlans: 2,
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

export function buildTravelLegacyCleanupRecoveryConfirmation(state: TravelLegacyCleanupState) {
  return state.noBackupWaiver?.confirmation ?? state.backup.reference
}

export function buildTravelLegacyCleanupRecoveryEnvironment(
  state: TravelLegacyCleanupState,
): Record<string, string> {
  if (state.noBackupWaiver) {
    return {
      TRAVEL_CLEANUP_NO_BACKUP_ACCEPTED_AT: state.noBackupWaiver.acceptedAt,
      TRAVEL_CLEANUP_NO_BACKUP_WAIVER: state.noBackupWaiver.confirmation,
      TRAVEL_CLEANUP_RECOVERY_CONFIRM: state.noBackupWaiver.confirmation,
    }
  }
  return {
    TRAVEL_CLEANUP_BACKUP_REFERENCE: state.backup.reference,
    TRAVEL_CLEANUP_BACKUP_CREATED_AT: state.backup.createdAt,
    TRAVEL_CLEANUP_BACKUP_VERIFIED_AT: state.backup.verifiedAt,
    TRAVEL_CLEANUP_RECOVERY_CONFIRM: state.backup.reference,
  }
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
  const hasVerifiedBackup = Boolean(
    state.backup.reference && state.backup.createdAt && state.backup.verifiedAt,
  )
  const hasAnyBackupMetadata = Boolean(
    state.backup.reference || state.backup.createdAt || state.backup.verifiedAt,
  )
  const hasAnyNoBackupWaiverMetadata = Boolean(
    state.noBackupWaiver?.acceptedAt || state.noBackupWaiver?.confirmation,
  )
  const waiverAcceptedAt = state.noBackupWaiver?.acceptedAt ?? ''
  const waiverAcceptedTimestamp = Date.parse(waiverAcceptedAt)
  const hasNoBackupWaiver = Boolean(
    isIsoInstant(waiverAcceptedAt) &&
      !Number.isNaN(waiverAcceptedTimestamp) &&
      waiverAcceptedTimestamp <= Date.now() &&
      state.noBackupWaiver?.confirmation === phase17NoBackupWaiverConfirmation,
  )
  if (hasAnyNoBackupWaiverMetadata && !hasNoBackupWaiver) {
    throw new Error('Legacy cleanup no-backup waiver is incomplete or invalid')
  }
  if (
    hasVerifiedBackup === hasNoBackupWaiver ||
    (hasNoBackupWaiver && hasAnyBackupMetadata)
  ) {
    throw new Error(
      'Legacy cleanup requires either a verified backup or an explicit no-backup waiver',
    )
  }
  if (JSON.stringify(state.inventory) !== JSON.stringify(expectedInventory)) {
    throw new Error('Legacy cleanup inventory does not match the approved 5 / 2 / 3 / 5 and 22 / 2 / 1 baseline')
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

function isIsoInstant(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

export function assertTravelLegacyCleanupWriteApproval(input: {
  allowWrite: boolean
  expectedTarget: string
  expectedToken: string
  expectedRecoveryConfirmation: string
  providedRecoveryConfirmation: string | undefined
  providedTarget: string | undefined
  providedToken: string | undefined
}) {
  if (!input.allowWrite) throw new Error('Legacy cleanup requires --allow-write')
  if (input.providedTarget !== input.expectedTarget) throw new Error('Legacy cleanup target confirmation mismatch')
  if (input.providedToken !== input.expectedToken) throw new Error('Legacy cleanup approval token mismatch')
  if (input.providedRecoveryConfirmation !== input.expectedRecoveryConfirmation) {
    throw new Error('Legacy cleanup recovery confirmation mismatch')
  }
}

export function assertTravelLegacyCleanupReadback(state: {
  inventory: Pick<
    TravelLegacyCleanupInventory,
    | 'homeShadow'
    | 'mediaShadow'
    | 'memories'
    | 'plans'
    | 'publicPublishedMemories'
    | 'publicPublishedPlans'
    | 'routeIdentities'
    | 'timelineShadow'
  >
  legacyColumnsPresent: boolean
  legacyTableCount: number
  migrationHistory: readonly { batch: number | null; name: string }[]
}) {
  if (state.legacyTableCount !== 0 || state.legacyColumnsPresent) {
    throw new Error('Legacy cleanup read-back found legacy schema objects')
  }
  if (JSON.stringify(state.inventory) !== JSON.stringify({
    homeShadow: 1,
    mediaShadow: 22,
    memories: 3,
    plans: 2,
    publicPublishedMemories: 3,
    publicPublishedPlans: 2,
    routeIdentities: 5,
    timelineShadow: 2,
  })) {
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
