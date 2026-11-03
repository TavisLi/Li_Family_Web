import test from 'node:test'
import assert from 'node:assert/strict'
import { startForeground } from './foreground.mjs'
import { EventEmitter } from 'node:events'
const env = { PATH: process.env.PATH }
test('holds a foreground child and verifies its exit separately', async () => {
  const s = startForeground(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env })
  const result = await s.stop({ deadline: Date.now()+3000 })
  assert.equal(result.status, 'PARENT_EXIT_CONFIRMED'); assert.equal(result.serverAbsence, 'UNKNOWN')
  assert.equal(s.state, 'closed')
  assert.equal((await s.stop({ deadline: Date.now()+1000 })).status, 'PARENT_EXIT_CONFIRMED')
})
test('signal refusal yields UNKNOWN without removing resources', async () => {
  const s = startForeground(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env })
  const result = await s.stop({ deadline: Date.now()+1000, sendSignal: () => { throw new Error('denied') } })
  assert.equal(result.reason, 'SIGNAL_FAILED')
  const cleanup = await s.stop({ deadline: Date.now()+3000 })
  assert.equal(cleanup.status, 'PARENT_EXIT_CONFIRMED')
})
test('exit before close never signals a potentially reused numeric PID', async () => {
  const child = Object.assign(new EventEmitter(), { pid: 42000, kill() { throw new Error('must not signal') } })
  const s = startForeground('/fake', [], { spawnProcess: () => child })
  child.emit('exit', 0, null)
  const stopped = s.stop({ deadline: Date.now()+1000 })
  child.emit('close', 0, null)
  assert.equal((await stopped).result.code, 0)
})
test('cleanup deadline returns UNKNOWN without SIGKILL or invented absence', async () => {
  const signals = [], child = Object.assign(new EventEmitter(), { pid: 42000, kill(sig) { signals.push(sig); return true } })
  const s = startForeground('/fake', [], { spawnProcess: () => child })
  const result = await s.stop({ deadline: Date.now()+20 })
  assert.equal(result.reason, 'EXIT_UNCONFIRMED')
  assert.deepEqual(signals, ['SIGINT'])
  assert.equal(s.state, 'running')
  child.emit('exit', 0, null); child.emit('close', 0, null)
})
test('successful child exit survives JSON receipt read-back with exact shape',async()=>{
 const child=Object.assign(new EventEmitter(),{pid:42000,kill(){return true}}),s=startForeground('/fake',[],{spawnProcess:()=>child})
 child.emit('close',0,null)
 const result=await s.stop({deadline:Date.now()+1000})
 assert.deepEqual(JSON.parse(JSON.stringify(result)),result)
})
