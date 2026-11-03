import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { prepare } from './smoke.mjs'
test('prepare hashes artifacts and records no execution authority', async () => {
  const x = await prepare(); assert.equal(x.executionAuthorization, 'ABSENT'); assert.equal(x.platformProcessInspection, 'UNKNOWN')
  assert.match(x.binaries['/bin/ps'].sha256, /^[a-f0-9]{64}$/)
})
test('all execution attempts fail closed before any provision', () => {
  for (const args of [[], ['execute'], ['execute','--approved'], ['invalid']]) {
    const x = spawnSync(process.execPath, ['src/scripts/issue180/smoke.mjs', ...args], { encoding:'utf8', timeout:5000, env:{ PATH:process.env.PATH } })
    assert.equal(x.status,2); assert.match(x.stderr,/BLOCK/)
  }
})

import { proposeManifest, executeSmoke } from './smoke.mjs'
import { manifestHash } from '../run-contract.mjs'
import { randomBytes, createHash } from 'node:crypto'
import { readFile, rm, access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
async function syntheticPacket(t) {
  const preparation = await prepare(), now = Date.now()
  const preparationPath='.rehearsal-runs/issue180-prep-'+randomBytes(16).toString('hex')+'.json'
  await mkdir('.rehearsal-runs',{recursive:true})
  await writeFile(preparationPath,JSON.stringify(preparation,null,2)+'\n',{flag:'wx'})
  t.after(()=>rm(preparationPath))
  const manifest = proposeManifest(preparation, { preparationPath,runId:'issue180-'+randomBytes(16).toString('hex'),validFrom:new Date(now-1000).toISOString(),validUntil:new Date(now+120000).toISOString() })
  const sourceBytes = Buffer.from('SYNTHETIC TEST ONLY — NOT HUMAN EXECUTION APPROVAL')
  const approval = {source:'synthetic-test',manifestSha256:manifestHash(manifest),action:'local',environment:'disposable',target:manifest.target,scope:manifest.scope.include,baseline:manifest.scope.baseline,stopConditions:manifest.scope.stopConditions,validFrom:manifest.approval.validFrom,validUntil:manifest.approval.validUntil,revoked:false}
  const sourceReadback = {manifestSha256:manifestHash(manifest),sourceSha256:createHash('sha256').update(sourceBytes).digest('hex'),operator:'SYNTHETIC-TEST'}
  return {preparation,preparationPath,manifest,approval,sourceBytes,sourceReadback,command:async()=>{throw new Error('UNEXPECTED_COMMAND')},makeOwner:async()=>{throw new Error('UNEXPECTED_PROVISION')},run:async()=>{throw new Error('UNEXPECTED_RUN')}}
}
test('entry refuses unverified source before command or provisioning',async t=>{
  const p=await syntheticPacket(t);p.sourceReadback=null
  await assert.rejects(executeSmoke(p),/SOURCE_READBACK_REQUIRED/)
})
test('entry refuses source changes and preparation drift before provisioning',async t=>{
  const p=await syntheticPacket(t);p.sourceBytes=Buffer.from('changed')
  await assert.rejects(executeSmoke(p),/SOURCE_CHANGED/)
  const x=await syntheticPacket(t);x.preparation.binaries['/bin/ps'].sha256='0'.repeat(64)
  await assert.rejects(executeSmoke(x),/PREPARATION_INPUT_CHANGED|PREPARATION_DRIFT/)
})
test('entry refuses denied same-environment platform probe before owner allocation',async t=>{
  const p=await syntheticPacket(t);let allocated=false
  await assert.rejects(executeSmoke({...p,command:async()=>{throw new Error('PROCESS_ACCESS_DENIED')},run:async()=>{},makeOwner:async()=>{allocated=true}}),/PROCESS_ACCESS_DENIED/)
  assert.equal(allocated,false)
  await assert.rejects(access(path.join('.rehearsal-runs/issue180-smoke',p.manifest.runId)),{code:'ENOENT'})
})
test('entry records provisioning failure through #105 terminal sink without a DB',async t=>{
  const p=await syntheticPacket(t), directory=path.join('.rehearsal-runs/issue180-smoke',p.manifest.runId)
  t.after(()=>rm(directory,{recursive:true,force:true}))
  await assert.rejects(executeSmoke({...p,command:async()=>({stdout:String(process.pid)}),run:async()=>{},makeOwner:async()=>{throw new Error('SYNTHETIC_PROVISION_FAILURE')}}),/SYNTHETIC_PROVISION_FAILURE/)
  const receipt=JSON.parse(await readFile(path.join(directory,'receipt.json')))
  assert.equal(receipt.status,'BLOCK');assert.equal(receipt.failure.message,'SYNTHETIC_PROVISION_FAILURE');assert.equal(receipt.cleanup.status,'UNKNOWN')
  await assert.rejects(executeSmoke({...p,command:async()=>({stdout:String(process.pid)}),run:async()=>{},makeOwner:async()=>{throw new Error('MUST_NOT_REACH')}}),/EEXIST/)
})
test('synthetic entry connects receipt sink to lifecycle seam without claiming real DB evidence',async t=>{
  const p=await syntheticPacket(t),directory=path.join('.rehearsal-runs/issue180-smoke',p.manifest.runId)
  t.after(()=>rm(directory,{recursive:true,force:true}))
  const result=await executeSmoke({...p,command:async()=>({stdout:String(process.pid)}),makeOwner:async()=>({runId:p.manifest.runId,synthetic:true}),run:async({evidenceSink})=>{
    const receipt={manifestSha256:manifestHash(p.manifest),status:'BLOCK',stage:'synthetic-driver',effects:'UNKNOWN',scope:'TEST_ONLY'}
    await evidenceSink.receipt(receipt);return receipt
  }})
  assert.equal(result.status,'BLOCK')
  assert.equal(JSON.parse(await readFile(path.join(directory,'receipt.json'))).scope,'TEST_ONLY')
})
test('preparation binary changes invalidate canonical manifest even without code changes', async()=>{
  const p=await prepare(), options={runId:'issue180-'+randomBytes(16).toString('hex'),validFrom:'2026-11-01T00:00:00.000Z',validUntil:'2026-11-02T00:00:00.000Z'}
  const before=proposeManifest(p,options)
  const changed=structuredClone(p);changed.binaries['/bin/ps'].sha256='f'.repeat(64)
  assert.notEqual(manifestHash(before),manifestHash(proposeManifest(changed,options)))
})
test('different preparation path invalidates canonical manifest', async()=>{
  const p=await prepare(), options={runId:'issue180-'+randomBytes(16).toString('hex'),validFrom:'2026-11-01T00:00:00.000Z',validUntil:'2026-11-02T00:00:00.000Z'}
  assert.notEqual(manifestHash(proposeManifest(p,{...options,preparationPath:'one.json'})),manifestHash(proposeManifest(p,{...options,preparationPath:'two.json'})))
})
test('replacing exact preparation bytes rejects before platform or provision',async t=>{
  const p=await syntheticPacket(t);let calls=0
  await writeFile(p.preparationPath,JSON.stringify(p.preparation,null,4)+'\n')
  await assert.rejects(executeSmoke({...p,command:async()=>{calls++;return {stdout:String(process.pid)}}}),/PREPARATION_BYTES_CHANGED/)
  assert.equal(calls,0)
})
test('using another identical preparation file rejects before platform or provision',async t=>{
  const p=await syntheticPacket(t),other=p.preparationPath+'.other';let calls=0
  await writeFile(other,await readFile(p.preparationPath),{flag:'wx'});t.after(()=>rm(other))
  await assert.rejects(executeSmoke({...p,preparationPath:other,command:async()=>{calls++;return {stdout:String(process.pid)}}}),/PREPARATION_NOT_BOUND/)
  assert.equal(calls,0)
})
test('platform command warning rejects before owner allocation',async t=>{
  const p=await syntheticPacket(t);let allocated=false
  await assert.rejects(executeSmoke({...p,command:async()=>({stdout:String(process.pid),stderr:'WARNING: synthetic inspection warning\n'}),makeOwner:async()=>{allocated=true}}),/WARNING_STOP/)
  assert.equal(allocated,false)
})
test('nonzero platform command retains WARNING and refuses provisioning',async t=>{
  const p=await syntheticPacket(t);let allocated=false
  await assert.rejects(executeSmoke({...p,command:async()=>{throw Object.assign(new Error('INSPECTION_FAILED'),{stdout:'',stderr:'ps: warning: synthetic diagnostic\n'})},makeOwner:async()=>{allocated=true}}),/WARNING_STOP: INSPECTION_FAILED.*synthetic diagnostic/)
  assert.equal(allocated,false)
})
