import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { TravelMemoryPrototype } from '@/features/travel/prototype/travel-memory-prototype'
import type {
  PrototypeVariant,
  PrototypeView,
} from '@/features/travel/prototype/travel-memory-prototype-data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Travel Memory prototype',
}

type PrototypePageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    variant?: string
    view?: string
  }>
}

const variants = new Set<PrototypeVariant>(['editorial', 'cinematic', 'scrapbook'])
const views = new Set<PrototypeView>(['overview', 'day-03', 'day-08', 'photos'])

export default async function PrototypePage({ params, searchParams }: PrototypePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])

  if (process.env.NODE_ENV === 'production' || slug !== '201307-hainan') {
    notFound()
  }

  const variant = variants.has(query.variant as PrototypeVariant)
    ? (query.variant as PrototypeVariant)
    : 'editorial'
  const view = views.has(query.view as PrototypeView)
    ? (query.view as PrototypeView)
    : 'overview'

  return <TravelMemoryPrototype initialVariant={variant} initialView={view} />
}
