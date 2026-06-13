import type { Media } from '@/payload/payload-types'

export type MediaValue = Media | number | null | undefined

export function isMediaObject(media: MediaValue): media is Media {
  return Boolean(media && typeof media === 'object')
}

export function getMediaUrl(media: MediaValue): string | null {
  if (!isMediaObject(media)) {
    return null
  }

  return media.sizes?.large?.url ?? media.sizes?.medium?.url ?? media.url ?? null
}

export function getMediaAlt(media: MediaValue, fallback: string): string {
  if (!isMediaObject(media)) {
    return fallback
  }

  return media.altText || fallback
}
