const DEFAULT_SITE_URL = 'http://localhost:3000'
const DEFAULT_OG_IMAGE_PATH = '/opengraph-image'

export function siteMetadataBase(value = process.env.NEXT_PUBLIC_SERVER_URL): URL {
  return new URL(value?.trim() || DEFAULT_SITE_URL)
}

export function absoluteSiteUrl(
  path: string,
  value = process.env.NEXT_PUBLIC_SERVER_URL,
): string {
  return new URL(path, siteMetadataBase(value)).toString()
}

export function metadataImageUrl(
  mediaUrl: string | null | undefined,
  value = process.env.NEXT_PUBLIC_SERVER_URL,
): string {
  return mediaUrl?.trim()
    ? new URL(mediaUrl, siteMetadataBase(value)).toString()
    : absoluteSiteUrl(DEFAULT_OG_IMAGE_PATH, value)
}
