import { createHash } from 'node:crypto'

export type TravelDataApiSecurityTableState = {
  authenticatedPrivileges: number
  exists: boolean
  anonPrivileges: number
  rlsEnabled: boolean
  table: string
}

export type TravelDataApiSecurityState = {
  databaseFingerprint: string
  implementationFingerprint: string
  migrationPresent: boolean
  rolesPresent: { anon: boolean; authenticated: boolean }
  tables: readonly TravelDataApiSecurityTableState[]
}

export function buildTravelDataApiSecurityApprovalToken(state: TravelDataApiSecurityState) {
  return `phase-17-security:${createHash('sha256')
    .update(JSON.stringify(state))
    .digest('hex')
    .slice(0, 16)}`
}

export function assertTravelDataApiSecurityInspect(state: TravelDataApiSecurityState) {
  if (!state.rolesPresent.anon || !state.rolesPresent.authenticated) {
    throw new Error('Security migration requires anon and authenticated database roles')
  }
  const missing = state.tables.filter((table) => !table.exists)
  if (missing.length > 0) {
    throw new Error(`Security migration tables missing: ${missing.map(({ table }) => table).join(', ')}`)
  }
}

export function assertTravelDataApiSecurityApply(state: TravelDataApiSecurityState) {
  assertTravelDataApiSecurityInspect(state)
  if (state.migrationPresent) throw new Error('Security migration record already exists')
}

export function assertTravelDataApiSecurityVerify(state: TravelDataApiSecurityState) {
  assertTravelDataApiSecurityInspect(state)
  if (!state.migrationPresent) throw new Error('Security migration record is missing')
  const insecure = state.tables.filter(
    (table) =>
      !table.rlsEnabled || table.anonPrivileges > 0 || table.authenticatedPrivileges > 0,
  )
  if (insecure.length > 0) {
    throw new Error(`Security verification failed: ${insecure.map(({ table }) => table).join(', ')}`)
  }
}

export function assertTravelDataApiSecurityWriteApproval(input: {
  allowWrite: boolean
  expectedTarget: string
  expectedToken: string
  providedTarget: string | undefined
  providedToken: string | undefined
}) {
  if (!input.allowWrite) throw new Error('Security migration requires --allow-write')
  if (input.providedTarget !== input.expectedTarget) {
    throw new Error('Security migration target confirmation mismatch')
  }
  if (input.providedToken !== input.expectedToken) {
    throw new Error('Security migration approval confirmation mismatch')
  }
}
