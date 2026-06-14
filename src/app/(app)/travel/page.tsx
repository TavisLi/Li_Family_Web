import type { Metadata } from 'next'

import { TravelIndexPage } from '@/features/travel/travel-index-page'
import { getTravelProjects } from '@/lib/data/travel'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Travel',
  description: 'Web Li 家庭旅行索引廊道，收納規劃中行程與已完成回憶。',
}

export default async function TravelPage() {
  const projects = await getTravelProjects()

  return <TravelIndexPage projects={projects} />
}
