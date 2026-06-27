import { LockKeyhole, Sparkles } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { WrappedPageData } from '@/lib/data/wrapped'
import { WrappedStoryLoader } from './wrapped-story-loader'

type WrappedPageProps = {
  data: WrappedPageData
}

export function WrappedPage({ data }: WrappedPageProps) {
  if (data.available && data.snapshot) {
    return <WrappedStoryLoader snapshot={data.snapshot} />
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100 backdrop-blur-xl">
            <Sparkles className="size-4" aria-hidden="true" />
            Family Wrapped
          </p>
          <h1 className="mt-6 max-w-3xl text-[clamp(3rem,12vw,4.25rem)] font-semibold leading-[1.02] tracking-normal md:text-[clamp(3.25rem,4vw,3.8rem)] lg:whitespace-nowrap">
            年度時光報告正在醞釀
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            {data.previewReason === 'no-published-snapshot'
              ? '目前還沒有已發布的年度報告。資料模型已就緒，發布後會自動切換為全屏故事頁。'
              : '年度報告已準備，但目前不是發布季。到了十二月，這裡會打開完整故事翻頁體驗。'}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-slate-200 backdrop-blur-xl">
            <LockKeyhole className="size-4" aria-hidden="true" />
            家人模式限定內容，訪客不會收到私密統計資料。
          </p>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/10 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <PayloadImage
            className="aspect-[4/3] rounded-md"
            fallbackLabel="Family Wrapped"
            media={data.snapshot?.heroMedia}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            tone="leo"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(data.snapshot?.stats ?? []).slice(0, 3).map((stat) => (
              <div className="rounded-md border border-white/10 bg-white/[0.06] p-3" key={stat.id ?? stat.label}>
                <p className="text-2xl font-semibold tracking-normal">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
