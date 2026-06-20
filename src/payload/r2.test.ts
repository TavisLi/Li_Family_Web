import assert from 'node:assert/strict'
import test from 'node:test'

import { r2PublicFileUrl } from './r2'

test('joins an R2 public URL with an unprefixed filename', () => {
  assert.equal(
    r2PublicFileUrl('https://media.example.com/', 'family.jpeg'),
    'https://media.example.com/family.jpeg',
  )
})

test('joins an R2 public URL with a storage prefix', () => {
  assert.equal(
    r2PublicFileUrl('https://media.example.com', 'family.jpeg', 'media'),
    'https://media.example.com/media/family.jpeg',
  )
})

test('does not create a public file URL when no public domain is configured', () => {
  assert.equal(r2PublicFileUrl(undefined, 'family.jpeg'), undefined)
})
