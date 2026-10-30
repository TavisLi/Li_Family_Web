type AtlasReviewEnvironment = {
  ATLAS_REVIEW_ENABLED?: string
  NODE_ENV?: string
  VERCEL_ENV?: string
}

export function atlasReviewEnabled(env: AtlasReviewEnvironment): boolean {
  if (env.ATLAS_REVIEW_ENABLED !== 'true') return false
  if (env.VERCEL_ENV !== undefined) return env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'development'
  return env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
}
