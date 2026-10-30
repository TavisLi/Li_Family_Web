import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

const hash = (value) => createHash('sha256').update(value).digest('hex')

// Bound server work as well as the one-row response. Keep the existing digest's
// exact JSON bytes so retained before-images need no new Production capture.
export const issue134HistoryRowLimit = 25000
const historyRoutes = {
  _travel_memory_days_v: ['', 'item.id'],
  _travel_memory_days_v_locales: ['', 'item._parent_id'],
  _travel_memory_days_v_version_moments: ['', 'item._parent_id'],
  _travel_memory_days_v_version_moments_locales: [
    'JOIN public._travel_memory_days_v_version_moments m ON m.id = item._parent_id', 'm._parent_id'],
  _travel_memory_days_v_version_moments_placements: [
    'JOIN public._travel_memory_days_v_version_moments m ON m.id = item._parent_id', 'm._parent_id'],
  _travel_memory_days_v_version_moments_placements_locales: [
    'JOIN public._travel_memory_days_v_version_moments_placements p ON p.id = item._parent_id ' +
      'JOIN public._travel_memory_days_v_version_moments m ON m.id = p._parent_id', 'm._parent_id'],
}

export function issue134HistorySummaryQuery(table) {
  assert(Object.hasOwn(historyRoutes, table), 'BLOCK: unsupported additive history table')
  const [joins, parent] = historyRoutes[table]
  const content = table === '_travel_memory_days_v' ? "(to_jsonb(item) - 'latest')" : 'to_jsonb(item)'
  return `WITH bounded AS (SELECT item.id, pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(` +
    `${content}::text, 'UTF8')), 'hex') AS row_sha256 FROM public.${table} item ${joins} ` +
    `WHERE ${parent} = ANY($1::int[]) ORDER BY item.id LIMIT $2) ` +
    `SELECT count(*)::int AS rows, pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(` +
    `'[' || coalesce(string_agg('{"id":' || id::text || ',"sha256":"' || row_sha256 || '"}', ',' ORDER BY id), '') || ']', ` +
    `'UTF8')), 'hex') AS sha256 FROM bounded`
}

async function boundedQuery(client, query, values, limits, counters, guard) {
  guard?.()
  counters.queries += 1
  counters.roundTrips += 1
  counters.requestBytes += Buffer.byteLength(query) + Buffer.byteLength(JSON.stringify(values ?? []))
  assert(counters.queries <= limits.queryBudget && counters.roundTrips <= limits.roundTripBudget,
    'BLOCK: additive history query budget')
  const result = await client.query({ text: query, values })
  const bytes = Buffer.byteLength(JSON.stringify(result.rows))
  assert(result.rows.length <= limits.rowCap, 'BLOCK: additive history row cap')
  assert(bytes <= limits.responseByteCap, 'BLOCK: additive history response byte cap')
  counters.rows += result.rows.length
  counters.responseBytes += bytes
  guard?.()
  return result.rows
}

