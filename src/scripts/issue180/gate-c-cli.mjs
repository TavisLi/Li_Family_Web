import assert from 'node:assert/strict'
import {readFile,writeFile,readdir,realpath,mkdir,lstat,readlink} from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {prepare as prepareSmoke,proposeManifest as proposeSmoke} from './smoke.mjs'
import {manifestHash,verifyManifestFiles,evaluateAuthorization} from '../run-contract.mjs'
import {fileEvidenceSink} from '../run-executor-evidence.mjs'
import {runChild} from './child.mjs'
import {warningLines} from './warnings.mjs'
import {verifyBinding} from './binding.mjs'
import {prepareOwnership,runLifecycle} from './lifecycle.mjs'
import {runGateC,allCases,assertPlanSeedDiagnosticScope} from './gate-c-runner.mjs'
import {serveAccessRoutes} from './gate-c-access.mjs'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..')
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const boundFile=async file=>({path:await realpath(file),sha256:sha(await readFile(file))})
export function assertRuntimeBindingMatch(expected,actual) {
 assert.deepEqual(actual,expected,'RUNTIME_DEPENDENCY_DRIFT')
}
async function runtimeBindings() {
 const node=await boundFile(process.execPath),nodeDirectory=path.dirname(node.path),corepack=await boundFile(path.join(nodeDirectory,'corepack'))
 const pnpmResult=await promisify(execFile)(corepack.path,['pnpm','--version'],{cwd:root,env:{PATH:nodeDirectory+':/usr/bin:/bin',COREPACK_ENABLE_NETWORK:'0'},timeout:10000,maxBuffer:4096})
 const packageJson=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'))
 assert(!warningLines(pnpmResult.stderr).length,'PNPM_INSPECTION_WARNING')
 const pnpmVersion=pnpmResult.stdout.trim(),expectedPnpm=packageJson.packageManager.replace(/^pnpm@/,'')
 assert.equal(pnpmVersion,expectedPnpm,'PNPM_VERSION_DRIFT')
 const modulesPath=path.join(root,'node_modules'),modulesStat=await lstat(modulesPath),modulesLink=modulesStat.isSymbolicLink()?await readlink(modulesPath):null
 const modules={path:modulesPath,type:modulesStat.isSymbolicLink()?'symlink':'directory',linkTarget:modulesLink,realpath:await realpath(modulesPath),pnpmLock:await boundFile(path.join(modulesPath,'.pnpm/lock.yaml'))}
 if(modulesLink)modules.linkSha256=sha(Buffer.from(modulesLink))
 const projectRequire=createRequire(path.join(root,'package.json')),payloadEntry=projectRequire.resolve('payload'),payloadRoot=await realpath(path.dirname(path.dirname(payloadEntry))),payloadPackage=JSON.parse(await readFile(path.join(payloadRoot,'package.json'),'utf8'))
 const sharpEntry=projectRequire.resolve('sharp'),sharpRoot=await realpath(path.basename(path.dirname(sharpEntry))==='dist'?path.dirname(path.dirname(sharpEntry)):path.dirname(sharpEntry))
 const sharpPackage=JSON.parse(await readFile(path.join(sharpRoot,'package.json'),'utf8'))
 const sharpRequire=createRequire(path.join(sharpRoot,'package.json')),nativeName=`@img/sharp-${process.platform}-${process.arch}`
 const nativeEntry=await realpath(sharpRequire.resolve(nativeName+'/sharp.node')),nativeRoot=path.dirname(nativeEntry),nativePackage=JSON.parse(await readFile(path.join(nativeRoot,'package.json'),'utf8'))
 const nativeFiles=(await readdir(path.join(nativeRoot,'lib'))).filter(file=>file.endsWith('.node'))
 assert.equal(nativeFiles.length,1,'SHARP_NATIVE_ADDON_AMBIGUOUS')
 const nativeAddon=await boundFile(path.join(nativeRoot,'lib',nativeFiles[0]))
 const nativeRequire=createRequire(path.join(nativeRoot,'package.json')),libvipsEntry=await realpath(nativeRequire.resolve(`@img/sharp-libvips-${process.platform}-${process.arch}/lib`)),libvipsRoot=path.dirname(path.dirname(libvipsEntry))
 const libvipsVersions=JSON.parse(await readFile(path.join(libvipsRoot,'versions.json'),'utf8'))
 const libvipsBinary=await boundFile(path.join(libvipsRoot,'lib',`libvips-cpp.${libvipsVersions.vips}.dylib`))
 return {node:{...node,version:process.version},pnpm:{corepack,version:pnpmVersion},nodeModules:modules,payload:{version:payloadPackage.version,entry:await boundFile(payloadEntry),package:await boundFile(path.join(payloadRoot,'package.json'))},sharp:{version:sharpPackage.version,entry:await boundFile(sharpEntry),package:await boundFile(path.join(sharpRoot,'package.json')),native:{version:nativePackage.version,entry:await boundFile(nativeEntry),package:await boundFile(path.join(nativeRoot,'package.json')),addon:nativeAddon},libvips:{version:libvipsVersions.vips,entry:await boundFile(libvipsEntry),package:await boundFile(path.join(libvipsRoot,'package.json')),versions:await boundFile(path.join(libvipsRoot,'versions.json')),binary:libvipsBinary}},platform:{os:process.platform,arch:process.arch}}
}
export async function verifyLoopback(signal) {
 const probe=await serveAccessRoutes(()=>Response.json({scope:'synthetic-platform-preflight-only'}),{timeoutMs:5000,signal})
 try {
  const response=await probe.request(probe.origin+'/preflight',{method:'GET'})
  assert.equal(response.status,200,'PLATFORM_LOOPBACK_UNAVAILABLE')
  assert.deepEqual(await response.json(),{scope:'synthetic-platform-preflight-only'})
 } finally{await probe.close()}
}

