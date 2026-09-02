# Phase 21 Dev-schema Warning Resolution Approval Package

日期：2026-09-02
狀態：**BLOCKED_WARNING_FLOW_DRIFT — APPROVAL CONSUMED WITHOUT APPLY**

## Decision requested

請 Human 決定是否批准在精確鎖定的 Payload 3.85.1 migration runner warning 上輸入一次 `y`，讓 runner 忽略既有 `batch = -1` dev marker 的 batch 計算影響，並繼續執行已審查的兩筆 pending migrations。

這是新的 Production mutation 授權；先前依 `phase-21-production-migration-blocker.md` 的 retry approval 已因 warning stop condition 消耗，不能重播。

## Warning cause and actual runner behavior

Production `payload_migrations` 存在一筆歷史 metadata：

- `name = 'dev'`
- `batch = -1`
- created at：2026-06-12
- last updated：2026-06-19

Payload 3.85.1 `@payloadcms/drizzle/dist/migrate.js` 只要讀到任何 `batch = -1` record，就顯示 generic data-loss warning。若 Human 接受：

1. runner 不會刪除、更新或重新命名該 `dev` record；
2. runner 只會在記憶體中把 `batch = -1` record 排除於 latest-batch 計算；
3. runner 會跳過已存在 history 的 migrations；
4. runner 依檔案順序執行精確兩筆 pending migrations，每筆各自使用 transaction；
5. runner 為兩筆 migration 建立正常的 batch `11` history records。

鎖定的 runner 檔案 SHA-256：

```text
eb18f8183e11f533c3b218c4c71cc74fcbb6964fed265546cd4213b998f999a8
```

專案未配置 Postgres adapter `extensions`，所以 runner 在 warning 前呼叫的 `createExtensions()` 沒有 extension DDL。

## Approved migration candidates

1. `20260629_144118_add_travel_source_section_media`
   - committed `up`／`down` 均為 no-op；
   - 只新增正常 migration-history metadata。
2. `20260831_120000_phase_21_travel_memory_contract`
   - SHA-256：`dd187293e6866f19eb788383bdd11673b22fc0f52f8aa9f087d4a5ef45febf55`；
   - 建立兩個 enum；
   - 新增四個 nullable 欄位；
   - 不含 DML、drop、rename、default、NOT NULL、RLS、policy 或 grant change。

## Fresh baseline from blocked attempt

- pending set：精確為上述兩筆；
- 四個目標欄位：不存在；
- 兩個目標 enum：不存在；
- 兩筆 migration history：不存在；
- row counts：`75 / 409 / 239 / 461`；
- 四張 target tables：RLS enabled；
- `anon`／`authenticated` direct grants：0；
- blocked attempt 後 schema／history／row-count read-back 與 baseline 相同。

正式執行前仍須 fresh preflight；本節數值不是永久常數。

## Controlled execution

1. 確認 branch、Node `20.20.2`、Payload `3.85.1`、runner checksum 與 migration checksums。
2. 明確設定 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。
3. Fresh SELECT-only preflight：pending set、`dev` marker、目標 schema、history、row counts、RLS 與 grants。
4. 啟動 `pnpm payload migrate`；只在 warning 文字與本 package 完全一致時輸入一次 `y`。
5. runner 必須只顯示並完成上述兩筆 migration；任何第三筆、錯誤、rollback 或額外 confirmation 立即 BLOCK，不重試。
6. Immediate SELECT-only read-back：
   - 四欄位存在且 nullable；
   - enum labels 精確符合 migration；
   - 兩筆 migration history 存在且 batch 為 `11`；
   - `dev` marker 保持不變；
   - row counts 不變；四個新欄位 non-null counts 都是 0；
   - RLS／direct grants 不變。

## Explicit exclusions

- 不刪除或改寫 `dev` migration metadata；
- 不手工補 migration history；
- 不執行 content／media write、seed、Admin 或 write API；
- 不執行 #101 cleanup、down migration、merge 或 Production deployment；
- 不把 generic warning 當作一般性的未來 bypass 授權。

## Stop conditions

- pending set、runner checksum、migration checksum、schema、history 或 row counts 任一漂移；
- warning 文字或觸發原因與本 package 不一致；
- CLI 在接受 warning 後出現 data-loss diff、drop、rename、CASCADE 或第二次 confirmation；
- 任一 transaction timeout、rollback 或 migration error；
- read-back timeout、row count 改變、新欄位出現非 NULL data、RLS／grant drift。

