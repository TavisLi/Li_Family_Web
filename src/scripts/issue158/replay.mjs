import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { verifyBaseline } from './baseline.mjs'
import { verifySemanticCatalog } from './catalog.mjs'
import { boundedRestoreScript, boundedRestoreSql, terminalStatus } from './restore.mjs'
import { inspectOwnedCiService, verifyConnectedPeer } from './ownership.mjs'
import { manifestHash, validateManifest, verifyEvidenceFiles, verifyManifestFiles } from '../run-contract.mjs'
import { fileEvidenceSink } from '../run-executor-evidence.mjs'

const root = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const schemaPath = 'scripts/rehearsal/baselines/issue158-v12/schema.sql'
const queryPath = 'scripts/rehearsal/baselines/issue158-v12/catalog-queries.json'
const semanticPath = 'scripts/rehearsal/baselines/issue158-v12/semantic-catalog.json'
// Docker Official Image multi-platform OCI index digest; platform manifests differ.
const image = 'postgres:17.11@sha256:d74eeac9a635390a49bc21bd49fccd973de707e2a53a76ac49b552b8712ec46f'
const mappedTables = ['_travel_memories_v', '_travel_memories_v_locales', '_travel_memory_days_v',
  '_travel_memory_days_v_locales', 'travel_memories', 'travel_memories_locales', 'travel_memory_days',
  'travel_memory_days_locales', 'travel_plans', 'travel_route_identities', 'travel_route_identities_rels']
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const save = (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
const digestFile = async (file) => sha256(await readFile(file))
const failureCode = (error) => error?.issue158Code ??
  (/^[0-9A-Z_]+$/.test(error?.code ?? '') ? error.code : 'LOCAL_REHEARSAL_FAILURE')

async function pgRequire() {
  const adapter = await realpath(path.join(root, 'node_modules/@payloadcms/db-postgres/package.json'))
  const { createRequire } = await import('node:module')
  return createRequire(adapter)('pg')
}

export function validateTarget({ host, database, user, port, ciService = false }) {
  assert.equal(database, 'postgres', 'BLOCK: admin database must be the disposable service default')
  assert.equal(typeof user, 'string')
  assert(user.length > 0 && !/[\s/@]/.test(user), 'BLOCK: database user')
  assert(Number.isInteger(Number(port)) && Number(port) >= 1 && Number(port) <= 65535, 'BLOCK: database port')
  const socket = typeof host === 'string' && path.isAbsolute(host) && !host.includes('\0')
  if (!socket) assert.equal(ciService, true, 'BLOCK: TCP replay requires an inspected CI service')
  assert(socket || host === '127.0.0.1', 'BLOCK: use a private Unix socket or IPv4 loopback')
  return { transport: socket ? 'unix-socket' : 'ci-loopback', endpointHost: socket ? null : host,
    endpointPort: Number(port) }
}

function inspectCiService(port) {
  const ids = execFileSync('docker', ['ps', '--filter', 'publish=' + port, '--format', '{{.ID}}'],
    { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n').filter(Boolean)
  assert.equal(ids.length, 1, 'BLOCK: CI PostgreSQL container identity is ambiguous')
  const items = JSON.parse(execFileSync('docker', ['inspect', ...ids],
    { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] }))
  const containers = items.map((item) => ({ id: item.Id, image: item.Config?.Image,
    ports: (item.NetworkSettings?.Ports?.['5432/tcp'] ?? []).map((binding) => ({
      hostIp: binding.HostIp, hostPort: Number(binding.HostPort), containerPort: 5432, protocol: 'tcp' })) }))
  return inspectOwnedCiService(containers, { hostPort: port, image })
}

function localPgBin() {
  const candidates = [process.env.ISSUE158_PG_BIN, '/opt/homebrew/opt/postgresql@17/bin',
    '/usr/local/opt/postgresql@17/bin', '/opt/homebrew/Cellar/postgresql@17/17.11/bin'].filter(Boolean)
  for (const candidate of candidates) {
    try {
      const version = execFileSync(path.join(candidate, 'pg_config'), ['--version'],
        { encoding: 'utf8', timeout: 3000 }).trim()
      if (version.startsWith('PostgreSQL 17.11')) return candidate
    } catch {}
  }
  throw new Error('BLOCK: PostgreSQL 17.11 is required; set ISSUE158_PG_BIN to its bin directory')
}

function runPgTool(bin, name, args, env, timeout = 30000) {
  return execFileSync(path.join(bin, name), args, { encoding: 'utf8', env, timeout,
    maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}

function runPgInput(bin, name, args, env, input, timeout = 180000) {
  return execFileSync(path.join(bin, name), args, { encoding: 'utf8', env, input, timeout,
    maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] })
}

async function startOwnedCluster() {
  const bin = localPgBin()
  const directory = await mkdtemp(path.join(os.tmpdir(), 'issue158-owned-pg17-'))
  await chmod(directory, 0o700)
  const socket = path.join(directory, 'socket'), home = path.join(directory, 'home')
  await mkdir(socket, { mode: 0o700 }); await mkdir(home, { mode: 0o700 })
  const owner = { task: 'issue158-maintained-replay', path: directory, runId: randomUUID() }
  await save(path.join(directory, 'owner.json'), owner)
  const env = { PATH: bin + ':/usr/bin:/bin', HOME: home, LANG: 'C', LC_ALL: 'C',
    PGSERVICEFILE: path.join(home, 'service'), PGPASSFILE: path.join(home, 'pass'),
    PGOPTIONS: '-c statement_timeout=10000 -c lock_timeout=2000 -c timezone=UTC' }
  runPgTool(bin, 'initdb', ['-D', path.join(directory, 'data'), '-U', 'postgres', '--auth-local=trust',
    '--auth-host=reject', '--encoding=UTF8', '--locale=C', '--no-instructions'], env, 60000)
  const config = ['',
    "listen_addresses=''", 'port=5432', "unix_socket_directories='" + socket + "'",
    "statement_timeout='10s'", "lock_timeout='2s'", "idle_in_transaction_session_timeout='30s'", "timezone='UTC'", ''].join('\n')
  await writeFile(path.join(directory, 'data/postgresql.conf'), config, { flag: 'a', mode: 0o600 })
  runPgTool(bin, 'pg_ctl', ['-D', path.join(directory, 'data'), '-l', path.join(directory, 'server.log'),
    '-w', 'start'], env, 60000)
  return { bin, directory, socket, env, owner }
}

async function stopOwnedCluster(cluster) {
  if (!cluster) return 'OWNED_BY_GITHUB_ACTIONS_JOB'
  const marker = JSON.parse(await readFile(path.join(cluster.directory, 'owner.json'), 'utf8'))
  assert.deepEqual(marker, cluster.owner, 'BLOCK: refusing to clean an unowned cluster')
  runPgTool(cluster.bin, 'pg_ctl', ['-D', path.join(cluster.directory, 'data'), '-m', 'fast', '-w', 'stop'],
    cluster.env, 30000)
  const status = spawnSync(path.join(cluster.bin, 'pg_ctl'), ['-D', path.join(cluster.directory, 'data'), 'status'],
    { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'pipe'] })
  assert.notEqual(status.status, 0, 'BLOCK: owned PostgreSQL cluster is still running')
  await rm(cluster.directory, { recursive: true, force: false })
  return 'PASS'
}

async function pgClient(options, database, user, password) {
  const { Client } = await pgRequire()
  const client = new Client({ host: options.host, port: options.port, database, user, password,
    connectionTimeoutMillis: 5000, query_timeout: 10000, application_name: 'issue158-local-consumer-replay',
    options: '-c statement_timeout=10000 -c lock_timeout=2000 -c timezone=UTC -c search_path=public,pg_catalog' })
  await client.connect()
  return client
}

async function ensureRoles(client) {
  const result = await client.query('SELECT rolname, rolsuper, rolbypassrls, rolcanlogin FROM pg_catalog.pg_roles ' +
    'WHERE rolname = ANY($1::text[]) ORDER BY rolname', [['anon', 'authenticated', 'service_role', 'supabase_admin']])
  const found = new Map(result.rows.map((row) => [row.rolname, row]))
  for (const name of ['anon', 'authenticated', 'service_role', 'supabase_admin']) {
    if (!found.has(name)) await client.query('CREATE ROLE "' + name + '" NOLOGIN NOSUPERUSER NOBYPASSRLS')
    else assert.deepEqual(found.get(name), { rolname: name, rolsuper: false, rolbypassrls: false, rolcanlogin: false },
      'BLOCK: synthetic role attribute drift: ' + name)
  }
}

async function dbExists(options, database) {
  const admin = await pgClient(options, 'postgres', options.user, options.password)
  try { return (await admin.query('SELECT 1 FROM pg_catalog.pg_database WHERE datname=$1', [database])).rowCount === 1 }
  finally { await admin.end() }
}

async function createOwnedDatabase(options, database) {
  const admin = await pgClient(options, 'postgres', options.user, options.password)
  try {
    assert.equal((await admin.query('SELECT 1 FROM pg_catalog.pg_database WHERE datname=$1', [database])).rowCount, 0,
      'BLOCK: generated database already exists')
    await admin.query('CREATE DATABASE "' + database + '" TEMPLATE template0')
  } finally { await admin.end() }
}

async function dropOwnedDatabase(options, database, ownerPath, runId) {
  const owner = JSON.parse(await readFile(path.join(ownerPath, 'owner.json'), 'utf8'))
  assert.equal(owner.runId, runId, 'BLOCK: owner marker run ID drift')
  assert.equal(owner.database, database, 'BLOCK: owner marker database drift')
  const admin = await pgClient(options, 'postgres', options.user, options.password)
  try {
    if (await dbExists(options, database)) await admin.query('DROP DATABASE "' + database + '"')
  } finally { await admin.end() }
  assert.equal(await dbExists(options, database), false, 'BLOCK: database cleanup readback failed')
}

async function tableSnapshot(client) {
  const tables = (await client.query('SELECT c.relname FROM pg_catalog.pg_class c ' +
    'JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace ' +
    'WHERE n.nspname=\'public\' AND c.relkind=\'r\' ORDER BY c.relname COLLATE "C"')).rows
  const hashes = {}, counts = {}
  for (const { relname } of tables) {
    assert(/^[a-z_][a-z0-9_]*$/.test(relname), 'BLOCK: unexpected public identifier')
    const rows = (await client.query('SELECT to_jsonb(t)::text AS data FROM public."' + relname +
      '" t ORDER BY to_jsonb(t)::text COLLATE "C" LIMIT 1001')).rows
    assert(rows.length <= 1000, 'BLOCK: per-table snapshot row cap')
    counts[relname] = rows.length; hashes[relname] = sha256(JSON.stringify(rows))
  }
  return { hashes, counts, sha256: sha256(JSON.stringify(hashes)) }
}

async function sequenceHash(client) {
  const sequences = (await client.query('SELECT c.relname FROM pg_catalog.pg_class c ' +
    'JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace ' +
    'WHERE n.nspname=\'public\' AND c.relkind=\'S\' ORDER BY c.relname COLLATE "C"')).rows
  const states = []
  for (const { relname } of sequences) {
    assert(/^[a-z_][a-z0-9_]*$/.test(relname), 'BLOCK: unexpected sequence identifier')
    states.push([relname, (await client.query('SELECT last_value::text, is_called FROM public."' + relname + '"')).rows[0]])
  }
  return sha256(JSON.stringify(states))
}

function pgDump(options, database) {
  const args = ['-U', 'postgres', '-d', database, '--schema=public', '--format=plain', '--no-large-objects',
    '--no-publications', '--no-subscriptions', '--no-password', '--lock-wait-timeout=2000',
    '--restrict-key=Issue158LocalConsumer']
  if (options.transport === 'ci-loopback') {
    return execFileSync('docker', ['exec', '-u', 'postgres', options.service.containerId, 'pg_dump', ...args],
      { timeout: 180000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
  }
  return execFileSync(path.join(options.cluster.bin, 'pg_dump'), ['-h', options.cluster.socket, ...args],
    { env: options.cluster.env, timeout: 180000, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}

function restoreBeforeImage(options, database, dump) {
  const sql = boundedRestoreScript(dump.toString('utf8'))
  const pgOptions = '-c statement_timeout=10000 -c lock_timeout=2000 -c timezone=UTC -c search_path=public,pg_catalog'
  if (options.transport === 'ci-loopback') {
    return execFileSync('docker', ['exec', '-i', '-u', 'postgres', '-e', 'PGOPTIONS=' + pgOptions,
      options.service.containerId, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-d', database],
    { input: sql, encoding: 'utf8', timeout: 180000, maxBuffer: 32 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'] })
  }
  return runPgInput(options.cluster.bin, 'psql', ['-h', options.cluster.socket, '-U', 'postgres',
    '-d', database, '-X', '-v', 'ON_ERROR_STOP=1'], options.cluster.env, sql)
}

async function makeManifest(runId, database, options, backupPath, sourceRecordPath) {
  const file = async (name) => ({ path: name, sha256: await digestFile(path.join(root, name)) })
  const backup = path.relative(root, backupPath), sourceRecord = path.relative(root, sourceRecordPath)
  const target = options.transport === 'ci-loopback'
    ? 'github-actions-inspected-postgres:' + options.host + ':' + options.port + '/' + database
    : 'issue158-owned-private-unix-cluster/' + database
  return validateManifest({ version: 1, runId, environment: 'disposable', target,
    runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'src/scripts/issue158/replay.mjs',
      envNames: ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'] }, schemaPush: 'disabled' },
    scope: { include: ['restore and verify the v12 semantic PostgreSQL 17 baseline',
      'run reconcileMemoryV2 through the real Payload Local API', 'verify commit, rollback, full row and sequence restore',
      'drop and read back only the uniquely generated disposable database'],
      exclude: ['Production', 'Production credentials', 'migration execution', 'legacy parity', 'physical parity',
        'platform/collation equivalence', 'Gate 1B', 'merge', 'release', 'Issue close'],
      expectedEffects: ['synthetic localized TravelMemoryDay title update and one version row',
        'English title and sentinel unchanged', 'public table rows and sequence states restored',
        'only the generated disposable database dropped'],
      stopConditions: ['baseline drift', 'ownership mismatch', 'runtime mismatch', 'semantic mismatch',
        'warning', 'timeout', 'signal', 'unexpected effect', 'restore failure', 'cleanup UNKNOWN'],
      baseline: 'v12:e231fa48bf6592823d31e20af019eda97d28c3e630666dd745b89a2528f9ea59;semantic-only' },
    artifacts: { executor: await file('src/scripts/issue158/replay.mjs'),
      sql: [await file(schemaPath), await file(queryPath), await file(semanticPath)],
      backup: { path: backup, sha256: await digestFile(backupPath) },
      dependencies: await Promise.all(['package.json', 'pnpm-lock.yaml',
        'scripts/rehearsal/baselines/issue158-v12/baseline.json',
        'scripts/rehearsal/baselines/issue158-v12/runtime-payload-3.90.2.json',
        'pnpm-workspace.yaml', 'patches/@payloadcms__db-postgres@3.90.2.patch', 'src/scripts/issue158/baseline.mjs',
        'src/scripts/issue158/catalog.mjs', 'src/scripts/issue158/restore.mjs', 'src/scripts/issue158/ownership.mjs',
        'src/scripts/run-contract.mjs', 'src/scripts/run-executor-evidence.mjs',
        'src/scripts/travel-memory-v2-reconciliation.ts', 'src/payload/payload.config.ts',
        'src/payload/collections/Users.ts', 'src/payload/collections/TravelMemories.ts',
        'src/payload/collections/TravelMemoryDays.ts', sourceRecord].map(file)) },
    approval: { action: 'local', allowed: ['local'], excluded: ['production-read', 'production-migration',
      'production-content', 'production-media', 'destructive-cleanup', 'merge', 'release', 'issue-close'],
      validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 7200000).toISOString() } })
}

function localApproval(manifest) {
  return { source: 'current user instruction on 2026-10-17 authorizing PR #159 local disposable compatibility rehearsal',
    manifestSha256: manifestHash(manifest), action: manifest.approval.action, environment: manifest.environment,
    target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline,
    stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom,
    validUntil: manifest.approval.validUntil, revoked: false }
}

async function loadPayload(database, role, password, options, setStage) {
  const endpoint = options.transport === 'unix-socket' ? 'localhost' : options.host
  const uri = new URL('postgresql://' + encodeURIComponent(role) + ':' + encodeURIComponent(password) + '@' +
    endpoint + ':' + (options.transport === 'unix-socket' ? 5432 : options.port) + '/' + database)
  if (options.transport === 'unix-socket') uri.searchParams.set('host', options.host)
  uri.searchParams.set('options', '-c statement_timeout=10000 -c lock_timeout=2000 -c timezone=UTC -c search_path=public,pg_catalog')
  process.env.DATABASE_URI = uri.toString()
  process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH = 'false'
  process.env.PAYLOAD_SECRET = 'issue158-synthetic-local-only'
  process.env.NODE_ENV = 'production'
  for (const name of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME',
    'NEXT_PUBLIC_R2_PUBLIC_URL']) delete process.env[name]
  setStage('payload-config-import')
  const config = await import(pathToFileURL(path.join(root, 'src/payload/payload.config.ts')).href +
    '?issue158=' + database)
  setStage('payload-config-resolve')
  const payloadConfig = await config.default
  payloadConfig.email = () => ({ name: 'issue158-no-email', defaultFromName: 'Issue 158 local rehearsal',
    defaultFromAddress: 'issue158@synthetic.invalid',
    sendEmail: async () => { throw Object.assign(new Error('BLOCK: email side effects are disabled'),
      { code: 'ISSUE158_EMAIL_DISABLED' }) } })
  setStage('payload-runtime-import')
  const [{ getPayload, createLocalReq, initTransaction, killTransaction, commitTransaction },
    { reconcileMemoryV2 }] = await Promise.all([import('payload'), import('../travel-memory-v2-reconciliation.ts')])
  setStage('payload-runtime-init')
  const payload = await getPayload({ config: payloadConfig, key: 'issue158-' + database })
  return { payload, createLocalReq, initTransaction,
    killTransaction, commitTransaction, reconcileMemoryV2 }
}

async function prepareConsumer(options, database, runId, runDirectory) {
  let admin, observer, payload, activeReq, sink, manifest, authorization
  let stage = 'semantic-catalog', result = 'BLOCK', commitState = 'NOT_STARTED', restoreState = 'NOT_STARTED'
  let acceptance
  try {
    admin = await pgClient(options, database, options.user, options.password)
    stage = 'semantic-catalog-query'
    const baselineProof = { schemaSha256: (await verifyBaseline(root)).schemaSha256,
      semanticCatalog: await verifySemanticCatalog(admin, root),
      migrationProvenance: 'schema-only empty baseline; migrations not executed' }
    stage = 'migration-state-readback'
    baselineProof.migrationRows = Number((await admin.query(
      'SELECT count(*) AS migration_count FROM public.payload_migrations')).rows[0].migration_count)
    baselineProof.migrationProvenance = 'schema-only empty baseline; migrations not executed'
    assert.equal(baselineProof.migrationRows, 0)
    await save(path.join(runDirectory, 'baseline-proof.json'), baselineProof)
    stage = 'consumer-role-provisioning'
    const role = 'issue158_consumer_' + randomUUID().replaceAll('-', '').slice(0, 12)
    const rolePassword = randomBytes(24).toString('hex')
    assert.match(rolePassword, /^[a-f0-9]{48}$/)
    await admin.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${rolePassword}' NOSUPERUSER NOBYPASSRLS`)
    await admin.query('GRANT CONNECT ON DATABASE "' + database + '" TO "' + role + '"')
    await admin.query('GRANT USAGE ON SCHEMA public TO PUBLIC')
    await admin.query('GRANT USAGE ON SCHEMA public TO "' + role + '"')
    await admin.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "' + role + '"')
    await admin.query('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "' + role + '"')
    const flags = (await admin.query('SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_catalog.pg_class c ' +
      'JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=\'public\' AND c.relname=ANY($1::text[]) ' +
      'ORDER BY c.relname', [mappedTables])).rows
    assert.equal(flags.length, mappedTables.length, 'BLOCK: RLS owner mapping table set drift')
    for (const row of flags) {
      assert.equal(row.relrowsecurity, true, 'BLOCK: RLS flag drift: ' + row.relname)
      assert.equal(row.relforcerowsecurity, false, 'BLOCK: FORCE RLS prevents owner mapping: ' + row.relname)
      await admin.query('ALTER TABLE public."' + row.relname + '" OWNER TO "' + role + '"')
    }
    await admin.end(); admin = null

    stage = 'payload-fixture'
    stage = 'payload-initialize'
    const api = await loadPayload(database, role, rolePassword, options, (next) => { stage = next })
    payload = api.payload
    const roleState = (await payload.db.pool.query('SELECT rolsuper,rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=current_user')).rows[0]
    assert.deepEqual(roleState, { rolsuper: false, rolbypassrls: false })
    stage = 'payload-user-fixture'
    const user = await payload.create({ collection: 'users', overrideAccess: true, locale: 'zh-TW',
      data: { email: runId + '@synthetic.invalid', password: 'Issue158-Synthetic-Only!', role: 'admin',
        slug: 'synthetic-' + runId.slice(-10), displayName: 'Synthetic consumer', familyRole: 'family' } })
    stage = 'payload-memory-fixture'
    const memory = await payload.create({ collection: 'travel-memories', overrideAccess: true, locale: 'zh-TW',
      data: { title: 'Synthetic memory', slug: 'issue158-' + runId.slice(-10), isPrivate: false,
        startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-01-02T00:00:00.000Z', _status: 'published' } })
    const makeDay = (day) => payload.create({ collection: 'travel-memory-days', overrideAccess: true, locale: 'zh-TW',
      data: { memory: memory.id, day, dayKey: 'day-' + String(day).padStart(2, '0'),
        title: day === 1 ? 'Synthetic initial title' : 'Untouched sentinel', _status: 'published' } })
    stage = 'payload-day-fixture'
    const targetDay = await makeDay(1), sentinel = await makeDay(2)
    stage = 'payload-locale-fixture'
    await payload.update({ collection: 'travel-memory-days', id: targetDay.id, overrideAccess: true, locale: 'en',
      data: { title: 'Untouched English title' } })
    const payloadOptions = { collection: 'travel-memory-days', id: targetDay.id, depth: 0, locale: 'zh-TW',
      overrideAccess: false, user }
    stage = 'payload-readback'
    const before = await payload.findByID(payloadOptions)
    const sentinelBefore = await payload.findByID({ ...payloadOptions, id: sentinel.id })
    const plan = api.reconcileMemoryV2({ title: 'Synthetic revised title' }, { title: before.title }, { title: before.title })
    assert.equal(plan.action, 'update'); assert.deepEqual(plan.conflicts, [])
    observer = await pgClient(options, database, options.user, options.password)
    const beforeRows = await tableSnapshot(observer), beforeSequences = await sequenceHash(observer)
    const dump = pgDump(options, database)
    assert(dump.length > 0 && dump.length <= 32 * 1024 * 1024, 'BLOCK: backup byte cap')
    const backupPath = path.join(runDirectory, 'before-image.sql')
    await writeFile(backupPath, dump, { flag: 'wx', mode: 0o600 })
    await save(path.join(runDirectory, 'before-image.json'), { sha256: sha256(dump), bytes: dump.length,
      rowsSha256: beforeRows.sha256, sequenceSha256: beforeSequences, syntheticOnly: true })
    const sourceRecordPath = path.join(runDirectory, 'authorization-source.json')
    await save(sourceRecordPath, { source: 'current user instruction dated 2026-10-17 for PR #159 compatibility',
      authority: 'local Issue 158 implementation and two fresh disposable consumer replays',
      exclusions: ['Production credentials', 'Production connection', 'migration execution', 'merge', 'release', 'Issue close'] })
    manifest = await makeManifest(runId, database, options, backupPath, sourceRecordPath)
    const manifestDigest = manifestHash(manifest)
    await save(path.join(runDirectory, 'manifest.json'), manifest)
    await save(path.join(runDirectory, 'ledger.json'), { version: 1, runId, manifestSha256: manifestDigest, events: [] })
    await verifyManifestFiles(manifest, root)
    authorization = localApproval(manifest)
    sink = fileEvidenceSink(runDirectory, manifest, undefined, { approval: authorization, current: {} })
    await sink.start()
    await sink.checkpoint({ at: new Date().toISOString(), stage: 'baseline-and-consumer-preflight' })

    stage = 'transaction-rollback'
    activeReq = await api.createLocalReq({ user, locale: 'zh-TW' }, payload)
    assert(await api.initTransaction(activeReq))
    await payload.update({ ...payloadOptions, data: plan.data, req: activeReq })
    assert.equal((await payload.findByID({ ...payloadOptions, req: activeReq })).title, 'Synthetic revised title')
    assert.equal((await tableSnapshot(observer)).sha256, beforeRows.sha256, 'BLOCK: uncommitted update escaped')
    await api.killTransaction(activeReq); activeReq = null
    assert.equal((await tableSnapshot(observer)).sha256, beforeRows.sha256, 'BLOCK: rollback changed rows')

    stage = 'transaction-commit'
    activeReq = await api.createLocalReq({ user, locale: 'zh-TW' }, payload)
    assert(await api.initTransaction(activeReq))
    await payload.update({ ...payloadOptions, data: plan.data, req: activeReq })
    commitState = 'SENT_UNKNOWN'
    await api.commitTransaction(activeReq); activeReq = null; commitState = 'COMMITTED'
    assert.equal((await payload.findByID(payloadOptions)).title, 'Synthetic revised title')
    assert.equal((await payload.findByID({ ...payloadOptions, locale: 'en', fallbackLocale: false })).title,
      'Untouched English title')
    assert.deepEqual(await payload.findByID({ ...payloadOptions, id: sentinel.id }), sentinelBefore)
    const afterRows = await tableSnapshot(observer)
    const changedTables = Object.keys(beforeRows.hashes).filter((name) => beforeRows.hashes[name] !== afterRows.hashes[name])
    assert(changedTables.length > 0 && changedTables.every((name) => ['travel_memory_days',
      'travel_memory_days_locales', '_travel_memory_days_v', '_travel_memory_days_v_locales'].includes(name)),
    'BLOCK: consumer changed unexpected tables')
    assert.equal(afterRows.counts._travel_memory_days_v - beforeRows.counts._travel_memory_days_v, 1)
    assert.equal(afterRows.hashes.payload_migrations, beforeRows.hashes.payload_migrations)
    await payload.destroy(); await payload.db.pool.end(); payload = null
    await observer.end(); observer = null

    stage = 'full-before-image-restore'
    const adminRestore = await pgClient(options, 'postgres', options.user, options.password)
    await adminRestore.query('DROP DATABASE "' + database + '"')
    await adminRestore.query('CREATE DATABASE "' + database + '" TEMPLATE template0')
    await adminRestore.end()
    stage = 'full-before-image-restore-sql'
    let restored = await pgClient(options, database, options.user, options.password)
    try {
      await restored.query('DROP SCHEMA public CASCADE')
      await restored.end()
      restored = null
      restoreState = 'SENT_UNKNOWN'
      restoreBeforeImage(options, database, dump)
      restored = await pgClient(options, database, options.user, options.password)
      stage = 'full-restore-session-readback'
      await restored.query('SET statement_timeout=\'10s\'; SET lock_timeout=\'2s\'; SET search_path=public,pg_catalog; SET timezone=UTC')
      const settings = (await restored.query('SELECT current_setting(\'statement_timeout\') AS statement, ' +
        'current_setting(\'lock_timeout\') AS lock, current_setting(\'search_path\') AS search_path')).rows[0]
      assert.deepEqual(settings, { statement: '10s', lock: '2s', search_path: 'public, pg_catalog' })
      stage = 'full-restore-row-readback'
      assert.deepEqual(await tableSnapshot(restored), beforeRows, 'BLOCK: restored table rows mismatch')
      stage = 'full-restore-sequence-readback'
      assert.equal(await sequenceHash(restored), beforeSequences, 'BLOCK: restored sequence state mismatch')
      stage = 'full-restore-rls-readback'
      const restoredFlags = (await restored.query('SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_catalog.pg_class c ' +
        'JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=\'public\' AND c.relname=ANY($1::text[]) ' +
        'ORDER BY relname', [mappedTables])).rows
      assert.equal(restoredFlags.length, mappedTables.length)
      assert(restoredFlags.every((row) => row.relrowsecurity && !row.relforcerowsecurity), 'BLOCK: restored RLS flags drift')
      restoreState = 'RESTORED'
    } finally { if (restored) await restored.end() }
    result = 'PASS'
    acceptance = { result, runId, manifestSha256: manifestDigest,
      baselineProof: JSON.parse(await readFile(path.join(runDirectory, 'baseline-proof.json'), 'utf8')),
      role: { superuser: false, bypassRls: false, mappedTables, sourceRoleParity: false },
      consumer: { reconcileAction: plan.action, changedTables, addedVersionRows: 1,
        localizedValue: 'Synthetic revised title', englishValueUnchanged: true, sentinelUnchanged: true,
        migrationRowsUnchanged: true },
      rollback: { transactionReadback: 'PASS', outsideTransactionUnchanged: true, rowSetsRestored: true },
      restore: { rowSets: 'PASS', sequenceStates: 'PASS', sessionBounds: 'PASS' },
      productionConnections: 0, retry: false }
  } catch (error) {
    result = 'BLOCK'
    acceptance = { result, runId, stage,
      code: failureCode(error),
      sqlState: /^[0-9A-Z]{5}$/.test(error?.code ?? '') ? error.code : null,
      sqlErrorPosition: /^\d+$/.test(error?.position ?? '') ? Number(error.position) : null,
      sqlErrorRoutine: ['scanner_yyerror', 'raw_parser', 'parserOpenTable'].includes(error?.routine)
        ? error.routine : null,
      semanticObservation: error?.issue158Observed ?? null,
      errorMessageSha256: sha256(String(error?.message ?? '')), rawErrorSaved: false,
      commitState, restoreState, productionConnections: 0, retry: false }
  } finally {
    try { if (activeReq && payload) await (await import('payload')).killTransaction(activeReq) } catch { commitState = 'UNKNOWN' }
    try { if (payload) { await payload.destroy(); await payload.db.pool.end() } } catch { result = 'BLOCK' }
    try { if (observer) await observer.end() } catch { result = 'BLOCK' }
    try { if (admin) await admin.end() } catch {}
  }
  return { runId, database, runDirectory, manifest, sink, authorization, result, acceptance, stage,
    cleanup: 'NOT_STARTED' }
}

function currentBindings(manifest) {
  const sqlHash = sha256(manifest.artifacts.sql.map((file) => file.sha256).join('\0'))
  const schema = manifest.artifacts.sql.find((file) => file.path === semanticPath)
  return { manifest: manifestHash(manifest), executor: manifest.artifacts.executor.sha256,
    sql: sqlHash, backup: manifest.artifacts.backup.sha256, schema: schema.sha256 }
}

async function finalizeRun(run, clusterCleanup) {
  if (!run.manifest || !run.sink) {
    await save(path.join(run.runDirectory, 'bootstrap-receipt.json'), { status: 'BLOCK', stage: run.stage,
      code: run.acceptance?.code ?? null, sqlState: run.acceptance?.sqlState ?? null,
      sqlErrorPosition: run.acceptance?.sqlErrorPosition ?? null,
      sqlErrorRoutine: run.acceptance?.sqlErrorRoutine ?? null,
      semanticObservation: run.acceptance?.semanticObservation ?? null,
      errorMessageSha256: run.acceptance?.errorMessageSha256 ?? null,
      cleanup: run.cleanup, productionConnections: 0, retry: false })
    return { ...run, status: 'BLOCK' }
  }
  const cleanup = run.cleanup === 'PASS' && ['PASS', 'OWNED_BY_GITHUB_ACTIONS_JOB'].includes(clusterCleanup.status)
    ? 'PASS' : 'UNKNOWN'
  const status = terminalStatus(run.result, cleanup)
  await save(path.join(run.runDirectory, 'acceptance.json'), { ...run.acceptance, result: status,
    cleanup: { ownedDatabase: run.cleanup, localCluster: clusterCleanup.status,
      clusterOwnerRunId: clusterCleanup.ownerRunId, clusterPathSha256: clusterCleanup.pathSha256,
      databaseAbsentReadback: run.cleanup === 'PASS' } })
  await save(path.join(run.runDirectory, 'owned-cleanup.json'), { ownedDatabase: run.cleanup,
    localCluster: clusterCleanup.status, clusterOwnerRunId: clusterCleanup.ownerRunId,
    clusterPathSha256: clusterCleanup.pathSha256, databaseAbsentReadback: run.cleanup === 'PASS' })
  const evidence = [{ kind: 'rehearsal', status, path: 'acceptance.json',
    sha256: await digestFile(path.join(run.runDirectory, 'acceptance.json')),
    dependsOn: currentBindings(run.manifest) }]
  await save(path.join(run.runDirectory, 'evidence.json'), evidence)
  await verifyEvidenceFiles(evidence, run.runDirectory)
  run.sink.bindStateContext({ approval: run.authorization, evidence, current: currentBindings(run.manifest) })
  await run.sink.receipt({ manifestSha256: manifestHash(run.manifest), status,
    stage: status === 'PASS' ? 'complete' : 'blocked', cleanup,
    productionConnections: 0, automaticRetry: false, approvalSource: run.authorization.source })
  const receipt = JSON.parse(await readFile(path.join(run.runDirectory, 'receipt.json'), 'utf8'))
  const ledger = JSON.parse(await readFile(path.join(run.runDirectory, 'ledger.json'), 'utf8'))
  const current = JSON.parse(await readFile(path.join(run.runDirectory, 'current-state.json'), 'utf8'))
  assert.equal(receipt.manifestSha256, manifestHash(run.manifest))
  assert.equal(ledger.manifestSha256, manifestHash(run.manifest))
  assert.equal(current.status, status)
  assert.equal(current.authorization.recordMatches, true)
  assert.equal(current.evidence[0].valid, status === 'PASS')
  return { ...run, status, cleanup, currentState: current,
    receiptSha256: await digestFile(path.join(run.runDirectory, 'receipt.json')) }
}

async function runGeneration(options, generation) {
  const runId = 'issue158-' + randomUUID(), database = 'issue158_' + randomUUID().replaceAll('-', '').slice(0, 16)
  const evidenceDirectory = path.join(root, '.rehearsal-runs', runId)
  const runDirectory = path.join(evidenceDirectory, 'execution'), ownerPath = path.join(evidenceDirectory, 'resource-owner')
  await mkdir(runDirectory, { recursive: true, mode: 0o700 }); await mkdir(ownerPath, { mode: 0o700 })
  await chmod(evidenceDirectory, 0o700)
  await save(path.join(ownerPath, 'owner.json'), { runId, database, path: ownerPath })
  let created = false, run, cleanup = 'NOT_STARTED', stage = 'owned-database-create'
  try {
    stage = 'owned-database-create'
    await createOwnedDatabase(options, database); created = true
    const target = await pgClient(options, database, options.user, options.password)
    try {
      stage = 'synthetic-role-prerequisites'
      await ensureRoles(target)
      stage = 'baseline-schema-restore'
      await target.query('DROP SCHEMA public CASCADE')
      await target.query(boundedRestoreSql(await readFile(path.join(root, schemaPath), 'utf8')))
      await target.query('GRANT USAGE ON SCHEMA public TO PUBLIC')
      await target.query('SET statement_timeout=\'10s\'; SET lock_timeout=\'2s\'; SET search_path=public,pg_catalog; SET timezone=UTC')
      const settings = (await target.query('SELECT current_setting(\'statement_timeout\') AS statement, ' +
        'current_setting(\'lock_timeout\') AS lock, current_setting(\'search_path\') AS search_path')).rows[0]
      assert.deepEqual(settings, { statement: '10s', lock: '2s', search_path: 'public, pg_catalog' })
      await target.end()
    } catch (error) { await target.end().catch(() => {}); throw error }
    stage = 'semantic-and-consumer'
    run = await prepareConsumer(options, database, runId, runDirectory)
    run.generation = generation
  } catch (error) {
    run = { runId, database, runDirectory, result: 'BLOCK', stage,
      acceptance: { result: 'BLOCK', runId, stage,
        code: failureCode(error),
        errorMessageSha256: sha256(String(error?.message ?? '')), rawErrorSaved: false,
        productionConnections: 0, retry: false } }
  } finally {
    try {
      if (created) await dropOwnedDatabase(options, database, ownerPath, runId)
      else assert.equal(await dbExists(options, database), false)
      cleanup = 'PASS'
    } catch { cleanup = 'UNKNOWN' }
  }
  return { ...run, cleanup, runId, database, runDirectory, evidenceDirectory }
}

async function ciOptions() {
  assert.equal(process.env.ISSUE158_CI_SERVICE, '1', 'BLOCK: CI service marker missing')
  const host = process.env.PGHOST, port = Number(process.env.PGPORT)
  const database = process.env.PGDATABASE, user = process.env.PGUSER
  assert.equal(host, '127.0.0.1'); assert.equal(database, 'postgres'); assert.equal(user, 'postgres')
  const service = inspectCiService(port), password = process.env.PGPASSWORD
  assert.equal(typeof password, 'string', 'BLOCK: synthetic CI password missing')
  const options = { ...validateTarget({ host, port, user, database, ciService: true }),
    host, port, database, user, password, service, transport: 'ci-loopback' }
  const admin = await pgClient(options, database, user, password)
  try {
    const peer = (await admin.query('SELECT inet_server_addr()::text AS server_address, inet_server_port() AS server_port, ' +
      'current_setting(\'server_version\') AS version')).rows[0]
    options.peer = verifyConnectedPeer({ endpointHost: host, endpointPort: port,
      serverAddress: peer.server_address, serverPort: peer.server_port, version: peer.version })
  } finally { await admin.end() }
  assert.deepEqual(inspectCiService(port), service, 'BLOCK: CI service identity drift')
  return options
}

async function localOptions() {
  const cluster = await startOwnedCluster()
  const options = { ...validateTarget({ host: cluster.socket, port: 5432, user: 'postgres', database: 'postgres' }),
    host: cluster.socket, port: 5432, database: 'postgres', user: 'postgres',
    password: undefined, cluster, transport: 'unix-socket' }
  try {
    const admin = await pgClient(options, 'postgres', 'postgres')
    try {
      const peer = (await admin.query('SELECT inet_server_addr()::text AS server_address, inet_server_port() AS server_port, ' +
        'current_setting(\'server_version\') AS version')).rows[0]
      options.peer = verifyConnectedPeer({ endpointHost: cluster.socket, endpointPort: 5432,
        serverAddress: peer.server_address, serverPort: peer.server_port, version: peer.version, socket: true })
      assert.equal((await admin.query('SELECT current_setting(\'listen_addresses\') AS value')).rows[0].value, '')
    } finally { await admin.end() }
    return options
  } catch (error) {
    try { await stopOwnedCluster(cluster) } catch {}
    throw error
  }
}

export async function replay() {
  assert.equal(process.versions.node, '24.21.0', 'BLOCK: Node runtime drift')
  const baseline = await verifyBaseline(root)
  const options = process.env.ISSUE158_CI_SERVICE === '1' ? await ciOptions() : await localOptions()
  const runs = []
  let clusterCleanup = { status: 'OWNED_BY_GITHUB_ACTIONS_JOB', ownerRunId: null, pathSha256: null }
  try {
    for (const generation of [1, 2]) runs.push(await runGeneration(options, generation))
  } finally {
    if (options.cluster) {
      const ownerRunId = options.cluster.owner.runId
      const pathSha256 = sha256(options.cluster.directory)
      try { clusterCleanup = { status: await stopOwnedCluster(options.cluster), ownerRunId, pathSha256 } }
      catch { clusterCleanup = { status: 'UNKNOWN', ownerRunId, pathSha256 } }
    }
  }
  const finalized = []
  for (const run of runs) finalized.push(await finalizeRun(run, clusterCleanup))
  const result = finalized.length === 2 && finalized.every((run) => run.status === 'PASS') ? 'PASS' : 'BLOCK'
  const summary = { result, generations: finalized.map((run) => ({ runId: run.runId,
    databaseRemoved: run.cleanup === 'PASS', status: run.status, evidence: path.relative(root, run.evidenceDirectory),
    receiptSha256: run.receiptSha256 ?? null,
    authorizationRecordMatches: run.currentState?.authorization?.recordMatches ?? false,
    authorizationSourceNeedsHumanReadback: run.currentState?.authorization?.sourceNeedsVerification ?? true,
    evidenceValid: run.currentState?.evidence?.every((item) => item.valid) ?? false })),
    baseline: { runtimeBinding: baseline.runtimeBinding, schemaSha256: baseline.schemaSha256, semanticCatalogSha256: baseline.semanticCatalogSha256,
      categories: baseline.catalogCategories, schemaOnlyMigrationRows: baseline.migrationRows },
    targetPeer: options.peer, clusterCleanup: clusterCleanup.status, clusterOwnerRunId: clusterCleanup.ownerRunId,
    clusterPathSha256: clusterCleanup.pathSha256, productionConnections: 0, retry: false,
    githubActionsResult: options.transport === 'ci-loopback' ? false : null }
  console.log(JSON.stringify(summary))
  return summary
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const summary = await replay()
  if (summary.result !== 'PASS') process.exitCode = 1
}
