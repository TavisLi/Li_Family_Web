import { HeartHandshake, Sparkles } from 'lucide-react'

import type { BucketListData } from '@/lib/data/bucket-list'
import { BucketListBoard } from './bucket-list-board'

type BucketListPageProps = {
  data: BucketListData
}

export function BucketListPage({ data }: BucketListPageProps) {
  return (
    <main className="overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e8f3f1_46%,#f7efe5_100%)] text-slate-950">
      <section className="mx-auto grid min-h-[36rem] w-full max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/55 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl">
            <HeartHandshake className="size-4" aria-hidden="true" />
            Family Bucket List
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal md:text-7xl">
            共同願望看板
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
            把想一起完成的事放進願望池，推進到進行中，完成時自動收進時空膠囊。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="願望池" value={data.summary.pool} />
          <Metric label="進行中" value={data.summary['in-progress']} />
          <Metric label="已實現" value={data.summary.completed} />
        </div>
      </section>

      <section className="border-y border-white/65 bg-white/35 px-5 py-12 backdrop-blur-xl md:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">Wish Board</p>
              <h2 className="text-3xl font-semibold tracking-normal">家人共同維護</h2>
            </div>
          </div>
          <BucketListBoard initialData={data} />
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/65 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
      <p className="text-4xl font-semibold tracking-normal">{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}
