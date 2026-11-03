import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile, lstat, open, chmod } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, createHash } from 'node:crypto'
import { runChild } from './child.mjs'
import { warningLines } from './warnings.mjs'
import { startForeground } from './foreground.mjs'
import { setTimeout as delay } from 'node:timers/promises'
import { admission } from './executor.mjs'
import { fileEvidenceSink } from '../run-executor-evidence.mjs'
import { manifestHash } from '../run-contract.mjs'

const BIN = '/opt/homebrew/opt/postgresql@17/bin'
const validRun = id => /^issue180-[a-f0-9]{32}$/.test(id)
const dbName = id => `issue180_${id.slice(9)}`

// Fresh directories are created only inside a caller-supplied, separately approved root.
export async function prepareOwnership(root, runId) {
  assert(validRun(runId), 'BLOCK: run ID')
  const parent = await realpath(root)
  const directory = await mkdtemp(path.join(parent, `${runId}-`))
  const owner = { version: 1, runId, directory, database: dbName(runId), nonce: randomBytes(32).toString('hex') }
  await writeFile(path.join(directory, 'owner.json'), JSON.stringify(owner), { flag: 'wx', mode: 0o600 })
  await mkdir(path.join(directory, 'socket'), { mode: 0o700 })
  await mkdir(path.join(directory, 'home'), { mode: 0o700 })
  return owner
}
export async function verifyOwnership(owner) {
  assert(validRun(owner?.runId) && owner.database === dbName(owner.runId), 'BLOCK: owner identity')
  assert.equal((await lstat(owner.directory)).isSymbolicLink(), false, 'BLOCK: symlink owner')
  assert.equal(await realpath(owner.directory), owner.directory, 'BLOCK: owner path drift')
  for (const entry of ['owner.json','socket','home','data']) {
    try { assert(!(await lstat(path.join(owner.directory,entry))).isSymbolicLink(), 'BLOCK: owned path symlink') }
    catch (error) { if (entry !== 'data' || error.code !== 'ENOENT') throw error }
  }
  const saved = JSON.parse(await readFile(path.join(owner.directory, 'owner.json'), 'utf8'))
  assert.deepEqual(saved, owner, 'BLOCK: owner marker drift')
  return owner
}

