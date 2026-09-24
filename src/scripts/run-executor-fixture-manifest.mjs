import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { manifestHash } from './run-contract.mjs'

const [runDirectory, runId] = process.argv.slice(2)
if (!runDirectory || !/^issue-105-slice2-[a-z0-9-]+$/.test(runId ?? '')) {
  throw new Error('Usage: node src/scripts/run-executor-fixture-manifest.mjs <run-directory> <issue-105-slice2-run-id>')
}
const root = process.cwd()
const artifact = async (name) => ({ path: name,
  sha256: createHash('sha256').update(await readFile(path.join(root, name))).digest('hex') })
const backupPath = 'docs/phase-artifacts/issue-105/slice-2-example/backup.json'
const executor = 'src/scripts/run-executor.mjs'
const sql = 'src/scripts/run-executor-retirement-plan.mjs'
const dependencies = [
  'src/scripts/run-contract.mjs', 'src/scripts/run-executor-evidence.mjs',
  'src/scripts/run-executor-rehearsal.mjs', 'src/scripts/run-executor-session.mjs',
  'src/scripts/run-executor-terminal.mjs', 'src/scripts/run-executor-fixture.mjs',
  'src/scripts/run-executor-fixture-manifest.mjs', 'docs/phase-artifacts/issue-105/slice-2-example/limits.json',
  'package.json', 'pnpm-lock.yaml',
]
const backup = JSON.parse(await readFile(path.join(root, backupPath), 'utf8'))
const manifest = {
  version: 1, runId, environment: 'disposable', target: '127.0.0.1:55444/issue105',
  runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: {
    entrypoint: 'src/scripts/run-executor-session.mjs', envNames: ['DATABASE_URI', 'PAYLOAD_ENABLE_DEV_SCHEMA_PUSH'],
  }, schemaPush: 'disabled' },
  scope: {
    include: ['travel_memories_rels legacy paths', '_travel_memories_v_rels legacy paths', 'travel_memories_daily_highlights'],
    exclude: ['non-target relation paths', 'travel_memories canonical content', 'Production'],
    expectedEffects: ['disposable exact-row delete and RESTRICT drop', 'disposable restore and full read-back'],
    stopConditions: ['scope or metadata drift', 'row or byte cap', 'query or round-trip budget', 'timeout', 'unknown commit'],
    baseline: backup.snapshotSha256,
  },
  artifacts: { executor: await artifact(executor), sql: [await artifact(sql)], backup: await artifact(backupPath),
    dependencies: await Promise.all(dependencies.map(artifact)) },
  approval: { action: 'local', allowed: ['local'], excluded: ['preview-deploy', 'production-read',
    'production-migration', 'destructive-cleanup', 'merge', 'release'],
  validFrom: '2026-09-23T00:00:00.000Z', validUntil: '2026-10-01T00:00:00.000Z' },
}
await mkdir(runDirectory, { recursive: true, mode: 0o700 })
const write = (name, value) => writeFile(path.join(runDirectory, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
await write('manifest.json', manifest)
await write('ledger.json', { version: 1, runId, manifestSha256: manifestHash(manifest), events: [] })
await write('evidence.json', [])
await write('dependencies.json', {})
console.log(JSON.stringify({ status: 'DISPOSABLE_MANIFEST_READY', runId, manifestSha256: manifestHash(manifest) }))
