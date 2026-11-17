import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { manifestHash } from './run-contract.mjs'
import { confirmIssue181Source, issue181ExecutableClosure } from './issue181-source-admission.mjs'
import { issue181CatalogEffect } from './issue181-production-catalog-read.mjs'

const base = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-1-example/manifest.json', 'utf8'))
function fixture() {
  const manifest = structuredClone(base)
  manifest.environment = 'production'
  manifest.target = 'iujasyrvypdcmkmorcud/postgres/public'
  manifest.scope.expectedEffects = [issue181CatalogEffect]
  manifest.artifacts.sql = [{ path: 'synthetic.sql', sha256: 'a'.repeat(64) }]
  manifest.approval = { action: 'production-read', allowed: ['production-read'], excluded: ['merge'],
    validFrom: '2026-01-01T00:00:00Z', validUntil: '2027-01-01T00:00:00Z' }
  const approval = { source: 'synthetic-human-source', manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope.include,
    baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions,
    validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  const decision = { source: approval.source, manifestSha256: approval.manifestSha256, action: approval.action,
    environment: manifest.environment, target: manifest.target, include: manifest.scope.include, exclude: manifest.scope.exclude,
    baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions,
    validFrom: approval.validFrom, validUntil: approval.validUntil, revoked: false }
  return { manifest, approval, decision }
}
const now = new Date('2026-06-01T00:00:00Z')
test('source must match the entire decision and missing provider fails closed', async () => {
  const { manifest, approval, decision } = fixture()
  assert.equal((await confirmIssue181Source(manifest, approval, async () => decision, now)).sourceConfirmed, true)
  await assert.rejects(confirmIssue181Source(manifest, approval, undefined, now), /provider unavailable/)
  for (const [key, value] of Object.entries({ revoked: true, manifestSha256: '0'.repeat(64), action: 'merge',
    target: 'other', include: ['other'], exclude: ['other'], baseline: 'other', stopConditions: ['other'],
    validUntil: '2025-01-01T00:00:00Z' })) {
    await assert.rejects(confirmIssue181Source(manifest, approval, async () => ({ ...decision, [key]: value }), now))
  }
  await assert.rejects(confirmIssue181Source(manifest, approval, async () => null, now))
  await assert.rejects(confirmIssue181Source(manifest, { ...approval, revoked: true }, async () => decision, now))
  await assert.rejects(confirmIssue181Source(manifest, approval, async () => decision, new Date('2028-01-01T00:00:00Z')))
})

test('integrated admission reads bound bytes and rejects drift before credential or connection', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { createHash } = await import('node:crypto')
  const path = await import('node:path')
  const { pathToFileURL } = await import('node:url')
  const { issue181SqlArtifactPath, issue181SqlArtifactSha256 } = await import('./issue181-production-catalog-read.mjs')
  const root = await mkdtemp(path.join(tmpdir(), 'issue181-admission-'))
  const bytes = await readFile(issue181SqlArtifactPath)
  const files = { 'package.json': JSON.stringify({ packageManager: 'pnpm@10.28.0' }), 'pnpm-lock.yaml': 'fixture',
    'inputs/limits.json': '{}' }
  for (const name of issue181ExecutableClosure) files[name] = await readFile(name)
  for (const [name, data] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true })
    await writeFile(path.join(root, name), data)
  }
  await mkdir(path.dirname(path.join(root, issue181SqlArtifactPath)), { recursive: true })
  await writeFile(path.join(root, issue181SqlArtifactPath), bytes)
  const { admitIssue181 } = await import(pathToFileURL(path.join(root, 'src/scripts/issue181-source-admission.mjs')).href)
  const artifact = (name) => ({ path: name, sha256: createHash('sha256').update(files[name]).digest('hex') })
  const { manifest } = fixture()
  manifest.runtime.node = process.versions.node
  manifest.runtime.pnpm = '10.28.0'
  manifest.artifacts = { executor: artifact(issue181ExecutableClosure[0]), sql: [{ path: issue181SqlArtifactPath, sha256: issue181SqlArtifactSha256 }],
    backup: null, dependencies: [artifact('package.json'), artifact('pnpm-lock.yaml'), artifact('inputs/limits.json'), ...issue181ExecutableClosure.slice(1).map(artifact)] }
  const approval = { source: 'synthetic-source', manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, scope: manifest.scope.include, baseline: manifest.scope.baseline,
    stopConditions: manifest.scope.stopConditions, validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false }
  const decision = { source: approval.source, manifestSha256: approval.manifestSha256, action: approval.action,
    environment: manifest.environment, target: manifest.target, include: manifest.scope.include, exclude: manifest.scope.exclude,
    baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions, validFrom: approval.validFrom,
    validUntil: approval.validUntil, revoked: false }
  let credentials = 0, connections = 0
  const enter = async (options) => {
    await admitIssue181({ manifest, approval, root, now, ...options })
    credentials++; connections++
  }
  await enter({ confirmApprovalSource: async () => decision })
  assert.equal(credentials, 1); assert.equal(connections, 1)
  credentials = 0; connections = 0
  const bad = [undefined, async () => null, async () => ({ ...decision, revoked: true }),
    async () => ({ ...decision, target: 'other' }), async () => ({ ...decision, validUntil: '2025-01-01T00:00:00Z' })]
  for (const confirmApprovalSource of bad) await assert.rejects(enter({ confirmApprovalSource }))
  await writeFile(path.join(root, issue181ExecutableClosure[0]), 'drift')
  await assert.rejects(enter({ confirmApprovalSource: async () => decision }), /artifact bytes changed/)
  assert.equal(credentials, 0); assert.equal(connections, 0)
})

test('approval expiring during source readback is rejected', async () => {
  const { manifest, approval, decision } = fixture()
  let calls = 0
  const clock = () => new Date(++calls === 1 ? '2026-12-31T23:59:59Z' : '2027-01-01T00:00:00Z')
  await assert.rejects(confirmIssue181Source(manifest, approval, async () => decision, clock), /approval drift/)
})
