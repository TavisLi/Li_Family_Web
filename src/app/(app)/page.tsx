import type { Metadata } from 'next'

import { HomePageView } from '@/features/home/home-page'
import { getHomeConfig, getHomePageData } from '@/lib/data/home'
import { getMediaUrl } from '@/lib/media'
import { metadataImageUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const homeConfig = await getHomeConfig()
  const heroImage = getMediaUrl(homeConfig.heroBackground)

  return {
    alternates: {
      canonical: '/',
    },
    title: homeConfig.heroTitle || 'Web Li',
    description: homeConfig.heroSubtitle || 'A bilingual family portal.',
    openGraph: {
      title: homeConfig.heroTitle || 'Web Li',
      description: homeConfig.heroSubtitle || 'A bilingual family portal.',
      images: [{ url: metadataImageUrl(heroImage) }],
    },
  }
}

export default async function HomePage() {
  const {
    bucketItems,
    familySession,
    featuredTravel,
    homeConfig,
    members,
    posts,
    timelineEvent,
    travelProjects,
    wrappedCta,
  } = await getHomePageData()

  return (
    <HomePageView
      bucketItems={bucketItems}
      familySession={familySession}
      featuredTravel={featuredTravel}
      homeConfig={homeConfig}
      members={members}
      posts={posts}
      timelineEvent={timelineEvent}
      travelProjects={travelProjects}
      wrappedCta={wrappedCta}
    />
  )
}
