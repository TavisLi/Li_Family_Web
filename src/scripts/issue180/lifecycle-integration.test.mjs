import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { EventEmitter } from 'node:events'
import { startForeground } from './foreground.mjs'
import { prepareOwnership, verifyOwnership, createLifecycle } from './lifecycle.mjs'

// Only the OS/command boundary is simulated. No PostgreSQL binary is executed.
async function sandbox(t, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'i180-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const owner = await prepareOwnership(root, 'issue180-' + 'b'.repeat(32))
  const calls = [], pid = 42000
  const birth = new Date(Math.floor(Date.now()/1000)*1000).toUTCString()
    .replace(/^(\w+), (\d+) (\w+) (\d+) (.+) GMT$/, '$1 $3 $2 $5 $4')
  const data = path.join(owner.directory, 'data'), socket = path.join(owner.directory, 'socket')
  let database = false, stopped = false, closedResult = null, changedBirth = false
  const command = async (file, args, opts) => {
    const name = path.basename(file); calls.push({ name, args, opts })
    if (name === 'pg_config') return { stdout: 'PostgreSQL 17.11' }
    if (name === 'initdb') {
      if (options.initFailure) throw new Error('INIT_FAILED')
      await mkdir(data); await writeFile(path.join(data, 'postgresql.conf'), '')
      return { stdout: '' }
    }
    if (name === 'ps') {
      if (args.includes('-axo')) return { stdout: options.remainingProcess ? `42001 1 ${pid}\n` : '' }
      if (stopped) throw new Error('CHILD_FAILED:1:null')
      return { stdout: `${pid} ${process.pid} ${pid} ${changedBirth ? 'Mon Jan 01 00:00:00 2001' : birth}\n` }
    }
    if (name === 'pg_ctl') {
      assert.equal(args.at(-1), 'status', 'pg_ctl must never launch or signal a server')
      if (options.statusFailure) throw new Error('DEADLINE')
      if (stopped) throw new Error('CHILD_FAILED:3:null')
      return { stdout: '' }
    }
    assert.equal(name, 'psql')
    const sql = args.at(-1)
    if (sql.startsWith('CREATE DATABASE')) database = true
    if (sql.startsWith('DROP DATABASE')) database = false
    if(sql.includes('fresh_public_schema'))return {stdout:JSON.stringify({database:args[args.indexOf('-d')+1],directory:data,databaseOwner:'postgres',schemaOwner:'pg_database_owner',objects:0})}
    if(sql.includes('namespace_absent'))return {stdout:'t'}
    if (sql.includes('json_build_object')) return { stdout: JSON.stringify({ directory: data, port: '5432', socket, listen: '' }) }
    return { stdout: sql.includes('SELECT count') ? String(Number(database)) : '1' }
  }
  let launched = 0, stopCalls = 0
  const launch = (file, args, opts) => {
    launched++; calls.push({ name: path.basename(file), args, opts })
    assert.equal(path.basename(file), 'postgres')
    if (options.stalledStop) {
      const child = Object.assign(new EventEmitter(), { pid, kill(sig) { assert.equal(sig, 'SIGINT'); return true } })
      t.after(() => { child.emit('exit', 0, null); child.emit('close', 0, null) })
      return startForeground(file, args, { ...opts, spawnProcess: () => child })
    }
    return {
      pid, startedAt: Date.now(),
      get state() { return stopped ? 'closed' : 'running' },
      get result() { return closedResult },
      async stop({ deadline, signal }) {
        stopCalls++
        if(options.stopWarning) await writeFile(path.join(owner.directory,'server.log'),'WARNING: synthetic shutdown warning\n',{flag:'a'})
        assert.equal(signal, undefined, 'work abort must not suppress owned cleanup')
        assert(deadline > Date.now())
        if (options.stopUnknown) return { status: 'UNKNOWN', reason: 'EXIT_UNCONFIRMED' }
        stopped = true; closedResult = { code: options.abnormalExit ? 1 : 0, signal: null }
        await rm(path.join(data, 'postmaster.pid'), { force: true })
        if (!options.remainingSocket) await rm(path.join(socket, '.s.PGSQL.5432'), { force: true })
        return { status: 'PARENT_EXIT_CONFIRMED', result: closedResult }
      },
    }
  }
  const life = createLifecycle({ owner, command, launch })
  async function initialize() { await life.initialize({ deadline: Date.now()+3000 }) }
  async function pidfile(status = 'ready', wrongPid = false) {
    await writeFile(path.join(data, 'postmaster.pid'), `${wrongPid ? pid+1 : pid}\n${data}\n${Math.floor(Date.now()/1000)}\n5432\n${socket}\n\n0\n${status}\n`)
    await writeFile(path.join(socket, '.s.PGSQL.5432'), 'synthetic socket marker')
  }
  return { root, owner, life, calls, command, launch, initialize, pidfile, launchCount: () => launched, stopCount: () => stopCalls,
    changeBirth: () => { changedBirth = true } }
}