export function createLifecycle({ owner, command = runChild, launch = startForeground, evidenceDirectory }) {
  assert(command === runChild || launch !== startForeground, 'FOREGROUND_TRANSPORT_REQUIRED: custom command requires an explicit launcher')
  const data = path.join(owner.directory, 'data'), socket = path.join(owner.directory, 'socket')
  const env = { PATH: `${BIN}:/usr/bin:/bin`, HOME: path.join(owner.directory, 'home'), LANG: 'C', LC_ALL: 'C', TZ: 'UTC',
    PGSERVICEFILE: path.join(owner.directory, 'home', 'service'), PGPASSFILE: path.join(owner.directory, 'home', 'pass'),
    PGOPTIONS: '-c statement_timeout=10000 -c lock_timeout=2000 -c timezone=UTC' }
  let initAttempted = false, initialized = false, startAttempted = false, ready = false
  let server, identity, createAttempted = false, cleaned = false
  let recoveryRecord, recoveryAttempted = false,unexpectedRecovery=false
  let cleanupEvidence = { phase: 'NOT_STARTED', stop: 'NOT_ATTEMPTED', processAbsence: 'UNKNOWN', socketAbsence: 'UNKNOWN' }
  let cleanupMode = false
  const warnings = [], warningKeys = new Set()
  const observe = (source, stdout='', stderr='') => {
    const lines = [...warningLines(stdout),...warningLines(stderr)]
    if(!lines.length) return
    const key = source+'\0'+lines.join('\n')
    if(!warningKeys.has(key)) { warningKeys.add(key);warnings.push({source,stdout,stderr,lines,at:new Date().toISOString()}) }
  }
  const scanLog = async () => {
    const log = path.join(owner.directory,'server.log')
    try {
      const stat = await lstat(log)
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 8*1024*1024,'LOG_READBACK_UNKNOWN')
      observe('foreground-log',await readFile(log,'utf8'))
    } catch(error) { if(error.code !== 'ENOENT') throw error }
  }
  const guard = opts => {
    assert(cleanupMode || warnings.length === 0,'WARNING_STOP')
    assert(!opts.signal?.aborted, 'INTERRUPTED')
    assert(Number.isFinite(opts.deadline) && Date.now() < opts.deadline, 'DEADLINE')
  }
  const call = async (name, args, opts) => {
    guard(opts); await verifyOwnership(owner); await scanLog(); guard(opts)
    let result
    try { result = await command(name.startsWith('/') ? name : path.join(BIN, name), args, { ...opts, deadline: Math.min(opts.deadline,Date.now()+(name === 'pg_dump' || opts.restore ? 180000 : name === 'psql' ? 15000 : name === 'initdb' ? 60000 : 5000)), env }) }
    catch(error) { observe('command:'+name,error.stdout,error.stderr);await scanLog();throw error }
    observe('command:'+name,result.stdout,result.stderr);await scanLog()
    guard(opts); return result
  }
  const psql = (database, sql, opts) => call('psql', ['-X', '-h', socket, '-p', '5432', '-U', 'postgres', '-d', database,
    '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], opts)
  const freshSchemaQuery="SELECT json_build_object('database',current_database(),'directory',current_setting('data_directory'),'databaseOwner',(SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname=current_database()),'schemaOwner',(SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname='public'),'objects',(SELECT count(*) FROM pg_depend WHERE refclassid='pg_namespace'::regclass AND refobjid='public'::regnamespace)) AS fresh_public_schema"
  // Only called immediately after this lifecycle created the exact database.
  const inspectFreshSchema = async (database,opts,restore=false) => {
    await processIdentity(opts);assert((await pidfile())?.ready,'FRESH_SCHEMA_SERVER_NOT_READY')
    const state=JSON.parse((await psql(database,freshSchemaQuery,opts)).stdout)
    assert(state.database===database && state.directory===data && state.databaseOwner==='postgres' && (restore?state.schemaOwner==='pg_database_owner':['postgres','pg_database_owner'].includes(state.schemaOwner)) && state.objects===0,restore?'RECOVERY_PUBLIC_SCHEMA_UNKNOWN':'FRESH_SCHEMA_PRECONDITION')
  }
  // RESTRICT is the final race-safe check; never remove an occupied namespace.
  const initializeFreshSchema = async (database,opts) => {
    await inspectFreshSchema(database,opts)
    await psql(database,'DROP SCHEMA public RESTRICT',opts)
    assert.equal((await psql(database,"SELECT NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='public') AS namespace_absent",opts)).stdout.trim(),'t','FRESH_SCHEMA_ABSENCE_UNKNOWN')
  }
  const verifyRecovery = async (recovery,opts) => {
    await verifyOwnership(owner)
    assert(recoveryRecord && recovery.database === owner.database+'_restore' && recovery.database===recoveryRecord.database,'RECOVERY_OWNERSHIP_MISMATCH')
    const marker=path.join(owner.directory,'recovery-owner.json'),stat=await lstat(marker)
    assert(stat.isFile() && !stat.isSymbolicLink(),'RECOVERY_MARKER_UNSAFE')
    assert.deepEqual(JSON.parse(await readFile(marker,'utf8')),recoveryRecord,'RECOVERY_MARKER_DRIFT')
    await processIdentity(opts);assert((await pidfile())?.ready,'RECOVERY_SERVER_NOT_READY')
  }
  const absent = async file => {
    try { await lstat(file); return false } catch (error) { if (error.code === 'ENOENT') return true; throw error }
  }
  const pidfile = async () => {
    const file = path.join(data, 'postmaster.pid')
    if (await absent(file)) return null
    const stat = await lstat(file)
    assert(stat.isFile() && !stat.isSymbolicLink(), 'POSTMASTER_IDENTITY: unsafe PID file')
    const lines = (await readFile(file, 'utf8')).split('\n')
    // PostgreSQL fills the lock file progressively; an incomplete file is not ready.
    if (lines.length < 3) return null
    assert(Number(lines[0]) === server.pid && lines[1] === data, 'POSTMASTER_IDENTITY: PID or directory')
    const started = Number(lines[2]) * 1000
    assert(Number.isFinite(started) && Math.abs(started - server.startedAt) < 3000, 'POSTMASTER_IDENTITY: start time')
    if (lines[7]?.trim() !== 'ready') return { ready: false }
    assert(lines[3] === '5432' && lines[4] === socket && lines[5] === '', 'POSTMASTER_IDENTITY: endpoint')
    return { ready: true }
  }
  const processIdentity = async opts => {
    assert(server?.state === 'running', 'PROCESS_IDENTITY: parent not live')
    const result = await call('/bin/ps', ['-p', String(server.pid), '-o', 'pid=,ppid=,pgid=,lstart='], opts)
    const match = result.stdout.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/)
    assert(match && Number(match[1]) === server.pid && Number(match[2]) === process.pid && Number(match[3]) === server.pid,
      'PROCESS_IDENTITY: PID, parent or group drift')
    // ps is run with TZ=UTC; its lstart output omits an explicit timezone.
    const started = Date.parse(`${match[4]} UTC`)
    assert(Number.isFinite(started) && Math.abs(started - server.startedAt) < 3000, 'PROCESS_IDENTITY: reused PID')
    assert(!identity || identity === match[4], 'PROCESS_IDENTITY: birth changed')
    identity = match[4]
    assert(server.state === 'running', 'PROCESS_IDENTITY: parent exited during readback')
  }
  const removeOwnedDirectory = async (opts, evidence) => {
    guard(opts); await verifyOwnership(owner)
    await scanLog()
    if(evidenceDirectory) {
      try { await writeFile(path.join(evidenceDirectory,'foreground.log'),await readFile(path.join(owner.directory,'server.log')),{flag:'wx',mode:0o600}) }
      catch(error) { if(error.code !== 'ENOENT') throw error }
    }
    await rm(owner.directory, { recursive: true, force: false })
    assert(await absent(owner.directory), 'DIRECTORY_ABSENCE_UNKNOWN')
    cleaned = true
    return { databaseAbsent: true, serverStopped: true, directoryAbsent: true, evidence }
  }
  return {
    getWarnings() { return structuredClone(warnings) },
    async assertWorkAllowed(opts) {guard(opts);await verifyOwnership(owner);await scanLog();guard(opts)},
    getCleanupEvidence() { return { ...cleanupEvidence } },
    async initialize(opts) {
      assert(!initAttempted && !startAttempted && !cleaned, 'REINITIALIZE_FORBIDDEN')
      assert(!cleanupMode,'CLEANUP_STARTED')
      const version = await call('pg_config', ['--version'], opts)
      assert.match(version.stdout.trim(), /^PostgreSQL 17\.11(?:\b|$)/, 'BLOCK: PostgreSQL version drift')
      initAttempted = true
      await call('initdb', ['-D', data, '-U', 'postgres', '--auth-local=trust', '--auth-host=reject', '--encoding=UTF8', '--locale=C', '--no-instructions'], opts)
      await verifyOwnership(owner)
      await writeFile(path.join(data, 'postgresql.conf'), `\nlisten_addresses=''\nport=5432\nunix_socket_directories='${socket.replaceAll("'", "''")}'\nstatement_timeout='10s'\nlock_timeout='2s'\nlogging_collector=off\nrestart_after_crash=off\n`, { flag: 'a' })
      initialized = true
    },
    async start(opts) {
      assert(!startAttempted && !cleaned, 'RESTART_FORBIDDEN')
      assert(!cleanupMode,'CLEANUP_STARTED')
      guard(opts); await verifyOwnership(owner)
      assert(initialized, 'INITIALIZE_REQUIRED')
      startAttempted = true
      const log = await open(path.join(owner.directory, 'server.log'), 'wx', 0o600)
      try {
        await verifyOwnership(owner); guard(opts)
        server = launch(path.join(BIN, 'postgres'), ['-D', data], { env, logFd: log.fd })
      }
      finally { await log.close() }
      await processIdentity(opts)
      while (true) {
        await verifyOwnership(owner);await scanLog();guard(opts)
        assert(server.state === 'running', 'SERVER_EXITED_BEFORE_READY')
        if ((await pidfile())?.ready) break
        try { await delay(Math.min(50, Math.max(1, opts.deadline - Date.now())), undefined, { signal: opts.signal }) }
        catch (error) { if (opts.signal?.aborted) throw new Error('INTERRUPTED'); throw error }
      }
      await processIdentity(opts)
      const response = await psql('postgres', "SELECT json_build_object('directory',current_setting('data_directory'),'port',current_setting('port'),'socket',current_setting('unix_socket_directories'),'listen',current_setting('listen_addresses'))", opts)
      assert.deepEqual(JSON.parse(response.stdout), { directory: data, port: '5432', socket, listen: '' }, 'READINESS_TARGET_MISMATCH')
      ready = true
    },
    async createDatabase(opts) {
      assert(!cleanupMode,'CLEANUP_STARTED')
      assert(ready && !cleaned && !createAttempted, 'DATABASE_CREATE_FORBIDDEN')
      await processIdentity(opts); assert((await pidfile())?.ready, 'SERVER_NOT_READY')
      createAttempted = true
      await psql('postgres', `CREATE DATABASE "${owner.database}" TEMPLATE template0`, opts)
      await initializeFreshSchema(owner.database,opts)
    },
    async loadSQLFile(file,opts) {
      assert(ready && createAttempted && !cleaned && !cleanupMode,'DATABASE_NOT_READY')
      await processIdentity(opts);assert((await pidfile())?.ready,'SERVER_NOT_READY')
      return call('psql',['-X','-h',socket,'-p','5432','-U','postgres','-d',owner.database,'-v','ON_ERROR_STOP=1','-f',await realpath(file)],opts)
    },
    async query(sql, opts) {
      assert(!cleanupMode,'CLEANUP_STARTED')
      assert(ready && createAttempted && !cleaned, 'DATABASE_NOT_READY')
      assert(typeof sql === 'string' && sql.length > 0, 'BLOCK: empty query')
      await processIdentity(opts); assert((await pidfile())?.ready, 'SERVER_NOT_READY')
      return psql(owner.database, sql, opts)
    },
    async backup(label,opts) {
      assert(ready && createAttempted && !cleanupMode && evidenceDirectory && /^[a-z][a-z0-9-]*$/.test(label),'BACKUP_SCOPE')
      await processIdentity(opts);assert((await pidfile())?.ready,'SERVER_NOT_READY')
      const file=path.join(evidenceDirectory,label+'.sql')
      const handle=await open(file,'wx',0o600);await handle.close()
      await call('pg_dump',['-h',socket,'-p','5432','-U','postgres','-d',owner.database,'--no-password','--format=plain','--file',file],{...opts,deadline:Math.min(opts.deadline,Date.now()+180000)})
      const stat=await lstat(file);assert(stat.isFile() && !stat.isSymbolicLink() && stat.size>0 && stat.size<=32*1024*1024,'BACKUP_SIZE_OR_TYPE')
      await chmod(file,0o600)
      return {path:file,database:owner.database,sha256:createHash('sha256').update(await readFile(file)).digest('hex')}
    },
    async verifyClientAbsence(pid,opts) {
      assert(Number.isSafeInteger(pid) && pid>1 && pid!==server?.pid,'CLIENT_IDENTITY_INVALID')
      const result=await call('/bin/ps',['-axo','pid=,ppid=,pgid='],opts)
      const rows=result.stdout.trim().split('\n').filter(Boolean).map(line=>line.trim().split(/\s+/).map(Number))
      assert(rows.every(row=>row.length===3 && row.every(Number.isInteger)),'CLIENT_PROCESS_ABSENCE_UNKNOWN')
      assert(!rows.some(([id,parent,group])=>id===pid || parent===pid || group===pid),'CLIENT_PROCESS_ABSENCE_UNKNOWN')
      return {pid,processGroupAbsence:'VERIFIED'}
    },
    async createOwnedRecoveryDatabase(opts) {
      assert(!recoveryRecord && ready && !cleanupMode,'RECOVERY_REUSE_FORBIDDEN')
      recoveryRecord={runId:owner.runId,database:owner.database+'_restore',sourceDatabase:owner.database,nonce:owner.nonce}
      await verifyOwnership(owner)
      await processIdentity(opts);assert((await pidfile())?.ready,'SERVER_NOT_READY')
      const exists=await psql('postgres',`SELECT count(*) FROM pg_database WHERE datname='${recoveryRecord.database}'`,opts)
      unexpectedRecovery=exists.stdout.trim()!=='0'
      assert.equal(exists.stdout.trim(),'0','RECOVERY_DATABASE_ALREADY_EXISTS')
      await writeFile(path.join(owner.directory,'recovery-owner.json'),JSON.stringify(recoveryRecord),{flag:'wx',mode:0o600})
      recoveryAttempted=true
      await psql('postgres',`CREATE DATABASE "${recoveryRecord.database}" TEMPLATE template0`,opts)
      // Standard pg_dump omits CREATE SCHEMA for public. Preserve template0's
      // verified empty namespace and default ACLs for the subsequent replay.
      await inspectFreshSchema(recoveryRecord.database,opts,true)
      return {database:recoveryRecord.database}
    },
    async restoreToOwnedDatabase(backup,recovery,opts) {
      await verifyRecovery(recovery,opts);assert(backup.database===owner.database && backup.path===path.join(evidenceDirectory,'populated-geo.sql'),'BACKUP_TARGET_MISMATCH')
      const stat=await lstat(backup.path);assert(stat.isFile() && !stat.isSymbolicLink() && stat.size<=32*1024*1024,'BACKUP_UNSAFE')
      assert.equal(createHash('sha256').update(await readFile(backup.path)).digest('hex'),backup.sha256,'BACKUP_DRIFT')
      await call('psql',['-X','-h',socket,'-p','5432','-U','postgres','-d',recovery.database,'-v','ON_ERROR_STOP=1','-f',backup.path],{...opts,restore:true})
    },
    async queryOwnedRecoveryDatabase(recovery,sql,opts) {await verifyRecovery(recovery,opts);return psql(recovery.database,sql,opts)},
    async dropOwnedRecoveryDatabase(recovery,opts) {
      await verifyRecovery(recovery,opts)
      await psql('postgres',`DROP DATABASE "${recovery.database}"`,opts)
      const query=`SELECT count(*) FROM pg_database WHERE datname='${recovery.database}'`
      const rawResult=(await psql('postgres',query,opts)).stdout.trim()
      assert.equal(rawResult,'0','RECOVERY_DATABASE_ABSENCE_UNKNOWN')
      recoveryAttempted=false
      return {databaseAbsent:true,observedCount:0,verification:'pg_database-count',query,rawResult}
    },
    async cleanup(opts) {
      cleanupMode = true
      guard(opts); await verifyOwnership(owner)
      cleanupEvidence.phase = !startAttempted ? 'never-started' : createAttempted ? 'database-attempted' : ready ? 'ready' : 'start-unconfirmed'
      assert(!cleaned, 'CLEANUP_ALREADY_COMPLETED')
      if (!startAttempted) {
        assert(!initAttempted || initialized, 'INIT_TERMINATION_UNKNOWN')
        assert(await absent(path.join(data, 'postmaster.pid')), 'SERVER_ABSENCE_UNKNOWN')
        return removeOwnedDirectory(opts, { phase: 'never-started', initialized, at: new Date().toISOString() })
      }
      assert(server, 'SERVER_HANDLE_UNKNOWN')
      await processIdentity(opts); await pidfile()
      let databaseAbsent = !createAttempted, databaseError = null
      if (createAttempted) {
        try {
          const exists = await psql('postgres', `SELECT count(*) FROM pg_database WHERE datname='${owner.database}'`, opts)
          if (exists.stdout.trim() === '1') await psql('postgres', `DROP DATABASE "${owner.database}"`, opts)
          else assert.equal(exists.stdout.trim(), '0', 'DATABASE_ABSENCE_UNKNOWN')
          databaseAbsent = (await psql('postgres', `SELECT count(*) FROM pg_database WHERE datname='${owner.database}'`, opts)).stdout.trim() === '0'
        } catch (error) { databaseError = error.message }
      }
      // A failed restore may leave only this marked recovery DB. Its teardown is
      // part of the explicitly proposed owned-resource envelope, never a retry.
      let recoveryFailure
      if(recoveryAttempted && recoveryRecord) {
       try {
        await verifyRecovery(recoveryRecord,opts)
        const exists=await psql('postgres',`SELECT count(*) FROM pg_database WHERE datname='${recoveryRecord.database}'`,opts)
        if(exists.stdout.trim()==='1')await psql('postgres',`DROP DATABASE "${recoveryRecord.database}"`,opts)
        assert.equal((await psql('postgres',`SELECT count(*) FROM pg_database WHERE datname='${recoveryRecord.database}'`,opts)).stdout.trim(),'0','RECOVERY_DATABASE_ABSENCE_UNKNOWN')
        recoveryAttempted=false;cleanupEvidence.recoveryDatabaseAbsent=true
       } catch(error) {
        recoveryFailure=error
        cleanupEvidence.recoveryDatabaseAbsent='UNKNOWN'
        cleanupEvidence.recoveryError={name:error.name,message:error.message,...(error.stdout!=null||error.stderr!=null?{stdout:error.stdout ?? '',stderr:error.stderr ?? ''}:{})}
       }
      }
      // SIGINT asks the retained postmaster to stop its own children and wait for
      // them. Never SIGKILL a postmaster or signal a possibly reused PID from disk.
      let stopped
      try {
      await processIdentity(opts); await pidfile()
      stopped = await server.stop({ deadline: opts.deadline })
      cleanupEvidence.stop = stopped
      await scanLog()
      assert(stopped.status === 'PARENT_EXIT_CONFIRMED' && stopped.result?.code === 0 && !stopped.result.signal && !stopped.result.launchError,
        'SERVER_STOP_UNKNOWN')
      guard(opts)
      const processes = await call('/bin/ps', ['-axo', 'pid=,ppid=,pgid='], opts)
      const rows = processes.stdout.trim().split('\n').filter(Boolean).map(line => line.trim().split(/\s+/).map(Number))
      assert(rows.every(row => row.length === 3 && row.every(Number.isInteger)), 'PROCESS_ABSENCE_UNKNOWN')
      assert(!rows.some(([pid, parent, group]) => pid === server.pid || parent === server.pid || group === server.pid), 'PROCESS_ABSENCE_UNKNOWN')
      cleanupEvidence.processAbsence = 'VERIFIED'
      let statusAbsent = false
      try { await call('pg_ctl', ['-D', data, 'status'], opts) }
      catch (error) { statusAbsent = /^CHILD_FAILED:3:/.test(error.message) }
      cleanupEvidence.pgCtlStatusAbsent = statusAbsent
      assert(statusAbsent, 'SERVER_ABSENCE_UNKNOWN')
      for (const file of [path.join(data, 'postmaster.pid'), path.join(socket, '.s.PGSQL.5432'), path.join(socket, '.s.PGSQL.5432.lock')]) {
        assert(await absent(file), 'SOCKET_OR_PID_ABSENCE_UNKNOWN')
      }
      cleanupEvidence.socketAbsence = 'VERIFIED'
      } catch(error) {cleanupEvidence.stopError={name:error.name,message:error.message};throw recoveryFailure ?? error}
      cleanupEvidence.databaseAbsent = databaseAbsent
      if(databaseError)cleanupEvidence.databaseError=databaseError
      if(recoveryFailure)throw recoveryFailure
      assert(databaseAbsent, `DATABASE_ABSENCE_UNKNOWN: ${databaseError ?? 'readback mismatch'}`)
      assert(!unexpectedRecovery,'RECOVERY_PREEXISTING_PRESERVED: directory retained')
      ready = false
      return removeOwnedDirectory(opts, { phase: 'foreground-stopped', pid: server.pid, birth: identity,
        exit: stopped.result, pgCtlStatus: 3, processAbsence: 'VERIFIED', pidAndSocketAbsence: 'VERIFIED', at: new Date().toISOString() })
    },
  }
}

