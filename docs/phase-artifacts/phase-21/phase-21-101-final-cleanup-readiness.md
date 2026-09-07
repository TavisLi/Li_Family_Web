# #101 — Final cleanup readiness（尚未批准／尚未執行）

日期：2026-09-07。此文件是最終 destructive approval 的最小基線，不是 apply 指令。

## 已具備

- Production scoped backup PASS：SHA-256 `7f6041a1a0caf3b3b7b0dccbb575d3b3a3a6c4aa56b648fcc879a2e23b52e46b`，0700／0600 Git-ignored 私有檔案；Production writes 0。
- Local restore read-back PASS：10 張 scoped tables、12,080 rows 逐表 normalised row hash 一致；Production connections 0。
- 前台 legacy consumer cutover 已部署，Production 33 個 Travel route GET-only QA 已完成；不再重做該矩陣。
- `TravelMemories` 的 `dailyHighlights`／`itineraryImages` Collection contract removal 已完成本地驗證，但尚未 commit／merge／deploy。

## 最小 cleanup target

1. 兩張 shared relation table 的 exact legacy rows：
   - `travel_memories_rels`：104 rows
   - `_travel_memories_v_rels`：1,753 rows
   - 每列都必須以 backup 中的 `id + parent_id + path` 三元組刪除；不得以 `LIKE`、prefix 或全表 delete 推測。
2. 八張 legacy tables，固定 child-first 順序：
   - `travel_memories_daily_highlights_segments_locales`
   - `travel_memories_daily_highlights_segments`
   - `travel_memories_daily_highlights_locales`
   - `travel_memories_daily_highlights`
   - `_travel_memories_v_version_daily_highlights_segments_locales`
   - `_travel_memories_v_version_daily_highlights_segments`
   - `_travel_memories_v_version_daily_highlights_locales`
   - `_travel_memories_v_version_daily_highlights`

保留 galleryImages、externalVideos、reminders、Media／R2 assets、canonical Day／Moment／Placement、Travel Plans、Users，以及 202702 Phuket Plan 與其未追蹤素材。

## DDL review

Payload 3.85.1／Drizzle 從 tracked Phase 19 snapshot 產生的候選為八個 `DROP TABLE ... CASCADE`。**不可採用**，因為 CASCADE 會隱藏未預期 consumer／FK。

最終 executor 固定為 `DROP TABLE public."<allowlisted-table>" RESTRICT`，並沿用上列 child-first 順序。若有外部 dependency，PostgreSQL 必須立即拒絕 transaction。`phase21-retirement-cleanup-plan.mjs` 的 tests 確認沒有 CASCADE、沒有非 allowlisted table，也沒有未鎖定的 relation delete。

## 尚未具備／必須在 final approval 前完成

1. 將 Collection contract removal 以獨立 PR merge/deploy。Production 上仍存在舊表期間不造成問題；反向順序會讓 Payload Admin contract 與 DB 不一致。
2. 一次新的、同一 executor 的 Production preflight，讀取當時的 table／FK／index／sequence／RLS／grant metadata 與 exact relation rows，並與私有 backup 一致；這是 final mutation 前的 transaction guard，不重跑 C0／Browser QA。
3. 在 disposable PostgreSQL 以該最終 metadata 演練：exact relation deletes → eight `DROP ... RESTRICT` → read-back；rollback 使用私有 raw backup 加上 actual schema/security metadata。現行 local row restore 已證明資料可重建，但不能替代這個 actual-DDL rehearsal。
4. 最終明確 Production destructive approval：只允許上述 relation DML 與八個 RESTRICT drops、固定 backup SHA、固定 executor checksum、單一 transaction、post-commit independent read-back；任何 drift 立即 BLOCK，不 retry。

## 明確非授權項目

此文件不授權 merge、deploy、Production DDL／DML、Payload migration history write、內容／媒體變更、cleanup、rollback 或 Issue closeout。
