import type { CollectionAfterReadHook, CollectionBeforeValidateHook } from 'payload'

export const photoSizes = [
  { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
  { name: 'medium', width: 800, height: 800, position: 'centre' },
  { name: 'large', width: 1600, height: 1200, position: 'centre' },
] as const

export const familyPhotoSizes = photoSizes.map(size => size.name)
export const familyPhotoVariants = ['original', ...familyPhotoSizes] as const
export type FamilyPhotoVariant = typeof familyPhotoVariants[number]
const familyKey = /^[a-f0-9]{64}$/

export function isFamilyAssetKey(value: unknown): value is string {
  return typeof value === 'string' && familyKey.test(value)
}

export function familyPhotoObjectKey(key: string, variant: FamilyPhotoVariant) {
  if (!isFamilyAssetKey(key) || !familyPhotoVariants.includes(variant)) throw new Error('Invalid family photo identity')
  return `family-media/${key}/${variant}.jpeg`
}

export const protectFamilyMediaStorage: CollectionBeforeValidateHook = ({ data, originalDoc, req, operation }) => {
  const existing = originalDoc?.familyAssetKey
  const submitted = data?.familyAssetKey
  if (operation === 'update' && submitted !== undefined && (existing ?? null) !== (submitted ?? null)) {
    throw new Error('A Media storage boundary cannot be changed in place')
  }
  if (existing == null && submitted == null) return data
  if (!isFamilyAssetKey(existing ?? submitted) || req.file ||
      data?.filename || data?.url || data?.thumbnailURL || data?._objectKey ||
      originalDoc?.filename || originalDoc?._objectKey ||
      Object.values(data?.sizes ?? {}).some(size => {
        const value = size as { filename?: string; url?: string } | null
        return Boolean(value?.filename || value?.url)
      })) {
    throw new Error('Family photos require the private object store')
  }
  if ((data?.type ?? originalDoc?.type) !== 'photo' || data?.mimeType && data.mimeType !== 'image/jpeg') {
    throw new Error('Unsupported family photo format')
  }
  return data
}

export const projectFamilyMediaUrls: CollectionAfterReadHook = ({ doc }) => {
  if (doc.familyAssetKey == null) return doc
  if (!isFamilyAssetKey(doc.familyAssetKey) || !Number.isSafeInteger(doc.id) || doc.id <= 0) {
    return { ...doc, url: null, thumbnailURL: null, sizes: null }
  }
  const base = `/api/family-media/${doc.id}`
  return {
    ...doc,
    url: `${base}/original`,
    thumbnailURL: `${base}/thumbnail`,
    sizes: Object.fromEntries(familyPhotoSizes.map(name => [name, { url: `${base}/${name}` }])),
  }
}
