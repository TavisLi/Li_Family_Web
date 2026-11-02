import assert from 'node:assert/strict'
import { readFile,writeFile,realpath } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { inspectMigrationBaseline } from './migration-prerequisites.mjs'
import { assertUnchanged,snapshotDigest } from './snapshot-assertions.mjs'
import { runLifecycle } from './lifecycle.mjs'
export const candidate='src/migrations/20261031_052622_issue180_optional_geo.ts'
export const schemaFile='scripts/rehearsal/baselines/issue158-v12/schema.sql'
export function assertPlanSeedDiagnosticScope(manifest) {
 const include=manifest?.scope?.include
 assert(Array.isArray(include),'DIAGNOSTIC_SCOPE_MISSING')
 assert(include.includes('issue180-gate-c-plan-seed-diagnostic') && include.includes('case:plan-seed'),'DIAGNOSTIC_SCOPE_NOT_APPROVED')
 assert(!['issue180-gate-c-full','issue180-gate-c-migration-a','controlled-cleanup-probes'].some(x=>include.includes(x)) && include.filter(x=>typeof x==='string' && x.startsWith('case:')).length===1,'DIAGNOSTIC_SCOPE_EXPANDED')
}
const name='20261031_052622_issue180_optional_geo'
const id=s=>{assert(/^[a-z_][a-z0-9_]*$/.test(s));return '"'+s+'"'}
export async function migrationUp({lifecycle,root,directory,options,checkpoint,completeA=false}) {
 const save=(file,value)=>writeFile(path.join(directory,file+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600})
 const query=async sql=>JSON.parse((await lifecycle.query(sql,options)).stdout)
 const [schema,migration]=await Promise.all([readFile(path.join(root,schemaFile),'utf8'),readFile(path.join(root,candidate),'utf8')])
 const pre=inspectMigrationBaseline(schema,migration);await save('migration-prerequisites',pre)
 assert.equal(pre.status,'STATIC_NAMES_MATCH_ONLY')
 await checkpoint('baseline')
 for(const role of ['anon','authenticated','service_role','supabase_admin']) await lifecycle.query(`CREATE ROLE ${id(role)} NOLOGIN NOSUPERUSER NOBYPASSRLS`,options)
 await lifecycle.loadSQLFile(path.join(root,schemaFile),options)
 const state=()=>query("SELECT coalesce(json_agg(t ORDER BY id),'[]') FROM public.payload_migrations t")
 assert.deepEqual(await state(),[],'HISTORICAL_MIGRATION_ROWS_PRESENT')
 const tables=await query("SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]') FROM pg_tables WHERE schemaname='public'")
 const snapshot=async()=>{
  const result=[]
  for(const table of tables) {
   const columns=pre.added.filter(x=>x.table===table).map(x=>"'"+x.column+"'").join(',')
   const project=columns ? `to_jsonb(t)-ARRAY[${columns}]::text[]` : 'to_jsonb(t)'
   const value=await query(`SELECT coalesce(jsonb_agg(v ORDER BY v::text),'[]') FROM (SELECT ${project} AS v FROM public.${id(table)} t) s`)
   result.push({table,key:'rows',value})
  }
  return result
 }
 if(completeA) {
  await lifecycle.loadSQLFile(path.join(root,'scripts/rehearsal/baselines/issue180/legacy-fixture.sql'),options)
  assert.equal(Number(await query('SELECT count(*) FROM public.travel_plans WHERE id=-180')),1,'LEGACY_FIXTURE_MISSING')
 }
 const before=await snapshot();await save('before-image',before)
 const catalog=()=>query(`SELECT json_build_object('columns',(SELECT coalesce(json_agg(t ORDER BY table_name,ordinal_position),'[]') FROM (SELECT table_name,column_name,ordinal_position,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public') t),'indexes',(SELECT coalesce(json_agg(t ORDER BY indexname),'[]') FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public') t),'fk',(SELECT coalesce(json_agg(t ORDER BY conname),'[]') FROM (SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace) t),'enums',(SELECT coalesce(json_agg(t ORDER BY typname,enumsortorder),'[]') FROM (SELECT typname,enumlabel,enumsortorder FROM pg_type JOIN pg_enum ON enumtypid=pg_type.oid WHERE typnamespace='public'::regnamespace) t))`)
 const beforeCatalog=completeA ? await catalog() : null
 await checkpoint('candidate-up')
 const {tsImport}=await import('tsx/esm/api')
 const {up,down}=await tsImport(path.join(root,candidate),import.meta.url)
 const adapter=await realpath(path.join(root,'node_modules/@payloadcms/db-postgres/package.json'))
 const {PgDialect}=createRequire(adapter)('drizzle-orm/pg-core')
 let calls=0
 await up({db:{execute:async statement=>{
  assert.equal(++calls,1,'UNREVIEWED_MIGRATION_BATCHES')
  const compiled=new PgDialect().sqlToQuery(statement);assert.equal(compiled.params.length,0)
  return lifecycle.query(`BEGIN;${compiled.sql}\nINSERT INTO public.payload_migrations(name,batch) VALUES ('${name}',1);COMMIT;`,options)
 }}})
 assert.equal(calls,1)
 await checkpoint('independent-observer')
 const afterState=await state();assert.equal(afterState.length,1);assert.equal(afterState[0].name,name);assert.equal(Number(afterState[0].batch),1)
 const columns=await query("SELECT coalesce(json_agg(t),'[]') FROM (SELECT table_name,column_name,is_nullable FROM information_schema.columns WHERE table_schema='public') t")
 for(const c of pre.added) assert(columns.some(x=>x.table_name===c.table && x.column_name===c.column && x.is_nullable==='YES'),'NULLABLE_COLUMN_MISSING')
 const names=pre.created.map(x=>"'"+x+"'").join(',')
 const security=await query(`SELECT coalesce(json_agg(t),'[]') FROM (SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN (${names})) t`)
 assert.equal(security.length,4);assert(security.every(x=>x.relrowsecurity),'RLS_MISSING')
 for(const table of pre.created) assert.equal(Number(await query(`SELECT count(*) FROM public.${id(table)}`)),0,'NEW_TABLE_NOT_EMPTY')
 const grants=await query(`SELECT coalesce(json_agg(t),'[]') FROM (SELECT grantee,privilege_type,table_name FROM information_schema.table_privileges WHERE table_schema='public' AND table_name IN (${names}) AND grantee IN ('PUBLIC','anon','authenticated')) t`)
 assert.deepEqual(grants,[],'NEW_TABLE_GRANTS_EXPOSED')
 const after=await snapshot();const preservation=assertUnchanged(before,after,[{table:'payload_migrations',key:'rows'}])
 await save('migration-up',{status:'PASS',scope:'local-additive-migration-only',afterState,columns,security,grants,preservation,beforeSha256:snapshotDigest(before),afterSha256:snapshotDigest(after),unknown:pre.unknown})
 if(completeA) {
  const observed=await catalog(),expected=JSON.parse(await readFile(path.join(root,candidate.replace('.ts','.json')),'utf8'))
  const checks=[...pre.added,...pre.created.flatMap(table=>Object.keys(expected.tables['public.'+table].columns).map(column=>({table,column})))]
  for(const item of checks) {
   const column=expected.tables['public.'+item.table].columns[item.column]
   const actual=observed.columns.find(x=>x.table_name===item.table && x.column_name===item.column)
   const type={varchar:'varchar',integer:'int4',serial:'int4',numeric:'numeric'}[column.type] ?? column.type
   assert(actual && actual.udt_name===type,'COLUMN_TYPE_MISMATCH:'+item.table+'.'+item.column)
   assert.equal(actual.is_nullable,column.notNull?'NO':'YES','NULLABILITY_MISMATCH')
   if(column.type==='serial') assert(/^nextval\(/.test(actual.column_default),'SERIAL_DEFAULT_MISSING')
   else assert.equal(actual.column_default,column.default ?? null,'DEFAULT_MISMATCH')
  }
  for(const table of pre.created) {
   for(const fk of Object.values(expected.tables['public.'+table].foreignKeys)) {
    const actual=observed.fk.find(x=>x.conname===fk.name)
    assert(actual && actual.definition.replaceAll('\"','').includes('REFERENCES '+fk.tableTo+'('+fk.columnsTo.join(', ')+')') && actual.definition.replaceAll('\"','').includes('FOREIGN KEY ('+fk.columnsFrom.join(', ')+')') && actual.definition.includes('ON DELETE CASCADE'),'FK_MISMATCH:'+fk.name)
   }
   for(const index of Object.values(expected.tables['public.'+table].indexes)) {
    const actual=observed.indexes.find(x=>x.indexname===index.name)
    assert(actual && actual.indexdef.includes('USING btree'),'INDEX_MISSING:'+index.name)
    assert.equal(actual.indexdef.includes('UNIQUE INDEX'),index.isUnique,'INDEX_UNIQUENESS_MISMATCH')
    assert(actual.indexdef.replaceAll('\"','').replaceAll(', ',',').includes('('+index.columns.map(c=>c.expression).join(',')+')'),'INDEX_COLUMNS_MISMATCH')
   }
  }
  assert.deepEqual(observed.enums.filter(x=>x.typname==='travel_geo_audience').map(x=>x.enumlabel),['family','public'],'ENUM_MISMATCH')
  const sequences=pre.created.flatMap(table=>Object.values(expected.tables['public.'+table].columns).filter(c=>c.type==='serial').map(c=>"'"+table+'_'+c.name+"_seq'"))
  const sequenceGrants=await query(`SELECT coalesce(json_agg(t),'[]') FROM (SELECT c.relname,a.privilege_type FROM pg_class c CROSS JOIN LATERAL aclexplode(coalesce(c.relacl,acldefault('S',c.relowner))) a LEFT JOIN pg_roles r ON r.oid=a.grantee WHERE c.relnamespace='public'::regnamespace AND c.relkind='S' AND c.relname IN (${sequences.join(',')}) AND (a.grantee=0 OR r.rolname IN ('anon','authenticated'))) t`)
  assert.deepEqual(sequenceGrants,[],'NEW_SEQUENCE_GRANTS_EXPOSED')
  await save('affected-catalog',{...observed,sequenceGrants})
  const invokeDown=async()=>down({db:{execute:async statement=>{
   const compiled=new PgDialect().sqlToQuery(statement);assert.equal(compiled.params.length,0)
   return lifecycle.query(`BEGIN;${compiled.sql}\nDELETE FROM public.payload_migrations WHERE name='${name}';COMMIT;`,options)
  }}})
  await checkpoint('empty-down')
  await invokeDown()
  assert.deepEqual(await state(),[],'DOWN_MIGRATION_STATE')
  assert.deepEqual(await catalog(),beforeCatalog,'DOWN_SCHEMA_CHANGED')
  assertUnchanged(before,await snapshot())
  await save('empty-down',{status:'PASS',migrationState:await state(),catalog:await catalog(),snapshotSha256:snapshotDigest(await snapshot())})
  // Planned re-up is part of this case sequence, not an error retry.
  calls=0
  await up({db:{execute:async statement=>{
   assert.equal(++calls,1)
   const compiled=new PgDialect().sqlToQuery(statement)
   return lifecycle.query(`BEGIN;${compiled.sql}\nINSERT INTO public.payload_migrations(name,batch) VALUES ('${name}',1);COMMIT;`,options)
  }}})
  await lifecycle.query("UPDATE public.travel_plans SET geo_access_revision='synthetic-populated-180' WHERE id=-180",options)
  const populatedCatalog=await catalog(),populatedState=await state()
  const populatedRows=await lifecycle.query("SELECT row_to_json(t) FROM public.travel_plans t WHERE id=-180",options)
  await checkpoint('populated-down-refusal')
  let expectedRefusal=false
  try {await invokeDown()} catch(error) {
   expectedRefusal=/^CHILD_FAILED:(?:1|3):/.test(error.message) && /ERROR:\s+(?:P0001:\s+)?Geo down refused: preserve new data\/history and use reviewed recovery/.test(error.stderr ?? '')
   if(!expectedRefusal) throw error
  }
  assert(expectedRefusal,'EXPECTED_DOWN_REFUSAL_MISSING')
  assert.deepEqual(await catalog(),populatedCatalog,'REFUSAL_SCHEMA_CHANGED')
  assert.deepEqual(await state(),populatedState,'REFUSAL_MIGRATION_STATE_CHANGED')
  assert.equal((await lifecycle.query("SELECT row_to_json(t) FROM public.travel_plans t WHERE id=-180",options)).stdout,populatedRows.stdout,'REFUSAL_DATA_CHANGED')
  assertUnchanged(after,await snapshot(),[{table:'payload_migrations',key:'rows'}])
  await save('populated-down-refusal',{status:'PASS',expectedError:'Geo down refused',schemaUnchanged:true,migrationState:populatedState,legacySnapshotSha256:snapshotDigest(await snapshot())})
 }
}

export async function runGateC(args) {
 if(JSON.stringify(args.cases)===JSON.stringify(['plan-seed'])) {
  assertPlanSeedDiagnosticScope(args.manifest)
  return runLifecycle({...args,group:'plan-seed-diagnostic'})
 }
 if(JSON.stringify(args.cases)===JSON.stringify(allCases))return runLifecycle({...args,group:'verification'})
 const full=JSON.stringify(args.cases)===JSON.stringify(['migration-up','empty-down','populated-down-refusal'])
 assert(full || JSON.stringify(args.cases)===JSON.stringify(['migration-up']),'CASES_NOT_IMPLEMENTED')
 return runLifecycle({...args,group:full?'migration-a':'migration-up'})
}
export async function runPlanSeedDiagnostic(context,deps={}) {
 assert(Boolean(deps.migration)===Boolean(deps.worker),'PAIRED_TRANSPORT_REQUIRED')
 await (deps.migration ?? migrationUp)({...context,completeA:false})
 const worker=deps.worker ?? (await import('./gate-c-worker-host.mjs')).runVerificationWorker
 const records=await worker({...context,scope:'plan-seed-diagnostic'})
 assert.deepEqual(records.map(row=>row.id),['plan-seed'],'DIAGNOSTIC_RESULT_SCOPE')
 const bytes=await readFile(path.join(context.directory,'plan-seed.json')),file=JSON.parse(bytes)
 assert(file.status==='PASS' && file.manifestSha256===context.manifestSha256 && file.runId===context.owner.runId,'CASE_EVIDENCE_UNBOUND')
 assert(Array.isArray(records[0].observerEvidence) && records[0].observerEvidence.length>0,'OBSERVER_READBACK_UNKNOWN')
 const {verifyObserverEvidence}=await import('./gate-c-worker-host.mjs')
 await verifyObserverEvidence(context.directory,records[0].observerEvidence,context.owner.runId,context.manifestSha256)
 return [{id:'plan-seed',status:'PASS',evidence:'plan-seed.json',sha256:createHash('sha256').update(bytes).digest('hex'),observerEvidence:records[0].observerEvidence}]
}
export const allCases=['migration-up','empty-down','populated-down-refusal','plan-seed','memory-v1','memory-v2','admin','locales','non-target','http','graphql','local-api','same-owner','parent-day','different-trips','autosave','transaction-rollback','history','independent-restore','cleanup']
export async function runFullMatrix(context) {
 await migrationUp({...context,completeA:true})
 const records=[]
 for(const id of allCases.slice(0,3)) {
  const bytes=await readFile(path.join(context.directory,id+'.json')),value=JSON.parse(bytes)
  assert.equal(value.status,'PASS','MIGRATION_CASE_NOT_PASSED');records.push({id,status:'PASS',evidence:id+'.json',sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 const {runVerificationWorker}=await import('./gate-c-worker-host.mjs')
 const rest=await runVerificationWorker(context)
 assert.deepEqual([...records,...rest].map(row=>row.id),allCases,'MATRIX_REQUIREMENTS_MISSING')
 for(const record of rest) {
  if(record.id==='cleanup'){assert.equal(record.status,'PENDING_FINAL_CLEANUP');records.push(record);continue}
  assert.equal(record.status,'PASS','CASE_NOT_PASSED:'+record.id)
  const bytes=await readFile(path.join(context.directory,record.id+'.json')),file=JSON.parse(bytes)
  assert(file.status==='PASS' && file.manifestSha256===context.manifestSha256 && file.runId===context.owner.runId,'CASE_EVIDENCE_UNBOUND')
  records.push({id:record.id,status:'PASS',evidence:record.id+'.json',sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 return records
}
