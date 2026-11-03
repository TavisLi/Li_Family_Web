import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { manifestHash } from './run-contract.mjs'
import { issue181ExecutableClosure } from './issue181-source-admission.mjs'
import { pathToFileURL } from 'node:url'
const executeIssue181Session = (options) => options.session.executeIssue181Session(options)
import { issue181CatalogEffect, issue181CatalogLimits, issue181CatalogScope, issue181SqlArtifactPath } from './issue181-production-catalog-read.mjs'

const hash = (value) => createHash('sha256').update(value).digest('hex')
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'issue181-session-'))
  const runDirectory = path.join(root, 'run')
  const migration = 'src/migrations/20261031_052622_issue180_optional_geo.ts'
  const files = { 'package.json': Buffer.from(JSON.stringify({ packageManager: 'pnpm@10.28.0' })),
    'pnpm-lock.yaml': Buffer.from('fake lock'),
    'inputs/limits.json': Buffer.from(JSON.stringify(issue181CatalogLimits)),
    [issue181SqlArtifactPath]: await readFile(issue181SqlArtifactPath), [migration]: await readFile(migration) }
  for (const name of issue181ExecutableClosure) files[name] = await readFile(name)
  const support = await readFile('src/scripts/issue181-production-select-session.test-support.mjs', 'utf8')
  files['src/scripts/issue181-production-select-session.test-support.mjs'] = Buffer.from(`${support}\nexport { executeIssue181Session }\n`)
  for (const [name, bytes] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true })
    await writeFile(path.join(root, name), bytes)
  }
  await mkdir(runDirectory)
  const artifact = (name) => ({ path: name, sha256: hash(files[name]) })
  const manifest = { version: 1, runId: 'fake-session', environment: 'production', target: 'iujasyrvypdcmkmorcud/postgres/public',
    runtime: { node: process.versions.node, pnpm: '10.28.0', bootstrap: { entrypoint: 'test', envNames: [] }, schemaPush: 'disabled' },
    scope: { include: [issue181CatalogScope, 'agent memory-only DATABASE_URI from the designated repository .env'],
      exclude: ['all writes, migration, rollback, deployment, and cleanup SQL'], expectedEffects: [issue181CatalogEffect],
      stopConditions: ['drift, warning, cap, timeout, read-back failure, or UNKNOWN; no retry or fallback'], baseline: 'synthetic' },
    artifacts: { executor: artifact(issue181ExecutableClosure[0]), sql: [artifact(issue181SqlArtifactPath)], backup: null,
      dependencies: [artifact('package.json'), artifact('pnpm-lock.yaml'), artifact('inputs/limits.json'), artifact(migration), ...issue181ExecutableClosure.slice(1).map(artifact)] },
    approval: { action: 'production-read', allowed: ['production-read'], excluded: ['merge'],
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2027-01-01T00:00:00Z' } }
  const approval = { source: 'fake', manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline,
    stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  const decision = { source: approval.source, manifestSha256: approval.manifestSha256, action: approval.action,
    environment: manifest.environment, target: manifest.target, include: manifest.scope.include, exclude: manifest.scope.exclude,
    baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions, validFrom: approval.validFrom, validUntil: approval.validUntil, revoked: false }
  await writeFile(path.join(runDirectory, 'ledger.json'), JSON.stringify({ version: 1, runId: manifest.runId, manifestSha256: manifestHash(manifest), events: [] }))
  const session = await import(pathToFileURL(path.join(root, 'src/scripts/issue181-production-select-session.test-support.mjs')).href)
  return { root, runDirectory, manifest, approval, session, confirmApprovalSource: async () => decision, now: new Date('2026-06-01T00:00:00Z') }
}
function fakeClient({ fail = false, oversized = false, tick } = {}) {
  const calls = []
  class Fake extends EventEmitter {
    constructor(options) { super(); this.processID = 181; this.connectionParameters = options; this.connection = new EventEmitter(); this.connection._send = (b) => b.length }
    getStartupConf() { return { statement_timeout: String(this.connectionParameters.statement_timeout), lock_timeout: String(this.connectionParameters.lock_timeout) } }
    async connect() {}
    async end() {}
    query(config) {
      assert.equal(config.query_timeout, issue181CatalogLimits.statementTimeoutMs)
      const sql = config.text
      calls.push(sql); tick?.()
      this.connection._send(Buffer.from(sql))
      if (fail) return Promise.reject(new Error('synthetic failure'))
      this.connection.emit('message', { name: 'commandComplete', text: 'SELECT', length: oversized ? 140000 : 10 })
      this.connection.emit('message', { name: 'readyForQuery', length: 5 })
      return Promise.resolve({ rows: [] })
    }
  }
  return { Client: Fake, calls }
}
test('seven SELECT queries produce terminal receipt and ledger; retry blocked', async () => {
  const f = await fixture(), fake = fakeClient()
  const { receipt } = await executeIssue181Session({ ...f, Client: fake.Client })
  assert.equal(receipt.status, 'PASS'); assert.equal(receipt.manifestSha256, manifestHash(f.manifest)); assert.equal(fake.calls.length, 7)
  assert(fake.calls.every((sql) => sql.startsWith('SELECT ')))
  assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'PASS')
  assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'receipt.json'))).automaticRetry, false)
  await assert.rejects(executeIssue181Session({ ...f, Client: fake.Client }))
})
test('first query failure and I/O cap stop immediately', async () => {
  for (const options of [{ fail: true }, { oversized: true }]) {
    const f = await fixture(), fake = fakeClient(options)
    const { receipt } = await executeIssue181Session({ ...f, Client: fake.Client })
    assert.equal(receipt.status, 'BLOCK'); assert.equal(fake.calls.length, 1)
    assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'BLOCK')
  }
})
test('deadline after first query is UNKNOWN without retry', async () => {
  const f = await fixture(); let time = 0
  const fake = fakeClient({ tick: () => { time = 30001 } })
  const { receipt } = await executeIssue181Session({ ...f, Client: fake.Client, clock: () => time })
  assert.equal(receipt.status, 'UNKNOWN'); assert.equal(fake.calls.length, 1)
  assert.match(receipt.failure.message, /deadline/); assert.equal(receipt.transportTermination, 'DESTROY_UNAVAILABLE')
})

