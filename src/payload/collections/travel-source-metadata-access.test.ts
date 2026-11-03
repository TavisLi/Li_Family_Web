import assert from 'node:assert/strict'
import { sourceMetadataField } from './travel-shared-fields'

const field = sourceMetadataField()
assert.ok('access' in field && field.access?.read, 'source metadata needs server-side read access')
const read = field.access.read
assert.equal(read({ req: { user: null } } as never), false)
assert.equal(read({ req: { user: { role: 'family' } } } as never), false)
assert.equal(read({ req: { user: { role: 'admin' } } } as never), true)
console.log('Travel source metadata access tests PASS')
