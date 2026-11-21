import { familyPhotoObjectKey, familyPhotoVariants, isFamilyAssetKey, type FamilyPhotoVariant } from '../../payload/family-media'

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Vary': 'Cookie, Authorization',
  'X-Content-Type-Options': 'nosniff',
}
const reject = (status: number) => new Response(null, { status, headers: privateHeaders })
const maxPhotoBytes = 32 * 1024 * 1024

type PrivatePhoto = { body: ReadableStream<Uint8Array>; bytes: number; mimeType: string }

export async function familyMediaResponse(input: {
  id: string
  variant: string
  canReadFamily: boolean
  findFamilyKey: (id: number) => Promise<string | null | undefined>
  getPrivatePhoto: (objectKey: string) => Promise<PrivatePhoto | null>
}) {
  if (!input.canReadFamily || !/^[1-9][0-9]*$/.test(input.id) ||
      !Number.isSafeInteger(Number(input.id)) ||
      !familyPhotoVariants.includes(input.variant as FamilyPhotoVariant)) return reject(404)
  try {
    const key = await input.findFamilyKey(Number(input.id))
    if (!isFamilyAssetKey(key)) return reject(404)
    const item = await input.getPrivatePhoto(familyPhotoObjectKey(key, input.variant as FamilyPhotoVariant))
    if (!item) return reject(404)
    if (item.mimeType !== 'image/jpeg' || !Number.isSafeInteger(item.bytes) || item.bytes <= 0 || item.bytes > maxPhotoBytes) {
      await item.body.cancel()
      return reject(502)
    }
    let received = 0
    const bounded = item.body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength
        if (received > item.bytes) controller.error(new Error('Family photo exceeded its verified size'))
        else controller.enqueue(chunk)
      },
      flush(controller) {
        if (received !== item.bytes) controller.error(new Error('Family photo size mismatch'))
      },
    }))
    return new Response(bounded, { headers:{...privateHeaders,'Content-Type':'image/jpeg','Content-Length':String(item.bytes)} })
  } catch {
    return reject(503)
  }
}
