# Family Access Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase-6 Family-Only Secure Gate so visitor mode only receives public data and family mode unlocks private content, comments, reactions, and Phase-7 private entry points.

**Architecture:** Use Payload `users` auth as the single family session source. Keep Payload Local API calls inside `src/lib/data/` or server-only helpers, expose only non-sensitive session state to client components, and use Payload REST auth endpoints for browser login/logout cookies.

**Tech Stack:** Next.js 15 App Router, React 19, Payload CMS v3, TypeScript, Tailwind CSS, shadcn/ui, lucide-react.

---

## File Structure

- Create `src/lib/data/auth.ts`: server-only current user and family session helper.
- Create `src/features/auth/family-login-form.tsx`: client form that calls Payload REST auth endpoints with `credentials: 'include'`.
- Create `src/features/auth/family-mode-indicator.tsx`: small header control for visitor/family mode and logout.
- Create `src/app/(app)/family/login/page.tsx`: login route.
- Create `src/app/(app)/family/login/loading.tsx`: login-specific shimmer loading state.
- Create `src/app/(app)/family/login/error.tsx`: login-specific error boundary.
- Modify `src/app/(app)/layout.tsx`: render family mode indicator in the app shell.
- Modify `src/app/(app)/page.tsx`: pass family session to home view.
- Modify `src/features/home/home-page.tsx`: render public/private hub content and private entry points without leaking private details to visitors.
- Modify `src/lib/data/home.ts`: pass logged-in user to Payload reads and return family session.
- Modify `src/lib/data/posts.ts`: replace local auth helper with shared helper.
- Modify `src/lib/data/travel.ts`: pass logged-in user to list/detail reads and replace local auth helper.
- Modify `src/app/(app)/travel/[slug]/page.tsx`: make private metadata generic, matching Blog behavior.
- Create `docs/phase-completion-reports/phase-06-family-access-gate.md` at completion.

---

### Task 1: Branch And Baseline

**Files:**
- Read: `docs/phase-preparation/phase-06-family-access-gate.md`
- Read: `docs/phase-preparation/phase-06-preflight-readiness.md`
- Read: `docs/prompts/Web Li Prompt for Phase_6`

- [ ] **Step 1: Confirm Phase-5 is merged**

Run:

```bash
gh pr view 5 --json state,mergeStateStatus,url,headRefName,baseRefName
```

Expected before implementation:

```text
state is MERGED
baseRefName is main
```

If PR #5 is still `OPEN`, stop and ask whether to wait for merge or create a stacked Phase-6 branch.

- [ ] **Step 2: Update main and create Phase-6 branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c codex/phase-6-family-access-gate
```

Expected:

```text
Switched to a new branch 'codex/phase-6-family-access-gate'
```

- [ ] **Step 3: Confirm large local files are not staged**

Run:

```bash
git status --short
```

Expected:

```text
no staged .DS_Store
no staged content-source/blogger/takeout-20260614T010941Z-3-001.zip
```

- [ ] **Step 4: Run baseline checks**

Run:

```bash
pnpm tsc --noEmit
pnpm run build
git diff --check
```

Expected:

```text
TypeScript exits 0
Next build exits 0
git diff --check exits 0
```

Commit nothing in this task unless a baseline-only documentation correction is required.

---

### Task 2: Shared Family Session Helper

**Files:**
- Create: `src/lib/data/auth.ts`
- Modify: `src/lib/data/posts.ts`
- Modify: `src/lib/data/travel.ts`

- [ ] **Step 1: Create server-only auth helper**

Create `src/lib/data/auth.ts`:

```ts
import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

export type FamilySession =
  | {
      isFamilyMode: true
      user: User
      displayName: string
      familyRole: User['familyRole']
    }
  | {
      isFamilyMode: false
      user: null
      displayName: null
      familyRole: null
    }

export type PayloadUserRequest = {
  user: User
}

export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const result = await payload.auth({
    headers: requestHeaders,
  })

  return result.user ? (result.user as User) : null
}

export async function getFamilySession(): Promise<FamilySession> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      isFamilyMode: false,
      user: null,
      displayName: null,
      familyRole: null,
    }
  }

  return {
    isFamilyMode: true,
    user,
    displayName: user.displayName || user.email || '家人',
    familyRole: user.familyRole,
  }
}

export async function requireFamilyUser(redirectTo = '/family/login'): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect(redirectTo)
  }

  return user
}

