import assert from 'node:assert/strict'

const host = 'https://li-family-web.vercel.app'
const maxResponse = 256 * 1024
const maxRequest = 8192
const maxPhotos = 842

// The existing Payload REST endpoints authenticate each request and apply
// collection access. Only one trusted session per role is accepted.
export async function familyPhotoPayloadClient({ session, role, expectedId, signal, guard, fetcher = fetch }) {
  assert(['admin', 'family'].includes(role))
  assert(Number.isSafeInteger(expectedId) && expectedId > 0)
  assert(typeof session === 'string' && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(session) &&
    session.length <= 4096)
  const counters = { requests: 0, requestBytes: 0, responseBytes: 0 }
  const cap = role === 'admin' ? 2 * maxPhotos + 1 : maxPhotos + 1
  async function json(url, data) {
    guard()
    const body = data === undefined ? undefined : JSON.stringify(data)
    const payloadBytes = body === undefined ? 0 : Buffer.byteLength(body)
    assert(payloadBytes <= maxRequest)
    assert(++counters.requests <= cap)
    counters.requestBytes += payloadBytes
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)])
    const response = await fetcher(host + url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { authorization: 'JWT ' + session, accept: 'application/json', 'content-type': 'application/json' },
      redirect: 'error', signal: requestSignal, body,
    })
    assert(response.body, 'BLOCK: missing Payload response')
    const reader = response.body.getReader()
    const chunks = []
    let received = 0
    try {
      for (;;) {
        guard()
        requestSignal.throwIfAborted()
        const next = await reader.read()
        if (next.done) break
        received += next.value.byteLength
        counters.responseBytes += next.value.byteLength
        assert(received <= maxResponse && counters.responseBytes <= cap * maxResponse, 'BLOCK: Payload response cap')
        chunks.push(next.value)
      }
    } finally {
      await reader.cancel().finally(() => reader.releaseLock())
    }
    assert(response.ok, 'BLOCK: Payload request failed')
    assert.match(response.headers.get('content-type') ?? '', /^application\/json(?:;|$)/i)
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
  const { user } = await json('/api/users/me')
  assert(user?.id === expectedId && user.role === role && user.collection === 'users', 'BLOCK: Payload session identity drift')
  const actor = Object.freeze({ id: user.id, role: user.role, collection: user.collection })
  function requireAccess(options, expectedRole) {
    assert(role === expectedRole && options.overrideAccess === false && options.user === actor &&
      options.collection === 'media' && options.depth === 0, 'BLOCK: Payload access or scope drift')
  }
  return {
    actor,
    counters: () => ({ ...counters }),
    async find(options) {
      requireAccess(options, 'admin')
      const key = options.where?.familyAssetKey?.equals
      assert(typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) && options.limit === 2)
      return json('/api/media?depth=0&limit=2&where%5BfamilyAssetKey%5D%5Bequals%5D=' + key)
    },
    async create(options) {
      requireAccess(options, 'admin')
      assert.equal(options.locale, 'zh-TW')
      const data = options.data
      assert.deepEqual(Object.keys(data).filter(key => key !== 'sourcePath').sort(),
        ['altText', 'familyAssetKey', 'filesize', 'mimeType', 'type'])
      assert(typeof data.familyAssetKey === 'string' && /^[a-f0-9]{64}$/.test(data.familyAssetKey))
      assert(data.type === 'photo' && data.mimeType === 'image/jpeg' && Number.isSafeInteger(data.filesize) && data.filesize > 0)
      const { doc } = await json('/api/media?depth=0&locale=zh-TW', data)
      return doc
    },
    async findByID(options) {
      requireAccess(options, 'family')
      assert(options.locale === 'zh-TW' && options.fallbackLocale === false && Number.isSafeInteger(options.id) && options.id > 0)
      return json('/api/media/' + options.id + '?depth=0&locale=zh-TW&fallback-locale=none')
    },
  }
}
