# Phase 13 v1.3 Travel Media, Catalog Enhancement, and Project Page Beautification

## Phase Scope

本階段處理 GitHub Issue #36、#37、#38，範圍集中在 Travel catalog 與 Travel project 共用頁面：

- Issue #36：Travel project 的每段 Source Section 可獨立配置 0 張、1 張或多張照片 / YouTube media。
- Issue #37：Travel catalog feature cards 顯示各分類數量，並點擊跳轉至對應分類區塊；Route Index 與分類標題增加漸變區塊。
- Issue #38：Travel project Source Section 視覺層級調整為 Level 1 全寬區段、Level 2 卡片、Level 3 巢狀卡片；討論送出按鈕改為較輕量狀態。

## Branch / Commit

- Branch：`codex/phase-13-v1.3-travel-enhancements`
- Commit：`69ede65` (`feat(travel): enhance section media and catalog navigation`)

## GitHub Sync / PR Status

- Issue：#36、#37、#38
- Push：待本地提交完成後執行
- PR：待 push 後建立

## Delivered Features

- `TravelProjects.sourceSections` 新增 `mediaItems` relationship，可在每段 source section 選取多個 Payload Media。
- Source Section renderer 會顯示已配置的照片與 YouTube media；未配置 media 時不渲染 fallback，符合 Issue #36 的 0 張 media 行為。
- Travel catalog 移除 hero 下方獨立統計列，改由三張 feature cards 直接顯示「規劃中 / 已完成 / 前期規劃」數量。
- Feature cards 變成 anchor links，可跳轉至對應 Route Index 分類區塊。
- Route Index header 與每個分類起點加入漸變背景，讓區塊開始位置更清楚。
- Source Sections 改為 Level 1 全寬帶狀區、Level 2 卡片、Level 3 巢狀卡片，保留 `data-source-level` 供測試與 QA 查驗。
- 家人討論送出按鈕改為淺色預設，輸入文字後才加深提醒可送出。

## Key Files

- `src/payload/collections/TravelProjects.ts`
- `src/payload/payload-types.ts`
- `src/features/travel/travel-index-page.tsx`
- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-interaction-panel.tsx`
- `src/features/travel/travel-index-page.test.tsx`
- `src/features/travel/travel-detail-page.test.tsx`

## Validation Commands

- `pnpm exec payload generate:types`：通過
- `pnpm exec tsx src/features/travel/travel-index-page.test.tsx`：通過
- `pnpm exec tsx src/features/travel/travel-detail-page.test.tsx`：通過
- `git diff --check`：通過
- `pnpm run build`：通過
- `pnpm tsc --noEmit`：通過

補充：曾有一次 `pnpm tsc --noEmit` 與 `pnpm run build` 並行執行時，因 `.next/types` 正在重建而出現暫時性缺檔錯誤；build 完成後單獨重跑 `pnpm tsc --noEmit` 已通過。

## Browser QA Scope

- 本機 dev server：`pnpm dev`
- HTTP smoke：
  - `GET /travel`：200，HTML 內確認 feature card anchors、三個分類區塊與 Route Index 文案。
  - `GET /travel/202702-thailand-phuket`：200，HTML 內確認 `data-source-level`、旅行內容與討論席標記。

Playwright browser automation 未完成：Playwright bundled Chromium 未安裝；改用本機 Chrome channel 時，Chrome 在目前沙盒權限下以 `SIGABRT / EPERM` 結束。已改以 build、component tests、HTTP route smoke 作為本輪驗證證據。

## Known Limitations

- `pnpm exec payload migrate:create` 在目前 Node.js v26.3.1 環境下失敗，錯誤為 `ENOENT: no such file or directory, open 'node:crypto?tsx-namespace=...'`。本次新增的 nested relationship 使用既有 `travel_projects_rels` relationship 儲存模型，未觀察到缺資料表或缺欄位錯誤；但仍建議在 team 標準 Node 版本下補跑 migration generation，以確認是否產生 no-op 或 schema snapshot。
- 本輪未修改既有 seed import，使 source section media 的實際內容配置先由 Payload Admin 手動選取；未做自動從 content-source manifest 回填 `mediaItems`。
- 未登入模式下 detail page 顯示 locked discussion slot；已驗證 HTML 標記存在，但未做登入家人 session 的互動提交瀏覽器測試。
- 工作區在本階段開始前已有 Tavis member media 與 `.agents/.claude/skills` 等未提交變更；本階段未納入也未還原。

## Next-Phase Readiness

- Travel catalog 與 Travel project 共用頁已具備 v1.3 所需 UI 與 schema 支撐。
- 下一步建議在標準 Node 版本環境補跑 migration generation，並視需要將 content-source asset manifest 的 `sectionId` 自動映射到 `sourceSections.mediaItems`，降低 Payload Admin 手動配置成本。
