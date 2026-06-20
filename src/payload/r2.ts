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
