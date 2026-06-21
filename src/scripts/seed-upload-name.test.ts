import assert from 'node:assert/strict'

import { uploadFilenameForSourcePath } from './seed-upload-name'

const hainan = uploadFilenameForSourcePath(
  'content-source/assets/travels/201307-hainan/gallery/gallery-082.jpeg',
)
const eastAustralia = uploadFilenameForSourcePath(
  'content-source/assets/travels/202308-east-australia/gallery/gallery-082.jpeg',
)
const phuket = uploadFilenameForSourcePath(
  'content-source/assets/travels/202602-thailand-phuket/gallery/gallery-082.jpeg',
)

assert.notEqual(hainan, eastAustralia)
assert.notEqual(hainan, phuket)
assert.match(hainan, /^content-source-assets-travels-201307-hainan-gallery-gallery-082\.jpeg$/)