export function userReq(user: User | null): { req: PayloadUserRequest } | Record<string, never> {
  return user ? { req: { user } } : {}
}
```

- [ ] **Step 2: Run type check to confirm helper imports**

Run:

```bash
pnpm tsc --noEmit
```

Expected:

```text
exit code 0
```

- [ ] **Step 3: Commit helper**

Run:

```bash
git add src/lib/data/auth.ts
git commit -m "Add shared family session helper"
```

---

### Task 3: Wire Blog Data To Shared Auth

**Files:**
- Modify: `src/lib/data/posts.ts`

- [ ] **Step 1: Replace local auth imports**

In `src/lib/data/posts.ts`, remove:

```ts
import { headers } from 'next/headers'
```

Add:

```ts
import { getCurrentUser, userReq } from './auth'
```

- [ ] **Step 2: Apply shared request helper**

Replace every conditional inline request spread:

```ts
...(user ? { req: { user } } : {}),
```

with:

```ts
...userReq(user),
```

Replace every explicit request object:

```ts
req: {
  user,
},
```

with:

```ts
req: { user },
```

Keep explicit `req: { user }` where TypeScript already knows `user` is non-null after the lock check.

- [ ] **Step 3: Delete local `getCurrentUser()`**

Remove the local function at the bottom of `src/lib/data/posts.ts`:

```ts
async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const result = await payload.auth({
    headers: requestHeaders,
  })

  if (!result.user) {
    return null
  }

  return result.user as User
}
```

If `User` is only used by the removed helper, remove it from the type import.

- [ ] **Step 4: Verify Blog data compiles**

Run:

```bash
pnpm tsc --noEmit
```

Expected:

```text
exit code 0
```

- [ ] **Step 5: Commit Blog auth wiring**

Run:

```bash
git add src/lib/data/posts.ts
git commit -m "Use shared auth helper for blog data"
```

---

### Task 4: Wire Travel Data To Family Mode

**Files:**
- Modify: `src/lib/data/travel.ts`
- Modify: `src/app/(app)/travel/[slug]/page.tsx`

- [ ] **Step 1: Replace local auth imports**

In `src/lib/data/travel.ts`, remove:

```ts
import { headers } from 'next/headers'
```

Add:

```ts
import { getCurrentUser, userReq } from './auth'
```

- [ ] **Step 2: Pass user request to travel list and detail**

Update `getFeaturedTravelProjects`, `getTravelProjects`, and `getTravelProjectBySlug`:

```ts
export async function getFeaturedTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const user = await getCurrentUser()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
    ...userReq(user),
  })

  return result.docs
}
```

Apply the same `const user = await getCurrentUser()` and `...userReq(user)` pattern to:

```ts
getTravelProjects
getTravelProjectBySlug
```

- [ ] **Step 3: Delete local `getCurrentUser()`**

Remove the local helper function from `src/lib/data/travel.ts` and remove `User` from the type import if no longer used.

- [ ] **Step 4: Make private travel metadata generic**

In `src/app/(app)/travel/[slug]/page.tsx`, after the `if (!project)` block in `generateMetadata`, add:

```ts
  if (project.isPrivate) {
    return {
      title: 'Family-only Travel',
      description: '這趟家庭旅行需要登入後才能閱讀。',
    }
  }
```

- [ ] **Step 5: Verify travel data compiles**

Run:

```bash
pnpm tsc --noEmit
```

Expected:

```text
exit code 0
```

- [ ] **Step 6: Commit travel auth wiring**

Run:

```bash
git add src/lib/data/travel.ts 'src/app/(app)/travel/[slug]/page.tsx'
git commit -m "Unlock private travel for family mode"
```

---

### Task 5: Wire Home Data To Family Mode

**Files:**
- Modify: `src/lib/data/home.ts`
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/features/home/home-page.tsx`

- [ ] **Step 1: Add auth imports and return type**

In `src/lib/data/home.ts`, add:

```ts
import type { FamilySession } from './auth'
import { getFamilySession, userReq } from './auth'
```

Add:

```ts
export type HomePageData = {
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  travelProjects: TravelProject[]
  familySession: FamilySession
}
```

- [ ] **Step 2: Pass user request to home queries**

Change function signatures:

```ts
export async function getMembers(limit = DEFAULT_LIMIT, session?: FamilySession): Promise<User[]> {
```

Inside the Payload find:

```ts
    ...userReq(session?.user ?? null),
```

Apply the same optional `session?: FamilySession` and `...userReq(session?.user ?? null)` pattern to:

```ts
getFeaturedTravelProjects
getLatestPosts
```

- [ ] **Step 3: Return family session from home data**

Replace `getHomeData()` with:

