import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createIssue134PostgresIo } from './issue134-transaction-io.mjs'
import { assertIssue181CatalogPlan, issue181CatalogEffect, issue181CatalogKind, issue181CatalogLimits,
  issue181CatalogScope, readIssue181Catalog, issue181SqlArtifactPath, issue181SqlArtifactSha256 } from './issue181-production-catalog-read.mjs'

const artifactBytes = await readFile('docs/phase-artifacts/issue-181/catalog-select-sql.json')
const queryList = JSON.parse(artifactBytes.toString('utf8'))
const manifest = { environment:'production', approval:{action:'production-read'}, target:'iujasyrvypdcmkmorcud/postgres/public',
  scope:{ expectedEffects:[issue181CatalogEffect], include:[issue181CatalogScope,'agent memory-only DATABASE_URI from the designated repository .env'], exclude:['all writes, migration, rollback, deployment, and cleanup SQL'],
    stopConditions:['drift, warning, cap, timeout, read-back failure, or UNKNOWN; no retry or fallback'] },
  artifacts:{executor:{path:'src/scripts/issue134-production-select-session.mjs'},sql:[{path:issue181SqlArtifactPath,sha256:issue181SqlArtifactSha256}]} }
const plan = {kind:issue181CatalogKind,queries:queryList,limits:issue181CatalogLimits}
const schema = {main:'8eaa11653c3666b370ea9d2c5588b54f64ae838d',migrationPath:'src/migrations/20261031_052622_issue180_optional_geo.ts',
  migrationSha256:'252ceab99cedd36c1c2cd91acb839182df4687918dda17963c3ce03510fec966'}

test('Issue 181 catalog scope admits only the fixed hash-bound queries and exact target', () => {
  assert.equal(assertIssue181CatalogPlan(manifest,plan,schema).queryCount,7)
  assert.throws(()=>assertIssue181CatalogPlan({...manifest,target:'other'},plan,schema),/Expected values to be strictly equal/)
  assert.throws(()=>assertIssue181CatalogPlan(manifest,{...plan,queries:[{id:'arbitrary',sql:'SELECT 1'}]},schema),/allowlist changed/)
  assert.throws(()=>assertIssue181CatalogPlan(manifest,{...plan,limits:{...plan.limits,queryBudget:10}},schema),/Expected values to be strictly deep-equal/)
})

test('Issue 181 reader executes only its exact seven SELECT statements', async () => {
  const calls=[]
  const result=await readIssue181Catalog({query:async sql=>{calls.push(sql);return {rows:sql.startsWith('SELECT')?[{ok:true}]:[]}},guard(){}},manifest,artifactBytes)
  assert.equal(calls.length,7)
  assert(calls.every(sql=>sql.startsWith('SELECT ')))
  assert.equal(result.io.queries,7)
  assert.equal(result.results.length,7)
})

test('Issue 181 reader stops after the first query failure and never retries', async () => {
  const calls=[]
  await assert.rejects(readIssue181Catalog({query:async sql=>{calls.push(sql);if(sql.startsWith('SELECT'))throw Error('synthetic stop');return {rows:[]}},guard(){}},manifest,artifactBytes),/synthetic stop/)
  assert.deepEqual(calls,[plan.queries[0].sql])
})

test('Issue 181 reader fits the shared budget without transaction-control SQL', async () => {
  class FakeClient {
    constructor() {
      this.processID = 181
      this.connection = new EventEmitter()
      this.connection._send = (buffer) => buffer.length
    }
    query(sql) {
      const command = sql.startsWith('BEGIN') ? 'BEGIN' : sql.startsWith('ROLLBACK') ? 'ROLLBACK' : 'SELECT'
      this.connection._send?.(Buffer.from(`Q${sql}`))
      this.connection.emit('message', { name:'commandComplete', text:command, length:4+command.length })
      this.connection.emit('message', { name:'readyForQuery', length:5 })
      return Promise.resolve({ rows:[] })
    }
  }
  const counters = { queries:0, roundTrips:0, responseBytes:0, requestBytes:0 }
  const io = createIssue134PostgresIo({ Client:FakeClient, counters, limits:issue181CatalogLimits,
    recoveryReserve:{queries:0,roundTrips:0}, getStage:()=> 'issue181-catalog', guard:()=>{} })
  try {
    const client = new FakeClient()
    const result = await readIssue181Catalog({ query:(sql)=>client.query(sql), guard:()=>{} }, manifest, artifactBytes)
    assert.equal(result.io.queries,7)
    assert.equal(counters.queries,7)
    assert.equal(io.snapshot().transactionControls.begin.attempted,0)
    assert.equal(io.snapshot().transactionControls.rollback.attempted,0)
  } finally { io.restore() }
})

test('Issue 181 reader enforces the aggregate row cap without issuing non-SELECT SQL', async () => {
  let selects=0
  await assert.rejects(readIssue181Catalog({query:async sql=>{
    assert(sql.startsWith('SELECT '))
    if(sql==='BEGIN'||sql==='ROLLBACK')throw Error('unexpected transaction control')
    selects++
    return {rows:Array.from({length:100},()=>({id:selects}))}
  },guard(){}},manifest,artifactBytes),/total row cap/)
  assert.equal(selects,3)
})

test('rejects changed SQL artifact or manifest binding before any query', async () => {
  let calls = 0
  const transport = { query: async () => { calls++; return { rows: [] } }, guard() {} }
  const changed = Buffer.from(artifactBytes.toString().replace('SELECT name', 'SELECT  name'))
  await assert.rejects(readIssue181Catalog(transport, manifest, changed), /SQL artifact bytes changed/)
  const unbound = { ...manifest, artifacts: { ...manifest.artifacts, sql: [] } }
  await assert.rejects(readIssue181Catalog(transport, unbound, artifactBytes), /one SQL artifact required/)
  assert.equal(calls, 0)
})
