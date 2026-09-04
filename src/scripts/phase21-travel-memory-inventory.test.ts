import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('./phase21-travel-memory-inventory.ts', import.meta.url), 'utf8')
const query = source.match(/export const phase21InventorySql = `([\s\S]*?)`/)?.[1]
const planQuery = source.match(/export const phase21PlanInventorySql = `([\s\S]*?)`/)?.[1]

assert.ok(query, 'inventory query must remain inspectable')
assert.ok(planQuery, 'plan inventory query must remain inspectable')
for (const readOnlyQuery of [query, planQuery]) {
  assert.match(readOnlyQuery, /^\s*select\b/i)
  assert.doesNotMatch(readOnlyQuery, /\b(insert|update|delete|alter|drop|truncate|create|grant|revoke|lock)\b/i)
}
assert.match(source, /PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'/)
assert.match(source, /201307-hainan/)
assert.match(source, /202308-east-australia/)
assert.match(source, /202602-thailand-phuket/)
assert.match(source, /202702-thailand-phuket/)

console.log('Phase 21 read-only inventory package test passed')
