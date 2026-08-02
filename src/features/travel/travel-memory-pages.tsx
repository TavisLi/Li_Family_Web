import Link from 'next/link'
import React, { type ComponentType } from 'react'
import { ArrowLeft, ArrowRight, Images, MapPin, Play } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type {
  TravelMemoryDayView,
  TravelMemoryGallery,
  TravelMemoryOverview,
  TravelMemoryPresentationStyle,
} from '@/lib/travel-memory'
import type { TravelMemoryDay } from '@/payload/payload-types'
import { cn } from '@/lib/utils'
import { toSafeYouTubeExternalUrl, toYouTubeEmbedUrl } from './youtube'

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
  return <OverviewContent memory={memory} style="editorial-journal" />
}

function CinematicOverview({ memory }: { memory: TravelMemoryOverview }) {
  return <OverviewContent memory={memory} style="cinematic-timeline" />
}

function ScrapbookOverview({ memory }: { memory: TravelMemoryOverview }) {
  return <OverviewContent memory={memory} style="family-scrapbook" />
}

function EditorialDay({ view }: { view: TravelMemoryDayView }) {
  return <DayContent style="editorial-journal" view={view} />
}

function CinematicDay({ view }: { view: TravelMemoryDayView }) {
  return <DayContent style="cinematic-timeline" view={view} />
}

function ScrapbookDay({ view }: { view: TravelMemoryDayView }) {
  return <DayContent style="family-scrapbook" view={view} />
}

function EditorialGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  return <GalleryContent gallery={gallery} style="editorial-journal" />
}

function CinematicGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  return <GalleryContent gallery={gallery} style="cinematic-timeline" />
}

function ScrapbookGallery({ gallery }: { gallery: TravelMemoryGallery }) {
  return <GalleryContent gallery={gallery} style="family-scrapbook" />
}