test('source mismatch and SQL drift reject before creating a connection', async () => {
  for (const mode of ['source', 'sql']) {
    const f = await fixture()
    let clients = 0
    class NeverConnect { constructor() { clients++ } query() {} }
    if (mode === 'source') f.confirmApprovalSource = async () => null
    else await writeFile(path.join(f.root, issue181SqlArtifactPath), 'tampered')
    const { receipt } = await executeIssue181Session({ ...f, Client: NeverConnect })
    assert.equal(receipt.status, 'BLOCK')
    assert.equal(clients, 0)
    assert.equal(receipt.queries, 0)
    assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'BLOCK')
  }
})

test('startup timeout mismatch stops before connect', async () => {
  const f = await fixture(); let connects = 0
  class BadClient extends EventEmitter {
    constructor(options) { super(); this.connectionParameters = options; this.connection = new EventEmitter() }
    getStartupConf() { return { statement_timeout: '15000', lock_timeout: '0' } }
    async connect() { connects++ }
    async end() {}
    query() {}
  }
  const { receipt } = await executeIssue181Session({ ...f, Client: BadClient })
  assert.equal(receipt.status, 'BLOCK'); assert.equal(connects, 0)
  assert.match(receipt.failure.message, /lock timeout startup bytes/)
})

test('timeout during pending connect records UNKNOWN and late connect cannot send SQL', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = await fixture(); let release, notify, destroyed = 0, queries = 0
  const connecting = new Promise((resolve) => { notify = resolve })
  class SlowClient extends EventEmitter {
    constructor(options) {
      super(); this.connectionParameters = options; this.connection = new EventEmitter()
      this.connection.stream = { destroy() { destroyed++ } }
    }
    getStartupConf() { return { statement_timeout: '15000', lock_timeout: '2000' } }
    connect() { notify(); return new Promise((resolve) => { release = resolve }) }
    query() { queries++; return Promise.resolve({ rows: [] }) }
  }
  const pending = executeIssue181Session({ ...f, Client: SlowClient })
  await connecting
  t.mock.timers.tick(30000)
  const { receipt } = await pending
  assert.equal(receipt.status, 'UNKNOWN'); assert.match(receipt.failure.message, /timeout/)
  assert.equal(receipt.transportTermination, 'DESTROY_REQUESTED_UNCONFIRMED'); assert.equal(destroyed, 1)
  release(); await new Promise((resolve) => setImmediate(resolve))
  assert.equal(queries, 0)
  assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'UNKNOWN')
})

