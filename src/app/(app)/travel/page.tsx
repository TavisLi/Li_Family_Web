import type { Metadata } from 'next'

import { TravelIndexPage } from '@/features/travel/travel-index-page'
import { getTravelProjects } from '@/lib/data/travel'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: {
    canonical: '/travel',
  },
  title: 'Travel',
  description: 'Web Li 家庭旅行索引廊道，收納規劃中行程與已完成回憶。',
  openGraph: {
    images: [{ url: metadataImageUrl(null) }],
  },
}

export default async function TravelPage() {
  const projects = await getTravelProjects()

  return <TravelIndexPage projects={projects} />
}