async function sourceClosure(seeds) {
 const found=new Set(),pending=[...seeds]
 while(pending.length) {
  const file=pending.pop();if(found.has(file))continue
  assert(!path.isAbsolute(file) && !file.split('/').includes('..'),'SOURCE_PATH')
  const bytes=await readFile(path.join(root,file));found.add(file)
  for(const match of bytes.toString().matchAll(/(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)) {
   const spec=match[1];if(!spec.startsWith('.') && !spec.startsWith('@/'))continue
   const base=spec.startsWith('@/')?'src/'+spec.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),spec))
   for(const candidate of [base,base+'.ts',base+'.tsx',base+'.mjs',base+'/index.ts']) {
    try{if((await lstat(path.join(root,candidate))).isFile()){pending.push(candidate);break}}catch(error){if(error.code!=='ENOENT')throw error}
   }
  }
 }
 return [...found].sort()
}
export async function prepareVerification() {
 const preparation=await prepareSmoke()
 const inspected=await promisify(execFile)('/usr/bin/git',['rev-parse','HEAD'],{cwd:root,env:{PATH:'/usr/bin:/bin',TMPDIR:'/private/tmp',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0'},timeout:5000,maxBuffer:4096})
 assert(!warningLines(inspected.stderr).length,'HEAD_INSPECTION_WARNING')
 const head=inspected.stdout.trim()
 assert.equal(head,preparation.head,'HEAD_DRIFT')
 const harness=(await readdir(path.join(root,'src/scripts/issue180'))).filter(file=>file.endsWith('.mjs')).map(file=>'src/scripts/issue180/'+file)
 const seeds=[...harness,'src/scripts/seed.ts','src/scripts/seed-scope.ts','src/scripts/travel-seed-target.ts','src/scripts/travel-memory-v2-import.ts','src/scripts/phase19-travel-memory-backfill.ts','src/scripts/travel-geo-write.ts','src/payload/collections/travel-geo-review.ts',...['Users','Media','TravelPlans','TravelMemories','TravelMemoryDays','TravelRouteIdentities'].map(file=>'src/payload/collections/'+file+'.ts'),'src/app/(payload)/api/[...slug]/route.ts','src/app/(payload)/api/graphql/route.ts']
 for(const file of await sourceClosure(seeds))preparation.artifacts[file]=sha(await readFile(path.join(root,file)))
 for(const file of ['tsconfig.json','scripts/rehearsal/baselines/issue180/legacy-fixture.sql','src/migrations/20261031_052622_issue180_optional_geo.ts','src/migrations/20261031_052622_issue180_optional_geo.json'])preparation.artifacts[file]=sha(await readFile(path.join(root,file)))
 const dump='/opt/homebrew/opt/postgresql@17/bin/pg_dump'
 preparation.binaries[dump]={realpath:await realpath(dump),sha256:sha(await readFile(dump))}
 preparation.runtimeBindings=await runtimeBindings()
 return {...preparation,scope:'full-local-gate-c-matrix',cases:allCases}
}
export function proposeVerification(preparation,options) {
 const manifest=proposeSmoke(preparation,options)
 manifest.runtime.bootstrap.entrypoint='node src/scripts/issue180/gate-c-cli.mjs execute'
 manifest.scope.exclude=['Production','credentials','external storage/email','product schema/runtime edits','deployment','Git/GitHub writes','merge','retry','fallback','unowned cleanup']
 manifest.scope.include=['issue180-gate-c-full','issue180-gate-c-migration-up','issue180-gate-c-migration-a','controlled-cleanup-probes',...allCases.map(id=>'case:'+id),
  'at most three fresh owned clusters under /private/tmp/'+options.runId+'-*; Unix socket only',
  'main work DB plus distinct owned _restore DB; retain and verify empty template0 public schema owned by pg_database_owner on restore DB before replay; controlled failure and controller-abort cleanup probes',
  'compare restore catalog with live column relative order and definitions; record absolute ordinal differences; save independently read-back restore DB absence evidence',
  'immediately after fresh main/probe CREATE DATABASE: verify DB/data directory/database owner/public owner/empty namespace; DROP SCHEMA public RESTRICT; verify namespace absence; retain verified empty public schema on restore DB',
  'deterministic synthetic roles/content/users/history; bounded owned loopback HTTP; no external storage/email',
  'compact completion IPC with delivery callback; independently read back worker-exit-evidence.json including exit code, signal and completion receipt',
      'Memory V1 retired: memory-v1 case requires rejection before store I/O and zero mutation; Memory writes use V2; Plan v1 remains supported',
  'persistent evidence .rehearsal-runs/issue180-gate-c/'+options.runId,
  'dynamic owner/PID/socket/backup hashes resolved under this envelope and independently verified before use']
 manifest.scope.expectedEffects=['fresh owned empty public namespace initialization using RESTRICT on main/probe targets; retain verified empty template0 public namespace on restore target; no CASCADE or historical migration-row changes','local candidate up/down/re-up and populated-down refusal; real writers/API/contention; independent backup restore; owned DB/cluster teardown; evidence retained']
 manifest.scope.include.push('one invocation; maximum 60 minutes overall, main work 50 minutes; two planned cleanup probes at 2 minutes each; cleanup at most 60 seconds per cluster')
 const prepEntry=manifest.artifacts.dependencies.find(file=>file.path===options.preparationPath)
 assert(prepEntry,'PREPARATION_NOT_BOUND')
 const sqlFiles=['scripts/rehearsal/baselines/issue158-v12/schema.sql','scripts/rehearsal/baselines/issue180/legacy-fixture.sql','src/migrations/20261031_052622_issue180_optional_geo.ts']
 manifest.artifacts.sql=sqlFiles.map(file=>({path:file,sha256:preparation.artifacts[file]}))
 manifest.artifacts.dependencies=[...Object.entries(preparation.artifacts).filter(([file])=>file!==manifest.artifacts.executor.path && !sqlFiles.includes(file)).map(([file,hash])=>({path:file,sha256:hash})),prepEntry]
 return manifest
}
export function proposePlanSeedDiagnostic(preparation,options) {
 const manifest=proposeVerification(preparation,options)
 manifest.scope.include=['issue180-gate-c-plan-seed-diagnostic','issue180-gate-c-migration-up','case:plan-seed',
  'one fresh owned cluster under /private/tmp/'+options.runId+'-*; Unix socket only',
  'immediately after fresh CREATE DATABASE verify owner and empty namespace; DROP SCHEMA public RESTRICT; verify absence',
  'deterministic synthetic fixture and plan-seed diagnostic only; no external storage/email',
  'persistent evidence .rehearsal-runs/issue180-gate-c/'+options.runId,
  'one invocation; maximum 60 minutes overall; cleanup at most 60 seconds']
 manifest.scope.expectedEffects=['fresh owned synthetic namespace, candidate migration up, plan-seed diagnostic and owned cleanup; evidence retained']
 assertPlanSeedDiagnosticScope(manifest)
 return manifest
}
export async function executeVerification({preparation,preparationPath,manifest,approval,sourceBytes,sourceReadback,signal},deps={command:runChild,makeOwner:prepareOwnership,run:runGateC,probe:runLifecycle,loopback:verifyLoopback}) {
 assert(deps.command===runChild || (deps.makeOwner!==prepareOwnership && deps.run!==runGateC && deps.probe!==runLifecycle && typeof deps.loopback==='function' && deps.loopback!==verifyLoopback),'PAIRED_TRANSPORT_REQUIRED')
 assert(sourceReadback?.manifestSha256===manifestHash(manifest) && sourceReadback.sourceSha256===sha(sourceBytes) && typeof sourceReadback.operator==='string' && sourceReadback.operator.trim(),'SOURCE_READBACK_REQUIRED')
 assert(evaluateAuthorization(manifest,approval).recordMatches,'APPROVAL_NOT_VALID')
 assert(!path.isAbsolute(preparationPath) && !preparationPath.split('/').includes('..'),'PREPARATION_PATH')
 const prepStat=await lstat(path.join(root,preparationPath));assert(prepStat.isFile() && !prepStat.isSymbolicLink(),'PREPARATION_FILE_UNSAFE')
 const prepAbsolute=await realpath(path.join(root,preparationPath));assert(prepAbsolute.startsWith(root+path.sep),'PREPARATION_PATH_ESCAPE')
 const bytes=await readFile(prepAbsolute),entry=manifest.artifacts.dependencies.find(file=>file.path===preparationPath)
 assert(entry && entry.sha256===sha(bytes),'PREPARATION_BYTES_CHANGED')
 assert.deepEqual(preparation,JSON.parse(bytes),'PREPARATION_INPUT_CHANGED')
 const currentPreparation=await prepareVerification()
 assertRuntimeBindingMatch(preparation.runtimeBindings,currentPreparation.runtimeBindings)
 assert.deepEqual(preparation,currentPreparation,'PREPARATION_DRIFT')
 const focused=manifest.scope.include.includes('issue180-gate-c-plan-seed-diagnostic')
 if(focused)assertPlanSeedDiagnosticScope(manifest)
 assert.deepEqual(manifest,(focused?proposePlanSeedDiagnostic:proposeVerification)(preparation,{runId:manifest.runId,...manifest.approval,preparationPath,preparationSHA256:sha(bytes)}),'SCOPE_OR_ARTIFACT_DRIFT')
 await verifyManifestFiles(manifest,root)
 const binding=JSON.parse(await readFile(path.join(root,'scripts/rehearsal/baselines/issue180/binding.json')))
 await verifyBinding(root,binding)
 const overall=Math.min(Date.now()+3600000,Date.parse(manifest.approval.validUntil))
 assert(overall-Date.now()>240000,'EXECUTION_WINDOW_TOO_SHORT')
 assert(!signal?.aborted,'INTERRUPTED')
 const processProbe=await deps.command('/bin/ps',['-p',String(process.pid),'-o','pid='],{env:{PATH:'/usr/bin:/bin'},deadline:Date.now()+5000,signal})
 assert.equal(processProbe.stdout.trim(),String(process.pid),'PLATFORM_PROCESS_INSPECTION_UNAVAILABLE')
 assert(!warningLines(processProbe.stderr).length,'WARNING_STOP')
 const allProcesses=await deps.command('/bin/ps',['-axo','pid=,ppid=,pgid='],{env:{PATH:'/usr/bin:/bin'},deadline:Date.now()+5000,signal})
 assert(![...warningLines(allProcesses.stdout),...warningLines(allProcesses.stderr)].length,'WARNING_STOP')
 const processRows=allProcesses.stdout.trim().split('\n').filter(Boolean).map(line=>line.trim().split(/\s+/).map(Number))
 assert(processRows.every(row=>row.length===3 && row.every(Number.isInteger)) && processRows.some(row=>row[0]===process.pid),'PLATFORM_FULL_PROCESS_INSPECTION_UNAVAILABLE')
 await deps.loopback(signal)
 assert(!signal?.aborted && Date.now()<overall-240000,'INTERRUPTED_OR_EXPIRED')
 const parent=path.join(root,'.rehearsal-runs/issue180-gate-c'),directory=path.join(parent,manifest.runId)
 await mkdir(parent,{recursive:true,mode:0o700});assert((await realpath(parent)).startsWith(root+path.sep),'EVIDENCE_PATH_ESCAPE')
 await mkdir(directory,{mode:0o700})
 const save=(file,value)=>writeFile(path.join(directory,file+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600})
 const digest=manifestHash(manifest)
 await save('manifest',manifest);await save('approval',approval);await save('source-readback',sourceReadback)
 await save('platform-preflight',{at:new Date().toISOString(),selfInspection:true,fullProcessInspection:true,loopbackWire:true})
 await save('ledger',{version:1,runId:manifest.runId,manifestSha256:digest,events:[]})
 const sink=fileEvidenceSink(directory,manifest,signal,{approval});await sink.start()
 const results=[],cleanupProbes=[],phaseReceipts=[],warnings=[]
 let failure=null,currentPhase
 try {
  for(const phase of (focused?['main']:['main','cleanup-failure','cleanup-abort'])) {
   currentPhase=phase
   assert(!signal?.aborted && Date.now()<overall-60000,'INTERRUPTED_OR_EXPIRED')
   await sink.checkpoint({at:new Date().toISOString(),stage:phase,status:'PENDING'})
   const evidence=path.join(directory,phase);await mkdir(evidence,{mode:0o700})
   const owner=await deps.makeOwner('/private/tmp',manifest.runId)
   await writeFile(path.join(evidence,'resolved-owner.json'),JSON.stringify(owner),{flag:'wx',mode:0o600})
   const input={root,binding,manifest,approval,ownership:{runId:manifest.runId,target:manifest.target},owner,directory:evidence,signal,
    deadline:Math.min(overall-180000,Date.now()+(phase==='main'?3000000:120000)),cleanupBudgetMs:60000,
    verifySource:async source=>source===approval.source && sourceReadback.manifestSha256===digest}
   const result=phase==='main'?await deps.run({...input,cases:focused?['plan-seed']:allCases}):await deps.probe({...input,cleanupProbe:phase==='cleanup-failure'?'failure':'abort'})
   const receiptBytes=await readFile(path.join(evidence,'receipt.json')),receipt=JSON.parse(receiptBytes)
   assert(receipt.manifestSha256===digest && receipt.status===result.status,'PHASE_RECEIPT_UNBOUND')
   warnings.push(...(receipt.warnings ?? []))
   assert(warnings.length===0,'WARNING_STOP')
   assert.deepEqual(receipt.cleanup,result.cleanup,'PHASE_CLEANUP_RECEIPT_MISMATCH')
   phaseReceipts.push({phase,path:phase+'/receipt.json',sha256:sha(receiptBytes),status:receipt.status})
   if(phase==='main') {
    assert.equal(result.status,'PASS','MAIN_MATRIX_FAILED:'+result.failure?.message)
    for(const row of result.caseResults) {
     if(row.id==='cleanup'){results.push(row);continue}
     assert(allCases.includes(row.id) && row.evidence===row.id+'.json' && row.status==='PASS','CASE_RESULT_UNBOUND')
     const bytes=await readFile(path.join(evidence,row.evidence));assert.equal(sha(bytes),row.sha256,'CASE_BYTES_CHANGED')
     if(focused){const {verifyObserverEvidence}=await import('./gate-c-worker-host.mjs');await verifyObserverEvidence(evidence,row.observerEvidence,manifest.runId,digest)}
     results.push({...row,evidence:'main/'+row.evidence})
    }
   }
   else {
    assert(result.status==='BLOCK' && result.failure?.message===(phase==='cleanup-failure'?'EXPECTED_CLEANUP_FAILURE':'INTERRUPTED') && !result.warnings.length,'UNEXPECTED_CLEANUP_PROBE_OUTCOME')
    cleanupProbes.push({phase,expectedFailure:result.failure.message,cleanup:result.cleanup})
   }
   assert(result.cleanup.databaseAbsent && result.cleanup.serverStopped && result.cleanup.directoryAbsent,'OWNED_CLEANUP_UNKNOWN')
  }
  if(focused)assert.deepEqual(results.map(row=>row.id),['plan-seed'],'DIAGNOSTIC_RESULT_SCOPE')
  else {
  assert.deepEqual(results.map(row=>row.id),allCases,'MATRIX_REQUIREMENTS_MISSING')
  const cleanup={id:'cleanup',status:'PASS',phaseReceipts,controlledFailure:cleanupProbes[0],controllerAbort:cleanupProbes[1]}
  await save('cleanup',cleanup)
  results[results.findIndex(row=>row.id==='cleanup')]={id:'cleanup',status:'PASS',evidence:'cleanup.json',sha256:sha(await readFile(path.join(directory,'cleanup.json')))}
  }
 } catch(error){failure={message:error.message,effects:'UNKNOWN',phase:currentPhase,receipt:phaseReceipts.find(row=>row.phase===currentPhase) ?? null}}
 const result={runId:manifest.runId,manifestSha256:digest,status:failure?'BLOCK':'PASS',stage:'verification-suite',scope:focused?'plan-seed-diagnostic-only':'local-pr03-gate-c-matrix-only',...(focused?{gateC:'NOT_EVALUATED'}:{}),caseResults:results,warnings,failure,productionConnections:0,automaticRetry:false,productionReadiness:'UNKNOWN',cleanupProbes,phaseReceipts,directory}
 await sink.receipt(result);return result
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const main=async()=>{
  const [mode,...args]=process.argv.slice(2)
  if(mode==='prepare' && !args.length)return console.log(JSON.stringify(await prepareVerification(),null,2))
  if((mode==='propose' || mode==='propose-focused') && args.length===4) {
   const [file,runId,validFrom,validUntil]=args,bytes=await readFile(file)
   return console.log(JSON.stringify((mode==='propose'?proposeVerification:proposePlanSeedDiagnostic)(JSON.parse(bytes),{runId,validFrom,validUntil,preparationPath:path.relative(root,path.resolve(file)),preparationSHA256:sha(bytes)}),null,2))
  }
  assert(mode==='execute' && args.length===5,'exact preparation, manifest, approval, Human source and source readback required')
  const json=async file=>JSON.parse(await readFile(file)),[prepFile,manifestFile,approvalFile,sourceFile,readbackFile]=args
  const controller=new AbortController(),abort=()=>controller.abort();process.once('SIGINT',abort);process.once('SIGTERM',abort)
  try {
   const result=await executeVerification({preparation:await json(prepFile),preparationPath:path.relative(root,path.resolve(prepFile)),manifest:await json(manifestFile),approval:await json(approvalFile),sourceBytes:await readFile(sourceFile),sourceReadback:await json(readbackFile),signal:controller.signal})
   console.log(JSON.stringify({status:result.status,manifestSha256:result.manifestSha256,directory:result.directory,failure:result.failure},null,2));process.exitCode=result.status==='PASS'?0:2
  } finally{process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort)}
 }
 main().catch(error=>{console.error('BLOCK: '+error.message);process.exitCode=2})
}
