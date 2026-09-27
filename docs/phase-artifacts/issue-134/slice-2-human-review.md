# Issue #134 Slice 2 — Human review

Status: **LOCAL PASS / HUMAN REVIEW**. No Production schema, content, media, baseline metadata, deployment, or GitHub publication was changed.

## Baseline and authority

- Repository `TavisLi/Li_Family_Web`; branch `codex/phase-134-media-registry`; base/worktree HEAD `bc0d3aa4aad0b2beb4c272d4cc3b9ce781dbba6b`. Remote `main` independently rechecked at the same SHA on 2026-09-27 10:16 UTC. The original checkout and its untracked Issue evidence were preserved.
- The Human explicitly approved Slice 2 and decided: byte SHA-256 `assetId` is canonical; `sourcePath` is an optional legacy alias; Current keys/placements are preserved; Registry is travel-slug-scoped and technical only; ADR-0003 and Phase 21 placement contract are amended; no Production schema change in Slice 2. This approval covers local implementation and review, not Production mutation, Preview deployment, PR publication, merge, or baseline adoption.
- Production read-only recheck completed by 2026-09-27 10:20 UTC: target Supabase project `iujasyrvypdcmkmorcud`, database `postgres`, latest migration `20260926_020144_issue140_media_object_key`; Australia Current remains 1 published Memory, 9 published Days, 96 Moments, 186 Placements (177 photo, 9 YouTube), 0 missing moment/placement keys. Across placements, parent gallery/cover, and day hero there are 261 Media references to 260 distinct records (134 aliased, 126 aliasless), with no dangling referenced ID. **One photo placement has a null `media_id`**; the earlier “no missing Media records” aggregate did not assert every photo placement has a relation. This is a Current adoption review item. These were bounded aggregate queries, not a complete export or byte audit.

## Local result

- Added deterministic folder scanner and travel-scoped Git-ignored Registry with exact byte SHA-256, dimensions/MIME, EXIF/IPTC/XMP candidates, duplicate summary, uncertainty queue, aliases and environment locators. It does not infer authored placements or mark locators verified.
- Source v2 accepts hash photo references and legacy path references. Registry resolution requires an environment-specific verified locator with matching byte hash for existing hash Media. Missing/ambiguous identity or path-to-hash key drift yields a read-only conflict and blocks apply. New hash Media creation is deliberately blocked until post-upload locator verification can be made safe; path-only legacy import remains compatible.
- Updated ADR-0003, Phase 21 field contract, template, coverage, SOP, source guidelines, and task-scoped intake skill. No Payload Collection, generated type, or migration changed.

## Verification and remaining gate

- Node 24.21.0: media intake/hash resolver focused test PASS; existing Source v2 parser/reconciliation/local importer test PASS; Next build PASS; `tsc --noEmit --incremental false` PASS; `git diff --check` PASS. No Browser/Preview runtime QA or Production dry-run was authorized for this gate.
- **Next independent gate:** Human review the local Slice 2 diff and decide whether to authorize PR publication or request changes. Slice 3 Current export must account for the photo placement with a null Media relation, original/upload byte verification, reviewed key mapping, and a Source/Base candidate; any Production write remains a separate gate. Existing Australia Current has no accepted v2 Base; no adoption is claimed.
