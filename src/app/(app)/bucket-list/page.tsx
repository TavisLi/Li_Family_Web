import type { Metadata } from 'next'

import { BucketListPage } from '@/features/bucket-list/bucket-list-page'
import { getBucketListData } from '@/lib/data/bucket-list'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Family Bucket List',
  description: 'Web Li 家人模式共同願望看板。',
}

export default async function BucketListRoute() {
  const data = await getBucketListData()

  return <BucketListPage data={data} />
}
