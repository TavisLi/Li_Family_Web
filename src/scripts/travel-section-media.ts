import type { MediaSeed, TravelSeed } from './seed-content'

type SourceSectionSeed = NonNullable<TravelSeed['sourceSections']>[number]

export type TravelSeedWrite = Omit<TravelSeed, 'sourceSections'> & {
  sourceSections?: (SourceSectionSeed & {
    mediaItems?: number[]
  })[]
}

export function attachSourceSectionMediaIds({
  mediaBySourcePath,
  mediaItems,
  travel,
}: {
  mediaBySourcePath: Map<string, number>
  mediaItems: MediaSeed[]
  travel: TravelSeed
}): TravelSeedWrite {
  const mediaIdsBySection = new Map<string, number[]>()

  for (const media of mediaItems) {
    if (media.ownerType !== 'travel' || media.ownerSlug !== travel.slug || !media.sectionId) {
      continue
    }

    const mediaId = mediaBySourcePath.get(media.sourcePath)

    if (!mediaId) {
      continue
    }

    const ids = mediaIdsBySection.get(media.sectionId) ?? []
    ids.push(mediaId)
    mediaIdsBySection.set(media.sectionId, ids)
  }

  return {
    ...travel,
    sourceSections: travel.sourceSections?.map((section) => {
      const mediaItemsForSection = mediaIdsBySection.get(section.anchor)

      if (!mediaItemsForSection?.length) {
        return section
      }

      return {
        ...section,
        mediaItems: mediaItemsForSection,
      }
    }),
  }
}
