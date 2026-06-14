'use client'

import { LockKeyhole, LogIn } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'

function safeRedirectPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export function FamilyLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const response = await fetch('/api/users/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    setPending(false)

    if (!response.ok) {
      setError('登入失敗，請確認家人帳號與密碼。')
      return
    }

    router.replace(safeRedirectPath(searchParams.get('next')))
    router.refresh()
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="family-email">
          家人 Email
        </label>
        <input
          autoComplete="email"
          className="h-11 rounded-md border border-white/60 bg-white/70 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          id="family-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="family-password">
          密碼
        </label>
        <input
          autoComplete="current-password"
          className="h-11 rounded-md border border-white/60 bg-white/70 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          id="family-password"
          name="password"
          required
          type="password"
        />
      </div>
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Button className="rounded-md" disabled={pending} type="submit">
        {pending ? (
          <>
            <LockKeyhole className="size-4 animate-pulse" aria-hidden="true" />
            驗證中
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" />
            進入家人模式
          </>
        )}
      </Button>
    </form>
  )
}
