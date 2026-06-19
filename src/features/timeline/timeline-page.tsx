import Link from 'next/link'
import { CalendarDays, ChevronRight, Clock3, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ImageFallback } from '@/components/ui/image-fallback'
import { PayloadImage } from '@/components/ui/payload-image'
import type { TimelineIndexData } from '@/lib/data/timeline'
import type { Media, TimelineEvent } from '@/payload/payload-types'

type TimelinePageViewProps = {
  data: TimelineIndexData
}

export function TimelinePageView({ data }: TimelinePageViewProps) {
  const selectedYear = data.selectedYear ?? data.yearOptions[0]

  return (
    <main className="overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5efe2_48%,#e7f3f1_100%)] text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
            <Clock3 className="size-4" aria-hidden="true" />
            Time Machine Timeline
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
            時空膠囊大事記
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            用年份滑塊回到某一段家庭時間。訪客只看公開事件；家人模式會展開完整記憶與私密照片。
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <YearLink active={!data.selectedYear} href="/timeline" label="全部" />
            {data.yearOptions.map((year) => (
              <YearLink
                active={year === selectedYear}
                href={`/timeline?year=${year}`}
                key={year}
                label={String(year)}
              />
            ))}
          </div>
          {!data.familySession.isFamilyMode ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/60 bg-white/45 px-3 py-2 text-sm text-slate-600 backdrop-blur-md">
              <LockKeyhole className="size-4" aria-hidden="true" />
              家人模式可解鎖私密事件與完整描述。
            </p>
          ) : null}
        </div>

        <div className="relative">
          <div className="absolute inset-x-10 top-10 -z-10 h-56 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="rounded-lg border border-white/65 bg-white/45 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase text-slate-500">Selected Year</p>
            <p className="mt-2 text-7xl font-semibold tracking-normal text-slate-950 md:text-8xl">
              {selectedYear ?? new Date().getFullYear()}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              分頁載入保持時間線輕盈；切換年份只抓該年份事件。
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/65 bg-white/35 px-5 py-14 backdrop-blur-xl md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          {data.groups.length > 0 ? (
            data.groups.map((group) => (
              <section className="mb-12 last:mb-0" key={group.year}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
                    <CalendarDays className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-3xl font-semibold tracking-normal">{group.year}</h2>
                </div>
                <div className="grid gap-4">
                  {group.events.map((event) => (
                    <TimelineCard event={event} key={event.id} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <ImageFallback label="Timeline events" tone="lynn" />
          )}

          {data.hasNextPage ? (
            <div className="mt-8 flex justify-center">
              <Button asChild className="rounded-md" variant="outline">
                <Link
                  href={`/timeline?${new URLSearchParams({
                    ...(data.selectedYear ? { year: String(data.selectedYear) } : {}),
                    page: String(data.page + 1),
                  }).toString()}`}
                >
                  載入下一頁
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  return (
    <article className="grid gap-4 rounded-lg border border-white/65 bg-white/50 p-4 shadow-sm backdrop-blur-xl md:grid-cols-[14rem_1fr]">
      <PayloadImage
        className="aspect-[16/10] rounded-md"
        fallbackLabel={event.title}
        media={firstTimelineImage(event)}
        sizes="(min-width: 768px) 14rem, 100vw"
        tone={event.isPrivate ? 'lynn' : 'travel'}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{event.eventDate.slice(0, 10)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-2xl font-semibold tracking-normal text-slate-950">{event.title}</h3>
          {event.isPrivate ? (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
              家人限定
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {event.description || event.summary || '這一天被收進了家庭時間線。'}
        </p>
      </div>
    </article>
  )
}

function YearLink({
  active,
  href,
  label,
}: {
  active: boolean
  href: string
  label: string
}) {
  return (
    <Link
      className={
        active
          ? 'rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white'
          : 'rounded-md border border-white/65 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md transition hover:bg-white/75'
      }
      href={href}
    >
      {label}
    </Link>
  )
}

function firstTimelineImage(event: TimelineEvent): Media | number | null {
  return event.images?.[0] ?? null
}
