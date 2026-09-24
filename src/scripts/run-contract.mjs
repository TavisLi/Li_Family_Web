import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const hashPattern = /^[a-f0-9]{64}$/
const actions = new Set([
  'local', 'preview-deploy', 'production-read', 'production-migration',
  'production-content', 'production-media', 'production-relationship',
  'production-security', 'destructive-cleanup', 'merge', 'release', 'issue-close',
])
const evidenceKeys = {
  rehearsal: ['manifest', 'executor', 'sql', 'backup', 'schema'],
  preflight: ['manifest', 'executor', 'sql', 'backup', 'schema', 'data'],
  'preview-qa': ['commit', 'deployment', 'authEntry', 'routes', 'data', 'schema'],
}

function record(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `BLOCK: ${label} must be an object`)
  return value
}

function nonempty(value, label) {
  assert(typeof value === 'string' && value.trim(), `BLOCK: ${label} is missing`)
  return value
}

function strings(value, label) {
  assert(Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim()),
    `BLOCK: ${label} must be a nonempty string list`)
  assert.equal(new Set(value).size, value.length, `BLOCK: ${label} has duplicates`)
  return value
}

function exactKeys(value, keys, label) {
  assert.deepEqual(Object.keys(record(value, label)).sort(), [...keys].sort(), `BLOCK: ${label} fields`)
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
  }
  return value
}

export function manifestHash(manifest) {
  validateManifest(manifest)
  return sha256(JSON.stringify(canonical(manifest)))
}

export function validateManifest(manifest) {
  exactKeys(manifest, ['version', 'runId', 'environment', 'target', 'runtime', 'scope', 'artifacts', 'approval'], 'manifest')
  assert.equal(manifest.version, 1, 'BLOCK: manifest version')
  nonempty(manifest.runId, 'runId')
  nonempty(manifest.environment, 'environment')
  nonempty(manifest.target, 'target')
  exactKeys(manifest.runtime, ['node', 'pnpm', 'bootstrap', 'schemaPush'], 'runtime')
  nonempty(manifest.runtime.node, 'runtime.node')
  nonempty(manifest.runtime.pnpm, 'runtime.pnpm')
  exactKeys(manifest.runtime.bootstrap, ['entrypoint', 'envNames'], 'runtime.bootstrap')
  nonempty(manifest.runtime.bootstrap.entrypoint, 'runtime.bootstrap.entrypoint')
  assert(Array.isArray(manifest.runtime.bootstrap.envNames) &&
    manifest.runtime.bootstrap.envNames.every((name) => typeof name === 'string' && /^[A-Z][A-Z0-9_]*$/.test(name)) &&
    new Set(manifest.runtime.bootstrap.envNames).size === manifest.runtime.bootstrap.envNames.length,
  'BLOCK: runtime.bootstrap.envNames must list names only')
  assert.equal(manifest.runtime.schemaPush, 'disabled', 'BLOCK: schema push must be disabled')
  exactKeys(manifest.scope, ['include', 'exclude', 'expectedEffects', 'stopConditions', 'baseline'], 'scope')
  for (const key of ['include', 'exclude', 'expectedEffects', 'stopConditions']) strings(manifest.scope[key], `scope.${key}`)
  nonempty(manifest.scope.baseline, 'scope.baseline')
  exactKeys(manifest.artifacts, ['executor', 'sql', 'backup', 'dependencies'], 'artifacts')
  assert(Array.isArray(manifest.artifacts.sql), 'BLOCK: SQL artifacts missing')
  if (manifest.approval?.action?.startsWith('production-') || manifest.approval?.action === 'destructive-cleanup') {
    assert(manifest.artifacts.sql.length > 0, 'BLOCK: Production SQL artifacts missing')
  }
  assert(Array.isArray(manifest.artifacts.dependencies), 'BLOCK: dependency artifacts missing')
  assert(['package.json', 'pnpm-lock.yaml'].every((name) => manifest.artifacts.dependencies.some((file) => file.path === name)),
    'BLOCK: runtime dependency files missing')
  const files = [manifest.artifacts.executor, ...manifest.artifacts.sql, ...manifest.artifacts.dependencies]
  if (manifest.artifacts.backup !== null) files.push(manifest.artifacts.backup)
  for (const file of files) {
    exactKeys(file, ['path', 'sha256'], 'artifact')
    nonempty(file.path, 'artifact.path')
    assert(!path.isAbsolute(file.path) && !file.path.split('/').includes('..'), 'BLOCK: artifact path escapes repository')
    assert(hashPattern.test(file.sha256), 'BLOCK: artifact checksum')
  }
  assert.equal(new Set(files.map((file) => file.path)).size, files.length, 'BLOCK: duplicate artifact path')
  if (manifest.environment === 'production' && manifest.approval.action !== 'production-read') {
    assert(manifest.artifacts.backup, 'BLOCK: Production backup missing')
  }
  exactKeys(manifest.approval, ['action', 'allowed', 'excluded', 'validFrom', 'validUntil'], 'approval')
  assert(actions.has(manifest.approval.action), 'BLOCK: unknown approval action')
  if (manifest.environment === 'production') {
    assert(manifest.approval.action.startsWith('production-') || manifest.approval.action === 'destructive-cleanup',
      'BLOCK: Production requires a Production action')
  }
  if (manifest.approval.action.startsWith('production-') || manifest.approval.action === 'destructive-cleanup') {
    assert.equal(manifest.environment, 'production', 'BLOCK: Production action environment')
  }
  strings(manifest.approval.allowed, 'approval.allowed')
  strings(manifest.approval.excluded, 'approval.excluded')
  assert(manifest.approval.allowed.includes(manifest.approval.action), 'BLOCK: approval action outside allowed actions')
  assert(!manifest.approval.excluded.some((action) => manifest.approval.allowed.includes(action)), 'BLOCK: action both allowed and excluded')
  for (const key of ['validFrom', 'validUntil']) {
    assert(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(manifest.approval[key]) &&
      !Number.isNaN(Date.parse(manifest.approval[key])), `BLOCK: approval.${key}`)
  }
  assert(Date.parse(manifest.approval.validFrom) < Date.parse(manifest.approval.validUntil), 'BLOCK: approval period')
  return manifest
}

