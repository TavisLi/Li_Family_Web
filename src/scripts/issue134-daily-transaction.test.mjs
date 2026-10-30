import assert from 'node:assert/strict'
import {test} from 'node:test'
import {bindDailyTransaction} from './issue134-daily-transaction.mjs'

function fixture({silentRollback=false,previousTransactions=0}={}) {
  const controls={begin:{attempted:1,confirmed:1},commit:{attempted:0,confirmed:0},rollback:{attempted:0,confirmed:0}}
  for(const kind of ['begin','commit','rollback']){controls[kind].attempted+=previousTransactions;controls[kind].confirmed+=previousTransactions}
  const calls=[],client={processID:77,end:async()=>calls.push('end'),release:()=>calls.push('release')}
  let state='T'
  const req={transactionID:'tx',user:null}
  const adapter={name:'postgres',sessions:{tx:{db:{session:{client}}}},pool:{connect:()=>calls.push('connect')},
    find:async args=>{calls.push(args);assert.equal(args.req,req);return {docs:[]}},deleteMany:async args=>{assert.equal(args.req,req);calls.push('deleteMany')},
    commitTransaction:async()=>{controls.commit.attempted++;controls.commit.confirmed++;state='I';delete adapter.sessions.tx},
    rollbackTransaction:async()=>{if(!silentRollback){controls.rollback.attempted++;controls.rollback.confirmed++;state='I'}delete adapter.sessions.tx}}
  const payload={db:adapter,collections:{'payload-locked-documents':{},'travel-memory-days':{config:{}}},config:{}}
  req.payload=payload
  const transactionIo={snapshotFor:()=>({transactionControls:structuredClone(controls)}),clientState:()=>({status:state,pending:0})}
  const bound=bindDailyTransaction({payload,req,observation:{transactionId:'tx',client,backendPid:77},transactionIo})
  return {bound,adapter,req,calls,controls,client,setWireStatus:status=>{state=status}}
}

test('installed Payload document-lock read and delete use the held request',async()=>{
  const f=fixture(),{checkDocumentLockStatus}=await import(new URL('./utilities/checkDocumentLockStatus.js',import.meta.resolve('payload')))
  await checkDocumentLockStatus({id:24,collectionSlug:'travel-memory-days',overrideLock:false,req:f.req})
  assert.equal(f.bound.summary().lockReadsBound,1)
  assert(!f.calls.includes('connect'))
  await f.adapter.rollbackTransaction('tx');f.bound.allowReadback('rollback');await f.bound.dispose()
})
test('pool acquisition and foreign client are rejected while the transaction is held',async()=>{
  const f=fixture()
  assert.throws(()=>f.adapter.pool.connect(),{code:'ISSUE134_DAILY_UNBOUND_POOL_ACQUISITION'})
  assert.throws(()=>f.bound.beforeQuery({},'SELECT 1'),{code:'ISSUE134_DAILY_TRANSACTION_CLIENT_DRIFT'})
  await f.adapter.rollbackTransaction('tx');f.bound.allowReadback('rollback')
  f.adapter.pool.connect();assert(f.calls.includes('connect'));await f.bound.dispose()
})
test('lost session cannot fall back to default pool',async()=>{
  const f=fixture();delete f.adapter.sessions.tx
  await assert.rejects(f.bound.assertRequest(f.req),{code:'ISSUE134_DAILY_TRANSACTION_CONTEXT_LOST'})
  await assert.rejects(f.adapter.rollbackTransaction('tx'),{code:'ISSUE134_DAILY_TRANSACTION_END_UNKNOWN'})
  assert.equal(f.controls.rollback.attempted,0);await f.bound.dispose()
})
test('silent rollback API resolution is UNKNOWN; no second command or read-back',async()=>{
  const f=fixture({silentRollback:true})
  await assert.rejects(f.adapter.rollbackTransaction('tx'),{code:'ISSUE134_DAILY_ROLLBACK_UNCONFIRMED'})
  assert.throws(()=>f.bound.allowReadback('rollback'))
  await assert.rejects(f.adapter.rollbackTransaction('tx'),{code:'ISSUE134_DAILY_TRANSACTION_END_UNKNOWN'})
  assert.equal(f.controls.rollback.attempted,0);await f.bound.dispose()
  assert.deepEqual(f.calls,['release','end'])
})
test('sent but unconfirmed COMMIT forbids Drizzle automatic ROLLBACK and resend',async()=>{
  const f=fixture();f.controls.commit.attempted=1
  for(const sql of ['ROLLBACK','COMMIT'])assert.throws(()=>f.bound.beforeQuery(f.client,sql),{code:'ISSUE134_DAILY_TRANSACTION_CONTROL_ALREADY_SENT'})
  await assert.rejects(f.adapter.rollbackTransaction('tx'),{code:'ISSUE134_DAILY_TRANSACTION_END_UNKNOWN'})
  assert.equal(f.controls.rollback.attempted,0);await f.bound.dispose()
})
test('confirmed end is not resent, and independent read-back requires idle wire evidence',async()=>{
  const f=fixture();await f.adapter.commitTransaction('tx');await f.adapter.commitTransaction('tx')
  assert.equal(f.controls.commit.attempted,1);f.bound.allowReadback('commit')
  assert.equal(f.bound.summary().commitConfirmed,true);await f.bound.dispose()
  assert(!f.calls.includes('end'))
})
test('reused pool client uses this transaction baseline rather than prior control totals',async()=>{
  const f=fixture({previousTransactions:3})
  assert.equal(f.bound.summary().rollbackConfirmed,false)
  f.bound.beforeQuery(f.client,'ROLLBACK');await f.adapter.rollbackTransaction('tx')
  assert.equal(f.bound.summary().rollbackConfirmed,true)
  assert.equal(f.bound.summary().transactionControlBaseline.rollback.attempted,3)
  assert.equal(f.bound.summary().transactionControls.rollback.attempted,4)
  f.bound.allowReadback('rollback');await f.bound.dispose()
})
test('later read-back connection loss does not erase a confirmed COMMIT',async()=>{
  const f=fixture();await f.adapter.commitTransaction('tx');f.bound.allowReadback('commit')
  f.setWireStatus('UNKNOWN');assert.equal(f.bound.summary().commitConfirmed,true)
  await f.bound.dispose();assert(!f.calls.includes('end'))
})
