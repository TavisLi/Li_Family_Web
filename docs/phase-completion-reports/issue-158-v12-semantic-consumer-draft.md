# Issue #158 Completion Report — narrowed semantic consumer acceptance

Report date: 2026-10-16
Status: **Local implementation and two-run acceptance PASS; Human review required. Actual CI, publication, and Issue close remain pending.**

## 1. Accepted delivery scope

This addendum implements the accepted narrowed contract: reusable v12 semantic baseline verification, one representative Payload consumer replay through the same entrypoint, #105 artifact integration, CI replay configuration, and operating instructions. It does not claim the original full-fidelity scope is complete.

## 2. Delivered implementation

- Added a maintained Issue 158 replay entrypoint that supports a private PostgreSQL 17.11 Unix-socket cluster locally and an inspected, digest-pinned GitHub Actions service in CI.
- Verified the 12-category semantic catalog before creating consumer fixtures. The verified schema-only baseline has zero migration rows; no migration was executed. The `public` schema `USAGE` restore supplement matches the retained v12 semantic evidence.
- Created two fresh disposable databases and called `reconcileMemoryV2` through the real Payload Local API under a generated NOSUPERUSER/NOBYPASSRLS role. The only changed tables were `travel_memory_days`, `travel_memory_days_locales`, `_travel_memory_days_v`, and `_travel_memory_days_v_locales`; one version row was added. The English value and sentinel day remained unchanged.
- Verified an external transaction observer sees no uncommitted change, rollback restores row sets, commit produces the expected localized effect, and the synthetic `pg_dump` before-image restores 125 public table row sets plus sequence state. RLS flags, session bounds, and empty migration state were read back.
- Bound the actual run manifest to the schema/catalog bundle, executor, dependencies, source note, and mode-0600 backup. The #105 ledger, evidence hash, receipt, and derived current-state were verified against the same manifest hash. Cleanup UNKNOWN fails closed.
- Configured the CI service to run the same entrypoint, pinned Docker Official Image `postgres:17.11` to multi-platform OCI index digest `sha256:d74eeac9a635390a49bc21bd49fccd973de707e2a53a76ac49b552b8712ec46f`, and documented local/CI operation and limitations. The `linux/amd64` platform manifest digest is `sha256:e31e3d5327d1806f6177827c9710643e4f35f7ab3f14d26d05332753d3e95ee0`; it is distinct from the index digest [per Docker Hub](https://hub.docker.com/layers/library/postgres/17.11/images/sha256-e31e3d5327d1806f6177827c9710643e4f35f7ab3f14d26d05332753d3e95ee0?tab=layers).

## 3. Exact two-run evidence

Both generations passed semantic baseline, consumer, rollback, full restore, #105 artifact read-back, and owned database cleanup. Both report zero Production connections and no retry.

| Run | Manifest SHA-256 | Receipt SHA-256 | Read-back |
| --- | --- | --- | --- |
| `issue158-2cc8348a-fc77-416a-a561-037a39e90e77` | `a54e142633f36c95ab5bc7c6be64d5af8ff908762999fe1be9ebc6a4f86ec5a6` | `7d50729603110b05579e862b01dc5c08e479b19c3b14639bb9e72db32c2223de` | PASS; database absent; receipt/evidence valid |
| `issue158-ec3b1409-cc5e-4a89-b719-3d8aa001b253` | `ae282dbeca8974c3f324575f1d9101e35a12ab344091e3cc570b768073c61f86` | `9d4bf29b0b8656881d3a6b2349e63a80bee3f79d3abb85fa971bfcbece6db0ee` | PASS; database absent; receipt/evidence valid |

The two mode-0600 backups were 466,088 and 466,086 bytes. Private PostgreSQL cluster owner ID `52adaf20-e3c4-49a9-8f66-ecb27aba9e0e` was stopped and removed; path hash `6db314cde6942b858b29e969b09b178d2af689e16d8ff7b2c17ad83f066fba4f` is recorded in both cleanup records. Every failed local run directory remains preserved as historical evidence.

## 4. #105 authorization source

The local manifests record the current user's instruction as the authorization source and bind the decision fields to each run. This review read each run's `authorization-source.json`, manifest, receipt, and current-state individually and compared the recorded action, target, scope, baseline, exclusions, and stop conditions with the direct 2026-10-16 user instruction. Both records faithfully match the approved local implementation, two isolated replays, and owned-resource cleanup; they exclude Production, migration, merge, release, and Issue close. Both authorization-source files have SHA-256 `0b116199f0b446f0e194be731d24c3c11935bddfa5a4faef1f6fefca9aee75c3`, and each manifest binds that exact source file hash. The ledger timestamps fall within each manifest's authorization window (run 1 `06:48:18.719Z–06:48:20.792Z`; run 2 `06:48:20.005Z–06:48:20.795Z`). Run 1 current-state PASS binds manifest `a54e142633f36c95ab5bc7c6be64d5af8ff908762999fe1be9ebc6a4f86ec5a6`; run 2 current-state PASS binds manifest `ae282dbeca8974c3f324575f1d9101e35a12ab344091e3cc570b768073c61f86`. Both report `authorization.recordMatches=true`, `sourceNeedsVerification=true`, and valid PASS evidence. The machine flag remains true because the source is not machine-authenticated; no receipt or historical record was edited.

## 5. Validation

| Check | Result |
| --- | --- |
| `node --test src/scripts/issue158/*.test.mjs` and `scripts/ci/plan.test.mjs` | 22/22 PASS |
| `node --import tsx src/scripts/issue158/replay.mjs` | Two fresh local database generations PASS |
| Baseline mapping | PostgreSQL 17.11; 12/12 catalog categories match; DDL SHA-256 `3af5760e57305577b5ed67d0a55159b781b63214453d94d3b0df7bb95581c8b0` |
| Consumer effects | Expected four-table footprint; one version row; localized update PASS; English and sentinel unchanged |
| Rollback and full backup restore | Row sets, sequence states, RLS flags, and session bounds PASS |
| Cleanup | Both DB absent read-backs PASS; private cluster stopped and removed; owner ID/path hash recorded |
| Actual GitHub Actions CI | Not run; workflow configuration is not a CI PASS |

The local system resolves pnpm 11.25.0 while the repository pins 10.28.0. Focused checks used Node 24.21.0 directly; no install or lockfile change was made. No application UI/runtime source changed, so build, TypeScript, and Browser checks were not applicable to this local rehearsal code path.

## 6. CI and publishable diff

The workflow routes changed Issue 158 replay/baseline paths into the disposable job, validates the exact loopback-published container and official multi-platform index digest, runs focused tests, then invokes the same replay entrypoint. A successful required GitHub Actions result on the exact review head is still required to prove the clean-checkout CI path.

The isolated review branch is based on `main` at `154551800734b4c2067f66f183d4596f4e8b391f` and contains only the scoped Issue 158 files listed above. The original shared checkout's unrelated #105/#134 changes and private `.rehearsal-runs` directory were excluded; no backup or raw run evidence is included. At this report revision the branch is committed locally, while push, PR creation, and exact-head GitHub Actions remain pending.

## 7. Preserved limitations

- Migration readiness/execution, legacy parity, and physical fingerprint remain BLOCK.
- Platform/collation equivalence and v11 transport root cause remain UNKNOWN.
- This represents one of five #134 consumer operation classes; the others remain deferred.
- The source text and scope match the direct user instruction; the machine `sourceNeedsVerification=true` flag remains intact because the source is not machine-authenticated.
- Actual clean-checkout CI has not run. The pinned image digest and workflow configuration do not substitute for that run.
- The prior v12 Production approval is consumed. This work read no Production credential, made no Production connection or mutation, and did not enter Gate 1B.

## 8. Rollback and closeout

No Production data or application deployment changed. Both synthetic databases and the owned local cluster were removed after read-back; private evidence directories remain in the original checkout. #158 remains open. This report revision does not claim push, PR, actual CI, merge, live Issue edits, Issue close, or full-scope completion.
