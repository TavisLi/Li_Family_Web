import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { FamilyModeIndicator } from '@/features/auth/family-mode-indicator'
import { getFamilySession } from '@/lib/data/auth'
import { metadataImageUrl, siteMetadataBase } from '@/lib/site-metadata'
import '../globals.css'

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: 'Web Li',
    template: '%s | Web Li',
  },
  description: 'A bilingual family portal powered by Next.js and Payload CMS.',
  openGraph: {
    images: [{ url: metadataImageUrl(null) }],
    siteName: 'Web Li',
    type: 'website',
  },
  robots: {
    follow: true,
    index: true,
  },
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
            <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-3 sm:px-5">
              <Link
                aria-label="Web Li 首頁"
                className="group flex shrink-0 items-center gap-2"
                href="/"
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className="size-7 rounded-lg shadow-[0_0_0_1px_rgba(148,120,68,0.16)] transition-transform duration-300 group-hover:scale-[1.03] sm:size-8"
                  height={32}
                  priority
                  src="/brand/web-li-family-crest-light.png"
                  width={32}
                />
                <span aria-hidden="true" className="hidden leading-none sm:block">
                  <span className="block font-serif text-[15px] font-semibold tracking-[0.02em] text-slate-950">
                    Li Family
                  </span>
                  <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.22em] text-[#9a7a41]">
                    Web Li
                  </span>
                </span>
              </Link>
              <div className="flex items-center gap-2 text-sm text-slate-600 sm:gap-4">
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
