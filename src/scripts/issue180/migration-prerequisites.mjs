import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const sha = text => createHash('sha256').update(text).digest('hex')
// Static inventory only: never creates a database or asserts source fidelity.
export function inspectMigrationBaseline(schema, migration) {
  const up = migration.split('export async function down')[0]
  const baselineTables = new Map([...schema.matchAll(/CREATE TABLE public\.("?[A-Za-z_][A-Za-z_0-9]*"?)\s*\(([\s\S]*?)\n\);/g)].map(m => [m[1].replaceAll('"',''), m[2]]))
  const created = [...up.matchAll(/CREATE TABLE "([^"]+)"\s*\(/g)].map(m => m[1])
  const added = [...up.matchAll(/ALTER TABLE "([^"]+)" ADD COLUMN "([^"]+)"/g)].map(m => ({ table: m[1], column: m[2] }))
  const parents = [...up.matchAll(/REFERENCES "public"\."([^"]+)"\("([^"]+)"\)/g)].map(m => ({ table: m[1], column: m[2] }))
  const missingTables = [...new Set([...added.map(x => x.table), ...parents.map(x => x.table)].filter(x => !created.includes(x) && !baselineTables.has(x)))].sort()
  const collisions = added.filter(x => baselineTables.has(x.table) && new RegExp(`^\\s*"?${x.column}"?\\s`, 'm').test(baselineTables.get(x.table)))
  const existingNewTables = created.filter(x => baselineTables.has(x))
  const missingParentColumns = parents.filter(x => !created.includes(x.table) && baselineTables.has(x.table) && !new RegExp(`^\\s*"?${x.column}"?\\s`, 'm').test(baselineTables.get(x.table)))
  return { status: missingTables.length || collisions.length || existingNewTables.length || missingParentColumns.length ? 'BLOCK' : 'STATIC_NAMES_MATCH_ONLY',
    created, added, parents, missingTables, collisions, existingNewTables, missingParentColumns,
    baselineSha256: sha(schema), migrationSha256: sha(migration),
    unknown: ['migration execution/state','constraint and type equivalence','roles/RLS/grants parity','source platform fidelity','actual database behavior'] }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [schema,migration] = await Promise.all([readFile('scripts/rehearsal/baselines/issue158-v12/schema.sql','utf8'),readFile('src/migrations/20261031_052622_issue180_optional_geo.ts','utf8')])
  const result=inspectMigrationBaseline(schema,migration);console.log(JSON.stringify(result,null,2));if(result.status==='BLOCK')process.exitCode=2
}
