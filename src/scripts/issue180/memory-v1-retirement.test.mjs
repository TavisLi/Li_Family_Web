import test from 'node:test'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fixtureSources,importProduct} from './payload-runtime.mjs'
const root=process.cwd(),{buildTravelSeedTarget,writeTravelSeedTarget}=await importProduct(root,'scripts/travel-seed-target.ts')
test('retired Memory V1 refuses every mode before store I/O',async()=>{
 const source=fixtureSources().legacyMemorySource,target=buildTravelSeedTarget(source,source)
 for(const mode of ['safe','source-wins','payload-wins']){
  let calls=0;const forbidden=async()=>{calls++;throw Error('UNEXPECTED_STORE_IO')}
  await assert.rejects(writeTravelSeedTarget({mode,target,store:{find:forbidden,create:forbidden,update:forbidden}}),/MEMORY_V1_RETIRED/);assert.equal(calls,0)
 }
})
test('legacy CLI refuses before environment/config/DB initialization',async()=>{
 for(const args of [[],['--travel-only'],['--phase-9'],['--phase-9-read-back']]){
  await assert.rejects(promisify(execFile)(process.execPath,['--import','./src/scripts/fixtures/issue134-offline-guard.mjs','--import','tsx','src/scripts/seed.ts',...args],{cwd:root,env:{PATH:process.env.PATH,HOME:'/private/tmp',PAYLOAD_SECRET:'synthetic-only'},timeout:15000,maxBuffer:65536}),error=>/MEMORY_V1_RETIRED/.test(error.stderr) && !/OFFLINE.*FORBIDDEN/.test(error.stderr))
 }
})
test('explicit Plan scope excludes Memory, Memory media, members and blog content',async()=>{
 const {assertLegacySeedScope,planOnlySeedContent}=await importProduct(root,'scripts/seed-scope.ts')
 assert.doesNotThrow(()=>assertLegacySeedScope(['--travel-only','--plans-only']))
 for(const args of [[],['--plans-only'],['--travel-only','--plans-only','--blog-only']])assert.throws(()=>assertLegacySeedScope(args))
 const scoped=planOnlySeedContent({members:[{}],blogPosts:[{}],blogCategories:[{}],travels:[{slug:'p',status:'planning'},{slug:'m',status:'completed'}],media:[{ownerType:'travel',ownerSlug:'p'},{ownerType:'travel',ownerSlug:'m'},{ownerType:'member',ownerSlug:'p'}]})
 assert.deepEqual(scoped.travels.map(t=>t.slug),['p']);assert.deepEqual(scoped.media,[{ownerType:'travel',ownerSlug:'p'}]);assert.deepEqual([scoped.members,scoped.blogPosts,scoped.blogCategories],[[],[],[]])
})
test('Plan writer remains available',async()=>{
 const source=fixtureSources().legacyPlanSource;let writes=0
 const result=await writeTravelSeedTarget({target:buildTravelSeedTarget(source,source),mode:'safe',store:{find:async()=>({docs:[]}),create:async()=>{writes++;return {id:1}},update:async()=>{throw Error('UNEXPECTED_UPDATE')}}})
 assert.equal(result.action,'create');assert.equal(writes,1)
})
