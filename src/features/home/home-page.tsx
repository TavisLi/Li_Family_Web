import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  CheckCircle2,
  HeartHandshake,
  LockKeyhole,
  Newspaper,
  Plane,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { FamilySession } from '@/lib/data/auth'
import type { WrappedHomeCta } from '@/lib/data/wrapped'
import { getMediaUrl } from '@/lib/media'
import type {
  BucketItem,
  HomeConfig,
  Media,
  Post,
  TimelineEvent,
  TravelProject,
  User,
} from '@/payload/payload-types'
import { HomeBucketQuickView } from './home-bucket-quick-view'

type HomePageViewProps = {
  bucketItems: BucketItem[]
  familySession: FamilySession
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  timelineEvent: TimelineEvent | null
  travelProjects: TravelProject[]
  wrappedCta: WrappedHomeCta
}

type MemberTone = 'neutral' | 'tavis' | 'lynn' | 'leo' | 'travel'

const memberIdentity: Record<string, string> = {
  grandma: '溫暖根系',
  leo: '綠光小工程師',
  lynn: '優雅生活策展人',
  nini: '文字與籃球之間',
  sophie: '動漫、程式與靈感',
  tavis: '科技與遠行的父親',
}

function memberTone(member: User): MemberTone {
  const persona = member.theme?.persona

  if (persona === 'tavis' || persona === 'lynn' || persona === 'leo') {
    return persona
  }

  return 'neutral'
}

function memberImage(member: User) {
  return member.cardImage ?? member.avatar ?? member.heroImage
}

function travelTone(project: TravelProject): MemberTone {
  return project.status === 'planning' ? 'travel' : 'lynn'
}

function formatTravelDate(project: TravelProject) {
  return `${project.startDate} - ${project.endDate}`
}

