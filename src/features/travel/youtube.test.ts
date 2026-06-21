import assert from 'node:assert/strict'

import { toYouTubeEmbedUrl } from './youtube'

assert.equal(
  toYouTubeEmbedUrl('https://youtu.be/lYP3m2N8yvs'),
  'https://www.youtube-nocookie.com/embed/lYP3m2N8yvs',
)
assert.equal(
  toYouTubeEmbedUrl('https://youtube.com/shorts/A1nSo0loipA?feature=share'),
  'https://www.youtube-nocookie.com/embed/A1nSo0loipA',
)
assert.equal(
  toYouTubeEmbedUrl('https://www.youtube.com/watch?v=2djOuGN3zck'),
  'https://www.youtube-nocookie.com/embed/2djOuGN3zck',
)
assert.equal(toYouTubeEmbedUrl('https://example.com/embed/not-youtube'), null)
assert.equal(toYouTubeEmbedUrl('https://youtube.com/watch?v=invalid!'), null)
