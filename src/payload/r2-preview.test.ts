import assert from 'node:assert/strict'
import test from 'node:test'
import type { Field, FieldHook, PayloadRequest } from 'payload'

// Config construction only: no Payload init, database, dotenv, or storage client calls.
for (const name of [
  'DATABASE_URI', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME', 'PAYLOAD_CLOUD',
]) delete process.env[name]
process.env.PAYLOAD_SECRET = 'synthetic-config-test-only'
process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'
const mode = process.env.PHASE21_R2_TEST_MODE ?? 'public-read-only'
assert.ok(['public-read-only', 'storage-enabled', 'no-public-url'].includes(mode))
if (mode === 'no-public-url') delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL
else process.env.NEXT_PUBLIC_R2_PUBLIC_URL = 'https://media.example.invalid'
if (mode === 'storage-enabled') {
  process.env.R2_ACCOUNT_ID = 'synthetic'
  process.env.R2_ACCESS_KEY_ID = 'synthetic'
  process.env.R2_SECRET_ACCESS_KEY = 'synthetic'
  process.env.R2_BUCKET_NAME = 'synthetic'
}

const config = await (await import('./payload.config')).default
const media = config.collections.find((collection) => collection.slug === 'media')!
const req = { payload: { config } } as PayloadRequest

function named(fields: Field[], name: string): Field {
  const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)
  assert.ok(field, `missing ${name}`)
  return field
}

async function readURL(field: Field, doc: Record<string, unknown>, value: unknown) {
  if ('hooks' in field) {
    for (const hook of field.hooks?.afterRead ?? []) {
      value = await hook({
        data: doc, originalDoc: doc, siblingData: doc, value, req, collection: media,
      } as Parameters<FieldHook>[0])
    }
  }
  return value
}

async function readMedia(doc: Record<string, unknown>) {
  let result: Record<string, unknown> = {
    ...structuredClone(doc), url: await readURL(named(media.fields, 'url'), doc, doc.url),
  }
  if (doc.sizes && typeof doc.sizes === 'object') {
    const sizesField = named(media.fields, 'sizes')
    assert.ok('fields' in sizesField)
    const sizes = structuredClone(doc.sizes) as Record<string, Record<string, unknown>>
    for (const [name, size] of Object.entries(sizes)) {
      const sizeField = named(sizesField.fields, name)
      assert.ok('fields' in sizeField)
      size.url = await readURL(named(sizeField.fields, 'url'), doc, size.url)
    }
    result = { ...result, sizes }
  }
  for (const hook of media.hooks.afterRead ?? []) {
    result = await hook({
      doc: result, req, collection: media, context: {}, findMany: false,
    }) ?? result
  }
  return result
}

test(`${mode}: original URL uses public R2 only when configured`, async () => {
  const doc = { id: 1, filename: 'family.jpeg', url: '/api/media/file/family.jpeg' }
  const result = await readMedia(doc)
  assert.equal(result.url, mode === 'no-public-url'
    ? '/api/media/file/family.jpeg' : 'https://media.example.invalid/family.jpeg')
  assert.equal(doc.url, '/api/media/file/family.jpeg')
})

test(`${mode}: all configured image sizes retain filenames and metadata`, async () => {
  const doc = {
    id: 1, filename: 'family.jpeg', url: '/api/media/file/family.jpeg',
    sizes: Object.fromEntries(['thumbnail', 'medium', 'large'].map((name) => [name, {
      filename: `family-${name}.jpeg`, url: `/api/media/file/family-${name}.jpeg`,
      width: 400, height: 300, filesize: 100,
    }])),
    relatedTravelRecord: { relationTo: 'travel-memories', value: 3 },
    altText: 'Synthetic photo', updatedAt: '2026-01-01T00:00:00.000Z',
  }
  const before = structuredClone(doc)
  const result = await readMedia(doc)
  const sizes = result.sizes as typeof doc.sizes
  for (const name of ['thumbnail', 'medium', 'large']) {
    assert.deepEqual(sizes[name], { ...doc.sizes[name], url: mode === 'no-public-url'
      ? `/api/media/file/family-${name}.jpeg`
      : `https://media.example.invalid/family-${name}.jpeg` })
  }
  if (mode === 'public-read-only') assert.equal(result.thumbnailURL, sizes.thumbnail.url)
  assert.deepEqual(result.relatedTravelRecord, doc.relatedTravelRecord)
  assert.equal(result.updatedAt, doc.updatedAt)
  assert.equal(result.altText, doc.altText)
  assert.deepEqual(doc, before)
})

test(`${mode}: missing image sizes and YouTube-only media are not invented`, async () => {
  const doc = { id: 2, type: 'video', youtubeUrl: 'https://youtu.be/abcdefghijk' }
  const result = await readMedia(doc)
  assert.equal(result.url, null)
  assert.equal(result.sizes, undefined)
  assert.equal(result.youtubeUrl, doc.youtubeUrl)
  const photo = await readMedia({ id: 3, filename: 'original only.jpeg' })
  assert.equal(photo.sizes, undefined)
  assert.equal(photo.url, mode === 'no-public-url'
    ? '/api/media/file/original%20only.jpeg'
    : 'https://media.example.invalid/original%20only.jpeg')
})

test(`${mode}: access controls and configured upload fields remain unchanged`, async () => {
  const { Media } = await import('./collections/Media')
  for (const operation of ['read', 'create', 'update', 'delete'] as const) {
    assert.equal(media.access[operation], Media.access?.[operation])
  }
  // The configured adapter uses no per-record prefix; do not silently omit a future prefix field.
  assert.equal(media.fields.some((field) => 'name' in field && field.name === 'prefix'), false)
  assert.equal(typeof media.upload === 'object' && media.upload.disableLocalStorage === true,
    mode === 'storage-enabled')
})
