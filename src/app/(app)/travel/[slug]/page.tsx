import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, Hotel, Plane, TrainFront } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import { getTravelProjectBySlug } from '@/lib/data/travel'

export const dynamic = 'force-dynamic'

type TravelPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: TravelPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Travel',
    }
  }

  return {
    title: project.title,
    description: project.summary || project.externalDocIdentifier || project.status,
    openGraph: {
      title: project.title,
      description: project.summary || project.externalDocIdentifier || project.status,
    },
  }
}

export default async function TravelPage({ params }: TravelPageProps) {
  const { slug } = await params
  const project = await getTravelProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const tone = project.status === 'planning' ? 'travel' : 'lynn'

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/30 px-3 py-1 text-sm font-medium capitalize text-muted-foreground backdrop-blur-md">
            <CalendarDays className="size-4" aria-hidden="true" />
            {project.status}
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
            {project.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {project.summary || project.externalDocIdentifier || 'Travel project'}
          </p>
          <p className="mt-5 text-sm font-medium text-muted-foreground">
            {project.startDate} - {project.endDate}
          </p>
        </div>
        <PayloadImage
          className="min-h-80 shadow-lg"
          fallbackLabel={project.title}
          media={project.coverImage}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          tone={tone}
        />
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-3">
        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Plane className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Flights</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {project.flights?.length ? (
              project.flights.map((flight) => (
                <p key={flight.id}>
                  <span className="font-medium text-foreground">{flight.flightNumber}</span>
                  {' · '}
                  {flight.route}
                </p>
              ))
            ) : (
              <p>Flight details can be added in Payload Admin.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <TrainFront className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Rail</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {project.railSegments?.length ? (
              project.railSegments.map((rail) => (
                <p key={rail.id}>
                  <span className="font-medium text-foreground">{rail.trainNumber}</span>
                  {' · '}
                  {rail.route}
                </p>
              ))
            ) : (
              <p>Rail details can be added in Payload Admin.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <Hotel className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold tracking-normal">Lodging</h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            {project.lodgings?.length ? (
              project.lodgings.slice(0, 4).map((lodging) => (
                <p key={lodging.id}>
                  <span className="font-medium text-foreground">{lodging.hotel}</span>
                  {lodging.dateRange ? ` · ${lodging.dateRange}` : ''}
                </p>
              ))
            ) : (
              <p>Lodging details can be added in Payload Admin.</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-6">
        <h2 className="mb-5 text-2xl font-semibold tracking-normal">Itinerary</h2>
        <div className="grid gap-4">
          {project.dailyItinerary?.length ? (
            project.dailyItinerary.map((day) => (
              <article
                className="rounded-lg border border-white/20 bg-white/35 p-5 shadow-sm backdrop-blur-md"
                key={day.id}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Day {day.day}
                  {day.date ? ` · ${day.date}` : ''}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-normal">{day.title}</h3>
                {day.segments?.length ? (
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground">
                    {day.segments.slice(0, 4).map((segment) => (
                      <li key={segment.id}>
                        {segment.time ? (
                          <span className="font-medium text-foreground">{segment.time} · </span>
                        ) : null}
                        {segment.activity}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-white/20 bg-white/35 p-5 text-sm text-muted-foreground shadow-sm backdrop-blur-md">
              Itinerary entries can be added after the travel parser is connected.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
