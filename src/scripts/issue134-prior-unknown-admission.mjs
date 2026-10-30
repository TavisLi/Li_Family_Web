import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'

const historyTables = ['_travel_memory_days_v', '_travel_memory_days_v_locales',
  '_travel_memory_days_v_version_moments', '_travel_memory_days_v_version_moments_locales',
  '_travel_memory_days_v_version_moments_placements', '_travel_memory_days_v_version_moments_placements_locales']

// A before-image is JSON. Payload leaves own undefined properties for absent
// localized values, which JSON omits. Normalize only that representation change;
// reject other lossy JSON conversions instead of accepting NaN, sparse arrays, etc.
function durableValue(value, depth = 0) {
  assert(depth <= 64, 'UNKNOWN: localized snapshot nesting exceeds the comparison limit')
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  assert(value && typeof value === 'object' &&
    (Array.isArray(value) || [Object.prototype, null].includes(Object.getPrototypeOf(value))) &&
    Object.getOwnPropertySymbols(value).length === 0,
  'UNKNOWN: localized snapshot contains an unsupported JSON value')
  if (Array.isArray(value)) {
    assert(Object.keys(value).length === value.length,
      'UNKNOWN: localized snapshot contains a sparse or extended array')
    return Array.from(value, item => durableValue(item, depth + 1))
  }
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)
    .map(([key, item]) => [key, durableValue(item, depth + 1)]))
}

const safeFields = new Set(['en', 'zh-TW', 'id', 'memory', 'dayIdentity', 'dayKey', 'day', 'date',
  'dateLabel', 'title', 'theme', 'story', 'dailyHeroImage', 'moments', 'meals', 'lodging', 'sourceMetadata',
  'updatedAt', 'createdAt', '_status', 'momentKey', 'time', 'location', 'body', 'transport', 'placements',
  'placementKey', 'type', 'role', 'media', 'caption', 'participants', 'latest', 'rows', 'sha256',
  'representation', 'sourceFile', 'sourceHash', 'parserVersion', 'lastImportedAt', 'baseProjection', ...historyTables])
const safeSegment = (key) => safeFields.has(key) || /^day-\d{2}$/.test(key) ? key
  : `key-sha256:${createHash('sha256').update(key).digest('hex')}`

export function differenceDetails(actual, expected, comparison) {
  const differences = []
  let truncated = false
  const walk = (left, right, path = []) => {
    if (isDeepStrictEqual(left, right)) return
    if (differences.length === 12) { truncated = true; return }
    let kind = 'value'
    if (path.length >= 16) kind = 'subtree'
    else if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length === right.length) {
        for (let i = 0; i < left.length; i++) walk(left[i], right[i], [...path, i])
        return
      }
      kind = 'array-length'
    } else if (left && right && typeof left === 'object' && typeof right === 'object' &&
        !Array.isArray(left) && !Array.isArray(right)) {
      for (const key of [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()) {
        walk(left[key], right[key], [...path, safeSegment(key)])
      }
      return
    } else if (left === undefined || right === undefined) kind = 'missing'
    else if (typeof left !== typeof right || (left === null) !== (right === null)) kind = 'type'
    const locale = comparison === 'localized' && ['en', 'zh-TW'].includes(path[0]) ? path[0] : null
    const dayId = locale ? expected[locale]?.[path[1]]?.[0] : null
    differences.push({ path, kind, dayId: Number.isSafeInteger(dayId) ? dayId : null })
  }
  walk(actual, expected)
  return { comparison, differences, truncated }
}

export function safeIssue134DifferenceDetails(d) {
  if (!d ||
    !['identity', 'localized', 'history-targets', 'history-roots', 'history-tables', 'day-fields'].includes(d.comparison) ||
    typeof d.truncated !== 'boolean' || !Array.isArray(d.differences) || d.differences.length > 12 ||
    !d.differences.every(item => Array.isArray(item.path) && item.path.length <= 16 &&
      item.path.every(segment => Number.isSafeInteger(segment) && segment >= 0 ||
        typeof segment === 'string' && (safeFields.has(segment) || /^day-\d{2}$/.test(segment) ||
          /^key-sha256:[a-f0-9]{64}$/.test(segment))) &&
      ['value', 'subtree', 'array-length', 'missing', 'type'].includes(item.kind) &&
      (item.dayId === null || Number.isSafeInteger(item.dayId) && item.dayId > 0))) return null
  return { comparison: d.comparison, truncated: d.truncated,
    differences: d.differences.map(({ path, kind, dayId }) => ({ path, kind, dayId })) }
}

