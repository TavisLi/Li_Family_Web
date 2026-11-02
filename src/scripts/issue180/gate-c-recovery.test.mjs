import assert from 'node:assert/strict'
import test from 'node:test'
import { runContention, runTransactionRollback, runIndependentRestore, assertHistoryPreserved, runRecovery } from './gate-c-recovery.mjs'

function harness() {
 const calls=[],saved={},sessions={};let n=0,holder=null
 let rows=[{table:'travel_plans',key:'rows',value:[{id:1,title:'initial',source_metadata_base_projection:{sentinel:'hidden'}}]},
 {table:'travel_plans_planning_sections_geo_stops',key:'rows',value:[{id:'stop',geo_latitude:25,geo_longitude:121}]},
 {table:'_travel_plans_v',key:'rows',value:[{id:10,parent_id:1,version_title:'old',latest:true}]}]
 const clone=()=>structuredClone(rows)
 const payload={db:{sessions,beginTransaction:async()=>{const id=++n;calls.push(['begin',id]);sessions[id]={db:{execute:async()=>({rows:[{pid:100+id,isolation:'read committed'}]})}};return id},rollbackTransaction:async id=>{calls.push(['rollback',id]);if(holder===id)holder=null;delete sessions[id]}},update:async args=>{
  const id=args.req?.transactionID;calls.push(['update',args.collection,args.id,id,args.autosave,args.draft]);
  if(id && holder && holder!==id){delete sessions[id];throw new Error('Travel geo write conflict: an immediate read committed transaction lock is required')}
  if(id){holder=id;sessions[id].staged=args.data}else{rows[0].value[0].title=args.data.title;rows[2].value.push({id:11,parent_id:1,version_title:args.data.title})}
  return {id:args.id,...args.data}
 }}
 const ctx={payload,fixture:{admin:{id:1},targetPlanId:1,otherPlanId:2,memoryId:3,dayId:4,hiddenSentinel:'hidden'},dbSql:{raw:s=>s},
 options:{},owner:{database:'issue180_owned'},checkpoint:async name=>calls.push(['checkpoint',name]),observe:async()=>clone(),save:async(name,value)=>{saved[name]=value;return {path:name+'.json',sha256:'a'.repeat(64)}},sql:async()=>({columns:[],indexes:[],constraints:[],enums:[],sequences:[]})}
 let backupRows
 ctx.lifecycle={backup:async(label)=>{calls.push(['backup',label]);backupRows=clone();return {path:'/owned/backup',sha256:'f'.repeat(64),database:ctx.owner.database}},createOwnedRecoveryDatabase:async()=>{calls.push(['create']);return {database:'issue180_owned_restore'}},restoreToOwnedDatabase:async()=>calls.push(['restore']),queryOwnedRecoveryDatabase:async()=>({stdout:JSON.stringify(await ctx.sql())}),dropOwnedRecoveryDatabase:async recovery=>{calls.push(['drop']);return {databaseAbsent:true,observedCount:0,verification:'pg_database-count',query:`SELECT count(*) FROM pg_database WHERE datname='${recovery.database}'`,rawResult:'0'}}}
 const sourceObserve=ctx.observe;ctx.observe=async arg=>arg?.database?structuredClone(backupRows):sourceObserve()
 return {ctx,calls,saved,rows}
}
test('real choreography overlaps distinct adapter transactions and rejects every global-lock loser',async()=>{
 for(const scenario of ['same-owner','parent-day','different-trips','autosave']){
  const {ctx,calls}=harness();const result=await runContention(ctx,scenario)
  assert.equal(result.status,'PASS');assert.notEqual(result.backends[0],result.backends[1]);assert.equal(result.winnerDisposition,'accepted-then-rolled-back')
  const updates=calls.filter(c=>c[0]==='update');assert.equal(updates.length,2);assert.deepEqual(updates.map(c=>c[3]),[1,2])
  assert(calls.findIndex(c=>c[0]==='rollback')>calls.findIndex(c=>c[0]==='update'&&c[3]===2))
  if(scenario==='autosave') assert.deepEqual(updates[1].slice(4),[true,true])
  assert.deepEqual(Object.keys(ctx.payload.db.sessions),[])
 }
})
test('unexpected loser errors still rollback the accepted transaction and propagate',async()=>{
 const {ctx}=harness();const update=ctx.payload.update;ctx.payload.update=async args=>{if(args.req.transactionID===2)throw new Error('unexpected failure');return update(args)}
 await assert.rejects(runContention(ctx,'same-owner'),/unexpected failure/);assert.deepEqual(Object.keys(ctx.payload.db.sessions),[])
})
test('rollback stages multiple collection writes then independently verifies full before-image',async()=>{
 const {ctx,calls}=harness();const result=await runTransactionRollback(ctx)
 assert.equal(result.status,'PASS');assert.equal(calls.filter(c=>c[0]==='update').length,3);assert.equal(calls.filter(c=>c[0]==='rollback').length,1)
 assert.equal(calls.some(c=>c[0]==='backup'),false)
})
test('full backup restores distinct owned DB and compares physical data/catalog before dropping it',async()=>{
 const {ctx,calls}=harness();const result=await runIndependentRestore(ctx)
 assert.equal(result.status,'PASS');assert.equal(result.recoveryDatabaseAbsent,true)
 assert.deepEqual(calls.filter(c=>['backup','create','restore','drop'].includes(c[0])).map(c=>c[0]),['backup','create','restore','drop'])
})
test('restore comparison failure drops only owned recovery database and preserves the error',async()=>{
 const {ctx,calls}=harness();ctx.lifecycle.queryOwnedRecoveryDatabase=async()=>({stdout:'{"columns":["drift"]}'})
 await assert.rejects(runIndependentRestore(ctx),/RESTORE_SCHEMA_MISMATCH/);assert.equal(calls.at(-1)[0],'drop')
})
test('same database restore is refused before destructive restore and still drops recovery handle',async()=>{
 const {ctx,calls}=harness();ctx.lifecycle.createOwnedRecoveryDatabase=async()=>({database:ctx.owner.database})
 await assert.rejects(runIndependentRestore(ctx),/DISTINCT_RECOVERY_DATABASE_REQUIRED/);assert.equal(calls.some(c=>c[0]==='restore'),false);assert.equal(calls.some(c=>c[0]==='drop'),false)
})
test('history preserves every historical row content and identity while permitting latest bookkeeping',()=>{
 const before=[{table:'_travel_plans_v',key:'rows',value:[{id:1,version_title:'old',latest:true}]}]
 const after=[{table:'_travel_plans_v',key:'rows',value:[{id:1,version_title:'old',latest:false},{id:2,version_title:'new'}]}]
 assert.equal(assertHistoryPreserved(before,after).preservedRows,1)
 assert.throws(()=>assertHistoryPreserved(before,[{...after[0],value:[{id:1,version_title:'lost'}]}]),/HISTORY_CONTENT_CHANGED/)
 assert.throws(()=>assertHistoryPreserved(before,[]),/HISTORY_TABLE_REMOVED/)
})
test('cleanup is pending until parent supplies actual final cleanup receipt',async()=>{
 const {ctx}=harness();ctx.cases=['cleanup'];const result=await runRecovery(ctx)
 assert.equal(result.length,1);assert.equal(result[0].status,'PENDING_FINAL_CLEANUP');assert.equal(result[0].id,'cleanup')
})
test('backup refuses empty geo or missing Base even when physical column names exist',async()=>{
 for(const field of ['geo','base']) {
  const {ctx,rows,calls}=harness()
  if(field==='geo')Object.assign(rows[1].value[0],{geo_latitude:null,geo_longitude:null})
  else rows[0].value[0].source_metadata_base_projection=null
  await assert.rejects(runIndependentRestore(ctx),field==='geo'?/POPULATED_GEO_BACKUP_REQUIRED/:/BASE_BACKUP_REQUIRED/)
  assert(!calls.some(call=>call[0]==='backup'))
 }
})
for(const prunes of [false,true])test('history crosses old retention threshold in all three collections and rejects pruning: '+prunes,async()=>{
 const {ctx}=harness(),counts={},writes=[]
 ctx.cases=['history'];ctx.fixtureBefore=await ctx.observe();ctx.assertPreserved=async()=>{}
 const safe={id:12,version:{title:'Synthetic history 33',planningSections:[]}}
 ctx.payload.findVersions=async({collection})=>({totalDocs:prunes?Math.min(counts[collection]??1,30):(counts[collection]??1),docs:[{id:10,version:{planningSections:[{geoStops:[{geo:{approval:{snapshot:'synthetic'}}}]}]}},safe]})
 ctx.payload.update=async args=>{writes.push(args);counts[args.collection]=(counts[args.collection]??1)+1;return {id:args.id}}
 ctx.payload.restoreVersion=async({id})=>{if(id===10)throw Error('Geo approval requires explicit Admin review');return {id:1,...safe.version}}
 ctx.sql=async()=>[{id:1,title:safe.version.title}]
 if(prunes)await assert.rejects(runRecovery(ctx),/HISTORY_PRUNING_OR_VERSION_WRITE_MISSING/)
 else {
  const result=await runRecovery(ctx);assert.equal(result[0].status,'PASS');assert.equal(writes.length,105)
  assert(result[0].retentionCounts.every(row=>row.after===36))
 }
})

