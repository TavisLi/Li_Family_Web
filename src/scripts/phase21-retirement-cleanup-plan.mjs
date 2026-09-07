import assert from 'node:assert/strict'
import { retirementDeletes, retirementTables } from './phase21-retirement-scope.mjs'

export function buildRetirementCleanupPlan({ backupSha256, relations }) {
  assert(/^[a-f0-9]{64}$/.test(backupSha256), 'Invalid backup checksum')
  const relationDeletes = retirementDeletes(relations)
  return Object.freeze({
    backupSha256,
    relationDeletes,
    // The generated Drizzle candidate used CASCADE. The reviewed destructive
    // contract intentionally changes each statement to RESTRICT and fixes the
    // dependency-safe order, so unexpected consumers hard-fail the transaction.
    drops: retirementTables.map(table => `DROP TABLE public."${table}" RESTRICT`),
    invariant: Object.freeze({ tables: [...retirementTables], relationDeleteCount: relationDeletes.length }),
  })
}
