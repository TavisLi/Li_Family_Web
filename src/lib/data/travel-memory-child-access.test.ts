import assert from 'node:assert/strict'

import { readTravelMemoryChildAfterOwner } from './travel-memory-child-access'

for (const ownerState of ['family-only', 'draft'] as const) {
  let childRead = false
  const result = await readTravelMemoryChildAfterOwner({
    readOwner: async () => null,
    readChild: async () => {
      childRead = true
      return {
        caption: `${ownerState} caption must not leak`,
        youtubeUrl: 'https://youtu.be/private123',
      }
    },
  })
  assert.equal(result, null)
  assert.equal(childRead, false)
}

const published = await readTravelMemoryChildAfterOwner({
  readOwner: async () => ({ id: 1, slug: 'public-memory' }),
  readChild: async (owner) => ({ ownerId: owner.id, dayKey: 'day-01' }),
})
assert.deepEqual(published, { ownerId: 1, dayKey: 'day-01' })

console.log('travel memory child access tests passed')
