import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

export const c0QueryFiles = Object.freeze({
  parents: 'phase-21-c0-parent-inventory.sql', days: 'phase-21-c0-days.sql',
  highlights: 'phase-21-c0-highlights.sql', itinerary: 'phase-21-c0-itinerary-mapping.sql',
  security: 'phase-21-c0-security.sql', history: 'phase-21-c0-history.sql',
})
export const c0FrozenPackage = 'docs/phase-artifacts/phase-21/phase-21-101-c0-frozen-package.json'
const artifacts = 'docs/phase-artifacts/phase-21/'
export async function inspectC0Package() {
  assert.equal(process.version, 'v20.20.2', 'BLOCK: Node version')
  const merge = '3f6b2c4c53e684510265e07fb3b4633d71d5a775'
  execFileSync('git', ['cat-file', '-e', `${merge}^{commit}`])
  const trackedPaths = ['src/lib/data/travel.ts','src/lib/travel-runtime.ts','src/lib/travel-memory.ts',
    'src/payload','src/migrations','package.json','pnpm-lock.yaml']
  execFileSync('git', ['diff', '--exit-code', merge, '--', ...trackedPaths], { stdio: 'pipe' })
  const index = await readFile('src/migrations/index.ts', 'utf8')
  const migrations = [...index.matchAll(/name: '([^']+)'/g)].map((match) => match[1]).sort()
  assert(migrations.length > 0 && new Set(migrations).size === migrations.length, 'BLOCK: migration manifest')
  // Phase 17's separately approved executor recorded this migration. It must
  // remain outside index.ts so normal runners never repeat destructive cleanup.
  const historicalMigrations = [{ name: '20260719_025401', batch: 8 }]
  const scripts = (await readdir('src/scripts')).filter((name) => name.startsWith('phase21-c0-') && /\.(mjs|sql)$/.test(name)).map((name) => `src/scripts/${name}`)
  const schemaFile = 'src/migrations/20260802_061812_phase_19_travel_memory_multi_page.json'
  const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
  const tables = Object.values(schema.tables).map((table) => table.name).filter((name) =>
    /^(?:_?travel_memories(?:_|$)|_?travel_memory_days(?:_|$)|media(?:_|$)|payload_migrations$|travel_route_identities(?:_|$))/.test(name)).sort()
  assert(tables.includes('travel_memories') && tables.includes('travel_memory_days') && tables.includes('media_rels'), 'BLOCK: schema table manifest')
  const fixed = ['src/lib/data/travel.ts','src/lib/travel-runtime.ts','src/lib/travel-memory.ts',
    'src/payload/collections/TravelMemories.ts','src/payload/collections/TravelMemoryDays.ts',
    'src/payload/collections/Media.ts','src/payload/payload.config.ts',
    'src/migrations/index.ts',schemaFile,'package.json','pnpm-lock.yaml',
    'docs/phase-completion-reports/phase-17-travel-plan-memory-split.md',
    ...historicalMigrations.map(({name}) => `src/migrations/${name}.ts`),
    ...migrations.map((name) => `src/migrations/${name}.ts`)]
  const checksums = Object.fromEntries(await Promise.all([...scripts, ...Object.values(c0QueryFiles).map((name) => artifacts + name), ...fixed].sort().map(async (file) =>
    [file, createHash('sha256').update(await readFile(file)).digest('hex')])) )
  return { status: 'C0_LOCAL_PACKAGE_INSPECTED_NOT_EXECUTION_APPROVAL', merge,
    productionConnections: 0, tables, migrations, historicalMigrations, queries: c0QueryFiles, checksums }
}