for(const mode of ['guard','backend','safe-broken','safe-noop'])test('SP3 history requires exact guard and safe restore physical readback: '+mode,async()=>{
 const {ctx}=harness(),counts={};ctx.cases=['history'];ctx.fixtureBefore=await ctx.observe();ctx.assertPreserved=async()=>{}
 const safe={id:12,version:{title:'Synthetic history 33',planningSections:[{id:'s',anchor:'section',geoStops:[{id:'g',stopKey:'stop',geo:{approval:null}}]}]}}
 const unsafe={id:10,version:{planningSections:[{geoStops:[{geo:{approval:{snapshot:'synthetic'}}}]}]}}
 ctx.payload.findVersions=async({collection})=>({totalDocs:counts[collection]??1,docs:[unsafe,safe]})
 ctx.payload.update=async({collection})=>{counts[collection]=(counts[collection]??1)+1}
 let restored=false
 ctx.payload.restoreVersion=async({id})=>{
  if(id===unsafe.id)throw Error(mode==='backend'?'restore backend connection lost':'Geo approval requires explicit Admin review')
  if(mode==='safe-broken')throw Error('restore backend connection lost')
  restored=mode!=='safe-noop';return {id:1,...safe.version}
 }
 ctx.sql=async()=>[{id:1,title:restored?safe.version.title:'Synthetic history 34'}]
 if(mode==='guard'){const result=await runRecovery(ctx);assert.equal(result[0].safeRestoreVerified,true);assert(restored)}
 else await assert.rejects(runRecovery(ctx),mode==='safe-noop'?/SAFE_RESTORE/:/restore backend connection lost/)
})
test('logical restore accepts ordinal gaps only and saves SQL-level absence evidence',async()=>{
 const {ctx,saved}=harness(),before={columns:[{table_name:'t',column_name:'id',ordinal_position:1,udt_name:'int4',is_nullable:'NO',column_default:null},{table_name:'t',column_name:'geo',ordinal_position:14,udt_name:'numeric',is_nullable:'YES',column_default:null}],constraints:[],indexes:[],enums:[],sequences:[],security:[],policies:[]}
 const after=structuredClone(before);after.columns[1].ordinal_position=2
 ctx.sql=async()=>before;ctx.lifecycle.queryOwnedRecoveryDatabase=async()=>({stdout:JSON.stringify(after)})
 const result=await runIndependentRestore(ctx)
 assert.equal(result.status,'PASS');assert.equal(saved['restore-db-absence'].databaseAbsent,true);assert.equal(saved['restore-db-absence'].observedCount,0)
 assert.notEqual(saved['restore-catalog-comparison'].sourceCatalogSHA256,saved['restore-catalog-comparison'].restoredCatalogSHA256);assert.match(saved['restore-catalog-comparison'].logicalCatalogSHA256,/^[a-f0-9]{64}$/)
})
test('logical restore rejects changed order, type, default, missing columns and constraints',async()=>{
 for(const mutate of [x=>x.columns.reverse(),x=>{x.columns[1].udt_name='text'},x=>{x.columns[1].column_default='1'},x=>x.columns.pop(),x=>x.constraints.push({name:'unexpected'})]) {
  const {ctx}=harness(),before={columns:[{table_name:'t',column_name:'id',ordinal_position:1,udt_name:'int4',is_nullable:'NO',column_default:null},{table_name:'t',column_name:'geo',ordinal_position:14,udt_name:'numeric',is_nullable:'YES',column_default:null}],constraints:[],indexes:[],enums:[],sequences:[],security:[],policies:[]},after=structuredClone(before);mutate(after)
  ctx.sql=async()=>before;ctx.lifecycle.queryOwnedRecoveryDatabase=async()=>({stdout:JSON.stringify(after)})
  await assert.rejects(runIndependentRestore(ctx),/RESTORE_SCHEMA_MISMATCH/)
 }
})

