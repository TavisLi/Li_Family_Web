import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
import { withIssue134BoundedInserts } from './issue134-payload-update.mjs'
import { createLocalReq } from 'payload'
import { installIssue134BoundedRelationshipLoader } from './issue134-relationship-loader.mjs'
import { differenceDetails } from './issue134-prior-unknown-admission.mjs'

export function assertIssue134AdditiveResponse(value, label, byteCap = 65536) {
  const bytes = Buffer.byteLength(JSON.stringify(value ?? null))
  assert(bytes <= byteCap, `BLOCK: ${label} Payload response exceeded the byte cap`)
  return bytes
}

export async function readIssue134AdditiveDay(payload, dayId, { locale = 'zh-TW', draft = true, req } = {}) {
  if (!req) {
    req = await createLocalReq({}, payload)
    installIssue134BoundedRelationshipLoader(req)
  }
  const day = await payload.findByID({ collection: 'travel-memory-days', id: dayId, depth: 0,
    locale, fallbackLocale: false, draft, overrideAccess: true, overrideLock: false, req })
  assert.equal(Number(day.id), Number(dayId), 'UNKNOWN: additive Day identity drift')
  assert.equal(Number(typeof day.memory === 'object' ? day.memory.id : day.memory), 2,
    'UNKNOWN: additive Day Memory owner drift')
  assert(['draft', 'published'].includes(day._status), 'UNKNOWN: additive Day publication state is unavailable')
  assertIssue134AdditiveResponse(day, 'additive Day read')
  return day
}

export async function readIssue134AdditiveFreshDays(payload, dayKeys, { req, rowCap = 20, byteCap = 65536 } = {}) {
  assert(Array.isArray(dayKeys) && dayKeys.length > 0 && dayKeys.length <= rowCap &&
    dayKeys.every((key) => /^day-(0[1-9]|[1-9][0-9])$/.test(key)) && new Set(dayKeys).size === dayKeys.length,
  'BLOCK: reviewed Day key set is invalid or exceeds the row cap')
  if (!req) {
    req = await createLocalReq({}, payload)
    installIssue134BoundedRelationshipLoader(req)
  }
  const response = await payload.find({ collection: 'travel-memory-days', where: { and: [
    { memory: { equals: 2 } }, { dayKey: { in: dayKeys } },
  ] }, limit: rowCap, page: 1, depth: 0, locale: 'zh-TW', fallbackLocale: false,
  draft: true, overrideAccess: true, req })
  assertIssue134AdditiveResponse(response, 'fresh Day identity inventory', byteCap)
  assert(Array.isArray(response.docs) && response.docs.length <= rowCap && response.totalDocs === dayKeys.length,
    'UNKNOWN: fresh target Day inventory is incomplete or exceeds the row cap')
  const seen = new Set()
  for (const day of response.docs) {
    const key = String(day.dayKey ?? '')
    assert(day.id !== undefined && day.dayIdentity === `2:${key}` && dayKeys.includes(key) && !seen.has(key) &&
      Number(typeof day.memory === 'object' ? day.memory.id : day.memory) === 2,
    'UNKNOWN: fresh Day stable identity or owner differs')
    seen.add(key)
  }
  assert.equal(seen.size, dayKeys.length, 'UNKNOWN: fresh target Day keys are not unique')
  return response.docs
}

export async function updateIssue134AdditiveDay(payload, write, { req, byteCap = 65536 } = {}) {
  assert(req?.transactionID, 'BLOCK: additive Current snapshot requires the locked Payload transaction')
  // updateByID merges against latest version, even if that published version is
  // older than Current. Anchor Current (all locales) without changing Current or
  // rewriting any historical row. Both snapshots roll back with this transaction.
  const current = await readIssue134AdditiveDay(payload, write.dayId, { locale: 'all', draft: true, req })
  assert.equal(current._status === 'draft', write.draft, 'BLOCK: additive Current publication state drift')
  const now = new Date().toISOString()
  await withIssue134BoundedInserts(payload.db, () => payload.db.createVersion({ collectionSlug: 'travel-memory-days',
    parent: write.dayId, versionData: structuredClone(current), createdAt: now, updatedAt: now,
    autosave: false, returning: false, req }))
  const result = await withIssue134BoundedInserts(payload.db, () => payload.update({ collection: 'travel-memory-days', id: write.dayId,
    data: { moments: write.after }, depth: 0, locale: 'zh-TW', fallbackLocale: false,
    draft: write.draft, overrideAccess: true, overrideLock: false, select: { id: true }, req }))
  assert.equal(Number(result.id), Number(write.dayId), 'UNKNOWN: additive Day update returned another identity')
  return assertIssue134AdditiveResponse(result, 'additive Day update', byteCap)
}

