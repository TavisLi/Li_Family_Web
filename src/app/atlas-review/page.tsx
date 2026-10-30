import { notFound } from 'next/navigation'
import { AtlasReview } from '@/features/travel/atlas/atlas-review'
import { atlasReviewEnabled } from '@/features/travel/atlas/atlas-review-access'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Travel Atlas · 合成資料審查', robots: { index: false, follow: false } }

export default function AtlasReviewPage() {
  if (!atlasReviewEnabled(process.env)) notFound()
  return <AtlasReview />
}
