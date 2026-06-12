import type { Metadata } from 'next'
import Link from 'next/link'

import '../globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Web Li',
    template: '%s | Web Li',
  },
  description: 'A bilingual family portal powered by Next.js and Payload CMS.',
}

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)))]">
          <header className="sticky top-0 z-30 border-b border-white/20 bg-white/35 backdrop-blur-md">
            <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
              <Link className="text-sm font-semibold tracking-normal text-foreground" href="/">
                Web Li
              </Link>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link className="transition-colors hover:text-foreground" href="/">
                  Home
                </Link>
                <Link className="transition-colors hover:text-foreground" href="/admin">
                  Admin
                </Link>
              </div>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