export function safeIssue134PriorUnknownDetails(error) {
  if (error?.code !== 'ISSUE134_PRIOR_UNKNOWN_MISMATCH' || error?.safeDetails?.comparison === 'day-fields') return null
  return safeIssue134DifferenceDetails(error.safeDetails)
}

export function assertIssue134PriorUnknownUnchanged(prior, { dayIdByKey, localized, history }) {
  assert(prior?.kind === 'issue134-additive-fresh-before-image-v1' &&
    prior?.historyRepresentation === 'root identities and per-table row counts/SHA-256; no restorable version-row data',
  'UNKNOWN: prior UNKNOWN before-image contract is unsupported')
  assert(/^issue134-production-additive-\d{8}-[a-f0-9-]{36}$/.test(prior?.runId ?? '') &&
    /^[a-f0-9]{64}$/.test(prior?.manifestSha256 ?? ''), 'BLOCK: prior UNKNOWN run/manifest identity is malformed')
  assert.equal(prior?.memory?.id, 2, 'BLOCK: prior UNKNOWN Memory identity differs')
  assert.deepEqual(Object.keys(prior.dayLocaleData ?? {}).sort(), ['en', 'zh-TW'],
    'UNKNOWN: prior UNKNOWN localized before-image is incomplete')
  assert(Array.isArray(prior.plan.updatedDayIds) && prior.plan.updatedDayIds.length > 0 &&
    prior.plan.updatedDayIds.every((id) => Number.isSafeInteger(id) && id > 0),
  'BLOCK: prior UNKNOWN history target set is malformed')
  assert.deepEqual(Object.keys(prior.history.rootsByDay ?? {}).map(Number).sort((a, b) => a - b),
    prior.plan.updatedDayIds, 'UNKNOWN: prior UNKNOWN root identity set is incomplete')
  const same = (actual, expected, message, comparison) => {
    if (!isDeepStrictEqual(actual, expected)) throw Object.assign(new Error(message), {
      code: 'ISSUE134_PRIOR_UNKNOWN_MISMATCH', safeDetails: differenceDetails(actual, expected, comparison),
    })
  }
  same(dayIdByKey, prior.dayIdByKey, 'UNKNOWN: target Day identities differ from prior UNKNOWN before-image', 'identity')
  same(durableValue(localized), prior.dayLocaleData,
    'UNKNOWN: current localized Day state differs from prior UNKNOWN before-image', 'localized')
  const ids = [...prior.plan.updatedDayIds].sort((a, b) => a - b)
  same(history.dayIds, ids, 'UNKNOWN: prior UNKNOWN history target set is incomplete', 'history-targets')
  assert.deepEqual(Object.keys(prior.history.tables).sort(), [...historyTables].sort(),
    'UNKNOWN: prior UNKNOWN history before-image is incomplete')
  for (const table of historyTables) {
    const summary = prior.history.tables[table]
    assert(summary?.representation === 'ordered-id-and-pg-jsonb-row-sha256-v1' &&
      Number.isSafeInteger(summary.rows) && summary.rows >= 0 && /^[a-f0-9]{64}$/.test(summary.sha256 ?? ''),
    'UNKNOWN: prior UNKNOWN history summary is malformed')
  }
  same(history.currentRoots, prior.history.rootsByDay,
    'UNKNOWN: current version root identities differ from prior UNKNOWN before-image', 'history-roots')
  same(history.tables, prior.history.tables, 'UNKNOWN: current version content differs from prior UNKNOWN before-image', 'history-tables')
  return { status: 'PASS', classification: 'UNCHANGED_FROM_PRIOR_UNKNOWN_BEFORE_IMAGE',
    targetDays: ids.length, historyTables: historyTables.length }
}
