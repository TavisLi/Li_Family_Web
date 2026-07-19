import assert from 'node:assert/strict'

import {
  assertControlledMigrationPreconditions,
  assertControlledMigrationWriteApproval,
  buildControlledMigrationApprovalToken,
  buildControlledMigrationReadbackToken,
  phase17ControlledMigrationNames,
  phase17ExpectedMigrationHistory,
  type ControlledMigrationState,
} from './travel-controlled-migration-package'

const state: ControlledMigrationState = {
  databaseFingerprint: 'db:test',
  implementationFingerprint: 'impl:test',
  inventory: { featuredTravel: 1, legacyProjects: 5, media: 12, timelineEvents: 2 },
  migrationFingerprints: phase17ControlledMigrationNames.map((name) => ({
    name,
    sha256: `hash:${name}`,
  })),
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
}

const token = buildControlledMigrationApprovalToken(state)
assert.match(token, /^phase-17-migrate:[a-f0-9]{16}$/)
assert.doesNotThrow(() => assertControlledMigrationPreconditions(state))
assert.doesNotThrow(() =>
  assertControlledMigrationWriteApproval({
    allowWrite: true,
    expectedTarget: state.databaseFingerprint,
    expectedToken: token,
    providedTarget: state.databaseFingerprint,
    providedToken: token,
  }),
)
assert.throws(
  () =>
    assertControlledMigrationPreconditions({
      ...state,
      migrationHistory: [...state.migrationHistory, { batch: 6, name: 'unexpected' }],
    }),
  /history does not match/,
)
assert.throws(
  () =>
    assertControlledMigrationPreconditions({
      ...state,
      targetObjects: { ...state.targetObjects, travelPlans: true },
    }),
  /target schema objects to be absent/,
)
assert.throws(
  () =>
    assertControlledMigrationPreconditions({
      ...state,
      inventory: { ...state.inventory, media: 11 },
    }),
  /inventory does not match/,
)
assert.throws(
  () =>
    assertControlledMigrationWriteApproval({
      allowWrite: false,
      expectedTarget: state.databaseFingerprint,
      expectedToken: token,
      providedTarget: state.databaseFingerprint,
      providedToken: token,
    }),
  /requires --allow-write/,
)
assert.notEqual(
  token,
  buildControlledMigrationApprovalToken({
    ...state,
    implementationFingerprint: 'impl:changed',
  }),
)
assert.equal(
  token,
  buildControlledMigrationReadbackToken({
    ...state,
    migrationHistory: [
      ...state.migrationHistory,
      ...phase17ControlledMigrationNames.map((name) => ({ batch: 6, name })),
    ],
    targetObjects: {
      homeConfigRelationships: true,
      lockedDocumentMemoryColumn: true,
      lockedDocumentPlanColumn: true,
      mediaMemoryColumn: true,
      mediaPlanColumn: true,
      timelineMemoryColumn: true,
      timelinePlanColumn: true,
      travelMemories: true,
      travelPlans: true,
      travelRouteIdentities: true,
    },
  }),
)

console.log('travel controlled migration package tests passed')
