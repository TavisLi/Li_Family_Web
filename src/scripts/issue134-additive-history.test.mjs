import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { captureIssue134AdditiveVersionState, assertIssue134AdditiveHistoryPreserved } from './issue134-additive-history.mjs'
const sha = (s) => createHash('sha256').update(s).digest('hex')
const root = '_travel_memory_days_v'
const child = '_travel_memory_days_v_version_moments'
function fixture({ corrupt = false, error = false } = {}) {
  const tables = { [root]: Array.from({ length: 40 }, (_, i) => ({ id: i + 1, parent_id: 25,
    latest: i === 39, body: '正文😀\\"'.repeat(i === 0 ? 20000 : 1000) })),
    [child]: [{ id: 101, _parent_id: 1, body: '子內容'.repeat(40000) }] }
  const seen = []
  const client = { async query({ text, values }) {
    if (error) throw new Error('synthetic SQL failure')
    const table = /FROM public\.(\w+)/.exec(text)[1]
    let rows = tables[table] ?? []
    if (text.includes('SELECT id, latest')) {
      rows = rows.filter((r) => r.parent_id === values[0]).map(({ id, latest }) => ({ id, latest })).slice(values[2], values[2] + values[1])
    } else {
      assert.match(text, /string_agg/)
      assert(values[0].length <= 40, 'only version root IDs may be sent')
      const roots = values[0]
      const moments = tables[child].filter(r => roots.includes(r._parent_id)).map(r => r.id)
      const placements = (tables[child + '_placements'] ?? []).filter(r => moments.includes(r._parent_id)).map(r => r.id)
      const parents = table === root ? roots : table === root + '_locales' || table === child ? roots :
        table.endsWith('placements_locales') ? placements : moments
      rows = rows.filter(r => parents.includes(table === root ? r.id : r._parent_id))
      const digests = rows.map(r => { const content = { ...r }; if (table === root) delete content.latest
        return { id: r.id, sha256: sha(JSON.stringify(content)) } })
      rows = [{ rows: rows.length, sha256: corrupt ? 'invalid' : sha(JSON.stringify(digests)) }]
    }
    const bytes = Buffer.byteLength(JSON.stringify({ rows }))
    seen.push({ table, bytes, rows: rows.length })
    assert(bytes <= 65536, 'TRANSACTION_RESPONSE_BYTE_CAP')
    assert(rows.length <= 20)
    return { rows }
  } }
  return { client, tables, seen }
}
test('large batches and single oversized history rows stay bounded; all contents remain covered', async () => {
  const f = fixture()
  const before = await captureIssue134AdditiveVersionState(f.client, [25])
  assert.equal(before.tables[root].rows, 40)
  assert.equal(before.tables[child].rows, 1)
  assert.equal(before.counters.queries, 9)
  assert.equal(before.counters.rows, 46)
  f.tables[root][39].latest = false
  f.tables[root].push({ id: 41, parent_id: 25, latest: true, body: 'new' })
  const after = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
  assert.equal(assertIssue134AdditiveHistoryPreserved(before, after, 1).status, 'PASS')
  f.tables[child][0].body += 'changed'
  const changed = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
  assert.throws(() => assertIssue134AdditiveHistoryPreserved(before, changed, 1), /descendants changed/)
  assert(Math.max(...f.seen.map((q) => q.bytes)) < 4096)
})
test('malformed digest fails closed', async () => {
  await assert.rejects(captureIssue134AdditiveVersionState(fixture({ corrupt: true }).client, [25]), /digest/)
})
test('Current-before and applied-after require exactly two new roots and retain every old digest', async () => {
  const f = fixture(), before = await captureIssue134AdditiveVersionState(f.client, [25])
  f.tables[root][39].latest = false
  f.tables[root].push({ id: 41, parent_id: 25, latest: false, body: 'Current-before' },
    { id: 42, parent_id: 25, latest: true, body: 'applied-after' })
  const after = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
  assert.equal(assertIssue134AdditiveHistoryPreserved(before, after, 2, 2).appendedVersionRoots, 2)
  assert.throws(() => assertIssue134AdditiveHistoryPreserved(before, after, 1, 2), /count differs from plan/)
  f.tables[root][40].latest = true; f.tables[root][41].latest = false
  const wrongLatest = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
  assert.throws(() => assertIssue134AdditiveHistoryPreserved(before, wrongLatest, 2, 2), /latest version/)
  f.tables[child][0].body += 'corrupt'
  const corrupt = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
  assert.throws(() => assertIssue134AdditiveHistoryPreserved(before, corrupt, 2, 2), /descendants changed/)
})
test('query error propagates without retry', async () => {
  await assert.rejects(captureIssue134AdditiveVersionState(fixture({ error: true }).client, [25]), /synthetic SQL failure/)
})
test('root content drift and missing descendant fail integrity checks', async () => {
  for (const change of ['root', 'child']) {
    const f = fixture()
    const before = await captureIssue134AdditiveVersionState(f.client, [25])
    if (change === 'root') f.tables[root][0].body += 'changed'
    else f.tables[child] = []
    const after = await captureIssue134AdditiveVersionState(f.client, [25], { existingRoots: before.rootsByDay })
    assert.notDeepEqual(after.tables, before.tables)
    assert.throws(() => assertIssue134AdditiveHistoryPreserved(before, after, 1), /descendants changed/)
  }
})
test('history traversal keeps finite query budget and empty no-op', async () => {
  const f = fixture()
  await assert.rejects(captureIssue134AdditiveVersionState(f.client, [25], {
    limits: { rowCap: 20, responseByteCap: 65536, queryBudget: 1, roundTripBudget: 1 },
  }), /query budget/)
  const empty = fixture()
  assert.deepEqual((await captureIssue134AdditiveVersionState(empty.client, [])).tables, {})
  assert.equal(empty.seen.length, 0)
})

test('an excessive retained root set stops before sending a large parameter array', async () => {
  const f = fixture()
  await assert.rejects(captureIssue134AdditiveVersionState(f.client, [25], {
    existingRoots: { 25: Array.from({ length: 25001 }, (_, i) => ({ id: i + 1, latest: i === 25000 })) },
  }), /history source row cap/)
  assert.equal(f.seen.length, 0)
})
