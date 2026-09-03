import Link from 'next/link'
import React, { type ComponentType } from 'react'
import { ArrowLeft, ArrowRight, Images, Play } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type {
  TravelMemoryDayView,
  TravelMemoryGallery,
  TravelMemoryGalleryItem,
  TravelMemoryOverview,
  TravelMemoryPresentationStyle,
} from '@/lib/travel-memory'
import type { Media, TravelMemoryDay } from '@/payload/payload-types'
import { cn } from '@/lib/utils'
import { toSafeYouTubeExternalUrl, toYouTubeEmbedUrl } from './youtube'
import { SourceBody } from './travel-source-sections'

type OverviewRenderer = ComponentType<{ memory: TravelMemoryOverview }>
type DayRenderer = ComponentType<{ view: TravelMemoryDayView }>
type GalleryRenderer = ComponentType<{ gallery: TravelMemoryGallery }>

type RendererFamily = {
  Overview: OverviewRenderer
  Day: DayRenderer
  Gallery: GalleryRenderer
}

const rendererRegistry = {
  'editorial-journal': {
    Overview: EditorialOverview,
    Day: EditorialDay,
    Gallery: EditorialGallery,
  },
  'cinematic-timeline': {
    Overview: CinematicOverview,
    Day: CinematicDay,
    Gallery: CinematicGallery,
  },
  'family-scrapbook': {
    Overview: ScrapbookOverview,
    Day: ScrapbookDay,
    Gallery: ScrapbookGallery,
  },
} satisfies Record<TravelMemoryPresentationStyle, RendererFamily>

export function TravelMemoryOverviewPage({ memory }: { memory: TravelMemoryOverview }) {
  const Renderer = rendererRegistry[memory.presentationStyle].Overview
  return <Renderer memory={memory} />
}

export function TravelMemoryDayPage({ view }: { view: TravelMemoryDayView }) {
  const Renderer = rendererRegistry[view.memory.presentationStyle].Day
  return <Renderer view={view} />
}

export function TravelMemoryGalleryPage({ gallery }: { gallery: TravelMemoryGallery }) {
  const Renderer = rendererRegistry[gallery.memory.presentationStyle].Gallery
  return <Renderer gallery={gallery} />
}