async function runPacket(s, additions = {}) {
  const { createHash } = await import('node:crypto')
  const { readFile } = await import('node:fs/promises')
  const { manifestHash } = await import('../run-contract.mjs')
  const { runLifecycle } = await import('./lifecycle.mjs')
  const root = process.cwd(), now = Date.now(), runId = s.owner.runId
  const artifact = async name => ({ path: name, sha256: createHash('sha256').update(await readFile(path.join(root, name))).digest('hex') })
  const manifest = { version: 1, runId, environment: 'disposable', target: `owned-unix:${runId}`,
    runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'lifecycle', envNames: [] }, schemaPush: 'disabled' },
    scope: { include: ['synthetic-lifecycle-only','issue180-gate-c-migration-up',...(additions.group==='plan-seed-diagnostic'?['issue180-gate-c-plan-seed-diagnostic','case:plan-seed']:[]),...(additions.cleanupProbe?['controlled-cleanup-probes']:[])], exclude: ['production'], expectedEffects: ['synthetic transport only'], stopConditions: ['drift'], baseline: 'synthetic' },
    artifacts: { executor: await artifact('src/scripts/issue180/lifecycle.mjs'), sql: [], backup: null,
      dependencies: await Promise.all(['package.json', 'pnpm-lock.yaml', 'src/scripts/issue180/child.mjs','src/scripts/issue180/warnings.mjs',
        'src/scripts/issue180/gate-c-worker.mjs','src/scripts/issue180/gate-c-worker-host.mjs','src/scripts/issue180/gate-c-writers.mjs','src/scripts/issue180/gate-c-access.mjs','src/scripts/issue180/gate-c-recovery.mjs','src/scripts/issue180/gate-c-observer.mjs','src/scripts/issue180/payload-runtime.mjs',
        'src/scripts/issue180/gate-c-runner.mjs','src/scripts/issue180/migration-prerequisites.mjs','src/scripts/issue180/snapshot-assertions.mjs','scripts/rehearsal/baselines/issue158-v12/schema.sql','src/migrations/20261031_052622_issue180_optional_geo.ts','src/scripts/issue180/foreground.mjs', 'src/scripts/issue180/executor.mjs', 'src/scripts/issue180/binding.mjs',
        'src/scripts/run-contract.mjs', 'src/scripts/run-executor-evidence.mjs', 'scripts/rehearsal/baselines/issue180/binding.json'].map(artifact)) },
    approval: { action: 'local', allowed: ['local'], excluded: ['production-migration'], validFrom: new Date(now-1000).toISOString(), validUntil: new Date(now+60000).toISOString() } }
  const approval = { source: 'SYNTHETIC-TEST-NOT-HUMAN', manifestSha256: manifestHash(manifest), action: 'local', environment: 'disposable', target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  const directory = path.join(s.root, 'evidence'); await mkdir(directory)
  const result = await runLifecycle({ root, binding: JSON.parse(await readFile('scripts/rehearsal/baselines/issue180/binding.json')),
    manifest, approval, ownership: { runId, target: manifest.target }, verifySource: async () => true,
    owner: s.owner, directory, deadline: now+3000, command: s.command, launch: s.launch, ...additions })
  return { result, receipt: JSON.parse(await readFile(path.join(directory, 'receipt.json'))) }
}
test('synthetic lifecycle integrates foreground and #105 receipt without claiming Gate C', async t => {
  const s = await sandbox(t)
  const command = async (...args) => {
    const result = await s.command(...args)
    if (path.basename(args[0]) === 'initdb') await s.pidfile()
    return result
  }
  const { result, receipt } = await runPacket(s, { command })
  assert.equal(result.status, 'PASS'); assert.equal(result.scope, 'lifecycle-smoke-only')
  assert.equal(receipt.gateC, 'NOT_EVALUATED'); assert.equal(receipt.cleanup.directoryAbsent, true)
})
test('worker output failure evidence reaches terminal receipt after owned cleanup',async t=>{
 const {createLifecycle}=await import('./lifecycle.mjs')
 const s=await sandbox(t),command=async(...args)=>{const result=await s.command(...args);if(path.basename(args[0])==='initdb')await s.pidfile();return result}
 const diagnosticRunner=async()=>{throw Object.assign(Error('WORKER_OUTPUT_CAP'),{
  effects:'UNKNOWN',workerOutputEvidence:{path:'worker.log',sha256:'a'.repeat(64),bytes:8388608,limit:8388608,truncated:true},
  workerOutputEvidenceStatus:'VERIFIED',originalWorkerFailure:{message:'UNEXPECTED_QUERY_FAILURE'},
 })}
 const {receipt}=await runPacket(s,{command,group:'plan-seed-diagnostic',diagnosticRunner,lifecycleFactory:options=>createLifecycle(options)})
 assert.equal(receipt.status,'BLOCK');assert.equal(receipt.failure.message,'WORKER_OUTPUT_CAP')
 assert.equal(receipt.failure.effects,'UNKNOWN');assert.equal(receipt.failure.workerOutputEvidence.sha256,'a'.repeat(64))
 assert.equal(receipt.failure.workerOutputEvidenceStatus,'VERIFIED')
 assert.equal(receipt.failure.originalWorkerFailure.message,'UNEXPECTED_QUERY_FAILURE')
 assert.equal(receipt.cleanup.directoryAbsent,true)
})
for(const cleanupProbe of ['failure','abort'])test('planned '+cleanupProbe+' reaches owned cleanup and independent #105 BLOCK receipt',async t=>{
 const s=await sandbox(t),command=async(...args)=>{const result=await s.command(...args);if(path.basename(args[0])==='initdb')await s.pidfile();return result}
 const {result,receipt}=await runPacket(s,{command,cleanupProbe})
 assert.equal(result.status,'BLOCK');assert.equal(receipt.failure.message,cleanupProbe==='failure'?'EXPECTED_CLEANUP_FAILURE':'INTERRUPTED')
 assert(receipt.cleanup.databaseAbsent && receipt.cleanup.serverStopped && receipt.cleanup.directoryAbsent)
})
for(const preexisting of [false,true])test('owned full backup/restore binding and preexisting recovery refusal: '+preexisting,async t=>{
 const s=await sandbox(t);let exists=preexisting
 const command=async(file,args,opts)=>{
  if(path.basename(file)==='pg_dump'){assert(!args.includes('--no-privileges'));await writeFile(args.at(-1),'synthetic SQL dump');return {stdout:'',stderr:''}}
  const sql=args.at(-1)
  if(path.basename(file)==='psql' && sql.includes('_restore')) {
   if(sql.startsWith('CREATE DATABASE'))exists=true
   if(sql.startsWith('DROP DATABASE'))exists=false
   return {stdout:sql.includes('SELECT count')?String(Number(exists)):''}
  }
  if(opts.restore)return {stdout:''}
  return s.command(file,args,opts)
 }
 const life=createLifecycle({owner:s.owner,command,launch:s.launch,evidenceDirectory:s.root}),opts={deadline:Date.now()+5000}
 await life.initialize(opts);await s.pidfile();await life.start(opts);await life.createDatabase(opts)
 const backup=await life.backup('populated-geo',opts)
 if(preexisting) {
  await assert.rejects(life.createOwnedRecoveryDatabase(opts),/RECOVERY_DATABASE_ALREADY_EXISTS/)
  await assert.rejects(life.cleanup(opts),/RECOVERY_PREEXISTING_PRESERVED/);await verifyOwnership(s.owner);assert(exists)
 } else {
  const recovery=await life.createOwnedRecoveryDatabase(opts)
  await assert.rejects(life.restoreToOwnedDatabase({...backup,sha256:'0'.repeat(64)},recovery,opts),/BACKUP_DRIFT/)
  await assert.rejects(life.restoreToOwnedDatabase(backup,{database:s.owner.database},opts),/RECOVERY_OWNERSHIP_MISMATCH/)
  await life.restoreToOwnedDatabase(backup,recovery,opts);await life.dropOwnedRecoveryDatabase(recovery,opts)
  await assert.rejects(life.createOwnedRecoveryDatabase(opts),/RECOVERY_REUSE_FORBIDDEN/)
  await life.cleanup(opts)
 }
})
test('readiness abort and cleanup UNKNOWN both survive terminal receipt', async t => {
  const s = await sandbox(t, { stopUnknown: true }), controller = new AbortController()
  const command = async (...args) => {
    const result = await s.command(...args)
    if (path.basename(args[0]) === 'initdb') await s.pidfile('starting')
    if (path.basename(args[0]) === 'ps' && !args[1].includes('-axo')) controller.abort()
    return result
  }
  const { result, receipt } = await runPacket(s, { command, signal: controller.signal })
  assert.equal(result.status, 'BLOCK'); assert.match(receipt.failure.message, /INTERRUPTED/)
  assert.equal(receipt.cleanup.status, 'UNKNOWN'); await verifyOwnership(s.owner)
})
test('actual supervisor cleanup deadline is enforced through lifecycle without removing resources', async t => {
  const s = await sandbox(t, { stalledStop: true }); await s.initialize(); await s.pidfile()
  await s.life.start({ deadline: Date.now()+1000 })
  const started = Date.now()
  await assert.rejects(s.life.cleanup({ deadline: started+30 }), /SERVER_STOP_UNKNOWN/)
  assert(Date.now()-started < 1000)
  await verifyOwnership(s.owner)
})
test('cleanup-only failure keeps effects UNKNOWN in a terminal receipt', async t => {
  const s = await sandbox(t, { stopUnknown: true })
  const command = async (...args) => {
    const result = await s.command(...args)
    if (path.basename(args[0]) === 'initdb') await s.pidfile()
    return result
  }
  const { receipt } = await runPacket(s, { command })
  assert.equal(receipt.failure, null); assert.equal(receipt.effects, 'UNKNOWN')
  assert.equal(receipt.status, 'BLOCK'); await verifyOwnership(s.owner)
})

