import assert from 'node:assert/strict'
import { Transform } from 'node:stream'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { familyPhotoWriterLimits } from './travel-memory-family-photo-writer.mjs'

const errorBodyLimit = 8192

// The caller supplies independently authenticated clients. This wrapper
// meters actual dispatches below the SDK, including response/error bytes.
export async function boundFamilyPhotoR2({ storage, accountId, bucket, objects, phase, guard }) {
  assert(['absence', 'write', 'readback'].includes(phase))
  const write = phase === 'write'
  assert.equal(await storage.config.maxAttempts(), 1)
  const hostname = accountId + '.r2.cloudflarestorage.com'
  const roster = new Map(objects.map(object => [object.key, object]))
  assert.equal(roster.size, objects.length)
  const bytesCap = objects.reduce((total, { bytes }) => total + bytes, 0)
  assert(roster.size > 0 && roster.size <= familyPhotoWriterLimits.keys && bytesCap <= familyPhotoWriterLimits.bytes)
  const seen = new Set()
  const counters = { requests: 0, sentBytes: 0, responseBytes: 0 }
  const handler = storage.config.requestHandler
  const handle = handler.handle.bind(handler)
  let active
  handler.handle = async (request, options) => {
    guard()
    assert(active && !active.dispatched && request.method === (write ? 'PUT' : 'GET') &&
      request.protocol === 'https:' && request.hostname === hostname &&
      (request.port === undefined || request.port === 443) && request.path === '/' + bucket + '/' + active.object.key &&
      Object.keys(request.query ?? {}).every(key => key === 'x-id'), 'BLOCK: R2 dispatch outside scope')
    active.dispatched = true
    counters.requests++
    if (write) {
      assert.equal(request.headers['if-none-match'], '*')
      assert.equal(request.body, active.body)
      counters.sentBytes += request.body.length
      assert(counters.sentBytes <= bytesCap)
    }
    const { response } = await handle(request, options)
    const perResponse = response.statusCode === 200 && phase === 'readback' ? active.object.bytes : errorBodyLimit
    const totalResponseCap = (phase === 'readback' ? bytesCap : 0) + roster.size * errorBodyLimit
    let received = 0
    const incoming = response.body
    if (!incoming || typeof incoming.pipe !== 'function') throw new Error('BLOCK: R2 response stream unavailable')
    const meter = new Transform({
      transform(chunk, _, callback) {
        received += chunk.length
        counters.responseBytes += chunk.length
        if (received > perResponse || counters.responseBytes > totalResponseCap) {
          incoming.destroy()
          callback(new Error('BLOCK: R2 response cap'))
        } else callback(null, chunk)
      },
    })
    incoming.on('error', error => meter.destroy(error))
    meter.once('close', () => incoming.destroy())
    response.body = incoming.pipe(meter)
    return { response }
  }
  return {
    config: storage.config,
    counters: () => ({ ...counters }),
    async send(command, options) {
      guard()
      const input = command.input
      const object = roster.get(input.Key)
      assert(!active && object && !seen.has(input.Key) && input.Bucket === bucket &&
        command instanceof (write ? PutObjectCommand : GetObjectCommand), 'BLOCK: R2 command outside scope or repeated')
      if (write) {
        assert(Buffer.isBuffer(input.Body) && input.Body.length === object.bytes && input.ContentLength === object.bytes &&
          input.ContentType === object.mimeType && input.IfNoneMatch === '*')
      }
      seen.add(input.Key)
      active = { object, body: input.Body, dispatched: false }
      try {
        return await storage.send(command, options)
      } finally {
        active = undefined
      }
    },
  }
}
