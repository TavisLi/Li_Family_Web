# #119 Node 24 evidence

日期：2026-09-13。基線：#104 / Draft PR #123 的 `docs/phase-preparation/issue-104-node24-compatibility-plan.md`（PR head `57c01de8588c8221c226b0cbb42099eb2bb560fb`，尚未合併）。本目錄只記 execution delta。

## Identity / delta

- Fresh fetch：`origin/main = f1796687d2469319c4a465feada1ffc3cb8b59d8`，與 #104 完全一致。開工 working tree clean；#104 已 CLOSED，PR #123 OPEN Draft；#118 OPEN，main 無 CI。
- 分支：`codex/phase-119-node24`，從 origin/main 建立。
- 官方 `https://nodejs.org/dist/index.json` read-back：最新 24 LTS `v24.21.0`，index date `2026-09-07`。下載 `https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz` 並核對同目錄官方 SHASUMS256.txt。
- Node tarball SHA256：`bed7eea5325e1108f32ce5228ddd6a5f0f08a499ee42aa7442aea583702f6057`。
- Candidate executable：`/tmp/issue119/runtime/node-v24.21.0-darwin-arm64/bin/node`，實測 `v24.21.0`；baseline `/Users/tien-hsinglee/.nvm/versions/node/v20.20.2/bin/node`，實測 `v20.20.2`。OS：macOS arm64；Linux 尚未驗證。
- pnpm：兩邊均以隔離 `npm install --prefix /tmp/issue119/pm --ignore-scripts --no-audit --no-fund pnpm@10.28.0` bootstrap，實測 `10.28.0`。
- 原 lock SHA256：`14aa4c6446ffc9ad3129a04b96bf7c7f4f5f63b6bd1a7b1edc6f4b94a3998b33`；兩個 frozen install 後完全相同。
- Vercel project read-back：`prj_9JnWOR9OEhA3zRZJKXMUh2qVE0v4`，`nodeVersion=24.x`；最新 deployment ID 仍 `dpl_6ss624UGJpHKi3ZRJfKBMfGUG5pr`。只讀 project metadata，沒有 Production DB/log access。無 Dashboard 修改。

| Selector | Before | After |
| --- | --- | --- |
| package engines.node | >=20.9.0 <21 | 24.x |
| .nvmrc / .node-version | 20.20.2 | 24.21.0 |
| packageManager | absent | pnpm@10.28.0 |
| dependencies / lock / allowBuilds | #104 baseline | unchanged |
| Vercel Project Settings | 24.x | unchanged |
| Docker / 8 historical guards | legacy Node 18 / frozen Node 20 | unchanged; explicitly unsupported historical paths |

## Validation

使用兩個 `git archive origin/main` 輸出的乾淨目錄 `/tmp/issue119/node20`、`node24`，不含 `.env`、node_modules 或 build cache。Node24 只套用三個 runtime selector files。各自 `pnpm install --frozen-lockfile --store-dir /tmp/issue119/store20|store24`；獨立新 store，沒有複用主工作目錄 modules。所有 DB-related 命令明確指定 disposable localhost URI 與 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。

| Gate | Node 20 | Node 24 | Evidence / limitation |
| --- | --- | --- | --- |
| Clean install | exit 0 | exit 0 | `install20.log` / `install24.log`; no engine/blocked-script warnings |
| Native lifecycle | PASS | PASS | esbuild 0.18.20/0.25.12/0.28.0, sharp 0.34.5, unrs-resolver hooks executed; allowBuilds works |
| lint | exit 0 | exit 0 | no warnings |
| 41 deduplicated automated test files | 40 PASS / 1 FAIL | 40 PASS / 1 FAIL | `quality-results.json`; baseline failure below |
| production build | exit 0 | exit 0 | 20 route entries; same route classifications, 102 kB shared JS |
| build → tsc | exit 0 | exit 0 | initial and final typecheck |
| visible deprecation build | exit 0 | exit 0 | `NODE_OPTIONS=--trace-deprecation pnpm exec next build`; no DEP warnings |
| Payload --help | exit 1 | exit 1 | same command-list response, not a supported success smoke |
| generate:types / generate:importmap | exit 0 | exit 0 | importmap unchanged; same pre-existing comment-only types drift; not committed |
| migrate:status | not repeated | exit 0 | disposable DB only, all historical migrations unrecorded as expected; none executed |
| PostgreSQL / Local API / auth | assertions PASS | assertions PASS | SELECT, transaction rollback, private-user access, login/token/auth/wrong password; see shutdown caveat |
| sharp | PASS | PASS | actual JPEG→WebP resize and metadata |
| S3 client | exit 0 | exit 0 | local fixture SigV4 signed GET + stream + sharp decode; remote R2/TLS not tested |
| production server | READY locally | READY locally | `pnpm start --hostname 127.0.0.1 --port 3120|3124`; real route probes below |
| HTTP/RSC/Auth/Edge | exit 0 | exit 0 | `http-results.json`; same statuses/content types/response sizes; cookies login/me/logout and wrong-password 401 |
| Browser | no separate visual matrix | local lobby→travel navigation and Admin login rendered | default desktop viewport; no mobile or populated content parity claim |
| diff / generated scope | N/A | PASS | lock, app dependencies, schema, historical scripts unchanged |

