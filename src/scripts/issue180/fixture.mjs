// Synthetic identifiers and content only. Fixture specification is not Base adoption.
export const fixture = Object.freeze({
  version: 1,
  locales: ['zh-TW', 'en'],
  trips: [
    { key: 'synthetic-trip-a', section: 'section-a', day: 'day-a', moment: 'moment-a', stop: 'stop-a' },
    { key: 'synthetic-trip-b', section: 'section-b', day: 'day-b', moment: 'moment-b', stop: 'stop-b' },
  ],
  geo: { name: { 'zh-TW': '測試地點', en: 'Synthetic place' }, latitude: 25, longitude: 121,
    crs: 'EPSG:4326', provenance: 'synthetic', originalCRS: null },
  scenarios: ['migration-up', 'empty-down', 'populated-down-refusal', 'plan-seed', 'memory-v1',
    'memory-v2', 'admin', 'same-owner', 'parent-day', 'different-trips', 'autosave',
    'http', 'graphql', 'local-api', 'locales', 'non-target', 'transaction-rollback',
    'independent-restore', 'history', 'cleanup'],
})