function EditorialOverview({ memory }: { memory: TravelMemoryOverview }) {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f7f2e9] pb-28 text-[#26231f]"
      data-travel-memory-layout="editorial-overview"
      data-travel-memory-style="editorial-journal"
    >
      <section className="relative min-h-[76dvh] overflow-hidden">
        <PayloadImage
          className="absolute inset-0 min-h-[76dvh] rounded-none"
          fallbackLabel={memory.title}
          fit="cover"
          imageClassName="opacity-90"
          media={memory.coverImage}
          priority
          sizes="100vw"
          tone="travel"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171d1b]/85 via-[#171d1b]/40 to-[#171d1b]/10" />
        <div className="relative mx-auto flex min-h-[76dvh] w-full max-w-7xl items-end px-5 pb-14 pt-24 md:px-10 md:pb-20">
          <div className="max-w-4xl text-white">
            <p className="font-serif text-lg italic text-amber-100">Li family travel journal · {memory.startDate.slice(0, 4)}</p>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.94] tracking-[-0.045em] md:text-8xl">{memory.title}</h1>
            <p className="mt-7 max-w-xl text-pretty text-sm leading-7 text-white/80 md:text-base">
              {memory.summary || '把沿途的照片、時間與故事重新放回每一天。'}
            </p>
          </div>
        </div>
      </section>

      <MemoryOverviewArchive memory={memory} style="editorial-journal" />

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.7fr_1.3fr] md:px-10 md:py-28">
        <header className="md:sticky md:top-28 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a34031]">{memory.days.length} chapters</p>
          <h2 className="mt-4 max-w-sm font-serif text-4xl leading-tight tracking-[-0.025em] md:text-6xl">旅行章節</h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#675f55]">
            首頁只留下閱讀方向；完整照片、時間與故事回到每日篇章。
          </p>
          <Link className="mt-8 inline-flex items-center gap-2 border-b border-[#2e2922] pb-1 text-sm font-semibold transition hover:gap-3" href={`/travel/${memory.slug}/photos`}>
            <Images className="size-4" aria-hidden="true" /> 完整相簿
          </Link>
        </header>
        {memory.days.length ? (
          <ol className="border-t border-[#cfc2ae]">
            {memory.days.map((day) => (
              <li className="border-b border-[#cfc2ae]" key={day.dayKey}>
                <Link className="group grid grid-cols-[3rem_1fr] gap-5 py-6 transition hover:pl-2 md:grid-cols-[4rem_1fr_auto] md:items-baseline" href={`/travel/${memory.slug}/day/${day.dayKey}`}>
                  <span className="font-mono text-sm tabular-nums text-[#a34031]">{String(day.day).padStart(2, '0')}</span>
                  <span>
                    <span className="block font-serif text-2xl tracking-tight md:text-3xl">{day.title}</span>
                    <span className="mt-1 block text-xs text-[#756b5e]">{day.theme || day.date?.slice(0, 10) || '每日回憶'}</span>
                  </span>
                  <ArrowRight className="hidden size-5 transition-transform group-hover:translate-x-1 md:block" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border-t border-[#cfc2ae] py-8 text-sm text-[#675f55]">每日章節尚未發布；原有 Travel Memory 內容仍保留作回退。</p>
        )}
      </section>
    </main>
  )
}

function CinematicOverview({ memory }: { memory: TravelMemoryOverview }) {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#0d1211] pb-28 text-[#f3efe6]"
      data-travel-memory-layout="cinematic-overview"
      data-travel-memory-style="cinematic-timeline"
    >
      <section className="relative min-h-[86dvh] overflow-hidden">
        <PayloadImage
          className="absolute inset-0 min-h-[86dvh] rounded-none"
          fallbackLabel={memory.title}
          fit="cover"
          imageClassName="opacity-75"
          media={memory.coverImage}
          priority
          sizes="100vw"
          tone="travel"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_42%,transparent_8%,rgba(13,18,17,0.3)_48%,rgba(13,18,17,0.98)_100%)]" />
        <div className="relative mx-auto flex min-h-[86dvh] w-full max-w-7xl flex-col justify-between px-5 py-12 md:px-10 md:py-16">
          <div className="flex justify-between gap-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
            <span>{memory.startDate.slice(0, 4)} · Travel film</span>
            <span>{memory.days.length} chapters</span>
          </div>
          <div className="max-w-5xl">
            <p className="text-sm font-medium text-[#ddae73]">A family film in {memory.days.length} chapters</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-8xl">{memory.title}</h1>
            <p className="mt-7 max-w-2xl text-pretty text-base leading-8 text-white/60">
              {memory.summary || '城市、海岸與沿途影像，依發生次序重新剪成一趟旅行。'}
            </p>
          </div>
        </div>
      </section>

      <MemoryOverviewArchive memory={memory} style="cinematic-timeline" />

      <section className="border-y border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 md:px-10">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-[#ddae73]">場次導覽</p>
          <Link className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white" href={`/travel/${memory.slug}/photos`}>
            <Images className="size-4" aria-hidden="true" /> 完整相簿 · Contact sheet
          </Link>
        </div>
        {memory.days.length ? (
          <ol className="mx-auto mt-6 flex w-full max-w-7xl gap-px overflow-x-auto px-5 md:px-10">
            {memory.days.map((day) => (
              <li className="min-w-44 flex-1" key={day.dayKey}>
                <Link className="group block min-h-44 border-l border-white/20 px-5 py-4 transition hover:bg-white/[0.06]" href={`/travel/${memory.slug}/day/${day.dayKey}`}>
                  <span className="font-mono text-xs tabular-nums text-[#ddae73]">D{String(day.day).padStart(2, '0')}</span>
                  <span className="mt-10 block text-lg font-semibold leading-tight tracking-[-0.02em]">{day.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-white/45">{day.theme || day.date?.slice(0, 10) || 'Daily scene'}</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mx-auto mt-6 w-full max-w-7xl px-5 text-sm text-white/55 md:px-10">每日章節尚未發布；原有 Travel Memory 內容仍保留作回退。</p>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
        {memory.days.map((day, index) => (
          <Link className={cn('group relative min-h-[26rem] overflow-hidden bg-[#151b1a]', index % 2 === 1 && 'md:mt-24')} href={`/travel/${memory.slug}/day/${day.dayKey}`} key={day.dayKey}>
            <PayloadImage className="absolute inset-0 min-h-[26rem] rounded-none" fallbackLabel={day.title} fit="cover" imageClassName="opacity-80 transition duration-700 group-hover:scale-[1.03]" media={day.heroMedia} sizes="(min-width: 768px) 50vw, 100vw" tone="travel" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1211] via-transparent to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-7">
              <span className="font-mono text-xs text-[#ddae73]">DAY {String(day.day).padStart(2, '0')}</span>
              <span className="mt-2 block text-3xl font-semibold tracking-[-0.03em]">{day.title}</span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}

function ScrapbookOverview({ memory }: { memory: TravelMemoryOverview }) {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] pb-28 text-[#383126]"
      data-travel-memory-layout="scrapbook-overview"
      data-travel-memory-style="family-scrapbook"
    >
      <section className="mx-auto grid min-h-[80dvh] w-full max-w-7xl gap-12 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-10 md:py-20">
        <div className="order-2 md:order-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">Family album · {memory.days.length} chapters</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">{memory.title}</h1>
          <p className="mt-7 max-w-lg text-pretty text-sm leading-7 text-[#6b604f]">
            {memory.summary || '日期、飯店、第一次看見的風景，以及那些照片背面還記得的小插曲。'}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="border border-[#6f624e]/35 bg-[#f8f0df] px-3 py-2">{formatDateRange(memory.startDate, memory.endDate)}</span>
            <span className="border border-[#6f624e]/35 bg-[#f8f0df] px-3 py-2">{memory.days.length} days</span>
          </div>
          <Link className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#9e3e2e] transition hover:gap-3" href={`/travel/${memory.slug}/photos`}>
            <Images className="size-4" aria-hidden="true" /> 完整相簿
          </Link>
        </div>
        <figure className="order-1 rotate-[-1.5deg] bg-[#fffaf0] p-3 pb-12 shadow-[0_20px_60px_rgba(73,56,32,0.22)] md:order-2">
          <PayloadImage className="rounded-none" fallbackLabel={memory.title} fit="cover" media={memory.coverImage} priority sizes="(min-width: 768px) 55vw, 100vw" tone="travel" />
          <figcaption className="mt-4 px-3 font-serif text-lg italic text-[#695b47]">
            「把這趟旅程從照片背面重新讀一次。」
          </figcaption>
        </figure>
      </section>

      <MemoryOverviewArchive memory={memory} style="family-scrapbook" />

      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10">
        <header className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">{memory.days.length} chapters</p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-6xl">打開哪一天？</h2>
        </header>
        {memory.days.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {memory.days.map((day, index) => (
              <Link
                className={cn(
                  'group min-h-52 p-5 shadow-[4px_6px_0_rgba(98,75,43,0.16)] transition hover:-translate-y-1 hover:rotate-0',
                  index % 3 === 1 ? 'rotate-1 bg-[#d8d6bb]' : 'rotate-[-0.5deg] bg-[#fff8e8]',
                )}
                href={`/travel/${memory.slug}/day/${day.dayKey}`}
                key={day.dayKey}
              >
                <span className="font-serif text-5xl text-[#9e3e2e]">{day.day}</span>
                <span className="mt-8 block font-serif text-xl">{day.title}</span>
                <span className="mt-2 block text-xs leading-5 text-[#776a57]">{day.theme || day.date?.slice(0, 10) || '家庭旅行回憶'}</span>
                <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9e3e2e]">閱讀這一頁 <ArrowRight className="size-3 transition group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 border-t border-[#7a6749]/25 py-8 text-sm text-[#6b604f]">每日章節尚未發布；原有 Travel Memory 內容仍保留作回退。</p>
        )}
      </section>
    </main>
  )
}

function MemoryOverviewArchive({
  memory,
  style,
}: {
  memory: TravelMemoryOverview
  style: TravelMemoryPresentationStyle
}) {
  const participants = [
    ...(memory.participants ?? []).flatMap((participant) => {
      if (typeof participant !== 'object' || !participant) return []
      return [participant.displayName || participant.slug]
    }),
    ...(memory.guestParticipants ?? []).map((participant) => participant.name),
  ]
  const flights = memory.travelLedger?.flights ?? []
  const lodgings = memory.travelLedger?.lodgings ?? []
  const stories = (memory.storySections ?? []).filter(
    (section) => !/每日行程|daily itinerary/i.test(section.title)
      && section.body.trim()
      && section.body.trim() !== '__SECTION_BOUNDARY__',
  )
  const videos = (memory.externalVideos ?? []).flatMap((video) => {
    const url = toSafeYouTubeExternalUrl(video.url)
    return url ? [{ ...video, url }] : []
  })
  const reminders = memory.reminders ?? []
  const hasArchive =
    participants.length || flights.length || lodgings.length || stories.length || videos.length || reminders.length
  if (!hasArchive) return null

  const cinematic = style === 'cinematic-timeline'
  const scrapbook = style === 'family-scrapbook'
  const shell = cinematic
    ? 'border-y border-white/10 bg-[#101716] text-white'
    : scrapbook
      ? 'mx-auto my-12 max-w-7xl bg-[#fff8e8]/80 text-[#383126] shadow-[8px_10px_0_rgba(98,75,43,0.14)]'
      : 'border-y border-[#cfc2ae] bg-[#fbf7ef] text-[#29251f]'
  const card = cinematic
    ? 'border-l border-white/15 bg-white/[0.035]'
    : scrapbook
      ? 'border border-[#caae88] bg-[#fffaf0]'
      : 'border-t border-[#cfc2ae]'
  const muted = cinematic ? 'text-white/55' : scrapbook ? 'text-[#76664f]' : 'text-[#675f55]'
  const accent = cinematic ? 'text-[#ddae73]' : scrapbook ? 'text-[#9e3e2e]' : 'text-[#a34031]'

  return (
    <section className={cn(shell, scrapbook ? 'px-5 py-12 md:px-10' : 'py-16 md:py-24')} data-memory-overview-archive={style}>
      <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <header className="max-w-3xl">
          <p className={cn('text-xs font-semibold uppercase tracking-[0.22em]', accent)}>
            {cinematic ? 'Route ledger · story reels' : scrapbook ? '家庭旅行資料夾' : '旅行資料簿'}
          </p>
          <h2 className={cn('mt-4 text-4xl tracking-[-0.035em] md:text-6xl', !cinematic && 'font-serif')}>
            旅程資料與旅行故事
          </h2>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {participants.length ? (
            <section className={cn('p-6', card)}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accent)}>同行成員</h3>
              <p className={cn('mt-4 text-base leading-8', muted)}>{participants.join('、')}</p>
            </section>
          ) : null}
          {flights.length ? (
            <section className={cn('p-6', card)}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accent)}>航班</h3>
              <ul className="mt-4 grid gap-4">
                {flights.map((flight, index) => (
                  <li className={cn('text-sm leading-7', muted)} key={flight.id ?? `${flight.flightNumber}:${index}`}>
                    <strong className="block text-current">{flight.flightNumber || flight.airline || `航段 ${index + 1}`}</strong>
                    {[flight.route, [flight.departureTime, flight.arrivalTime].filter(Boolean).join(' → ')].filter(Boolean).join(' · ')}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {lodgings.length ? (
            <section className={cn('p-6', card)}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accent)}>住宿</h3>
              <ul className="mt-4 grid gap-4">
                {lodgings.map((lodging, index) => (
                  <li className={cn('text-sm leading-7', muted)} key={lodging.id ?? `${lodging.hotel}:${index}`}>
                    <strong className="block text-current">{lodging.hotel}</strong>
                    {[lodging.dateRange, lodging.city, lodging.roomType].filter(Boolean).join(' · ')}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {videos.length ? (
            <section className={cn('p-6', card)}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accent)}>全旅程影片</h3>
              <ul className="mt-4 grid gap-3">
                {videos.map((video, index) => (
                  <li key={`${video.url}:${index}`}>
                    <a className={cn('inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline', accent)} href={video.url} rel="noreferrer noopener" target="_blank">
                      <Play className="size-4" aria-hidden="true" />{video.title || `旅行影片 ${index + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {stories.length ? (
          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            {stories.map((story) => (
              <article className={cn('min-w-0 p-6', card)} key={story.anchor}>
                <p className={cn('text-[10px] font-semibold uppercase tracking-[0.18em]', accent)}>{storyRoleLabel(story.role)}</p>
                <h3 className={cn('mt-3 text-2xl tracking-tight', !cinematic && 'font-serif')}>{story.title}</h3>
                <SourceBody body={story.body} layout="single" tone={cinematic ? 'dark' : 'light'} />
              </article>
            ))}
          </div>
        ) : null}

        {reminders.length ? (
          <aside className={cn('mt-10 p-6', card)}>
            <h3 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', accent)}>補充資訊與提醒</h3>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {reminders.map((reminder, index) => (
                <section key={reminder.id ?? `${reminder.category}:${index}`}>
                  <h4 className="font-semibold">{reminder.category}</h4>
                  <ul className={cn('mt-2 list-disc space-y-1 pl-5 text-sm leading-6', muted)}>
                    {(reminder.items ?? []).map((item, itemIndex) => (
                      <li className="min-w-0 [&>div]:mt-0" key={item.id ?? itemIndex}>
                        <SourceBody body={item.text} layout="single" tone={cinematic ? 'dark' : 'light'} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}

function storyRoleLabel(role: NonNullable<TravelMemoryOverview['storySections']>[number]['role']) {
  if (role === 'featured-memory') return 'Featured memory'
  if (role === 'travel-reflection') return '旅行回憶'
  if (role === 'unforgettable-day') return '最難忘的一天'
  if (role === 'family-story') return 'Family story'
  return '補充資訊'
}

function EditorialDay({ view }: { view: TravelMemoryDayView }) {
  const visual = styleProfile('editorial-journal')
  const moments = view.day.moments ?? []

  return (
    <main
      className="min-h-screen bg-[#f7f2e9] pb-28 text-[#29251f]"
      data-travel-memory-layout="editorial-day"
      data-travel-memory-style="editorial-journal"
    >
      <header className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-[0.34fr_1fr] md:px-10 md:py-24">
        <div>
          <Link className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#806f5d] transition hover:text-[#a34031]" href={`/travel/${view.memory.slug}`}>
            <ArrowLeft className="size-4" aria-hidden="true" /> 回到旅行首頁
          </Link>
          <p className="mt-14 font-serif text-[8rem] leading-[0.78] text-[#b64332] md:text-[11rem]">
            {view.day.day}
          </p>
          <p className="mt-7 font-mono text-xs tabular-nums text-[#806f5d]">
            {view.day.dateLabel || view.day.date?.slice(0, 10) || view.day.dayKey}
          </p>
        </div>
        <div className="max-w-4xl self-end">
          <p className="max-w-xl font-serif text-xl italic leading-8 text-[#a34031]">
            {view.day.theme || '把照片、時間與沿途的小事放回這一天。'}
          </p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.02] tracking-[-0.04em] md:text-7xl">
            {view.day.title}
          </h1>
          {view.day.story ? (
            <p className="mt-7 max-w-2xl text-pretty text-base leading-8 text-[#625a50]">{view.day.story}</p>
          ) : null}
        </div>
      </header>

      <DayLogistics day={view.day} style="editorial-journal" />

      <article className="mx-auto grid w-full max-w-7xl gap-12 px-5 md:grid-cols-[0.34fr_1fr] md:px-10">
        <aside className="md:sticky md:top-28 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34031]">今日札記</p>
          <dl className="mt-5 grid gap-4 border-t border-[#cfc2ae] pt-5 text-sm text-[#675f55]">
            <div>
              <dt className="text-xs text-[#897d6e]">片段</dt>
              <dd className="mt-1 font-serif text-lg text-[#29251f]">{moments.length} 個沿途時刻</dd>
            </div>
            <div>
              <dt className="text-xs text-[#897d6e]">篇章</dt>
              <dd className="mt-1 leading-6">Day {view.day.day} of {view.memory.days.length}</dd>
            </div>
          </dl>
        </aside>

        <div className="grid gap-20">
          {moments.map((moment, index) => {
            const placements = moment.placements ?? []

            return (
              <section className="grid gap-7" id={`moment-${moment.momentKey}`} key={moment.momentKey}>
                <header className="grid gap-4 border-t border-[#cfc2ae] pt-5 md:grid-cols-[7rem_1fr]">
                  <p className="font-mono text-sm tabular-nums text-[#a34031]">{moment.time || '—'}</p>
                  <div>
                    {moment.location ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#897d6e]">{moment.location}</p>
                    ) : null}
                    <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.02em] md:text-4xl">{moment.title}</h2>
                    {moment.transport ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#a34031]">交通 · {moment.transport}</p> : null}
                    {moment.body ? <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#625a50]">{moment.body}</p> : null}
                  </div>
                </header>
                <div className={cn('grid gap-7', placements.length > 1 && (index % 2 ? 'md:grid-cols-[0.8fr_1.2fr]' : 'md:grid-cols-[1.15fr_0.85fr]'))}>
                  {placements.map((placement, placementIndex) => (
                    <MemoryPlacement key={placement.placementKey} placement={placement} priority={index === 0 && placementIndex === 0} style="editorial-journal" visual={visual} />
                  ))}
                </div>
              </section>
            )
          })}
          {!moments.length ? <EmptyState text="這一天尚未整理成每日札記。" visual={visual} /> : null}
        </div>
      </article>

      <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <DayNavigation view={view} visual={visual} />
      </div>
    </main>
  )
}

function CinematicDay({ view }: { view: TravelMemoryDayView }) {
  const visual = styleProfile('cinematic-timeline')
  const moments = view.day.moments ?? []
  const heroMedia = firstDayPhoto(view.day)

  return (
    <main
      className="min-h-screen bg-[#0d1211] pb-28 text-[#f3efe6]"
      data-travel-memory-layout="cinematic-day"
      data-travel-memory-style="cinematic-timeline"
    >
      <section className="relative min-h-[78dvh] overflow-hidden border-b border-white/10">
        <PayloadImage
          className="absolute inset-0 min-h-[78dvh] rounded-none bg-[#151b1a]"
          fallbackLabel={view.day.title}
          fit="cover"
          imageClassName="opacity-75"
          media={heroMedia}
          priority
          sizes="100vw"
          tone="travel"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,18,17,0.2)_0%,rgba(13,18,17,0.34)_42%,#0d1211_100%)]" />
        <div className="relative mx-auto flex min-h-[78dvh] w-full max-w-7xl flex-col justify-between px-5 py-10 md:px-10 md:py-14">
          <Link className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white" href={`/travel/${view.memory.slug}`}>
            <ArrowLeft className="size-4" aria-hidden="true" /> 回到旅行首頁
          </Link>
          <header className="max-w-5xl pb-6">
            <p className="font-mono text-sm tabular-nums text-[#ddae73]">
              DAY {String(view.day.day).padStart(2, '0')} · {view.day.dateLabel || view.day.date?.slice(0, 10) || view.day.dayKey}
            </p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.055em] md:text-8xl">
              {view.day.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/70">
              {view.day.story || view.day.theme || '一天的光線、聲音與移動，依時間重新剪接。'}
            </p>
          </header>
        </div>
      </section>

      <DayLogistics day={view.day} style="cinematic-timeline" />

      <article className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 md:grid-cols-[15rem_1fr] md:px-10 md:py-28">
        <aside className="md:sticky md:top-28 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ddae73]">當日時間軸</p>
          <ol className="mt-7 grid gap-1 border-l border-white/15" aria-label="當日時間軸">
            {moments.map((moment) => (
              <li key={moment.momentKey}>
                <a className="grid grid-cols-[4rem_1fr] gap-3 py-3 pl-4 text-left transition hover:bg-white/[0.04]" href={`#moment-${moment.momentKey}`}>
                  <span className="font-mono text-xs tabular-nums text-[#ddae73]">{moment.time || '—'}</span>
                  <span className="text-xs leading-5 text-white/55">{moment.location || moment.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="grid gap-24">
          {moments.map((moment) => (
            <section className="grid scroll-mt-24 gap-8" id={`moment-${moment.momentKey}`} key={moment.momentKey}>
              <header className="max-w-3xl">
                <p className="font-mono text-xs tabular-nums text-[#ddae73]">
                  {moment.time || '—'}{moment.location ? ` · ${moment.location}` : ''}
                </p>
                <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-5xl">{moment.title}</h2>
                {moment.transport ? <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ddae73]">Transport · {moment.transport}</p> : null}
                {moment.body ? <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/55">{moment.body}</p> : null}
              </header>
              <div className="grid gap-8">
                {(moment.placements ?? []).map((placement) => (
                  <MemoryPlacement key={placement.placementKey} placement={placement} style="cinematic-timeline" visual={visual} />
                ))}
              </div>
            </section>
          ))}
          {!moments.length ? <EmptyState text="這一天尚未剪接成時間軸。" visual={visual} /> : null}
        </div>
      </article>

      <div className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <DayNavigation view={view} visual={visual} />
      </div>
    </main>
  )
}

function ScrapbookDay({ view }: { view: TravelMemoryDayView }) {
  const visual = styleProfile('family-scrapbook')
  const moments = view.day.moments ?? []

  return (
    <main
      className="min-h-screen bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] pb-28 text-[#383126]"
      data-travel-memory-layout="scrapbook-day"
      data-travel-memory-style="family-scrapbook"
    >
      <article className="mx-auto w-full max-w-6xl px-5 py-14 md:px-10 md:py-20">
        <Link className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#76664f] transition hover:text-[#9e3e2e]" href={`/travel/${view.memory.slug}`}>
          <ArrowLeft className="size-4" aria-hidden="true" /> 回到旅行首頁
        </Link>

        <header className="mt-12 border-b-2 border-[#7a6749]/30 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#9e3e2e]">家庭相簿 · Day {String(view.day.day).padStart(2, '0')}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-[8rem_1fr] md:items-start">
            <span className="font-serif text-8xl leading-none text-[#9e3e2e] md:text-9xl">{view.day.day}</span>
            <div>
              <p className="font-mono text-xs tabular-nums text-[#76664f]">{view.day.dateLabel || view.day.date?.slice(0, 10) || view.day.dayKey}</p>
              <h1 className="mt-3 text-balance font-serif text-5xl leading-tight tracking-[-0.035em] md:text-7xl">{view.day.title}</h1>
              <p className="mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#76664f]">
                {view.day.story || view.day.theme || '日期、地點，以及照片背後仍記得的那些小事。'}
              </p>
            </div>
          </div>
        </header>

        <DayLogistics day={view.day} style="family-scrapbook" />

        <div className="mt-14 grid gap-16">
          {moments.map((moment, index) => (
            <section
              className="grid scroll-mt-24 gap-8 border-l-2 border-[#9e3e2e]/25 pl-5 md:grid-cols-[0.82fr_1.18fr] md:pl-8"
              id={`moment-${moment.momentKey}`}
              key={moment.momentKey}
            >
              <div className={cn(index % 2 === 1 && 'md:order-2')}>
                <p className="font-mono text-xs tabular-nums text-[#9e3e2e]">
                  {moment.time || '—'}{moment.location ? ` · ${moment.location}` : ''}
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.02em]">{moment.title}</h2>
                {moment.transport ? <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9e3e2e]">交通 · {moment.transport}</p> : null}
                {moment.body ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#6b604f]">{moment.body}</p> : null}
              </div>
              <div className={cn('grid gap-7', index % 2 === 1 && 'md:order-1')}>
                {(moment.placements ?? []).map((placement, placementIndex) => (
                  <MemoryPlacement key={placement.placementKey} placement={placement} priority={index === 0 && placementIndex === 0} style="family-scrapbook" visual={visual} />
                ))}
                {!(moment.placements ?? []).length ? (
                  <div className="min-h-24 border-t border-[#7a6749]/25 pt-4 font-serif text-lg italic text-[#80715c]">
                    當時沒有留下影像，文字就是這一段的記憶。
                  </div>
                ) : null}
              </div>
            </section>
          ))}
          {!moments.length ? <EmptyState text="這一天尚未配置照片或影片。" visual={visual} /> : null}
        </div>

        <DayNavigation view={view} visual={visual} />
      </article>
    </main>
  )
}

function DayLogistics({
  day,
  style,
}: {
  day: TravelMemoryDay
  style: TravelMemoryPresentationStyle
}) {
  const meals = [
    day.meals?.breakfast ? `早餐：${day.meals.breakfast}` : null,
    day.meals?.lunch ? `午餐：${day.meals.lunch}` : null,
    day.meals?.dinner ? `晚餐：${day.meals.dinner}` : null,
  ].filter((value): value is string => Boolean(value))
  if (!meals.length && !day.lodging) return null

  if (style === 'cinematic-timeline') {
    return (
      <aside className="border-b border-white/10 bg-[#101716]">
        <dl className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-8 text-sm md:grid-cols-2 md:px-10">
          {meals.length ? <div><dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ddae73]">Meals</dt><dd className="mt-2 leading-7 text-white/60">{meals.join(' · ')}</dd></div> : null}
          {day.lodging ? <div><dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ddae73]">Lodging</dt><dd className="mt-2 leading-7 text-white/60">{day.lodging}</dd></div> : null}
        </dl>
      </aside>
    )
  }

  const scrapbook = style === 'family-scrapbook'
  return (
    <aside className={cn(
      scrapbook
        ? 'mt-8 border border-[#caae88] bg-[#fff8e8] p-5 shadow-[4px_5px_0_rgba(93,64,42,0.12)]'
        : 'mx-auto mb-12 grid w-full max-w-7xl gap-5 border-y border-[#cfc2ae] px-5 py-7 md:grid-cols-2 md:px-10',
    )}>
      {meals.length ? <section><h2 className={cn('text-xs font-semibold uppercase tracking-[0.16em]', scrapbook ? 'text-[#9e3e2e]' : 'text-[#a34031]')}>餐食</h2><p className="mt-2 text-sm leading-7">{meals.join(' · ')}</p></section> : null}
      {day.lodging ? <section><h2 className={cn('text-xs font-semibold uppercase tracking-[0.16em]', scrapbook ? 'text-[#9e3e2e]' : 'text-[#a34031]')}>住宿</h2><p className="mt-2 text-sm leading-7">{day.lodging}</p></section> : null}
    </aside>
  )
}

function EditorialGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  const visual = styleProfile('editorial-journal')
  return (
    <main className="min-h-screen bg-[#f7f2e9] px-5 pb-28 pt-12 text-[#29251f] md:px-10 md:pt-20" data-travel-memory-layout="editorial-gallery" data-travel-memory-style="editorial-journal">
      <div className="mx-auto w-full max-w-7xl">
        <Link className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#806f5d] transition hover:text-[#a34031]" href={`/travel/${gallery.memory.slug}`}><ArrowLeft className="size-4" aria-hidden="true" />回到旅行首頁</Link>
        <header className="mt-12 grid gap-7 border-b border-[#cfc2ae] pb-12 md:grid-cols-[1fr_0.45fr] md:items-end">
          <div>
            <p className="font-serif text-lg italic text-[#a34031]">視覺檔案</p>
            <h1 className="mt-3 max-w-4xl text-balance font-serif text-5xl leading-[0.96] tracking-[-0.04em] md:text-8xl">{gallery.memory.title}・完整相簿</h1>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#625a50]">依日期、類型與地點閱讀照片及影片；每日影像仍保留返回故事的位置。</p>
        </header>
        <GalleryFilters gallery={gallery} visual={visual} />
        {gallery.items.length ? (
          <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">
            {gallery.items.map((item, index) => (
              <figure className={cn(index % 3 === 1 && 'md:mt-20')} key={`${item.dayKey}:${item.momentKey}:${item.placementKey}`}>
                {item.type === 'youtube' ? <GalleryVideo item={item} visual={visual} /> : <PayloadImage className="rounded-none border border-[#cfc2ae]" fallbackLabel={item.caption || item.media.altText} layout="intrinsic" media={item.media} preferOriginal sizes="(min-width: 768px) 50vw, 100vw" tone="travel" />}
                <figcaption className="mt-4 grid gap-2 border-t border-[#cfc2ae] pt-4 sm:grid-cols-[7rem_1fr]">
                  <p className="font-mono text-xs tabular-nums text-[#a34031]">{item.unclassified ? (item.type === 'youtube' ? '全旅程影片' : 'ARCHIVE') : `DAY ${item.day}${item.time ? ` · ${item.time}` : ''}`}</p>
                  <div>
                    <p className="font-serif text-base italic leading-7 text-[#625a50]">{item.caption || '此影像未附敘事說明。'}</p>
                    {item.dayKey && item.momentKey ? <Link className="mt-3 inline-flex text-xs font-semibold text-[#a34031]" href={`/travel/${gallery.memory.slug}/day/${item.dayKey}#moment-${item.momentKey}`}>回到每日故事</Link> : null}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : <EmptyState text="這個篩選條件尚未有已發布照片或影片。" visual={visual} />}
        <GalleryPagination gallery={gallery} visual={visual} />
      </div>
    </main>
  )
}

function CinematicGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  const visual = styleProfile('cinematic-timeline')
  return (
    <main className="min-h-screen bg-[#0d1211] px-5 pb-28 pt-12 text-white md:px-10 md:pt-20" data-travel-memory-layout="cinematic-gallery" data-travel-memory-style="cinematic-timeline">
      <div className="mx-auto w-full max-w-7xl">
        <Link className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60 transition hover:text-white" href={`/travel/${gallery.memory.slug}`}><ArrowLeft className="size-4" aria-hidden="true" />回到旅行首頁</Link>
        <header className="mt-14 flex flex-col justify-between gap-8 border-b border-white/10 pb-10 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ddae73]">Contact sheet · {gallery.totalItems} frames</p>
            <h1 className="mt-4 max-w-5xl text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.055em] md:text-8xl">{gallery.memory.title}</h1>
          </div>
          <p className="max-w-xs text-sm leading-7 text-white/45">依時間碼回看旅程，也能從每格畫面回到當日場景。</p>
        </header>
        <GalleryFilters gallery={gallery} visual={visual} />
        {gallery.items.length ? (
          <div className="mt-12 grid gap-px bg-white/10 md:grid-cols-2">
            {gallery.items.map((item) => (
              <figure className="bg-[#0d1211] p-3" key={`${item.dayKey}:${item.momentKey}:${item.placementKey}`}>
                {item.type === 'youtube' ? <GalleryVideo item={item} visual={visual} /> : <PayloadImage className="aspect-video rounded-none border-0" fallbackLabel={item.caption || item.media.altText} fit="cover" media={item.media} preferOriginal sizes="(min-width: 768px) 50vw, 100vw" tone="travel" />}
                <figcaption className="grid grid-cols-[5rem_1fr] gap-4 px-1 py-4">
                  <p className="font-mono text-xs tabular-nums text-[#ddae73]">{item.unclassified ? (item.type === 'youtube' ? '全旅程影片' : 'ARCHIVE') : `${String(item.day).padStart(2, '0')}:${item.time || '—'}`}</p>
                  <div>
                    <p className="text-xs leading-6 text-white/60">{item.caption || 'No scene note.'}</p>
                    {item.dayKey && item.momentKey ? <Link className="mt-2 inline-flex text-xs font-semibold text-[#ddae73]" href={`/travel/${gallery.memory.slug}/day/${item.dayKey}#moment-${item.momentKey}`}>回到每日故事</Link> : null}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : <EmptyState text="這個篩選條件尚未有已發布照片或影片。" visual={visual} />}
        <GalleryPagination gallery={gallery} visual={visual} />
      </div>
    </main>
  )
}

function ScrapbookGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  const visual = styleProfile('family-scrapbook')
  return (
    <main className="min-h-screen bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] px-5 pb-28 pt-12 text-[#383126] md:px-10 md:pt-20" data-travel-memory-layout="scrapbook-gallery" data-travel-memory-style="family-scrapbook">
      <div className="mx-auto w-full max-w-6xl">
        <Link className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#76664f] transition hover:text-[#9e3e2e]" href={`/travel/${gallery.memory.slug}`}><ArrowLeft className="size-4" aria-hidden="true" />回到旅行首頁</Link>
        <header className="mt-12 border-b-2 border-[#7a6749]/30 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">照片信封與影片 · {gallery.totalItems} 項</p>
          <h1 className="mt-4 max-w-4xl text-balance font-serif text-5xl leading-tight tracking-[-0.035em] md:text-7xl">{gallery.memory.title}・完整相簿</h1>
          <p className="mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#76664f]">日期、地點，以及每張照片背面會寫下的那句話。</p>
        </header>
        <GalleryFilters gallery={gallery} visual={visual} />
        {gallery.items.length ? (
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.items.map((item, index) => (
              <figure className={cn('bg-[#fffaf0] p-3 pb-8 shadow-[5px_8px_0_rgba(98,75,43,0.14)]', scrapbookTilt('family-scrapbook', index))} key={`${item.dayKey}:${item.momentKey}:${item.placementKey}`}>
                {item.type === 'youtube' ? <GalleryVideo item={item} visual={visual} /> : <PayloadImage className="rounded-none border-0" fallbackLabel={item.caption || item.media.altText} layout="intrinsic" media={item.media} preferOriginal sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" tone="travel" />}
                <figcaption className="px-3 pt-5">
                  <p className="font-serif text-lg italic leading-7 text-[#695b47]">{item.caption || (item.type === 'youtube' ? '影片沒有附上文字。' : '照片背面沒有留下文字。')}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9e3e2e]">{item.unclassified ? (item.type === 'youtube' ? '全旅程影片' : '未分類照片') : `Day ${item.day}${item.time ? ` · ${item.time}` : ''}`}</p>
                  {item.dayKey && item.momentKey ? <Link className="mt-3 inline-flex font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9e3e2e]" href={`/travel/${gallery.memory.slug}/day/${item.dayKey}#moment-${item.momentKey}`}>回到每日故事</Link> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : <EmptyState text="這個篩選條件尚未有已發布照片或影片。" visual={visual} />}
        <GalleryPagination gallery={gallery} visual={visual} />
      </div>
    </main>
  )
}

type VisualProfile = ReturnType<typeof styleProfile>
type Placement = NonNullable<NonNullable<TravelMemoryDay['moments']>[number]['placements']>[number]

function MemoryPlacement({ placement, priority = false, style, visual }: { placement: Placement; priority?: boolean; style: TravelMemoryPresentationStyle; visual: VisualProfile }) {
  if (placement.type === 'photo') {
    return (
      <figure className={cn('overflow-hidden p-3', visual.card, style === 'family-scrapbook' && 'rotate-[-1deg]')}>
        <PayloadImage
          className={cn('w-full', visual.image)}
          fallbackLabel={placement.caption || '旅行照片'}
          layout="intrinsic"
          media={placement.media}
          preferOriginal
          priority={priority}
          sizes="(min-width: 768px) 45vw, 100vw"
          tone="travel"
        />
        {placement.caption ? (
          style === 'family-scrapbook' ? (
            <figcaption className="px-2 pb-1 pt-4 text-[#6b604f]">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#9e3e2e]">照片背記</span>
              <span className="mt-2 block font-serif text-base italic leading-7">{placement.caption}</span>
            </figcaption>
          ) : (
            <figcaption className={cn('px-2 pb-1 pt-4 text-sm leading-6', visual.copy)}>{placement.caption}</figcaption>
          )
        ) : null}
      </figure>
    )
  }

  if (!placement.youtubeUrl) return null
  const embedUrl = toYouTubeEmbedUrl(placement.youtubeUrl)
  const externalUrl = toSafeYouTubeExternalUrl(placement.youtubeUrl)

  return (
    <figure className={cn('overflow-hidden p-3', visual.card)}>
      {embedUrl ? (
        <iframe
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-md bg-black"
          loading="lazy"
          src={embedUrl}
          title={placement.caption || 'YouTube 旅行影片'}
        />
      ) : externalUrl ? (
        <a className={cn('flex aspect-video items-center justify-center gap-2 rounded-md border text-sm font-semibold', visual.border, visual.accent)} href={externalUrl} rel="noreferrer noopener" target="_blank">
          <Play className="size-5" aria-hidden="true" /> 在 YouTube 開啟
        </a>
      ) : (
        <div className={cn('flex aspect-video items-center justify-center rounded-md border px-5 text-center text-sm', visual.border, visual.copy)}>影片網址無法安全開啟。</div>
      )}
      {placement.caption ? <figcaption className={cn('px-2 pb-1 pt-4 text-sm leading-6', visual.copy)}>{placement.caption}</figcaption> : null}
    </figure>
  )
}

function GalleryVideo({ item, visual }: { item: Extract<TravelMemoryGalleryItem, { type: 'youtube' }>; visual: VisualProfile }) {
  const embedUrl = toYouTubeEmbedUrl(item.youtubeUrl)
  const externalUrl = toSafeYouTubeExternalUrl(item.youtubeUrl)
  return embedUrl ? (
    <iframe allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full bg-black" loading="lazy" src={embedUrl} title={item.caption || '旅行影片'} />
  ) : externalUrl ? (
    <a className={cn('flex aspect-video items-center justify-center gap-2 border p-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4', visual.border, visual.accent)} href={externalUrl} rel="noreferrer noopener" target="_blank"><Play className="size-5" aria-hidden="true" />在 YouTube 開啟影片</a>
  ) : null
}

function GalleryFilters({ gallery, visual }: { gallery: TravelMemoryGallery; visual: VisualProfile }) {
  return (
    <div className="mt-8 grid gap-3 [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4">
      <nav className="flex flex-wrap gap-2" aria-label="按類型篩選媒體">
        {([{ type: null, label: '全部' }, { type: 'photo', label: '照片' }, { type: 'youtube', label: '影片' }] as const).map(({ type, label }) => (
          <Link aria-current={gallery.selectedType === type ? 'page' : undefined} className={cn('px-3 py-2 text-sm font-semibold transition active:translate-y-px', gallery.selectedType === type ? visual.button : visual.card)} href={galleryHref(gallery, { type, page: 1 })} key={type ?? 'all'}>{label}</Link>
        ))}
      </nav>
      <nav className="flex flex-wrap gap-2" aria-label="按日期篩選媒體">
        <Link aria-current={gallery.selectedDayKey === null ? 'page' : undefined} className={cn('px-3 py-2 text-sm font-semibold transition active:translate-y-px', gallery.selectedDayKey === null ? visual.button : visual.card)} href={galleryHref(gallery, { dayKey: null, page: 1 })}>所有日期</Link>
        {gallery.memory.days.map((day) => (
          <Link aria-current={gallery.selectedDayKey === day.dayKey ? 'page' : undefined} className={cn('px-3 py-2 text-sm font-semibold transition active:translate-y-px', gallery.selectedDayKey === day.dayKey ? visual.button : visual.card)} href={galleryHref(gallery, { dayKey: day.dayKey, page: 1 })} key={day.dayKey}>Day {day.day}</Link>
        ))}
      </nav>
      {gallery.locations.length ? (
        <nav className="flex flex-wrap gap-2" aria-label="按地點篩選媒體">
          <Link aria-current={gallery.selectedLocation === null ? 'page' : undefined} className={cn('px-3 py-2 text-sm font-semibold transition active:translate-y-px', gallery.selectedLocation === null ? visual.button : visual.card)} href={galleryHref(gallery, { location: null, page: 1 })}>所有地點</Link>
          {gallery.locations.map((location) => (
            <Link aria-current={gallery.selectedLocation === location ? 'page' : undefined} className={cn('px-3 py-2 text-sm font-semibold transition active:translate-y-px', gallery.selectedLocation === location ? visual.button : visual.card)} href={galleryHref(gallery, { location, page: 1 })} key={location}>{location}</Link>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

function GalleryPagination({ gallery, visual }: { gallery: TravelMemoryGallery; visual: VisualProfile }) {
  if (gallery.totalPages <= 1) return null
  return (
    <nav className="mt-12 flex items-center justify-between gap-4" aria-label="相簿分頁">
      {gallery.page > 1 ? <Link className={cn('px-4 py-2 text-sm font-semibold', visual.card)} href={galleryHref(gallery, { page: gallery.page - 1 })}>上一頁</Link> : <span />}
      <span className={cn('text-sm', visual.muted)}>{gallery.page} / {gallery.totalPages}</span>
      {gallery.page < gallery.totalPages ? <Link className={cn('px-4 py-2 text-sm font-semibold', visual.card)} href={galleryHref(gallery, { page: gallery.page + 1 })}>下一頁</Link> : null}
    </nav>
  )
}

function DayNavigationLink({ day, direction, slug, visual }: { day: Pick<TravelMemoryDay, 'dayKey' | 'title'>; direction: 'previous' | 'next'; slug: string; visual: VisualProfile }) {
  return (
    <Link className={cn('flex items-center gap-3 p-4', visual.card, direction === 'next' && 'justify-end text-right')} href={`/travel/${slug}/day/${day.dayKey}`}>
      {direction === 'previous' ? <ArrowLeft className="size-5" aria-hidden="true" /> : null}
      <span><span className={cn('block text-xs uppercase tracking-wide', visual.muted)}>{direction === 'previous' ? '上一日' : '下一日'}</span><span className={cn('mt-1 block font-semibold', visual.title)}>{day.title}</span></span>
      {direction === 'next' ? <ArrowRight className="size-5" aria-hidden="true" /> : null}
    </Link>
  )
}

function DayNavigation({ view, visual }: { view: TravelMemoryDayView; visual: VisualProfile }) {
  return (
    <nav className={cn('mt-16 grid gap-4 border-t pt-8 sm:grid-cols-2', visual.border)} aria-label="每日回憶導覽">
      {view.previousDay ? <DayNavigationLink day={view.previousDay} direction="previous" slug={view.memory.slug} visual={visual} /> : <span />}
      {view.nextDay ? <DayNavigationLink day={view.nextDay} direction="next" slug={view.memory.slug} visual={visual} /> : null}
    </nav>
  )
}

function EmptyState({ text, visual }: { text: string; visual: VisualProfile }) {
  return <div className={cn('mt-8 border p-8 text-center text-sm', visual.border, visual.card, visual.copy)}>{text}</div>
}

function styleProfile(style: TravelMemoryPresentationStyle) {
  if (style === 'cinematic-timeline') {
    return { title: 'text-white uppercase tracking-[-0.035em]', copy: 'text-neutral-300', muted: 'text-neutral-500', accent: 'text-amber-300', card: 'rounded-none border border-white/15 bg-white/[0.055]', button: 'rounded-none bg-amber-300 text-black hover:bg-amber-200', border: 'border-white/20', image: 'rounded-none border border-white/15' } as const
  }
  if (style === 'family-scrapbook') {
    return { title: 'font-serif text-[#3e3027]', copy: 'text-[#6f5848]', muted: 'text-[#8b6b55]', accent: 'text-[#a0462f]', card: 'rounded-sm border border-[#d3b993] bg-[#fffaf0] shadow-[4px_5px_0_rgba(93,64,42,0.12)]', button: 'rounded-sm bg-[#a0462f] text-white hover:bg-[#873824]', border: 'border-[#caae88]', image: 'rounded-sm border-4 border-[#fffaf0]' } as const
  }
  return { title: 'font-serif text-stone-950', copy: 'font-serif text-stone-600', muted: 'text-stone-500', accent: 'text-emerald-800', card: 'rounded-none border-y border-stone-300 bg-white/45', button: 'rounded-none border border-stone-900 bg-stone-900 text-white hover:bg-emerald-900', border: 'border-stone-300', image: 'rounded-none border border-stone-300' } as const
}

function scrapbookTilt(style: TravelMemoryPresentationStyle, index: number) {
  if (style !== 'family-scrapbook') return ''
  return index % 3 === 0 ? 'rotate-[-0.6deg]' : index % 3 === 1 ? 'rotate-[0.7deg]' : ''
}

function formatDateRange(start: string, end: string) {
  return `${start.slice(0, 10)} — ${end.slice(0, 10)}`
}

function firstDayPhoto(day: TravelMemoryDay): Media | null {
  for (const moment of day.moments ?? []) {
    for (const placement of moment.placements ?? []) {
      if (placement.type === 'photo' && placement.media && typeof placement.media === 'object') {
        return placement.media
      }
    }
  }
  return null
}

function galleryHref(
  gallery: TravelMemoryGallery,
  changes: { dayKey?: string | null; location?: string | null; type?: TravelMemoryGallery['selectedType']; page?: number },
) {
  const dayKey = changes.dayKey === undefined ? gallery.selectedDayKey : changes.dayKey
  const location = changes.location === undefined ? gallery.selectedLocation : changes.location
  const type = changes.type === undefined ? gallery.selectedType : changes.type
  const page = changes.page ?? gallery.page
  const search = new URLSearchParams()
  if (dayKey) search.set('day', dayKey)
  if (location) search.set('location', location)
  if (type) search.set('type', type)
  if (page > 1) search.set('page', String(page))
  const query = search.toString()
  return `/travel/${gallery.memory.slug}/photos${query ? `?${query}` : ''}`
}
