import assert from 'node:assert/strict'

const actions = { cascade: 'c', 'set null': 'n', restrict: 'r', 'no action': 'a', 'set default': 'd' }
const canonical = row => JSON.stringify([row.source_schema, row.source_table, row.source_columns, row.target_columns, row.delete_action, row.validated])

export function assertMediaForeignKeys(snapshot, actual) {
  const expected = []
  for (const [name, table] of Object.entries(snapshot.tables)) {
    for (const fk of Object.values(table.foreignKeys ?? {})) {
      if (fk.tableTo !== 'media') continue
      assert(name.startsWith('public.') && actions[fk.onDelete], 'BLOCK: unsupported snapshot foreign key')
      expected.push({ source_schema: 'public', source_table: name.slice(7),
        source_columns: fk.columnsFrom, target_columns: fk.columnsTo, delete_action: actions[fk.onDelete], validated: true })
    }
  }
  assert.equal(expected.length, 25, 'BLOCK: unexpected snapshot foreign key count')
  assert.equal(actual.length, expected.length, 'BLOCK: Media foreign key count drift')
  assert.deepEqual(actual.map(canonical).sort(), expected.map(canonical).sort(), 'BLOCK: Media foreign key drift')
}
