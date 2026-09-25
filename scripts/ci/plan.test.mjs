import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { changedPaths, payloadDependencyChanged, plan } from './plan.mjs'

test('documentation and forms do not request application build', () => {
  assert.deepEqual(plan(['docs/example.md', '.github/ISSUE_TEMPLATE/work.yml']),
    { governance: true, app: false, schema: false, deps: false, disposable: false, tests: 'none' })
})
test('workflow and deployment config request governance validation', () => {
  assert.deepEqual(plan(['.github/workflows/ci.yml', 'vercel.json']),
    { governance: true, app: false, schema: false, deps: false, disposable: false, tests: 'none' })
})
test('application, dependencies, and production preparation retain coverage', () => {
  assert.equal(plan(['src/features/travel/travel-detail-page.tsx']).app, true)
  assert.equal(plan(['src/features/travel/travel-detail-page.tsx']).tests, 'travel')
  assert.equal(plan(['src/features/home/new.tsx']).tests, 'frontend')
  assert.deepEqual(plan(['pnpm-lock.yaml']), { governance: false, app: true, schema: false, deps: true, disposable: false, tests: 'all' })
  assert.deepEqual(plan(['src/migrations/new.ts']), { governance: false, app: true, schema: true, deps: false, disposable: false, tests: 'all' })
  assert.equal(plan(['src/scripts/run-executor.mjs']).disposable, true)
  assert.equal(plan(['content-source/travels/trip.md']).app, true)
  assert.equal(plan(['docs/travel-projects.md']).app, true)
})
test('rename and deletion classify both sides; unknown paths are conservative', () => {
  assert.deepEqual(changedPaths(Buffer.from('R100\0docs/old.md\0src/lib/new.ts\0D\0docs/gone.md\0')),
    ['docs/old.md', 'src/lib/new.ts', 'docs/gone.md'])
  assert.equal(plan(['some-new-config']).app, true)
  assert.equal(plan(['.github/workflows/new-deploy.yml']).app, true)
  assert.throws(() => changedPaths(Buffer.from('X\0unknown\0')))
  assert.throws(() => plan([]))
})

test('Payload version changes request disposable coverage; unrelated dependency changes do not', () => {
  const before = JSON.stringify({ dependencies: { payload: '3.85.1', '@payloadcms/next': '3.85.1', 'cross-env': '^7.0.3' } })
  const payloadUpgrade = JSON.stringify({ dependencies: { payload: '3.90.1', '@payloadcms/next': '3.90.1', 'cross-env': '^7.0.3' } })
  const unrelated = JSON.stringify({ dependencies: { payload: '3.85.1', '@payloadcms/next': '3.85.1', 'cross-env': '^10.1.0' } })
  const reordered = JSON.stringify({ dependencies: { 'cross-env': '^10.1.0', '@payloadcms/next': '3.85.1', payload: '3.85.1' } })
  assert.equal(payloadDependencyChanged(before, payloadUpgrade), true)
  assert.equal(payloadDependencyChanged(before, unrelated), false)
  assert.equal(payloadDependencyChanged(before, reordered), false)
})

test('current offline allowlist retains safety tests without replaying the frozen #101 package', () => {
  const selected = execFileSync(process.execPath, ['scripts/ci/offline-tests.mjs', 'all', '--list'],
    { encoding: 'utf8' }).trim().split('\n')
  assert(selected.includes('src/scripts/phase21-c0-security.test.mjs'))
  assert(selected.includes('src/scripts/run-contract.test.mjs'))
  assert(selected.includes('src/scripts/run-agent-summary.test.mjs'))
  assert(selected.includes('src/scripts/run-local-closeout-evidence.test.mjs'))
  assert(!selected.includes('src/scripts/phase21-c0-package.test.mjs'))
})
