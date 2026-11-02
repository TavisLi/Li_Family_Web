import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,realpath} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createRequire} from 'node:module'
import {prepareOwnership} from './lifecycle.mjs'
import {buildRehearsalConfig} from './payload-runtime.mjs'
import {accessCases,graphQuery,graphValidation} from './gate-c-access.mjs'
test('GraphQL positive control requests compile against the actual installed schema without a DB',async t=>{
 const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'i180-gql-')));t.after(()=>rm(root,{recursive:true,force:true}))
 const owner=await prepareOwnership(root,'issue180-'+'c'.repeat(32))
 const config=await buildRehearsalConfig({owner,root:process.cwd(),options:{uri:`postgresql://postgres@localhost:5432/${owner.database}?host=${encodeURIComponent(path.join(owner.directory,'socket'))}`}})
 const req=createRequire(await realpath('node_modules/@payloadcms/next/package.json'))
 const {configToSchema}=await import(req.resolve('@payloadcms/graphql'))
 const {parse,validate}=await import('graphql'),{schema}=configToSchema(config)
 const fixture={publicPlanId:1,familyPlanId:2,draftPlanId:3,memoryId:4,dayId:5,familyDayId:6,parentDraftDayId:7,draftDayId:8,familyMemoryId:10,draftMemoryId:11,approvedPlanId:12,otherDayId:13}
 const classify=await graphValidation(config)
 for(const c of accessCases(fixture)) {
  const query=graphQuery({...c,versionId:9})
  const errors=validate(schema,parse(query)).map(e=>e.message)
  assert.deepEqual(classify({...c,versionId:9}),errors)
  if(c.sideChannel || c.locale==='all')assert(errors.every(message=>(c.sideChannel && /^Field .* is not defined by type /.test(message)) || (c.locale==='all' && /^Value "all" does not exist in .* enum/.test(message))),JSON.stringify(errors))
  else assert.deepEqual(errors,[],query)
 }
})
