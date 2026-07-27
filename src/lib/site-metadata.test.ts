import assert from 'node:assert/strict'
import test from 'node:test'

import { absoluteSiteUrl, metadataImageUrl, siteMetadataBase } from './site-metadata'

test('uses the configured public server URL as the metadata base', () => {
  assert.equal(
    siteMetadataBase('https://family.example.com/').toString(),
    'https://family.example.com/',
  )
})

test('falls back to the production domain when no public server URL is configured', () => {
  assert.equal(siteMetadataBase('').toString(), 'https://li-family-web.vercel.app/')
})

test('creates an absolute canonical URL from a route path', () => {
  assert.equal(
    absoluteSiteUrl('/blog/family-memory', 'https://family.example.com'),
    'https://family.example.com/blog/family-memory',
  )
})

test('uses a shared Open Graph fallback for missing media', () => {
  assert.equal(
    metadataImageUrl(null, 'https://family.example.com'),
    'https://family.example.com/api/og-default',
  )
})

test('keeps an already absolute R2 media URL unchanged', () => {
  assert.equal(
    metadataImageUrl(
      'https://media.example.com/media/family.jpeg',
      'https://family.example.com',
    ),
    'https://media.example.com/media/family.jpeg',
  )
})
