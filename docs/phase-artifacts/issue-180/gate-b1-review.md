# Issue #180 Gate B1 continuation — Human review

2026-10-31 (Asia/Shanghai). Related: #180; same Draft PR #181.

**B1 local implementation / offline checks: PASS. Complete runtime/data acceptance: BLOCK.**
No Production access, credential read, migration execution, deployment, merge or Gate C. No new PR. No run-owned DB/storage resources were created, so resource cleanup is N/A.

## Baseline and authority

- main: `d8139e4561f7c4bb47fdc8d8c0e00e099660c829`; prior PR head: `0804f0662ba83c40bea96a922e907c7d78a840b5`. Both rechecked before publication; branch `codex/phase-180-gate-b1`.
- Work continues in the clean independent checkout `/private/tmp/issue180-gate-b1`. The original checkout and the other chat's managed worktree were not modified. A remote-ref fetch in the original repository did not change its working files or branch.
- The current Human request authorizes local B1 work and updating this same Draft PR, stopping at Human review. It excludes Production, migration execution, deployments, merge and Gate C.
- The accepted Gate A document is published unchanged at [the existing canonical path](../../phase-preparation/travel-atlas-pr03-gate-a-review.md). SHA-256: `8dd974206e964900d442b01340a29be179e2a2b500be822df0e23425e5419396`. Its historical gate restrictions remain historical; this request separately authorizes B1.
- Prior exact-head CI for `0804f06` remains historical PASS for that head only. It is not evidence for this implementation. New-head results are reported in the PR.

## Implemented boundaries

| Boundary | Implementation and offline evidence |
| --- | --- |
| Optional model | Plan sections gain optional ordered `geoStops` / persistent `stopKey`; Memory Moments gain optional geo. Existing location text and ownership remain. Generated types include live/select shapes. Raw stop existence/order, geo/provenance/approval and access epochs are Admin-only. |
| Persistent identity | New rows receive server keys/IDs; existing domain keys and row IDs survive sparse edits and reorder. Duplicate/unknown identities, existing key edits, owner/day rebinding and removal of geo-bearing rows are rejected pending reviewed mapping. New Admin rows with client-generated row IDs are supported. |
| Explicit Admin approval | Admin GET/POST `/:id/geo-review` on Plans and Days. The GET returns a private/no-store revision; POST approve/revoke requires that exact revision, section/day and item key. Approval binds the complete typed owner tuple, both explicit locales, complete geo content, audience and owner/Day access epochs. Source fields and ordinary saves cannot mint approval. Draft approval does not publish a draft. |
| Invalidation | Content changes clear approval; access changes issue a fresh server epoch, so shrinking then reopening audience does not revive a historical approval. Legacy missing epochs are initialized within the reviewed transaction after checking the exact before-image. Restoring a conflicting historical geo approval is rejected; history restore support is not claimed. |
| Concurrency | All three Travel collections lock create/update/delete/restoreVersion before Payload reads Current, including Local API calls with overrideAccess. A shared transaction-scoped **try-lock** rejects busy/missing/expired sessions and non-read-committed isolation. No waiting, retry or adapter fallback. The service checks a fresh all-locale document plus parent revision under that lock. This serializes Travel writes and may return conflicts; real DB behavior remains unverified. |
| Source/Base/Current | `canonicalGeo` requires all content fields and both locale values explicitly; it normalizes field order and rejects unknown fields, source approval and invalid/partial coordinates. The whole group is compared atomically. Missing Source skips; missing/unproven Base preserves; explicit clearing and different dual edits conflict. Unknown CRS may be stored but cannot receive coordinate approval. `0,0` is valid. |
| Atomic writer | The separate controlled `writeTravelGeo` updates a known exact owner across both locales, clears approval, reads content back, then advances only `baseProjection.atlasGeoV1[owner]` in the owning Plan/Memory envelope. It reads Base back before commit, compares non-target owner/parent data, and rolls back on failure. It does not auto-adopt missing Base or create/move legacy items. Before-image and create/update/preserve/conflict/skip/delete categories are explicit; this persisted update path never deletes and returns no creates. New-entry planning is tested in the pure reconciler, not a general creation/import workflow. |
| Legacy writers | v1 Plan/Memory and v2 importer remain fail-closed for geo-bearing Current/Base, including an `atlasGeoV1`-only parent Base. They are not promoted to successful geo round-trip writers. Existing no-geo synthetic import cases continue passing. Admin sparse-edit tests preserve geo, relationships, placements, captions and other locales. |
| API copies | Actual Payload query operations reject non-Admin geo/Base where/sort/count and parent relationship queries; version access is denied. Actual Payload response traversal over synthetic DB results gives identical non-Admin output when hidden geo/Base values change. These tests are not HTTP, GraphQL or DB-policy proof. No Public/Family geo consumer or map integration is enabled by this PR. |
| History | Travel `maxPerDoc` changes from 30 to 0, preventing new review saves from automatically pruning old versions. This retains more history/storage; no existing history is cleaned up. Actual history/restore behavior awaits Gate C. |

