# Phase 21 Migration Rehearsal

日期：2026-09-02
狀態：**PASS — disposable PostgreSQL only**

## 範圍與授權

- 僅在本機 disposable PostgreSQL 17 container `li-family-phase21-pg` 排演。
- Container database：`phase21_rehearsal`；只使用 PostgreSQL image 自動建立的匿名 data volume，沒有掛載使用者目錄、沒有匯入 Production data、沒有設定 Production `DATABASE_URI`。
- Migration：`20260831_120000_phase_21_travel_memory_contract`。
- Migration SHA-256：`dd187293e6866f19eb788383bdd11673b22fc0f52f8aa9f087d4a5ef45febf55`。
- 未連線 Production 執行 schema／data mutation，未執行 seed、content/media write、merge 或 Admin 操作。

## Migration review

`up` 只有六個 additive DDL statements：

- 建立 live／version story role enum，共 2 types、每個 5 labels；
- `travel_memories_story_sections.role`：nullable enum；
- `_travel_memories_v_version_story_sections.role`：nullable enum；
- `travel_memory_days_moments_locales.transport`：nullable `varchar`；
- `_travel_memory_days_v_version_moments_locales.transport`：nullable `varchar`。

`up` 沒有 `INSERT`、`UPDATE`、`DELETE`、`DROP`、`CASCADE`、default、`NOT NULL`、RLS、grant 或 unrelated table change。Rehearsal 前以 normalized SQL comparison 確認暫存 SQL 與 committed migration 的 `up`／`down` blocks 完全一致：`PHASE21_REHEARSAL_SQL_MATCH_PASS`。

## Synthetic baseline

只建立四張 migration 直接依賴的最小 table，每張各放一筆 sentinel row。Baseline 保存每張表的 row count 與既有欄位 checksum；不含任何 Production row 或 secret。

## 執行與 read-back

序列：

1. 建立 synthetic baseline：PASS。
2. `up`（single transaction）：PASS。
3. read-back：`PHASE21_UP_READ_BACK_PASS`。
4. `down`（single transaction）：PASS。
5. read-back：`PHASE21_DOWN_READ_BACK_PASS`。
6. 第二次 `up`（single transaction）：PASS。
7. read-back：`PHASE21_UP_READ_BACK_PASS`。

證據完成後以 `docker rm -fv li-family-phase21-pg` 移除 container 與該匿名 volume，並 read-back 確認兩者均不存在；PostgreSQL image 保留於本機 cache。

每次 `up` 後確認：

- 四個欄位全部存在且 `is_nullable = YES`；
- 兩個 enum 共 10 labels；
- 四筆 sentinel row 的 row count／checksum 不變；
- 新欄位對既有 rows 全部保持 `NULL`。

`down` 後確認：

- 四個新增欄位與兩個 enum 全部不存在；
- sentinel row count／checksum 不變。

## 結論

Migration 在 production-shaped minimal baseline 上可完成 `up → down → up`，且沒有改寫既有 row。這只建立本地技術證據，不批准 Production migration；正式執行仍須使用 `phase-21-production-migration-approval-package.md` 的 fresh preflight、獨立 Human approval 與 after read-back。
