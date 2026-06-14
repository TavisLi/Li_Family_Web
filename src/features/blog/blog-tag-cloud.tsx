'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Hash, X } from 'lucide-react'

import type { BlogTagSummary } from '@/lib/data/posts'
import { cn } from '@/lib/utils'

type BlogTagCloudProps = {
  tags: BlogTagSummary[]
  selectedTag?: string
}

export function BlogTagCloud({ tags, selectedTag }: BlogTagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const maxCount = Math.max(...tags.map((tag) => tag.count), 1)

  return (
    <div className="rounded-lg border border-white/55 bg-white/55 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hash className="size-4 text-cyan-700" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-700">
            Tag Cloud
          </h2>
        </div>
        {selectedTag ? (
          <Link
            aria-label="Clear selected tag"
            className="inline-flex size-8 items-center justify-center rounded-md border border-white/60 bg-white/60 text-slate-600 transition hover:bg-white hover:text-slate-950"
            href="/blog"
          >
            <X className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((item) => {
          const active = selectedTag?.toLowerCase() === item.tag.toLowerCase()
          const intensity = item.count / maxCount
          const sizeClass = intensity > 0.66 ? 'text-base' : intensity > 0.33 ? 'text-sm' : 'text-xs'

          return (
            <Link
              className={cn(
                'inline-flex min-h-9 items-center gap-1 rounded-md border px-3 py-2 font-semibold transition duration-200',
                sizeClass,
                active
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-900 shadow-sm'
                  : 'border-white/60 bg-white/55 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950',
                hoveredTag && hoveredTag !== item.tag ? 'opacity-55' : 'opacity-100',
              )}
              href={`/blog?tag=${encodeURIComponent(item.tag)}`}
              key={item.tag}
              onBlur={() => setHoveredTag(null)}
              onFocus={() => setHoveredTag(item.tag)}
              onMouseEnter={() => setHoveredTag(item.tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              {item.tag}
              <span className="text-[0.7rem] text-slate-500">{item.count}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