## Migration candidate — prepared, never executed

Generated with installed Payload 3.90.2 / pinned adapter and synthetic configuration, with DB connection disabled by Payload's `migrate:create` path and dev schema push disabled. No repository `.env` was loaded. R2 was represented only by synthetic values so type/schema generation retained the existing Media object-key field.

- Candidate: `src/migrations/20261031_052622_issue180_optional_geo.ts` plus generated JSON/index. New nullable columns cover live, locale and version storage; new Plan stop tables have explicit short DB names. No historical drops/backfill appear in up.
- Static review added RLS and revoked PUBLIC/anon/authenticated table and sequence privileges only for the four new stop tables. Existing table policy fidelity remains UNKNOWN. This follows the existing migration security boundary and the [official grants/RLS distinction](https://supabase.com/docs/guides/api/securing-your-api).
- Down locks all affected tables with `ACCESS EXCLUSIVE NOWAIT`, checks every new table and column is empty, and only then drops them in the same SQL batch. If any new content, epoch or version exists, it refuses. This is an empty-new-fields candidate, **not** a recovery plan for populated data. Real migration, lock, rollback and restore behavior are unverified.
- Offline generation exposed an enum/identifier length issue; short enum/table names resolved it. The rejected candidate is retained only in `/private/tmp/issue180-long-identifier-candidate.{ts,json}`, not registered or published. Final generation has no identifier/data-loss warning; it retains the existing no-email-adapter notice.
- #158's narrowed semantic result still does not prove schema fidelity, grants/RLS parity, migration readiness, history or legacy parity.

## Verification and remaining gates

[The machine-readable record](gate-b1-verification.json) binds the checked code and migration to file hashes, Node 24.21.0, Payload 3.90.2 and the unchanged lockfile. The shell's default pnpm was 11; its auto-install attempt refused the shared node_modules symlink before changing it. Verification therefore used installed entrypoints directly with Node 24; pnpm 10.28.0 remains the repository/CI pin, not a newly verified local runner.

- PASS: travel offline allowlist, 51 files; subsequent changed-boundary tests, 6 files; final build (includes lint/type validation), subsequent standalone TypeScript; focused lint; static migration checks; diff/secret scan. Build retains the Next.js edge-runtime static-generation notice, and lint reports its existing deprecation notice.
- PASS within synthetic boundaries: stale/replayed approval writes zero records; source cannot approve; both locales and full owner/audience binding; missing Base/Source; atomic geo conflict; content and Base read-back failure rollback; non-target owner/parent preservation; raw API masking and query rejection. Independent static review found and rechecked fixes for Base detection, concurrent down and Admin new-row compatibility.
- BLOCK / UNKNOWN: real Payload/DB legacy and Admin round-trips, versions/pruning/restore evidence, actual competing transactions, HTTP/GraphQL/Local API integration and PostgREST policy parity. An empty/all-null geo group may conservatively block a legacy path; without real DB round-trips this must not be called legacy parity PASS. Exact source identity mapping, initial Base adoption and new-entry import remain explicitly reviewed prerequisites, not inferred from empty fields or legacy generators.
- Gate C has not started. It needs separate authorization and an owner-marked, isolated schema-fidelity baseline under #158/#161/#162/#105, followed by real migration up/empty down, transactional read-back, legacy/API and recovery/history verification. No Production fallback.

**Unique next gate: Human review of this Draft PR and its remaining BLOCK/UNKNOWN entries.** Do not merge, deploy or begin Gate C from local or CI PASS. No new chat is required for this checkpoint.