## Rollback boundary

- runner 的每筆 migration 各自 transaction；失敗的當筆應 rollback，但第一筆 no-op history 可能已先完成，必須依 read-back 記錄實際狀態，不自動重試。
- Phase 21 完成且四個新欄位仍全為 NULL 時，技術上可使用已 rehearsal 的 `down`；但本 package 不批准 rollback。任何 rollback 必須另行取得 Human approval。

## Human approval token

若接受此受控 warning resolution，請明確回覆：

> 批准依 `phase-21-dev-schema-warning-resolution-approval-package.md`，在 fresh preflight 完全一致時，對 Payload 3.85.1 因既有 `dev`／`batch=-1` marker 顯示的已鎖定 warning 輸入一次 `y`，並只執行精確兩筆 pending migrations；保留 `dev` record，`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`，不執行 content/media write、cleanup、merge；任何 checksum、pending、schema、history、row count、warning 或 read-back 漂移立即 BLOCK，且不重試。

## Approved execution result

2026-09-02 Human 已使用上述 token 批准一次受控 execution。Fresh preflight 確認：

- Supabase project `ACTIVE_HEALTHY`，PostgreSQL `17.6.1.127`；
- branch HEAD `5eada259953abdf82721bd2912d254b160b7c08c`；
- Node execution runtime `20.20.2`；
- runner、兩筆 migration checksum 與本 package 一致；
- `dev`／`batch = -1` marker、目標 schema、history、row counts、RLS、grants 均與 baseline 一致；
- Payload CLI `migrate:status` 連續兩次 exit `0` 但沒有輸出 migration table，因此沒有把 CLI 空輸出當成 PASS；改以 committed migration index 對 Production 全部 migration history 做 SELECT-only set comparison，pending set 仍精確為批准的兩筆。

啟動唯一一次 `pnpm payload migrate` 後，process 只輸出 pnpm script header，沒有顯示本 package 鎖定的 warning、沒有顯示 `Migrating:`／`Migrated:`，並在約兩秒內 exit `0`。因 warning flow 與批准基線不一致，沒有輸入 `y`，且依「不重試」條款停止。

Immediate SELECT-only read-back 確認：

- `dev` marker 未變；
- 兩筆 migration history 仍不存在；
- 四個目標欄位與兩個 enum 仍不存在；
- row counts 仍為 `75 / 409 / 239 / 461`；
- RLS enabled，`anon`／`authenticated` direct grants 為 0。

本次 approval 已消耗且 Production migration 未執行。不得重播本次 command、改用其他 CLI invocation、手工 SQL 或 metadata mutation。後續 disposable rehearsal 已釐清 CLI／stdin 行為並形成 `phase-21-explicit-env-production-migration-approval-package.md`；必須取得新的 Human approval 才能執行。

## Post-block disposable CLI rehearsal

- 使用全新 PostgreSQL 17 container `li-family-phase21-cli-rehearsal` 與匿名 volume；沒有掛載使用者目錄、沒有使用 Production data／URI。
- 建立 production-shaped minimal target tables、完整 migration-history fixture 與 `dev`／`batch = -1` marker。
- 明確把 disposable `DATABASE_URI` 注入 process environment 後，`migrate:status` 正常列出精確兩筆 pending。
- `pnpm payload migrate` 顯示與本 package 完全一致的 warning；輸入一次 `y` 後只完成兩筆 migration。
- Read-back：兩筆 history 均為 batch `11`、`dev/-1` 未變、四欄位皆 nullable、兩 enum 共 10 個正確 labels。
- 證據完成後已移除 container 與匿名 volume，並確認 container 不存在。

Process-environment 診斷確認 Codex command environment 預設沒有 `DATABASE_URI`；Node 20 `--env-file=.env` 可明確載入 Production URI，且只輸出非敏感 fingerprint。使用此方式執行 Production SELECT-only `migrate:status` 後，CLI 已穩定輸出完整 migration table與精確兩筆 pending。這證明 silent exit 是環境變數注入／CLI bootstrap 路徑問題，不是 Production schema 或 pending-set drift。
