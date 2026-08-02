# Phase 19 Migration Rehearsal

日期：2026-08-02

## 範圍與授權

- 僅在本機 disposable PostgreSQL 17 容器 `li-family-phase19-pg` 排演。
- 未連線 Production，未執行 Production schema、content、media 或 destructive write。
- 本文件是後續 Production schema approval package 的本地證據，不代表已批准執行。

## Migration

- `20260802_061812_phase_19_travel_memory_multi_page`
- additive：新增 `travel-memory-days` 與版本／localized child tables。
- backward-compatible：`travel_memories.presentation_style` 為 nullable enum。
- 資料安全：12 張新表啟用 RLS，撤銷 `anon`、`authenticated` 的 table privileges。
- 本次 migration 不建立或更新 Travel Memory 內容列；內容 backfill 保留為獨立 slice。

## Rehearsal 結果

執行序列：

1. 建立只包含外鍵依賴的最小基線。
2. 執行 `up`：成功。
3. read-back：12 張 Phase 19 tables；`presentation_style` nullable；`travel_memory_days` 為 0 rows；RLS enabled；Data API direct grants 為 0。
4. 執行 `down`：成功；Phase 19 tables 與欄位均回到 0。
5. 再次執行 `up`：成功。

## 排演中發現並修正

初次生成的 `down` 先以 `CASCADE` 移除父表，再顯式刪除已被連帶移除的 locked-document foreign key，導致 rollback 失敗。已把 foreign key 與 index 的移除移到 table drop 之前，重跑後通過完整序列。

## Production 停止條件

- 尚未獲 Production migration 授權，不得執行。
- 執行前須重新核對 Production inventory、migration baseline 與 Preview commit。
- 若 migration 出現 delete、unexpected update、data-loss warning 或 inventory drift，立即停止。
- Schema migration、controlled backfill/read-back、runtime cutover 必須依 Issues #80、#81、#82 分開批准與執行。

## Rollback

- runtime：保持 `TRAVEL_MEMORY_MULTIPAGE_ENABLED` 關閉即可使用 legacy renderer。
- schema：在尚未 backfill／cutover 前，可執行已排演的 migration `down`。
- backfill 後不得直接 rollback schema；需先依獨立 approval package 處理資料與關聯。
