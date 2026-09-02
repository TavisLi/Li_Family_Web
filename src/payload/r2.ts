import type { CollectionAfterReadHook } from 'payload'

import type { Media } from './payload-types'

// Read-only Preview can serve public R2 images without storage write credentials.
export const readPublicR2Media = (publicUrl: string): CollectionAfterReadHook<Media> =>
  ({ doc }) => {
    if (!doc.filename) return doc

    const result = {
      ...doc,
      url: r2PublicFileUrl(publicUrl, doc.filename),
      sizes: doc.sizes ? { ...doc.sizes } : doc.sizes,
    }
    for (const name of ['thumbnail', 'medium', 'large'] as const) {
      const size = result.sizes?.[name]
      if (size?.filename && result.sizes) {
        result.sizes[name] = { ...size, url: r2PublicFileUrl(publicUrl, size.filename) }
      }
    }
    if (result.sizes?.thumbnail?.filename) {
      result.thumbnailURL = result.sizes.thumbnail.url
    }
    return result
  }

export function r2PublicFileUrl(publicUrl: string, filename: string, prefix?: string | null): string
export function r2PublicFileUrl(
  publicUrl: undefined,
  filename: string,
  prefix?: string | null,
): undefined
export function r2PublicFileUrl(
  publicUrl: string | undefined,
  filename: string,
  prefix?: string | null,
): string | undefined {
  const baseUrl = publicUrl?.trim()

  if (!baseUrl) {
    return undefined
  }

  const key = prefix ? `${prefix}/${filename}` : filename

  return new URL(key.replace(/^\/+/, ''), `${baseUrl.replace(/\/+$/, '')}/`).toString()
}
