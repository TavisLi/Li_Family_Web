import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  assertTravelLegacyCleanupPreconditions,
  assertTravelLegacyCleanupReadback,
  assertTravelLegacyCleanupWriteApproval,
  buildTravelLegacyCleanupApprovalToken,
  buildTravelLegacyCleanupRecoveryEnvironment,
  buildTravelLegacyCleanupRecoveryConfirmation,
  phase17LegacyCleanupMigration,
  phase17NoBackupWaiverConfirmation,
  phase17RequiredMigrations,
  type TravelLegacyCleanupState,
} from './travel-legacy-cleanup-package'

const implementationCommitSha = '1234567890abcdef1234567890abcdef12345678'

const state: TravelLegacyCleanupState = {
  backup: {
    reference: 'supabase-backup-20260719T030000Z',
    createdAt: '2026-07-19T03:00:00.000Z',
    verifiedAt: '2026-07-19T03:05:00.000Z',
  },
  databaseFingerprint: 'database:production',
  deployment: {
    commitSha: implementationCommitSha,
    status: 'success',
    verifiedAt: '2026-07-19T03:10:00.000Z',
  },
  implementationCommitSha,
  implementationFingerprint: 'implementation:reviewed',
  inventory: {
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
  },
  legacyColumnsPresent: true,
  legacyTableCount: 33,
  migrationHistory: [...phase17RequiredMigrations],
}

const noBackupState: TravelLegacyCleanupState = {
  ...state,
  backup: { reference: '', createdAt: '', verifiedAt: '' },
  noBackupWaiver: {
    acceptedAt: '2026-07-29T10:31:04.713+08:00',
    confirmation: phase17NoBackupWaiverConfirmation,
  },
}

assert.doesNotThrow(() => assertTravelLegacyCleanupPreconditions(state))
assert.doesNotThrow(() => assertTravelLegacyCleanupPreconditions(noBackupState))
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({
    ...state,
    noBackupWaiver: noBackupState.noBackupWaiver,
  }),
  /either a verified backup or an explicit no-backup waiver/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({
    ...noBackupState,
    noBackupWaiver: {
      ...noBackupState.noBackupWaiver!,
      acceptedAt: 'not-a-timestamp',
    },
  }),
  /no-backup waiver/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({
    ...noBackupState,
    noBackupWaiver: {
      ...noBackupState.noBackupWaiver!,
      acceptedAt: '2999-01-01T00:00:00.000Z',
    },
  }),
  /no-backup waiver/,
)
assert.equal(
  buildTravelLegacyCleanupApprovalToken(state),
  buildTravelLegacyCleanupApprovalToken({ ...state, migrationHistory: [...state.migrationHistory].reverse() }),
)

assert.throws(
  () => assertTravelLegacyCleanupPreconditions({ ...state, inventory: { ...state.inventory, mediaShadow: 21 } }),
  /inventory/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({ ...state, backup: { ...state.backup, verifiedAt: '' } }),
  /backup/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({ ...state, deployment: { ...state.deployment, status: 'pending' } }),
  /deployment/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({ ...state, implementationCommitSha: 'abcdef1234567890abcdef1234567890abcdef12' }),
  /deployed commit/,
)
assert.throws(
  () => assertTravelLegacyCleanupPreconditions({
    ...state,
    migrationHistory: state.migrationHistory.filter((record) => record.name !== 'dev'),
  }),
  /requires migration dev/,
)

const token = buildTravelLegacyCleanupApprovalToken(state)
const recoveryConfirmation = buildTravelLegacyCleanupRecoveryConfirmation(state)
assert.doesNotThrow(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: true,
  expectedTarget: state.databaseFingerprint,
  expectedToken: token,
  expectedRecoveryConfirmation: recoveryConfirmation,
  providedTarget: state.databaseFingerprint,
  providedToken: token,
  providedRecoveryConfirmation: recoveryConfirmation,
}))
assert.throws(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: false,
  expectedTarget: state.databaseFingerprint,
  expectedToken: token,
  expectedRecoveryConfirmation: recoveryConfirmation,
  providedTarget: state.databaseFingerprint,
  providedToken: token,
  providedRecoveryConfirmation: recoveryConfirmation,
}), /allow-write/)

