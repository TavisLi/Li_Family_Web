import { z } from 'zod'

export const assetIdSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/)
const sourcePathSchema = z.string().regex(/^travels\/[a-z0-9-]+\//)
  .refine(value => !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..'))

const locatorSchema = z.object({
  environment: z.string().min(1), payloadId: z.number().int().positive(),
  verified: z.boolean(), verifiedByteHash: assetIdSchema.optional(), sourcePath: sourcePathSchema.optional(),
}).strict()

export const registryEntrySchema = z.object({
  assetId: assetIdSchema,
  files: z.array(z.string().min(1)),
  sourcePath: sourcePathSchema.optional(),
  filename: z.string().min(1), mimeType: z.string().min(1),
  width: z.number().int().positive(), height: z.number().int().positive(),
  byteSize: z.number().int().positive(),
  capturedAt: z.string().optional(), timezone: z.string().optional(), captureTimeUncertain: z.boolean().optional(),
  gps: z.object({ latitude: z.number(), longitude: z.number() }).strict().optional(),
  embeddedCaptionCandidates: z.array(z.string()).optional(),
  derivedFrom: assetIdSchema.optional(),
  provenance: z.enum(['local-file', 'production-upload']),
  byteProvenance: z.string().min(1).optional(),
  locators: z.array(locatorSchema).default([]),
}).strict()

export const mediaRegistrySchema = z.object({
  version: z.literal(1), travelSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  assets: z.array(registryEntrySchema),
}).strict()
export type MediaRegistry = z.infer<typeof mediaRegistrySchema>
export type MediaRegistryEntry = MediaRegistry['assets'][number]

export function validateMediaRegistry(value: unknown, slug: string): MediaRegistry {
  const registry = mediaRegistrySchema.parse(value)
  if (registry.travelSlug !== slug) throw new Error(`Registry travel slug mismatch: ${slug}`)
  const ids = new Set<string>()
  const aliases = new Set<string>()
  const locatedMedia = new Map<string, string>()
  for (const asset of registry.assets) {
    if (ids.has(asset.assetId)) throw new Error(`Duplicate assetId: ${asset.assetId}`)
    ids.add(asset.assetId)
    if (asset.provenance === 'local-file' && !asset.files.length) throw new Error(`Local asset has no file: ${asset.assetId}`)
    if (asset.provenance === 'production-upload' && !asset.byteProvenance) throw new Error(`Production upload byte provenance missing: ${asset.assetId}`)
    if (asset.sourcePath) {
      if (!asset.sourcePath.startsWith(`travels/${slug}/`)) throw new Error(`Cross-owner alias: ${asset.sourcePath}`)
      if (aliases.has(asset.sourcePath)) throw new Error(`Alias collision: ${asset.sourcePath}`)
      aliases.add(asset.sourcePath)
    }
    for (const locator of asset.locators) {
      if (locator.sourcePath && locator.sourcePath !== asset.sourcePath) throw new Error(`Locator alias mismatch: ${asset.assetId}`)
      if (locator.verified) {
        if (locator.verifiedByteHash !== asset.assetId) throw new Error(`Verified Media byte hash mismatch: ${asset.assetId}`)
        const key = `${locator.environment}:${locator.payloadId}`
        const existing = locatedMedia.get(key)
        if (existing && existing !== asset.assetId) throw new Error(`Media locator hash collision: ${key}`)
        locatedMedia.set(key, asset.assetId)
      }
    }
  }
  return registry
}

export function resolveRegistryEntry(registry: MediaRegistry, reference: string): MediaRegistryEntry | undefined {
  const matches = registry.assets.filter(asset => asset.assetId === reference || asset.sourcePath === reference)
  if (matches.length > 1) throw new Error(`Ambiguous registry reference: ${reference}`)
  return matches[0]
}

export function resolveRegistryMediaId(registry: MediaRegistry, assetId: string, environment: string): number | undefined {
  const asset = resolveRegistryEntry(registry, assetId)
  if (!asset || asset.assetId !== assetId) throw new Error(`Missing registry assetId: ${assetId}`)
  const matches = asset.locators.filter(locator => locator.environment === environment && locator.verified)
  if (matches.length > 1) throw new Error(`Ambiguous verified Media locator: ${assetId}`)
  return matches[0]?.payloadId
}
