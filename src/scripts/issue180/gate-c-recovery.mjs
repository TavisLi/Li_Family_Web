import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { flattenPhysical,assertHistoricalRows,isHistoryTable,stableIdentities } from './gate-c-writers.mjs'

export function assertHistoryPreserved(before,after) {
 for(const table of new Set(before.filter(r=>isHistoryTable(r.table)).map(r=>r.table)))assert(after.some(r=>r.table===table),'HISTORY_TABLE_REMOVED')
 return assertHistoricalRows(before,after)
}
const snapshotEqual=(before,after,message)=>assert(isDeepStrictEqual(before,after),message)
const req=(ctx,transactionID)=>({payload:ctx.payload,user:ctx.fixture.admin,context:{},transactionID})
const rollback=async(payload,id)=>{if(id!=null && payload.db.sessions[id])await payload.db.rollbackTransaction(id)}
async function transaction(ctx) {
 const id=await ctx.payload.db.beginTransaction({isolationLevel:'read committed'})
 assert(id!=null && ctx.payload.db.sessions[id],'TRANSACTION_REQUIRED')
 const row=(await ctx.payload.db.sessions[id].db.execute(ctx.dbSql.raw("SELECT pg_backend_pid() AS pid,current_setting('transaction_isolation') AS isolation"))).rows[0]
 assert.equal(row.isolation,'read committed','TRANSACTION_ISOLATION_MISMATCH')
 return {id,pid:row.pid}
}
export async function runContention(ctx,scenario) {
 const before=await ctx.observe(),transactions=[]
 try {
  const a=await transaction(ctx);transactions.push(a.id)
  const b=await transaction(ctx);transactions.push(b.id)
  assert.notEqual(a.pid,b.pid,'DISTINCT_BACKENDS_REQUIRED')
  const first=scenario==='parent-day'?{collection:'travel-memories',id:ctx.fixture.memoryId}:{collection:'travel-plans',id:ctx.fixture.targetPlanId}
  const second=scenario==='parent-day'?{collection:'travel-memory-days',id:ctx.fixture.dayId}:scenario==='different-trips'?{collection:'travel-plans',id:ctx.fixture.otherPlanId}:first
  await ctx.payload.update({...first,locale:'zh-TW',data:{summary:'Synthetic staged winner'},overrideAccess:false,req:req(ctx,a.id)})
  await assert.rejects(ctx.payload.update({...second,locale:'zh-TW',data:{title:'Synthetic rejected loser'},overrideAccess:false,req:req(ctx,b.id),...(scenario==='autosave'?{autosave:true,draft:true}:{})}),/Travel geo write conflict: an immediate read committed transaction lock is required/)
  snapshotEqual(before,await ctx.observe(),'UNCOMMITTED_OR_REJECTED_WRITE_VISIBLE')
  return {id:scenario,status:'PASS',backends:[a.pid,b.pid],winnerDisposition:'accepted-then-rolled-back',loser:'specific global try-lock refusal',physicalRowsPreserved:true,sequenceAllocations:'PostgreSQL nextval allocations are not transactionally rolled back; restore checks capture their actual state'}
 } finally {
  for(const id of transactions.reverse())await rollback(ctx.payload,id)
  snapshotEqual(before,await ctx.observe(),'CONTENTION_ROLLBACK_CHANGED_ROWS')
 }
}
export async function runTransactionRollback(ctx) {
 const before=await ctx.observe(),tx=await transaction(ctx)
 try {
  for(const [collection,id] of [['travel-plans',ctx.fixture.targetPlanId],['travel-memories',ctx.fixture.memoryId],['travel-memory-days',ctx.fixture.dayId]]) {
   await ctx.payload.update({collection,id,locale:'zh-TW',data:{title:'Synthetic rollback probe'},overrideAccess:false,req:req(ctx,tx.id)})
  }
  // A declared read-back fault occurs after all three writes were accepted.
  await assert.rejects(Promise.reject(Error('SYNTHETIC_READBACK_FAILURE')),/SYNTHETIC_READBACK_FAILURE/)
 } finally {await rollback(ctx.payload,tx.id)}
 const after=await ctx.observe();snapshotEqual(before,after,'TRANSACTION_ROLLBACK_MISMATCH')
 return {id:'transaction-rollback',status:'PASS',fault:'declared read-back failure after three staged writes',history:assertHistoryPreserved(before,after)}
}
export const recoveryCatalogSQL=`SELECT json_build_object(
 'columns',(SELECT coalesce(json_agg(x ORDER BY table_name,ordinal_position),'[]') FROM (SELECT table_name,column_name,ordinal_position,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public') x),
 'constraints',(SELECT coalesce(json_agg(x ORDER BY table_name,conname),'[]') FROM (SELECT c.relname AS table_name,k.conname,pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid WHERE c.relnamespace='public'::regnamespace) x),
 'indexes',(SELECT coalesce(json_agg(x ORDER BY tablename,indexname),'[]') FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public') x),
 'enums',(SELECT coalesce(json_agg(x ORDER BY typname,enumsortorder),'[]') FROM (SELECT t.typname,e.enumlabel,e.enumsortorder FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typnamespace='public'::regnamespace) x),
 'sequences',(SELECT coalesce(json_agg(x ORDER BY sequencename),'[]') FROM (SELECT sequencename,start_value,min_value,max_value,increment_by,cycle,last_value FROM pg_sequences WHERE schemaname='public') x),
 'security',(SELECT coalesce(json_agg(x ORDER BY relname),'[]') FROM (SELECT relname,relrowsecurity,relforcerowsecurity,pg_get_userbyid(relowner) AS owner,relacl::text AS acl FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','S')) x),
 'policies',(SELECT coalesce(json_agg(x ORDER BY tablename,policyname),'[]') FROM (SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public') x))`
