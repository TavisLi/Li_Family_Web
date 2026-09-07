import assert from 'node:assert/strict'
import test from 'node:test'
import { readC0MappingSession, readC0ContentSession } from './phase21-c0-session.mjs'
import { c0Slugs } from './phase21-c0-pages.mjs'

const row = { slug: '201307-hainan', legacy_relation_id: 1, legacy_usage_count: 1, candidate_count: 1, published_keyed_candidate_count: 1, destinations: [{ placement_id: 'p1' }] }
function fixture({ drift = false, fail = false, settings = true, rollbackFail = false } = {}) {
  const statements = []
  let reads = 0
  return { statements, async query(sql) {
    statements.push(sql)
    if (sql === 'ROLLBACK' && rollbackFail) throw new Error('cleanup failed')
    if (sql.startsWith('SELECT current_setting')) return { rows: [{ readonly: settings ? 'on' : 'off', timeout: '15s' }] }
    if (sql.startsWith('WITH c0_page')) {
      reads++
      if (fail) throw new Error('read failed')
      const body = JSON.stringify([{ ...row, destinations: [{ placement_id: drift && reads === 2 ? 'p2' : 'p1' }] }])
      return { rows: [{ bytes: Buffer.byteLength(body), body }] }
    }
    return { rows: [] }
  } }
}
const query = 'SELECT 1 AS legacy_relation_id'

test('two independent read-only transactions compare identical mappings', async () => {
  const db = fixture()
  const checkpoints = []
  const result = await readC0MappingSession(db, query, async (event) => checkpoints.push(event))
  assert.deepEqual(result.rows, [row])
  assert.equal(db.statements.filter((s) => s.startsWith('BEGIN')).length, 2)
  assert.equal(db.statements.filter((s) => s === 'ROLLBACK').length, 2)
  assert.equal(checkpoints.at(-1).label, 'mapping-readback')
})
test('first read failure closes transaction without starting after-read', async () => {
  const db = fixture({ fail: true, rollbackFail: true })
  await assert.rejects(readC0MappingSession(db, query, async () => {}), /read failed/)
  assert.equal(db.statements.filter((s) => s.startsWith('BEGIN')).length, 1)
  assert.equal(db.statements.at(-1), 'ROLLBACK')
})
test('incorrect transaction settings prevent data queries', async () => {
  const db = fixture({ settings: false })
  await assert.rejects(readC0MappingSession(db, query, async () => {}), /transaction settings/)
  assert(!db.statements.some((s) => s.startsWith('WITH')))
})
test('between-transaction drift blocks without another attempt', async () => {
  const db = fixture({ drift: true })
  await assert.rejects(readC0MappingSession(db, query, async () => {}), /mapping drift/)
  assert.equal(db.statements.filter((s) => s.startsWith('BEGIN')).length, 2)
})
test('checkpoint failure prevents the associated query', async () => {
  const db = fixture()
  await assert.rejects(readC0MappingSession(db, query, async () => { throw new Error('checkpoint failed') }), /checkpoint failed/)
  assert.deepEqual(db.statements, [])
})
test('rollback failure alone blocks completion', async () => {
  const db = fixture({ rollbackFail: true })
  await assert.rejects(readC0MappingSession(db, query, async () => {}), /cleanup failed/)
  assert.equal(db.statements.filter((s) => s.startsWith('BEGIN')).length, 1)
})

test('post-BEGIN checkpoint failure still closes the open transaction', async () => {
  const db = fixture()
  await assert.rejects(readC0MappingSession(db, query, async (event) => {
    if (event.state === 'PASS') throw new Error('checkpoint unavailable')
  }), /checkpoint unavailable/)
  assert.deepEqual(db.statements, ['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY', 'ROLLBACK'])
})

test('content session detects parent version drift even when itinerary stays empty', async () => {
  let transactions = 0
  const client = { async query(statement) {
    if (statement.startsWith('BEGIN')) transactions++
    if (statement.startsWith('SELECT current_setting')) return { rows: [{ readonly: 'on', timeout: '15s' }] }
    if (!statement.startsWith('WITH')) return { rows: [] }
    const data = statement.includes('parent-fixture') ? c0Slugs.map((slug, i) => ({ slug, memory_id: i + 1,
      latest_version_count: 1, latest_version_id: transactions === 2 ? 20 : 19, version_count: 19,
      day_count: 0, published_day_count: 0, highlight_count: 0, itinerary_count: 0 })) : []
    const body = JSON.stringify(data)
    return { rows: [{ bytes: Buffer.byteLength(body), body }] }
  } }
  const queries = { parents: "SELECT 'parent-fixture'", days: 'SELECT 1', highlights: 'SELECT 1', itinerary: 'SELECT 1' }
  await assert.rejects(readC0ContentSession(client, queries, async () => {}), /mapping drift/)
  assert.equal(transactions, 2)
})
