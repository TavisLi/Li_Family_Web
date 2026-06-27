import type { MediaSeed } from './seed-content'

type ExistingMediaRecord = {
  altText?: string | null
  id?: number | string
  sourcePath?: string | null
  tags?: { tag?: string | null }[] | null
  type?: string | null
}

export function mediaSeedData(item: MediaSeed) {
  return {
    type: 'photo' as const,
    altText: item.altText,
    sourcePath: item.sourcePath,
    tags: item.tags,
  }
}

export function mediaRecordMatchesSeed(existing: ExistingMediaRecord, item: MediaSeed): boolean {
  return (
    (existing.type ?? 'photo') === 'photo' &&
    (existing.altText ?? '') === item.altText &&
    (existing.sourcePath ?? '') === item.sourcePath &&
    sameTags(existing.tags, item.tags)
  )
}

function sameTags(
  existingTags: { tag?: string | null }[] | null | undefined,
  seedTags: { tag: string }[],
) {
  const existing = normalizedTags(existingTags ?? [])
  const seeded = normalizedTags(seedTags)

  if (existing.length !== seeded.length) {
    return false
  }

  return existing.every((tag, index) => tag === seeded[index])
}

function normalizedTags(tags: { tag?: string | null }[]) {
  return tags
    .map((tag) => tag.tag?.trim())
    .filter((tag): tag is string => Boolean(tag))
    .sort((left, right) => left.localeCompare(right))
}
