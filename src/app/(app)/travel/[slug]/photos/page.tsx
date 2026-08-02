import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelPhotoGalleryPage } from '@/features/travel/travel-photo-gallery'
import { TravelMemoryGalleryPage } from '@/features/travel/travel-memory-pages'
import { getTravelMemoryGalleryBySlug, getTravelProjectBySlug } from '@/lib/data/travel'
import { getMediaUrl } from '@/lib/media'
import { absoluteSiteUrl, metadataImageUrl } from '@/lib/site-metadata'
import { travelMemoryMultipageEnabled } from '@/lib/travel-memory-rollout'

export const dynamic = 'force-dynamic'

type TravelPhotosPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{ day?: string; location?: string; page?: string }>
}

export async function generateMetadata({ params }: TravelPhotosPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Travel photos',
    }
  }

  const coverImage = getMediaUrl(project.coverImage)

  return {
    alternates: {
      canonical: `/travel/${slug}/photos`,
    },
    title: `${project.title} photos`,
    description: `${project.title} 的完整旅行照片。`,
    openGraph: {
      title: `${project.title} photos`,
      description: `${project.title} 的完整旅行照片。`,
      url: absoluteSiteUrl(`/travel/${slug}/photos`),
      images: [{ url: metadataImageUrl(coverImage) }],
    },
  }
}

export default async function TravelPhotosPage({ params, searchParams }: TravelPhotosPageProps) {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  if (project.kind === 'memory' && travelMemoryMultipageEnabled()) {
    const { day, location, page } = await searchParams
    const parsedPage = Number.parseInt(page ?? '1', 10)
    const gallery = await getTravelMemoryGalleryBySlug(slug, {
      dayKey: day,
      location,
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
    })
    if (gallery?.memory.days.length) return <TravelMemoryGalleryPage gallery={gallery} />
  }

  return <TravelPhotoGalleryPage project={project} />
}
