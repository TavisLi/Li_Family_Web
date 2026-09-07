import assert from 'node:assert/strict'
import test from 'node:test'
import { readC0MappingPages } from './phase21-c0-pages.mjs'

const row = (id, extra = {}) => ({ slug: '201307-hainan', legacy_relation_id: id,
  legacy_usage_count: '1', candidate_count: '1', published_keyed_candidate_count: '1', destinations: [{ placement_id: 'p1' }], ...extra })

test('101-row sentinel is read again on the next page without loss or duplication', async () => {
  const data = Array.from({ length: 205 }, (_, i) => row(i + 1))
  const cursors = []
  const result = await readC0MappingPages(async (slugs, cursor) => {
    assert(!slugs.includes('202702-thailand-phuket'))
    cursors.push(cursor)
    return data.filter((r) => r.legacy_relation_id > cursor).slice(0, 101)
  })
  assert.deepEqual(cursors, [0, 100, 200])
  assert.deepEqual(result.rows, data)
})

test('empty inventory terminates after one query', async () => {
  const result = await readC0MappingPages(async () => [])
  assert.deepEqual(result.rows, [])
  assert.equal(result.pages, 1)
})

test('query failure propagates without retry', async () => {
  let calls = 0
  await assert.rejects(readC0MappingPages(async () => { calls++; throw new Error('timeout') }), /timeout/)
  assert.equal(calls, 1)
})

for (const [name, batch, reason] of [
  ['scope', [row(1, { slug: '202702-thailand-phuket' })], /unexpected Memory/],
  ['duplicate id', [row(1), row(1)], /cursor order/],
  ['row cap', Array.from({ length: 102 }, (_, i) => row(i + 1)), /row cap/],
  ['byte cap', [row(1, { unexpected: 'x'.repeat(65536) })], /byte cap/],
  ['negative count', [row(1, { candidate_count: '-1' })], /invalid count/],
  ['impossible subset', [row(1, { published_keyed_candidate_count: '2' })], /candidate subset/],
  ['destination overflow', [row(1, { destinations: null })], /destination cap/],
  ['incomplete destinations', [row(1, { destinations: [] })], /incomplete destinations/],
]) {
  test(`${name} stops immediately`, async () => {
    let calls = 0
    await assert.rejects(readC0MappingPages(async () => { calls++; return batch }), reason)
    assert.equal(calls, 1)
  })
}

test('unchanging cursor cannot loop', async () => {
  const batch = Array.from({ length: 101 }, (_, i) => row(i + 1))
  let calls = 0
  await assert.rejects(readC0MappingPages(async () => { calls++; return batch }), /cursor order/)
  assert.equal(calls, 2)
})

test('total response budget stops a large inventory', async () => {
  let calls = 0
  await assert.rejects(readC0MappingPages(async (_slugs, cursor) => {
    calls++
    return Array.from({ length: 101 }, (_, i) => row(cursor + i + 1, { padding: 'x'.repeat(300) }))
  }), /total byte cap/)
  assert(calls < 50)
})

test('page budget stops even when individual pages are small', async () => {
  let calls = 0
  await assert.rejects(readC0MappingPages(async (_slugs, cursor) => {
    calls++
    return Array.from({ length: 101 }, (_, i) => row(cursor + i + 1))
  }), /page budget/)
  assert.equal(calls, 50)
})
