import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFile, realpath, mkdir, writeFile, lstat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateAuthorization, manifestHash, validateManifest, verifyManifestFiles } from '../run-contract.mjs'
import { verifyBinding } from './binding.mjs'
import { prepareOwnership, runLifecycle } from './lifecycle.mjs'
import { fileEvidenceSink } from '../run-executor-evidence.mjs'
import { warningLines } from './warnings.mjs'
import { runChild } from './child.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const files = ['src/scripts/issue180/smoke.mjs','src/scripts/issue180/lifecycle.mjs','src/scripts/issue180/foreground.mjs','src/scripts/issue180/child.mjs','src/scripts/issue180/warnings.mjs','src/scripts/issue180/executor.mjs','src/scripts/issue180/binding.mjs','src/scripts/run-contract.mjs','src/scripts/run-executor-evidence.mjs','scripts/rehearsal/baselines/issue180/binding.json','pnpm-lock.yaml','package.json','pnpm-workspace.yaml','patches/@payloadcms__db-postgres@3.90.2.patch',
  'scripts/rehearsal/baselines/issue158-v12/baseline.json','scripts/rehearsal/baselines/issue158-v12/runtime-payload-3.90.2.json','scripts/rehearsal/baselines/issue158-v12/schema.sql','scripts/rehearsal/baselines/issue158-v12/semantic-catalog.json','scripts/rehearsal/baselines/issue158-v12/catalog-queries.json','scripts/rehearsal/baselines/issue180/historical-lock.yaml']
const binaries = ['/opt/homebrew/opt/postgresql@17/bin/postgres','/opt/homebrew/opt/postgresql@17/bin/initdb','/opt/homebrew/opt/postgresql@17/bin/pg_config','/opt/homebrew/opt/postgresql@17/bin/pg_ctl','/opt/homebrew/opt/postgresql@17/bin/psql','/bin/ps']
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
export async function prepare() {
  const artifacts = {}
  for (const name of files) artifacts[name] = digest(await readFile(path.join(root, name)))
  const runtime = {}
  for (const name of [...binaries,process.execPath]) runtime[name] = { realpath: await realpath(name), sha256: digest(await readFile(name)) }
  return { status: 'PREPARATION_ONLY', nodeVersion:process.versions.node, head: 'ee0130375bca35306323f63498f3e74dd17fed30', artifacts, binaries: runtime,
    executionAuthorization: 'ABSENT', platformProcessInspection: 'UNKNOWN', target: 'future unique owner-marked private Unix socket',
    resourceIdentities: 'PENDING_CREATION_AND_BINDING', gateC: 'NOT_EVALUATED' }
}
export function proposeManifest(preparation, { runId, validFrom, validUntil, preparationPath = 'docs/phase-artifacts/issue-180/gate-c-smoke-preparation-r3-20261101.json', preparationSHA256 = digest(JSON.stringify(preparation,null,2)+'\n') }) {
  assert(!path.isAbsolute(preparationPath) && !preparationPath.split('/').includes('..') && !files.includes(preparationPath), 'PREPARATION_PATH')
  assert(/^issue180-[a-f0-9]{32}$/.test(runId), 'RUN_ID')
  const artifact = name => ({ path: name, sha256: preparation.artifacts[name] })
  return validateManifest({ version: 1, runId, environment: 'disposable', target: `owned-unix:${runId}`,
    runtime: { node: '24.21.0', pnpm: '10.28.0', bootstrap: { entrypoint: 'node src/scripts/issue180/smoke.mjs execute', envNames: [] }, schemaPush: 'disabled' },
    scope: { include: ['issue180-lifecycle-smoke-only', 'one fresh cluster under /private/tmp with prefix '+runId+'-',
      'persistent evidence .rehearsal-runs/issue180-smoke/'+runId, 'initdb; foreground postgres; identity/readiness; create synthetic database; SELECT 1; owned drop/stop/absence/removal',
      'owner/PID/birth/socket identities resolved within this approved envelope and recorded before use'],
      exclude: ['Production','credentials','migration','Payload','Gate C matrix','deployment','merge','retry','fallback'],
      expectedEffects: ['one owned synthetic cluster and database created and removed; evidence retained'],
      stopConditions: ['ownership drift','binding drift','warning','deadline','abort','readback failure','UNKNOWN'],
      baseline: preparation.artifacts['scripts/rehearsal/baselines/issue180/binding.json'] },
    artifacts: { executor: artifact('src/scripts/issue180/lifecycle.mjs'), sql: [], backup: null,
      dependencies: files.filter(name => name !== 'src/scripts/issue180/lifecycle.mjs').map(artifact).concat({path:preparationPath,sha256:preparationSHA256}) },
    approval: { action: 'local', allowed: ['local'], excluded: ['production-read','production-migration','production-content','production-media','destructive-cleanup','merge','release'], validFrom, validUntil } })
}

