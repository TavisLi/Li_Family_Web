import assert from 'node:assert/strict'

import { withGeneratedTravelMemoryKeys } from './TravelMemoryDays'

type KeyFixture = {
  moments: Array<{
    momentKey?: string
    title: string
    placements: Array<{ placementKey?: string; type: string }>
  }>
}

const generated = withGeneratedTravelMemoryKeys<KeyFixture>({
  moments: [
    {
      title: 'Admin 新增片段',
      placements: [{ type: 'photo' }],
    },
    {
      momentKey: 'source-stable-key',
      title: 'Source 片段',
      placements: [{ placementKey: 'content-source/assets/example.jpeg', type: 'photo' }],
    },
  ],
})

assert.match(generated.moments[0]?.momentKey ?? '', /^moment:[0-9a-f-]{36}$/)
assert.match(generated.moments[0]?.placements[0]?.placementKey ?? '', /^placement:[0-9a-f-]{36}$/)
assert.equal(generated.moments[1]?.momentKey, 'source-stable-key')
assert.equal(
  generated.moments[1]?.placements[0]?.placementKey,
  'content-source/assets/example.jpeg',
)

console.log('travel memory technical key tests passed')
