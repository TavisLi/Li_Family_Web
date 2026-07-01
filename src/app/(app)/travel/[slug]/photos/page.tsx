import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelPhotoGalleryPage } from '@/features/travel/travel-photo-gallery'
import { getTravelProjectBySlug } from '@/lib/data/travel'
import { getMediaUrl } from '@/lib/media'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

type TravelPhotosPageProps = {
  params: Promise<{
    slug: string
  }>
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
      images: [{ url: metadataImageUrl(coverImage) }],
    },
  }
}

export default async function TravelPhotosPage({ params }: TravelPhotosPageProps) {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return <TravelPhotoGalleryPage project={project} />
}
