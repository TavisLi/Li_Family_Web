# Phase 9 Content Alignment and v1 Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reliably seed all catalogued family and travel content, display it through the shared Payload-backed travel experience, and produce auditable launch-readiness evidence.

**Architecture:** Keep `docs/` and `content-source/` as inputs, parse them in `src/scripts/seed-content.ts`, upsert through `src/scripts/seed.ts`, and render solely via the existing data layer and shared routes. Catalog metadata controls membership, stable slug, status, and display-title precedence; trip Markdown provides structured body data; manifests control media relations.

**Tech Stack:** Next.js 15 App Router, Payload CMS v3, TypeScript, Zod, Node assert, Tailwind, Cloudflare R2 media.

---

### Task 1: Lock the source parser contract with failing tests

**Files:**
- Modify: `src/scripts/seed-content.test.ts`

- [ ] Add tests for bilingual family names, parsed interest lists, locale fallback, catalog completeness, catalog title precedence, five-trip field coverage, flight parsing, lodging parsing, YouTube parsing, and manifest/file integrity.
- [ ] Run `pnpm run test:seed-content` and confirm the tests fail specifically against the current parser gaps.
- [ ] Commit the red test baseline with the implementation changes that satisfy it.

### Task 2: Implement catalog and family parsing

**Files:**
- Modify: `src/scripts/seed-content.ts`
- Modify: `src/scripts/seed-content.test.ts`

- [ ] Add a structured `docs/travel-projects.md` catalog parser with source-file, status, title, and stable-slug validation.
- [ ] Convert family names to explicit `zh-TW`/`en` seed data and parse interest text before design-note parentheses.
- [ ] Run the focused seed-content test and confirm the new assertions pass.

### Task 3: Complete structured trip parsing and media audit

**Files:**
- Modify: `src/scripts/seed-content.ts`
- Modify: `src/scripts/seed-content.test.ts`

- [ ] Extract table-based flights, lodgings, rail segments, daily itinerary detail, and validated YouTube links from every catalogued source format.
- [ ] Use catalog title precedence while retaining Markdown-derived body data.
- [ ] Add source-path/owner/manifest file checks and a reusable dry-run coverage report.
- [ ] Run `pnpm run test:seed-content` and verify all source-contract assertions pass.

### Task 4: Connect complete seed data to the shared front end

**Files:**
- Modify: `src/features/travel/travel-detail-page.tsx`
- Modify: `src/features/travel/travel-index-page.tsx` only if coverage makes a catalogue omission observable
- Modify: `src/lib/data/travel.ts` only if a typed data-layer helper is needed
- Modify: `src/scripts/seed-content.test.ts`

- [ ] Add focused route/data coverage tests before changing rendering behavior.
- [ ] Render the already-schema-backed lodging, rail, media, itinerary, and YouTube data in reusable, status-aware sections; preserve `ImageFallback` and safe YouTube embedding.
- [ ] Run the focused tests and the full seed-content suite.

### Task 5: Validate, document, and prepare the release handoff

**Files:**
- Modify: `docs/travel-content-source-guidelines.md` as needed for the catalog/family/section contract
- Modify: `docs/production-deployment-checklist.md` for dry-run, backup, and Production read-back steps
- Create: `docs/phase-completion-reports/phase-09-content-alignment-v1-launch.md`

- [ ] Run `pnpm exec payload generate:types` only if schema changes; otherwise record that the existing schema sufficed.
- [ ] Run `pnpm run test:seed-content`, `pnpm tsc --noEmit`, and `pnpm run build`.
- [ ] Run the dry-run/audit without secrets; do not run a Production mutation without explicit approval.
- [ ] Record production-seed, R2, browser-QA, and authenticated-flow evidence or their concrete blockers in the Chinese completion report.
- [ ] Commit, push the Phase branch, and open a PR after fresh verification.
