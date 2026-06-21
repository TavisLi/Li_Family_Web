import assert from 'node:assert/strict'

import { mediaIdsBySourcePath } from './seed-media-context'

const mediaBySourcePath = mediaIdsBySourcePath([
  { id: 10, sourcePath: 'content-source/assets/travels/a/cover/a-cover.jpg' },
  { id: 11, sourcePath: undefined },
])

assert.equal(mediaBySourcePath.get('content-source/assets/travels/a/cover/a-cover.jpg'), 10)
assert.equal(mediaBySourcePath.has(''), false)

console.log('seed media context tests passed')
