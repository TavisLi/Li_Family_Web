import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { c0FrozenPackage, inspectC0Package } from './phase21-c0-package.mjs'

test('locks the #101 C0 package to the merged consumer-cutover baseline without connecting', async () => {
  const result = await inspectC0Package()

  assert.equal(result.merge, '3f6b2c4c53e684510265e07fb3b4633d71d5a775')
  assert.equal(result.productionConnections, 0)
})

test('matches the dedicated #101 frozen C0 manifest', async () => {
  const [result, frozen] = await Promise.all([
    inspectC0Package(),
    readFile('docs/phase-artifacts/phase-21/phase-21-101-c0-frozen-package.json', 'utf8'),
  ])

  assert.deepEqual(JSON.parse(frozen), result)
})

test('uses the dedicated #101 frozen manifest path', () => {
  assert.equal(
    c0FrozenPackage,
    'docs/phase-artifacts/phase-21/phase-21-101-c0-frozen-package.json',
  )
})
