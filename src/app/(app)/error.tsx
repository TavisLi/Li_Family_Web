'use client'

import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ErrorPageProps = {
  error: Error
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl items-center px-5 py-12">
      <section className="w-full rounded-lg border border-white/20 bg-white/35 p-8 shadow-sm backdrop-blur-md">
        <p className="text-sm font-medium text-muted-foreground">Something needs attention</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
          {error.message || 'The family portal could not load this view.'}
        </h1>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Retry
        </Button>
      </section>
    </main>
  )
}
