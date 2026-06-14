import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { FamilyModeIndicator } from '@/features/auth/family-mode-indicator'
import { getFamilySession } from '@/lib/data/auth'
import '../globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Web Li',
    template: '%s | Web Li',
  },
  description: 'A bilingual family portal powered by Next.js and Payload CMS.',
}

type AppLayoutProps = {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getFamilySession()

  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-950">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/60 backdrop-blur-xl">
            <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5">
              <Link className="text-sm font-semibold tracking-normal text-slate-950" href="/">
                Li Family
              </Link>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <Link className="transition-colors hover:text-slate-950" href="/">
                  大廳
                </Link>
                <Link className="transition-colors hover:text-slate-950" href="/travel">
                  旅行
                </Link>
                <Link className="transition-colors hover:text-slate-950" href="/blog">
                  Blog
                </Link>
                <Link className="transition-colors hover:text-slate-950" href="/admin">
                  Admin
                </Link>
                <FamilyModeIndicator session={session} />
              </div>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
