import { Suspense } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  Hotel,
  Lock,
  Plane,
  TrainFront,
  Users,
  Video,
} from 'lucide-react'

import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TravelInteractionThread } from '@/lib/data/travel'
import type { Media, TravelProject } from '@/payload/payload-types'
import { CompletedTravelLedger } from './completed-travel-ledger'
import {
  findDailySourceSections,
  SourceBody,
  sourceSectionKey,
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
  const baseIds = [
    planningKey(slug, 'flights'),
    planningKey(slug, 'lodging'),
    planningKey(slug, 'transport'),
    planningKey(slug, 'members'),
    planningKey(slug, 'reminders'),
  ]
  const dayIds = (project.dailyItinerary ?? []).map((day) =>
    itineraryKey(slug, day.day),
  )
  const sourceIds = (project.sourceSections ?? []).map((section) =>
    sourceSectionKey(slug, section.anchor),
  )

  return [...baseIds, ...dayIds, ...sourceIds]
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
  const slug = project.slug
  const sourceSections = project.sourceSections ?? []

  return (
    <>
      <section className="border-y border-white/60 bg-white/35 px-5 py-12 backdrop-blur-xl md:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeading
            eyebrow="Planning War Room"
            title="高級家庭旅行作戰室"
            text="把航班、住宿、交通、成員、提醒與每日節點集中在同一個清楚可比較的決策空間。"
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <DecisionPanel
              associatedId={planningKey(slug, 'flights')}
              icon={<Plane className="size-5" aria-hidden="true" />}
              label="航班"
              thread={threads[planningKey(slug, 'flights')]}
              title="航班匯合"
            >
              <InfoList
                empty="航班資料可在 Payload Admin 補上。"
                items={(project.flights ?? []).map((flight) => ({
                  title: flight.flightNumber,
                  text: [
                    flight.airline,
                    flight.route,
                    flight.departureTime && flight.arrivalTime
                      ? `${flight.departureTime} → ${flight.arrivalTime}`
                      : undefined,
                    flight.passengers,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                }))}
              />
            </DecisionPanel>

            <DecisionPanel
              associatedId={planningKey(slug, 'lodging')}
              icon={<Hotel className="size-5" aria-hidden="true" />}
              label="住宿"
              thread={threads[planningKey(slug, 'lodging')]}
              title="住宿與艙房"
            >
              <InfoList
                empty="住宿資料可在 Payload Admin 補上。"
                items={(project.lodgings ?? []).map((lodging) => ({
                  title: lodging.hotel,
                  text: [lodging.dateRange, lodging.city, lodging.highlights].filter(Boolean).join(' · '),
                }))}
              />
              {project.cabinAssignments?.length ? (
                <div className="mt-4 grid gap-2 border-t border-white/30 pt-4">
                  {project.cabinAssignments.map((cabin) => (
                    <p className="text-sm leading-6 text-slate-600" key={cabin.id}>
                      <span className="font-semibold text-slate-900">{cabin.cabin}</span>
                      {' · '}
                      {cabin.passengers}
                    </p>
                  ))}
                </div>
              ) : null}
            </DecisionPanel>

            <DecisionPanel
              associatedId={planningKey(slug, 'transport')}
              icon={<TrainFront className="size-5" aria-hidden="true" />}
              label="交通"
              thread={threads[planningKey(slug, 'transport')]}
              title="城市與返程交通"
            >
              <InfoList
                empty="交通資料可在 Payload Admin 補上。"
                items={(project.railSegments ?? []).map((rail) => ({
                  title: rail.trainNumber,
                  text: [rail.route, rail.departureTime, rail.arrivalTime, rail.fare].filter(Boolean).join(' · '),
                }))}
              />
            </DecisionPanel>

            <DecisionPanel
              associatedId={planningKey(slug, 'members')}
              icon={<Users className="size-5" aria-hidden="true" />}
              label="成員"
              thread={threads[planningKey(slug, 'members')]}
              title="參與成員"
            >
              <InfoList
                empty="成員名單可在 Payload Admin 補上。"
                items={(project.party ?? []).map((person) => ({
                  title: person.name,
                  text: person.note || '同行家人',
                }))}
              />
            </DecisionPanel>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
        <SectionHeading
          eyebrow="Daily route cards"
          title="每日節點與決策討論"
          text="每天都是一張可討論的行程卡：保留來源表格、交通節點與家人決策，不再只是一段摘要。"
        />
        <div className="mt-8 grid gap-4">
          {(project.dailyItinerary ?? []).map((day, index) => {
            const dailySources = findDailySourceSections(sourceSections, day.day)

            return (
              <article
                className="grid gap-5 overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-xl md:grid-cols-[14rem_1fr] md:p-5"
                key={day.id}
              >
                <PayloadImage
                  className="aspect-[4/3] rounded-[1.35rem]"
                  fallbackLabel={`Day ${day.day}`}
                  media={project.itineraryImages?.[index]}
                  sizes="(min-width: 768px) 14rem, 100vw"
                  tone="travel"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cyan-800">
                    Day {day.day}
                    {day.date ? ` · ${day.date}` : ''}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-normal text-slate-950">
                    {day.title}
                  </h3>
                  {day.theme ? <p className="mt-1 text-sm font-medium text-slate-500">{day.theme}</p> : null}
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
                    {(day.segments ?? []).slice(0, 5).map((segment) => (
                      <li className="flex gap-2" key={segment.id}>
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500" aria-hidden="true" />
                        <span>
                          {segment.time ? <span className="font-semibold text-slate-900">{segment.time} · </span> : null}
                          {segment.activity}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {dailySources.length ? (
                    <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-white/60 bg-white/50 p-4 shadow-inner shadow-white/35">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        來源行程細節
                      </p>
                      {dailySources.map((section) => (
                        <section key={section.id ?? section.anchor}>
                          {section.level > 2 ? (
                            <h4 className="text-base font-semibold tracking-normal text-slate-950">
                              {section.title}
                            </h4>
                          ) : null}
                          <SourceBody body={section.body} />
                          {renderTravelInteraction({
                            className: 'rounded-2xl border-white/50 bg-white/35 px-4 pb-1',
                            associatedId: sourceSectionKey(slug, section.anchor),
                            label: section.title,
                            thread: threads[sourceSectionKey(slug, section.anchor)],
                          })}
                        </section>
                      ))}
                    </div>
                  ) : null}
                  <TravelInteractionPanel
                    associatedId={itineraryKey(slug, day.day)}
                    label={`Day ${day.day}`}
                    thread={threads[itineraryKey(slug, day.day)] ?? lockedThread(itineraryKey(slug, day.day))}
                  />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <TravelSourceSections
        project={project}
        renderInteraction={renderTravelInteraction}
        threads={threads}
      />

      <section className="border-y border-white/60 bg-slate-950 px-5 py-14 text-white md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-100/70">Reminders</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
              高溫、登船與安全提醒
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              提醒模組保留正式產品感，不把缺資料呈現成未完成灰框。
            </p>
          </div>
          <DecisionPanel
            associatedId={planningKey(slug, 'reminders')}
            dark
            icon={<Lock className="size-5" aria-hidden="true" />}
            label="提醒"
            thread={threads[planningKey(slug, 'reminders')]}
            title="家庭提醒清單"
          >
            <div className="grid gap-3">
              {(project.reminders ?? []).flatMap((group) =>
                (group.items ?? []).map((item) => (
                  <p className="text-sm leading-6 text-slate-300" key={item.id}>
                    <span className="font-semibold text-white">{group.category}</span>
                    {' · '}
                    {item.text}
                  </p>
                )),
              )}
            </div>
          </DecisionPanel>
        </div>
      </section>
    </>
  )
}

function CompletedTravelView({ project }: { project: TravelProject }) {
  const gallery = mediaObjects(project.galleryImages)
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

      <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
        <SectionHeading
          eyebrow="Photo Rhythm"
          title="照片瀑布流與正式預留模組"
          text="有照片時讀 Payload Media，照片不足時以 ImageFallback 保持版面節奏。"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.length ? (
            gallery.slice(0, 12).map((media, index) => (
              <article className="rounded-lg border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-xl" key={media.id}>
                <PayloadImage
                  className={index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'}
                  fallbackLabel={media.altText}
                  media={media}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw"
                  tone="lynn"
                />
              </article>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, index) => (
              <article className="rounded-lg border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur-xl" key={index}>
                <ImageFallback label={`${project.title} photo ${index + 1}`} tone="lynn" />
              </article>
            ))
          )}
        </div>
      </section>

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
  label,
  thread,
}: {
  associatedId: string
  className?: string
  label: string
  thread?: TravelInteractionThread
}) {
  return (
    <TravelInteractionPanel
      associatedId={associatedId}
      className={className}
      label={label}
      thread={thread ?? lockedThread(associatedId)}
    />
  )
}

function DecisionPanel({
  associatedId,
  children,
  dark = false,
  icon,
  label,
  thread,
  title,
}: {
  associatedId: string
  children: ReactNode
  dark?: boolean
  icon: ReactNode
  label: string
  thread: TravelInteractionThread | undefined
  title: string
}) {
  return (
    <article
      className={
        dark
          ? 'rounded-lg border border-white/15 bg-white/[0.06] p-5 shadow-sm backdrop-blur-xl'
          : 'rounded-lg border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl'
      }
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={dark ? 'text-cyan-100' : 'text-cyan-800'}>{icon}</div>
        <div>
          <p className={dark ? 'text-xs font-semibold uppercase text-cyan-100/60' : 'text-xs font-semibold uppercase text-slate-500'}>
            {label}
          </p>
          <h3 className={dark ? 'text-xl font-semibold tracking-normal text-white' : 'text-xl font-semibold tracking-normal text-slate-950'}>
            {title}
          </h3>
        </div>
      </div>
      {children}
      <TravelInteractionPanel
        associatedId={associatedId}
        className={dark ? 'border-white/15 text-slate-300' : undefined}
        label={label}
        thread={thread ?? lockedThread(associatedId)}
      />
    </article>
  )
}

function InfoList({
  empty,
  items,
}: {
  empty: string
  items: {
    title: string
    text: string
  }[]
}) {
  if (!items.length) {
    return <p className="text-sm leading-6 text-slate-600">{empty}</p>
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <p className="text-sm leading-6 text-slate-600" key={`${item.title}-${item.text}`}>
          <span className="font-semibold text-slate-900">{item.title}</span>
          {item.text ? ` · ${item.text}` : ''}
        </p>
      ))}
    </div>
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

function mediaObjects(media: TravelProject['galleryImages']): Media[] {
  return (media ?? []).filter((item): item is Media => typeof item === 'object')
}


function statusLabel(status: TravelProject['status']) {
  return status === 'planning' ? '規劃中' : '已完成'
}

function formatDateRange(project: TravelProject) {
  return `${project.startDate.slice(0, 10)} - ${project.endDate.slice(0, 10)}`
}

function planningKey(slug: string, section: string) {
  return `travel:${slug}:planning:${section}`
}

function itineraryKey(slug: string, day: number) {
  return `travel:${slug}:itinerary:day-${day}`
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
