import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { manifestHash } from './run-contract.mjs'

const [runDirectory, runId, fault] = process.argv.slice(2)
const faults = new Set(['normal', 'warning', 'silent-exit', 'delay', 'long-wait', 'deadline',
  'oversized-response', 'query-cancelled', 'connection-drop', 'rollback-failure', 'commit-ack-loss', 'signal'])
if (!runDirectory || !/^issue-105-local-[a-z0-9-]+$/.test(runId ?? '') || !faults.has(fault) ||
    process.argv.length !== 5) {
  throw new Error('Usage: node src/scripts/run-local-manifest.mjs <run-directory> <issue-105-local-id> <fault>')
}
const root = process.cwd()
const artifact = async (name) => ({ path: name,
  sha256: createHash('sha256').update(await readFile(path.join(root, name))).digest('hex') })
const backupPath = 'docs/phase-artifacts/issue-105/slice-2-example/backup.json'
const limitPath = `docs/phase-artifacts/issue-105/local-closeout/${
  ['long-wait', 'deadline'].includes(fault) ? `${fault}/` : ''}limits.json`
const dependencies = [
  'src/scripts/run-contract.mjs', 'src/scripts/run-executor-evidence.mjs',
  'src/scripts/run-executor-terminal.mjs', 'src/scripts/run-local-fault-client.mjs',
  'src/scripts/run-local-rehearsal.mjs', 'src/scripts/run-local-session.mjs',
  'src/scripts/run-local-manifest.mjs', limitPath,
  'docs/phase-artifacts/issue-105/local-closeout/read-retry-policy.json',
  'package.json', 'pnpm-lock.yaml',
]
const backup = JSON.parse(await readFile(path.join(root, backupPath), 'utf8'))
const manifest = {
  version: 1, runId, environment: 'disposable', target: '127.0.0.1:55444/issue105',
  runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: {
    entrypoint: 'src/scripts/run-local-session.mjs', envNames: ['DATABASE_URI', 'PAYLOAD_ENABLE_DEV_SCHEMA_PUSH'],
  }, schemaPush: 'disabled' },
  scope: {
    include: ['travel_memories_rels legacy paths', '_travel_memories_v_rels legacy paths', 'travel_memories_daily_highlights'],
    exclude: ['non-target relation paths', 'travel_memories canonical content', 'Production'],
    expectedEffects: ['disposable apply and restore or fail closed', `local-fault:${fault}`],
    stopConditions: ['scope or metadata drift', 'row or byte cap', 'query or round-trip budget', 'timeout', 'unknown commit'],
    baseline: backup.snapshotSha256,
  },
  artifacts: { executor: await artifact('src/scripts/run-executor.mjs'),
    sql: [await artifact('src/scripts/run-executor-retirement-plan.mjs')],
    backup: await artifact(backupPath), dependencies: await Promise.all(dependencies.map(artifact)) },
  approval: { action: 'local', allowed: ['local'], excluded: ['preview-deploy', 'production-read',
    'production-migration', 'destructive-cleanup', 'merge', 'release'],
  validFrom: '2026-09-23T00:00:00.000Z', validUntil: '2026-10-07T00:00:00.000Z' },
}
await mkdir(runDirectory, { recursive: true, mode: 0o700 })
const save = (name, value) => writeFile(path.join(runDirectory, name), `${JSON.stringify(value, null, 2)}\n`,
  { flag: 'wx', mode: 0o600 })
await save('manifest.json', manifest)
await save('ledger.json', { version: 1, runId, manifestSha256: manifestHash(manifest), events: [] })
await save('evidence.json', [])
await save('dependencies.json', {})
console.log(JSON.stringify({ status: 'DISPOSABLE_MANIFEST_READY', runId, manifestSha256: manifestHash(manifest) }))