// No CLI calls this entrypoint; exact external approval and source verifier required.
export async function runLifecycle({ root, binding, manifest, approval, ownership, verifySource, owner, directory, signal, deadline, command = runChild, launch = startForeground, cleanupBudgetMs = 30000, evidenceSink, group, cleanupProbe, lifecycleFactory = createLifecycle, diagnosticRunner }) {
  let probeController
  if(cleanupProbe) {
    assert(['failure','abort'].includes(cleanupProbe) && manifest.scope.include.includes('controlled-cleanup-probes'),'CLEANUP_PROBE_NOT_APPROVED')
    probeController=new AbortController();signal=signal?AbortSignal.any([signal,probeController.signal]):probeController.signal
  }
  if(group) {
    assert(['migration-up','migration-a','verification','plan-seed-diagnostic'].includes(group),'GROUP_NOT_IMPLEMENTED')
    if(group==='verification' || group==='plan-seed-diagnostic') {
      if(group==='verification')assert(manifest.scope.include.includes('issue180-gate-c-full'),'FULL_SCOPE_NOT_APPROVED')
      else {const {assertPlanSeedDiagnosticScope}=await import('./gate-c-runner.mjs');assertPlanSeedDiagnosticScope(manifest)}
      for(const file of ['gate-c-worker.mjs','gate-c-worker-host.mjs','gate-c-writers.mjs','gate-c-access.mjs','gate-c-recovery.mjs','gate-c-observer.mjs','payload-runtime.mjs'])assert(manifest.artifacts.dependencies.some(x=>x.path==='src/scripts/issue180/'+file),'UNBOUND_VERIFICATION_MODULE:'+file)
    }
    if(group==='migration-a' || group==='verification') { assert(manifest.scope.include.includes('issue180-gate-c-migration-a'),'GROUP_A_SCOPE_NOT_APPROVED');for(const file of ['scripts/rehearsal/baselines/issue180/legacy-fixture.sql','src/migrations/20261031_052622_issue180_optional_geo.json']) assert([...manifest.artifacts.dependencies,...manifest.artifacts.sql].some(x=>x.path===file),'UNBOUND_GROUP_A_FILE:'+file) }
    assert(manifest.scope.include.includes('issue180-gate-c-migration-up'),'GROUP_SCOPE_NOT_APPROVED')
    for(const file of ['src/scripts/issue180/gate-c-runner.mjs','src/scripts/issue180/migration-prerequisites.mjs','src/scripts/issue180/snapshot-assertions.mjs','scripts/rehearsal/baselines/issue158-v12/schema.sql','src/migrations/20261031_052622_issue180_optional_geo.ts']) assert([...manifest.artifacts.dependencies,...manifest.artifacts.sql].some(x=>x.path===file),'UNBOUND_GROUP_DEPENDENCY:'+file)
  }
  assert.equal(manifest?.artifacts?.executor?.path, 'src/scripts/issue180/lifecycle.mjs', 'BLOCK: lifecycle not bound')
  for (const name of ['src/scripts/issue180/child.mjs', 'src/scripts/issue180/foreground.mjs', 'src/scripts/issue180/executor.mjs',
    'src/scripts/issue180/binding.mjs', 'src/scripts/issue180/warnings.mjs', 'src/scripts/run-contract.mjs', 'src/scripts/run-executor-evidence.mjs',
    'scripts/rehearsal/baselines/issue180/binding.json']) {
    assert(manifest.artifacts.dependencies.some(item => item.path === name), `BLOCK: unbound dependency ${name}`)
  }
  assert(Number.isFinite(deadline) && deadline <= Date.parse(manifest.approval.validUntil) && deadline > Date.now(), 'BLOCK: deadline')
  await admission({ root, binding, manifest, approval, ownership, signal })
  assert.equal(await verifySource(approval.source, manifestHash(manifest)), true, 'SOURCE_UNVERIFIED')
  await verifyOwnership(owner)
  assert.equal(owner.runId, manifest.runId, 'BLOCK: actual owner differs')
  const digest = manifestHash(manifest)
  const sink = evidenceSink ?? fileEvidenceSink(directory, manifest, signal, { approval })
  if (!evidenceSink) {
    await writeFile(path.join(directory, 'ledger.json'), JSON.stringify({ version: 1, runId: manifest.runId, manifestSha256: digest, events: [] }), { flag: 'wx', mode: 0o600 })
    await sink.start()
  }
  assert(lifecycleFactory===createLifecycle || (command!==runChild && launch!==startForeground),'PAIRED_TRANSPORT_REQUIRED')
  assert(!diagnosticRunner || (command!==runChild && launch!==startForeground && lifecycleFactory!==createLifecycle),'PAIRED_TRANSPORT_REQUIRED')
  const lifecycle = lifecycleFactory({ owner, command, launch, evidenceDirectory:directory })
  let stage = 'initialize', failure = null, cleanup = 'UNKNOWN',caseResults=[],workerWarnings=[]
  try {
    for (const name of ['initialize', 'start', 'createDatabase']) {
      stage = name; await sink.checkpoint({ at: new Date().toISOString(), stage, status: 'PENDING' })
      await lifecycle[name]({ deadline, signal })
    }
    stage = 'bounded-query'
    await sink.checkpoint({ at: new Date().toISOString(), stage, status: 'PENDING' })
    const queryResult = await lifecycle.query('SELECT 1', { deadline, signal })
    assert.equal(queryResult.stdout.trim(), '1', 'BOUNDED_QUERY_READBACK_FAILED')
    if(cleanupProbe==='failure')throw Error('EXPECTED_CLEANUP_FAILURE')
    if(cleanupProbe==='abort'){probeController.abort();throw Error('INTERRUPTED')}
    if(group==='verification' || group==='plan-seed-diagnostic') {
      const {runFullMatrix,runPlanSeedDiagnostic}=await import('./gate-c-runner.mjs')
      caseResults=await (group==='verification'?runFullMatrix:(diagnosticRunner ?? runPlanSeedDiagnostic))({lifecycle,owner,root,directory,manifestSha256:digest,options:{deadline,signal},checkpoint:async name=>{await lifecycle.assertWorkAllowed({deadline,signal});stage=name;await sink.checkpoint({at:new Date().toISOString(),stage,status:'PENDING'})}})
    } else if(group) {
      const {migrationUp}=await import('./gate-c-runner.mjs')
      await migrationUp({lifecycle,root,directory,completeA:group==='migration-a',options:{deadline,signal},checkpoint:async name=>{stage=name;await sink.checkpoint({at:new Date().toISOString(),stage,status:'PENDING'})}})
    }
    stage = group==='verification'?'matrix-main-verified':group==='plan-seed-diagnostic'?'plan-seed-diagnostic-verified':group==='migration-a' ? 'migration-a-verified' : group ? 'migration-up-verified' : 'lifecycle-ready'
  } catch (error) { workerWarnings=error.workerWarnings ?? []; failure = { stage, message: error.message, effects: 'UNKNOWN',...(error.workerExitEvidence?{workerExitEvidence:error.workerExitEvidence}:{}),...(error.workerExitEvidenceStatus?{workerExitEvidenceStatus:error.workerExitEvidenceStatus,workerExitEvidenceError:error.workerExitEvidenceError}:{}),...(error.workerOutputEvidence?{workerOutputEvidence:error.workerOutputEvidence}:{}),...(error.workerOutputEvidenceStatus?{workerOutputEvidenceStatus:error.workerOutputEvidenceStatus,workerOutputEvidenceError:error.workerOutputEvidenceError}:{}),...(error.originalWorkerFailure?{originalWorkerFailure:error.originalWorkerFailure}:{}),...(error.validationEvidence?{validationEvidence:error.validationEvidence}:{}),...(error.validationEvidenceStatus?{validationEvidenceStatus:error.validationEvidenceStatus,validationEvidenceError:error.validationEvidenceError}:{}),...(error.observerEvidence?{observerEvidence:error.observerEvidence}:{}),...(error.observerEvidenceStatus?{observerEvidenceStatus:error.observerEvidenceStatus,observerEvidenceError:error.observerEvidenceError}:{}),...(error.roundtripEvidence?{roundtripEvidence:error.roundtripEvidence}:{}),...(error.roundtripEvidenceStatus?{roundtripEvidenceStatus:error.roundtripEvidenceStatus}:{}),...(error.roundtripEvidenceError?{roundtripEvidenceError:error.roundtripEvidenceError}:{}),...(error.stdout!=null || error.stderr!=null?{diagnostics:{stdout:error.stdout ?? '',stderr:error.stderr ?? ''}}:{}) } }
  try { cleanup = await lifecycle.cleanup({ deadline: Math.min(Date.now() + cleanupBudgetMs, Date.parse(manifest.approval.validUntil)) }) }
  catch (error) { cleanup = { status: 'UNKNOWN', error: error.message, evidence: lifecycle.getCleanupEvidence() } }
  const warnings = [...lifecycle.getWarnings(), ...workerWarnings]
  if(warnings.length && !failure) failure = {stage,message:'WARNING_STOP',effects:'UNKNOWN'}
  const result = { manifestSha256: digest, warnings,caseResults, stopReason:warnings.length ? 'WARNING_STOP' : failure?.message ?? null, status: !failure && cleanup.directoryAbsent ? 'PASS' : 'BLOCK',
    scope: group==='verification'?'gate-c-main-matrix':group==='plan-seed-diagnostic'?'plan-seed-diagnostic':group==='migration-a' ? 'gate-c-migration-a-only' : group ? 'gate-c-migration-up-only' : 'lifecycle-smoke-only', gateC: group ? 'PARTIAL_NOT_FULL' : 'NOT_EVALUATED', stage, failure, cleanup,
    effects: failure || cleanup.status === 'UNKNOWN' ? 'UNKNOWN' : 'DISPOSABLE_ONLY', productionConnections: 0, automaticRetry: false }
  await sink.receipt(result)
  return result
}