test('direct foreground lifecycle verifies readiness, DB absence and independent stop before removal', async t => {
  const s = await sandbox(t); await s.initialize(); await s.pidfile()
  const opts = { deadline: Date.now()+3000 }
  await s.life.start(opts); await s.life.createDatabase(opts); await s.life.query('SELECT 1', opts)
  const result = await s.life.cleanup(opts)
  assert.equal(result.directoryAbsent, true); assert.equal(result.serverStopped, true)
  assert.equal(result.databaseAbsent, true); assert.equal(s.launchCount(), 1)
  await assert.rejects(access(s.owner.directory), { code: 'ENOENT' })
})
test('never-started lifecycle removes owned directory without DB or stop commands', async t => {
  const s = await sandbox(t)
  assert.equal((await s.life.cleanup({ deadline: Date.now()+1000 })).directoryAbsent, true)
  assert.equal(s.calls.length, 0)
})
test('command-only injection cannot fall through to the real foreground launcher', async t => {
  const s = await sandbox(t)
  assert.throws(() => createLifecycle({ owner: s.owner, command: s.command }), /FOREGROUND_TRANSPORT_REQUIRED/)
})
test('readiness deadline latches failure while cleanup has its independent bound', async t => {
  const s = await sandbox(t); await s.initialize(); await s.pidfile('starting')
  await assert.rejects(s.life.start({ deadline: Date.now()+30 }), /DEADLINE/)
  await assert.rejects(s.life.createDatabase({ deadline: Date.now()+1000 }), /DATABASE_CREATE_FORBIDDEN/)
  assert.equal((await s.life.cleanup({ deadline: Date.now()+1000 })).directoryAbsent, true)
})
test('incomplete initdb preserves resources without trying a DB connection', async t => {
  const s = await sandbox(t, { initFailure: true })
  await assert.rejects(s.initialize(), /INIT_FAILED/)
  await assert.rejects(s.life.cleanup({ deadline: Date.now()+1000 }), /INIT_TERMINATION_UNKNOWN/)
  assert(!s.calls.some(x => x.name === 'psql')); await verifyOwnership(s.owner)
})
test('wrong postmaster PID refuses ready and never signals or removes an unverified target', async t => {
  const s = await sandbox(t); await s.initialize(); await s.pidfile('ready', true)
  await assert.rejects(s.life.start({ deadline: Date.now()+1000 }), /POSTMASTER_IDENTITY/)
  await assert.rejects(s.life.cleanup({ deadline: Date.now()+1000 }), /POSTMASTER_IDENTITY/)
  assert.equal(s.stopCount(), 0); await verifyOwnership(s.owner)
})
test('abort while waiting for ready stops the owned parent, skips DB and forbids restart', async t => {
  const s = await sandbox(t); await s.initialize(); await s.pidfile('starting')
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30)
  try { await assert.rejects(s.life.start({ deadline: Date.now()+1000, signal: controller.signal }), /INTERRUPTED/) }
  finally { clearTimeout(timer) }
  const result = await s.life.cleanup({ deadline: Date.now()+1000 })
  assert.equal(result.directoryAbsent, true); assert(!s.calls.some(x => x.name === 'psql'))
  await assert.rejects(s.life.start({ deadline: Date.now()+1000 }), /RESTART_FORBIDDEN/)
})
test('PID birth mismatch refuses to signal or remove resources', async t => {
  const s = await sandbox(t); await s.initialize(); await s.pidfile(); await s.life.start({ deadline: Date.now()+1000 })
  s.changeBirth()
  await assert.rejects(s.life.cleanup({ deadline: Date.now()+1000 }), /PROCESS_IDENTITY/)
  assert.equal(s.stopCount(), 0); await verifyOwnership(s.owner)
})
for (const option of ['stopUnknown', 'abnormalExit', 'remainingSocket', 'remainingProcess', 'statusFailure']) {
  test(`${option} retains directory and cannot claim cleanup PASS`, async t => {
    const s = await sandbox(t, { [option]: true }); await s.initialize(); await s.pidfile()
    await s.life.start({ deadline: Date.now()+1000 })
    await assert.rejects(s.life.cleanup({ deadline: Date.now()+1000 }), /UNKNOWN|ABSENCE/)
    await verifyOwnership(s.owner)
  })
}
test('command WARNING stops before initdb, preserves raw warning in terminal receipt', async t=>{
  const s=await sandbox(t)
  const command=async(...args)=>{
    const result=await s.command(...args)
    if(path.basename(args[0])==='pg_config') result.stderr='WARNING: synthetic command warning\n'
    return result
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.status,'BLOCK')
  assert(!s.calls.some(x=>x.name==='initdb'))
  assert.equal(receipt.warnings[0].stderr,'WARNING: synthetic command warning\n')
  assert.equal(receipt.effects,'UNKNOWN')
})
test('foreground log WARNING stops before CREATE DATABASE and survives owned cleanup',async t=>{
  const s=await sandbox(t)
  const command=async(...args)=>{
    const result=await s.command(...args)
    if(path.basename(args[0])==='initdb') await s.pidfile()
    if(path.basename(args[0])==='psql' && args[1].at(-1).includes('json_build_object'))
      await writeFile(path.join(s.owner.directory,'server.log'),'2026-11-01 00:00:00 UTC [42000] WARNING: synthetic server warning\n',{flag:'a'})
    return result
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.status,'BLOCK');assert.equal(receipt.cleanup.directoryAbsent,true)
  assert(!s.calls.some(x=>x.name==='psql' && x.args.at(-1).startsWith('CREATE DATABASE')))
  assert(receipt.warnings.some(x=>x.source==='foreground-log'))
  assert.match(await readFile(path.join(s.root,'evidence','foreground.log'),'utf8'),/WARNING: synthetic server warning/)
  assert.equal(receipt.effects,'UNKNOWN')
})
test('normal stderr NOTICE and LOG are not warning severity',async t=>{
  const s=await sandbox(t)
  const command=async(...args)=>{
    const result=await s.command(...args);result.stderr='NOTICE: routine synthetic message\nLOG: routine synthetic stderr\n'
    if(path.basename(args[0])==='initdb') await s.pidfile()
    return result
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.status,'PASS');assert.deepEqual(receipt.warnings,[])
})
test('warning during cleanup is retained and cannot turn into PASS',async t=>{
  const s=await sandbox(t)
  const command=async(...args)=>{
    const result=await s.command(...args)
    if(path.basename(args[0])==='initdb') await s.pidfile()
    if(path.basename(args[0])==='psql' && args[1].at(-1).startsWith('DROP DATABASE')) result.stderr='psql: WARNING: synthetic cleanup warning\n'
    return result
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.status,'BLOCK');assert.equal(receipt.cleanup.directoryAbsent,true)
  assert.equal(receipt.stopReason,'WARNING_STOP');assert.equal(receipt.effects,'UNKNOWN')
  assert(receipt.warnings.some(x=>x.stderr==='psql: WARNING: synthetic cleanup warning\n'))
})
test('nonzero command preserves original failure and WARNING diagnostics',async t=>{
  const s=await sandbox(t)
  const command=async(...args)=>{
    if(path.basename(args[0])==='pg_config') throw Object.assign(new Error('SYNTHETIC_COMMAND_FAILURE'),{stdout:'',stderr:'pg_config: WARNING: original diagnostic\n'})
    return s.command(...args)
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.failure.message,'SYNTHETIC_COMMAND_FAILURE');assert.equal(receipt.stopReason,'WARNING_STOP')
  assert.equal(receipt.warnings[0].stderr,'pg_config: WARNING: original diagnostic\n');assert.equal(receipt.effects,'UNKNOWN')
})
test('late WARNING while waiting for readiness cannot advance to DB creation',async t=>{
  const s=await sandbox(t);await s.initialize();await s.pidfile('starting')
  const timer=setTimeout(()=>writeFile(path.join(s.owner.directory,'server.log'),'WARNING: late startup diagnostic\n',{flag:'a'}),15)
  try {await assert.rejects(s.life.start({deadline:Date.now()+1000}),/WARNING_STOP/)} finally{clearTimeout(timer)}
  await assert.rejects(s.life.createDatabase({deadline:Date.now()+1000}),/DATABASE_CREATE_FORBIDDEN|WARNING_STOP/)
  assert.equal((await s.life.cleanup({deadline:Date.now()+1000})).directoryAbsent,true)
  assert(!s.calls.some(x=>x.name==='psql'))
})
test('foreground WARNING emitted while stopping is retained and prevents PASS',async t=>{
  const s=await sandbox(t,{stopWarning:true})
  const command=async(...args)=>{
    const result=await s.command(...args)
    if(path.basename(args[0])==='initdb') await s.pidfile()
    return result
  }
  const {receipt}=await runPacket(s,{command})
  assert.equal(receipt.status,'BLOCK');assert.equal(receipt.cleanup.directoryAbsent,true)
  assert.equal(receipt.stopReason,'WARNING_STOP')
  assert(receipt.warnings.some(x=>x.source==='foreground-log' && x.stdout.includes('synthetic shutdown warning')))
})
for(const failObserver of [false,true])test('migration vertical path: real up, independent observer, cleanup and receipt '+(failObserver?'observer rejection':'success'),async t=>{
 const {inspectMigrationBaseline}=await import('./migration-prerequisites.mjs')
 const pre=inspectMigrationBaseline(await readFile('scripts/rehearsal/baselines/issue158-v12/schema.sql','utf8'),await readFile('src/migrations/20261031_052622_issue180_optional_geo.ts','utf8'))
 const s=await sandbox(t);let migrated=false
 const command=async(...args)=>{
  const tool=path.basename(args[0]),argv=args[1],sql=argv.at(-1)
  if(tool==='psql' && sql.startsWith('BEGIN;')){assert(sql.includes('CREATE TABLE "geo_stops"'));migrated=true;return {stdout:''}}
  if(tool==='psql' && sql.includes('FROM public.payload_migrations t'))return {stdout:JSON.stringify(migrated?[{id:1,name:'20261031_052622_issue180_optional_geo',batch:1}]:[])}
  if(tool==='psql' && sql.includes('FROM pg_tables'))return {stdout:'["payload_migrations"]'}
  if(tool==='psql' && sql.includes('information_schema.columns'))return {stdout:JSON.stringify(failObserver?[]:pre.added.map(x=>({table_name:x.table,column_name:x.column,is_nullable:'YES'})))}
  if(tool==='psql' && sql.includes('information_schema.table_privileges'))return {stdout:'[]'}
  if(tool==='psql' && sql.includes('FROM pg_class'))return {stdout:JSON.stringify(pre.created.map(relname=>({relname,relrowsecurity:true})))}
  if(tool==='psql' && sql.includes('SELECT count(*) FROM public.'))return {stdout:'0'}
  if(tool==='psql' && sql.startsWith('SELECT coalesce(jsonb_agg'))return {stdout:JSON.stringify(migrated?[{name:'current migration'}]:[])}
  const result=await s.command(...args)
  if(tool==='initdb')await s.pidfile()
  return result
 }
 const {receipt}=await runPacket(s,{command,group:'migration-up'})
 assert(migrated);assert.equal(receipt.cleanup.directoryAbsent,true)
 assert.equal(receipt.status,failObserver?'BLOCK':'PASS')
 assert.equal(receipt.scope,'gate-c-migration-up-only')
 if(failObserver)assert.match(receipt.failure.message,/NULLABLE_COLUMN_MISSING/)
})

