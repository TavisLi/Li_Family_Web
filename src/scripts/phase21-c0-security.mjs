import { readC0Pages } from './phase21-c0-pages.mjs'
import { boundedC0Sql, decodeC0Response } from './phase21-c0-response.mjs'

export const c0SecurityCategories = Object.freeze([
  'security-table-scope', 'security-rls-disabled', 'security-public-grant',
  'security-role-inventory', 'security-role-missing', 'security-role-privilege',
  'security-response-bound',
  'history-dev-count', 'history-dev-batch', 'history-migration-set',
])

function securityGate(category, condition, message) {
  if (condition) return
  const error = new Error(`BLOCK: ${message}`)
  error.c0Category = category
  throw error
}

export async function readC0Security(query, sql, baseline) {
  securityGate('security-table-scope', baseline.tables.length > 0 && new Set(baseline.tables).size === baseline.tables.length, 'table allowlist')
  let security
  try {
    security = await readC0Pages(async (_slugs, cursor) =>
      decodeC0Response(await query('security', boundedC0Sql(sql.security), [baseline.tables, cursor])))
  } catch (error) {
    if (!c0SecurityCategories.includes(error?.c0Category)) error.c0Category = 'security-response-bound'
    throw error
  }
  securityGate('security-table-scope', JSON.stringify(security.rows.map((r) => r.table_name).sort()) === JSON.stringify([...baseline.tables].sort()), 'missing or unexpected tables')
  securityGate('security-rls-disabled', security.rows.every((r) => r.rls_enabled === true), 'RLS disabled')
  for (const row of security.rows) {
    securityGate('security-public-grant', row.public_table_grant === false && row.public_column_grant === false, 'PUBLIC grant')
    securityGate('security-role-inventory', Array.isArray(row.restricted_role_access), 'role inventory missing')
    securityGate('security-role-inventory', JSON.stringify(row.restricted_role_access.map((r) => r.role).sort()) === JSON.stringify(['anon', 'authenticated']), 'role inventory scope')
    for (const role of row.restricted_role_access) {
      securityGate('security-role-missing', role.exists === true, 'expected role missing')
      securityGate('security-role-privilege', role.table_access === false && role.column_access === false && role.superuser === false && role.bypass_rls === false, 'restricted role privilege')
    }
  }
  const history = await readC0Pages(async (_slugs, cursor) =>
    decodeC0Response(await query('history', boundedC0Sql(sql.history), [cursor])))
  const dev = history.rows.filter((r) => r.name === 'dev')
  securityGate('history-dev-count', dev.length === 1, 'dev history count')
  securityGate('history-dev-batch', dev[0].batch === -1, 'dev history batch')
  const historical = baseline.historicalMigrations ?? []
  const names = [...baseline.migrations, ...historical.map(r => r.name)]
  securityGate('history-migration-set', new Set(names).size === names.length, 'overlapping migration history baseline')
  securityGate('history-migration-set', JSON.stringify(history.rows.filter((r) => r.name !== 'dev').map((r) => r.name).sort()) === JSON.stringify(names.sort()), 'pending or duplicate migration history')
  for (const record of historical) {
    securityGate('history-migration-set', history.rows.find(r => r.name === record.name).batch === record.batch, 'historical migration batch')
  }
  return { security: security.rows, history: history.rows }
}
