import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { getOnlyRouteGuard, previewQaDecision, savePreviewQaCapture } from './run-preview-qa.mjs'

const manifest = JSON.parse(await readFile('docs/phase-artifacts/issue-105/slice-1-example/manifest.json', 'utf8'))
const current = { commit: 'commit-a', deployment: 'deployment-a', authEntry: 'family-entry',
  routes: 'route-fingerprint', data: 'data-fingerprint', schema: 'schema-fingerprint' }
const evidence = { kind: 'preview-qa', status: 'PASS', path: 'qa.json', sha256: 'a'.repeat(64), dependsOn: current }
const result = (changes = {}) => previewQaDecision({ manifest, evidence, current,
  evidenceBytesVerified: true, browserCaptureVerified: true,
  deployment: { id: current.deployment, commit: current.commit, state: 'READY' },
  browser: { completed: true, rendered: true, consoleErrors: 0, runtimeErrors: 0,
    authEntry: current.authEntry, routes: [
      { path: '/travel', viewport: 'desktop', rendered: true },
      { path: '/travel', viewport: 'mobile', rendered: true },
    ] },
  routes: ['/travel'], requests: [{ method: 'GET', path: '/travel' }], blockedRequests: [], ...changes })

test('browser route guard saves actual GET methods and blocked writes, Admin, and other origins', async () => {
  const guard = getOnlyRouteGuard({ origin: 'https://preview.example', routes: ['/travel'],
    assetOrigins: ['https://assets.example'] })
  const route = (method, url) => ({ request: () => ({ method: () => method, url: () => url }),
    continue: async () => {}, abort: async () => {} })
  await guard.handle(route('GET', 'https://preview.example/travel'))
  await guard.handle(route('GET', 'https://assets.example/image.jpg'))
  await guard.handle(route('POST', 'https://preview.example/travel'))
  await guard.handle(route('GET', 'https://preview.example/admin'))
  await guard.handle(route('GET', 'https://other.example/travel'))
  assert.deepEqual(guard.requests.map((item) => item.method), ['GET', 'GET'])
  assert.deepEqual(guard.blockedRequests.map((item) => item.reason), ['NON_GET', 'ADMIN_OR_API', 'OTHER_ORIGIN'])
  const directory = await mkdtemp(path.join(tmpdir(), 'issue105-preview-capture-'))
  const saved = await savePreviewQaCapture(path.join(directory, 'capture.json'), {
    deployment: { id: current.deployment, commit: current.commit }, browser: { completed: true }, guard,
  })
  assert.deepEqual(JSON.parse(await readFile(path.join(directory, 'capture.json'), 'utf8')).blockedRequests, saved.blockedRequests)
  assert(result({ requests: guard.requests, blockedRequests: guard.blockedRequests }).reasons.includes('BLOCKED_REQUESTS_OBSERVED'))
})

test('READY and HTTP success cannot substitute for Browser render or actual request evidence', () => {
  assert.equal(result().status, 'PASS')
  assert(result({ browserCaptureVerified: false }).reasons.includes('CAPTURE_SOURCE_UNVERIFIED'))
  assert(result({ browser: { completed: false }, requests: [] }).reasons.includes('BROWSER_RENDER_UNVERIFIED'))
  assert(result({ requests: [{ method: 'POST', path: '/travel' }] }).reasons.includes('GET_ONLY_UNVERIFIED'))
  assert(result({ browser: { completed: true, rendered: true, consoleErrors: 0, runtimeErrors: 0,
    authEntry: 'other', routes: [{ path: '/travel', viewport: 'desktop', rendered: true }] } }).reasons.includes('AUTH_ENTRY_MISMATCH'))
  assert(result({ deployment: { id: current.deployment, commit: 'other', state: 'READY' } }).reasons.includes('DEPLOYMENT_COMMIT_MISMATCH'))
})

test('only related dependency drift invalidates QA evidence', () => {
  assert.equal(result({ current: { ...current, executor: 'changed' } }).status, 'PASS')
  assert(result({ current: { ...current, data: 'changed' } }).reasons.includes('DEPENDENCY_DATA'))
  assert(result({ current: { ...current, schema: 'changed' } }).reasons.includes('DEPENDENCY_SCHEMA'))
  assert(result({ current: { ...current, routes: 'changed' } }).reasons.includes('DEPENDENCY_ROUTES'))
})
