import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { deleteFixtureMediaSql, privatePhotoCleanupWriter } from './private-photo-cleanup-writer.mjs'

test('uses one conditional Media delete and does not repeat an uncertain object delete', async () => {
  const calls = []
  const client = { query: async (sql, args) => { calls.push([sql, args]); return { rowCount: 1, rows: [{ id: 7 }] } } }
  const storage = { config: { maxAttempts: async () => 1 }, send: async command => {
    assert(command instanceof DeleteObjectCommand); throw new Error('unknown')
  } }
  const writer = await privatePhotoCleanupWriter({ client, storage, bucket: 'private', mediaId: 7, familyAssetKey: 'a'.repeat(64), guard() {} })
  await assert.rejects(writer.deleteMedia(8, 'a'.repeat(64)), /outside fixture/)
  await assert.rejects(writer.deleteObject('private', 'fixture'), /outside fixture/)
  assert.equal(await writer.deleteMedia(7, 'a'.repeat(64)), 1)
  assert.deepEqual(calls, [[deleteFixtureMediaSql, [7, 'a'.repeat(64)]]])
  await assert.rejects(writer.deleteMedia(7, 'a'.repeat(64)), /already attempted/)
  const key = `family-media/${'a'.repeat(64)}/original.jpeg`
  await assert.rejects(writer.deleteObject('private', key), /unknown/)
  await assert.rejects(writer.deleteObject('private', key), /already attempted/)
})

test('rejects retrying storage and mismatched delete results', async () => {
  await assert.rejects(privatePhotoCleanupWriter({ storage: { config: { maxAttempts: async () => 2 } }, mediaId: 7, familyAssetKey: 'a'.repeat(64) }), /must not retry/)
  const storage = { config: { maxAttempts: async () => 1 } }
  const client = { query: async () => ({ rowCount: 1, rows: [{ id: 8 }] }) }
  const writer = await privatePhotoCleanupWriter({ client, storage, bucket: 'private', mediaId: 7, familyAssetKey: 'a'.repeat(64), guard() {} })
  await assert.rejects(writer.deleteMedia(7, 'a'.repeat(64)), /ID mismatch/)
})