test('restore DB absence evidence failure cannot produce PASS',async()=>{
 const {ctx}=harness(),save=ctx.save;ctx.save=async(name,value)=>{if(name==='restore-db-absence')throw Error('EVIDENCE_READBACK_FAILED');return save(name,value)}
 await assert.rejects(runIndependentRestore(ctx),/EVIDENCE_READBACK_FAILED/)
})
test('original restore failure and UNKNOWN absence evidence are both retained',async()=>{
 const {ctx}=harness(),save=ctx.save
 ctx.lifecycle.queryOwnedRecoveryDatabase=async()=>({stdout:'{"columns":["drift"]}'})
 ctx.save=async(name,value)=>{if(name==='restore-db-absence')throw Error('EVIDENCE_READBACK_FAILED');return save(name,value)}
 await assert.rejects(runIndependentRestore(ctx),/RESTORE_SCHEMA_MISMATCH.*restore DB absence evidence UNKNOWN/)
})
test('unverified or mismatched SQL absence readback cannot produce PASS',async()=>{
 for(const patch of [{observedCount:1},{rawResult:'1'},{query:'SELECT 0'},{verification:'unverified'}]) {
  const {ctx}=harness(),drop=ctx.lifecycle.dropOwnedRecoveryDatabase
  ctx.lifecycle.dropOwnedRecoveryDatabase=async recovery=>({...await drop(recovery),...patch})
  await assert.rejects(runIndependentRestore(ctx),/RECOVERY_DATABASE_ABSENCE_UNKNOWN/)
 }
})
