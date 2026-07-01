import { Suspense } from 'react'
import {
  CalendarDays,
  Users,
  Video,
} from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelInteractionThread } from '@/lib/data/travel'
import type { TravelProject } from '@/payload/payload-types'
import { CompletedTravelLedger } from './completed-travel-ledger'
import { TravelPhotoGalleryPreview } from './travel-photo-gallery'
import {
  sourceSectionKey,
  type TravelInteractionOptions,
  TravelSourceSections,
} from './travel-source-sections'
import { TravelInteractionPanel } from './travel-interaction-panel'
import { toYouTubeEmbedUrl } from './youtube'

type TravelDetailPageProps = {
  project: TravelProject
  threads: Record<string, TravelInteractionThread>
}

export function TravelDetailPage({ project, threads }: TravelDetailPageProps) {
  return (
    <main className="overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f4_44%,#f8efe5_100%)] text-slate-950">
      <TravelHero project={project} />
      {project.status === 'planning' ? (
        <PlanningTravelView project={project} threads={threads} />
      ) : (
        <>
          <CompletedTravelView project={project} />
          <TravelSourceSections project={project} />
        </>
      )}
    </main>
  )
}

export function travelInteractionIds(project: TravelProject): string[] {
  if (project.status !== 'planning') {
    return []
  }

  const slug = project.slug
  const sourceIds = (project.sourceSections ?? []).map((section) =>
    sourceSectionKey(slug, section.anchor),
  )

  return sourceIds
}

function TravelHero({ project }: { project: TravelProject }) {
  const participants = participantNames(project)

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] px-5 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(8,145,178,0.16),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(217,119,6,0.14),transparent_30%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
            <CalendarDays className="size-4" aria-hidden="true" />
            {statusLabel(project.status)} · {formatDateRange(project)}
          </p>
          <TravelTitle title={project.title} />
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            {project.summary || project.externalDocIdentifier || '旅行內容已由 Payload TravelProjects 建立。'}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-sm font-medium text-slate-600">
            {participants.length ? (
              participants.map((name) => (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/45 px-3 py-1 backdrop-blur-md"
                  key={name}
                >
                  <Users className="size-4" aria-hidden="true" />
                  {name}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/45 px-3 py-1 backdrop-blur-md">
                <Users className="size-4" aria-hidden="true" />
                參與成員可在 Payload 補充
              </span>
            )}
          </div>
        </div>

        <PayloadImage
          className="aspect-[5/4] min-h-80 rounded-lg border border-white/60 shadow-2xl shadow-slate-900/10"
          fallbackLabel={project.title}
          imageClassName="scale-[1.01]"
          media={project.coverImage}
          priority
          sizes="(min-width: 1024px) 52vw, 100vw"
          tone={project.status === 'planning' ? 'travel' : 'lynn'}
        />
      </div>
    </section>
  )
}

function TravelTitle({ title }: { title: string }) {
  const parts = splitTravelTitle(title)

  if (!parts.subtitle) {
    return (
      <h1 className="mt-6 text-[clamp(2.75rem,11vw,4rem)] font-semibold leading-tight tracking-normal md:text-[clamp(3.25rem,4.3vw,4rem)] lg:whitespace-nowrap">
        {parts.title}
      </h1>
    )
  }

  return (
    <h1 className="mt-6">
      <span className="block text-[clamp(2.75rem,10vw,3.8rem)] font-semibold leading-tight tracking-normal text-slate-950 md:text-[clamp(3.1rem,4vw,3.75rem)] lg:whitespace-nowrap">
        {parts.title}
      </span>
      <span className="mt-3 block text-[clamp(1.45rem,5vw,2.1rem)] font-semibold leading-tight tracking-normal text-slate-700 md:text-[clamp(1.65rem,2.4vw,2.25rem)]">
        {parts.subtitle}
      </span>
    </h1>
  )
}

function splitTravelTitle(title: string) {
  const separator = title.match(/\s[-—–]\s/)

  if (separator?.index !== undefined) {
    const titlePart = title.slice(0, separator.index).trim()
    const subtitle = title.slice(separator.index + separator[0].length).trim()

    if (titlePart && subtitle) {
      return {
        title: titlePart,
        subtitle,
      }
    }
  }

  const colonIndex = title.indexOf('：')

  if (colonIndex > 0) {
    return {
      title: title.slice(0, colonIndex).trim(),
      subtitle: title.slice(colonIndex + 1).trim(),
    }
  }

  return {
    title,
    subtitle: '',
  }
}

