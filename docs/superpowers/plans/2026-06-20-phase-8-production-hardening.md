# Phase 8 Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Web Li's media URLs, public SEO metadata, deployment configuration documentation, and production verification without changing public/private content behavior.

**Architecture:** Add a small server-safe metadata module that normalizes the canonical site URL and guarantees a public Open Graph fallback image. Keep media URL selection in `src/lib/media.ts`, adding only a public URL normalizer used by metadata. Route files stay thin and continue fetching through `src/lib/data/`; Payload R2 configuration is audited and only changed when a concrete defect is found.

**Tech Stack:** Next.js 15.4.11 App Router, TypeScript, Payload CMS 3.85.1, Cloudflare R2 S3 adapter, Tailwind CSS, Node/tsx test runner.

---

## File Structure

- Create: `src/lib/site-metadata.ts` - canonical URL, absolute URL, and Open Graph fallback helpers.
- Create: `src/lib/site-metadata.test.ts` - direct Node/tsx regression tests for metadata helper behavior.
- Modify: `src/lib/media.ts` - normalize a usable Payload/R2 media URL without exposing env in client components.
- Modify: `src/app/(app)/layout.tsx` - set `metadataBase`, default Open Graph image, and robots defaults.
- Modify: `src/app/(app)/page.tsx`, `member/[slug]/page.tsx`, `travel/[slug]/page.tsx`, `blog/[slug]/page.tsx` - use shared canonical and fallback helpers.
- Modify: `.env.example`, `README.md` - document environment boundaries and Vercel configuration.
- Create: `docs/production-deployment-checklist.md` - Cloudflare R2, Supabase, Vercel and rollback checklist.
- Create: `docs/phase-completion-reports/phase-08-production-hardening.md` - measured Chinese handoff.

### Task 1: Add Metadata Helper Regression Tests

**Files:**
- Create: `src/lib/site-metadata.test.ts`
- Create: `src/lib/site-metadata.ts`

- [ ] **Step 1: Write the failing helper test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { absoluteSiteUrl, metadataImageUrl, siteMetadataBase } from './site-metadata'

test('uses the configured public server URL as the metadata base', () => {
  assert.equal(siteMetadataBase('https://family.example.com/').toString(), 'https://family.example.com/')
})

test('creates an absolute canonical URL from a route path', () => {
  assert.equal(absoluteSiteUrl('/blog/family-memory', 'https://family.example.com'), 'https://family.example.com/blog/family-memory')
})

test('uses a shared Open Graph fallback for missing media', () => {
  assert.equal(metadataImageUrl(null, 'https://family.example.com'), 'https://family.example.com/og-default.png')
})

test('keeps an already absolute R2 media URL unchanged', () => {
  assert.equal(
    metadataImageUrl('https://media.example.com/media/family.jpeg', 'https://family.example.com'),
    'https://media.example.com/media/family.jpeg',
  )
})
```

- [ ] **Step 2: Verify the test fails for the intended reason**

Run: `pnpm exec tsx src/lib/site-metadata.test.ts`

Expected: failure containing `Cannot find module './site-metadata'`.

- [ ] **Step 3: Implement the minimal server-safe helper**

```ts
import 'server-only'

const DEFAULT_SITE_URL = 'http://localhost:3000'
const DEFAULT_OG_IMAGE_PATH = '/og-default.png'

export function siteMetadataBase(value = process.env.NEXT_PUBLIC_SERVER_URL): URL {
  return new URL(value?.trim() || DEFAULT_SITE_URL)
}

export function absoluteSiteUrl(path: string, value = process.env.NEXT_PUBLIC_SERVER_URL): string {
  return new URL(path, siteMetadataBase(value)).toString()
}

