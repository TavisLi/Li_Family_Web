import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { FamilyLoginForm } from '@/features/auth/family-login-form'
import { getFamilySession } from '@/lib/data/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Family Login',
  description: '進入 Web Li 家人模式。',
}

type FamilyLoginPageProps = {
  searchParams: Promise<{
    next?: string
  }>
}

function safeRedirectPath(value: string | undefined): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export default async function FamilyLoginPage({ searchParams }: FamilyLoginPageProps) {
  const session = await getFamilySession()
  const { next } = await searchParams

  if (session.isFamilyMode) {
    redirect(safeRedirectPath(next))
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-md content-center px-5 py-12">
      <section className="rounded-lg border border-white/55 bg-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase text-slate-500">
          Family-Only Secure Gate
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
          進入家人模式
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          登入後會解鎖私密旅行細節、Blog 互動與 Phase-7 的共同願望入口。
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <FamilyLoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
