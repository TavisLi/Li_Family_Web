'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PayloadImage } from '@/components/ui/payload-image'
import type { WrappedSnapshot } from '@/payload/payload-types'

type WrappedStoryProps = {
  snapshot: WrappedSnapshot
}

export function WrappedStory({ snapshot }: WrappedStoryProps) {
  const slides = useMemo(() => buildSlides(snapshot), [snapshot])
  const [index, setIndex] = useState(0)
  const slide = slides[index]

  return (
    <main className="min-h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950 text-white">
      <section className="relative grid min-h-[calc(100vh-3.5rem)] place-items-center px-5 py-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.24),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(251,191,36,0.18),transparent_30%),linear-gradient(135deg,#020617,#111827_48%,#0f172a)]" />
        <div className="grid w-full max-w-5xl gap-6 rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl md:grid-cols-[0.95fr_1.05fr] md:p-8">
          <PayloadImage
            className="aspect-[4/3] rounded-md"
            fallbackLabel={slide.title}
            media={snapshot.heroMedia}
            priority
            sizes="(min-width: 768px) 42vw, 100vw"
            tone="leo"
          />
          <div className="flex min-h-96 flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-cyan-100">
                <Sparkles className="size-4" aria-hidden="true" />
                {snapshot.year} Wrapped
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
                {slide.title}
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-300">{slide.body}</p>
              {slide.value ? (
                <p className="mt-8 text-7xl font-semibold tracking-normal text-cyan-100">
                  {slide.value}
                </p>
              ) : null}
            </div>
            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                className="rounded-md bg-white/10 text-white"
                disabled={index === 0}
                type="button"
                variant="outline"
                onClick={() => setIndex((current) => Math.max(current - 1, 0))}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                上一頁
              </Button>
              <p className="text-sm font-medium text-slate-400">
                {index + 1} / {slides.length}
              </p>
              <Button
                className="rounded-md bg-white/10 text-white"
                disabled={index === slides.length - 1}
                type="button"
                variant="outline"
                onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}
              >
                下一頁
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function buildSlides(snapshot: WrappedSnapshot) {
  const intro = [
    {
      title: `${snapshot.year}，我們一起走過。`,
      body: snapshot.summary || '這一年被旅程、文字、照片與共同願望悄悄串起來。',
      value: null,
    },
  ]
  const stats =
    snapshot.stats?.map((stat) => ({
      title: stat.label,
      body: stat.note || '這是家庭年度資料裡的一個小亮點。',
      value: stat.value,
    })) ?? []
  const blocks =
    snapshot.blocks?.map((block) => ({
      title: block.title,
      body: block.body || '這段故事被收進年度報告。',
      value: block.accent ?? null,
    })) ?? []

  return [...intro, ...stats, ...blocks]
}
