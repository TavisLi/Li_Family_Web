---
name: travel-memory-media-intake
description: Intake or adopt Travel Memory photos with SHA-256 identity and a travel-scoped technical Media Registry. Use for photo-folder scans, hash resolution, and Current media adoption; not for general UI or legacy seed edits.
---

# Travel Memory media intake

Read the [Source v2 template](../../../docs/templates/travel-memory-source-template.md) and [SOP](../../../docs/travel-memory-source-sop.md) for authoring boundaries. Source v2 owns Day, Moment, placement, caption, and order; the Registry only records technical facts and environment-scoped Media locators.

For an unsorted photo folder, run `node --import tsx src/scripts/travel-memory-media-intake.ts --slug <travel-slug> --input <folder>` from the repository root. Read `.travel-media-staging/<slug>/summary.json` and `review-queue.json` first; inspect individual images only to resolve specific ambiguity. The staging directory is Git ignored. Scanner output is deterministic and does not publish or upload media.

Use `assetId = sha256:<64 lowercase hex>` over exact source bytes. `sourcePath` is an optional old alias. Capture times without a timezone, GPS, and embedded captions are evidence with uncertainty, never authored placement decisions. If only a Production upload is retrievable, identify its byte provenance rather than claiming it is the unavailable original.

For Current adoption, preserve every existing `momentKey`, `placementKey`, placement relation, caption, and order. Require a reviewed mapping for unmatched keys. Missing or duplicate hashes, alias collisions, uncertain provenance, or unverified environment Media locators block apply. Keep Production reads, schema changes, media writes, content adoption, and publication at their separate approval gates.

## Reviewed import continuation

Use `src/scripts/prepare-travel-memory-review.mjs --config <local-config.json>` to build a local HTML workbench from explicitly saved Current/English, Source, existing/scanned Registry and local thumbnails. Read summary/ambiguities first. Metadata and perceptual similarity propose decisions; preserve every old occurrence, Media ID, key, null relation and nonempty other-language value. Record explicit moves/removals/caption clearing; omission alone never authorizes deletion. Decision export/import must bind batch, Source and model hashes.

After content acceptance, run `src/scripts/prepare-travel-memory-import.mjs <local-config.json>` into a fresh directory. Freeze Source/model hashes, decisions, Registry and exact upload bytes. The outputs are preparation, not authority. Reuse successful receipts and verified locators; unknown writes must be reconciled before any new attempt. The daily operation is currently scoped to Memory 2/nine Days; do not infer a generic Production importer or recovery capability.

Use `pnpm run test:issue134` for public synthetic verification. The separate disposable test requires an explicit local Docker UNIX socket and fresh output; it owns and removes only its temporary pinned-PG container. Keep real credentials, photos, Source, locators, approvals and raw execution/Browser evidence out of code PRs. Follow the [delivery review](../../../docs/phase-artifacts/issue-134/delivery-review-20261030.md) for verification limits and the existing #105 execution owner; never create another executor or replay a consumed manifest.

HEIC handling: scanner metadata/hash success does not prove HEVC pixel decoding. Where the installed decoder lacks it, obtain the batch's explicit conversion decision, retain the original, scan the converted JPEG as a different assetId and bind derivedFrom in the technical Registry before review/upload preparation. Never rename bytes or claim the derivative is the original. `pnpm run test:issue134:heic` is a separate macOS synthetic ImageIO proof, not remote codec verification.
