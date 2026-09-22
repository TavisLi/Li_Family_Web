# Issue #126 — Payload Local API lifecycle

## Scope and baseline

- Baseline: latest `origin/main` at `35c072237a2646a1ebe2403c8278b8544b368dae`.
- Runtime: repository-pinned Node `24.21.0`, pnpm `10.28.0`, Payload packages `3.85.1`.
- Data boundary: retained disposable Docker PostgreSQL fixture on `127.0.0.1:55419`; schema push was disabled. No Preview or Production connection, migration, content write, deployment, or setting change was used.

## Reproduction and root cause

The pre-fix smoke initialized Payload, performed a representative `users` Local API read, awaited `payload.destroy()`, and sampled the event loop. The Local API assertion passed, but the process stayed alive. Immediately after `payload.destroy()`:

- PostgreSQL pool: `totalCount=2`, `idleCount=1`, `ended=false`.
- Active resources still included PostgreSQL TCP/TLS sockets and a pool timeout.
- `pool.end()` also waited indefinitely because one client remained checked out.

The same full config with `disableDBConnect: true` exited naturally, narrowing the leak to the PostgreSQL adapter lifecycle rather than the Payload config, Lexical, R2/S3 plugin, HTTP server, file watcher, or test runner.

`@payloadcms/db-postgres@3.85.1` checks out a client in `connectWithReconnect()` to verify connectivity and attach an error listener, but does not release it. Payload upstream independently identified the same leak in [payloadcms/payload#15674](https://github.com/payloadcms/payload/issues/15674) and merged the one-line `result.release()` correction in [payloadcms/payload#17831](https://github.com/payloadcms/payload/pull/17831). The upstream explanation also establishes why ending the pool inside `payload.destroy()` is incorrect: Payload reuses that pool during development hot reload.

## Fix and cleanup ownership

The repository keeps its existing Payload `3.85.1` dependency set and applies the upstream `result.release()` correction through pnpm's checked-in patch mechanism. No dependency or framework version changed.

The short-lived smoke command owns final process cleanup in this order:

1. Complete the Local API assertion.
2. Await `payload.destroy()` so Payload stops its own crons and clears adapter lifecycle state.
3. Await `pool.end()` so the command closes its process-scoped PostgreSQL pool.
4. Return naturally with Node's event loop empty.

The command has no `process.exit()`, interval, sleep, or timeout-based success path. It requires an explicit disposable-local opt-in, accepts only loopback database hosts, requires `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`, and runs with `NODE_ENV=production` so Payload does not auto-generate tracked type files during the smoke.

## Validation

- Pre-fix reproduction: Local API assertion PASS; destroy completed; process remained alive and required manual interruption.
- Minimal no-DB case: natural exit 0, confirming database access is required for the hang.
- Node 24.21.0 corrected smoke: 3 consecutive independent runs, all assertion/cleanup PASS and natural exit 0.
- Node 20.20.2 parity: corrected smoke PASS and natural exit 0; the defect and correction are not Node 24-specific.
- Lifecycle package regression test: PASS; verifies the pinned patch, cleanup order, and absence of forced exit/timer workarounds.
- Fresh `pnpm install --frozen-lockfile`: PASS; the checked-in adapter patch reapplied to a recreated `node_modules`.
- Repository tests under Node 24.21.0: 60 of 61 files PASS. The remaining frozen `phase21-c0-package.test.mjs` intentionally blocks any current runtime/package/lockfile delta from its historical Node 20 execution manifest; it is not weakened or changed by #126.
- `pnpm run lint`: PASS with no warnings or errors.
- `pnpm run build`: PASS.
- Post-build `pnpm exec tsc --noEmit`: PASS.
- `git diff --check`: PASS.

## Remaining lifecycle boundary

The patch mirrors the merged upstream correction for the exact pinned adapter version. When Payload is upgraded later, remove the patch only after inspecting the installed adapter source and rerunning this real Local API smoke; the existence of a newer package version alone is not evidence that the project no longer needs the backport.
