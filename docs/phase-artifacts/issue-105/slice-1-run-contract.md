# Issue #105 — Slice 1 run contract

Base: `main` at `da75f504273add4f549a6e3383e6746e42e2ded4`. This slice defines local evidence bookkeeping only. It does not run a preflight, a mutation, or Preview QA.

## Files for one run

Keep one run directory with `manifest.json`, `ledger.json`, `evidence.json`, and `dependencies.json`. `approval.json` exists only after a separate human decision. `current-state.json` is generated; never edit it by hand. Raw receipts and query output may live beside these files, with their paths referenced from ledger events.

The checked-in [local example](./slice-1-example/manifest.json) is replayable with the inspector. Its ledger has no execution events and its current-state correctly says `PENDING` / `NO_APPROVAL`; it is an example of the bookkeeping contract, not an approved operation.

The manifest is the immutable proposal for one run. Its required fields are:

| Field | Meaning |
| --- | --- |
| `version`, `runId`, `environment`, `target` | Contract version and exact target |
| `runtime.node`, `runtime.pnpm`, `runtime.bootstrap.entrypoint`, `runtime.bootstrap.envNames`, `runtime.schemaPush` | Runtime and bootstrap; env **names only**, with schema push `disabled` |
| `scope.include`, `scope.exclude`, `scope.baseline` | Exact affected and protected scope plus current baseline identity |
| `scope.expectedEffects`, `scope.stopConditions` | Intended side effects and fail closed conditions |
| `artifacts.executor`, `artifacts.sql[]`, `artifacts.backup`, `artifacts.dependencies[]` | Repository relative paths and SHA-256 of actual file bytes; dependencies include `package.json` and `pnpm-lock.yaml`; `backup` may be `null` for nonmutating runs |
| `approval.action`, `approval.allowed`, `approval.excluded`, `approval.validFrom`, `approval.validUntil` | Proposed authorization envelope, not an approval |

An approval record names a human decision source and repeats the manifest hash, action, environment, target, included scope, baseline, stop conditions and validity period. The inspector compares every field, checks revocation and time, and gives specific mismatch reasons. `recordMatches: true` means the record is internally consistent; `sourceNeedsVerification: true` means a human or trusted external system must still confirm that the cited decision exists and covers the action. A file created by the agent never grants itself Production authority. An absent record returns `NO_APPROVAL`. A changed manifest requires new approval; a matching, live, unrevoked approval can be reused after its source is confirmed.

The ledger is `{ "version": 1, "runId": "...", "manifestSha256": "...", "events": [...] }`. Each event has `sequence`, ISO `at`, `stage`, `status` (`PENDING`, `PASS`, `BLOCK`, or `UNKNOWN`) and `evidencePath`. Sequence starts at 1 and stays contiguous. `BLOCK` and `UNKNOWN` are terminal for that run. The generated current-state shows the latest stage/status, last evidence path, approval match, and each evidence dependency decision. Historical raw evidence remains in its original file; the summary is the recovery entry point.

## Evidence invalidation

Each item in `evidence.json` has `kind`, `status`, `path`, `sha256`, and `dependsOn`. The inspector verifies the evidence file's actual bytes. `dependencies.json` holds the corresponding current fingerprints. Missing or changed dependencies invalidate the evidence. Unrelated fingerprints do not.

| Evidence kind | Required fingerprints |
| --- | --- |
| `rehearsal` | manifest, executor, SQL, backup, schema |
| `preflight` | manifest, executor, SQL, backup, schema, data |
| `preview-qa` | commit, deployment, authentication entry, routes, data, schema |

`data` and `schema` must identify the actual inspected snapshot or metadata, not a generic environment label. Preview evidence is tied to the exact deployment and authenticated route entry. This slice only evaluates fingerprints; the executor, collection of trusted fingerprints, complete restore/drift tests, GET-only method evidence, and receipt generation belong to Slices 2–3. A PASS here does not imply those later gates passed.

Run the local inspector with:

```sh
node src/scripts/run-contract-inspect.mjs <run-directory> <repository-root>
```

It verifies the actual Node version, the `packageManager` version, and each listed file's bytes before replacing `current-state.json`. On missing files, changed bytes, invalid ledger, or malformed inputs, it exits without updating that summary. Keep the failed command output as evidence and treat any prior summary as stale. The inspector makes no network or database connection.

## Slice 1 verification and boundary

Focused tests cover actual backup bytes, approval reuse/invalidation, relevant evidence changes, and terminal `UNKNOWN`. No Production inventory or approval was obtained for #105 in this slice. Slices 2–3 and the Issue-wide acceptance criteria remain open; this document is not a Production approval package.
