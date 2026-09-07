import test from 'node:test'
import assert from 'node:assert/strict'
import { runC0Worker } from './phase21-c0-worker-process.mjs'

test('worker finishes normally', async () => {
  const result = await runC0Worker('--eval', ["console.log('synthetic-pass')"], { timeoutMs: 2000 })
  assert.match(result.output, /synthetic-pass/)
})
test('unresponsive worker is killed and reaped', async () => {
  await assert.rejects(runC0Worker('--eval', ['while(true) {}'], { timeoutMs: 100 }), /C0_WORKER_DEADLINE/)
})
test('output flood is bounded and worker failure hides raw error', async () => {
  await assert.rejects(runC0Worker('--eval', ["console.log('x'.repeat(100000))"], { maxBytes: 1000, timeoutMs: 2000 }), /C0_WORKER_OUTPUT_CAP/)
  await assert.rejects(runC0Worker('--eval', ["throw new Error('synthetic-private-message')"], { timeoutMs: 2000 }), /^Error: C0_WORKER_FAILED$/)
})