```ts
export async function getHomeData(): Promise<HomePageData> {
  const familySession = await getFamilySession()
  const [members, travelProjects, posts, homeConfig] = await Promise.all([
    getMembers(DEFAULT_LIMIT, familySession),
    getFeaturedTravelProjects(DEFAULT_LIMIT, familySession),
    getLatestPosts(DEFAULT_LIMIT, familySession),
    getHomeConfig(),
  ])

  return {
    familySession,
    homeConfig,
    members,
    posts,
    travelProjects,
  }
}
```

- [ ] **Step 4: Pass session to the home view**

In `src/app/(app)/page.tsx`, replace:

```ts
const { homeConfig, members, posts, travelProjects } = await getHomePageData()
```

with:

```ts
const { familySession, homeConfig, members, posts, travelProjects } = await getHomePageData()
```

Pass the prop:

```tsx
<HomePageView
  familySession={familySession}
  homeConfig={homeConfig}
  members={members}
  posts={posts}
  travelProjects={travelProjects}
/>
```

- [ ] **Step 5: Add family session prop to home component**

In `src/features/home/home-page.tsx`, update imports:

```ts
import type { FamilySession } from '@/lib/data/auth'
```

Update props:

```ts
type HomePageViewProps = {
  familySession: FamilySession
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  travelProjects: TravelProject[]
}
```

Update component args:

```ts
export function HomePageView({
  familySession,
  homeConfig,
  members,
  posts,
  travelProjects,
}: HomePageViewProps) {
```

- [ ] **Step 6: Make hub descriptions mode-aware**

Before `return`, add:

```ts
  const modeLabel = familySession.isFamilyMode
    ? `${familySession.displayName} 的家人模式`
    : '訪客模式'
  const timelineDescription = familySession.isFamilyMode
    ? '時空膠囊入口已解鎖，Phase-7 將接上年份滑塊、歷史照片與家庭事件。'
    : '訪客可看到精簡時間線；完整家庭足跡需要進入家人模式。'
  const bucketDescription = familySession.isFamilyMode
    ? '共同願望清單入口已解鎖，Phase-7 將接上進行中願望與完成煙火。'
    : '共同願望清單為家人模式限定，訪客只看到入口提示。'
```

Use `modeLabel` in the hero signal text:

```tsx
<span className="block text-xs font-semibold uppercase text-slate-500">Family Signal</span>
{modeLabel}
```

Use the mode-aware descriptions in the existing `HubPanel` calls for Timeline and Bucket List:

```tsx
description={timelineDescription}
description={bucketDescription}
```

- [ ] **Step 7: Verify home mode wiring**

Run:

```bash
pnpm tsc --noEmit
```

Expected:

```text
exit code 0
```

- [ ] **Step 8: Commit home data wiring**

Run:

```bash
git add src/lib/data/home.ts 'src/app/(app)/page.tsx' src/features/home/home-page.tsx
git commit -m "Connect home page to family session"
```

---

### Task 6: Login, Logout, And Header Indicator

**Files:**
- Create: `src/features/auth/family-login-form.tsx`
- Create: `src/features/auth/family-mode-indicator.tsx`
- Create: `src/app/(app)/family/login/page.tsx`
- Create: `src/app/(app)/family/login/loading.tsx`
- Create: `src/app/(app)/family/login/error.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create login form**

Create `src/features/auth/family-login-form.tsx`:

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { LockKeyhole, LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'

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

    const redirectTo = searchParams.get('next') || '/'
    router.replace(redirectTo)
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
```

- [ ] **Step 2: Create family mode indicator**

Create `src/features/auth/family-mode-indicator.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LockKeyhole, LogOut, ShieldCheck } from 'lucide-react'

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
```

- [ ] **Step 3: Create login page**

