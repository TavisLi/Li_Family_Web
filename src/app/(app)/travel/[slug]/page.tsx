import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelDetailPage, travelInteractionIds } from '@/features/travel/travel-detail-page'
import {
  getTravelInteractionThread,
  getTravelProjectBySlug,
} from '@/lib/data/travel'
import { getMediaUrl } from '@/lib/media'
import { metadataImageUrl } from '@/lib/site-metadata'

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

  return {
    alternates: {
      canonical: `/travel/${slug}`,
    },
    title: project.title,
    description: project.summary || project.externalDocIdentifier || project.status,
    openGraph: {
      title: project.title,
      description: project.summary || project.externalDocIdentifier || project.status,
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

  const threadEntries = await Promise.all(
    travelInteractionIds(project).map(async (associatedId) => [
      associatedId,
      await getTravelInteractionThread(associatedId),
    ] as const),
  )

  return <TravelDetailPage project={project} threads={Object.fromEntries(threadEntries)} />
}
