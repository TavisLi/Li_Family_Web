import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('./seed.ts', import.meta.url), 'utf8')
const conflictGate = source.indexOf('Travel Memory child sync blocked by reconciliation conflicts')
const firstChildCreate = source.indexOf("payload.create({ collection: 'travel-memory-days'")

assert.ok(conflictGate >= 0, 'travel-memory-days must have an explicit conflict stop gate')
assert.ok(firstChildCreate > conflictGate, 'the conflict stop gate must run before the first child write')

console.log('Phase 21 child seed safety test passed')
