import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {migrationUp,runGateC} from './gate-c-runner.mjs'
import {inspectMigrationBaseline} from './migration-prerequisites.mjs'
test('actual candidate up compiles and is called between baseline and independent observer',async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-group-a-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const pre=inspectMigrationBaseline(await readFile('scripts/rehearsal/baselines/issue158-v12/schema.sql','utf8'),await readFile('src/migrations/20261031_052622_issue180_optional_geo.ts','utf8'))
 let migrated=false,loaded=false;const stages=[]
 const lifecycle={loadSQLFile:async file=>{assert(file.endsWith('schema.sql'));loaded=true},query:async sql=>{
  if(sql.startsWith('CREATE ROLE'))return {stdout:''}
  assert(loaded)
  if(sql.startsWith('BEGIN;')){assert(sql.includes('CREATE TABLE "geo_stops"'));assert(sql.includes('INSERT INTO public.payload_migrations'));migrated=true;return {stdout:''}}
  let value=[]
  if(sql.includes('FROM public.payload_migrations t'))value=migrated?[{id:1,name:'20261031_052622_issue180_optional_geo',batch:1}]:[]
  else if(sql.includes('FROM pg_tables'))value=['payload_migrations']
  else if(sql.includes('information_schema.columns'))value=pre.added.map(x=>({table_name:x.table,column_name:x.column,is_nullable:'YES'}))
  else if(sql.includes('information_schema.table_privileges'))value=[]
  else if(sql.includes('FROM pg_class'))value=pre.created.map(relname=>({relname,relrowsecurity:true}))
  else if(sql.startsWith('SELECT count'))value=0
  else value=migrated?[{name:'20261031_052622_issue180_optional_geo'}]:[]
  return {stdout:JSON.stringify(value)}
 }}
 await migrationUp({lifecycle,root:process.cwd(),directory,options:{},checkpoint:async x=>stages.push(x)})
 assert(migrated);assert.deepEqual(stages,['baseline','candidate-up','independent-observer'])
 assert.equal(JSON.parse(await readFile(path.join(directory,'migration-up.json'))).status,'PASS')
})
test('runner rejects empty, duplicate and unknown cases before lifecycle',async()=>{
 for(const cases of [[],['migration-up','migration-up'],['unknown']])await assert.rejects(runGateC({cases}),/CASES_NOT_IMPLEMENTED/)
})
for(const refusal of ['expected','wrong','mutated'])test('full A actual up/down with nonempty synthetic rows: '+refusal,async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'i180-group-a-full-'));t.after(()=>rm(directory,{recursive:true,force:true}))
 const schema=await readFile('scripts/rehearsal/baselines/issue158-v12/schema.sql','utf8'),migration=await readFile('src/migrations/20261031_052622_issue180_optional_geo.ts','utf8')
 const pre=inspectMigrationBaseline(schema,migration),expected=JSON.parse(await readFile('src/migrations/20261031_052622_issue180_optional_geo.json'))
 let migrated=false,populated=false,loaded=0,upCalls=0,downCalls=0,metaId=0
 const baseCatalog={columns:[],indexes:[],fk:[],enums:[]}
 const upCatalog={columns:[],indexes:[],fk:[],enums:[{typname:'travel_geo_audience',enumlabel:'family'},{typname:'travel_geo_audience',enumlabel:'public'}]}
 for(const {table,column} of [...pre.added,...pre.created.flatMap(table=>Object.keys(expected.tables['public.'+table].columns).map(column=>({table,column})))]) {
  const c=expected.tables['public.'+table].columns[column]
  upCatalog.columns.push({table_name:table,column_name:column,is_nullable:c.notNull?'NO':'YES',udt_name:({integer:'int4',serial:'int4'}[c.type] ?? c.type),column_default:c.type==='serial'?"nextval('synthetic')":c.default ?? null})
 }
 for(const table of pre.created) {
  for(const x of Object.values(expected.tables['public.'+table].foreignKeys))upCatalog.fk.push({conname:x.name,definition:'FOREIGN KEY (_parent_id) REFERENCES '+x.tableTo+'(id) ON DELETE CASCADE'})
  for(const x of Object.values(expected.tables['public.'+table].indexes))upCatalog.indexes.push({indexname:x.name,indexdef:'CREATE '+(x.isUnique?'UNIQUE ':'')+'INDEX '+x.name+' USING btree ('+x.columns.map(c=>c.expression).join(',')+')'})
 }
 const lifecycle={loadSQLFile:async()=>{loaded++},query:async sql=>{
  if(sql.startsWith('CREATE ROLE'))return {stdout:''}
  if(sql.startsWith('BEGIN;')) {
   if(sql.includes('CREATE TABLE "geo_stops"')){migrated=true;upCalls++;metaId++;return {stdout:''}}
   downCalls++
   if(populated){if(refusal==='mutated')migrated=false;throw Object.assign(new Error('CHILD_FAILED:1:null'),{stderr:refusal==='wrong'?'ERROR: permission denied':'ERROR: Geo down refused: preserve new data/history and use reviewed recovery'})}
   migrated=false;return {stdout:''}
  }
  if(sql.startsWith('UPDATE public.travel_plans')){populated=true;return {stdout:''}}
  let value=[]
  if(sql.includes('FROM public.payload_migrations t'))value=migrated?[{id:metaId,name:'20261031_052622_issue180_optional_geo',batch:1}]:[]
  else if(sql.startsWith('SELECT row_to_json'))value={id:-180,geo_access_revision:'synthetic-populated-180'}
  else if(sql.includes('aclexplode'))value=[]
  else if(sql.includes('json_build_object'))value=migrated?upCatalog:baseCatalog
  else if(sql.includes('FROM pg_tables'))value=['payload_migrations','travel_plans']
  else if(sql.includes('information_schema.columns'))value=pre.added.map(x=>({table_name:x.table,column_name:x.column,is_nullable:'YES'}))
  else if(sql.includes('table_privileges'))value=[]
  else if(sql.includes('FROM pg_class'))value=pre.created.map(relname=>({relname,relrowsecurity:true}))
  else if(sql.startsWith('SELECT count(*) FROM public.travel_plans'))value=1
  else if(sql.startsWith('SELECT count'))value=0
  else if(sql.includes('public."payload_migrations"'))value=migrated?[{id:metaId}]:[]
  else value=[{id:-180,title:{en:'Legacy','zh-TW':'舊內容'},history:['version-1']}]
  return {stdout:JSON.stringify(value)}
 }}
 const operation=()=>migrationUp({lifecycle,root:process.cwd(),directory,options:{},checkpoint:async()=>{},completeA:true})
 if(refusal==='expected'){await operation();assert.equal(loaded,2);assert.equal(upCalls,2);assert.equal(downCalls,2);assert.equal(JSON.parse(await readFile(path.join(directory,'populated-down-refusal.json'))).status,'PASS')}
 else await assert.rejects(operation(),refusal==='wrong'?/CHILD_FAILED/:/REFUSAL_SCHEMA_CHANGED/)
})
