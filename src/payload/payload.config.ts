import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Categories } from './collections/Categories'
import { BucketItems } from './collections/BucketItems'
import { Comments } from './collections/Comments'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { TimelineEvents } from './collections/TimelineEvents'
import { TravelMemories } from './collections/TravelMemories'
import { TravelPlans } from './collections/TravelPlans'
import { TravelRouteIdentities } from './collections/TravelRouteIdentities'
import { Users } from './collections/Users'
import { WrappedSnapshots } from './collections/WrappedSnapshots'
import { HomeConfig } from './globals/HomeConfig'
import { SiteConfig } from './globals/SiteConfig'
import { r2PublicFileUrl } from './r2'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const r2AccountId = process.env.R2_ACCOUNT_ID?.trim()
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const r2Bucket = process.env.R2_BUCKET_NAME?.trim()
const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()
const r2Enabled = Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2Bucket)
const r2MediaStorage = r2PublicUrl
  ? {
      disablePayloadAccessControl: true as const,
      generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string | null }) =>
        r2PublicFileUrl(r2PublicUrl, filename, prefix),
    }
  : true

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Categories,
    Posts,
    TravelPlans,
    TravelMemories,
    TravelRouteIdentities,
    TimelineEvents,
    BucketItems,
    WrappedSnapshots,
    Comments,
    Media,
  ],
  globals: [SiteConfig, HomeConfig],
  editor: lexicalEditor(),
  localization: {
    locales: ['zh-TW', 'en'],
    defaultLocale: 'zh-TW',
    fallback: true,
  },
  custom: {
    supportedLocales: ['zh-TW', 'en'],
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    push: process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true',
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      max: 3,
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    s3Storage({
      enabled: r2Enabled,
      collections: {
        media: r2MediaStorage,
      },
      bucket: r2Bucket || 'missing-r2-bucket',
      config: {
        credentials: {
          accessKeyId: r2AccessKeyId || '',
          secretAccessKey: r2SecretAccessKey || '',
        },
        endpoint: r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined,
        forcePathStyle: true,
        region: 'auto',
      },
    }),
  ],
})
