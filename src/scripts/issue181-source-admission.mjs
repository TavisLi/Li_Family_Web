import assert from 'node:assert/strict'
import { readFile, realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { evaluateAuthorization, manifestHash, verifyManifestFiles } from './run-contract.mjs'
import { issue181CatalogEffect, issue181SqlArtifactPath, readApprovedIssue181Queries } from './issue181-production-catalog-read.mjs'

// The provider is supplied by a trusted host, never selected by manifest or CLI.
export async function confirmIssue181Source(manifest, approval, confirmApprovalSource, now) {
  const clock = typeof now === 'function' ? now : () => now ?? new Date()
  assert.equal(manifest.environment, 'production', 'BLOCK: environment')
  assert.equal(manifest.target, 'iujasyrvypdcmkmorcud/postgres/public', 'BLOCK: target')
  assert.equal(manifest.approval.action, 'production-read', 'BLOCK: action')
  assert.deepEqual(manifest.scope.expectedEffects, [issue181CatalogEffect], 'BLOCK: effect')
  assert.equal(evaluateAuthorization(manifest, approval, clock()).recordMatches, true, 'BLOCK: approval record')
  assert.equal(typeof confirmApprovalSource, 'function', 'BLOCK: trusted source provider unavailable')
  const initialHash = manifestHash(manifest)
  const expected = structuredClone({
    source: approval.source, manifestSha256: manifestHash(manifest), action: manifest.approval.action,
    environment: manifest.environment, target: manifest.target, include: manifest.scope.include,
    exclude: manifest.scope.exclude, baseline: manifest.scope.baseline, stopConditions: manifest.scope.stopConditions,
    validFrom: manifest.approval.validFrom, validUntil: manifest.approval.validUntil, revoked: false,
  })
  const decision = await confirmApprovalSource(approval.source)
  assert(decision && typeof decision === 'object', 'BLOCK: approval source unavailable')
  assert.equal(manifestHash(manifest), initialHash, 'BLOCK: manifest drift during source readback')
  assert.equal(evaluateAuthorization(manifest, approval, clock()).recordMatches, true, 'BLOCK: approval drift during source readback')
  assert.deepEqual(decision, expected, 'BLOCK: source decision mismatch or unknown')
  return { sourceConfirmed: true, manifestSha256: expected.manifestSha256 }
}

export const issue181ExecutableClosure = Object.freeze([
  'src/scripts/issue181-production-select-session.mjs',
  'src/scripts/issue181-production-catalog-read.mjs',
  'src/scripts/issue181-source-admission.mjs',
  'src/scripts/issue134-transaction-io.mjs',
  'src/scripts/issue134-additive-history.mjs',
  'src/scripts/run-executor-evidence.mjs',
  'src/scripts/run-executor-terminal.mjs',
  'src/scripts/run-local-session.mjs',
  'src/scripts/run-contract.mjs',
])

export async function verifyIssue181ExecutableClosure(manifest, root) {
  const expectedRoot = await realpath(root)
  const loadedRoot = await realpath(fileURLToPath(new URL('../..', import.meta.url)))
  assert.equal(loadedRoot, expectedRoot, 'BLOCK: executable root mismatch')
  assert.equal(manifest.artifacts.executor.path, issue181ExecutableClosure[0], 'BLOCK: executor binding')
  const artifacts = [manifest.artifacts.executor, ...manifest.artifacts.dependencies]
  for (const executable of issue181ExecutableClosure) {
    const matches = artifacts.filter((item) => item.path === executable)
    assert.equal(matches.length, 1, `BLOCK: executable binding: ${executable}`)
    const actual = await readFile(new URL(`./${path.basename(executable)}`, import.meta.url))
    assert.equal(createHash('sha256').update(actual).digest('hex'), matches[0].sha256,
      `BLOCK: executable readback drift: ${executable}`)
  }
  for (const item of artifacts) {
    if (/\.(?:[cm]?js|tsx?)$/i.test(item.path) &&
        item.path !== 'src/migrations/20261031_052622_issue180_optional_geo.ts') {
      assert(issue181ExecutableClosure.includes(item.path), `BLOCK: untrusted executable dependency: ${item.path}`)
    }
  }
}

// Only a host calling this API directly may provide the verifier. It is never loaded from a packet.
export async function admitIssue181({ manifest, approval, root, confirmApprovalSource, now }) {
  await verifyManifestFiles(manifest, root)
  await verifyIssue181ExecutableClosure(manifest, root)
  const limitFiles = manifest.artifacts.dependencies.filter((item) => item.path.endsWith('/limits.json'))
  assert.equal(limitFiles.length, 1, 'BLOCK: one limits artifact required')
  const sql = await readFile(path.join(root, issue181SqlArtifactPath))
  readApprovedIssue181Queries(manifest, sql)
  const result = await confirmIssue181Source(manifest, approval, confirmApprovalSource, now)
  // The external readback may take time. Re-read all bound bytes before admission returns.
  await verifyManifestFiles(manifest, root)
  await verifyIssue181ExecutableClosure(manifest, root)
  assert.equal(manifestHash(manifest), result.manifestSha256, 'BLOCK: manifest drift during source readback')
  return result
}
