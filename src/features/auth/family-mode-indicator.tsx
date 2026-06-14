'use client'

import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { FamilySession } from '@/lib/data/auth'

type FamilyModeIndicatorProps = {
  session: FamilySession
}

export function FamilyModeIndicator({ session }: FamilyModeIndicatorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setPending(false)
    router.replace('/')
    router.refresh()
  }

  if (!session.isFamilyMode) {
    const next = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''

    return (
      <Button asChild className="rounded-md" size="sm" variant="outline">
        <Link href={`/family/login${next}`}>
          <LockKeyhole className="size-4" aria-hidden="true" />
          家人模式
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1 text-sm font-medium text-emerald-700 md:inline-flex">
        <ShieldCheck className="size-4" aria-hidden="true" />
        {session.displayName}
      </span>
      <Button
        className="rounded-md"
        disabled={pending}
        onClick={logout}
        size="sm"
        type="button"
        variant="outline"
      >
        <LogOut className="size-4" aria-hidden="true" />
        登出
      </Button>
    </div>
  )
}
