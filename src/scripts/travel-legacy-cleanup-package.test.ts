import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  assertTravelLegacyCleanupPreconditions,
  assertTravelLegacyCleanupReadback,
  assertTravelLegacyCleanupWriteApproval,
  buildTravelLegacyCleanupApprovalToken,
  phase17LegacyCleanupMigration,
  phase17RequiredMigrations,
  phase17RuntimeCommit,
  type TravelLegacyCleanupState,
} from './travel-legacy-cleanup-package'

const state: TravelLegacyCleanupState = {
  backup: {
    reference: 'supabase-backup-20260719T030000Z',
    createdAt: '2026-07-19T03:00:00.000Z',
    verifiedAt: '2026-07-19T03:05:00.000Z',
  },
  databaseFingerprint: 'database:production',
  deployment: {
    commitSha: phase17RuntimeCommit,
    status: 'success',
    verifiedAt: '2026-07-19T03:10:00.000Z',
  },
  implementationFingerprint: 'implementation:reviewed',
  inventory: {
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
  },
  legacyColumnsPresent: true,
  legacyTableCount: 33,
  migrationHistory: [{ batch: -1, name: 'dev' }, ...phase17RequiredMigrations],
}

assert.doesNotThrow(() => assertTravelLegacyCleanupPreconditions(state))
assert.equal(
  buildTravelLegacyCleanupApprovalToken(state),
  buildTravelLegacyCleanupApprovalToken({ ...state, migrationHistory: [...state.migrationHistory].reverse() }),
)

assert.throws(
  () => assertTravelLegacyCleanupPreconditions({ ...state, inventory: { ...state.inventory, mediaShadow: 11 } }),
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

const token = buildTravelLegacyCleanupApprovalToken(state)
assert.doesNotThrow(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: true,
  expectedTarget: state.databaseFingerprint,
  expectedToken: token,
  expectedBackup: state.backup.reference,
  providedTarget: state.databaseFingerprint,
  providedToken: token,
  providedBackup: state.backup.reference,
}))
assert.throws(() => assertTravelLegacyCleanupWriteApproval({
  allowWrite: false,
  expectedTarget: state.databaseFingerprint,
  expectedToken: token,
  expectedBackup: state.backup.reference,
  providedTarget: state.databaseFingerprint,
  providedToken: token,
  providedBackup: state.backup.reference,
}), /allow-write/)

assert.doesNotThrow(() => assertTravelLegacyCleanupReadback({
  inventory: { memories: 3, plans: 2, routeIdentities: 5 },
  legacyColumnsPresent: false,
  legacyTableCount: 0,
  migrationHistory: [...state.migrationHistory, { batch: 8, name: phase17LegacyCleanupMigration }],
}))
assert.throws(() => assertTravelLegacyCleanupReadback({
  inventory: { memories: 3, plans: 2, routeIdentities: 5 },
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
assert.match(migrationSource, /cannot reconstruct deleted travel data/)
assert.match(migrationSource, /select count\(\*\) into shadow_media_refs/)
assert.doesNotMatch(migrationSource, /count\(distinct parent_id\)/)

const migrationIndex = await readFile(new URL('../migrations/index.ts', import.meta.url), 'utf8')
assert.doesNotMatch(
  migrationIndex,
  /20260719_025401/,
  'destructive cleanup must not be reachable through the default Payload migration runner',
)
