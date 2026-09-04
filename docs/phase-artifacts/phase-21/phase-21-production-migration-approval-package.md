# Phase 21 Production Migration Approval Package

日期：2026-09-02
狀態：**BLOCKED_PENDING_SET_DRIFT — APPROVAL CONSUMED WITHOUT APPLY**

## Requested decision

本 package 原只請求批准 Production 執行 migration `20260831_120000_phase_21_travel_memory_contract`。目前沒有仍有效的 Production mutation 授權；文件完成、disposable rehearsal PASS、Preview schema blocker 或 Vercel `READY` 都不能取代新的 Human approval。

2026-09-02 Human 已批准本 package，但 fresh `migrate:status` 發現 unrelated historical no-op migration 同時 pending，命中 stop condition，因此沒有執行 Production migration。本次批准已消耗於被阻擋的 execution attempt，不得重播；後續處理見 `phase-21-production-migration-blocker.md`。

批准所鎖定的 migration SHA-256：`dd187293e6866f19eb788383bdd11673b22fc0f52f8aa9f087d4a5ef45febf55`。

若批准，scope 只包含兩個 enum 與四個 nullable columns。明確排除：

- content／media write、seed、baseline metadata write；
- Admin／write API；
- #101 destructive cleanup；
- unrelated pending migration；
- merge 或 Production deployment。

## Current evidence

### Preview blocker

PR #103 Preview `/travel` 連線 Production database 後，runtime query 因 PostgreSQL `42703` 停止：

```text
column travel_memories_storySections.role does not exist
```

Digest：`91166848`。HTTP `200` 只是 RSC transport status，不是 render PASS。

### Disposable rehearsal

- PostgreSQL：17，隔離匿名 volume；證據完成後 container／volume 均已移除，未使用 Production data。
- committed migration SQL match：PASS。
- `up → down → up`：PASS。
- nullable／enum／sentinel row count／checksum／NULL read-back：PASS。
- 詳見 `phase-21-migration-rehearsal.md`。

### Production schema-only inventory

2026-09-02 以 Supabase schema-only SELECT 確認：

- Project：`Li_Family_Web Project`，PostgreSQL `17.6.1.127`，`ACTIVE_HEALTHY`。
- 四個目標欄位：全部不存在。
- 兩個目標 enum types：全部不存在。
- `payload_migrations`：Phase 19 migration 存在（batch `10`）；Phase 21 migration 不存在。
- Production mutation：`0`。

Fresh baseline row counts：

| Table | Rows |
| --- | ---: |
| `travel_memories_story_sections` | 75 |
| `_travel_memories_v_version_story_sections` | 409 |
| `travel_memory_days_moments_locales` | 239 |
| `_travel_memory_days_v_version_moments_locales` | 461 |

這些 counts 是 approval baseline，不是永久常數；正式 apply 前必須重新查詢。若 schema、migration history 或 counts 漂移，停止並重建 package，不自行接受差異。

## Expected Production effect

單一 migration transaction 預期執行：

1. 建立 `enum_travel_memories_story_sections_role`；
2. 建立 `enum__travel_memories_v_version_story_sections_role`；
3. 對 live／version story section 各新增 nullable `role`；
4. 對 live／version moment locale 各新增 nullable `transport`。

預期既有 row count 不變，四個新欄位的 non-null count 均為 `0`。Migration 不改 RLS、policy、grant 或 Data API exposure；既有 access controls 保持不變。

DDL 會短暫取得四張 table 的 PostgreSQL lock；若無法在執行窗口安全取得 lock、query timeout 或 transaction rollback，立即 BLOCK，不重試、不執行 content write。

## Approved execution procedure（尚未批准）

只有 Human 明確批准本 package 後才可執行：

1. 確認 PR #103 head、migration checksum 與批准 package 一致。
2. 使用 Node `20.20.2`，明確設定 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。
3. Fresh SELECT-only preflight：四張 table、四欄位、兩 enum、pending migration set、migration history、row counts。
4. Pending migration set 必須只包含 `20260831_120000_phase_21_travel_memory_contract`；否則停止。
5. 執行 Payload controlled migration；任何 data-loss／dev-schema warning 都不互動確認，立即停止。
6. Immediate schema read-back：四欄位 nullable、enum labels、migration record、row counts、新欄位 non-null count、RLS/grants 不變。
7. 重新部署／刷新既有 PR #103 Preview，執行 GET-only Browser QA 與 runtime-log read-back。
8. Content／media write 保持 `0`；若後續需要填入 `role`／`transport`，另行準備 dry-run 與 Human approval。

## Stop conditions

- 任一目標欄位／enum 已部分存在，或 Phase 21 migration record 已存在。
- Pending migration 不只 Phase 21。
- Fresh Production inventory 與本 package 不一致。
- Payload CLI 顯示 data loss、dev-schema push 或 destructive confirmation。
- Migration 包含 DML、unrelated table、RLS／grant change、drop 或 `CASCADE`。
- Transaction timeout／rollback、read-back timeout 或 row count 改變。
- Preview／Production commit 與批准的 migration checksum 不一致。

## Rollback

- 在任何 `role`／`transport` content write 前：可執行已 rehearsal 的 `down`，再確認四欄位與兩 enum 消失、既有 row counts 不變。
- 一旦任何新欄位有非 NULL data：不得直接 `down`；先匯出與確認資料影響，建立獨立 rollback approval package。
- Runtime：migration 未完成前 PR #103 Preview 保持 `BLOCKED_AT_SCHEMA_GATE`；不得用 feature flag、Admin 或資料寫入繞過。

## Human approval token

下列原批准文字已於 2026-09-02 使用並因 stop condition 終止，不得重播：

> 批准依 `phase-21-production-migration-approval-package.md` 執行 Phase 21 Production additive migration；只新增兩個 enum 與四個 nullable 欄位，`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`，不執行 content/media write、cleanup、merge；任何 stop condition 命中立即 BLOCK。
