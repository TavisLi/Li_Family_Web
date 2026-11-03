import test from 'node:test'
import assert from 'node:assert/strict'
import { orchestrate } from './orchestration.mjs'
const verified = async () => ({ verified: true, digest: 'synthetic' })
const create = () => ({ prepareOwner: verified, provision: verified, baseline: verified, fixture: verified,
  beforeImage: verified, migration: verified, case: verified, restore: verified, cleanup: verified })
const options = () => ({ backend: create(), authorize: async () => true, cases: ['synthetic'], deadline: 100, clock: () => 1 })
test('synthetic sequence reaches restore and cleanup', async () => {
  const r = await orchestrate(options()); assert.equal(r.status, 'PASS'); assert.equal(r.cleanup, 'VERIFIED')
  assert.deepEqual(r.evidence.map(x => x.stage), ['prepare-owner', 'provision', 'baseline', 'fixture', 'before-image', 'migration', 'case:synthetic', 'independent-restore'])
})
test('unverified source cannot provision or clean up', async () => {
  const p = options(); let count = 0; p.authorize = async () => false; p.backend.provision = async () => { count++ }
  const r = await orchestrate(p); assert.equal(r.reason, 'SOURCE_UNVERIFIED'); assert.equal(count, 0); assert.equal(r.cleanup, 'NOT_STARTED')
})
test('read-back failure stops later stages and cleans up', async () => {
  const p = options(); let restored = false; p.backend.migration = async () => ({ verified: false }); p.backend.restore = async () => { restored = true }
  const r = await orchestrate(p); assert.match(r.reason, /READBACK_UNVERIFIED/); assert.equal(r.cleanup, 'VERIFIED'); assert.equal(restored, false)
})
test('abort during work stops future stages but attempts cleanup', async () => {
  const p = options(), c = new AbortController(); p.signal = c.signal; p.backend.fixture = async () => { c.abort(); return { verified: true } }
  const r = await orchestrate(p); assert.equal(r.reason, 'INTERRUPTED'); assert.equal(r.cleanup, 'VERIFIED')
})
test('deadline during work stops future stages and cleanup unknown blocks', async () => {
  const p = options(); let time = 1; p.clock = () => time; p.backend.fixture = async () => { time = 101; return { verified: true } }; p.backend.cleanup = async () => ({ verified: false })
  const r = await orchestrate(p); assert.equal(r.status, 'BLOCK'); assert.equal(r.reason, 'CLEANUP_UNKNOWN')
})