for(const target of ['main','recovery'])for(const state of ['empty','nonempty','owner','database','directory','readback'])test('SP4 fresh public schema initialization '+target+': '+state,async t=>{
 const s=await sandbox(t),schemas=new Set(),drops=[]
 const command=async(...args)=>{
  const [file,argv]=args,sql=argv.at(-1),db=argv[argv.indexOf('-d')+1]
  const result=await s.command(...args)
  if(path.basename(file)==='initdb')await s.pidfile()
  if(path.basename(file)!=='psql')return result
  if(sql.startsWith('CREATE DATABASE'))schemas.add(sql.match(/"([^"]+)"/)[1])
  const injected=target==='main'||db?.endsWith('_restore')?state:'empty'
  if(sql.includes('fresh_public_schema') && target==='recovery' && injected==='readback')throw Error('RECOVERY_PUBLIC_SCHEMA_READBACK_FAILED')
  if(sql.includes('fresh_public_schema'))return {stdout:JSON.stringify({database:injected==='database'?'wrong':db,directory:injected==='directory'?'/wrong':path.join(s.owner.directory,'data'),databaseOwner:'postgres',schemaOwner:injected==='owner'?'unexpected':'pg_database_owner',objects:injected==='nonempty'?1:0})}
  if(sql==='DROP SCHEMA public RESTRICT'){assert(schemas.has(db));schemas.delete(db);drops.push(db);return {stdout:''}}
  if(sql.includes('namespace_absent'))return {stdout:injected==='readback'?'f':'t'}
  if(sql.includes('SELECT count') && sql.includes('_restore'))return {stdout:'0'}
  return result
 }
 const life=createLifecycle({owner:s.owner,command,launch:s.launch}),opts={deadline:Date.now()+3000}
 await life.initialize(opts);await life.start(opts)
 const operation=target==='main'?()=>life.createDatabase(opts):async()=>{await life.createDatabase(opts);return life.createOwnedRecoveryDatabase(opts)}
 if(state==='empty') {await operation();assert.equal(drops.length,1)}
 else {await assert.rejects(operation(),/FRESH_SCHEMA|RECOVERY_PUBLIC_SCHEMA/);assert.equal(drops.length,target==='recovery'?1:(state==='readback'?1:0))}
 await verifyOwnership(s.owner)
})

