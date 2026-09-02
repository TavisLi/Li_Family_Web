# Phase 21 Production Migration Blocker

日期：2026-09-02
狀態：**BLOCKED_PENDING_SET_DRIFT — NOT APPLIED**

## Approved scope

Human 已批准依 `phase-21-production-migration-approval-package.md` 執行唯一的 Phase 21 additive migration：

- `20260831_120000_phase_21_travel_memory_contract`
- 只新增兩個 enum 與四個 nullable 欄位；
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`；
- 不執行 content/media write、cleanup、merge；
- 任一 stop condition 命中立即 BLOCK。

## Fresh preflight

下列項目符合 approval package：

- Branch／PR #103 head：`feeb6624c09c81905256833be98b59f15456fefc`；
- migration SHA-256：`dd187293e6866f19eb788383bdd11673b22fc0f52f8aa9f087d4a5ef45febf55`；
- Production PostgreSQL：`17.6.1.127`，`ACTIVE_HEALTHY`；
- 四個目標欄位與兩個 enum：全部不存在；
- target row counts：`75 / 409 / 239 / 461`；
- 四張 target tables：RLS enabled；
- `anon`／`authenticated` direct grants：0。

## Stop condition

使用 Node `20.20.2` 並明確設定 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false` 執行唯讀 `pnpm payload migrate:status`，發現兩筆 pending migrations：

1. `20260629_144118_add_travel_source_section_media`
2. `20260831_120000_phase_21_travel_memory_contract`

Approval package 規定 pending set 必須只包含 Phase 21；因此在執行 `pnpm payload migrate` 前立即停止。

舊 migration 的 committed TypeScript `up`／`down` 只有註解，沒有 DDL／DML；但讓 Payload runner 處理它仍會寫入一筆 `payload_migrations` history record。這是 approval package 明確排除的 unrelated migration／baseline metadata write，不能由代理自行視為 Phase 21 授權。

## Post-block read-back

停止後再次以 Production SELECT-only query 確認：

- 四個目標欄位：仍為 0；
- 兩個目標 enum：仍為 0；
- `20260629...` 與 `20260831...` migration history：均不存在；
- target row counts：仍為 `75 / 409 / 239 / 461`；
- Production schema／data mutation：`0`。

## Safe resolution

建議使用 Payload 正常 migration runner 一次處理目前精確的兩筆 pending migrations：舊 `20260629...` 僅建立 migration-history metadata，Phase 21 執行已 rehearsal 的 additive DDL。不得手工補 history、修改 migration index 或略過 runner，除非另有批准 package。

執行前仍須重做完整 preflight；pending set 必須精確等於上述兩筆，舊 migration TS 必須仍為 no-op，Phase 21 checksum 與 row counts 必須符合本證據。任何新 pending、schema drift 或 warning 都再次 BLOCK。

若要批准此修正路徑，請明確回覆：

> 批准依 `phase-21-production-migration-blocker.md` 使用 Payload migration runner 處理精確兩筆 pending migrations：`20260629_144118_add_travel_source_section_media` 僅新增 migration-history metadata，`20260831_120000_phase_21_travel_memory_contract` 只新增兩個 enum 與四個 nullable 欄位；`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`，不執行 content/media write、cleanup、merge；pending set、checksum、schema 或 row counts 任一漂移立即 BLOCK。
