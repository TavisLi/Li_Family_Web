import { Hotel, Plane } from 'lucide-react'
import React, { type ReactNode } from 'react'

import type { TravelProject } from '@/payload/payload-types'

type CompletedTravelLedgerProps = {
  project: TravelProject
}

export function CompletedTravelLedger({ project }: CompletedTravelLedgerProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:py-20">
      <div className="grid gap-8 border-y border-slate-300/60 py-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Travel Ledger</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">
            旅程資料簿
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            把抵離、住宿與旅行節奏放在記憶照片之前，讓日後回看仍能快速找回這趟旅程的骨架。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LedgerCard icon={<Plane className="size-5" aria-hidden="true" />} title="航班">
            {project.flights?.length ? (
              project.flights.map((flight) => (
                <div className="border-b border-slate-200/80 py-3 last:border-b-0" key={flight.id ?? flight.flightNumber}>
                  <p className="font-semibold text-slate-950">{flight.flightNumber}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {[flight.route, flight.departureTime && flight.arrivalTime ? `${flight.departureTime} → ${flight.arrivalTime}` : undefined]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              ))
            ) : (
              <EmptyLedgerItem text="這趟旅程尚未留下航班資料。" />
            )}
          </LedgerCard>
          <LedgerCard icon={<Hotel className="size-5" aria-hidden="true" />} title="住宿">
            {project.lodgings?.length ? (
              project.lodgings.map((lodging) => (
                <div className="border-b border-slate-200/80 py-3 last:border-b-0" key={lodging.id ?? lodging.hotel}>
                  <p className="font-semibold text-slate-950">{lodging.hotel}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {[lodging.dateRange, lodging.roomType, lodging.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))
            ) : (
              <EmptyLedgerItem text="這趟旅程尚未留下住宿資料。" />
            )}
          </LedgerCard>
        </div>
      </div>
    </section>
  )
}

function LedgerCard({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-slate-200/80 bg-white/65 p-5 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function EmptyLedgerItem({ text }: { text: string }) {
  return <p className="py-3 text-sm leading-6 text-slate-500">{text}</p>
}
