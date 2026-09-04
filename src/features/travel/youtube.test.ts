import assert from 'node:assert/strict'

import { toSafeYouTubeExternalUrl, toYouTubeEmbedUrl, toYouTubeVideoIdentity } from './youtube'

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
assert.equal(
  toSafeYouTubeExternalUrl('https://youtube.com/live/example123'),
  'https://youtube.com/live/example123',
)
assert.equal(toSafeYouTubeExternalUrl('javascript:alert(1)'), null)
assert.equal(toSafeYouTubeExternalUrl('https://example.com/video'), null)

for (const url of [
  'https://youtu.be/lYP3m2N8yvs?si=tracking',
  'https://www.youtube.com/watch?v=lYP3m2N8yvs&feature=share',
  'https://youtube.com/shorts/lYP3m2N8yvs',
  'https://youtube.com/embed/lYP3m2N8yvs',
  'https://youtube.com/live/lYP3m2N8yvs?si=tracking',
]) assert.equal(toYouTubeVideoIdentity(url), 'https://www.youtube-nocookie.com/embed/lYP3m2N8yvs')
assert.equal(toYouTubeVideoIdentity('https://youtube.com.evil.test/watch?v=lYP3m2N8yvs'), null)
assert.equal(toYouTubeVideoIdentity('javascript:alert(1)'), null)
assert.equal(toYouTubeVideoIdentity('http://youtube.com/watch?v=lYP3m2N8yvs'), null)
assert.equal(toYouTubeEmbedUrl('https://youtube.com/live/example123'), null, 'existing live fallback behavior stays unchanged')
