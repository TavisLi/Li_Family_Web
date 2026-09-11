import { readFile } from 'node:fs/promises'
import { parseMemorySourceV2, projectMemoryV2 } from './travel-memory-source-v2'

// Offline only. Symbolic IDs exercise projection, not relationship existence.
const file = process.argv[2]
if (!file || process.argv.length !== 3) throw new Error('Usage: node --import tsx src/scripts/travel-memory-v2-audit.ts <source.md>')
const source = parseMemorySourceV2(await readFile(file, 'utf8'))
const relationships = new Map<string, number>()
const symbol = (kind: string, value: string) => {
  const key = `${kind}:${value}`
  if (!relationships.has(key)) relationships.set(key, relationships.size + 1)
  return relationships.get(key)!
}
const result = projectMemoryV2(source, {
  member: value => symbol('member', value), plan: value => symbol('plan', value), media: value => symbol('media', value),
})
console.log(JSON.stringify({
  result: 'PASS', mode: 'offline-parser-projection-only', slug: source.slug, locale: source.locale,
  counts: {
    days: result.days.length, flights: result.memory.travelLedger?.flights?.length ?? 0,
    lodgings: result.memory.travelLedger?.lodgings?.length ?? 0, stories: result.memory.storySections?.length ?? 0,
    moments: result.days.reduce((total, day) => total + (day.moments?.length ?? 0), 0),
    placements: result.days.flatMap(day => day.moments ?? []).reduce((total, moment) => total + (moment.placements?.length ?? 0), 0),
    declaredAssets: result.assets.length, unresolvedRelationshipReferences: relationships.size,
  },
  limitations: ['No database or environment loaded', 'Relationship existence and asset bytes not verified', 'Not approval to apply or publish'],
}, null, 2))
