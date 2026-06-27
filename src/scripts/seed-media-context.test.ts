import assert from 'node:assert/strict'

import { mediaRecordMatchesSeed } from './seed-media-compare'
import { mediaIdsBySourcePath } from './seed-media-context'

const mediaBySourcePath = mediaIdsBySourcePath([
  { id: 10, sourcePath: 'content-source/assets/travels/a/cover/a-cover.jpg' },
  { id: 11, sourcePath: undefined },
])

assert.equal(mediaBySourcePath.get('content-source/assets/travels/a/cover/a-cover.jpg'), 10)
assert.equal(mediaBySourcePath.has(''), false)

assert.equal(
  mediaRecordMatchesSeed(
    {
      type: 'photo',
      altText: 'Family photo',
      sourcePath: 'content-source/assets/family/photo.jpeg',
      tags: [{ tag: 'travel' }, { tag: 'cover' }],
    },
    {
      absolutePath: '/tmp/photo.jpeg',
      altText: 'Family photo',
      ownerSlug: 'family',
      ownerType: 'travel',
      sourcePath: 'content-source/assets/family/photo.jpeg',
      tags: [{ tag: 'cover' }, { tag: 'travel' }],
      usage: 'cover',
    },
  ),
  true,
)

assert.equal(
  mediaRecordMatchesSeed(
    {
      type: 'photo',
      altText: 'Old alt',
      sourcePath: 'content-source/assets/family/photo.jpeg',
      tags: [{ tag: 'travel' }],
    },
    {
      absolutePath: '/tmp/photo.jpeg',
      altText: 'Family photo',
      ownerSlug: 'family',
      ownerType: 'travel',
      sourcePath: 'content-source/assets/family/photo.jpeg',
      tags: [{ tag: 'travel' }],
      usage: 'cover',
    },
  ),
  false,
)

console.log('seed media context tests passed')
