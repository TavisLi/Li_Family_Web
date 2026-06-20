import type { Metadata } from 'next'

import { WrappedPage } from '@/features/wrapped/wrapped-page'
import { getWrappedPageData } from '@/lib/data/wrapped'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: {
    canonical: '/wrapped',
  },
  title: 'Family Wrapped',
  description: 'Web Li 家人模式年度時光報告入口。',
  openGraph: {
    images: [{ url: metadataImageUrl(null) }],
  },
}

export default async function WrappedRoute() {
  const data = await getWrappedPageData()

  return <WrappedPage data={data} />
}
