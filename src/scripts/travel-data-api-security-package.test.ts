import assert from 'node:assert/strict'

import {
  phase17TravelDataApiProtectedTables,
  phase17TravelDataApiSecurityDownSQL,
  phase17TravelDataApiSecurityUpSQL,
} from '@/migrations/20260717_121714_phase_17_secure_travel_data_api'
import {
  assertTravelDataApiSecurityApply,
  assertTravelDataApiSecurityVerify,
  assertTravelDataApiSecurityWriteApproval,
  buildTravelDataApiSecurityApprovalToken,
  type TravelDataApiSecurityState,
} from './travel-data-api-security-package'

const secureState: TravelDataApiSecurityState = {
  databaseFingerprint: 'db:test',
  implementationFingerprint: 'impl:test',
  migrationPresent: true,
  rolesPresent: { anon: true, authenticated: true },
  tables: phase17TravelDataApiProtectedTables.map((table) => ({
    authenticatedPrivileges: 0,
    exists: true,
    anonPrivileges: 0,
    rlsEnabled: true,
    table,
  })),
}

assert.equal(phase17TravelDataApiProtectedTables.length, 70)
assert.equal(new Set(phase17TravelDataApiProtectedTables).size, 70)
assert.match(phase17TravelDataApiSecurityUpSQL, /ENABLE ROW LEVEL SECURITY/)
assert.match(phase17TravelDataApiSecurityUpSQL, /REVOKE ALL PRIVILEGES/)
assert.match(phase17TravelDataApiSecurityDownSQL, /DISABLE ROW LEVEL SECURITY/)
assert.match(phase17TravelDataApiSecurityDownSQL, /GRANT ALL PRIVILEGES/)
assert.doesNotThrow(() => assertTravelDataApiSecurityVerify(secureState))
assert.doesNotThrow(() => assertTravelDataApiSecurityApply({ ...secureState, migrationPresent: false }))
assert.throws(
  () => assertTravelDataApiSecurityApply(secureState),
  /record already exists/,
)
assert.throws(
  () =>
    assertTravelDataApiSecurityVerify({
      ...secureState,
      tables: secureState.tables.map((table, index) =>
        index === 0 ? { ...table, anonPrivileges: 1 } : table,
      ),
    }),
  /verification failed/,
)

const token = buildTravelDataApiSecurityApprovalToken({ ...secureState, migrationPresent: false })
assert.match(token, /^phase-17-security:[a-f0-9]{16}$/)
assert.doesNotThrow(() =>
  assertTravelDataApiSecurityWriteApproval({
    allowWrite: true,
    expectedTarget: 'db:test',
    expectedToken: token,
    providedTarget: 'db:test',
    providedToken: token,
  }),
)
assert.throws(
  () =>
    assertTravelDataApiSecurityWriteApproval({
      allowWrite: false,
      expectedTarget: 'db:test',
      expectedToken: token,
      providedTarget: 'db:test',
      providedToken: token,
    }),
  /requires --allow-write/,
)

console.log('travel data API security package tests passed')
