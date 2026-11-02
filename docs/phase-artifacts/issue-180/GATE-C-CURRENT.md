# Issue #180 Gate C — accepted synthetic result

**Current: r27 isolated synthetic Gate C PASS; PR #181 remains Draft.** Human accepted this result and the scoped B1 decisions on 2026-11-02. Production readiness is UNKNOWN. Earlier r1–r26 BLOCK/UNKNOWN reports remain historical evidence and do not describe the current synthetic result.

## Exact evidence

- Tested baseline HEAD: `ee0130375bca35306323f63498f3e74dd17fed30`, with separately bound working-tree code; it was not a clean commit of the final code.
- Run: `issue180-f5dc1b3f34b80b5f84aae12ef6c5c503`.
- Canonical manifest SHA-256: `080a0efa31c9815bcf27cde00383efe5af8dce0cac0b750576c82a12fa85001c`.
- Raw manifest SHA-256: `6e06167bb2aec99ebd1bd2a3b4c9078f828591f66948b7ef58c887d52fd4a82a`.
- Terminal receipt: `e2a4e034bb2540059754491512e3121b235c2555b13cb5256320d6b0f310bc05`; terminal ledger: `38e3b0dfd994cfaca1fcaec08210cd7fe0d15f9ce2989ac6559c15fc06e7772f`.
- 20/20 terminal cases PASS, zero warnings, one invocation and no retry. Main and both controlled failure/abort probes independently verified database/server/directory/process/PID/socket absence. Probe BLOCK outcomes were expected and are not matrix failures.
- Restore compared all existing logical catalog properties and live-column relative order, full physical row contents and retained history. It recorded 24 physical ordinal differences; absolute physical column ordinals were not required to match. The separately saved restore-DB SQL count returned `0`.

[Sanitized evidence index](r27-evidence-summary.json) retains the result and artifact hashes. [Source-byte mapping](r27-source-byte-map.json) compares published repository files with the historical manifest bindings. These summarize an existing run; neither grants execution authority nor claims that a later commit was run under r27.

Full immutable receipts, ledger, manifests, approval/read-back records and original preparation/diagnosis history remain in the maintainer's original `.issue180-gate-c-work` evidence archive under the run ID above. They are excluded from this PR. The original archive is not cleaned, rewritten or replaced by this publication index. Future execution requires a fresh exact manifest/approval; r27 approval is consumed.

## Accepted product decisions

- **Memory import is V2-only.** Memory V1 is retired, with refusal before store I/O; this is a deliberate compatibility change, not successful V1 compatibility. Plan legacy import remains supported by `--travel-only --plans-only`. Existing Memory data/Base/identities/history are preserved. New V2 Media intake/upload remains separately gated.
- **Shared transaction try-lock fail-fast is accepted.** All three Travel collections share the lock for create/update/delete/restoreVersion. Busy unrelated Travel edits and autosave can be rejected. Reads do not acquire this lock. This accepts the current safety/availability tradeoff, without asserting real-traffic conflict rates or Admin UX readiness.
- **`maxPerDoc=0` is conditionally accepted for current history preservation.** Plan/Memory/Day automatic version pruning remains disabled. Long-term storage/backup cost and retention policy remain follow-up acceptance; pruning/deletion has no authority from this decision.

## Remaining acceptance and publication limits

[Follow-ups](pr181-follow-ups.md) retain Admin unsaved-state/edit preservation, history capacity/restore cost and Production fidelity. They do not block narrow Draft PR publication; their completion must not be inferred from synthetic PASS or CI.

The new published head must receive applicable CI. Historical r27 evidence is reusable only for identical bound source bytes and its original scope. Portable regressions run in the existing offline CI allowlist. Machine/runtime-bound preparation/admission tests remain local verification, not an automatically authorized DB rehearsal.

No Production reads/writes, Production migration, deployment, Preview runtime QA, merge/release or Issue #180 closeout is authorized by this publication. Skipped CI jobs are not PASS.

## Publication validation

The isolated publication checkout passed all 99 files in the existing offline CI allowlist (68 Travel + 31 remaining), 10 CI planning/governance tests, lint, build and subsequent `tsc --noEmit`. Payload type generation with synthetic storage configuration produced no type diff. No database or Gate C run was performed for publication. The existing Phase 21 seed-safety entry now delegates to the behavioral Memory V1 retirement regressions instead of asserting the removed legacy child-sync implementation.

All 115 published repository file bindings in the r27 source-byte map were rechecked. Publication-only documentation, the CI test allowlist and the updated legacy test entry are listed separately; new-head CI is separate from the historical r27 execution.