export function HomePageView({
  bucketItems,
  familySession,
  homeConfig,
  members,
  posts,
  timelineEvent,
  travelProjects,
  wrappedCta,
}: HomePageViewProps) {
  const featuredTravel =
    typeof homeConfig.featuredTravel === 'object' ? homeConfig.featuredTravel : travelProjects[0]
  const heroHasImage = Boolean(getMediaUrl(homeConfig.heroBackground))
  const modeLabel = familySession.isFamilyMode
    ? `${familySession.displayName} 的家人模式`
    : '訪客模式'
  const timelineDescription = timelineEvent
    ? `${timelineEvent.year}｜${timelineEvent.summary || timelineEvent.title}`
    : familySession.isFamilyMode
      ? '時空膠囊等待第一筆家庭事件。'
      : '訪客可看到公開時間線；完整家庭足跡需要進入家人模式。'
  const wrappedDescription = wrappedCta.locked
    ? '年度時光報告為家人模式限定。'
    : wrappedCta.available
      ? `開啟 ${wrappedCta.year} 年度時光報告。`
      : `${wrappedCta.year ?? new Date().getFullYear()} 年度報告正在醞釀，發布季會自動開啟。`

  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-3.5rem)] px-5 pb-12 pt-8 md:pb-16">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.88),rgba(236,244,241,0.8)_38%,rgba(230,236,245,0.72)_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-[radial-gradient(circle_at_20%_18%,rgba(30,120,180,0.18),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(190,142,86,0.14),transparent_28%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/45 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md">
              <Sparkles className="size-4" aria-hidden="true" />
              The Grand Family Lobby
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-slate-950 md:text-7xl">
              {homeConfig.heroTitle || 'Li Family'}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              {homeConfig.heroSubtitle ||
                '把家人的日常、旅行、專業與長期記憶，收束成一座安靜而有光的數位大廳。'}
            </p>
            {homeConfig.announcement ? (
              <p className="mt-5 max-w-xl border-l border-slate-300/80 pl-4 text-sm leading-7 text-slate-600">
                {homeConfig.announcement}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-md">
                <Link href="#family-portal">
                  進入家庭大廳
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              {featuredTravel ? (
                <Button asChild className="rounded-md bg-white/55" variant="outline">
                  <Link href={`/travel/${featuredTravel.slug}`}>
                    近期足跡
                    <Plane className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 z-10 hidden w-44 rounded-lg border border-white/55 bg-white/55 p-4 text-sm leading-6 text-slate-700 shadow-xl backdrop-blur-xl md:block">
              <span className="block text-xs font-semibold uppercase text-slate-500">Family Signal</span>
              {modeLabel}
            </div>
            <PayloadImage
              className="aspect-[5/4] min-h-80 rounded-lg border border-white/50 shadow-2xl shadow-slate-900/10"
              fallbackLabel="Li Family"
              imageClassName={heroHasImage ? 'scale-[1.02]' : undefined}
              media={homeConfig.heroBackground}
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              tone="neutral"
            />
            <div className="absolute -bottom-5 right-4 grid w-56 gap-2 rounded-lg border border-white/55 bg-white/60 p-4 shadow-xl backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase text-slate-500">Today in Web Li</p>
              <p className="text-sm leading-6 text-slate-700">
                家庭大廳、個人頁、旅行與願望清單，將從這裡逐步展開。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20"
        id="family-portal"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-slate-500">Family Portal</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              六個入口，六種光。
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            每張卡片都由 Payload Media 與成員資料驅動，照片可在後台替換，頁面會自動讀取最新版本。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.length > 0 ? (
            members.map((member) => (
              <Link
                className="group grid min-h-[28rem] overflow-hidden rounded-lg border border-white/55 bg-white/45 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/65 hover:shadow-2xl hover:shadow-slate-900/10"
                href={`/member/${member.slug}`}
                key={member.id}
              >
                <PayloadImage
                  className="aspect-[4/3] rounded-none border-b border-white/50"
                  fallbackLabel={member.displayName}
                  media={memberImage(member)}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                  tone={memberTone(member)}
                />
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        {member.familyRole}
                      </p>
                      <ArrowRight
                        className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-800"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
                      {member.displayName}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      {memberIdentity[member.slug] ?? 'Family member'}
                    </p>
                  </div>
                  <p className="mt-5 line-clamp-3 text-sm leading-7 text-slate-600">
                    {member.status || member.bio || '家人的故事正在慢慢展開。'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <ImageFallback className="sm:col-span-2 lg:col-span-3" label="Family members" />
          )}
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Plane className="size-5 text-cyan-200" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold uppercase text-cyan-100/70">Recent Footprints</p>
                <h2 className="text-3xl font-semibold tracking-normal">近期足跡</h2>
              </div>
            </div>
            <div className="grid gap-4">
              {travelProjects.length > 0 ? (
                travelProjects.slice(0, 3).map((project) => (
                  <Link
                    className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md transition hover:bg-white/[0.1] md:grid-cols-[13rem_1fr]"
                    href={`/travel/${project.slug}`}
                    key={project.id}
                  >
                    <PayloadImage
                      className="rounded-md"
                      fallbackLabel={project.title}
                      media={project.coverImage}
                      sizes="(min-width: 768px) 13rem, 100vw"
                      tone={travelTone(project)}
                    />
                    <div className="flex flex-col justify-center p-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-cyan-100/75">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        {formatTravelDate(project)}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-normal">{project.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-300">
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

          <div className="grid gap-4">
            <HubPanel
              description={
                posts[0]?.title
                  ? `最新文章預留：${posts[0].title}`
                  : '家庭文章輪播即將接入，這裡保留正式產品節奏。'
              }
              icon={<Newspaper className="size-5" aria-hidden="true" />}
              label="Family News"
              title="家庭速報"
            />
            <HubPanel
              description={timelineDescription}
              href="/timeline"
              icon={<Clock3 className="size-5" aria-hidden="true" />}
              label="Time Machine"
              title="時空膠囊微縮窗"
            >
              {timelineEvent ? (
                <PayloadImage
                  className="mt-4 aspect-[16/9] rounded-md"
                  fallbackLabel={timelineEvent.title}
                  media={firstTimelineImage(timelineEvent)}
                  sizes="(min-width: 1024px) 28rem, 100vw"
                  tone="lynn"
                />
              ) : null}
            </HubPanel>
            <HubPanel
              description={
                familySession.isFamilyMode
                  ? '家人可在首頁直接完成進行中的共同願望。'
                  : '共同願望清單為家人模式限定，登入後才會顯示內容。'
              }
              href={familySession.isFamilyMode ? '/bucket-list' : '/family/login?next=/bucket-list'}
              icon={<HeartHandshake className="size-5" aria-hidden="true" />}
              label="Bucket List"
              title="共同願望精簡看板"
            >
              {familySession.isFamilyMode ? (
                <HomeBucketQuickView items={bucketItems} />
              ) : (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-300">
                  <LockKeyhole className="size-4" aria-hidden="true" />
                  家人模式解鎖
                </p>
              )}
            </HubPanel>
            <HubPanel
              description={wrappedDescription}
              href={familySession.isFamilyMode ? '/wrapped' : '/family/login?next=/wrapped'}
              icon={<Sparkles className="size-5" aria-hidden="true" />}
              label="Wrapped"
              title="年度時光報告"
            >
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-100">
                {wrappedCta.available ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {wrappedCta.available ? '已發布' : '季節性預告'}
              </p>
            </HubPanel>
          </div>
        </div>
      </section>
    </main>
  )
}

function HubPanel({
  children,
  description,
  href,
  icon,
  label,
  title,
}: {
  children?: ReactNode
  description: string
  href?: string
  icon: ReactNode
  label: string
  title: string
}) {
  return (
    <article className="h-full rounded-lg border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md transition hover:border-cyan-100/35 hover:bg-white/[0.09]">
      <div className="mb-5 flex items-center justify-between gap-4 text-cyan-100">
        {icon}
        <span className="text-xs font-semibold uppercase text-cyan-100/60">{label}</span>
      </div>
      <h3 className="text-2xl font-semibold tracking-normal">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      {children}
      {href ? (
        <Button asChild className="mt-5 rounded-md bg-white/10 text-white" size="sm" variant="outline">
          <Link href={href}>
            進入
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </article>
  )
}

function firstTimelineImage(event: TimelineEvent): Media | number | null {
  return event.images?.[0] ?? null
}
