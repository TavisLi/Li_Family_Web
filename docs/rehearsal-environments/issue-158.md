# Issue #158 semantic consumer replay

`pnpm run rehearse:issue158` is the maintained local/CI entrypoint for the reviewed v12 schema-only baseline and a representative Payload consumer. It runs two fresh disposable databases, verifies the 12-category semantic catalog, executes `reconcileMemoryV2` through the real Payload Local API, records the before-image, checks commit/rollback effects, restores the full synthetic backup, and drops only the databases identified by their owner markers.

## Runtime and target

- Runtime: Node 24.21.0, `pnpm@10.28.0`, PostgreSQL 17.11. The local verification can invoke Node directly; CI installs the pinned package manager.
- Local mode starts its own PostgreSQL 17.11 cluster under an owner-only temporary directory, disables TCP listening, and uses a private Unix socket. It does not read `.env`, `DATABASE_URI`, or Production credentials. Set `ISSUE158_PG_BIN` only to select an installed PostgreSQL 17.11 `bin` directory.
- The runner creates missing synthetic `anon`, `authenticated`, `service_role`, and `supabase_admin` NOLOGIN roles in that owned cluster. It never touches cluster-global roles outside the owned local cluster.
- CI mode requires `ISSUE158_CI_SERVICE=1`, `PGHOST=127.0.0.1`, `PGDATABASE=postgres`, and an inspected service container matching the pinned image digest and the unique loopback port binding. The connected peer and the container bridge address are recorded separately; the container identity is inspected again after connection.
- Payload receives only the generated disposable database and a generated NOSUPERUSER/NOBYPASSRLS role. Email is fail-closed in the rehearsal and object-storage credential variable names are removed before loading Payload config.

Run from the repository root:

```sh
pnpm run test:issue158
pnpm run rehearse:issue158
```

The entrypoint uses native `pg_dump` with a 180-second child deadline and a 2-second table-lock wait. This does not claim that each internal `pg_dump` SQL statement has a 10-second limit. The collector and replay connections retain 10-second statement and 2-second lock limits. Full dump restore runs through bounded `psql` so COPY data and PostgreSQL's paired `\\restrict` markers are handled correctly; timeout-reset statements from the dump are removed before restore.

## Evidence and cleanup

Each run saves a #105 manifest bound to the executor, schema/query/catalog artifacts, runtime dependencies, authorization-source note, and actual mode-0600 before-image. It writes the append-only ledger, checkpoint, acceptance evidence with SHA-256, receipt, and derived `current-state.json`, then reads the bindings back. The Human source is not machine-authenticated: expect `authorization.recordMatches=true` and `sourceNeedsVerification=true` until a reviewer verifies the source note.

The run directory is `.rehearsal-runs/issue158-<uuid>/execution/`. The adjacent `resource-owner/owner.json` identifies the generated database. The cluster cleanup record retains its owner run ID and a hash of its private path; local success requires the database-absent readback, cluster stop, and removal readback. On a CI service, the runner records that the GitHub Actions job owns service teardown. An UNKNOWN cleanup result makes the terminal run BLOCK. Child-process termination alone is not evidence that a remote PostgreSQL backend has stopped.

Keep successful and failed rehearsal directories as historical evidence. They contain synthetic data and private before-images; do not publish the directory or raw backup. Use the compact top-level replay summary to report run IDs, status, receipt hashes, cleanup, and whether GitHub Actions actually ran.

## CI and limits

The disposable CI service uses the same `rehearse:issue158` entrypoint and Docker Official Image `postgres:17.11` multi-platform OCI index digest `sha256:d74eeac9a635390a49bc21bd49fccd973de707e2a53a76ac49b552b8712ec46f` in `.github/workflows/ci.yml`. Platform-specific manifest digests differ; Docker Hub lists the `linux/amd64` manifest separately as `sha256:e31e3d5327d1806f6177827c9710643e4f35f7ab3f14d26d05332753d3e95ee0`. The workflow runs the 15 focused Issue 158 tests, performs two fresh consumer replays, then continues the existing #105 disposable fixtures. Workflow configuration and local PASS do not prove an actual GitHub Actions PASS. Before closing the CI criterion, retain the successful run URL, tested head SHA, and required check result.

This replay proves the reviewed semantic catalog and one representative consumer path only. Migration execution/readiness, legacy parity, physical fingerprint, source-role/RLS parity, platform/collation equivalence, other #134 consumers, Production access, and application are outside this evidence; retain their BLOCK/UNKNOWN states. No Production credential, endpoint, retry/fallback, migration, Gate 1B, publish, merge, or Issue close belongs to this local replay.
