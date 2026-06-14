import Link from 'next/link'
import { ArrowRight, UserRound } from 'lucide-react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { User } from '@/payload/payload-types'

type BlogAuthorHoverCardProps = {
  author: User | number
}

export function BlogAuthorHoverCard({ author }: BlogAuthorHoverCardProps) {
  if (typeof author === 'number') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <UserRound className="size-4" aria-hidden="true" />
        家人
      </span>
    )
  }

  return (
    <div className="group relative inline-flex">
      <Link
        className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
        href={`/member/${author.slug}`}
      >
        <UserRound className="size-4" aria-hidden="true" />
        {author.displayName}
      </Link>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-72 translate-y-1 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="overflow-hidden rounded-lg border border-white/65 bg-white/85 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
          <PayloadImage
            className="aspect-[16/9] rounded-none"
            fallbackLabel={author.displayName}
            media={author.cardImage ?? author.avatar ?? author.heroImage}
            sizes="18rem"
            tone={author.theme?.persona === 'tavis' ? 'tavis' : author.theme?.persona === 'lynn' ? 'lynn' : author.theme?.persona === 'leo' ? 'leo' : 'neutral'}
          />
          <div className="p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {author.familyRole}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-normal text-slate-950">
              {author.displayName}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
              {author.status || author.bio || '家人的故事持續更新中。'}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">
              前往個人首頁
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
