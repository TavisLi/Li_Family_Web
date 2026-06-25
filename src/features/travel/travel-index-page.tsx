import Link from 'next/link'
import React from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, CalendarDays, Compass, MapPin, Plane } from 'lucide-react'

import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelProject } from '@/payload/payload-types'

type TravelIndexPageProps = {
  projects: TravelProject[]
}

export function TravelIndexPage({ projects }: TravelIndexPageProps) {
  const featured = projects[0]
  const planning = projects.filter((project) => project.status === 'planning')
  const completed = projects.filter((project) => project.status === 'completed')

  return (
    <main className="overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e8f3f1_48%,#f7efe5_100%)] text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
            <Compass className="size-4" aria-hidden="true" />
            Travel Corridor
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
            家庭旅途索引廊道
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            從正在討論的重慶三峽作戰室，到海南與東澳的記憶長卷，所有行程都由 Payload TravelProjects 與 seed 後媒體關聯驅動。
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
            <IndexMetric label="規劃中" value={planning.length} />
            <IndexMetric label="已完成" value={completed.length} />
          </div>
        </div>

        {featured ? (
          <Link
            className="group relative block overflow-hidden rounded-lg border border-white/55 bg-white/40 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            href={`/travel/${featured.slug}`}
          >
            <PayloadImage
              className="aspect-[4/3] rounded-none"
              fallbackLabel={featured.title}
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

      <section className="border-y border-white/60 bg-white/35 px-5 py-14 backdrop-blur-xl md:py-20">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">Route Index</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
                每一站都是可進入的家庭檔案。
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              列表以時間廊道呈現，不硬編死路由；新增 TravelProjects 後會自動出現在這裡。
            </p>
          </div>

          <div className="grid gap-8">
            <TravelProjectGroup
              empty="目前沒有公開的規劃中旅程。"
              projects={planning}
              title="規劃中旅程"
            />
            <TravelProjectGroup
              empty="目前沒有公開的已完成旅程。"
              projects={completed}
              title="已完成旅程"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-14 md:grid-cols-3 md:py-20">
        <CorridorNote
          icon={<Plane className="size-5" aria-hidden="true" />}
          title="規劃中"
          text="航班、住宿、提醒與每日節點集中在高密度作戰室，互動入口由家人模式解鎖。"
        />
        <CorridorNote
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          title="已完成"
          text="回憶頁改用 editorial journal 節奏，讓里程碑、照片與文字一起推進。"
        />
        <CorridorNote
          icon={<MapPin className="size-5" aria-hidden="true" />}
          title="媒體關聯"
          text="所有照片都來自 Payload Media relationship；缺圖時統一落到正式 ImageFallback。"
        />
      </section>
    </main>
  )
}

function TravelProjectGroup({
  empty,
  projects,
  title,
}: {
  empty: string
  projects: TravelProject[]
  title: string
}) {
  return (
    <section aria-labelledby={`travel-group-${title}`} className="grid gap-3">
      <h3 className="text-xl font-semibold tracking-normal text-slate-950" id={`travel-group-${title}`}>
        {title}
      </h3>
      {projects.length ? (
        <div className="divide-y divide-slate-300/60 border-y border-slate-300/60">
          {projects.map((project) => (
            <TravelProjectRow key={project.id} project={project} />
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

function TravelProjectRow({ project }: { project: TravelProject }) {
  return (
    <Link
      className="group grid gap-5 py-6 transition hover:bg-white/35 md:grid-cols-[10rem_1fr_auto]"
      href={`/travel/${project.slug}`}
    >
      <PayloadImage
        className="aspect-[16/10] rounded-md"
        fallbackLabel={project.title}
        media={project.coverImage}
        sizes="(min-width: 768px) 10rem, 100vw"
        tone={project.status === 'planning' ? 'travel' : 'lynn'}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {statusLabel(project.status)}
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

function IndexMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l border-slate-300/80 bg-white/35 px-4 py-3 backdrop-blur-md">
      <p className="text-3xl font-semibold tracking-normal">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}

function CorridorNote({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-lg border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-normal">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  )
}

function statusLabel(status: TravelProject['status']) {
  return status === 'planning' ? '規劃中' : '已完成'
}

function formatDateRange(project: TravelProject) {
  return `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
}
