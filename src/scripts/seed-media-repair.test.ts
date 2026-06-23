import assert from 'node:assert/strict'

import {
  mediaRefreshRequestFromArgs,
  mediaSourcePathFromArgs,
  mediaSourcePathsFromArgs,
} from './seed-media-repair'

assert.equal(
  mediaSourcePathFromArgs([
    '--refresh-media-source',
    'content-source/assets/members/tavis/tavis-hero.jpeg',
  ]),
  'content-source/assets/members/tavis/tavis-hero.jpeg',
)
assert.equal(
  mediaSourcePathFromArgs([
    '--refresh-media-source',
    '--',
    'content-source/assets/members/tavis/tavis-hero.jpeg',
  ]),
  'content-source/assets/members/tavis/tavis-hero.jpeg',
)
assert.equal(mediaSourcePathFromArgs([]), undefined)
assert.throws(
  () => mediaSourcePathFromArgs(['--refresh-media-source']),
  /requires a source path/,
)

assert.deepEqual(mediaRefreshRequestFromArgs(['--refresh-missing-current-media']), {
  type: 'missing-current-media',
})

assert.deepEqual(
  mediaSourcePathsFromArgs([
    '--refresh-media-source',
    '--',
    'content-source/assets/members/Leo/leo-avatar.jpeg',
    'content-source/assets/members/Leo/leo-hero.jpeg',
  ]),
  [
    'content-source/assets/members/Leo/leo-avatar.jpeg',
    'content-source/assets/members/Leo/leo-hero.jpeg',
  ],
)
