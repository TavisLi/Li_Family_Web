import test from 'node:test'
import assert from 'node:assert/strict'
import { validateC0Parents } from './phase21-c0-parents.mjs'
import { c0Slugs } from './phase21-c0-pages.mjs'
const fixture = () => c0Slugs.map((slug, i) => ({ slug, memory_id: i + 1,
  latest_version_count: 1, latest_version_status: 'draft', version_count: 19, day_count: 0, published_day_count: 0 }))
test('observes current draft and zero Days without an obsolete fixed baseline', () => {
  const rows = fixture()
  assert.deepEqual(validateC0Parents(rows), rows)
})
test('missing and duplicate identities block', () => {
  assert.throws(() => validateC0Parents(fixture().slice(1)), /parent count/)
  const rows = fixture(); rows[1].slug = rows[0].slug
  assert.throws(() => validateC0Parents(rows), /parent identities/)
})
test('ambiguous latest and impossible counts block', () => {
  const rows = fixture(); rows[0].latest_version_count = 2
  assert.throws(() => validateC0Parents(rows), /latest version ambiguity/)
  rows[0].latest_version_count = 1; rows[0].published_day_count = 1
  assert.throws(() => validateC0Parents(rows), /day count subset/)
})