function without(value, keys) {
  const result = { ...value }
  for (const key of keys) delete result[key]
  return result
}

export function assertIssue134AdditivePreservation(before, after) {
  assert.equal(Number(after.id), Number(before.id), 'BLOCK: additive Day ID changed')
  assert.equal(after.dayKey, before.dayKey, 'BLOCK: additive Day key changed')
  assert.equal(after._status, before._status, 'BLOCK: additive Day publication status changed')
  const oldFields = without(before, ['moments', 'updatedAt']), newFields = without(after, ['moments', 'updatedAt'])
  if (!isDeepStrictEqual(oldFields, newFields)) throw Object.assign(
    new Error('BLOCK: additive Day fields changed outside the Moments array'), {
      code: 'ISSUE134_ADDITIVE_PRESERVATION', dayId: Number(before.id),
      safeDetails: differenceDetails(newFields, oldFields, 'day-fields'),
    })

  const beforeMoments = Array.isArray(before.moments) ? before.moments : []
  const afterMoments = Array.isArray(after.moments) ? after.moments : []
  assert(afterMoments.length >= beforeMoments.length, 'BLOCK: additive apply removed a Moment')
  for (let index = 0; index < beforeMoments.length; index += 1) {
    const oldMoment = beforeMoments[index]
    const newMoment = afterMoments[index]
    assert.equal(newMoment?.momentKey, oldMoment.momentKey, 'BLOCK: existing Moment order or key changed')
    assert.equal(newMoment?.id, oldMoment.id, 'BLOCK: existing Moment ID changed')
    assert(isDeepStrictEqual(without(oldMoment, ['placements']), without(newMoment, ['placements'])),
      'BLOCK: existing Moment content or relation changed')
    const oldPlacements = Array.isArray(oldMoment.placements) ? oldMoment.placements : []
    const newPlacements = Array.isArray(newMoment.placements) ? newMoment.placements : []
    assert(newPlacements.length >= oldPlacements.length, 'BLOCK: additive apply removed a placement')
    assert(isDeepStrictEqual(newPlacements.slice(0, oldPlacements.length), oldPlacements),
      'BLOCK: existing placement ID, content, relation, or order changed')
  }
  return { status: 'PASS', existingMoments: beforeMoments.length,
    existingPlacements: beforeMoments.reduce((sum, moment) => sum + (moment.placements?.length ?? 0), 0),
    appendedMoments: afterMoments.length - beforeMoments.length }
}

export function assertIssue134AdditiveLocaleUnchanged(before, after, locale) {
  assert.equal(Number(after.id), Number(before.id), `BLOCK: ${locale} Day ID changed`)
  assert.equal(after.dayKey, before.dayKey, `BLOCK: ${locale} Day key changed`)
  assert.equal(after._status, before._status, `BLOCK: ${locale} publication state changed`)
  assert(isDeepStrictEqual(without(before, ['moments', 'updatedAt']), without(after, ['moments', 'updatedAt'])),
    `BLOCK: ${locale} Day fields changed during zh-TW additive update`)
  assert(isDeepStrictEqual(without(before, ['updatedAt']), without(after, ['updatedAt'])),
    `BLOCK: ${locale} localized content, Moment identity, or relationship changed`)
  return { status: 'PASS', locale, existingMoments: before.moments?.length ?? 0 }
}

// Payload localizes these leaf fields, not the Moments/placements arrays.
export function assertIssue134AdditiveLocalePreserved(before, after, sharedAfter) {
  assertIssue134AdditivePreservation(before, after)
  const localized = ['title', 'body', 'location', 'transport']
  const shared = (day) => (day.moments ?? []).map((moment) => ({
    ...without(moment, [...localized, 'placements']),
    placements: (moment.placements ?? []).map((placement) => without(placement, ['caption'])),
  }))
  assert(isDeepStrictEqual(shared(after), shared(sharedAfter)),
    'BLOCK: translated locale shared structure differs from approved additions')
  const empty = (value) => value === undefined || value === null || value === ''
  for (let i = 0; i < (after.moments ?? []).length; i++) {
    const moment = after.moments[i]
    const old = before.moments?.[i]
    assert(old || localized.every((key) => empty(moment[key])),
      'BLOCK: new Moment contains unapproved translated content')
    for (const placement of (moment.placements ?? []).slice(old?.placements?.length ?? 0)) {
      assert(empty(placement.caption), 'BLOCK: new placement contains unapproved translated caption')
    }
  }
  return { status: 'PASS', existingLocalizedContentPreserved: true, sharedAdditionsVerified: true }
}
