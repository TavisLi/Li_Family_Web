export type MediaRefreshRequest =
  | { type: 'sources'; sourcePaths: string[] }
  | { type: 'missing-current-media' }

export function mediaSourcePathFromArgs(args: string[]): string | undefined {
  return mediaSourcePathsFromArgs(args)[0]
}

export function mediaSourcePathsFromArgs(args: string[]): string[] {
  const index = args.indexOf('--refresh-media-source')

  if (index === -1) {
    return []
  }

  const sourcePaths = args
    .slice(index + 1)
    .filter((argument) => argument !== '--' && !argument.startsWith('--'))

  if (sourcePaths.length === 0) {
    throw new Error('--refresh-media-source requires a source path')
  }

  return sourcePaths
}

export function mediaRefreshRequestFromArgs(args: string[]): MediaRefreshRequest | undefined {
  if (args.includes('--refresh-missing-current-media')) {
    return { type: 'missing-current-media' }
  }

  const sourcePaths = mediaSourcePathsFromArgs(args)

  return sourcePaths.length > 0 ? { type: 'sources', sourcePaths } : undefined
}
