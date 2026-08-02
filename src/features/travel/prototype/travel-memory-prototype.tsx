'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Play,
} from 'lucide-react'

import {
  overviewDays,
  prototypeDays,
  prototypeVariants,
  type PrototypeDay,
  type PrototypePhoto,
  type PrototypeVariant,
  type PrototypeView,
} from './travel-memory-prototype-data'

// Three Travel Memory directions, switchable via ?variant=, on a throwaway local-only route.
export function TravelMemoryPrototype({
  initialVariant,
  initialView,
}: {
  initialVariant: PrototypeVariant
  initialView: PrototypeView
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const variant = variantFromQuery(searchParams.get('variant'), initialVariant)
  const view = viewFromQuery(searchParams.get('view'), initialView)
  const day = prototypeDays.find((item) => item.dayKey === view)

  const updateQuery = useMemo(
    () => (next: { variant?: PrototypeVariant; view?: PrototypeView }) => {
      const query = new URLSearchParams(searchParams.toString())
      if (next.variant) query.set('variant', next.variant)
      if (next.view) query.set('view', next.view)
      router.replace(`?${query.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'ArrowLeft') {
        updateQuery({ variant: adjacentVariant(variant, -1) })
      }
      if (event.key === 'ArrowRight') {
        updateQuery({ variant: adjacentVariant(variant, 1) })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [updateQuery, variant])

  return (
    <>
      <PrototypeContextBar view={view} variant={variant} updateQuery={updateQuery} />
      {variant === 'editorial' ? (
        <EditorialVariant day={day} view={view} updateQuery={updateQuery} />
      ) : null}
      {variant === 'cinematic' ? (
        <CinematicVariant day={day} view={view} updateQuery={updateQuery} />
      ) : null}
      {variant === 'scrapbook' ? (
        <ScrapbookVariant day={day} view={view} updateQuery={updateQuery} />
      ) : null}
      <PrototypeSwitcher current={variant} updateQuery={updateQuery} />
    </>
  )
}

type UpdateQuery = (next: { variant?: PrototypeVariant; view?: PrototypeView }) => void

function PrototypeContextBar({
  updateQuery,
  variant,
  view,
}: {
  updateQuery: UpdateQuery
  variant: PrototypeVariant
  view: PrototypeView
}) {
  const views: { key: PrototypeView; label: string }[] = [
    { key: 'overview', label: '旅行首頁' },
    { key: 'day-03', label: 'Day 3' },
    { key: 'day-08', label: 'Day 8' },
    { key: 'photos', label: '相簿' },
  ]

  return (
    <aside className="sticky top-14 z-20 border-b border-amber-950/10 bg-[#f3eee4]/95 px-4 py-3 text-[#2e2922] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="border border-[#aa3f2f]/30 bg-[#aa3f2f] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            Prototype
          </span>
          <p className="text-xs leading-5 text-[#645b50]">
            本地、無 Payload、不可部署 · {prototypeVariants.find((item) => item.key === variant)?.note}
          </p>
        </div>
        <nav aria-label="Prototype views" className="flex gap-1 overflow-x-auto">
          {views.map((item) => (
            <button
              aria-pressed={view === item.key}
              className={
                view === item.key
                  ? 'shrink-0 bg-[#2e2922] px-3 py-1.5 text-xs font-semibold text-white'
                  : 'shrink-0 px-3 py-1.5 text-xs font-semibold text-[#645b50] transition hover:bg-white/70 hover:text-[#2e2922] active:translate-y-px'
              }
              key={item.key}
              onClick={() => updateQuery({ view: item.key })}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function EditorialVariant({
  day,
  updateQuery,
  view,
}: {
  day?: PrototypeDay
  updateQuery: UpdateQuery
  view: PrototypeView
}) {
  if (day) return <EditorialDay day={day} updateQuery={updateQuery} />
  if (view === 'photos') return <EditorialPhotos updateQuery={updateQuery} />

  return (
    <main className="bg-[#f7f2e9] pb-40 text-[#26231f]">
      <section className="relative min-h-[78dvh] overflow-hidden">
        <Image
          alt="亞龍灣鳥巢度假村的山海景觀"
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src="/prototypes/travel-memory-hainan/cover-birds-nest.jpeg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171d1b]/80 via-[#171d1b]/30 to-transparent" />
        <div className="relative mx-auto flex min-h-[78dvh] w-full max-w-7xl items-end px-5 pb-14 pt-24 md:px-10 md:pb-20">
          <div className="max-w-3xl text-white">
            <p className="font-serif text-lg italic text-amber-100">Li family travel journal · 2013</p>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.94] tracking-[-0.045em] md:text-8xl">
              非誠勿擾之
              <span className="block text-amber-100">海南三亞度假</span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-sm leading-7 text-white/80 md:text-base">
              八天，四間酒店，一場颱風。從亞龍灣走到石梅灣，把十年前的照片重新放回每一天。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.7fr_1.3fr] md:px-10 md:py-28">
        <header className="md:sticky md:top-36 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a34031]">The route</p>
          <h2 className="mt-4 max-w-sm font-serif text-4xl leading-tight tracking-[-0.025em] md:text-6xl">
            八日，不只是一張行程表
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#675f55]">
            首頁只負責讓人選擇閱讀方向。完整照片、時間與故事回到每日篇章。
          </p>
        </header>
        <ol className="border-t border-[#cfc2ae]">
          {overviewDays.map((item) => (
            <li className="border-b border-[#cfc2ae]" key={item.day}>
              <button
                className="group grid w-full grid-cols-[3rem_1fr] gap-5 py-6 text-left transition hover:pl-2 active:translate-y-px md:grid-cols-[4rem_1fr_auto] md:items-baseline"
                disabled={!item.view}
                onClick={() => item.view && updateQuery({ view: item.view })}
                type="button"
              >
                <span className="font-mono text-sm tabular-nums text-[#a34031]">
                  {String(item.day).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-serif text-2xl tracking-tight md:text-3xl">{item.label}</span>
                  <span className="mt-1 block text-xs text-[#756b5e]">{item.place}</span>
                </span>
                {item.view ? (
                  <ArrowRight className="hidden size-5 transition-transform group-hover:translate-x-1 md:block" />
                ) : (
                  <span className="hidden text-xs text-[#9a9082] md:block">資料待展開</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <EditorialFigure photo={prototypeDays[0]!.photos[1]!} />
        <div className="flex flex-col justify-end bg-[#ded5c6] p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a34031]">Featured memory</p>
          <h2 className="mt-5 font-serif text-4xl leading-tight tracking-tight">Day 3 · 看見三亞灣</h2>
          <p className="mt-5 text-sm leading-7 text-[#5f574d]">
            照片不再只是相簿中的第 143 張；它回到 17:00 的鹿回頭公園，和當時的路線、心情放在一起。
          </p>
          <button
            className="mt-8 inline-flex w-fit items-center gap-2 border-b border-[#2e2922] pb-1 text-sm font-semibold transition hover:gap-3"
            onClick={() => updateQuery({ view: 'day-03' })}
            type="button"
          >
            閱讀 Day 3 <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </main>
  )
}

function EditorialDay({ day, updateQuery }: { day: PrototypeDay; updateQuery: UpdateQuery }) {
  return (
    <main className="bg-[#f7f2e9] pb-40 text-[#29251f]">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 md:grid-cols-[0.38fr_1fr] md:px-10 md:py-24">
        <header>
          <button
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#806f5d] transition hover:text-[#a34031]"
            onClick={() => updateQuery({ view: 'overview' })}
            type="button"
          >
            <ArrowLeft className="size-4" /> 回旅行首頁
          </button>
          <p className="mt-14 font-serif text-[8rem] leading-none text-[#b64332] md:text-[11rem]">
            {day.dayNumber}
          </p>
          <p className="mt-4 font-mono text-xs tabular-nums text-[#806f5d]">{day.date}</p>
        </header>
        <div className="max-w-4xl">
          <p className="max-w-xl font-serif text-xl italic leading-8 text-[#a34031]">{day.kicker}</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.02] tracking-[-0.04em] md:text-7xl">
            {day.title}
          </h1>
        </div>
      </section>

      <article className="mx-auto w-full max-w-7xl px-5 md:px-10">
        <div className="grid gap-10 md:grid-cols-[0.38fr_1fr]">
          <aside className="md:sticky md:top-36 md:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a34031]">Day notes</p>
            <dl className="mt-5 grid gap-5 border-t border-[#cfc2ae] pt-5 text-sm">
              <div>
                <dt className="text-xs text-[#897d6e]">住宿</dt>
                <dd className="mt-1 leading-6">{day.lodging}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#897d6e]">餐食</dt>
                <dd className="mt-1 leading-6">{day.meals}</dd>
              </div>
            </dl>
          </aside>
          <div className="grid gap-20">
            {day.moments.map((moment) => {
              const photo = photoForMoment(day, moment.momentKey)
              const hasVideo = moment.momentKey === day.videoPlacement.momentKey

              return (
                <section className="grid gap-7" key={`${day.dayKey}-${moment.time}`}>
                  <div className="grid gap-4 border-t border-[#cfc2ae] pt-5 md:grid-cols-[7rem_1fr]">
                    <p className="font-mono text-sm tabular-nums text-[#a34031]">{moment.time}</p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#897d6e]">
                        {moment.location}
                      </p>
                      <h2 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{moment.title}</h2>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#625a50]">{moment.description}</p>
                    </div>
                  </div>
                  {photo ? <EditorialFigure photo={photo} /> : null}
                  {hasVideo ? <VideoPlacement day={day} tone="paper" /> : null}
                </section>
              )
            })}
          </div>
        </div>
      </article>
      <DayFooter day={day} updateQuery={updateQuery} />
    </main>
  )
}

function EditorialPhotos({ updateQuery }: { updateQuery: UpdateQuery }) {
  const photos = prototypeDays.flatMap((day) => day.photos)

  return (
    <main className="bg-[#f7f2e9] px-5 pb-40 pt-16 text-[#29251f] md:px-10 md:pt-24">
      <header className="mx-auto w-full max-w-7xl">
        <p className="font-serif text-lg italic text-[#a34031]">The visual archive</p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-[-0.04em] md:text-8xl">
            照片回到時間與地點
          </h1>
          <p className="max-w-sm text-sm leading-7 text-[#625a50]">
            Prototype 只放 Day 3 與 Day 8。正式相簿可依日期、地點與人物篩選。
          </p>
        </div>
      </header>
      <div className="mx-auto mt-16 grid w-full max-w-7xl gap-10 md:grid-cols-2">
        {photos.map((photo, index) => (
          <div className={index % 3 === 0 ? 'md:col-span-2' : ''} key={photo.momentKey}>
            <EditorialFigure photo={photo} />
            <button
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#a34031]"
              onClick={() => updateQuery({ view: index < 2 ? 'day-03' : 'day-08' })}
              type="button"
            >
              回到照片所屬日期 <ArrowRight className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

function CinematicVariant({
  day,
  updateQuery,
  view,
}: {
  day?: PrototypeDay
  updateQuery: UpdateQuery
  view: PrototypeView
}) {
  if (day) return <CinematicDay day={day} updateQuery={updateQuery} />
  if (view === 'photos') return <CinematicPhotos updateQuery={updateQuery} />

  return (
    <main className="bg-[#101514] pb-40 text-[#f3efe6]">
      <section className="relative min-h-[88dvh] overflow-hidden">
        <Image
          alt="亞龍灣鳥巢度假村的山海景觀"
          className="object-cover opacity-75"
          fill
          priority
          sizes="100vw"
          src="/prototypes/travel-memory-hainan/cover-birds-nest.jpeg"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_42%,transparent_10%,rgba(16,21,20,0.28)_48%,rgba(16,21,20,0.95)_100%)]" />
        <div className="relative mx-auto flex min-h-[88dvh] w-full max-w-7xl flex-col justify-between px-5 py-12 md:px-10 md:py-16">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
            <span>2013 · Hainan</span>
            <span>8 days · 4 resorts</span>
          </div>
          <div className="max-w-5xl">
            <p className="text-sm font-medium text-[#ddae73]">A family film in eight chapters</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-8xl">
              山、海、酒店，
              <span className="block text-white/50">還有颱風前的風。</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto border-y border-white/10 py-8">
        <ol className="mx-auto flex min-w-max max-w-7xl gap-2 px-5 md:px-10">
          {overviewDays.map((item) => (
            <li key={item.day}>
              <button
                className="group w-44 border-l border-white/20 px-5 py-3 text-left transition hover:bg-white/[0.06]"
                disabled={!item.view}
                onClick={() => item.view && updateQuery({ view: item.view })}
                type="button"
              >
                <span className="font-mono text-xs tabular-nums text-[#ddae73]">
                  D{String(item.day).padStart(2, '0')}
                </span>
                <span className="mt-10 block text-lg font-semibold leading-tight">{item.label}</span>
                <span className="mt-2 block text-xs text-white/45">{item.place}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-24 md:grid-cols-2 md:px-10 md:py-32">
        <button
          className="group relative min-h-[32rem] overflow-hidden text-left"
          onClick={() => updateQuery({ view: 'day-03' })}
          type="button"
        >
          <Image
            alt={prototypeDays[0]!.photos[1]!.alt}
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            src={prototypeDays[0]!.photos[1]!.src}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101514] via-transparent to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-7">
            <span className="font-mono text-xs text-[#ddae73]">DAY 03 · 17:00</span>
            <span className="mt-2 block text-3xl font-semibold">鹿回頭看見整座三亞灣</span>
          </span>
        </button>
        <button
          className="group relative min-h-[32rem] overflow-hidden text-left md:mt-24"
          onClick={() => updateQuery({ view: 'day-08' })}
          type="button"
        >
          <Image
            alt={prototypeDays[1]!.photos[1]!.alt}
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            src={prototypeDays[1]!.photos[1]!.src}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101514] via-transparent to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-7">
            <span className="font-mono text-xs text-[#ddae73]">DAY 08 · 12:30</span>
            <span className="mt-2 block text-3xl font-semibold">在石梅灣替旅程收尾</span>
          </span>
        </button>
      </section>
    </main>
  )
}

function CinematicDay({ day, updateQuery }: { day: PrototypeDay; updateQuery: UpdateQuery }) {
  const hero = day.photos[0]!

  return (
    <main className="bg-[#101514] pb-40 text-[#f3efe6]">
      <section className="relative min-h-[82dvh] overflow-hidden">
        <Image alt={hero.alt} className="object-cover opacity-80" fill priority sizes="100vw" src={hero.src} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101514] via-[#101514]/10 to-[#101514]/20" />
        <div className="relative mx-auto flex min-h-[82dvh] w-full max-w-7xl flex-col justify-between px-5 py-12 md:px-10">
          <button
            className="inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
            onClick={() => updateQuery({ view: 'overview' })}
            type="button"
          >
            <ArrowLeft className="size-4" /> 回旅行首頁
          </button>
          <header className="max-w-5xl">
            <p className="font-mono text-sm tabular-nums text-[#ddae73]">
              DAY {String(day.dayNumber).padStart(2, '0')} · {day.date}
            </p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.055em] md:text-8xl">
              {day.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/70">{day.kicker}</p>
          </header>
        </div>
      </section>

      <article className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 md:grid-cols-[15rem_1fr] md:px-10 md:py-28">
        <aside className="md:sticky md:top-36 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ddae73]">Timeline</p>
          <ol className="mt-7 grid gap-1 border-l border-white/15">
            {day.moments.map((moment) => (
              <li className="grid grid-cols-[4rem_1fr] gap-3 py-3 pl-4" key={moment.time}>
                <span className="font-mono text-xs tabular-nums text-[#ddae73]">{moment.time}</span>
                <span className="text-xs leading-5 text-white/55">{moment.location}</span>
              </li>
            ))}
          </ol>
        </aside>
        <div className="grid gap-24">
          {day.moments.map((moment) => {
            const photo = photoForMoment(day, moment.momentKey)
            const hasVideo = moment.momentKey === day.videoPlacement.momentKey

            return (
              <section className="grid gap-8" key={moment.time}>
                <header className="max-w-3xl">
                  <p className="font-mono text-xs tabular-nums text-[#ddae73]">
                    {moment.time} · {moment.location}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                    {moment.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55">{moment.description}</p>
                </header>
                {photo ? <CinematicFigure photo={photo} /> : null}
                {hasVideo ? <VideoPlacement day={day} tone="dark" /> : null}
              </section>
            )
          })}
        </div>
      </article>
      <DayFooter day={day} dark updateQuery={updateQuery} />
    </main>
  )
}

function CinematicPhotos({ updateQuery }: { updateQuery: UpdateQuery }) {
  const photos = prototypeDays.flatMap((day) => day.photos)

  return (
    <main className="min-h-screen bg-[#101514] px-5 pb-40 pt-16 text-white md:px-10 md:pt-24">
      <header className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ddae73]">Contact sheet</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] md:text-8xl">四個瞬間</h1>
        </div>
        <p className="max-w-sm text-sm leading-7 text-white/50">以時間碼取代無意義的照片序號。</p>
      </header>
      <div className="mx-auto mt-14 grid w-full max-w-7xl gap-px bg-white/10 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <button
            className="group bg-[#101514] p-3 text-left"
            key={photo.momentKey}
            onClick={() => updateQuery({ view: index < 2 ? 'day-03' : 'day-08' })}
            type="button"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                alt={photo.alt}
                className="object-cover grayscale-[18%] transition duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                src={photo.src}
              />
            </div>
            <span className="mt-3 grid grid-cols-[4rem_1fr] gap-3 px-1 pb-3">
              <span className="font-mono text-xs text-[#ddae73]">{photo.time}</span>
              <span className="text-xs leading-5 text-white/65">{photo.caption}</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  )
}

function ScrapbookVariant({
  day,
  updateQuery,
  view,
}: {
  day?: PrototypeDay
  updateQuery: UpdateQuery
  view: PrototypeView
}) {
  if (day) return <ScrapbookDay day={day} updateQuery={updateQuery} />
  if (view === 'photos') return <ScrapbookPhotos updateQuery={updateQuery} />

  return (
    <main className="bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] pb-40 text-[#383126]">
      <section className="mx-auto grid min-h-[82dvh] w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-10 md:py-20">
        <div className="order-2 md:order-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">Family album · volume 01</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.95] tracking-[-0.04em] md:text-7xl">
            海南，從照片背面重新讀一次
          </h1>
          <p className="mt-7 max-w-lg text-pretty text-sm leading-7 text-[#6b604f]">
            日期、飯店、孩子第一次看海，以及那些當時覺得麻煩、現在卻最好記得的小插曲。
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="border border-[#6f624e]/35 bg-[#f8f0df] px-3 py-2">2013.07.27—08.03</span>
            <span className="border border-[#6f624e]/35 bg-[#f8f0df] px-3 py-2">三亞 · 海南</span>
            <span className="border border-[#6f624e]/35 bg-[#f8f0df] px-3 py-2">8 days</span>
          </div>
        </div>
        <figure className="order-1 rotate-[-1.5deg] bg-[#fffaf0] p-3 pb-12 shadow-[0_20px_60px_rgba(73,56,32,0.22)] md:order-2">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              alt="亞龍灣鳥巢度假村的山海景觀"
              className="object-cover"
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              src="/prototypes/travel-memory-hainan/cover-birds-nest.jpeg"
            />
          </div>
          <figcaption className="mt-4 px-3 font-serif text-lg italic text-[#695b47]">
            「在山林裡住一晚，海就在很遠又很近的地方。」
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10">
        <header className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">Eight pages</p>
          <h2 className="mt-4 font-serif text-4xl tracking-tight md:text-6xl">打開哪一天？</h2>
        </header>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewDays.map((item, index) => (
            <button
              className={
                index % 3 === 1
                  ? 'min-h-48 rotate-1 bg-[#d8d6bb] p-5 text-left shadow-[4px_6px_0_rgba(98,75,43,0.16)] transition hover:-translate-y-1 hover:rotate-0'
                  : 'min-h-48 rotate-[-0.5deg] bg-[#fff8e8] p-5 text-left shadow-[4px_6px_0_rgba(98,75,43,0.16)] transition hover:-translate-y-1 hover:rotate-0'
              }
              disabled={!item.view}
              key={item.day}
              onClick={() => item.view && updateQuery({ view: item.view })}
              type="button"
            >
              <span className="font-serif text-5xl text-[#9e3e2e]">{item.day}</span>
              <span className="mt-8 block font-serif text-xl">{item.label}</span>
              <span className="mt-2 block text-xs text-[#776a57]">{item.place}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function ScrapbookDay({ day, updateQuery }: { day: PrototypeDay; updateQuery: UpdateQuery }) {
  return (
    <main className="bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] pb-40 text-[#383126]">
      <article className="mx-auto w-full max-w-6xl px-5 py-14 md:px-10 md:py-20">
        <button
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#76664f] transition hover:text-[#9e3e2e]"
          onClick={() => updateQuery({ view: 'overview' })}
          type="button"
        >
          <ArrowLeft className="size-4" /> 回旅行首頁
        </button>
        <header className="mt-12 border-b-2 border-[#7a6749]/30 pb-10">
          <p className="font-mono text-xs tabular-nums text-[#9e3e2e]">{day.date}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[7rem_1fr] md:items-start">
            <span className="font-serif text-8xl leading-none text-[#9e3e2e]">{day.dayNumber}</span>
            <div>
              <h1 className="text-balance font-serif text-5xl leading-tight tracking-[-0.035em] md:text-7xl">
                {day.title}
              </h1>
              <p className="mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#76664f]">{day.kicker}</p>
            </div>
          </div>
        </header>

        <div className="mt-14 grid gap-16">
          {day.moments.map((moment, index) => {
            const photo = photoForMoment(day, moment.momentKey)
            const hasVideo = moment.momentKey === day.videoPlacement.momentKey

            return (
              <section
                className="grid gap-7 border-l-2 border-[#9e3e2e]/25 pl-5 md:grid-cols-[0.85fr_1.15fr] md:pl-8"
                key={moment.time}
              >
                <div>
                  <p className="font-mono text-xs tabular-nums text-[#9e3e2e]">
                    {moment.time} · {moment.location}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl leading-tight">{moment.title}</h2>
                  <p className="mt-5 text-sm leading-7 text-[#6b604f]">{moment.description}</p>
                </div>
                <div>
                  {photo ? (
                    <ScrapbookFigure index={index} photo={photo} />
                  ) : (
                    <div className="min-h-24 border-t border-[#7a6749]/25 pt-4 font-serif text-lg italic text-[#80715c]">
                      當時沒有拍照，文字就是這一段的記憶。
                    </div>
                  )}
                  {hasVideo ? <VideoPlacement day={day} tone="scrapbook" /> : null}
                  </div>
              </section>
            )
          })}
        </div>
      </article>
      <DayFooter day={day} updateQuery={updateQuery} />
    </main>
  )
}

function ScrapbookPhotos({ updateQuery }: { updateQuery: UpdateQuery }) {
  const photos = prototypeDays.flatMap((day) => day.photos)

  return (
    <main className="min-h-screen bg-[#efe3c7] bg-[radial-gradient(#bca982_0.7px,transparent_0.7px)] bg-[size:14px_14px] px-5 pb-40 pt-16 text-[#383126] md:px-10 md:pt-24">
      <header className="mx-auto w-full max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#9e3e2e]">Photo envelope 03 + 08</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight tracking-[-0.035em] md:text-7xl">
          四張照片，背後都有日期
        </h1>
      </header>
      <div className="mx-auto mt-16 grid w-full max-w-6xl gap-12 md:grid-cols-2">
        {photos.map((photo, index) => (
          <button
            className={index % 2 === 0 ? 'rotate-[-1deg] text-left' : 'rotate-1 text-left md:mt-20'}
            key={photo.momentKey}
            onClick={() => updateQuery({ view: index < 2 ? 'day-03' : 'day-08' })}
            type="button"
          >
            <ScrapbookFigure index={index} photo={photo} />
          </button>
        ))}
      </div>
    </main>
  )
}

function EditorialFigure({ photo }: { photo: PrototypePhoto }) {
  return (
    <figure>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#d8cbb8]">
        <Image alt={photo.alt} className="object-cover" fill sizes="(min-width: 768px) 70vw, 100vw" src={photo.src} />
      </div>
      <figcaption className="mt-3 grid gap-2 text-xs leading-5 text-[#6d6255] md:grid-cols-[8rem_1fr]">
        <span className="font-mono tabular-nums text-[#a34031]">{photo.time} · {photo.location}</span>
        <span>{photo.caption}</span>
      </figcaption>
    </figure>
  )
}

function CinematicFigure({ photo }: { photo: PrototypePhoto }) {
  return (
    <figure>
      <div className="relative aspect-video overflow-hidden bg-white/5">
        <Image alt={photo.alt} className="object-cover" fill sizes="(min-width: 768px) 70vw, 100vw" src={photo.src} />
      </div>
      <figcaption className="mt-4 flex flex-col justify-between gap-2 text-xs leading-5 text-white/55 sm:flex-row">
        <span>{photo.caption}</span>
        <span className="shrink-0 font-mono tabular-nums text-[#ddae73]">{photo.time} · {photo.location}</span>
      </figcaption>
    </figure>
  )
}

function ScrapbookFigure({ index, photo }: { index: number; photo: PrototypePhoto }) {
  return (
    <figure
      className={
        index % 2 === 0
          ? 'rotate-[-0.75deg] bg-[#fffaf0] p-3 pb-9 shadow-[0_16px_35px_rgba(73,56,32,0.18)]'
          : 'rotate-[0.75deg] bg-[#fffaf0] p-3 pb-9 shadow-[0_16px_35px_rgba(73,56,32,0.18)]'
      }
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image alt={photo.alt} className="object-cover" fill sizes="(min-width: 768px) 50vw, 100vw" src={photo.src} />
      </div>
      <figcaption className="mt-4 px-2">
        <p className="font-serif text-lg italic leading-6">{photo.caption}</p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#9e3e2e]">
          {photo.time} · {photo.location}
        </p>
      </figcaption>
    </figure>
  )
}

function VideoPlacement({ day, tone }: { day: PrototypeDay; tone: 'dark' | 'paper' | 'scrapbook' }) {
  const classes = {
    dark: 'border border-white/15 bg-white/[0.04] text-white',
    paper: 'border border-[#cfc2ae] bg-[#ede5d8] text-[#29251f]',
    scrapbook: 'mt-8 border-2 border-dashed border-[#9e3e2e]/25 bg-[#f7edd8] text-[#383126]',
  }
  const muted = tone === 'dark' ? 'text-white/50' : 'text-[#716555]'

  return (
    <section className={`grid min-h-64 place-items-center p-7 text-center ${classes[tone]}`}>
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-full border border-current/20">
          <Play className="ml-0.5 size-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em]">YouTube placement</p>
        <h3 className="mt-2 text-xl font-semibold">{day.videoPlacement.title}</h3>
        <p className={`mt-3 text-xs leading-6 ${muted}`}>{day.videoPlacement.caption}</p>
        <p className={`mt-4 font-mono text-[10px] ${muted}`}>momentKey: {day.videoPlacement.momentKey}</p>
      </div>
    </section>
  )
}

function DayFooter({
  dark = false,
  day,
  updateQuery,
}: {
  dark?: boolean
  day: PrototypeDay
  updateQuery: UpdateQuery
}) {
  const nextView: PrototypeView = day.dayKey === 'day-03' ? 'day-08' : 'day-03'
  const nextLabel = day.dayKey === 'day-03' ? '跳到 Day 8' : '回到 Day 3'

  return (
    <nav
      aria-label="Prototype day navigation"
      className={`mx-auto mt-24 flex w-full max-w-7xl flex-col justify-between gap-4 border-t px-5 pt-7 sm:flex-row md:px-10 ${dark ? 'border-white/15' : 'border-[#cfc2ae]'}`}
    >
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3"
        onClick={() => updateQuery({ view: 'overview' })}
        type="button"
      >
        <BookOpen className="size-4" /> 旅行首頁
      </button>
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3"
        onClick={() => updateQuery({ view: nextView })}
        type="button"
      >
        {nextLabel} <ArrowRight className="size-4" />
      </button>
    </nav>
  )
}

function PrototypeSwitcher({
  current,
  updateQuery,
}: {
  current: PrototypeVariant
  updateQuery: UpdateQuery
}) {
  const currentItem = prototypeVariants.find((item) => item.key === current)!

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-slate-950 p-1.5 text-white shadow-2xl shadow-slate-950/35">
        <button
          aria-label="上一個視覺方向"
          className="grid size-10 place-items-center rounded-full transition hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          onClick={() => updateQuery({ variant: adjacentVariant(current, -1) })}
          type="button"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-44 px-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">
            {prototypeVariants.findIndex((item) => item.key === current) + 1} / {prototypeVariants.length}
          </p>
          <p className="mt-0.5 text-xs font-semibold">{currentItem.label}</p>
        </div>
        <button
          aria-label="下一個視覺方向"
          className="grid size-10 place-items-center rounded-full transition hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          onClick={() => updateQuery({ variant: adjacentVariant(current, 1) })}
          type="button"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function variantFromQuery(value: string | null, fallback: PrototypeVariant): PrototypeVariant {
  return value === 'editorial' || value === 'cinematic' || value === 'scrapbook'
    ? value
    : fallback
}

function viewFromQuery(value: string | null, fallback: PrototypeView): PrototypeView {
  return value === 'overview' || value === 'day-03' || value === 'day-08' || value === 'photos'
    ? value
    : fallback
}

function adjacentVariant(current: PrototypeVariant, step: -1 | 1): PrototypeVariant {
  const index = prototypeVariants.findIndex((item) => item.key === current)
  return prototypeVariants[(index + step + prototypeVariants.length) % prototypeVariants.length]!.key
}

function photoForMoment(day: PrototypeDay, momentKey?: string): PrototypePhoto | undefined {
  return momentKey ? day.photos.find((photo) => photo.momentKey === momentKey) : undefined
}
