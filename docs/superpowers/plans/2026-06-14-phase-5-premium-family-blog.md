# Phase-5 Premium Family Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Payload-backed Premium Family Blog system for `/blog` and `/blog/[slug]` with Blogger Takeout sample seeding, safe rich text rendering, categories/tags, author cards, and locked/optimistic interactions.

**Architecture:** Extend the existing seed pipeline so Blog data is stored in Payload `posts` and `categories`. Keep App Router files thin and route all Blog data through `src/lib/data/posts.ts`. Place presentational and client interaction components in `src/features/blog/`.

**Tech Stack:** Next.js 15.4 App Router, React 19, Payload CMS v3.85, Lexical richText, Tailwind CSS, shadcn/ui Button, lucide-react.

---

## File Structure

- Modify `src/scripts/seed-content.ts`: parse Blogger Takeout feed, build Blog post/category seeds, and expose testable parser helpers.
- Modify `src/scripts/seed-content.test.ts`: assert Blogger sample parsing, deterministic Blog seed coverage, and Lexical output shape.
- Modify `src/scripts/seed.ts`: create/update categories and posts after members/media are seeded.
- Modify `src/lib/data/posts.ts`: add Blog index/detail/tag cloud/interaction APIs and keep `getLatestPosts`.
- Create `src/features/blog/lexical-renderer.tsx`: render safe Lexical nodes without raw HTML.
- Create `src/features/blog/blog-author-hover-card.tsx`: author hover/focus card linked to member page.
- Create `src/features/blog/blog-tag-cloud.tsx`: stable interactive client tag cloud.
- Create `src/features/blog/blog-reaction-panel.tsx`: locked/optimistic comments and warm reactions.
- Create `src/features/blog/actions.ts`: server actions delegating Blog interaction writes to the data layer.
- Create `src/features/blog/blog-index-page.tsx`: Blog list UI.
- Create `src/features/blog/blog-post-page.tsx`: post detail UI.
- Create `src/app/(app)/blog/page.tsx`: Blog index route.
- Create `src/app/(app)/blog/[slug]/page.tsx`: Blog detail route with metadata and JSON-LD.
- Modify `src/app/(app)/layout.tsx`: add Blog navigation entry.
- Add `docs/phase-completion-reports/phase-05-premium-family-blog.md`: Chinese completion report after verification.

## Tasks

### Task 1: Blog Seed Parser

- [ ] Write failing seed-content tests for Blogger Takeout sample parsing and deterministic coverage.
- [ ] Run `pnpm run test:seed-content` and confirm the tests fail because Blog seed APIs do not exist yet.
- [ ] Implement Blogger feed parsing, safe HTML-to-Lexical conversion, category/tag seed generation, and deterministic private/missing-cover sample records.
- [ ] Run `pnpm run test:seed-content` and confirm it passes.

### Task 2: Payload Seed Writes

- [ ] Extend `src/scripts/seed.ts` with category and post upsert steps.
- [ ] Run `pnpm run test:seed-content` to keep parser coverage green.
- [ ] Run `pnpm exec payload generate:types` only if collection definitions change; otherwise skip and record that schemas were unchanged.

### Task 3: Blog Data Layer

- [ ] Implement `getBlogIndex`, `getBlogPostBySlug`, `getBlogTagCloud`, `getBlogInteractionThread`, and `submitBlogInteraction` in `src/lib/data/posts.ts`.
- [ ] Preserve `getLatestPosts` for the home page.
- [ ] Run `pnpm tsc --noEmit` and fix type errors before moving on.

### Task 4: Blog Feature Components

- [ ] Create safe Lexical renderer.
- [ ] Create author hover card, tag cloud, reaction panel, index page, and post page components.
- [ ] Use `PayloadImage` and `ImageFallback` for all cover-image missing/error states.
- [ ] Run `pnpm tsc --noEmit` and fix type errors.

### Task 5: App Routes, Metadata, Navigation

- [ ] Add `/blog` and `/blog/[slug]` App Router pages.
- [ ] Add `generateMetadata` and BlogPosting JSON-LD for public posts.
- [ ] Add Blog to the main navigation.
- [ ] Run `pnpm tsc --noEmit`.

### Task 6: Verification, QA, Report, GitHub

- [ ] Run `pnpm run test:seed-content`.
- [ ] Run `pnpm tsc --noEmit`.
- [ ] Run `pnpm run build`.
- [ ] Run `git diff --check`.
- [ ] Start `pnpm dev` and Browser QA `/blog` plus at least one public `/blog/[slug]` on desktop and mobile.
- [ ] Write Chinese completion report in `docs/phase-completion-reports/phase-05-premium-family-blog.md`.
- [ ] Commit with `Implement phase 5 premium family blog`.
- [ ] Push `codex/phase-5-premium-family-blog`.
- [ ] Create a GitHub PR.