// pg_dump recreates live columns; dropped-column slots need not retain attnum.
// Keep each table's live column order and compare every other catalog property.
export function logicalRestoreCatalog(catalog) {
 assert(catalog && Array.isArray(catalog.columns),'RESTORE_SCHEMA_MISMATCH:columns')
 const last=new Map(),columns=catalog.columns.map(column=>{
  assert(column && typeof column.table_name==='string' && typeof column.column_name==='string' && Number.isSafeInteger(column.ordinal_position) && column.ordinal_position>0,'RESTORE_SCHEMA_MISMATCH:column identity')
  assert(column.ordinal_position>(last.get(column.table_name) ?? 0),'RESTORE_SCHEMA_MISMATCH:column order')
  last.set(column.table_name,column.ordinal_position)
  const {ordinal_position:ignored,...logical}=column;return logical
 })
 return {...catalog,columns}
}

export async function runIndependentRestore(ctx) {
 const before=await ctx.observe(),physical=flattenPhysical(before)
 assert(physical.some(row=>typeof row.value.geo_latitude==='number' && typeof row.value.geo_longitude==='number'),'POPULATED_GEO_BACKUP_REQUIRED')
 assert(physical.some(row=>row.value.source_metadata_base_projection && typeof row.value.source_metadata_base_projection==='object'),'BASE_BACKUP_REQUIRED')
 assert(before.some(row=>/^_travel_.*_v/.test(row.table)),'HISTORY_BACKUP_REQUIRED')
 const catalog=await ctx.sql(recoveryCatalogSQL),backup=await ctx.lifecycle.backup('populated-geo',ctx.options)
 let recovery,removed=false,failure,catalogEvidence,absenceEvidence
 try {
  recovery=await ctx.lifecycle.createOwnedRecoveryDatabase(ctx.options)
  assert(recovery.database!==ctx.owner.database,'DISTINCT_RECOVERY_DATABASE_REQUIRED')
  await ctx.lifecycle.restoreToOwnedDatabase(backup,recovery,ctx.options)
  const restoredCatalog=JSON.parse((await ctx.lifecycle.queryOwnedRecoveryDatabase(recovery,recoveryCatalogSQL,ctx.options)).stdout)
  const sourceLogical=logicalRestoreCatalog(catalog),restoredLogical=logicalRestoreCatalog(restoredCatalog)
  assert.deepEqual(restoredLogical,sourceLogical,'RESTORE_SCHEMA_MISMATCH')
  const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
  const ordinalDifferences=catalog.columns.flatMap((column,i)=>column.ordinal_position===restoredCatalog.columns[i].ordinal_position?[]:[{table:column.table_name,column:column.column_name,source:column.ordinal_position,restored:restoredCatalog.columns[i].ordinal_position}])
  catalogEvidence=await ctx.save('restore-catalog-comparison',{scope:'logical-catalog-only',relativeColumnOrder:'MATCH',sourceCatalogSHA256:digest(catalog),restoredCatalogSHA256:digest(restoredCatalog),logicalCatalogSHA256:digest(sourceLogical),physicalOrdinalDifferences:ordinalDifferences,physicalOrdinalIdentity:'NOT_REQUIRED'})
  assert(catalogEvidence?.path==='restore-catalog-comparison.json' && /^[a-f0-9]{64}$/.test(catalogEvidence.sha256),'RESTORE_CATALOG_EVIDENCE_UNKNOWN')
  snapshotEqual(before,await ctx.observe({database:recovery.database}),'RESTORE_PHYSICAL_ROWS_MISMATCH')
  assertHistoryPreserved(before,await ctx.observe({database:recovery.database}))
 } catch(error){failure=error;await ctx.save('restore-failure',{status:'BLOCK',stage:'independent-restore',message:error.message,effects:'UNKNOWN'})} finally {
  if(recovery && recovery.database!==ctx.owner.database)try {
   const readback=await ctx.lifecycle.dropOwnedRecoveryDatabase(recovery,ctx.options)
   assert(readback.databaseAbsent===true && readback.observedCount===0 && readback.verification==='pg_database-count' && readback.rawResult==='0' && readback.query===`SELECT count(*) FROM pg_database WHERE datname='${recovery.database}'`,'RECOVERY_DATABASE_ABSENCE_UNKNOWN')
   absenceEvidence=await ctx.save('restore-db-absence',{scope:'owned-restore-db-only',database:recovery.database,...readback})
   assert(absenceEvidence?.path==='restore-db-absence.json' && /^[a-f0-9]{64}$/.test(absenceEvidence.sha256),'RECOVERY_DATABASE_ABSENCE_EVIDENCE_UNKNOWN')
   removed=true
  } catch(error){if(failure){failure.cleanupError=error.message;failure.message+=' [restore DB absence evidence UNKNOWN]'}else failure=error}
 }
 if(failure)throw failure
 assert(removed,'RECOVERY_DATABASE_ABSENCE_UNKNOWN')
 snapshotEqual(before,await ctx.observe(),'RESTORE_CHANGED_SOURCE_DATABASE')
 return {id:'independent-restore',status:'PASS',backup:{path:backup.path,sha256:backup.sha256},sourceDatabase:ctx.owner.database,recoveryDatabase:recovery.database,recoveryDatabaseAbsent:true,physicalRowsAndCatalog:'PHYSICAL_ROWS_AND_LOGICAL_CATALOG_MATCH',catalogEvidence,absenceEvidence,transactionRollbackSubstitute:false}
}
export async function runRecovery(ctx) {
 const selected=ctx.cases ?? ['same-owner','parent-day','different-trips','autosave','transaction-rollback','history','independent-restore','cleanup'],records=[]
 for(const id of selected) {
  await ctx.checkpoint('recovery:'+id)
  let result
  if(['same-owner','parent-day','different-trips','autosave'].includes(id))result=await runContention(ctx,id)
  else if(id==='transaction-rollback')result=await runTransactionRollback(ctx)
  else if(id==='independent-restore')result=await runIndependentRestore(ctx)
  else if(id==='history') {
   const beforeWrites=await ctx.observe(),counts=[]
   for(const [collection,target] of [['travel-plans',ctx.fixture.targetPlanId],['travel-memories',ctx.fixture.memoryId],['travel-memory-days',ctx.fixture.dayId]]) {
    const options={collection,where:{parent:{equals:target}},limit:1,depth:0,overrideAccess:false,user:ctx.fixture.admin}
    const beforeCount=(await ctx.payload.findVersions(options)).totalDocs
    for(let i=0;i<35;i++)await ctx.payload.update({collection,id:target,locale:'zh-TW',data:{title:'Synthetic history '+i},overrideAccess:false,user:ctx.fixture.admin})
    const afterCount=(await ctx.payload.findVersions(options)).totalDocs
    assert(afterCount>=beforeCount+35 && afterCount>30,'HISTORY_PRUNING_OR_VERSION_WRITE_MISSING:'+collection)
    counts.push({collection,before:beforeCount,after:afterCount})
   }
   const before=await ctx.observe()
   await ctx.assertPreserved(beforeWrites,before,[{collection:'travel-plans',id:ctx.fixture.targetPlanId},{collection:'travel-memories',id:ctx.fixture.memoryId},{collection:'travel-memory-days',id:ctx.fixture.dayId}])
   assertHistoryPreserved(beforeWrites,before)
   const versions=await ctx.payload.findVersions({collection:'travel-plans',where:{parent:{equals:ctx.fixture.targetPlanId}},locale:'zh-TW',fallbackLocale:false,limit:100,depth:0,overrideAccess:false,user:ctx.fixture.admin})
   const unsafe=versions.docs.find(doc=>doc.version?.planningSections?.some(s=>s.geoStops?.some(stop=>stop.geo?.approval?.snapshot)))
   assert(unsafe,'UNSAFE_HISTORY_FIXTURE_REQUIRED')
   await assert.rejects(ctx.payload.restoreVersion({collection:'travel-plans',id:unsafe.id,overrideAccess:false,user:ctx.fixture.admin}),{name:'Error',message:'Geo approval requires explicit Admin review'})
   const after=await ctx.observe();snapshotEqual(before,after,'UNSAFE_RESTORE_CHANGED_ROWS')
   const safe=versions.docs.find(doc=>doc.version?.title==='Synthetic history 33' && !doc.version.planningSections?.some(s=>s.geoStops?.some(stop=>stop.geo?.approval?.snapshot)))
   assert(safe,'SAFE_RESTORE_FIXTURE_REQUIRED')
   const restored=await ctx.payload.restoreVersion({collection:'travel-plans',id:safe.id,locale:'zh-TW',overrideAccess:false,user:ctx.fixture.admin})
   assert.deepEqual(stableIdentities(restored),stableIdentities({id:ctx.fixture.targetPlanId,...safe.version}),'SAFE_RESTORE_IDENTITY_CHANGED')
   const target=Number(ctx.fixture.targetPlanId);assert(Number.isSafeInteger(target),'SAFE_RESTORE_TARGET')
   const readback=await ctx.sql(`SELECT coalesce(json_agg(x),'[]') FROM (SELECT p.id,l.title FROM travel_plans p JOIN travel_plans_locales l ON l._parent_id=p.id WHERE p.id=${target} AND l._locale='zh-TW') x`)
   assert.deepEqual(readback,[{id:target,title:safe.version.title}],'SAFE_RESTORE_READBACK_MISMATCH')
   const safeAfter=await ctx.observe()
   await ctx.assertPreserved(after,safeAfter,[{collection:'travel-plans',id:target}]);assertHistoryPreserved(after,safeAfter)
   result={id,status:'PASS',...assertHistoryPreserved(ctx.fixtureBefore,safeAfter),retentionCounts:counts,unsafeRestoreRejected:true,safeRestoreVerified:true,safeVersionId:safe.id,independentReadback:readback}

  } else {assert.equal(id,'cleanup','UNKNOWN_RECOVERY_CASE');result={id,status:'PENDING_FINAL_CLEANUP',requires:['databaseAbsent','serverStopped','directoryAbsent'],controlledFailureAndInterruption:'offline lifecycle evidence only; real fault cleanup probe not evaluated'}}
  if(result.status==='PASS')await ctx.save(id,result)
  records.push(result)
 }
 return records
}
