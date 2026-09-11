import { isDeepStrictEqual } from 'node:util'

export type V2Record = Record<string, unknown>
export type V2Plan = {
  action: 'create' | 'update' | 'preserve-current' | 'conflict'
  data: V2Record
  base: V2Record
  conflicts: string[]
}

// Unlike v1, omission is never a removal request, even inside groups, arrays
// and translations. The accepted source baseline remains separate from Current.
export function reconcileMemoryV2(source: V2Record, base?: V2Record, current?: V2Record): V2Plan {
  if (!current) return { action: 'create', data: source, base: source, conflicts: [] }
  if (!base) return { action: 'preserve-current', data: current, base: {}, conflicts: [] }
  const conflicts: string[] = []
  const merge = (s: unknown, b: unknown, c: unknown, path: string, baseline = false): unknown => {
    if (b === null) b = undefined
    if (c === null) c = undefined
    if (s === undefined || (Array.isArray(s) && s.length === 0)) return baseline ? b : c
    if (isDeepStrictEqual(s, b)) return baseline ? b : c
    if (record(s) && (record(b) || b === undefined) && (record(c) || c === undefined)) {
      if (c === undefined && b !== undefined && !baseline) {
        conflicts.push(`${path}: Current removed this group; review before restoring`)
        return c
      }
      const result: V2Record = { ...(baseline ? record(b) ? b : {} : record(c) ? c : {}) }
      for (const [key, value] of Object.entries(s)) {
        const next = merge(value, record(b) ? b[key] : undefined, record(c) ? c[key] : undefined, `${path}.${key}`, baseline)
        if (next !== undefined) result[key] = next
      }
      return result
    }
    if (Array.isArray(s) && (Array.isArray(b) || b === undefined) && (Array.isArray(c) || c === undefined)) {
      if (c === undefined && b !== undefined && !baseline) {
        conflicts.push(`${path}: Current removed this array; review before restoring`)
        return c
      }
      const previous = Array.isArray(b) ? b : []
      const present = Array.isArray(c) ? c : []
      const sMap = keyed(s, path)
      const bMap = keyed(previous, path)
      const cMap = keyed(present, path)
      if (!sMap || !bMap || !cMap) {
        // Anonymous arrays (e.g. reminder text) cannot be matched on position.
        if (!previous.length && !present.length) return s
        if (!baseline) conflicts.push(`${path}: no unique stable row identity; explicit reviewed mapping required`)
        return baseline ? b : c
      }
      const result = new Map(baseline ? bMap : cMap)
      for (const [key, value] of sMap) {
        const next = merge(value, bMap.get(key), cMap.get(key), `${path}[${key}]`, baseline)
        if (next !== undefined) result.set(key, next)
      }
      // Source ordering is accepted only if Current has not independently
      // reordered the array. Omitted rows remain, including Admin-only rows.
      const currentOrderChanged = !isDeepStrictEqual([...bMap.keys()], [...cMap.keys()])
      const order = baseline || !currentOrderChanged
        ? [...sMap.keys(), ...result.keys()]
        : [...result.keys()]
      return [...new Set(order)].filter(key => result.has(key)).map(key => result.get(key))
    }
    if (baseline) return s
    if (isDeepStrictEqual(c, b) || isDeepStrictEqual(c, s)) return s
    conflicts.push(path)
    return c
  }
  const data = merge(source, base, current, '$') as V2Record
  const nextBase = merge(source, base, base, '$', true) as V2Record
  return {
    action: conflicts.length ? 'conflict' : isDeepStrictEqual(data, current) ? 'preserve-current' : 'update',
    data, base: nextBase, conflicts: [...new Set(conflicts)],
  }
}

function record(value: unknown): value is V2Record {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function keyed(items: unknown[], path: string): Map<string, unknown> | undefined {
  const result = new Map<string, unknown>()
  for (const item of items) {
    const field = path.split('.').pop()
    let key: unknown
    if (typeof item === 'string' || typeof item === 'number') key = String(item)
    else if (record(item)) {
      if (field === 'moments') key = item.momentKey
      else if (field === 'placements') key = item.placementKey
      else if (field === 'storySections') key = item.anchor
      else if (field === 'guestParticipants') key = item.name
      else if (field === 'reminders') key = item.category
      else if (field === 'tags') key = item.tag
      else if (field === 'items') key = item.id
      else if (field === 'links' || field === 'externalVideos') key = item.url
      else if (field === 'flights' && item.flightNumber && (item.date || item.dateLabel)) key = `${item.flightNumber}:${item.date ?? item.dateLabel}`
      else if (field === 'lodgings' && item.hotel && (item.startDate || item.dateRange)) key = `${item.hotel}:${item.startDate ?? item.dateRange}`
    }
    if (typeof key !== 'string' || !key || result.has(key)) return undefined
    result.set(key, item)
  }
  return result
}
