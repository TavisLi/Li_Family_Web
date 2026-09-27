---
name: travel-memory-media-intake
description: Intake or adopt Travel Memory photos with SHA-256 identity and a travel-scoped technical Media Registry. Use for photo-folder scans, hash resolution, and Current media adoption; not for general UI or legacy seed edits.
---

# Travel Memory media intake

Read the [Source v2 template](../../../docs/templates/travel-memory-source-template.md) and [SOP](../../../docs/travel-memory-source-sop.md) for authoring boundaries. Source v2 owns Day, Moment, placement, caption, and order; the Registry only records technical facts and environment-scoped Media locators.

For an unsorted photo folder, run `node --import tsx src/scripts/travel-memory-media-intake.ts --slug <travel-slug> --input <folder>` from the repository root. Read `.travel-media-staging/<slug>/summary.json` and `review-queue.json` first; inspect individual images only to resolve specific ambiguity. The staging directory is Git ignored. Scanner output is deterministic and does not publish or upload media.

Use `assetId = sha256:<64 lowercase hex>` over exact source bytes. `sourcePath` is an optional old alias. Capture times without a timezone, GPS, and embedded captions are evidence with uncertainty, never authored placement decisions. If only a Production upload is retrievable, identify its byte provenance rather than claiming it is the unavailable original.

For Current adoption, preserve every existing `momentKey`, `placementKey`, placement relation, caption, and order. Require a reviewed mapping for unmatched keys. Missing or duplicate hashes, alias collisions, uncertain provenance, or unverified environment Media locators block apply. Keep Production reads, schema changes, media writes, content adoption, and publication at their separate approval gates.