test('timeout during pending query prevents a second query even after late completion', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const f = await fixture(); let release, notify, destroyed = 0, queries = 0
  const started = new Promise((resolve) => { notify = resolve })
  class SlowQueryClient extends EventEmitter {
    constructor(options) {
      super(); this.processID = 181; this.connectionParameters = options; this.connection = new EventEmitter()
      this.connection._send = (b) => b.length
      this.connection.stream = { destroy() { destroyed++ } }
    }
    getStartupConf() { return { statement_timeout: '15000', lock_timeout: '2000' } }
    async connect() {}
    query() { queries++; notify(); return new Promise((resolve) => { release = resolve }) }
  }
  const pending = executeIssue181Session({ ...f, Client: SlowQueryClient })
  await started
  t.mock.timers.tick(30000)
  const { receipt } = await pending
  assert.equal(receipt.status, 'UNKNOWN'); assert.equal(receipt.queries, 1); assert.equal(destroyed, 1)
  assert.match(receipt.failure.message, /timeout/)
  release({ rows: [] }); await new Promise((resolve) => setImmediate(resolve))
  assert.equal(queries, 1)
})

test('executable closure rejects missing, replacement, drift, and extra code before source or transport', async () => {
  for (const mode of ['missing', 'replacement', 'drift', 'extra']) {
    const f = await fixture(); let clients = 0, sources = 0
    class NeverConnect { constructor() { clients++ } query() {} }
    f.confirmApprovalSource = async () => { sources++; return null }
    if (mode === 'missing') f.manifest.artifacts.dependencies = f.manifest.artifacts.dependencies.filter(
      (item) => item.path !== 'src/scripts/issue134-additive-history.mjs')
    if (mode === 'replacement' || mode === 'extra') {
      const bytes = Buffer.from('export const injected = true\n')
      await writeFile(path.join(f.root, 'alternate.mjs'), bytes)
      const item = { path: 'alternate.mjs', sha256: hash(bytes) }
      if (mode === 'replacement') f.manifest.artifacts.executor = item
      else f.manifest.artifacts.dependencies.push(item)
    }
    if (mode === 'drift') await writeFile(path.join(f.root, 'src/scripts/issue134-additive-history.mjs'), 'drift')
    await writeFile(path.join(f.runDirectory, 'ledger.json'), JSON.stringify({ version: 1, runId: f.manifest.runId,
      manifestSha256: manifestHash(f.manifest), events: [] }))
    const { receipt } = await executeIssue181Session({ ...f, Client: NeverConnect })
    assert.equal(receipt.status, 'BLOCK', mode)
    assert.equal(clients, 0, mode); assert.equal(sources, 0, mode); assert.equal(receipt.queries, 0, mode)
    assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'BLOCK')
  }
})

test('executable drift during source readback blocks before transport', async () => {
  const f = await fixture(); let clients = 0
  class NeverConnect { constructor() { clients++ } query() {} }
  const source = f.confirmApprovalSource
  f.confirmApprovalSource = async (...args) => {
    const decision = await source(...args)
    await writeFile(path.join(f.root, 'src/scripts/issue134-additive-history.mjs'), 'changed during readback')
    return decision
  }
  const { receipt } = await executeIssue181Session({ ...f, Client: NeverConnect })
  assert.equal(receipt.status, 'BLOCK'); assert.equal(clients, 0); assert.equal(receipt.queries, 0)
  assert.match(receipt.failure.message, /artifact bytes changed/)
})

test('different manifest root is rejected before client creation', async () => {
  const first = await fixture(), second = await fixture(); let clients = 0
  class NeverConnect { constructor() { clients++ } query() {} }
  const { receipt } = await executeIssue181Session({ ...first, root: second.root, Client: NeverConnect })
  assert.equal(receipt.status, 'BLOCK'); assert.equal(clients, 0)
  assert.match(receipt.failure.message, /executable root mismatch/)
})