const noBackupToken = buildTravelLegacyCleanupApprovalToken(noBackupState)
assert.deepEqual(buildTravelLegacyCleanupRecoveryEnvironment(noBackupState), {
  TRAVEL_CLEANUP_NO_BACKUP_ACCEPTED_AT: noBackupState.noBackupWaiver?.acceptedAt,
  TRAVEL_CLEANUP_NO_BACKUP_WAIVER: phase17NoBackupWaiverConfirmation,
  TRAVEL_CLEANUP_RECOVERY_CONFIRM: phase17NoBackupWaiverConfirmation,
})
assert.doesNotThrow(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: true,
  expectedTarget: noBackupState.databaseFingerprint,
  expectedToken: noBackupToken,
  expectedRecoveryConfirmation: phase17NoBackupWaiverConfirmation,
  providedTarget: noBackupState.databaseFingerprint,
  providedToken: noBackupToken,
  providedRecoveryConfirmation: phase17NoBackupWaiverConfirmation,
}))
assert.throws(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: true,
  expectedTarget: noBackupState.databaseFingerprint,
  expectedToken: noBackupToken,
  expectedRecoveryConfirmation: phase17NoBackupWaiverConfirmation,
  providedTarget: noBackupState.databaseFingerprint,
  providedToken: noBackupToken,
  providedRecoveryConfirmation: 'I_ACCEPT_SOMETHING_ELSE',
}), /recovery confirmation/)

assert.doesNotThrow(() => assertTravelLegacyCleanupReadback({
  inventory: {
    homeShadow: 1,
    mediaShadow: 22,
    memories: 3,
    plans: 2,
    publicPublishedMemories: 3,
    publicPublishedPlans: 2,
    routeIdentities: 5,
    timelineShadow: 2,
  },
  legacyColumnsPresent: false,
  legacyTableCount: 0,
  migrationHistory: [...state.migrationHistory, { batch: 8, name: phase17LegacyCleanupMigration }],
}))
assert.throws(() => assertTravelLegacyCleanupReadback({
  inventory: {
    homeShadow: 1,
    mediaShadow: 22,
    memories: 3,
    plans: 2,
    publicPublishedMemories: 3,
    publicPublishedPlans: 2,
    routeIdentities: 5,
    timelineShadow: 2,
  },
  legacyColumnsPresent: true,
  legacyTableCount: 0,
  migrationHistory: [...state.migrationHistory, { batch: 8, name: phase17LegacyCleanupMigration }],
}), /legacy schema/)

const migrationSource = await readFile(
  new URL('../migrations/20260719_025401.ts', import.meta.url),
  'utf8',
)
assert.ok(
  migrationSource.indexOf('drop constraint') < migrationSource.indexOf('drop table'),
  'external relationships must be removed before legacy tables',
)
assert.doesNotMatch(migrationSource, /drop table[\s\S]*cascade/i)
assert.match(migrationSource, /row\(22, 22, 2, 2, 1, 1\)/)
assert.match(migrationSource, /no-backup waiver has no data recovery path/)
assert.match(migrationSource, /select count\(\*\) into shadow_media_refs/)
assert.doesNotMatch(migrationSource, /count\(distinct parent_id\)/)

const migrationIndex = await readFile(new URL('../migrations/index.ts', import.meta.url), 'utf8')
assert.doesNotMatch(
  migrationIndex,
  /20260719_025401/,
  'destructive cleanup must not be reachable through the default Payload migration runner',
)

const cleanupCliSource = await readFile(
  new URL('./travel-legacy-cleanup-cli.ts', import.meta.url),
  'utf8',
)
for (const variable of [
  'TRAVEL_CLEANUP_DEPLOYMENT_SHA',
  'TRAVEL_CLEANUP_DEPLOYMENT_STATUS',
  'TRAVEL_CLEANUP_DEPLOYMENT_VERIFIED_AT',
  'TRAVEL_CLEANUP_NO_BACKUP_ACCEPTED_AT',
  'TRAVEL_CLEANUP_NO_BACKUP_WAIVER',
  'TRAVEL_CLEANUP_RECOVERY_CONFIRM',
]) {
  assert.match(cleanupCliSource, new RegExp(variable))
}