export function metadataImageUrl(mediaUrl: string | null | undefined, value = process.env.NEXT_PUBLIC_SERVER_URL): string {
  return mediaUrl?.trim() ? new URL(mediaUrl, siteMetadataBase(value)).toString() : absoluteSiteUrl(DEFAULT_OG_IMAGE_PATH, value)
}
```

Add `public/og-default.png` only if no existing public bitmap asset can be reused.

- [ ] **Step 4: Verify the test passes**

Run: `pnpm exec tsx src/lib/site-metadata.test.ts`

Expected: four passing Node tests.

- [ ] **Step 5: Commit the helper and test**

```bash
git add src/lib/site-metadata.ts src/lib/site-metadata.test.ts public/og-default.png
git commit -m "Harden site metadata URL helpers"
```

### Task 2: Apply Shared Metadata to Public Routes

**Files:**
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/app/(app)/member/[slug]/page.tsx`
- Modify: `src/app/(app)/travel/[slug]/page.tsx`
- Modify: `src/app/(app)/blog/[slug]/page.tsx`
- Test: `src/lib/site-metadata.test.ts`

- [ ] **Step 1: Update route metadata**

In `layout.tsx`, set `metadataBase: siteMetadataBase()` and a default `openGraph.images` value from `metadataImageUrl(null)`. In public detail routes, replace `images: image ? [{ url: image }] : undefined` with `images: [{ url: metadataImageUrl(image) }]`; add `alternates: { canonical: routePath }`. Preserve existing private Blog/Travel early-return guards. In BlogPosting JSON-LD, use `absoluteSiteUrl` for `mainEntityOfPage` and `metadataImageUrl` for `image`.

- [ ] **Step 2: Verify metadata tests and types**

Run: `pnpm exec tsx src/lib/site-metadata.test.ts && pnpm tsc --noEmit`

Expected: Node tests pass and TypeScript exits 0.

- [ ] **Step 3: Commit route metadata changes**

```bash
git add src/app/(app)/layout.tsx src/app/(app)/page.tsx src/app/(app)/member/[slug]/page.tsx src/app/(app)/travel/[slug]/page.tsx src/app/(app)/blog/[slug]/page.tsx src/lib/site-metadata.ts src/lib/site-metadata.test.ts
git commit -m "Add canonical Open Graph metadata fallbacks"
```

### Task 3: Audit R2, Media, Client Boundaries, and Image Usage

**Files:**
- Modify only when audit finds a concrete inconsistency: `src/payload/payload.config.ts`, `src/payload/collections/Media.ts`, `src/components/ui/payload-image.tsx`, `src/lib/media.ts`
- Test: Payload type generation, seed content, and TypeScript.

- [ ] **Step 1: Verify the R2 and Media contract**

Run:

```bash
rg -n "s3Storage|R2_|forcePathStyle|region: 'auto'|filesRequiredOnCreate|mimeTypes|imageSizes|youtubeUrl" src/payload src/lib .env.example
```

Expected: R2 requires account ID, access key, secret, and bucket; S3 uses `region: 'auto'` and `forcePathStyle: true`; Media permits `image/*`, preserves 400/800/1600 widths, and saves only YouTube URLs for video records.

- [ ] **Step 2: Scan client files and image render sites**

Run:

```bash
rg -l "'use client'|\"use client\"" src | xargs rg -n "PAYLOAD_SECRET|DATABASE_URI|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|@payload-config|payload.config"
rg -n "next/image|<Image|<img|PayloadImage|ImageFallback" src -g '!src/payload/payload-types.ts'
```

Expected: no secrets or Payload config imports in client files; image rendering uses `PayloadImage` or `ImageFallback`, and `next/image` receives explicit sizes.

- [ ] **Step 3: Apply only required corrections**

If R2 public URL rewriting is needed, add a server-only function in `src/lib/media.ts` and use it only from `site-metadata.ts`; never read public URL env in `PayloadImage`. Do not modify Media schema without a prompt violation. If a collection changes, run `pnpm exec payload generate:types` and create an incremental migration under Node 20.

- [ ] **Step 4: Verify media and content contracts**

Run:

```bash
pnpm exec payload generate:types
pnpm run test:seed-content
pnpm tsc --noEmit
```

Expected: each command exits 0. If no collection changed, report that no migration was created.

- [ ] **Step 5: Commit actual audit corrections only**

