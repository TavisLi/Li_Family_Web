import assert from 'node:assert/strict'

import { canAccessAdmin, canManageContent } from './is-admin'

assert.equal(canAccessAdmin({ user: { role: 'admin' } }), true)
assert.equal(canAccessAdmin({ user: { role: 'family' } }), false)
assert.equal(canAccessAdmin({ user: null }), false)
assert.equal(canManageContent({ user: { role: 'admin' } }), true)
assert.equal(canManageContent({ user: { role: 'family' } }), false)

console.log('admin access tests passed')
