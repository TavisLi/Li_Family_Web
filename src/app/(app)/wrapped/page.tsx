import type { Metadata } from 'next'

import { WrappedPage } from '@/features/wrapped/wrapped-page'
import { getWrappedPageData } from '@/lib/data/wrapped'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Family Wrapped',
  description: 'Web Li 家人模式年度時光報告入口。',
}

export default async function WrappedRoute() {
  const data = await getWrappedPageData()

  return <WrappedPage data={data} />
}
