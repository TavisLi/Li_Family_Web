# Issue #105 — Slice 3 local review

Slice 3 adds compact inspection, a Preview QA request guard/decision contract, and a reproducible output comparison. This review uses the accepted Slice 1–2 run contract and recorded disposable evidence. No Preview deployment, Browser session, or Production access occurred.

## Agent output and approval package

`node src/scripts/run-agent-summary.mjs <run-directory> <repository-root> state` verifies manifest file bytes and evidence bytes, derives state from the ledger, and prints one JSON line with the latest stage/status, terminal exit, commit/restore state, concrete blocker, evidence path, approval reasons, and invalidated evidence. Passing a previous JSON summary emits nothing if state is unchanged. Raw checkpoints and responses remain on disk. The `approval` mode derives a proposed scope/runtime/artifact hash package from the verified manifest. It does not create authority: a matching record still requires independent verification of its human source. Mutation is never retried automatically; `readOnlyRetryDecision` permits only a transient read failure after source verification, within a finite attempt envelope, and never after an `UNKNOWN` outcome.

The checked-in Slice 2 normal run prints `PASS`, `COMMITTED`, `RESTORED`, terminal exit `0`, and `NO_APPROVAL`. Its source is `slice-2-example/run/`. Agents should wait on one live session until terminal exit and report only changed state; the local replay below has no live polling.

## GET-only Preview QA reuse contract

`getOnlyRouteGuard` is installed before Browser navigation. It records actual request methods and paths, permits only configured GET routes/assets, and records blocked non-GET, Admin/API, other-origin, and out-of-scope requests. `savePreviewQaCapture` saves an allowlisted record without credentials or query strings. `previewQaDecision` requires verified evidence bytes and Browser capture provenance, an exact deployment ID/source commit, the authenticated entry fingerprint, rendered desktop/mobile route results, zero console/runtime errors, and observed GET requests. Any blocked request makes the QA result `BLOCK`. `READY` and HTTP 200 alone cannot pass. The existing Slice 1 dependency comparison invalidates QA when commit, deployment, auth entry, routes, data, or schema changes; unrelated executor changes do not invalidate it. Tests use a mock Browser route adapter and fingerprints; they are **contract tests, not real Preview QA evidence**.

Playbook §11.1 still governs any later branch-scoped Preview connection to a Production database. That path requires its own Human approval, exact branch-scoped environment read-back, and GET-only Browser evidence. This slice neither uses nor grants that exception.

## Same-input output replay

`node src/scripts/run-efficiency-replay.mjs <new-report-path>` rebuilds [the report](./slice-3-efficiency-replay.json) from the recorded disposable normal run and modeled fault receipts matching the focused fault tests: warning, silent exit, delayed timeout, oversized response, cancellation, connection drop, rollback failure, and commit acknowledgment loss. Both renderers receive the same scenario receipt and checkpoint prefix. The modeled old renderer exposes the full manifest/checkpoints/receipt; the new renderer emits only terminal state and evidence path. Every fault remains `BLOCK` or `UNKNOWN` in the replay.

For nine scenarios, modeled model-visible output falls from **175,763 to 1,686 bytes (99.04%)**. The report records **9 tool calls, 0 empty polls, and 0 approval rounds** for each renderer, plus per-scenario replay compute elapsed time. The recorded normal supervisor elapsed time is 1,203 ms; fault run elapsed times were not captured. No token telemetry exists, so byte count is a proxy, and the old renderer is a reconstructed workflow rather than a measured historical #101 session. This proves the compact output format's byte reduction on identical replay inputs, not a measured improvement in actual agent tokens, polls, approvals, or Production execution time.

## Open gates

- The private #101 backup/full Production-shaped restore and all real non-target data verification remain unverified as noted in Slice 2.
- No real Browser/Preview QA capture exists for this branch; QA reuse and GET-only enforcement are locally tested contracts only.
- The efficiency baseline is modeled; the Issue-wide live old-versus-new efficiency claim remains unverified without comparable telemetry.
- Merge, deployment, Production access/mutation, and Issue closure require separate Human review and authorization.
