import assert from 'node:assert/strict'

const collectionSlug = 'travel-memory-days'

export function issue134AdditiveLocales(config) {
  const configured = config?.localization?.locales
  assert(Array.isArray(configured), 'BLOCK: initialized localization is unavailable')
  const locales = configured.map((locale) => typeof locale === 'string' ? locale : locale?.code)
  assert.deepEqual(locales, ['zh-TW', 'en'], 'BLOCK: initialized localization contract drift')
  return locales
}

export function issue134AdditivePayloadConfig(config) {
  assert(config && Array.isArray(config.collections), 'BLOCK: Payload collections are unavailable')
  const matches = config.collections.filter((collection) => collection?.slug === collectionSlug)
  assert.equal(matches.length, 1, 'BLOCK: one Travel Memory Days collection is required')
  const source = matches[0]
  assert(source.versions?.drafts, 'BLOCK: Day version recording must remain enabled')
  assert.equal(source.versions.maxPerDoc, 30, 'BLOCK: shared Day retention source drift')
  const collections = config.collections.map((collection) => collection === source
    ? { ...collection, versions: { ...collection.versions, maxPerDoc: 0 } }
    : collection)
  // This supervised Local API runner must not spawn the Payload CLI or telemetry.
  return { ...config, collections, typescript: { ...config.typescript, autoGenerate: false }, telemetry: false }
}

export function assertIssue134AdditiveRuntimeRetention(payload) {
  const runtimeCollection = payload?.collections?.[collectionSlug]
  const versions = runtimeCollection?.config?.versions ?? runtimeCollection?.versions
  assert(versions?.drafts, 'BLOCK: initialized Payload runtime disabled Day version recording')
  assert.equal(versions.maxPerDoc, 0, 'BLOCK: initialized Payload runtime did not apply runner-only retention')
  return { collection: collectionSlug, draftsEnabled: true, maxPerDoc: 0,
    sharedConfigUnchanged: true }
}
