import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

export const issue181CatalogKind = 'issue181-production-catalog-v1'
export const issue181CatalogEffect = 'issue181-production-catalog-select-only'
export const issue181CatalogScope = 'Issue 181 migration ledger, public catalog schema, and new-object role/RLS/grant metadata only'
export const issue181CatalogLimits = Object.freeze({ queryBudget: 7, rowCap: 256, responseByteCap: 131072,
  totalRows: 256, totalBytes: 131072, roundTripBudget: 7, deadlineMs: 30000,
  statementTimeoutMs: 15000, lockTimeoutMs: 2000 })
export const issue181CatalogQuerySha256 = '7f12c351f0970f023744a1646f1fbf3c12ee207e98a9ec14a8c04abddb421a5d'

export function assertIssue181CatalogPlan(manifest, plan, schema) {
  assert.equal(manifest.environment, 'production')
  assert.equal(manifest.approval.action, 'production-read')
  assert.equal(manifest.target, 'iujasyrvypdcmkmorcud/postgres/public')
  assert.deepEqual(manifest.scope.expectedEffects, [issue181CatalogEffect])
  assert.deepEqual(manifest.scope.include, [issue181CatalogScope,
    'agent memory-only DATABASE_URI from the designated repository .env'])
  assert.deepEqual(plan.limits, issue181CatalogLimits)
  assert.equal(plan.kind, issue181CatalogKind)
  assert.equal(createHash('sha256').update(JSON.stringify(plan.queries)).digest('hex'), issue181CatalogQuerySha256,
    'BLOCK: Issue 181 SQL allowlist changed')
  assert.equal(schema.migrationPath, 'src/migrations/20261031_052622_issue180_optional_geo.ts')
  assert.equal(schema.migrationSha256, '252ceab99cedd36c1c2cd91acb839182df4687918dda17963c3ce03510fec966')
  assert.equal(schema.main, '8eaa11653c3666b370ea9d2c5588b54f64ae838d')
  assert(manifest.scope.exclude.includes('all writes, migration, rollback, deployment, and cleanup SQL'))
  assert(manifest.scope.stopConditions.includes('drift, warning, cap, timeout, read-back failure, or UNKNOWN; no retry or fallback'))
  return { queryCount: 7, rowCap: 256, byteCap: 131072, scope: issue181CatalogScope }
}

export const issue181SqlArtifactPath = 'docs/phase-artifacts/issue-181/catalog-select-sql.json'
export const issue181SqlArtifactSha256 = '27fe60e321b7bd041dcb88d5ad031861fd5f118749686f304d210f1e2b76eaa2'

export function readApprovedIssue181Queries(manifest, artifactBytes) {
  assert(Buffer.isBuffer(artifactBytes) && artifactBytes.length > 0, 'BLOCK: SQL artifact bytes missing')
  assert.equal(manifest.artifacts.sql.length, 1, 'BLOCK: one SQL artifact required')
  assert.deepEqual(manifest.artifacts.sql[0], { path: issue181SqlArtifactPath, sha256: issue181SqlArtifactSha256 },
    'BLOCK: SQL artifact binding changed')
  assert.equal(createHash('sha256').update(artifactBytes).digest('hex'), issue181SqlArtifactSha256,
    'BLOCK: SQL artifact bytes changed')
  const queries = JSON.parse(artifactBytes.toString('utf8'))
  assert(Array.isArray(queries) && queries.length === 7, 'BLOCK: seven SQL queries required')
  assert.equal(createHash('sha256').update(JSON.stringify(queries)).digest('hex'), issue181CatalogQuerySha256,
    'BLOCK: Issue 181 SQL allowlist changed')
  return queries
}

export async function readIssue181Catalog({ query, guard }, manifest, artifactBytes) {
  const queries = readApprovedIssue181Queries(manifest, artifactBytes)
  const results = []
  let totalRows = 0
  for (const item of queries) {
    guard()
    const result = await query(item.sql)
    assert(Array.isArray(result.rows) && result.rows.length <= issue181CatalogLimits.rowCap, 'BLOCK: catalog row cap')
    totalRows += result.rows.length
    assert(totalRows <= issue181CatalogLimits.totalRows, 'BLOCK: catalog total row cap')
    results.push({ id: item.id, rows: result.rows })
    guard()
  }
  assert.equal(results.length, 7)
  return { results, io: { queries: 7, roundTrips: 7 } }
}
