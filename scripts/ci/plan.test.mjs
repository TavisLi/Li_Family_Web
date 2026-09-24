import assert from 'node:assert/strict'
import test from 'node:test'
import { changedPaths, plan } from './plan.mjs'

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