export async function verifyManifestFiles(manifest, root) {
  validateManifest(manifest)
  assert.equal(process.versions.node, manifest.runtime.node, 'BLOCK: Node runtime changed')
  const realRoot = await realpath(root)
  const files = [manifest.artifacts.executor, ...manifest.artifacts.sql, ...manifest.artifacts.dependencies]
  if (manifest.artifacts.backup) files.push(manifest.artifacts.backup)
  for (const file of files) {
    const absolute = await realpath(path.resolve(root, file.path))
    assert(absolute.startsWith(`${realRoot}${path.sep}`), 'BLOCK: artifact path escapes repository')
    assert.equal(sha256(await readFile(absolute)), file.sha256, `BLOCK: artifact bytes changed: ${file.path}`)
  }
  const packageJson = JSON.parse(await readFile(path.join(realRoot, 'package.json'), 'utf8'))
  assert.equal(packageJson.packageManager, `pnpm@${manifest.runtime.pnpm}`, 'BLOCK: pnpm runtime changed')
  return { manifestSha256: manifestHash(manifest), verifiedFiles: files.length }
}

// An approval record is evidence of a human decision, never a self-issued token.
export function evaluateAuthorization(manifest, approval, now = new Date()) {
  validateManifest(manifest)
  if (!approval) return { recordMatches: false, sourceNeedsVerification: true, reasons: ['NO_APPROVAL'] }
  exactKeys(approval, ['source', 'manifestSha256', 'action', 'environment', 'target', 'scope', 'baseline', 'stopConditions', 'validFrom', 'validUntil', 'revoked'], 'approval record')
  const reasons = []
  nonempty(approval.source, 'approval source')
  if (approval.revoked !== false) reasons.push('REVOKED_OR_UNKNOWN')
  if (approval.manifestSha256 !== manifestHash(manifest)) reasons.push('MANIFEST_CHANGED')
  if (approval.action !== manifest.approval.action) reasons.push('ACTION_CHANGED')
  if (approval.environment !== manifest.environment || approval.target !== manifest.target) reasons.push('TARGET_CHANGED')
  if (JSON.stringify(approval.scope) !== JSON.stringify(manifest.scope.include)) reasons.push('SCOPE_CHANGED')
  if (approval.baseline !== manifest.scope.baseline) reasons.push('BASELINE_CHANGED')
  if (JSON.stringify(approval.stopConditions) !== JSON.stringify(manifest.scope.stopConditions)) reasons.push('STOP_CONDITIONS_CHANGED')
  if (approval.validFrom !== manifest.approval.validFrom || approval.validUntil !== manifest.approval.validUntil) reasons.push('PERIOD_CHANGED')
  if (Number.isNaN(Date.parse(approval.validFrom)) || Number.isNaN(Date.parse(approval.validUntil)) ||
      now.getTime() < Date.parse(approval.validFrom) || now.getTime() >= Date.parse(approval.validUntil)) reasons.push('EXPIRED_OR_NOT_YET_VALID')
  return { recordMatches: reasons.length === 0, sourceNeedsVerification: true, reasons }
}

