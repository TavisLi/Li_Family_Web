import type { Metadata } from 'next'

import { HomePageView } from '@/features/home/home-page'
import { getHomeConfig, getHomePageData } from '@/lib/data/home'
import { getMediaUrl } from '@/lib/media'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const homeConfig = await getHomeConfig()
  const heroImage = getMediaUrl(homeConfig.heroBackground)

  return {
    title: homeConfig.heroTitle || 'Web Li',
    description: homeConfig.heroSubtitle || 'A bilingual family portal.',
    openGraph: {
      title: homeConfig.heroTitle || 'Web Li',
      description: homeConfig.heroSubtitle || 'A bilingual family portal.',
      images: heroImage ? [{ url: heroImage }] : undefined,
    },
  }
}

export default async function HomePage() {
  const { homeConfig, members, posts, travelProjects } = await getHomePageData()

  return (
    <HomePageView
      homeConfig={homeConfig}
      members={members}
      posts={posts}
      travelProjects={travelProjects}
    />
  )
}