function PlanningTravelView({
  project,
  threads,
}: {
  project: TravelProject
  threads: Record<string, TravelInteractionThread>
}) {
  return (
      <TravelSourceSections
        project={project}
        renderInteraction={renderTravelInteraction}
        threads={threads}
      />
  )
}

function CompletedTravelView({ project }: { project: TravelProject }) {
  const highlights = (project.dailyItinerary ?? []).slice(0, 6)

  return (
    <>
      <section className="border-y border-white/60 bg-white/35 px-5 py-14 backdrop-blur-xl md:py-20">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            eyebrow="Memory Journal"
            title="回憶敘事與旅程里程碑"
            text="已完成旅程以更 editorial 的節奏呈現，讓圖片、城市節點與文字共同推進。"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((day) => (
              <article
                className="rounded-lg border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-xl"
                key={day.id}
              >
                <p className="text-sm font-semibold text-amber-700">Day {day.day}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-normal">{day.title}</h3>
                <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">
                  {day.segments?.[0]?.activity || day.theme || '這一天的旅行記憶已建立，等待照片與心得繼續補齊。'}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CompletedTravelLedger project={project} />

      <TravelPhotoGalleryPreview project={project} />

      <section className="border-y border-white/60 bg-slate-950 px-5 py-14 text-white md:py-20">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            eyebrow="External Video"
            light
            title="YouTube 旅行影片席位"
            text="影片只儲存外部 YouTube URL，不上傳影片檔。"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {project.externalVideos?.length ? (
              project.externalVideos.map((video) => {
                const embedUrl = toYouTubeEmbedUrl(video.youtubeUrl)

                return embedUrl ? (
                  <Suspense fallback={<VideoPlaceholder title={video.title} />} key={video.id}>
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="aspect-video w-full rounded-lg border border-white/15 bg-white/10"
                      src={embedUrl}
                      title={video.title}
                    />
                  </Suspense>
                ) : (
                  <VideoPlaceholder key={video.id} title={`${video.title} 無法安全嵌入`} />
                )
              })
            ) : (
              <VideoPlaceholder title={`${project.title} YouTube placeholder`} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function renderTravelInteraction({
  associatedId,
  className,
  enabledInteractions,
  label,
  thread,
}: {
  associatedId: string
  className?: string
  enabledInteractions: TravelInteractionOptions
  label: string
  thread?: TravelInteractionThread
}) {
  return (
    <TravelInteractionPanel
      associatedId={associatedId}
      className={className}
      enabledInteractions={enabledInteractions}
      label={label}
      thread={thread ?? lockedThread(associatedId)}
    />
  )
}

function SectionHeading({
  eyebrow,
  light = false,
  text,
  title,
}: {
  eyebrow: string
  light?: boolean
  text: string
  title: string
}) {
  return (
    <div className="max-w-3xl">
      <p className={light ? 'text-sm font-semibold uppercase text-cyan-100/70' : 'text-sm font-semibold uppercase text-slate-500'}>
        {eyebrow}
      </p>
      <h2 className={light ? 'mt-2 text-3xl font-semibold tracking-normal text-white md:text-5xl' : 'mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl'}>
        {title}
      </h2>
      <p className={light ? 'mt-4 text-sm leading-7 text-slate-300' : 'mt-4 text-sm leading-7 text-slate-600'}>
        {text}
      </p>
    </div>
  )
}

function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] p-6 text-center text-slate-300 backdrop-blur-xl">
      <div>
        <Video className="mx-auto size-8 text-cyan-100" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-white">{title}</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">YouTube URL 可在 Payload Admin 補上。</p>
      </div>
    </div>
  )
}

function participantNames(project: TravelProject): string[] {
  const party = (project.party ?? []).map((person) => person.name)
  const members = (project.members ?? []).map((member) =>
    typeof member === 'number' ? null : member.displayName,
  )

  return [...party, ...members.filter((member): member is string => Boolean(member))].slice(0, 8)
}

function statusLabel(status: TravelProject['status']) {
  return status === 'planning' ? '規劃中' : '已完成'
}

function formatDateRange(project: TravelProject) {
  return `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
}

function lockedThread(associatedId: string): TravelInteractionThread {
  return {
    associatedId,
    locked: true,
    comments: [],
    reactions: {
      up: 0,
      down: 0,
    },
  }
}