```bash
git add src/payload/payload.config.ts src/payload/collections/Media.ts src/components/ui/payload-image.tsx src/lib/media.ts src/payload/payload-types.ts src/migrations
git commit -m "Audit R2 media delivery boundaries"
```

### Task 4: Document Deployment and Environment Rules

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Create: `docs/production-deployment-checklist.md`

- [ ] **Step 1: Verify the documentation gap**

Run: `rg -n "NEXT_PUBLIC_SERVER_URL|PAYLOAD_PUBLIC_SERVER_URL|NEXT_PUBLIC_R2_PUBLIC_URL" .env.example README.md`

Expected: `NEXT_PUBLIC_SERVER_URL` is absent or lacks Preview/Production guidance.

- [ ] **Step 2: Update examples and operator documentation**

Add this to `.env.example`:

```dotenv
# Use the production domain in Vercel Production and the Preview deployment URL in Preview.
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
# Optional public R2/CDN base URL; never expose R2 credentials to the browser.
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.example.com
```

Document all required variables: `PAYLOAD_SECRET`, `DATABASE_URI`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_SERVER_URL`, and `NEXT_PUBLIC_R2_PUBLIC_URL`. Mark secrets server-only, describe R2 upload activation, Preview/Production separation, rollback observation, and post-deploy smoke tests.

- [ ] **Step 3: Validate documentation safety**

Run:

```bash
git diff --check
rg -n "your_super_secure|your-password|your_r2|example\.com" .env.example README.md docs/production-deployment-checklist.md
```

Expected: `git diff --check` exits 0; only intentional placeholders appear.

- [ ] **Step 4: Commit documentation**

```bash
git add .env.example README.md docs/production-deployment-checklist.md
git commit -m "Document production deployment configuration"
```

### Task 5: Production Validation, Browser QA, and Phase Handoff

**Files:**
- Create: `docs/phase-completion-reports/phase-08-production-hardening.md`

- [ ] **Step 1: Run required validation**

Run:

```bash
pnpm exec payload generate:types
pnpm run test:seed-content
pnpm exec tsx src/lib/site-metadata.test.ts
pnpm tsc --noEmit
pnpm run build
```

Expected: all commands exit 0. Attempt `pnpm run seed` only with available database credentials; record the actual error when unavailable.

- [ ] **Step 2: Run browser smoke tests**

Run: `pnpm dev`

Use the in-app Browser to test public `/`, `/travel`, `/blog`, `/timeline`; public redirects from `/bucket-list` and `/wrapped`; family-mode routes only with authorised test access. Confirm no broken images or browser console errors.

- [ ] **Step 3: Check Vercel status**

Inspect Preview after branch push and Production after merge. If Vercel cannot be authenticated locally, record the exact blocker and the required human verification.

- [ ] **Step 4: Write the final Chinese Phase report**

Include scope, branch/real commits, GitHub/PR status, delivered features, key files, every validation result, browser QA, Vercel Preview/Production, known limits, and next-phase readiness. Do not claim an unverified seed or deployment succeeded.

- [ ] **Step 5: Commit, push, and open a draft PR**

```bash
git add docs/phase-completion-reports/phase-08-production-hardening.md
git commit -m "Finalize phase 8 production hardening and deployment"
git push -u origin codex/phase-8-production-hardening
```

Open a draft PR titled `Finalize phase 8 production hardening and deployment` and record the Preview URL and post-merge Production result when available.

## Plan Self-Review

- Spec coverage: Tasks 1-2 cover canonical/OG/JSON-LD fallback; Task 3 covers R2, Media limits, image fallback, client secrets and pool restraint; Task 4 covers Vercel env/deployment documentation; Task 5 covers validation, browser QA, Vercel state, report, push and PR.
- Placeholder scan: no undefined implementation work remains; Task 3 gives the concrete schema-change condition and commands.
- Type consistency: all route metadata uses `siteMetadataBase`, `absoluteSiteUrl`, and `metadataImageUrl` defined in Task 1.
