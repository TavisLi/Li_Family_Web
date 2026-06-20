import type { Metadata } from 'next'

import { BucketListPage } from '@/features/bucket-list/bucket-list-page'
import { getBucketListData } from '@/lib/data/bucket-list'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: {
    canonical: '/bucket-list',
  },
  title: 'Family Bucket List',
  description: 'Web Li 家人模式共同願望看板。',
  openGraph: {
    images: [{ url: metadataImageUrl(null) }],
  },
}

export default async function BucketListRoute() {
  const data = await getBucketListData()

  return <BucketListPage data={data} />
}
