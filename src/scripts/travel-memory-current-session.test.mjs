import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { readTravelMemoryCurrent } from './travel-memory-current-session.mjs'

const role = 'fixture_reader'
const slug = 'fixture-memory'
const originPlanSlug = 'fixture-origin'
const originPlanId = 12
const id = 41
const header = { id, slug, is_private: true, expected_origin_plan: true, origin_plan_id: originPlanId }
const identity = { effective_role: role, login_role: role, database_name: 'postgres', read_only: 'on',
  isolation: 'repeatable read', statement_timeout: '5s', lock_timeout: '1s', search_path: 'pg_catalog',
  server_encoding: 'UTF8', client_encoding: 'UTF8', rolsuper: false, rolbypassrls: false }
const labels = ['01-begin', '02-statement-timeout', '03-lock-timeout', '04-search-path',
  '05-session', '06-owner', '07-version-owners', '08-memory', '09-days',
  '10-moments', '11-placements', '12-revisions', '13-media', '14-rollback']
const sql = ['BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY', "SET LOCAL statement_timeout = '5s'",
  "SET LOCAL lock_timeout = '1s'", 'SET LOCAL search_path = pg_catalog']
const steps = labels.map((label, index) => ({ label, text: sql[index] ?? (index === 13 ? 'ROLLBACK' : 'SELECT '+index),
  logicalRows: index < 4 || index === 13 ? null : 3, jsonBytes: 4096,
  parameters: index < 7 || index === 13 ? [] : ['validated positive integer Current Memory id from 06', slug] }))
const origin = { label:'07a',text:'SELECT 99',parameters:[originPlanSlug],logicalRows:1,jsonBytes:4096 }
const plan = { slug, originPlanSlug, requiredRole:{session:role,effective:role},steps,origin,
  limits:{sqlDispatches:14, queryCycles:14, responseWireBytes:9437184, jsonPayloadBytes:8388608,
    logicalTopLevelRows:2931, elapsedMs:60000, cleanupReserveMs:5000, statementMs:5000},
  newOwnerBranch:{limits:{sqlDispatches:9,jsonPayloadBytes:143360}} }

async function fixture({owner=false, versions=[], originRows=[{id:originPlanId,slug:originPlanSlug}],
  session=identity, rollbackState='I', missingWireCap=false} = {}) {
  const sent = []
  let connected = false
  const rows = [[session], owner ? [header] : [], versions, [header], [], [], [], [], []]
  class Client extends EventEmitter {
    connection = new EventEmitter()
    async connect() { connected = true }
    async end() {}
    async query({text,values}) {
      sent.push({text,values})
      const position = steps.findIndex(s => s.text === text)
      const data = position === -1 ? originRows : rows[position-4]
      const command = position === 0 ? 'BEGIN' : position === 13 ? 'ROLLBACK' : data ? 'SELECT' : 'SET'
      this.connection.emit('message', { name:'commandComplete',text:command,length:10 })
      this.connection.emit('message', { name:'readyForQuery',status:position === 13 ? rollbackState : 'T',length:5 })
      return { command, rows: data ? [{ payload:JSON.stringify(data),row_count:data.length }] : [] }
    }
  }
  const raw = missingWireCap ? undefined : {cap:plan.limits.responseWireBytes,destroy() {}}
  const client = new Client()
  client.connection.stream = raw
  const receipt = await readTravelMemoryCurrent({ Client, client, raw, plan, authorize() {},
    verifyPeer:() => ({fixture:true}) })
  return {receipt,sent,connected}
}

test('a missing hard wire limit blocks before the reader connects', async () => {
  const {receipt,sent,connected} = await fixture({missingWireCap:true})
  assert.equal(receipt.status,'BLOCK')
  assert.equal(receipt.code,'CURRENT_WIRE_CAP_MISSING')
  assert.equal(connected,false)
  assert.deepEqual(sent,[])
})

test('empty Current proves the exact Plan only and cleans up after nine commands', async () => {
  const {receipt,sent} = await fixture()
  assert.equal(receipt.status,'PASS')
  assert.equal(receipt.rollback,'CONFIRMED')
  assert.equal(receipt.snapshotKind,'ZERO_OWNER_AND_VERSION')
  assert.equal(receipt.mediaCoverage,'NONE')
  assert.equal(receipt.originPlanId,originPlanId)
  assert.equal(sent.length,9)
  assert.deepEqual(sent.at(-2),{text:origin.text,values:[originPlanSlug]})
})

test('existing owner binds the validated ID to each child SELECT', async () => {
  const {receipt,sent} = await fixture({owner:true, versions:[{parent_id:id}]})
  assert.equal(receipt.status,'PASS')
  assert.equal(receipt.mediaCoverage,'PLACEMENT_REFERENCES_ONLY')
  assert.equal(sent.length,14)
  for (const query of sent.slice(7,-1)) assert.deepEqual(query.values,[id,slug])
})

test('version footprint and login drift each stop before origin or children', async () => {
  for (const options of [{versions:[{parent_id:id}]},{session:{...identity,rolbypassrls:true}}]) {
    const {receipt,sent} = await fixture(options)
    assert.equal(receipt.status,'BLOCK')
    assert.equal(receipt.rollback,'CONFIRMED')
    assert.equal(receipt.snapshot,undefined)
    assert.ok(sent.length <= 8)
    assert.equal(sent.at(-1).text,'ROLLBACK')
  }
})

test('incomplete Plan or rollback provides no snapshot', async () => {
  const missing = await fixture({originRows:[]})
  assert.equal(missing.receipt.code,'CURRENT_ORIGIN_PLAN_AMBIGUITY')
  const uncertain = await fixture({rollbackState:'T'})
  assert.equal(uncertain.receipt.status,'UNKNOWN')
  assert.equal(uncertain.receipt.snapshot,undefined)
})
