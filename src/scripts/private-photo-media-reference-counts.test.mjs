import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('fixture reference query covers every Media foreign key in the reviewed migration snapshot', async () => {
  const schema = JSON.parse(await readFile('src/migrations/20261120_112809_family_media_key.json', 'utf8'))
  const expected = []
  for (const [tableName, table] of Object.entries(schema.tables)) {
    for (const foreignKey of Object.values(table.foreignKeys ?? {})) {
      if (foreignKey.tableTo !== 'media') continue
      assert(tableName.startsWith('public.'))
      assert.equal(foreignKey.columnsFrom.length, 1)
      expected.push(`${tableName.slice(7)}.${foreignKey.columnsFrom[0]}`)
    }
  }
  const sql = await readFile('src/scripts/private-photo-media-reference-counts.sql', 'utf8')
  const actual = [...sql.matchAll(/SELECT '([^']+)'::text AS reference, count\(\*\)::bigint AS row_count FROM public\."([^"]+)" WHERE "([^"]+)" = \$1/g)]
    .map(([, label, table, column]) => { assert.equal(label, `${table}.${column}`); return label })
  assert.equal(expected.length, 25)
  assert.deepEqual(actual.sort(), expected.sort())
})