export function evaluateEvidence(evidence, current, manifest) {
  exactKeys(evidence, ['kind', 'status', 'dependsOn', 'path', 'sha256'], 'evidence')
  assert(evidenceKeys[evidence.kind], 'BLOCK: unknown evidence kind')
  nonempty(evidence.path, 'evidence.path')
  assert(hashPattern.test(evidence.sha256), 'BLOCK: evidence checksum')
  const required = evidenceKeys[evidence.kind]
  exactKeys(evidence.dependsOn, required, 'evidence.dependsOn')
  const changed = required.filter((key) =>
    (key === 'backup' && manifest.artifacts.backup === null) ||
    !evidence.dependsOn[key] || !current?.[key] || evidence.dependsOn[key] !== current[key])
  return { valid: evidence.status === 'PASS' && changed.length === 0, changed, status: evidence.status }
}

export async function verifyEvidenceFiles(evidence, runDirectory) {
  const root = await realpath(runDirectory)
  for (const item of evidence) {
    nonempty(item.path, 'evidence.path')
    assert(hashPattern.test(item.sha256), 'BLOCK: evidence checksum')
    const absolute = await realpath(path.resolve(root, item.path))
    assert(absolute.startsWith(`${root}${path.sep}`), 'BLOCK: evidence path escapes run directory')
    assert.equal(sha256(await readFile(absolute)), item.sha256, `BLOCK: evidence bytes changed: ${item.path}`)
  }
  return evidence.length
}

export function currentState(manifest, ledger, approval, evidence, current, now = new Date()) {
  validateManifest(manifest)
  exactKeys(ledger, ['version', 'runId', 'manifestSha256', 'events'], 'ledger')
  assert.equal(ledger.version, 1, 'BLOCK: ledger version')
  assert.equal(ledger.runId, manifest.runId, 'BLOCK: ledger runId')
  assert.equal(ledger.manifestSha256, manifestHash(manifest), 'BLOCK: ledger manifest changed')
  assert(Array.isArray(ledger.events), 'BLOCK: ledger events')
  ledger.events.forEach((event, index) => {
    exactKeys(event, ['sequence', 'at', 'stage', 'status', 'evidencePath'], 'ledger event')
    assert.equal(event.sequence, index + 1, 'BLOCK: ledger sequence')
    assert(!Number.isNaN(Date.parse(event.at)), 'BLOCK: ledger event time')
    if (index) assert(Date.parse(event.at) >= Date.parse(ledger.events[index - 1].at), 'BLOCK: ledger event time moved backward')
    nonempty(event.stage, 'ledger stage')
    assert(['PENDING', 'PASS', 'BLOCK', 'UNKNOWN'].includes(event.status), 'BLOCK: ledger event status')
    if (index && ['BLOCK', 'UNKNOWN'].includes(ledger.events[index - 1].status)) throw new Error('BLOCK: event after terminal failure')
  })
  const latest = ledger.events.at(-1)
  return {
    runId: manifest.runId,
    manifestSha256: ledger.manifestSha256,
    stage: latest?.stage ?? 'not-started',
    status: latest?.status ?? 'PENDING',
    lastEvidencePath: latest?.evidencePath ?? null,
    authorization: evaluateAuthorization(manifest, approval, now),
    evidence: evidence.map((item) => ({ path: item.path, ...evaluateEvidence(item, current, manifest) })),
  }
}
