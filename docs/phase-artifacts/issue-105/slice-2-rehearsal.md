# Issue #105 — Slice 2 disposable rehearsal

Slice 2 adds a bounded executor and a local PostgreSQL rehearsal on top of the accepted Slice 1 manifest, ledger, current-state, and authorization contract. This artifact records one completed **disposable** run. It is not Production approval, a Production preflight, or a deployment.

## Bound execution

- `src/scripts/run-executor.mjs` is the shared execution core. The rehearsal entrypoint is `run-executor-session.mjs`, which starts one child session, waits for its actual terminal exit, and records a fallback receipt for silent/bootstrap/signal/deadline failure. No automatic mutation retry occurs.
- The manifest binds Node/pnpm, bootstrap and schema-push setting, target, executor, SQL plan, backup bytes, dependencies, scope, stop conditions, and local action. The child enforces a loopback `issue105` target and `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false` before connecting. This example has no human Production approval record; `current-state.json` correctly says `NO_APPROVAL`.
- One PostgreSQL client issues queries sequentially. Keyset reads cover target and non-target relation rows, canonical and legacy content, and catalog metadata. Each response has a 20-row and 65,536-byte *actual serialized response* cap. The run has a 150-query, 160-round-trip, and 120-second budget, with distinct 15-second statement, 2-second lock, and 20-second client-response timeouts. The full settings are in `slice-2-example/limits.json`.
- Preflight compares all discovered target rows with the backup, including added rows outside its IDs, missing rows, path changes, other content changes, non-target rows, canonical content, and schema/security metadata. The backup file's actual bytes are SHA-256 bound by the manifest; its canonical snapshot has a separate content checksum.
- The local apply deletes exact backed-up relation rows in batches, drops the legacy table with `RESTRICT`, and reads back the result on a fresh connection. The disposable restore recreates its table, foreign key, indexes, identity sequence value, RLS, policy, grant, content rows, and deleted relations; a complete snapshot comparison follows. `COMMIT` acknowledgement loss and uncertain rollback/restore are reported as `UNKNOWN`.

## Local evidence

The fixture is a production-shaped **subset** built in a disposable PostgreSQL 17 database: two relation tables, a legacy highlights table, canonical travel records, and real PostgreSQL catalog metadata. Its records are synthetic. `slice-2-example/backup.json` was captured from that database before the run. The final session `issue-105-slice2-review:9995` is saved in `slice-2-example/run/` with manifest, checkpoints, ledger, receipt, current state, and actual terminal exit. Its receipt reports `PASS`, 62 queries, 64 round trips, 38,710 serialized response bytes, `COMMITTED`, then `RESTORED`; the supervisor observed exit code 0. The restored snapshot checksum matched the pre-run backup.

Focused tests cover bounded delayed responses, oversized rows/bytes, warning, silent exit, bootstrap failure, cancellation, connection drop, statement/lock/client/full-run timeouts, query/round-trip budgets, signal, rollback failure, commit acknowledgement loss, restore failure, backup checksum, and manifest binding. PostgreSQL integration tests cover normal apply/read-back/restore and actual added/missing/path/non-target/canonical/index/RLS drift. The latest runs passed 10/10 focused tests and 10/10 PostgreSQL tests.

## Remaining gate

The private #101 backup and its full Production-shaped data/metadata were not available to this workspace. The checked-in fixture proves the executor's behavior against actual PostgreSQL catalog metadata, but **does not satisfy** the Issue's requirement to restore the actual backup and protect all real Production non-target data. That gate remains open for a separately authorized, isolated drill with the private backup. No Production connection, mutation, Preview deployment, merge, or Slice 3 work occurred.
