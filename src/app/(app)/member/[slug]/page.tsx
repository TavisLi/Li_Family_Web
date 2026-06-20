import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { MemberProfilePage } from '@/features/member/member-profile-page'
import { getMemberBySlug } from '@/lib/data/members'
import { getMediaUrl } from '@/lib/media'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

type MemberPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { slug } = await params
  const member = await getMemberBySlug(slug)

  if (!member) {
    return {
      title: 'Member',
    }
  }

  const image = getMediaUrl(member.heroImage ?? member.avatar)

  return {
    alternates: {
      canonical: `/member/${slug}`,
    },
    title: member.displayName,
    description: member.bio || member.status || `Profile for ${member.displayName}`,
    openGraph: {
      title: member.displayName,
      description: member.bio || member.status || `Profile for ${member.displayName}`,
      images: [{ url: metadataImageUrl(image) }],
    },
  }
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { slug } = await params
  const member = await getMemberBySlug(slug)

  if (!member) {
    notFound()
  }

  return <MemberProfilePage member={member} />
}
