import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelDetailPage, travelInteractionIds } from '@/features/travel/travel-detail-page'
import { TravelMemoryOverviewPage } from '@/features/travel/travel-memory-pages'
import {
  getTravelInteractionThreads,
  getTravelMemoryOverviewBySlug,
  getTravelProjectBySlug,
} from '@/lib/data/travel'
import { getMediaUrl } from '@/lib/media'
import { absoluteSiteUrl, metadataImageUrl } from '@/lib/site-metadata'
import { travelMemoryMultipageEnabled } from '@/lib/travel-memory-rollout'

export const dynamic = 'force-dynamic'

type TravelPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: TravelPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Travel',
    }
  }

  if (project.isPrivate) {
    return {
      title: 'Family-only Travel',
      description: '這趟家庭旅行需要登入後才能閱讀。',
    }
  }

  const coverImage = getMediaUrl(project.coverImage)
  const travelUrl = `/travel/${slug}`

  return {
    alternates: {
      canonical: travelUrl,
    },
    title: project.title,
    description: project.summary || project.externalDocIdentifier || project.status,
    openGraph: {
      title: project.title,
      description: project.summary || project.externalDocIdentifier || project.status,
      url: absoluteSiteUrl(travelUrl),
      images: [{ url: metadataImageUrl(coverImage) }],
    },
  }
}

export default async function TravelPage({ params }: TravelPageProps) {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  if (project.kind === 'memory' && travelMemoryMultipageEnabled()) {
    const memory = await getTravelMemoryOverviewBySlug(slug)
    if (memory?.days.length) return <TravelMemoryOverviewPage memory={memory} />
  }

  const threads = await getTravelInteractionThreads(travelInteractionIds(project))

  return <TravelDetailPage project={project} threads={threads} />
}
