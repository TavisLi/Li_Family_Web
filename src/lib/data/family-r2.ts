import 'server-only'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

function privateFamilyStorage() {
  const account = process.env.FAMILY_R2_ACCOUNT_ID?.trim()
  const bucket = process.env.FAMILY_R2_BUCKET_NAME?.trim()
  const publicBucket = process.env.R2_BUCKET_NAME?.trim()
  const accessKeyId = process.env.FAMILY_R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.FAMILY_R2_SECRET_ACCESS_KEY?.trim()
  if (!account || !/^[a-f0-9]{32}$/.test(account) || !bucket || !publicBucket ||
      bucket === publicBucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Private family photo storage is unavailable')
  }
  return { bucket, client: new S3Client({ endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true, region: 'auto', maxAttempts: 1 }) }
}

let storage: ReturnType<typeof privateFamilyStorage> | undefined

export async function getPrivateFamilyPhoto(objectKey: string, signal: AbortSignal) {
  storage ??= privateFamilyStorage()
  const { client, bucket } = storage
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
      { abortSignal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) })
    if (!response.Body) return null
    return { body: response.Body.transformToWebStream(), bytes: response.ContentLength ?? 0,
      mimeType: response.ContentType ?? '' }
  } catch (error) {
    if (error instanceof Error && error.name === 'NoSuchKey') return null
    throw error
  }
}
