# PR #140 Payload 3.90.1 local rehearsal

Baseline: `main` `209d25b48d186ce1885666dc390d26afd9017090`. This is a local, synthetic PostgreSQL 17 rehearsal for Human review. No Production database was accessed or changed.

## Dependency and schema review

- `payload`, `@payloadcms/next`, and `@payloadcms/db-postgres` resolve to 3.90.1. The adapter's published peer requires Payload 3.90.1. The existing one-line bootstrap-client release patch was carried to the 3.90.1 adapter and verified in the installed `dist/connect.js`; the local lifecycle package test still asserts it.
- `@payloadcms/next@3.90.1` rejects Next 15.5.25 in its peer range. PR #140 therefore retains the current-main Next and `eslint-config-next` 15.4.11. Pinned Node 24.21.0 / pnpm 10.28.0 frozen install produced no peer warning.
- Generated types add only `resetPasswordRequestedAt` to `User` and `UsersSelect`. The generated schema snapshot differs from the previous committed snapshot only by `public.users.reset_password_requested_at` and the snapshot ID: both have 125 tables and 30 enums.
- Migration `20260925_042448_issue140_dependency_upgrade` adds nullable `timestamp(3) with time zone` on `users`; its down drops that column. Reviewed migration file SHA-256: `3f91ed61b332f5f614d9d6cefec8741c314f6fd7d165ae854fd58b9b0b0d122d`. The down would discard non-null values if used after the new field receives data, so Production rollback needs a separate decision.

## Disposable PostgreSQL rehearsal

A new loopback-only PostgreSQL 17 container used in-memory storage and synthetic credentials. An initial schema was generated from the upgraded config into `/tmp`, reviewed as create-only, and applied to this disposable database; no historical migration registry was executed. Removing only the newly generated column recreated the prior committed snapshot's schema delta. One synthetic `users` row was inserted.

| Step | Read-back |
| --- | --- |
| Pre-up | 125 tables; synthetic user 1; new column absent |
| Apply reviewed up | synthetic user 1; new column present, nullable timestamp with time zone |
| Duplicate up negative check | PostgreSQL rejected the existing column; row and column remained intact |
| Apply reviewed down | synthetic user 1; new column absent |
| Reapply up | new column restored |
| Payload Local API smoke | query PASS; Payload cleanup PASS; PostgreSQL pool cleanup PASS; natural process exit |

`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false` was set for the Payload smoke. The schema setup and migration statements were executed only in the disposable container.

## Local checks and limits

- Node 24.21.0 / pnpm 10.28.0: frozen install, lint, 68-file CI offline allowlist, production build, and post-build `tsc --noEmit` passed.
- This fixture reflects the committed schema snapshot, not a read-back of Production schema or migration records. It does not authorize Production inventory, migration, Preview database access, or merge. Recheck an exact PR head and all applicable CI checks after push; obtain separate Production migration authority and a current inventory before any apply.
