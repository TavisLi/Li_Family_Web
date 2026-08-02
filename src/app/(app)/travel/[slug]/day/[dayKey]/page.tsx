import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelMemoryDayPage } from '@/features/travel/travel-memory-pages'
import { getTravelMemoryDayBySlug } from '@/lib/data/travel'
import { getMediaUrl } from '@/lib/media'
import { absoluteSiteUrl, metadataImageUrl } from '@/lib/site-metadata'
import { travelMemoryMultipageEnabled } from '@/lib/travel-memory-rollout'

export const dynamic = 'force-dynamic'

type TravelMemoryDayRouteProps = {
  params: Promise<{ slug: string; dayKey: string }>
}

export async function generateMetadata({ params }: TravelMemoryDayRouteProps): Promise<Metadata> {
  if (!travelMemoryMultipageEnabled()) return { title: 'Travel memory' }

  const { dayKey, slug } = await params
  const view = await getTravelMemoryDayBySlug(slug, dayKey)
  if (!view) return { title: 'Travel memory' }

  const title = `Day ${view.day.day} · ${view.day.title}`
  const description = view.day.story || view.day.theme || `${view.memory.title} 的每日旅行回憶。`
  const route = `/travel/${slug}/day/${dayKey}`

  return {
    alternates: { canonical: route },
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteSiteUrl(route),
      images: [{ url: metadataImageUrl(getMediaUrl(view.memory.coverImage)) }],
    },
  }
}

export default async function TravelMemoryDayRoute({ params }: TravelMemoryDayRouteProps) {
  if (!travelMemoryMultipageEnabled()) notFound()

  const { dayKey, slug } = await params
  const view = await getTravelMemoryDayBySlug(slug, dayKey)
  if (!view) notFound()

  return <TravelMemoryDayPage view={view} />
}
