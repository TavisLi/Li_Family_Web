import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Plane, UsersRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import { getHomeConfig, getHomePageData } from '@/lib/data/home'
import type { TravelProject, User } from '@/payload/payload-types'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const homeConfig = await getHomeConfig()

  return {
    title: homeConfig.heroTitle || 'Web Li',
    description: homeConfig.heroSubtitle || 'A bilingual family portal.',
    openGraph: {
      title: homeConfig.heroTitle || 'Web Li',
      description: homeConfig.heroSubtitle || 'A bilingual family portal.',
    },
  }
}

function memberTone(member: User) {
  const persona = member.theme?.persona

  if (persona === 'tavis' || persona === 'lynn' || persona === 'leo') {
    return persona
  }

  return 'neutral'
}

function travelTone(project: TravelProject) {
  return project.status === 'planning' ? 'travel' : 'lynn'
}

export default async function HomePage() {
  const { homeConfig, members, posts, travelProjects } = await getHomePageData()
  const featuredTravel =
    typeof homeConfig.featuredTravel === 'object' ? homeConfig.featuredTravel : travelProjects[0]

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-8 pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/30 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-md">
            <UsersRound className="size-4" aria-hidden="true" />
            Li Family Portal
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-foreground md:text-6xl">
            {homeConfig.heroTitle || 'Welcome to Web Li'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {homeConfig.heroSubtitle ||
              '家人的足迹、文章、旅行计划与长期记忆，在这里安静地汇流。'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin">
                Open CMS
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {featuredTravel ? (
              <Button asChild variant="outline">
                <Link href={`/travel/${featuredTravel.slug}`}>
                  Latest Travel
                  <Plane aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <PayloadImage
          className="min-h-72 shadow-lg"
          fallbackLabel={homeConfig.heroTitle || 'Web Li'}
          media={homeConfig.heroBackground}
          priority
          sizes="(min-width: 1024px) 42vw, 100vw"
          tone="neutral"
        />
      </section>

      <section className="py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Family</p>
            <h2 className="text-2xl font-semibold tracking-normal">Members</h2>
          </div>
          <UsersRound className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.length > 0 ? (
            members.map((member) => (
              <Link
                className="group rounded-lg border border-white/20 bg-white/35 p-3 shadow-sm backdrop-blur-md transition-transform hover:-translate-y-0.5"
                href={`/member/${member.slug}`}
                key={member.id}
              >
                <PayloadImage
                  fallbackLabel={member.displayName}
                  media={member.avatar}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  tone={memberTone(member)}
                />
                <div className="mt-4">
                  <h3 className="font-semibold tracking-normal">{member.displayName}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {member.status || member.bio || 'Family member'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <ImageFallback className="sm:col-span-2 lg:col-span-3" label="Family members" />
          )}
        </div>
      </section>

      <section className="grid gap-6 py-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Travel</p>
              <h2 className="text-2xl font-semibold tracking-normal">Recent Footprints</h2>
            </div>
            <Plane className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="grid gap-4">
            {travelProjects.length > 0 ? (
              travelProjects.slice(0, 3).map((project) => (
                <Link
                  className="grid gap-4 rounded-lg border border-white/20 bg-white/35 p-3 shadow-sm backdrop-blur-md md:grid-cols-[12rem_1fr]"
                  href={`/travel/${project.slug}`}
                  key={project.id}
                >
                  <PayloadImage
                    fallbackLabel={project.title}
                    media={project.coverImage}
                    sizes="(min-width: 768px) 12rem, 100vw"
                    tone={travelTone(project)}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarDays className="size-4" aria-hidden="true" />
                      {project.startDate} - {project.endDate}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-normal">{project.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {project.summary || project.externalDocIdentifier || project.status}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <ImageFallback label="Travel projects" tone="travel" />
            )}
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Blog</p>
              <h2 className="text-2xl font-semibold tracking-normal">Family Notes</h2>
            </div>
            <BookOpen className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="grid gap-3">
            {posts.length > 0 ? (
              posts.slice(0, 4).map((post) => (
                <article
                  className="rounded-lg border border-white/20 bg-white/35 p-4 shadow-sm backdrop-blur-md"
                  key={post.id}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {post.publishedDate}
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-normal">{post.title}</h3>
                </article>
              ))
            ) : (
              <ImageFallback className="min-h-64" label="Family notes" tone="neutral" />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