test('fresh Node child loads the manifest-bound root using a fake provider and transport', async () => {
  const { spawnSync } = await import('node:child_process')
  const f = await fixture()
  const childInput = { manifest: f.manifest, approval: f.approval, root: f.root, runDirectory: f.runDirectory }
  const script = `
    import { EventEmitter } from 'node:events';
    import { executeIssue181Session } from './src/scripts/issue181-production-select-session.test-support.mjs';
    const f = JSON.parse(process.env.FAKE_INPUT); const m = f.manifest, a = f.approval;
    const source = { source:a.source, manifestSha256:a.manifestSha256, action:a.action, environment:m.environment,
      target:m.target, include:m.scope.include, exclude:m.scope.exclude, baseline:m.scope.baseline,
      stopConditions:m.scope.stopConditions, validFrom:a.validFrom, validUntil:a.validUntil, revoked:false };
    class Fake extends EventEmitter {
      constructor(options) { super(); this.connectionParameters=options; this.processID=181;
        this.connection=new EventEmitter(); this.connection._send=(b)=>b.length }
      getStartupConf() { return {statement_timeout:'15000',lock_timeout:'2000'} }
      async connect() {} async end() {}
      query(config) { this.connection._send(Buffer.from(config.text));
        this.connection.emit('message',{name:'commandComplete',text:'SELECT',length:10});
        this.connection.emit('message',{name:'readyForQuery',length:5}); return Promise.resolve({rows:[]}) }
    }
    const {receipt}=await executeIssue181Session({...f,Client:Fake,confirmApprovalSource:async()=>source,
      now:new Date('2026-06-01T00:00:00Z')}); console.log(JSON.stringify(receipt));
  `
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script],
    { cwd: f.root, env: { FAKE_INPUT: JSON.stringify(childInput) }, encoding: 'utf8', timeout: 10000 })
  assert.equal(child.status, 0, child.stderr)
  const receipt = JSON.parse(child.stdout)
  assert.equal(receipt.status, 'PASS'); assert.equal(receipt.queries, 7)
  assert.notEqual(receipt.sessionId, `${f.manifest.runId}:${process.pid}`)
  assert.equal(JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json'))).events.at(-1).status, 'PASS')
})

test('formal session rejects caller-supplied provider, transport and clock without invoking them', async () => {
  const formal = await import('./issue181-production-select-session.mjs')
  let providers = 0, clients = 0, clocks = 0
  class Fake { constructor() { clients++ } }
  await assert.rejects(formal.executeIssue181Session({ confirmApprovalSource: async () => { providers++ },
    Client: Fake, now: () => { clocks++ } }), /trusted production host capability is not configured/)
  assert.equal(providers, 0); assert.equal(clients, 0); assert.equal(clocks, 0)
})

test('formal CLI rejects an approval flag without reading a packet', async () => {
  const { spawnSync } = await import('node:child_process')
  const child = spawnSync(process.execPath, ['src/scripts/run-local-session.mjs', '/nonexistent', '--human-source-verified'],
    { cwd: process.cwd(), env: {}, encoding: 'utf8' })
  assert.notEqual(child.status, 0)
  assert.match(child.stderr, /Usage/)
})

test('repository test-support module exposes no injectable session', async () => {
  const support = await import('./issue181-production-select-session.test-support.mjs')
  assert.equal('executeIssue181Session' in support, false)
})

test('formal CLI blocks valid synthetic production manifest when trusted provider is unavailable', async () => {
  const { spawnSync } = await import('node:child_process')
  const f = await fixture()
  await writeFile(path.join(f.runDirectory, 'manifest.json'), JSON.stringify(f.manifest))
  await writeFile(path.join(f.runDirectory, 'approval.json'), JSON.stringify(f.approval))
  const child = spawnSync(process.execPath, ['src/scripts/run-local-session.mjs', f.runDirectory],
    { cwd: f.root, env: {}, encoding: 'utf8', timeout: 10000 })
  assert.notEqual(child.status, 0)
  const receipt = JSON.parse(await readFile(path.join(f.runDirectory, 'supervisor-receipt.json')))
  assert.equal(receipt.status, 'BLOCK'); assert.equal(receipt.automaticRetry, false)
  assert.equal(receipt.commitState, 'NOT_STARTED')
  const ledger = JSON.parse(await readFile(path.join(f.runDirectory, 'ledger.json')))
  assert.equal(ledger.events.at(-1).status, 'BLOCK')
})