Create `src/app/(app)/family/login/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

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

export default async function FamilyLoginPage({ searchParams }: FamilyLoginPageProps) {
  const session = await getFamilySession()
  const { next } = await searchParams

  if (session.isFamilyMode) {
    redirect(next || '/')
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-md content-center px-5 py-12">
      <section className="rounded-lg border border-white/55 bg-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase text-slate-500">Family-Only Secure Gate</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
          進入家人模式
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          登入後會解鎖私密旅行細節、Blog 互動與 Phase-7 的共同願望入口。
        </p>
        <div className="mt-6">
          <FamilyLoginForm />
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Create loading and error boundaries**

Create `src/app/(app)/family/login/loading.tsx`:

```tsx
export default function FamilyLoginLoading() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-md content-center px-5 py-12">
      <div className="rounded-lg border border-white/55 bg-white/60 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-16 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-11 animate-pulse rounded-md bg-slate-200" />
      </div>
    </main>
  )
}
```

Create `src/app/(app)/family/login/error.tsx`:

```tsx
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
```

- [ ] **Step 5: Render indicator in layout**

In `src/app/(app)/layout.tsx`, add:

```ts
import { FamilyModeIndicator } from '@/features/auth/family-mode-indicator'
import { getFamilySession } from '@/lib/data/auth'
```

Make layout async:

```tsx
export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getFamilySession()
```

Render indicator inside the nav right group after Admin:

```tsx
<FamilyModeIndicator session={session} />
```

- [ ] **Step 6: Verify auth UI compiles**

Run:

```bash
pnpm tsc --noEmit
```

Expected:

```text
exit code 0
```

- [ ] **Step 7: Commit auth UI**

Run:

```bash
git add src/features/auth 'src/app/(app)/family' 'src/app/(app)/layout.tsx'
git commit -m "Add family login and mode indicator"
```

---

### Task 7: Privacy QA And Browser Verification

**Files:**
- Modify: `docs/phase-completion-reports/phase-06-family-access-gate.md`

- [ ] **Step 1: Run static verification**

Run:

```bash
pnpm tsc --noEmit
pnpm run build
git diff --check
```

Expected:

```text
all commands exit 0
```

- [ ] **Step 2: Start dev server**

Run:

```bash
pnpm dev
```

Expected:

```text
ready started server on http://localhost:3000
```

If port 3000 is busy, use the alternate URL shown by Next.js.

- [ ] **Step 3: Visitor browser QA**

Use a fresh or logged-out browser session. Check:

```text
/
/travel
/blog
/family/login
```

Expected:

```text
Header shows visitor family mode entry
Home only shows public members/posts/travels
Travel index only shows public travel
Blog index only shows public blog
Timeline/Bucket/Wrapped entries are locked or preview-only
No client console errors
No horizontal overflow at 390px width
```

- [ ] **Step 4: Visitor private leak check**

In visitor mode, fetch a known private route slug from seed data or Payload Admin and check:

```bash
curl -s http://localhost:3000/blog/<private-blog-slug> | rg "<private title>|<private summary>|<private tag>"
curl -s http://localhost:3000/travel/<private-travel-slug> | rg "<private title>|<private itinerary>|<private flight>"
```

Expected:

```text
rg returns no matches
```

- [ ] **Step 5: Family login QA**

In the browser:

```text
Open /family/login
Submit a seeded family email and password from local environment
Observe redirect to /
Open /blog
Open a private blog detail
Submit a comment
Submit heart, cool, and applause reactions
Open /travel
Open a private travel detail
Submit a comment
Submit up and down reactions
Click logout
Confirm public mode returns immediately
```

Expected:

```text
Private content appears only after login
Comments/reactions persist after refresh
Logout hides private content
No secret values appear in client source or console
```

- [ ] **Step 6: Write completion report**

Create `docs/phase-completion-reports/phase-06-family-access-gate.md` with:

```markdown
# Phase-06 Family Access Gate 完成報告

## Phase 範圍

## Branch / Commit

## GitHub 同步 / PR 狀態

## 已交付功能

## 主要檔案

## 驗證命令

## Browser QA

## 隱私 / Data Leak 檢查

## 已知限制

## Phase-7 準備事項
```

Fill each section with actual results from the commands and browser QA. Do not leave empty headings.

- [ ] **Step 7: Commit report and final code**

Run:

```bash
git add docs/phase-completion-reports/phase-06-family-access-gate.md
git commit -m "Document phase 6 family access gate"
```

- [ ] **Step 8: Push and create PR**

Run:

```bash
git push -u origin codex/phase-6-family-access-gate
gh pr create --base main --head codex/phase-6-family-access-gate --title "Implement phase 6 family access gate" --body-file docs/phase-completion-reports/phase-06-family-access-gate.md
```

Expected:

```text
GitHub returns a PR URL
```

---

## Self-Review

- Spec coverage: The plan covers family session, visitor mode, family mode, homepage state switch, Payload access usage, loading/error boundaries, validation commands, browser QA, data leak checks, commit, push, and PR.
- Placeholder scan: No placeholder markers or empty task steps remain. The completion report template contains headings only inside an explicit step that requires filling actual results before commit.
- Type consistency: `FamilySession`, `getCurrentUser`, `getFamilySession`, `requireFamilyUser`, and `userReq` are defined in Task 2 and used consistently in later tasks.
