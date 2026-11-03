import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../migrations/20261031_052622_issue180_optional_geo.ts', import.meta.url), 'utf8')
const [up, down] = source.split('export async function down')
assert.ok(up && down)
assert.ok(!/\b(?:DROP|TRUNCATE|DELETE|UPDATE)\s+(?:TABLE|COLUMN|FROM|"|public)/i.test(up), 'up must remain additive')
const tables = [...up.matchAll(/CREATE TABLE "([^"]+)"/g)].map(match => match[1]!)
assert.equal(tables.length, 4)
for (const table of tables) {
  assert.ok(up.includes(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`), `${table} must enable RLS`)
  assert.ok(up.includes(`REVOKE ALL PRIVILEGES ON TABLE "${table}" FROM PUBLIC, anon, authenticated`), `${table} must deny Data API roles`)
  assert.ok(down.includes(`EXISTS (SELECT 1 FROM "${table}")`), `${table} must refuse destructive down with rows`)
}
assert.ok(down.includes('IN ACCESS EXCLUSIVE MODE NOWAIT'), 'down must lock out concurrent content writes before checking')
assert.ok(down.indexOf('LOCK TABLE') < down.indexOf('IF EXISTS'))
assert.ok(down.indexOf('RAISE EXCEPTION') < down.indexOf('DROP TABLE'))
const identifiers = [...source.matchAll(/(?:CONSTRAINT|INDEX|TABLE|TYPE) "([^"]+)"/g)].map(match => match[1]!)
assert.ok(identifiers.every(name => Buffer.byteLength(name) <= 63))
console.log('Geo migration static additive/security/empty-only down review PASS; not executed')
