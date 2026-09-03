const videoIdPattern = /^[A-Za-z0-9_-]{6,}$/

export function toYouTubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    let videoId: string | null = null

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (host === 'youtube.com') {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v')
      } else if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/').filter(Boolean)[1] ?? null
      }
    }

    return videoId && videoIdPattern.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null
  } catch {
    return null
  }
}

export function toSafeYouTubeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    return url.protocol === 'https:' && (host === 'youtu.be' || host === 'youtube.com')
      ? value
      : null
  } catch {
    return null
  }
}

// Share identity across watch/shorts/embed/live links without changing whether
// an existing Daily renderer embeds a video or offers a safe external link.
export function toYouTubeVideoIdentity(value: string): string | null {
  const safeUrl = toSafeYouTubeExternalUrl(value)
  if (!safeUrl) return null
  const embedUrl = toYouTubeEmbedUrl(safeUrl)
  if (embedUrl) return embedUrl
  const url = new URL(safeUrl)
  const liveId = url.hostname.replace(/^www\./, '') === 'youtube.com'
    ? url.pathname.match(/^\/live\/([A-Za-z0-9_-]{6,})\/?$/)?.[1]
    : undefined
  return liveId ? `https://www.youtube-nocookie.com/embed/${liveId}` : safeUrl
}
