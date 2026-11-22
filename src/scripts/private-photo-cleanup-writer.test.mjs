import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { deleteFixtureMediaSql, privatePhotoCleanupWriter } from './private-photo-cleanup-writer.mjs'

test('provider cleanup is blocked before accessing storage or a database client', async () => {
  const options = {
    environment: 'disposable',
    get client() { assert.fail('cleanup accessed the database client') },
    get storage() { assert.fail('cleanup accessed the storage client') },
  }
  await assert.rejects(privatePhotoCleanupWriter(options), /cleanup requires Supervisor integration/)
})

test('the rehearsal uses the checked-in conditional Media delete', async () => {
  const sql = await readFile(new URL('./private-photo-cleanup.sql', import.meta.url), 'utf8')
  assert.equal(deleteFixtureMediaSql, sql.trim())
  assert.match(sql, /WHERE id = \$1 AND family_asset_key = \$2 RETURNING id/)
})
