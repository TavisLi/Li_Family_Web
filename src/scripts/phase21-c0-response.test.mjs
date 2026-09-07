import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeC0Response } from './phase21-c0-response.mjs'

test('decodes byte-accurate Unicode JSON', () => {
  const body = JSON.stringify([{ caption: '海南' }])
  assert.deepEqual(decodeC0Response({ rows: [{ body, bytes: Buffer.byteLength(body) }] }), [{ caption: '海南' }])
})
test('oversize envelope blocks even with omitted body', () => {
  assert.throws(() => decodeC0Response({ rows: [{ bytes: 65537, body: null }] }), /server response byte cap/)
})
test('mismatched size and non-array payload block', () => {
  assert.throws(() => decodeC0Response({ rows: [{ bytes: 3, body: '[]' }] }), /byte mismatch/)
  assert.throws(() => decodeC0Response({ rows: [{ bytes: 2, body: '{}' }] }), /response payload/)
})
