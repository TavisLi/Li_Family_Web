# Phase 13 v1.3 Travel Media, Catalog Enhancement, and Project Page Beautification

## Phase Scope

本階段處理 GitHub Issue #36、#37、#38，範圍集中在 Travel catalog 與 Travel project 共用頁面：

- Issue #36：Travel project 的每段 Source Section 可獨立配置 0 張、1 張或多張照片 / YouTube media。
- Issue #37：Travel catalog feature cards 顯示各分類數量，並點擊跳轉至對應分類區塊；Route Index 與分類標題增加漸變區塊。
- Issue #38：Travel project Source Section 視覺層級調整為 Level 1 全寬區段、Level 2 卡片、Level 3 巢狀卡片；討論送出按鈕改為較輕量狀態。

## Branch / Commit

- Branch：`codex/phase-13-v1.3-travel-enhancements`
- Implementation commit：`4e7f085` (`feat(travel): enhance section media and catalog navigation`)
- Node / migration / manifest sync commit：本報告更新提交

## GitHub Sync / PR Status

- Issue：#36、#37、#38
- Push：已推送 `codex/phase-13-v1.3-travel-enhancements`
- PR：#39 https://github.com/TavisLi/Li_Family_Web/pull/39

## Delivered Features

- `TravelProjects.sourceSections` 新增 `mediaItems` relationship，可在每段 source section 選取多個 Payload Media。
- Source Section renderer 會顯示已配置的照片與 YouTube media；未配置 media 時不渲染 fallback，符合 Issue #36 的 0 張 media 行為。
- content-source asset manifest 的 `sectionId` 會在 seed travel project 時自動映射到同 anchor 的 `sourceSections.mediaItems`，降低 Payload Admin 逐段手動選圖成本。
- Travel catalog 移除 hero 下方獨立統計列，改由三張 feature cards 直接顯示「規劃中 / 已完成 / 前期規劃」數量。
- Feature cards 變成 anchor links，可跳轉至對應 Route Index 分類區塊。
- Route Index header 與每個分類起點加入漸變背景，讓區塊開始位置更清楚。
- Source Sections 改為 Level 1 全寬帶狀區、Level 2 卡片、Level 3 巢狀卡片，保留 `data-source-level` 供測試與 QA 查驗。
- 家人討論送出按鈕改為淺色預設，輸入文字後才加深提醒可送出。
- 專案 Node 版本固定為 `20.20.2`，`package.json` engines 收斂到 `>=20.9.0 <21`，避免 Node 24/26 觸發 Payload migration CLI 的 `node:crypto?tsx-namespace` 相容性問題。
- 依使用者要求，本輪前既有的 Tavis member media、`.agents/`、`.claude/skills/` 與 `skills-lock.json` 變更已納入同一 PR。

## Key Files

- `.nvmrc`
- `.node-version`
- `package.json`
- `README.md`
- `docs/README.md`
- `src/payload/collections/TravelProjects.ts`
- `src/payload/payload-types.ts`
- `src/features/travel/travel-index-page.tsx`
- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-interaction-panel.tsx`
- `src/features/travel/travel-index-page.test.tsx`
- `src/features/travel/travel-detail-page.test.tsx`
- `src/scripts/travel-section-media.ts`
- `src/scripts/travel-section-media.test.ts`
- `src/scripts/seed.ts`
- `src/migrations/20260629_144118_add_travel_source_section_media.ts`
- `src/migrations/20260629_144118_add_travel_source_section_media.json`
- `src/migrations/index.ts`

## Validation Commands

- `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm exec payload migrate:create add-travel-source-section-media --skip-empty --force-accept-warning`：通過，產生 schema snapshot 與 no-op migration
- `pnpm exec payload generate:types`：通過
- `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm exec tsx src/scripts/travel-section-media.test.ts`：通過
- `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm exec tsx src/scripts/seed-content.test.ts`：通過
- `pnpm exec tsx src/features/travel/travel-index-page.test.tsx`：通過
- `pnpm exec tsx src/features/travel/travel-detail-page.test.tsx`：通過
- `git diff --check`：通過
- `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm run build`：通過
- `PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm tsc --noEmit`：通過

補充：曾有一次 `pnpm tsc --noEmit` 與 `pnpm run build` 並行執行時，因 `.next/types` 正在重建而出現暫時性缺檔錯誤；build 完成後單獨重跑 `pnpm tsc --noEmit` 已通過。

## Browser QA Scope

- 本機 dev server：`pnpm dev`
- HTTP smoke：
  - `GET /travel`：200，HTML 內確認 feature card anchors、三個分類區塊與 Route Index 文案。
  - `GET /travel/202702-thailand-phuket`：200，HTML 內確認 `data-source-level`、旅行內容與討論席標記。

Playwright browser automation 未完成：Playwright bundled Chromium 未安裝；改用本機 Chrome channel 時，Chrome 在目前沙盒權限下以 `SIGABRT / EPERM` 結束。已改以 build、component tests、HTTP route smoke 作為本輪驗證證據。

## Known Limitations

- Node.js v26.3.1 仍不適合本專案 Payload migration workflow；請使用 repo 固定的 Node `20.20.2` 或至少 Payload v3 要求的 Node `20.9.0+` 且小於 21 的版本。
- migration generation 已在 Node `20.20.2` 環境補跑成功；本次 nested relationship 使用既有 relationship 儲存結構，因此產生 no-op migration 與 schema snapshot。
- `sectionId` 自動映射目前只在 seed 流程處理 content-source manifest 已標記的資產；Payload Admin 內後續人工新增的 media 仍可手動覆寫或補選。
- 未登入模式下 detail page 顯示 locked discussion slot；已驗證 HTML 標記存在，但未做登入家人 session 的互動提交瀏覽器測試。
- Browser automation 仍受本機沙盒限制；Playwright bundled Chromium 未安裝，local Chrome channel 在目前權限下以 `SIGABRT / EPERM` 結束。

## Next-Phase Readiness

- Travel catalog 與 Travel project 共用頁已具備 v1.3 所需 UI 與 schema 支撐。
- 下一步可在 PR review 後合併，並在需要重建 seed content 時直接利用 manifest `sectionId` 到 `sourceSections.mediaItems` 的自動映射。