for(const fault of ['drop','readback','marker'])for(const identityDrift of [false,true])test('ST1 recovery '+fault+' retains work error and cleanup UNKNOWN; identity drift '+identityDrift,async t=>{
 const s=await sandbox(t);let recovery=false,dropped=false
 const command=async(...args)=>{
  const [file,argv]=args,sql=argv.at(-1)
  if(path.basename(file)==='psql' && sql.includes('_restore') && !sql.includes('fresh_public_schema')) {
   if(sql.startsWith('CREATE DATABASE')){recovery=true;return {stdout:''}}
   if(sql.startsWith('DROP DATABASE')){if(identityDrift)s.changeBirth();if(fault==='drop')throw Error('RECOVERY_DROP_ORIGINAL');recovery=false;dropped=true;return {stdout:''}}
   if(sql.includes('SELECT count'))return {stdout:String(Number(recovery || (fault==='readback' && dropped)))}
  }
  const result=await s.command(...args);if(path.basename(file)==='initdb')await s.pidfile()
  if(fault==='marker' && identityDrift && path.basename(file)==='psql' && sql.startsWith('DROP DATABASE'))s.changeBirth()
  return result
 }
 const lifecycleFactory=args=>{
  const life=createLifecycle(args),query=life.query.bind(life)
  life.query=async(sql,opts)=>{
   if(sql==='SELECT 1') {
    await life.createOwnedRecoveryDatabase(opts)
    if(fault==='marker'){await writeFile(path.join(s.owner.directory,'recovery-owner.json'),'{}')}
    throw Error('ORIGINAL_WORK_FAILURE')
   }
   return query(sql,opts)
  }
  return life
 }
 const {receipt}=await runPacket(s,{command,lifecycleFactory})
 assert.equal(receipt.failure.message,'ORIGINAL_WORK_FAILURE')
 assert.equal(receipt.cleanup.status,'UNKNOWN');assert.equal(receipt.effects,'UNKNOWN')
 assert.equal(s.stopCount(),identityDrift?0:1)
 assert.match(receipt.cleanup.evidence.recoveryError.message,fault==='drop'?/RECOVERY_DROP_ORIGINAL/:fault==='readback'?/RECOVERY_DATABASE_ABSENCE_UNKNOWN/:/RECOVERY_MARKER_DRIFT/)
 if(!identityDrift)assert.equal(receipt.cleanup.evidence.processAbsence,'VERIFIED')
 await verifyOwnership(s.owner)
})
test('recovery restore requires independently verified empty public schema before dump replay',async t=>{
 const s=await sandbox(t);let exists=false,verified=false
 const command=async(file,args,opts)=>{
  const name=path.basename(file),sql=args.at(-1),db=args[args.indexOf('-d')+1]
  if(name==='pg_dump'){await writeFile(args.at(-1),'synthetic SQL dump');return {stdout:'',stderr:''}}
  if(opts.restore){assert(verified,'RECOVERY_PUBLIC_SCHEMA_NOT_READY');return {stdout:'',stderr:''}}
  if(name==='psql' && sql.startsWith('CREATE DATABASE') && sql.includes('_restore')){exists=true;return {stdout:''}}
  if(name==='psql' && sql.includes('SELECT count') && sql.includes('_restore'))return {stdout:String(Number(exists))}
  if(name==='psql' && db?.endsWith('_restore') && /^(DROP|CREATE) SCHEMA/.test(sql))throw Error('RECOVERY_SCHEMA_MUST_BE_RETAINED')
  if(name==='psql' && db?.endsWith('_restore') && sql.includes('fresh_public_schema'))verified=true
  return s.command(file,args,opts)
 }
 const life=createLifecycle({owner:s.owner,command,launch:s.launch,evidenceDirectory:s.root}),opts={deadline:Date.now()+5000}
 await life.initialize(opts);await s.pidfile();await life.start(opts);await life.createDatabase(opts)
 const backup=await life.backup('populated-geo',opts),recovery=await life.createOwnedRecoveryDatabase(opts)
 await life.restoreToOwnedDatabase(backup,recovery,opts)
})
for(const fault of ['owner','nonempty','database','directory','readback'])test('recovery schema '+fault+' blocks before replay',async t=>{
 const s=await sandbox(t);let replayed=false
 const command=async(file,args,opts)=>{
  const name=path.basename(file),sql=args.at(-1),db=args[args.indexOf('-d')+1]
  if(opts.restore){replayed=true;throw Error('REPLAY_MUST_NOT_START')}
  if(name==='psql' && sql.startsWith('CREATE DATABASE') && sql.includes('_restore'))return {stdout:''}
  if(name==='psql' && sql.includes('SELECT count') && sql.includes('_restore'))return {stdout:'0'}
  if(name==='psql' && db?.endsWith('_restore') && /^(DROP|CREATE) SCHEMA/.test(sql))throw Error('RECOVERY_SCHEMA_MUST_BE_RETAINED')
  if(name==='psql' && db?.endsWith('_restore') && sql.includes('fresh_public_schema')) {
   if(fault==='readback')throw Error('SCHEMA_READBACK_FAILED')
   return {stdout:JSON.stringify({database:fault==='database'?'wrong':db,directory:fault==='directory'?'/wrong':path.join(s.owner.directory,'data'),databaseOwner:'postgres',schemaOwner:fault==='owner'?'other':'pg_database_owner',objects:fault==='nonempty'?1:0})}
  }
  return s.command(file,args,opts)
 }
 const life=createLifecycle({owner:s.owner,command,launch:s.launch}),opts={deadline:Date.now()+5000}
 await life.initialize(opts);await s.pidfile();await life.start(opts);await life.createDatabase(opts)
 await assert.rejects(life.createOwnedRecoveryDatabase(opts),/RECOVERY_PUBLIC_SCHEMA_UNKNOWN|SCHEMA_READBACK_FAILED/)
 assert.equal(replayed,false)
})
test('worker exit evidence reaches terminal BLOCK receipt after owned cleanup',async t=>{
 const s=await sandbox(t),command=async(...args)=>{const result=await s.command(...args);if(path.basename(args[0])==='initdb')await s.pidfile();return result}
 const diagnosticRunner=async()=>{throw Object.assign(Error('WORKER_EXIT_OR_RESULT_UNKNOWN'),{workerExitEvidence:{path:'worker-exit-evidence.json',sha256:'c'.repeat(64)},workerExitEvidenceStatus:'VERIFIED'})}
 const {receipt}=await runPacket(s,{command,group:'plan-seed-diagnostic',diagnosticRunner,lifecycleFactory:options=>createLifecycle(options)})
 assert.equal(receipt.status,'BLOCK');assert.equal(receipt.failure.message,'WORKER_EXIT_OR_RESULT_UNKNOWN');assert.equal(receipt.failure.workerExitEvidenceStatus,'VERIFIED');assert.equal(receipt.failure.workerExitEvidence.sha256,'c'.repeat(64));assert.equal(receipt.cleanup.directoryAbsent,true)
})
