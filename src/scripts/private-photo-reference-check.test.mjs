import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { assertFixtureReferences } from './private-photo-reference-check.mjs'

const sql = await readFile('src/scripts/private-photo-media-reference-counts.sql', 'utf8')
const expectedReferences = [...sql.matchAll(/SELECT '([^']+)'::text AS reference/g)].map(([, name]) => name)
const input = () => ({ expectedReferences, locale: 'zh-TW', altText: 'synthetic',
  rows: expectedReferences.map(reference => ({ reference, row_count: reference === 'media_locales._parent_id' ? '1' : '0' })),
  locales: [{ _locale: 'zh-TW', alt_text: 'synthetic' }] })

test('accepts only the expected synthetic locale with no other references', () => {
  assertFixtureReferences(input())
  const linked = input()
  linked.rows.find(row => row.reference === 'users.avatar_id').row_count = '1'
  assert.throws(() => assertFixtureReferences(linked), /fixture is referenced/)
  const missing = input()
  missing.rows.pop()
  assert.throws(() => assertFixtureReferences(missing), /incomplete/)
  const altered = input()
  altered.locales[0].alt_text = 'other'
  assert.throws(() => assertFixtureReferences(altered), /alt text drift/)
})