function OverviewContent({
  memory,
  style,
}: {
  memory: TravelMemoryOverview
  style: TravelMemoryPresentationStyle
}) {
  const visual = styleProfile(style)

  return (
    <main
      className={cn('min-h-screen overflow-hidden', visual.page)}
      data-travel-memory-style={style}
    >
      <section className={cn('mx-auto grid min-h-[72vh] w-full max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-2', visual.hero)}>
        <div className={cn(style === 'cinematic-timeline' && 'lg:order-2')}>
          <p className={cn('text-xs font-semibold uppercase tracking-[0.24em]', visual.muted)}>
            {visual.eyebrow} · {formatDateRange(memory.startDate, memory.endDate)}
          </p>
          <h1 className={cn('mt-5 text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl', visual.title)}>
            {memory.title}
          </h1>
          <p className={cn('mt-6 max-w-2xl text-base leading-8 md:text-lg', visual.copy)}>
            {memory.summary || '一趟由每日故事、照片與影像重新編排的家庭旅行回憶。'}
          </p>
          <Link className={cn('mt-8 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold', visual.button)} href={`/travel/${memory.slug}/photos`}>
            <Images className="size-4" aria-hidden="true" />
            完整相簿
          </Link>
        </div>
        <PayloadImage
          className={cn('min-h-80 shadow-2xl', visual.image)}
          fallbackLabel={memory.title}
          fit="cover"
          media={memory.coverImage}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          tone="travel"
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
        <p className={cn('text-xs font-semibold uppercase tracking-[0.24em]', visual.muted)}>
          Eight chapters
        </p>
        <h2 className={cn('mt-3 text-3xl font-semibold md:text-5xl', visual.title)}>每日回憶</h2>
        {memory.days.length ? (
          <div className={cn('mt-10 grid gap-5', style === 'cinematic-timeline' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
            {memory.days.map((day, index) => (
              <Link
                className={cn('group block p-5 transition hover:-translate-y-1', visual.card, scrapbookTilt(style, index))}
                href={`/travel/${memory.slug}/day/${day.dayKey}`}
                key={day.dayKey}
              >
                <p className={cn('text-sm font-semibold', visual.accent)}>Day {day.day}</p>
                <h3 className={cn('mt-2 text-xl font-semibold', visual.title)}>{day.title}</h3>
                <p className={cn('mt-3 text-sm leading-6', visual.copy)}>{day.theme || '閱讀這一天的完整故事與照片。'}</p>
                <span className={cn('mt-5 inline-flex items-center gap-2 text-sm font-semibold', visual.accent)}>
                  閱讀章節 <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text="每日章節尚未發布；原有 Travel Memory 內容仍保留作回退。" visual={visual} />
        )}
      </section>
    </main>
  )
}

function DayContent({
  style,
  view,
}: {
  style: TravelMemoryPresentationStyle
  view: TravelMemoryDayView
}) {
  const visual = styleProfile(style)
  const hasPlacements = (view.day.moments ?? []).some((moment) => moment.placements?.length)

  return (
    <main className={cn('min-h-screen', visual.page)} data-travel-memory-style={style}>
      <header className="mx-auto w-full max-w-5xl px-5 pb-10 pt-8 md:pb-16">
        <Link className={cn('inline-flex items-center gap-2 text-sm font-semibold', visual.accent)} href={`/travel/${view.memory.slug}`}>
          <ArrowLeft className="size-4" aria-hidden="true" /> 回到旅行首頁
        </Link>
        <p className={cn('mt-12 text-sm font-semibold uppercase tracking-[0.24em]', visual.muted)}>
          Day {view.day.day} · {view.day.dateLabel || view.day.date?.slice(0, 10) || view.day.dayKey}
        </p>
        <h1 className={cn('mt-4 text-4xl font-semibold leading-tight md:text-7xl', visual.title)}>{view.day.title}</h1>
        {view.day.story || view.day.theme ? (
          <p className={cn('mt-6 max-w-3xl text-base leading-8 md:text-lg', visual.copy)}>{view.day.story || view.day.theme}</p>
        ) : null}
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 pb-16 md:pb-24">
        {(view.day.moments ?? []).map((moment, index) => (
          <article className={cn('relative py-8 md:py-12', style === 'cinematic-timeline' && 'border-l border-white/20 pl-7 md:pl-12')} id={`moment-${moment.momentKey}`} key={moment.momentKey}>
            <div className={cn('flex flex-wrap items-center gap-3 text-sm font-semibold', visual.accent)}>
              {moment.time ? <span>{moment.time}</span> : null}
              {moment.location ? <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{moment.location}</span> : null}
            </div>
            <h2 className={cn('mt-3 text-2xl font-semibold md:text-4xl', visual.title)}>{moment.title}</h2>
            {moment.body ? <p className={cn('mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7', visual.copy)}>{moment.body}</p> : null}
            <div className={cn('mt-7 grid gap-6', style === 'editorial-journal' && index % 2 ? 'md:grid-cols-[0.8fr_1.2fr]' : 'md:grid-cols-2')}>
              {(moment.placements ?? []).map((placement) => (
                <MemoryPlacement key={placement.placementKey} placement={placement} style={style} visual={visual} />
              ))}
            </div>
          </article>
        ))}
        {!hasPlacements ? <EmptyState text="這一天尚未配置照片或影片。" visual={visual} /> : null}

        <nav className={cn('mt-10 grid gap-4 border-t pt-8 sm:grid-cols-2', visual.border)} aria-label="每日回憶導覽">
          {view.previousDay ? <DayNavigationLink day={view.previousDay} direction="previous" slug={view.memory.slug} visual={visual} /> : <span />}
          {view.nextDay ? <DayNavigationLink day={view.nextDay} direction="next" slug={view.memory.slug} visual={visual} /> : null}
        </nav>
      </section>
    </main>
  )
}

type VisualProfile = ReturnType<typeof styleProfile>
type Placement = NonNullable<NonNullable<TravelMemoryDay['moments']>[number]['placements']>[number]

function MemoryPlacement({ placement, style, visual }: { placement: Placement; style: TravelMemoryPresentationStyle; visual: VisualProfile }) {
  if (placement.type === 'photo') {
    return (
      <figure className={cn('overflow-hidden p-3', visual.card, style === 'family-scrapbook' && 'rotate-[-1deg]')}>
        <PayloadImage
          className={cn('w-full', visual.image)}
          fallbackLabel={placement.caption || '旅行照片'}
          layout="intrinsic"
          media={placement.media}
          preferOriginal
          sizes="(min-width: 768px) 45vw, 100vw"
          tone="travel"
        />
        {placement.caption ? <figcaption className={cn('px-2 pb-1 pt-4 text-sm leading-6', visual.copy)}>{placement.caption}</figcaption> : null}
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

function GalleryContent({ gallery, style }: { gallery: TravelMemoryGallery; style: TravelMemoryPresentationStyle }) {
  const visual = styleProfile(style)
  return (
    <main className={cn('min-h-screen px-5 py-10 md:py-16', visual.page)} data-travel-memory-style={style}>
      <div className="mx-auto w-full max-w-7xl">
        <Link className={cn('inline-flex items-center gap-2 text-sm font-semibold', visual.accent)} href={`/travel/${gallery.memory.slug}`}><ArrowLeft className="size-4" aria-hidden="true" />回到旅行首頁</Link>
        <h1 className={cn('mt-9 text-4xl font-semibold md:text-7xl', visual.title)}>{gallery.memory.title}・完整相簿</h1>
        <div className="mt-8 flex flex-wrap gap-2" aria-label="按日期篩選照片">
          <Link className={cn('px-3 py-2 text-sm font-semibold', gallery.selectedDayKey === null ? visual.button : visual.card)} href={`/travel/${gallery.memory.slug}/photos`}>全部</Link>
          {gallery.memory.days.map((day) => (
            <Link className={cn('px-3 py-2 text-sm font-semibold', gallery.selectedDayKey === day.dayKey ? visual.button : visual.card)} href={`/travel/${gallery.memory.slug}/photos?day=${day.dayKey}`} key={day.dayKey}>Day {day.day}</Link>
          ))}
        </div>
        {gallery.items.length ? (
          <div className={cn('mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3', style === 'cinematic-timeline' && 'lg:columns-2')}>
            {gallery.items.map((item, index) => (
              <figure className={cn('mb-5 break-inside-avoid p-3', visual.card, scrapbookTilt(style, index))} key={item.placementKey}>
                <PayloadImage className={visual.image} fallbackLabel={item.caption || item.media.altText} layout="intrinsic" media={item.media} preferOriginal sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" tone="travel" />
                <figcaption className="px-2 pb-1 pt-4">
                  <p className={cn('text-xs font-semibold uppercase tracking-wide', visual.accent)}>Day {item.day}{item.time ? ` · ${item.time}` : ''}</p>
                  <p className={cn('mt-2 text-sm leading-6', visual.copy)}>{item.caption || item.media.altText}</p>
                  <Link className={cn('mt-3 inline-flex text-sm font-semibold', visual.accent)} href={`/travel/${gallery.memory.slug}/day/${item.dayKey}#moment-${item.momentKey}`}>回到每日故事</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : <EmptyState text="這個篩選條件尚未有已發布照片。" visual={visual} />}
      </div>
    </main>
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

function EmptyState({ text, visual }: { text: string; visual: VisualProfile }) {
  return <div className={cn('mt-8 border p-8 text-center text-sm', visual.border, visual.card, visual.copy)}>{text}</div>
}

function styleProfile(style: TravelMemoryPresentationStyle) {
  if (style === 'cinematic-timeline') {
    return { page: 'bg-neutral-950 text-white', hero: 'max-w-none bg-[radial-gradient(circle_at_20%_10%,#3f3f46_0%,#0a0a0a_55%)]', eyebrow: 'Cinematic timeline', title: 'text-white uppercase tracking-[-0.035em]', copy: 'text-neutral-300', muted: 'text-neutral-500', accent: 'text-amber-300', card: 'rounded-none border border-white/15 bg-white/[0.055]', button: 'rounded-none bg-amber-300 text-black hover:bg-amber-200', border: 'border-white/20', image: 'rounded-none border border-white/15' } as const
  }
  if (style === 'family-scrapbook') {
    return { page: 'bg-[#f4ead8] text-[#3e3027]', hero: 'bg-[radial-gradient(circle_at_80%_10%,#f8d9a6_0%,transparent_32%)]', eyebrow: 'Family scrapbook', title: 'font-serif text-[#3e3027]', copy: 'text-[#6f5848]', muted: 'text-[#8b6b55]', accent: 'text-[#a0462f]', card: 'rounded-sm border border-[#d3b993] bg-[#fffaf0] shadow-[4px_5px_0_rgba(93,64,42,0.12)]', button: 'rounded-sm bg-[#a0462f] text-white hover:bg-[#873824]', border: 'border-[#caae88]', image: 'rounded-sm border-4 border-[#fffaf0]' } as const
  }
  return { page: 'bg-[#f7f4ed] text-stone-950', hero: 'bg-[linear-gradient(180deg,#efe9dd_0%,#f7f4ed_100%)]', eyebrow: 'Editorial journal', title: 'font-serif text-stone-950', copy: 'font-serif text-stone-600', muted: 'text-stone-500', accent: 'text-emerald-800', card: 'rounded-none border-y border-stone-300 bg-white/45', button: 'rounded-none border border-stone-900 bg-stone-900 text-white hover:bg-emerald-900', border: 'border-stone-300', image: 'rounded-none border border-stone-300' } as const
}

function scrapbookTilt(style: TravelMemoryPresentationStyle, index: number) {
  if (style !== 'family-scrapbook') return ''
  return index % 3 === 0 ? 'rotate-[-0.6deg]' : index % 3 === 1 ? 'rotate-[0.7deg]' : ''
}

function formatDateRange(start: string, end: string) {
  return `${start.slice(0, 10)} — ${end.slice(0, 10)}`
}
