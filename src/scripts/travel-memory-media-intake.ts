import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import exifr from 'exifr'
import { type MediaRegistry, type MediaRegistryEntry, validateMediaRegistry } from './travel-memory-media-registry'

const mimeTypes: Record<string, string> = {
  jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heif: 'image/heif',
  avif: 'image/avif', tiff: 'image/tiff', gif: 'image/gif',
}

type ReviewItem = { file: string; reason: string; assetId?: string }

async function hashFile(filename: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(filename)) hash.update(chunk)
  return `sha256:${hash.digest('hex')}`
}

async function filesUnder(root: string): Promise<{ files: string[]; review: ReviewItem[] }> {
  const files: string[] = []
  const review: ReviewItem[] = []
  async function visit(directory: string) {
    for (const item of (await readdir(path.join(root, directory), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const relative = path.posix.join(directory, item.name)
      if (item.isSymbolicLink()) review.push({ file: relative, reason: 'symlink-skipped' })
      else if (item.isDirectory()) await visit(relative)
      else if (item.isFile()) files.push(relative)
      else review.push({ file: relative, reason: 'non-file-skipped' })
    }
  }
  await visit('')
  return { files, review }
}

function metadataValue(value: unknown): string | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function firstValue(groups: Record<string, unknown>[], keys: string[]): string | undefined {
  for (const group of groups) for (const key of keys) {
    const value = metadataValue(group[key])
    if (value) return value
  }
  return undefined
}

function metadataGroups(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return []
  const root = value as Record<string, unknown>
  return [root, ...Object.values(root).filter(item => item && typeof item === 'object' && !Array.isArray(item)) as Record<string, unknown>[]]
}

export async function scanTravelMedia(input: string, slug: string, output = path.join('.travel-media-staging', slug)) {
  const root = await realpath(input)
  const priorPath = path.join(output, 'registry.json')
  let previous: MediaRegistry | undefined
  try { previous = validateMediaRegistry(JSON.parse(await readFile(priorPath, 'utf8')), slug) }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  const { files, review } = await filesUnder(root)
  const assets = new Map<string, MediaRegistryEntry>()
  for (const relative of files) {
    const filename = path.join(root, relative)
    const before = await stat(filename)
    const byteSize = before.size
    if (!byteSize) { review.push({ file: relative, reason: 'empty-file' }); continue }
    const assetId = await hashFile(filename)
    const existing = assets.get(assetId)
    if (existing) {
      existing.files.push(relative)
      review.push({ file: relative, assetId, reason: 'exact-duplicate-bytes' })
      continue
    }
    try {
      const image = await sharp(filename).metadata()
      const mimeType = mimeTypes[image.format ?? '']
      if (!mimeType || !image.width || !image.height) throw new Error('unsupported-image-or-missing-dimensions')
      let parsed: unknown
      try { parsed = await exifr.parse(filename, { tiff: true, exif: true, gps: true, iptc: true, xmp: true, mergeOutput: false }) }
      catch { review.push({ file: relative, assetId, reason: 'embedded-metadata-unreadable' }) }
      const groups = metadataGroups(parsed)
      const capturedAt = firstValue(groups, ['DateTimeOriginal', 'CreateDate', 'DateCreated'])
      const timezone = firstValue(groups, ['OffsetTimeOriginal', 'OffsetTime', 'TimeZone'])
      const latitude = groups.map(group => group.latitude).find(value => typeof value === 'number')
      const longitude = groups.map(group => group.longitude).find(value => typeof value === 'number')
      const captions = [...new Set(groups.flatMap(group => ['Caption', 'CaptionAbstract', 'Description', 'ImageDescription'].map(key => metadataValue(group[key])).filter((item): item is string => Boolean(item))))]
      const after = await stat(filename)
      if (after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
        review.push({ file: relative, assetId, reason: 'file-changed-during-scan' })
        continue
      }
      const prior = previous?.assets.find(item => item.assetId === assetId)
      assets.set(assetId, {
        assetId, files: [relative], filename: path.basename(relative), mimeType,
        width: image.width, height: image.height, byteSize, provenance: 'local-file',
        ...(capturedAt ? { capturedAt, ...(!timezone ? { captureTimeUncertain: true } : {}) } : {}),
        ...(timezone ? { timezone } : {}),
        ...(typeof latitude === 'number' && typeof longitude === 'number' ? { gps: { latitude, longitude } } : {}),
        ...(captions.length ? { embeddedCaptionCandidates: captions } : {}),
        ...(prior?.sourcePath ? { sourcePath: prior.sourcePath } : {}),
        ...(prior?.derivedFrom ? { derivedFrom: prior.derivedFrom } : {}),
        locators: prior?.locators ?? [],
      })
      if (capturedAt && !timezone) review.push({ file: relative, assetId, reason: 'capture-timezone-unknown' })
    } catch (error) {
      review.push({ file: relative, assetId, reason: `metadata-unreadable:${error instanceof Error ? error.message : 'unknown'}` })
    }
  }
  const registry = validateMediaRegistry({ version: 1, travelSlug: slug,
    assets: [...assets.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)) }, slug)
  review.sort((a, b) => a.file.localeCompare(b.file, 'en') || a.reason.localeCompare(b.reason, 'en'))
  const summary = {
    travelSlug: slug, scannedFiles: files.length, uniqueImages: registry.assets.length,
    exactDuplicates: review.filter(item => item.reason === 'exact-duplicate-bytes').length,
    needsReview: review.length, totalUniqueBytes: registry.assets.reduce((sum, item) => sum + item.byteSize, 0),
  }
  await mkdir(output, { recursive: true })
  await writeFile(priorPath, `${JSON.stringify(registry, null, 2)}\n`)
  await writeFile(path.join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  await writeFile(path.join(output, 'review-queue.json'), `${JSON.stringify(review, null, 2)}\n`)
  return { registry, summary, review }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2)
  if (args.length !== 4 || args[0] !== '--slug' || args[2] !== '--input') {
    throw new Error('Usage: travel-memory-media-intake.ts --slug <travel-slug> --input <photo-folder>')
  }
  const result = await scanTravelMedia(args[3]!, args[1]!)
  console.log(JSON.stringify(result.summary))
}
