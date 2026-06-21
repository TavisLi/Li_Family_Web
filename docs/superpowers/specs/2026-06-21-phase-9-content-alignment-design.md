# Phase 9 Content Alignment Design

## Scope

Phase 9 makes the checked-in family, travel, and asset sources deterministically seedable and visible through the existing shared Payload-backed travel routes. It does not create per-trip routes, move media out of Cloudflare R2, or perform a Production data mutation without separate user approval.

## Source contract

- `docs/family-members.md` is the authority for member display names and interests. `中文名稱/English name` maps to `zh-TW` and `en`; stable slugs remain independent of display text. The text before a design-note parenthesis is the interest list.
- `docs/travel-projects.md` is the authority for catalog membership, status, display title, and source Markdown identity. Every catalog row maps to exactly one Markdown file and one canonical slug.
- Travel Markdown is the authority for the structured trip body. Catalog title takes precedence for `TravelProjects.title`; Markdown heading/frontmatter remains available as the source title only where needed for summaries.
- Asset folders and local manifests are the authority for media ownership and placement. Local manifests override the global manifest without changing the established source-path rule.

## Data flow

`content-source` and `docs` -> catalog/family/Markdown parsers -> typed `SeedContent` -> idempotent Payload upserts -> `src/lib/data/travel.ts` -> shared `/travel` and `/travel/[slug]` pages.

The parser will use a Markdown-table helper scoped to named sections, rather than a document-wide regex. It will support the table variations present in the five checked-in trips, including rows without flight-number cells. YouTube values are accepted only after URL validation and will be rendered through the existing YouTube-specific embed helper.

## UI and access

The existing common travel detail feature remains the sole renderer. It will display all parsed content through reusable sections, continue to use `PayloadImage`/`ImageFallback` for missing media, and preserve public/family visibility through the existing Payload access path. No arbitrary third-party iframe is permitted.

## Verification and release boundary

Focused parser and coverage tests prove every catalog entry has one Markdown source, a stable slug, a seed model, media integrity, and route coverage. A dry-run/audit can be executed locally without secrets. Production seeding, R2 upload validation, Vercel log inspection, and authenticated browser QA require their relevant credentials and/or explicit authorization; they will be recorded as blockers rather than simulated.
