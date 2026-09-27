---
status: accepted
date: 2026-06-20
last-reviewed: 2026-09-27
supersedes: null
---

# Canonical travel slugs own travel source; SHA-256 owns media identity

Each travel project's canonical slug is the identity shared by the `/travel/[slug]` route, the runtime project record, and its travel-local source namespace. A photo's canonical `assetId` is `sha256:<64 lowercase hex characters>` of the exact source-file bytes. It is independent of slug, path, filename, Payload ID, R2 key, and URL. A derivative with changed bytes has its own `assetId` and may record `derivedFrom`; a Production upload hash must retain its byte provenance and cannot be presented as an unavailable camera original.

## Consequences

Every travel catalog entry and Travel Memory Source v2 file maps to a stable canonical slug. The travel-slug-scoped Media Registry contains technical identity and locator metadata only. Source v2 owns authored Day, Moment, placement, caption, and order. `sourcePath` remains an optional backward-compatible alias; legacy path-based manifests and seed behavior continue until individually adopted. A registry alias or Payload ID alone does not prove byte identity.

Existing Current `momentKey`, `placementKey`, relationships, and placement content must survive adoption. An exact existing relationship may be reused; unmatched keys need an explicit reviewed mapping. Omission cannot be used to regenerate keys or remove Current placements. Slice 2 makes no Production schema change; a future `Media.assetId` field or migration needs separate review and approval.
