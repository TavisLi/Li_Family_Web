import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { assertMediaForeignKeys } from './private-photo-foreign-keys.mjs'

const snapshot = JSON.parse(await readFile('src/migrations/20261120_112809_family_media_key.json', 'utf8'))
const actual = []
for (const [name, table] of Object.entries(snapshot.tables)) {
  for (const fk of Object.values(table.foreignKeys ?? {})) {
    if (fk.tableTo === 'media') actual.push({ source_schema: 'public', source_table: name.slice(7),
      source_columns: fk.columnsFrom, target_columns: fk.columnsTo,
      delete_action: { cascade: 'c', 'set null': 'n' }[fk.onDelete], validated: true })
  }
}

test('rejects missing, added or changed Media foreign keys', () => {
  assertMediaForeignKeys(snapshot, actual)
  assert.throws(() => assertMediaForeignKeys(snapshot, actual.slice(1)), /count drift/)
  assert.throws(() => assertMediaForeignKeys(snapshot, [...actual, actual[0]]), /count drift/)
  const changed = structuredClone(actual)
  changed[0].delete_action = 'c'
  if (actual[0].delete_action === 'c') changed[0].delete_action = 'n'
  assert.throws(() => assertMediaForeignKeys(snapshot, changed), /foreign key drift/)
  const invalid = structuredClone(actual)
  invalid[0].validated = false
  assert.throws(() => assertMediaForeignKeys(snapshot, invalid), /foreign key drift/)
})
