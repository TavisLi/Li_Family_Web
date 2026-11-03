import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

// Snapshots come from the eventual independent observer, never from the writer.
// Every row is keyed by table and complete physical identity; duplicates block.
export function indexSnapshot(snapshot) {
  assert(Array.isArray(snapshot), 'BLOCK: physical snapshot missing')
  const result = new Map()
  for (const row of snapshot) {
    assert(row && typeof row.table === 'string' && row.table.length && typeof row.key === 'string' && row.key.length, 'BLOCK: row identity missing')
    const id = JSON.stringify([row.table,row.key])
    assert(!result.has(id), 'BLOCK: duplicate physical row identity')
    result.set(id,row.value)
  }
  return result
}
export function assertUnchanged(before, after, allowed = []) {
  const a=indexSnapshot(before),b=indexSnapshot(after), permit=new Set(allowed.map(x=>JSON.stringify([x.table,x.key])))
  const all=new Set([...a.keys(),...b.keys()])
  for(const id of all) {
    if(permit.has(id)) continue
    assert(a.has(id) && b.has(id), `BLOCK: non-target row added or removed ${id}`)
    assert.deepEqual(b.get(id),a.get(id), `BLOCK: non-target row changed ${id}`)
  }
  return { preserved: [...all].filter(id=>!permit.has(id)).length }
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}
export function snapshotDigest(snapshot) {
  const entries=[...indexSnapshot(snapshot)].sort(([a],[b])=>a.localeCompare(b,'en'))
  return createHash('sha256').update(JSON.stringify(canonical(entries))).digest('hex')
}
