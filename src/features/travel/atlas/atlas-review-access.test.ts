import assert from 'node:assert/strict'
import { test } from 'node:test'
import { atlasReviewEnabled } from './atlas-review-access'

test('requires explicit opt-in and a known non-production environment', () => {
  const cases = [
    [{}, false],
    [{ VERCEL_ENV: 'preview', NODE_ENV: 'production' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'true', VERCEL_ENV: 'production' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'TRUE', NODE_ENV: 'development' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'production' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'development', VERCEL_ENV: 'production' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'production', VERCEL_ENV: 'production' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'false', NODE_ENV: 'development' }, false],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'development' }, true],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'test' }, true],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'production', VERCEL_ENV: 'preview' }, true],
    [{ ATLAS_REVIEW_ENABLED: 'true', NODE_ENV: 'production', VERCEL_ENV: 'unknown' }, false],
  ] as const
  for (const [environment, expected] of cases) assert.equal(atlasReviewEnabled(environment), expected, JSON.stringify(environment))
})
