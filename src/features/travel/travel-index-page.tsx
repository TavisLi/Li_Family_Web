import Link from 'next/link'
import React from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, Compass, MapPin, Plane } from 'lucide-react'

import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelRuntimeRecord } from '@/lib/travel-runtime'
import { classifyTravelPlan } from '@/lib/travel-domain'

type TravelIndexPageProps = {
  currentDate?: Date | string
  projects: TravelRuntimeRecord[]
}

export function TravelIndexPage({ currentDate = new Date(), projects }: TravelIndexPageProps) {
  const featured = projects[0]
  const now = new Date(currentDate)
  const planning = projects.filter(
    (project) => project.status === 'planning' && classifyTravelPlan(project.endDate, now) === 'active',
  )
  const archivedPlans = projects.filter(
    (project) => project.status === 'planning' && classifyTravelPlan(project.endDate, now) === 'archived',
  )
  const memories = projects.filter((project) => project.status === 'completed')

  return (
    <main className="overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e8f3f1_48%,#f7efe5_100%)] text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
            <Compass className="size-4" aria-hidden="true" />
            Travel Corridor
          </p>
          <h1 className="mt-6 max-w-3xl text-[clamp(3rem,12vw,4.25rem)] font-semibold leading-[1.02] tracking-normal md:text-[clamp(3.5rem,4.4vw,4rem)] lg:whitespace-nowrap">
            家庭旅途索引廊道
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            從正在討論的重慶三峽作戰室，到海南與東澳的記憶長卷，所有行程都依狀態整理成可進入、可回看、可延續討論的家庭旅行檔案。
          </p>
        </div>

        {featured ? (
          <Link
            className="group relative block overflow-hidden rounded-lg border border-white/55 bg-white/40 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            href={`/travel/${featured.slug}`}
            prefetch={false}
          >
            <PayloadImage
              className="aspect-[4/3] rounded-none"
              fallbackLabel={featured.title}
              fit="cover"
              imageClassName="transition duration-500 group-hover:scale-105"
              media={featured.coverImage}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              tone={featured.status === 'planning' ? 'travel' : 'lynn'}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                <CalendarDays className="size-4" aria-hidden="true" />
                {formatDateRange(featured)}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/75">
                {featured.summary || featured.externalDocIdentifier || statusLabel(featured.status)}
              </p>
            </div>
          </Link>
        ) : (
          <ImageFallback label="Travel projects" tone="travel" />
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <CorridorNote
            count={planning.length}
            href="#travel-group-planning"
            icon={<Plane className="size-5" aria-hidden="true" />}
            title="規劃中"
            text="即將發生或仍在決策中的行程，航班、住宿、提醒與每日節點都可進入討論。"
          />
          <CorridorNote
            count={memories.length}
            href="#travel-group-memories"
            icon={<CalendarDays className="size-5" aria-hidden="true" />}
            title="旅行回憶"
            text="旅遊結束後另外整理的回憶作品，保留照片、里程碑與分享文字。"
          />
          <CorridorNote
            count={archivedPlans.length}
            href="#travel-group-archived"
            icon={<Compass className="size-5" aria-hidden="true" />}
            title="過往規劃"
            text="旅遊日期已過的原始計畫歸檔，保留當時的審核、修訂與家庭討論。"
          />
        </div>
      </section>

      <section className="border-y border-white/60 bg-white/35 px-5 py-14 backdrop-blur-xl md:py-20">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 px-1 py-6 md:px-0">
            <div>
              <p className="text-sm font-semibold uppercase text-sky-700/70">Route Index</p>
              <h2 className="mt-2 bg-gradient-to-r from-slate-950 via-sky-800 to-cyan-600 bg-clip-text text-3xl font-semibold leading-tight tracking-normal text-transparent md:text-5xl">
                每一站都是可進入的家庭檔案。
              </h2>
            </div>
          </div>

          <div className="grid gap-8">
            <TravelProjectGroup
              empty="目前沒有公開的規劃中旅程。"
              icon={<Plane className="size-5" aria-hidden="true" />}
              id="travel-group-planning"
              projects={planning}
              title="規劃中"
            />
            <TravelProjectGroup
              empty="目前沒有公開的旅行回憶。"
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
              id="travel-group-memories"
              projects={memories}
              title="旅行回憶"
            />
            <TravelProjectGroup
              empty="目前沒有已歸檔的過往規劃。"
              icon={<Compass className="size-5" aria-hidden="true" />}
              id="travel-group-archived"
              projects={archivedPlans}
              statusLabelOverride="過往規劃"
              title="過往規劃"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function TravelProjectGroup({
  empty,
  icon,
  id,
  projects,
  statusLabelOverride,
  title,
}: {
  empty: string
  icon: ReactNode
  id: string
  projects: TravelRuntimeRecord[]
  statusLabelOverride?: string
  title: string
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 grid gap-3 rounded-lg transition-shadow duration-300 target:ring-2 target:ring-cyan-600/60 target:ring-offset-4 target:ring-offset-cyan-50/50"
      id={id}
    >
      <div className="rounded-lg border border-white/60 bg-gradient-to-r from-white/75 via-cyan-50/80 to-amber-50/80 p-4 shadow-sm shadow-slate-900/5">
        <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm shadow-slate-900/15">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-normal text-slate-950" id={`${id}-heading`}>{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {groupDescription(title)}
          </p>
        </div>
        </div>
      </div>
      {projects.length ? (
        <div className="divide-y divide-slate-300/60 border-y border-slate-300/60">
          {projects.map((project) => (
            <TravelProjectRow key={project.id} project={project} statusLabelOverride={statusLabelOverride} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-white/60 bg-white/45 p-5 text-sm leading-7 text-slate-600 shadow-sm backdrop-blur-xl">
          {empty}
        </p>
      )}
    </section>
  )
}

function TravelProjectRow({
  project,
  statusLabelOverride,
}: {
  project: TravelRuntimeRecord
  statusLabelOverride?: string
}) {
  return (
    <Link
      className="group grid gap-5 py-6 transition hover:bg-white/35 md:grid-cols-[10rem_1fr_auto]"
      href={`/travel/${project.slug}`}
      prefetch={false}
    >
      <PayloadImage
        className="aspect-[16/10] rounded-md"
        fallbackLabel={project.title}
        fit="cover"
        media={project.coverImage}
        sizes="(min-width: 768px) 10rem, 100vw"
        tone={project.status === 'planning' ? 'travel' : 'lynn'}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {statusLabelOverride ?? statusLabel(project.status)}
          </span>
          <span>{formatDateRange(project)}</span>
        </div>
        <h4 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          {project.title}
        </h4>
        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-slate-600">
          {project.summary || project.externalDocIdentifier || '旅行資料已在 Payload 建立。'}
        </p>
      </div>
      <div className="flex items-center text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-950">
        <ArrowRight className="size-5" aria-hidden="true" />
      </div>
    </Link>
  )
}

function CorridorNote({
  count,
  href,
  icon,
  title,
  text,
}: {
  count: number
  href: string
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <a
      className="group grid min-h-[12rem] gap-5 rounded-lg border border-white/65 bg-white/45 p-5 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/60"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm shadow-slate-900/15">
          {icon}
        </div>
        <span className="text-4xl font-semibold leading-none tracking-normal text-slate-700/75 md:text-5xl">
          {count}
        </span>
      </div>

      <div>
        <h3 className="text-xl font-semibold tracking-normal text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
      </div>

      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-950">
        前往區塊
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </a>
  )
}

function statusLabel(status: TravelRuntimeRecord['status']) {
  return status === 'planning' ? '規劃中' : '已完成'
}

function formatDateRange(project: TravelRuntimeRecord) {
  return `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
}

function groupDescription(title: string) {
  if (title === '過往規劃') {
    return '旅遊日期已過的計畫會歸檔在這裡，保留原始討論脈絡。'
  }

  if (title === '規劃中') {
    return '即將發生或仍在決策中的旅行作戰室。'
  }

  return '旅遊結束後另外整理的家庭記錄、照片與分享。'
}
