import assert from 'node:assert/strict'
import type { PayloadRequest } from 'payload'
import { travelGeoGuard } from './travel-geo'
import { lockTravelGeoWrites } from './travel-geo-lock'

export type Row = Record<string, unknown>
export type Kind = 'plan' | 'memory'
export const record = (value: unknown) => value as Row
const names = { 'zh-TW': '海邊', en: 'Seaside' }
const content = { name: names, latitude: 0, longitude: 0, crs: 'WGS84', provenance: 'Admin supplied', originalCRS: null, approval: null }

function fixture(kind: Kind, status = 'published'): { doc: Row; parent?: Row } {
  const parent = { sourceMetadata: { baseProjection: { contract: 'memory-source-v2', locales: { en: { days: { 'day-01': { geo: structuredClone(content) } }, assets: { keep: 'asset-id' } }, 'zh-TW': { days: { 'day-02': { title: 'Keep' } } } } } }, id: 20, title: { 'zh-TW': '旅行', en: 'Trip' }, _status: status, isPrivate: false, geoAccessRevision: 'parent-epoch' }
  const doc: Row = { id: kind === 'plan' ? 10 : 30, title: { 'zh-TW': '日記', en: 'Journal' }, _status: status,
    sourceMetadata: { sourceFile: 'synthetic.md', baseProjection: { untouched: { geo: structuredClone(content), otherLocale: 'keep' } } }, geoAccessRevision: 'owner-epoch', updatedAt: '2026-01-01T00:00:00.000Z',
    ...(kind === 'plan' ? { isPrivate: false, planningSections: [{ id: 'section-row', anchor: 'section',
      title: { 'zh-TW': '第一節', en: 'First' }, body: { 'zh-TW': '正文', en: 'Body' },
      geoStops: [{ id: 'stop-row', stopKey: 'stop', geo: structuredClone(content) }],
    }] } : { memory: 20, dayKey: 'day-01', moments: [{ id: 'moment-row', momentKey: 'moment',
      title: { 'zh-TW': '故事', en: 'Story' }, geo: structuredClone(content), placements: [{
        id: 'placement-row', placementKey: 'placement', media: 44, caption: { 'zh-TW': '照片', en: 'Photo' },
      }],
    }] }),
  }
  return { doc, parent: kind === 'memory' ? parent : undefined }
}

// Simulate only the locale-hoisted hook boundary and locale-specific write.
// These helpers are not a Payload adapter or real DB round-trip proof.
export function hoist(value: unknown, locale = 'zh-TW'): unknown {
  if (Array.isArray(value)) return value.map(item => hoist(item, locale))
  if (!value || typeof value !== 'object') return value
  const row = record(value)
  if (Object.hasOwn(row, 'zh-TW') && Object.hasOwn(row, 'en')) return row[locale]
  return Object.fromEntries(Object.entries(row).map(([key, item]) => [key, key === 'sourceMetadata' ? item : hoist(item, locale)]))
}
function localizedWrite(value: unknown, full: unknown, locale = 'zh-TW'): unknown {
  if (full && typeof full === 'object' && !Array.isArray(full) && Object.hasOwn(full, 'zh-TW') && Object.hasOwn(full, 'en')) {
    return { ...record(full), [locale]: value }
  }
  if (Array.isArray(value)) return value.map(item => localizedWrite(item,
    Array.isArray(full) ? full.find(before => record(before).id === record(item).id) : undefined, locale))
  if (!value || typeof value !== 'object') return value
  const before = full && typeof full === 'object' ? record(full) : {}
  return Object.fromEntries(Object.entries(record(value)).map(([key, item]) => [key, key === 'sourceMetadata' ? item : localizedWrite(item, before[key], locale)]))
}

export function syntheticStore(kind: Kind, status = 'published', legacyEpoch = false) {
  let state = fixture(kind, status)
  if (legacyEpoch) {
    delete state.doc.geoAccessRevision
    if (state.parent) delete state.parent.geoAccessRevision
  }
  let staged: typeof state | undefined
  let writes = 0
  let commits = 0
  let rollbacks = 0
  let breakReadBack = false
  let breakBaseReadBack = false
  let wroteBase = false
  const updateOptions: Row[] = []
  const operations: string[] = []
  const sessions: Record<string, { db: { execute: (statement: unknown) => Promise<{ rows: { locked: boolean; isolation: string }[] }> } }> = {}
  const req: PayloadRequest = {
    user: { id: 1, role: 'admin' }, locale: 'zh-TW', context: {},
    payload: {
      db: {
        sessions,
        beginTransaction: async () => {
          operations.push('begin')
          staged = structuredClone(state)
          sessions.tx = { db: { execute: async () => { operations.push('lock'); return { rows: [{ locked: true, isolation: 'read committed' }] } } } }
          return 'tx'
        },
        commitTransaction: async () => {
          assert.ok(staged)
          state = staged
          staged = undefined
          delete sessions.tx
          commits++
          operations.push('commit')
        },
        rollbackTransaction: async () => {
          staged = undefined
          delete sessions.tx
          rollbacks++
          operations.push('rollback')
        },
      },
      findByID: async (args: Row) => {
        assert.equal(args.locale, 'all')
        assert.equal(args.fallbackLocale, false)
        assert.equal(args.overrideAccess, false)
        operations.push('read')
        if (breakReadBack && writes || breakBaseReadBack && wroteBase) throw new Error('synthetic read-back failure')
        const current = staged ?? state
        return structuredClone(args.collection === 'travel-memories' ? current.parent : current.doc)
      },
      update: async (args: Row) => {
        assert.ok(staged)
        assert.equal(args.overrideAccess, false)
        if (args.locale !== undefined) {
          assert.ok(args.locale === 'zh-TW' || args.locale === 'en')
          assert.equal(args.fallbackLocale, false)
        }
        assert.equal(args.req, req)
        await lockTravelGeoWrites({ args: { req }, operation: 'update' } as never)
        updateOptions.push(args)
        const parentWrite = args.collection === 'travel-memories'
        const before = parentWrite ? staged.parent : staged.doc
        assert.ok(before)
        const locale = typeof args.locale === 'string' ? args.locale : 'zh-TW'
        const guarded = await travelGeoGuard(parentWrite ? 'parent' : kind)({
          data: args.data, originalDoc: hoist(before, locale), req,
        } as never)
        const after = { ...before, ...record(localizedWrite(guarded, before, locale)), updatedAt: `write-${++writes}` }
        if (parentWrite) staged.parent = after
        else staged.doc = after
        wroteBase ||= Boolean(record(args.data).sourceMetadata)
        operations.push(record(args.data).sourceMetadata ? 'write:base' : 'write:content')
        return structuredClone(after)
      },
    },
  } as never
  return {
    req, operations, updateOptions,
    get state() { return state },
    get writes() { return writes },
    get commits() { return commits },
    get rollbacks() { return rollbacks },
    failReadBack() { breakReadBack = true },
    failBaseReadBack() { breakBaseReadBack = true },
  }
}
