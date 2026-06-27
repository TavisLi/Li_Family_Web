import React from 'react'

import type { TravelProject } from '@/payload/payload-types'

export function TravelPlanningExtras({ project }: { project: TravelProject }) {
  const food = project.foodRecommendations ?? []
  const costs = project.costItems ?? []
  const options = project.optionalActivities ?? []

  if (!food.length && !costs.length && !options.length) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase text-slate-500">Planning Details</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
          費用、餐食與可選項目
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          把規劃旅行最容易散落的自費項目、餐食選擇與可討論活動集中在一起，方便家庭決策。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ExtraCard empty="尚未解析出費用項目。" title="費用">
          {costs.map((item) => (
            <ExtraItem
              detail={[item.unitPrice, item.quantity, item.subtotal].filter(Boolean).join(' · ')}
              key={item.id ?? `${item.item}-${item.subtotal}`}
              note={item.notes}
              title={item.item}
            />
          ))}
        </ExtraCard>
        <ExtraCard empty="尚未解析出餐食推薦。" title="餐食">
          {food.map((item) => (
            <ExtraItem
              detail={[item.category, item.description, item.suitableFor].filter(Boolean).join(' · ')}
              key={item.id ?? `${item.name}-${item.category}`}
              title={item.name}
            />
          ))}
        </ExtraCard>
        <ExtraCard empty="尚未解析出可選活動。" title="可選 / 自費">
          {options.map((item) => (
            <ExtraItem
              detail={[item.price, item.riskLevel].filter(Boolean).join(' · ')}
              key={item.id ?? item.name}
              note={item.notes ?? item.description}
              title={item.name}
            />
          ))}
        </ExtraCard>
      </div>
    </section>
  )
}

function ExtraCard({
  children,
  empty,
  title,
}: {
  children: React.ReactNode[]
  empty: string
  title: string
}) {
  return (
    <article className="rounded-lg border border-white/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl">
      <h3 className="text-xl font-semibold tracking-normal text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3">
        {children.length ? children : <p className="text-sm leading-6 text-slate-600">{empty}</p>}
      </div>
    </article>
  )
}

function ExtraItem({
  detail,
  note,
  title,
}: {
  detail?: string
  note?: string | null
  title: string
}) {
  return (
    <div className="border-b border-white/40 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      {detail ? <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p> : null}
      {note ? <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
  )
}
