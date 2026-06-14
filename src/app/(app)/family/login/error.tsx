'use client'

import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function FamilyLoginError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-md content-center px-5 py-12">
      <section className="rounded-lg border border-white/55 bg-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase text-rose-500">Family Gate Error</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal text-slate-950">
          家人入口暫時無法載入
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">請稍後重試。</p>
        <Button className="mt-6 rounded-md" onClick={reset} type="button" variant="outline">
          <RotateCcw className="size-4" aria-hidden="true" />
          重新載入
        </Button>
      </section>
    </main>
  )
}
