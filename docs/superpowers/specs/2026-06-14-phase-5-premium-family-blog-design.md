# Phase-5 Premium Family Blog Design

## Scope

Phase-5 delivers the first production Blog surface for Web Li: `/blog`, `/blog/[slug]`, categories, tags, author association, safe Lexical rendering, SEO metadata, JSON-LD, and locked/optimistic interaction UI for comments and warm reactions.

## Data Source

The initial Blog source is `content-source/blogger/takeout-20260614T010941Z-3-001.zip`. The importer reads the Blogger `Blogs/*/feed.atom`, keeps only `POST` entries with `LIVE` status, maps labels to Payload categories and tags, maps the author to Tavis, and writes records into Payload `posts`. Phase-5 seeds a small sample first and includes deterministic test posts for public/private, missing cover image, and multiple category/tag coverage.

## Architecture

Route files stay thin. `src/app/(app)/blog/page.tsx` and `src/app/(app)/blog/[slug]/page.tsx` handle metadata, data fetching, JSON-LD, and feature composition. All Payload access for frontend features goes through `src/lib/data/posts.ts`; React components never call the Payload Local API directly.

Blog UI lives in `src/features/blog/`. Client-only interaction is isolated to the tag cloud and reaction panel. Server actions live in `src/features/blog/actions.ts` and delegate writes to the data layer.

## Rich Text

Blogger HTML is converted into a conservative Lexical document for seed/import. The frontend renderer uses a safe node whitelist and does not render unknown HTML with `dangerouslySetInnerHTML`. Supported output includes paragraph, heading, text formatting, link, list, quote, and linebreak nodes.

## Interaction Rules

`Comments` remains locked behind Payload auth. Unauthenticated visitors see a locked interaction preview. Authenticated users can submit comments and `heart`, `cool`, or `applause` reactions through server actions; the client uses `useOptimistic` for immediate local feedback.

## Verification

The phase must run `pnpm run test:seed-content`, `pnpm tsc --noEmit`, `pnpm run build`, and `git diff --check`. Browser QA covers `/blog`, a public post detail page, desktop/mobile viewports, author hover card, tag cloud interaction, cover fallback, and locked interaction preview. Logged-in comment/reaction validation is recorded if a session is available; otherwise it is listed as a Phase-6 follow-up.
