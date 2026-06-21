export type SeedMediaRecord = {
  id: number
  sourcePath?: string | null
}

export function mediaIdsBySourcePath(media: SeedMediaRecord[]): Map<string, number> {
  return new Map(
    media.flatMap((item) => (item.sourcePath ? [[item.sourcePath, item.id] as const] : [])),
  )
}
