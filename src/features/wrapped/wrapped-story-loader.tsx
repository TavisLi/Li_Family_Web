'use client'

import dynamic from 'next/dynamic'

import type { WrappedSnapshot } from '@/payload/payload-types'

const WrappedStory = dynamic(
  () => import('./wrapped-story').then((module) => module.WrappedStory),
  {
    loading: () => (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-slate-950 text-white">
        <p className="text-sm font-semibold uppercase tracking-normal text-cyan-100">Loading Wrapped</p>
      </div>
    ),
    ssr: false,
  },
)

export function WrappedStoryLoader({ snapshot }: { snapshot: WrappedSnapshot }) {
  return <WrappedStory snapshot={snapshot} />
}
