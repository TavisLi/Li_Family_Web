import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile(
  'src/migrations/20260831_120000_phase_21_travel_memory_contract.ts',
  'utf8',
)

const up = migration.split('export async function down')[0] ?? ''
assert.match(up, /ADD COLUMN "role"/)
assert.match(up, /ADD COLUMN "transport"/)
assert.doesNotMatch(up, /DROP\s+(?:TABLE|COLUMN)/i)
assert.doesNotMatch(up, /CASCADE/i)
assert.doesNotMatch(up, /\b(?:INSERT|UPDATE|DELETE)\b/i)
assert.doesNotMatch(up, /\b(?:users|posts|travel_plans)\b/i)

console.log('phase 21 migration package tests passed')
