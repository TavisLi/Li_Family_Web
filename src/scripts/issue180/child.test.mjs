import test from 'node:test'
import assert from 'node:assert/strict'
import { runChild } from './child.mjs'
const env = { PATH: process.env.PATH }
test('normal child completes', async () => {
  const result = await runChild(process.execPath, ['-e', 'process.stdout.write("ok")'], { env, deadline: Date.now()+3000 })
  assert.equal(result.stdout, 'ok')
})
test('deadline kills a child ignoring SIGTERM and awaits close', async () => {
  const started = Date.now()
  await assert.rejects(runChild(process.execPath, ['-e', 'process.on("SIGTERM",()=>{});setInterval(()=>{},1000)'], { env, deadline: Date.now()+200, killGraceMs: 80 }), /DEADLINE/)
  assert(Date.now()-started >= 200)
})
test('abort kills in-flight child and awaits close', async () => {
  const c = new AbortController(); const timer = setTimeout(() => c.abort(), 150)
  try { await assert.rejects(runChild(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env, deadline: Date.now()+3000, signal: c.signal }), /INTERRUPTED/) } finally { clearTimeout(timer) }
})
test('pre-aborted operation refuses start', async () => {
  await assert.rejects(runChild('/not/a/real/program', [], { env, deadline: Date.now()+1000, signal: AbortSignal.abort() }), /INTERRUPTED/)
})
test('command stdout and stderr stay separate for warning detection',async()=>{
  const result=await runChild(process.execPath,['-e','process.stdout.write("1\\n");process.stderr.write("NOTICE: routine\\n")'],{env,deadline:Date.now()+3000})
  assert.equal(result.stdout,'1\n');assert.equal(result.stderr,'NOTICE: routine\n')
})
