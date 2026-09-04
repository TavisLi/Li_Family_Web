# Phase 21 Explicit-env Production Migration Approval Package

日期：2026-09-02
狀態：**PASS — APPLIED AND READ-BACK VERIFIED**

## Decision requested

請 Human 決定是否批准使用 Node `20.20.2` 的 `--env-file=.env` 明確載入既有 Production credentials，直接啟動鎖定的 Payload 3.85.1 CLI entrypoint，並在既有 `dev`／`batch = -1` warning 完全一致時輸入一次 `y`，執行精確兩筆 pending migrations。

先前 warning-resolution approval 已因 CLI 未取得 `DATABASE_URI`、silent exit 而消耗，不能重播。本 package 是新的 Production mutation 授權。

## Root cause evidence

- Codex command process 預設沒有 `DATABASE_URI`。
- 先前 `pnpm payload migrate` 依賴 Payload／dotenv 隱式載入，執行時只輸出 pnpm header 後 exit `0`；沒有 warning、沒有 migration logs、沒有 Production mutation。
- Node `20.20.2` 使用 `--env-file=.env` 後，非敏感 fingerprint 確認載入既有 Production database。
- 使用同一 explicit-env 啟動方式執行 Production SELECT-only `migrate:status`：PASS，完整列出精確兩筆 pending。
- Disposable PostgreSQL 17 使用明確 process env 注入完成 warning `y` 流程與兩筆 migration read-back：PASS；container／volume 已移除。

## Locked runtime and files

- Node：`20.20.2`
- Payload：`3.85.1`
- CLI entrypoint：`node_modules/payload/bin.js`
- CLI entrypoint SHA-256：`830371d3bf4382234682acb58f10b90097b2ee73232ddfa037fe333de61b388d`
- Drizzle runner SHA-256：`eb18f8183e11f533c3b218c4c71cc74fcbb6964fed265546cd4213b998f999a8`
- historical no-op migration SHA-256：`7dbf541e96a3d373d559cc5134319dfefae456d3d96433ddf5b901b87481ec2e`
- Phase 21 migration SHA-256：`dd187293e6866f19eb788383bdd11673b22fc0f52f8aa9f087d4a5ef45febf55`

## Expected Production effect

1. `20260629_144118_add_travel_source_section_media`：no-op，只新增 batch `11` migration-history record。
2. `20260831_120000_phase_21_travel_memory_contract`：
   - 新增兩個 enum；
   - 新增四個 nullable 欄位；
   - 新增 batch `11` migration-history record。
3. 保留既有 `dev`／`batch = -1` record，不刪除、不更新。
4. 既有 row counts 不變，四個新欄位 non-null counts 均為 0；RLS／grants 不變。

## Exact controlled invocation

執行時不得依賴 pnpm script 的隱式 env bootstrap；使用下列等價啟動契約：

```text
PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false
Node 20.20.2
node --env-file=.env node_modules/payload/bin.js migrate
```

命令與輸出不得列印 `.env` 或 `DATABASE_URI` 值。

## Execution procedure

1. Fresh SELECT-only preflight：project health、checksums、`dev` marker、pending set、schema、history、row counts、RLS、grants。
2. 先用完全相同 explicit-env entrypoint 執行一次 `migrate:status`；必須完整顯示精確兩筆 pending。
3. 啟動一次 `migrate`；warning 文字必須與已鎖定文字完全一致，才輸入一次 `y`。
4. 輸入後只能依序顯示：
   - `Migrating/Migrated: 20260629_144118_add_travel_source_section_media`
   - `Migrating/Migrated: 20260831_120000_phase_21_travel_memory_contract`
5. 任一第三筆 migration、額外 confirmation、error 或 rollback 立即 BLOCK，不重試。
6. Immediate SELECT-only read-back：四欄位 nullable、10 enum labels、兩筆 batch `11` history、`dev/-1` 不變、row counts 與 RLS/grants 不變、四欄位 non-null counts 為 0。
7. 再執行一次 explicit-env `migrate:status`，兩筆必須為 Ran `Yes`。

## Explicit exclusions

- 不執行 content／media write、seed、Admin、write API；
- 不刪除或改寫 `dev` marker、不手工補 history；
- 不執行 cleanup、down migration、rollback、merge 或 Production deployment；
- 本批准不建立未來一般性的 warning bypass 或 `.env` 使用授權。

## Stop conditions

- checksums、pending、schema、history、row counts、RLS、grants 任一漂移；
- explicit-env `migrate:status` 再次 silent exit 或未完整列出精確兩筆 pending；
- warning 文字、觸發原因或順序不一致；
- 任一額外 migration、data-loss diff、drop、rename、CASCADE、第二次 confirmation；
- transaction timeout、rollback、migration error 或 read-back timeout；
- row count 改變、新欄位出現非 NULL data、RLS／grant drift。

## Human approval token

若接受此 explicit-env controlled execution，請明確回覆：

> 批准依 `phase-21-explicit-env-production-migration-approval-package.md`，使用 Node 20.20.2 `--env-file=.env` 明確載入既有 Production credentials，鎖定 Payload 3.85.1 CLI／runner／兩筆 migration checksums；fresh explicit-env `migrate:status` 精確兩筆 pending 且全部 preflight 一致時，對既有 `dev`／`batch=-1` warning 輸入一次 `y`，只執行兩筆 migration並保留 `dev` record；`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`，不執行 content/media write、cleanup、merge；任一 env、warning、pending、checksum、schema、history、row count、RLS、grant 或 read-back 漂移立即 BLOCK，且不重試。

## Approved execution result

2026-09-02 Human 已使用上述 token 批准唯一一次 explicit-env controlled execution。Fresh preflight 全部符合本 package，Production runner 只執行兩筆 migration並正常 exit `0`：

```text
Migrated:  20260629_144118_add_travel_source_section_media
Migrated:  20260831_120000_phase_21_travel_memory_contract
Done.
```

Immediate SELECT-only read-back 與 final explicit-env `migrate:status` 全部 PASS：

- 兩筆 migration history 均為 batch `11`、Ran `Yes`；
- `dev`／`batch = -1` record 的 id、created／updated timestamps 均未變；
- 四個目標欄位存在、nullable、無 default；
- 兩個 enum 共 10 個 labels，名稱、順序與 committed migration 一致；
- 四個新欄位 non-null counts 均為 `0`；
- target row counts 仍為 `75 / 409 / 239 / 461`；
- 四張 target tables 的 RLS 仍 enabled；`anon`／`authenticated` direct grants 仍為 0；
- 沒有 content／media write、cleanup、merge、deployment、rollback 或額外 migration。

DDL 後 Supabase advisors 為唯讀檢查。四張 target tables 只有既有型態的 INFO notices（RLS enabled without policy、unindexed foreign key／unused index）；沒有 target-table ERROR。全資料庫仍有其他 security/performance advisor backlog，但本次沒有 before-advisor baseline，不能把它歸因於或宣稱由本 migration 解決；本 scope 沒有執行任何 advisor remediation。
