import type { Metadata } from 'next'

import { TimelinePageView } from '@/features/timeline/timeline-page'
import { getTimelineIndex } from '@/lib/data/timeline'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: {
    canonical: '/timeline',
  },
  title: 'Time Machine Timeline',
  description: 'Web Li 公開時空膠囊大事記，家人模式可解鎖完整家庭事件。',
  openGraph: {
    images: [{ url: metadataImageUrl(null) }],
  },
}

type TimelinePageProps = {
  searchParams: Promise<{
    page?: string
    year?: string
  }>
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const params = await searchParams
  const selectedYear = parseNumber(params.year)
  const page = parseNumber(params.page) ?? 1
  const data = await getTimelineIndex({
    page,
    year: selectedYear,
  })

  return <TimelinePageView data={data} />
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : undefined
}