export async function captureIssue134AdditiveVersionState(client, dayIds, {
  existingRoots, limits = { rowCap: 20, responseByteCap: 65536, queryBudget: 5000, roundTripBudget: 5000 },
  counters = { queries: 0, roundTrips: 0, rows: 0, requestBytes: 0, responseBytes: 0 }, guard = () => {},
} = {}) {
  assert(Array.isArray(dayIds) && dayIds.every((id) => Number.isSafeInteger(id) && id > 0),
    'BLOCK: invalid additive history Day identities')
  const days = [...new Set(dayIds)].sort((a, b) => a - b)
  const rootsByDay = existingRoots ? Object.fromEntries(days.map((id) => [id, existingRoots[id] ?? []])) : {}
  if (!existingRoots) {
    for (const dayId of days) {
      const roots = []
      for (let offset = 0; ; offset += limits.rowCap) {
        const page = await boundedQuery(client,
          'SELECT id, latest FROM public._travel_memory_days_v WHERE parent_id = $1 ORDER BY id LIMIT $2 OFFSET $3',
          [dayId, limits.rowCap, offset], limits, counters, guard)
        roots.push(...page.map((row) => ({ id: Number(row.id), latest: row.latest === true })))
        if (page.length < limits.rowCap) break
      }
      rootsByDay[dayId] = roots
    }
  }
  const rootIds = days.flatMap((id) => rootsByDay[id].map((row) => row.id)).sort((a, b) => a - b)
  assert(rootIds.length <= issue134HistoryRowLimit, 'BLOCK: additive history source row cap')
  const currentRoots = {}
  if (existingRoots) {
    for (const dayId of days) {
      const roots = []
      for (let offset = 0; ; offset += limits.rowCap) {
        const page = await boundedQuery(client,
          'SELECT id, latest FROM public._travel_memory_days_v WHERE parent_id = $1 ORDER BY id LIMIT $2 OFFSET $3',
          [dayId, limits.rowCap, offset], limits, counters, guard)
        roots.push(...page.map((row) => ({ id: Number(row.id), latest: row.latest === true })))
        if (page.length < limits.rowCap) break
      }
      currentRoots[dayId] = roots
    }
  } else {
    for (const dayId of days) currentRoots[dayId] = rootsByDay[dayId]
  }

  let tables = {}
  if (rootIds.length) {
    let historyRows = 0
    for (const table of Object.keys(historyRoutes)) {
      const result = await boundedQuery(client, issue134HistorySummaryQuery(table),
        [rootIds, issue134HistoryRowLimit + 1], limits, counters, guard)
      assert(result.length === 1 && Number.isSafeInteger(result[0].rows) && result[0].rows >= 0 &&
        typeof result[0].sha256 === 'string' && /^[a-f0-9]{64}$/.test(result[0].sha256),
      'BLOCK: malformed additive history row digest')
      historyRows += result[0].rows
      assert(historyRows <= issue134HistoryRowLimit, 'BLOCK: additive history source row cap')
      tables[table] = { representation: 'ordered-id-and-pg-jsonb-row-sha256-v1', ...result[0] }
    }
    assert.equal(tables._travel_memory_days_v?.rows, rootIds.length,
      'UNKNOWN: an existing Day version root disappeared')
  }
  return { dayIds: days, rootsByDay, currentRoots, tables,
    rootsSha256: hash(JSON.stringify(rootsByDay)), counters: { ...counters } }
}

export function assertIssue134AdditiveHistoryPreserved(before, after, expectedNewVersions, versionsPerDay = 1) {
  assert([1, 2].includes(versionsPerDay), 'BLOCK: unsupported additive version count')
  assert.equal(expectedNewVersions, before.dayIds.length * versionsPerDay, 'BLOCK: additive version count differs from plan')
  assert.deepEqual(after.dayIds, before.dayIds, 'UNKNOWN: additive history Day set drift')
  assert.deepEqual(after.tables, before.tables, 'BLOCK: existing Day version content or descendants changed')
  for (const dayId of before.dayIds) {
    const oldRows = before.rootsByDay[dayId]
    const currentRows = after.currentRoots[dayId]
    assert.equal(currentRows.length, oldRows.length + versionsPerDay, 'BLOCK: Payload version-root count differs from plan')
    const oldIds = new Set(oldRows.map((row) => row.id))
    const newRows = currentRows.filter((row) => !oldIds.has(row.id))
    assert.equal(newRows.length, versionsPerDay, 'BLOCK: additive Day version identity is ambiguous')
    const previousLatest = oldRows.filter((row) => row.latest)
    const latestNow = currentRows.filter((row) => row.latest)
    assert.equal(previousLatest.length, 1, 'UNKNOWN: prior Day latest-version pointer is ambiguous')
    assert.equal(latestNow.length, 1, 'BLOCK: Payload latest-version pointer is ambiguous after update')
    assert.equal(latestNow[0].id, newRows.at(-1).id, 'BLOCK: appended Day version is not the latest version')
  }
  return { status: 'PASS', existingVersionRoots: before.dayIds.reduce((sum, id) => sum + before.rootsByDay[id].length, 0),
    appendedVersionRoots: expectedNewVersions, protectedTables: Math.max(0, Object.keys(before.tables).length - 1),
    preservedContentSha256: before.rootsSha256 }
}
