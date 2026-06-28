# Phase 11 完成報告：Version 1.1 旅行規劃內容與 Production Seed

日期：2026-06-27
階段名稱：Phase-11 / Version 1.1 Travel Planning Content
主分支最新狀態：`main` / `a791d39`
關聯 GitHub Issues：#15、#16、#17、#18

## Phase 範圍

Phase-11 聚焦旅行系統，尤其是 `202702泰國普吉島7日.md` 與 `202607重慶長江三峽8日.md` 兩個規劃中旅程。核心要求：

- `content-source/travels/202702泰國普吉島7日.md` 的內容必須完整出現在正式網頁。
- `content-source/travels/202607重慶長江三峽8日.md` 依同樣概念呈現。
- 正式頁不再把來源內容放在「完整來源內容」附錄，而是依 Markdown H1 組成正式模組。
- 各內容模組保留 comment、thumb-up、thumb-down 的互動席位。
- `/travel` 目錄補上「前期規劃」，並依使用者 QA 調整版面與文案。
- Production seed 的 media 不應每次重傳，需先比對，只處理差異。

## GitHub / PR / Deployment 狀態

本階段相關 PR 均已合併：

- PR #22：Phase-11 旅行 v1.1 規劃內容基礎實作。
- PR #23：Production migration / seed report。
- PR #24：旅行目錄與規劃頁設計 QA 修正。
- PR #25：依使用者 QA 重組旅行頁，讓來源章節進入正式模組。
- PR #26：media seed 改為 diff-based，比對後只更新有差異的媒體。
- PR #27：保存 Markdown 空 H1 作為 source section 邊界，支援 `# **旅行戰情室**` 這類標題。
- PR #28：顯示每日 Markdown H1 group，避免每日行程被舊 daily filter 隱藏。

追加 QA 修正：

- PR #31：依 browser comments 追加旅行 source section 視覺修正；目前為 follow-up PR，待合併與 Production 部署後回寫最終狀態。

Production deployment 已完成：

- 最新 Production deployment：`dpl_2joFCLF7r1wKgYhoAaEgPzwMsD1Z`
- Production commit：`7030863` 後已進一步合併 PR #28 至 `a791d39`，正式頁 smoke 已讀到 PR #28 效果。
- 正式站：`https://li-family-web.vercel.app`

## 已交付功能

- `TravelProjects.sourceSections` 保存旅行 Markdown 的 H1/H2/H3、表格、清單、提醒與外部連結。
- 規劃中旅行詳情頁改為直接由 `TravelSourceSections` 呈現，不再使用舊的「高級家庭旅行作戰室」與「來源章節已整理成正式行程地圖」雙層結構。
- Markdown H1 會成為正式頁模組：
  - `旅行戰情室`
  - `每日節點與決策討論` / `每日行程詳解`
  - `注意事項`
  - 其他 H1，如美食、交通、費用等。
- `注意事項` 使用深色 reminders 模組呈現。
- 每個 source section 都接入互動席位：comment、thumb-up、thumb-down。
- 每日段落移除重複摘要，保留來源表格內容。
- Browser comments follow-up 視覺修正：
  - 移除 H1 上方「行程章節 · 01」與 `Markdown H1`、段數等 source/debug 標籤。
  - 移除 H2 上方「子章節 · H2」標示。
  - 移除 H1 卡片左側垂直色條，改成整張 H1 卡片的低飽和漸變底色，讓主題區塊更完整。
  - 每日行程卡的 `DAY 1` 類標籤放大，顏色調整為 `#65808b`，套用到所有每日卡片。
  - `注意事項` 模組內不再重複顯示與 H1 標題相同的「注意事項」小標。
  - Mac / PC 寬螢幕下，`注意事項` 的 H2 卡片改為兩欄並列。
- `/travel` 目錄：
  - 分類順序為「規劃中 → 已完成 → 前期規劃」。
  - 移除不必要的內部說明文案。
  - feature cards 移到上方適當位置。
  - 標題尺寸調整，避免「家庭旅途索引廊道」換行。
- media seed：
  - 新增 `src/scripts/seed-media-compare.ts`。
  - seed 啟動時先 bulk load 現有 media，依 `sourcePath` 比對 `type`、`altText`、`sourcePath`、tags。
  - 未變更 media 直接 `skipped`，不再 update，也不重新上傳。
  - 缺少或內容不同的 media 才 create / update。
  - refresh 類命令仍保留強制刷新能力。
- 202702 與 202607 旅行 Markdown 更新後已重新 seed 到 Production。

## 核心檔案