`quality-results.json` covers #104's phase-9/16/17/18/19/21, memory-v2, R2 commands by executing each unique test once, plus auth-session, is-admin and site-metadata. `quality-runner.py.txt` is the exact invocation manifest, not a newly installed CI system.

HTTP checked `/`, `/blog`, `/member/runtime-fixture`, `/travel`, `/travel/runtime-fixture`, day/photos, `/timeline`, `/bucket-list`, `/wrapped`, `/family/login`, `/admin`, `/api/users/me`, `/api/users`, `/api/og-default`, and an RSC request. Empty/denied/missing records are expected fixture outcomes; these are not proof of populated Plan/Memory detail parity. Edge returned PNG in both; it remains Edge, not a Node function. Browser confirmed actual travel fallback layout and `/admin/login` form; fallback is not final media evidence.

DB fixture: dedicated Docker `issue119-postgres`, PostgreSQL 17, loopback port 55419. Generated 645 create-only statements from unchanged Payload schema using adapter's existing Drizzle generator, reviewed statement prefixes and loaded only into empty disposable DB. No dev schema push, schema source change, production connection or historical migrations. PostgreSQL identifier truncation NOTICE is fixture-load-only. Local test credentials in replay snippets are synthetic, not account credentials. Container stopped and retained; no cleanup/drop.

## Meaningful failures / warnings

1. **Merge gate remains BLOCKED**: `src/scripts/travel-legacy-cleanup-package.test.ts:212` asserts migration index does not contain `20260719_025401`, but main contains it. Same assertion and exit 1 under Node 20/24. No migration removal or test weakening in #119; requires separate review/decision. `quality20-22.log`, `quality24-22.log` contain diagnosis.
2. `generate:types` changes only the `presentationStyle` field's descriptive comment in both runtimes. No schema/type-shape delta. Restored original generated file in validation copies before final checks; no repo generated changes.
3. Local API smoke emitted all successful assertions but stayed alive after `payload.destroy()` under both runtimes; terminated the two exact test PIDs after inspection. This is **not** a clean process-exit PASS. Server/CLI and independent S3 processes were separately validated; graceful Local API shutdown remains unresolved.
4. No email adapter warning in both local fixture runs; expected bad-password HTTP test logs an operational 401 in both. No new deprecation build warnings. No dependency update justified.
5. Temporary TS harness files initially entered diagnostic build typechecking; moved them outside the source tree and reran both diagnostic builds and final tsc successfully. These harness errors are not application compatibility changes.

## Replay / retained evidence

Normal full logs stay in `/tmp/issue119/` (local ephemeral diagnostic pointers, not portable release evidence). Committed JSON summarizes exit codes and route results; `.txt` harness snapshots preserve reproduction without entering application TS compilation. To replay, create the same isolated archives/runtime/pm/store and set up the dedicated empty local DB. Copy fixture/smoke snippets to the validation checkout only while executing; remove them before build/typecheck. Never substitute a Production URI. Fixture generator checks exact localhost target and push=false. The runtime smoke's successful assertion output must be distinguished from its unresolved process exit.

## Preview package — not executed

Because local suite has a baseline failure, `vercel.json` disables Git auto deployment only for `codex/phase-119-node24`. Pushing the Draft PR must not deploy. No Preview ID is claimed.

Before enabling/deploying, resolve or explicitly accept the baseline gate and obtain the applicable Preview environment approval. Record the exact final PR head SHA, expected **new Preview** for this project and branch, Node **24.x** build/functions (record actual patch), pnpm **10.28.0**, fresh Linux install/native/build, server logs, real SSR/RSC/Payload/Auth/media and desktop/mobile smoke. Prefer isolated Preview DB; live R2 read fixture and PostgreSQL TLS remain required. If Production credentials are necessary, stop for the Playbook's branch-scoped GET-only approval; no Admin or login in that path. No external env/settings mutation has been authorized or performed here.

Rollback of Preview: stop/discard the unpromoted Preview and keep the current Production alias unchanged; restore branch no-deploy rule. Before enabling this branch, announce exact commit, expected deployment/environment, Node version, QA scope, rollback. READY alone does not pass QA.