// Source readback is an explicit out-of-band operator assertion after the Human
// decision is read, not machine authentication or a generated approval record.
// No source readback is produced by prepare/propose. #105 keeps sourceNeedsVerification.
export async function executeSmoke({ preparation, preparationPath = 'docs/phase-artifacts/issue-180/gate-c-smoke-preparation-r3-20261101.json', manifest, approval, sourceBytes, sourceReadback, signal,
  command = runChild, run = runLifecycle, makeOwner = prepareOwnership }) {
  assert(command === runChild || (run !== runLifecycle && makeOwner !== prepareOwnership), 'PAIRED_TRANSPORT_REQUIRED')
  assert.equal(sourceReadback?.manifestSha256, manifestHash(manifest), 'SOURCE_READBACK_REQUIRED')
  assert.equal(sourceReadback.sourceSha256, digest(sourceBytes), 'SOURCE_CHANGED')
  assert.equal(typeof sourceReadback.operator, 'string'); assert(sourceReadback.operator.trim(), 'OPERATOR_REQUIRED')
  assert(evaluateAuthorization(manifest, approval).recordMatches, 'APPROVAL_NOT_VALID')
  const prepDependency = manifest.artifacts.dependencies.find(item=>item.path===preparationPath)
  assert(prepDependency, 'PREPARATION_NOT_BOUND')
  assert(!path.isAbsolute(preparationPath) && !preparationPath.split('/').includes('..'), 'PREPARATION_PATH')
  const prepAbsolute = await realpath(path.join(root,preparationPath))
  assert(prepAbsolute.startsWith(root+path.sep),'PREPARATION_PATH')
  const prepBytes = await readFile(prepAbsolute)
  assert.equal(digest(prepBytes),prepDependency.sha256,'PREPARATION_BYTES_CHANGED')
  assert.deepEqual(preparation,JSON.parse(prepBytes),'PREPARATION_INPUT_CHANGED')
  assert.deepEqual(preparation, await prepare(), 'PREPARATION_DRIFT')
  assert.deepEqual(manifest, proposeManifest(preparation, { runId: manifest.runId, ...manifest.approval, preparationPath,preparationSHA256:digest(prepBytes) }), 'SCOPE_OR_ARTIFACT_DRIFT')
  await verifyManifestFiles(manifest, root)
  const binding = JSON.parse(await readFile(path.join(root,'scripts/rehearsal/baselines/issue180/binding.json')))
  await verifyBinding(root, binding)
  assert(!signal?.aborted, 'INTERRUPTED')
  const deadline = Math.min(Date.now()+600000, Date.parse(manifest.approval.validUntil)-30000)
  assert(deadline > Date.now(), 'CLEANUP_WINDOW_MISSING')
  // Required same-environment process access preflight before any provisioning.
  let processProbe
  try { processProbe = await command('/bin/ps', ['-p', String(process.pid), '-o', 'pid='], { env: { PATH:'/usr/bin:/bin' }, deadline: Math.min(deadline,Date.now()+5000), signal }) }
  catch(error) {
    if([...warningLines(error.stdout),...warningLines(error.stderr)].length)
      error.message = 'WARNING_STOP: '+error.message+' '+JSON.stringify({stdout:error.stdout,stderr:error.stderr})
    throw error
  }
  const probeWarnings = [...warningLines(processProbe.stdout),...warningLines(processProbe.stderr)]
  if(probeWarnings.length) throw new Error('WARNING_STOP: '+JSON.stringify(probeWarnings))
  assert.equal(processProbe.stdout.trim(), String(process.pid), 'PLATFORM_PROCESS_INSPECTION_UNAVAILABLE')
  assert(!signal?.aborted && Date.now()<deadline, 'INTERRUPTED_OR_EXPIRED')
  const directory = path.join(root,'.rehearsal-runs/issue180-smoke',manifest.runId)
  await mkdir(path.dirname(directory), { recursive:true, mode:0o700 })
  // Exclusive run directory is a no-retry latch; a second invocation cannot provision.
  await mkdir(directory, { mode:0o700 })
  await writeFile(path.join(directory,'manifest.json'), JSON.stringify(manifest,null,2), { flag:'wx',mode:0o600 })
  await writeFile(path.join(directory,'approval.json'), JSON.stringify(approval,null,2), { flag:'wx',mode:0o600 })
  await writeFile(path.join(directory,'source-readback.json'), JSON.stringify(sourceReadback,null,2), { flag:'wx',mode:0o600 })
  const sink = fileEvidenceSink(directory, manifest, signal, { approval })
  await writeFile(path.join(directory,'ledger.json'), JSON.stringify({ version:1, runId:manifest.runId, manifestSha256:manifestHash(manifest), events:[] }), {flag:'wx',mode:0o600})
  await sink.start()
  await sink.checkpoint({ at:new Date().toISOString(),stage:'provision-owner',status:'PENDING' })
  let owner
  try {
    owner = await makeOwner('/private/tmp',manifest.runId)
    await writeFile(path.join(directory,'resolved-owner.json'), JSON.stringify(owner,null,2), { flag:'wx',mode:0o600 })
    const result = await run({ root,binding,manifest,approval,ownership:{ runId:manifest.runId,target:manifest.target }, owner,directory,signal,deadline,
      verifySource: async source => source === approval.source && sourceReadback.sourceSha256 === digest(sourceBytes), cleanupBudgetMs:30000, evidenceSink:sink })
    return { ...result, directory }
  } catch (error) {
    // Provisioning before lifecycle evidence is not silently repaired or retried.
    try { await lstat(path.join(directory,'receipt.json')) } catch (receiptError) {
      if (receiptError.code !== 'ENOENT') throw receiptError
      await sink.receipt({manifestSha256:manifestHash(manifest),status:'BLOCK',stage:'entry',failure:{message:error.message},owner:owner ?? null,effects:'UNKNOWN',cleanup:{status:'UNKNOWN',reason:'ENTRY_FAILED'},automaticRetry:false,productionConnections:0})
    }
    throw error
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const main = async () => {
    if (process.argv[2] === 'prepare' && process.argv.length === 3) return console.log(JSON.stringify(await prepare(),null,2))
    if (process.argv[2] === 'propose' && process.argv.length === 7) {
      const [,,, prepFile,runId,validFrom,validUntil] = process.argv
      const prepBytes=await readFile(prepFile)
      return console.log(JSON.stringify(proposeManifest(JSON.parse(prepBytes), { runId,validFrom,validUntil,preparationPath:path.relative(root,path.resolve(prepFile)),preparationSHA256:digest(prepBytes) }),null,2))
    }
    if (process.argv[2] !== 'execute' || process.argv.length !== 8) throw new Error('exact preparation, manifest, approval, source, and externally supplied source-readback files required')
    const [,,, prepFile,manifestFile,approvalFile,sourceFile,readbackFile] = process.argv
    const json = async file => JSON.parse(await readFile(file,'utf8'))
    const controller = new AbortController(), abort = () => controller.abort()
    process.once('SIGINT',abort); process.once('SIGTERM',abort)
    try {
      const result = await executeSmoke({ preparation:await json(prepFile),preparationPath:path.relative(root,path.resolve(prepFile)),manifest:await json(manifestFile),approval:await json(approvalFile),sourceBytes:await readFile(sourceFile),sourceReadback:await json(readbackFile),signal:controller.signal })
      console.log(JSON.stringify(result,null,2)); process.exitCode = result.status === 'PASS' ? 0 : 2
    } finally { process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort) }
  }
  main().catch(error => { console.error(`BLOCK: ${error.message}`);process.exitCode=2 })
}