- `src/scripts/seed-content.ts`
- `src/scripts/seed.ts`
- `src/scripts/seed-dry-run.ts`
- `src/scripts/seed-media-compare.ts`
- `src/payload/collections/TravelProjects.ts`
- `src/features/travel/travel-index-page.tsx`
- `src/features/travel/travel-detail-page.tsx`
- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-detail-page.test.tsx`
- `src/features/travel/travel-index-page.test.tsx`
- `src/scripts/seed-content.test.ts`
- `src/scripts/seed-dry-run.test.ts`
- `src/scripts/seed-media-context.test.ts`
- `content-source/travels/202702泰國普吉島7日.md`
- `content-source/travels/202607重慶長江三峽8日.md`

## 驗證命令

本階段收尾修正均已通過：

- `pnpm run test:phase-9`
- `pnpm tsc --noEmit`
- `pnpm run build`
- `git diff --check`

## Production migration / seed 紀錄

Phase-11 migration 已套用至 Production：

- `src/migrations/20260625_234308_travel_source_sections.ts`
- `src/migrations/20260625_234308_travel_source_sections.json`

人工 schema 審核結論：此 migration 僅新增 `travel_projects_source_sections*` 相關 table、FK、index；不包含 `DROP TABLE`、`DROP COLUMN`、`DELETE`、`UPDATE` 或既有欄位型別變更。

並行 Phase-10 migration `20260624_143753_add_user_role` 已確認為其他 Phase 範圍，本階段未修改、未重跑、未 revert。

Production seed 最終結果：

- `pnpm run seed:phase-9`
  - created：0
  - updated：12
  - skipped：787
  - failed：0
- `pnpm run seed:phase-9:read-back`
  - created：0
  - updated：12
  - skipped：0
  - failed：0

補充：seed / read-back 在完成統計輸出後，Payload Local API process 會有尾端連線殘留；已在統計完成後中止 process，退出碼為 0。另有一次 Production seed 在 bulk 讀 media 時遇到 Supabase pooler transient disconnect，未進入寫入階段；重試後完成。

## Production browser / route QA

正式站 smoke 已完成：

- `/travel`
  - HTTP 200
  - 包含「規劃中」、「已完成」、「前期規劃」
  - 不再包含「列表以時間廊道呈現，不硬編死路由；新增 TravelProjects 後會自動出現在這裡。」
- `/travel/202702-thailand-phuket`
  - HTTP 200
  - 包含「旅行戰情室」、「每日節點與決策討論」、「注意事項」、「泰國普吉島度假二刷」、「Day 1」
  - 不再包含「來源章節已整理成正式行程地圖」、「高級家庭旅行作戰室」或內部 marker `__SECTION_BOUNDARY__`
- `/travel/202607-chongqing-yangtze-river`
  - HTTP 200
  - 包含「旅行戰情室」、「Day 1」、「注意事項」、「重慶+長江三峽8日」、「防暑」
  - 不再包含「來源章節已整理成正式行程地圖」、「高級家庭旅行作戰室」或內部 marker `__SECTION_BOUNDARY__`

2026-06-28 追加 browser comments QA：

- 使用者在正式站 `/travel/202607-chongqing-yangtze-river` 針對 source section 模組提出 8 點視覺註記。
- 已依 `redesign-existing-projects` 與 `frontend-design` 做最小範圍修正，集中於 `TravelSourceSections`：
  - 去除 H1/H2 技術性 metadata。
  - H1 模組改為整卡漸變底色並移除側邊色條。
  - 每日行程 label 放大並統一顏色。
  - reminders H2 卡片於桌面寬度改為兩欄。
- 本地驗證已通過：
  - `pnpm run test:phase-9`
  - `pnpm tsc --noEmit`
  - `pnpm run build`
  - `git diff --check`
- 目前 PR：#31，待合併後需回到 Production 再做一次 `/travel/202607-chongqing-yangtze-river` 視覺回歸。

## 已知限制

- comment / thumb-up / thumb-down 目前以前台互動席位呈現；家人登入後的實際互動資料流仍依既有互動系統逐步開放。
- Production seed 仍需連線 Payload / Supabase / R2；雖已避免 media 重傳，但遇到 Supabase pooler transient disconnect 時仍需重試。
- Phase-10 的使用者角色 migration 屬並行範圍，不列入 Phase-11 變更。

## 下一階段準備

- Phase-11 已完成 Production deploy、seed、read-back 與 route smoke。
- 建議下一階段可接續：
  - 將旅行互動席位升級為可寫入的家庭留言 / reaction 流程。
  - 針對 mobile viewport 做一次完整視覺 QA。
  - 若 seed 連線仍偶發 timeout，可再把 media bulk load 改為分頁讀取，降低單次 SQL 壓力。

## Phase-11 結論

Phase-11 已完成：旅行 Version 1.1 的內容投影、頁面重組、正式站部署、Production seed / read-back、media diff seed 優化與三個核心正式路由 smoke。`202702泰國普吉島7日.md` 與 `202607重慶長江三峽8日.md` 均已依 Markdown H1 進入正式頁模組，不再以附錄形式補漏。
