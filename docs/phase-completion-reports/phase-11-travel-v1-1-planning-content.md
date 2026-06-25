# Phase 11 完成報告：Version 1.1 旅行規劃內容完整發布

日期：2026-06-25
階段名稱：Phase-11 / Version 1.1 Travel Planning Content
目前 PR 分支：`codex/phase-11-travel-v1-1`
本階段主要提交：`42bdbeb feat(travel): publish full planning itineraries`
報告提交：`3d74434 docs: add phase 11 completion report`
GitHub Draft PR：[#22](https://github.com/TavisLi/Li_Family_Web/pull/22)
關聯 GitHub Issues：#15、#16、#17、#18

## 本階段範圍

Phase-11 將 Version 1.1 的重點放在旅行系統，尤其是「202702 泰國普吉島 7 日」與「202607 重慶長江三峽 8 日」兩個規劃中旅程。核心要求是：`content-source/travels/202702泰國普吉島7日.md` 內所有內容都必須能在正式旅行網頁上被看見，且不得建立一次性固定頁面。

本階段採用既有架構：內容來源仍在 `content-source/`，經 seed parser 轉成 Payload `TravelProjects` 發布資料，再由共用 `/travel/[slug]` 路由呈現。

## 已交付內容

- 新增 `TravelProjects.sourceSections` 欄位，忠實保存旅行 Markdown 的章節、表格、清單、提醒與外部連結。
- `/travel/[slug]` 共用詳情頁新增「完整來源內容」區塊，確保 202702 普吉島來源文件不再只呈現摘要或部分結構欄位。
- `202702-thailand-phuket` 已保留並呈現：
  - 外部網站連結
  - 航班資訊
  - 住宿安排與住宿權益
  - 7 日每日行程
  - 補充細節、待確認項目、取消／改期政策與提醒
- `202607-chongqing-yangtze-river` 已補強結構化解析：
  - 8 日每日行程
  - 航班、高鐵、住宿與游輪艙房
  - 費用項目
  - 餐食推薦
  - 可選／自費項目
  - 實用 APP、重要提醒與完整來源章節
- 旅行目錄頁改為「規劃中旅程」與「已完成旅程」分組，保留 canonical slug route 與缺圖 ImageFallback。
- `seed:audit` 擴充為可盤點每個 travel slug 的 route path、source section count、結構化內容與媒體 coverage。
- 新增前台與 seed 回歸測試，確保旅行內容投影、目錄分組、完整來源內容與結構化規劃資料不會回退。

## 核心檔案

- `src/scripts/seed-content.ts`
  - 新增 `sourceSections`、`foodRecommendations`、`costItems`、`optionalActivities` 解析。
- `src/payload/collections/TravelProjects.ts`
  - 新增 `sourceSections` Payload 欄位。
- `src/payload/payload-types.ts`
  - 已重新產生 Payload types。
- `src/features/travel/travel-source-sections.tsx`
  - 新增完整 Markdown 來源章節呈現。
- `src/features/travel/travel-planning-extras.tsx`
  - 新增費用、餐食與可選／自費項目呈現。
- `src/features/travel/travel-detail-page.tsx`
  - 將完整來源內容與規劃補充區接入共用旅行詳情頁。
- `src/features/travel/travel-index-page.tsx`
  - 將旅行目錄分為規劃中與已完成。
- `src/scripts/seed-audit.ts`
  - 新增 route/sourceSections coverage gate。
- `src/scripts/seed-content.test.ts`
  - 驗證 202702 與 202607 來源內容完整投影。
- `src/features/travel/travel-detail-page.test.tsx`
  - 驗證完整來源內容與規劃補充資料呈現。
- `src/features/travel/travel-index-page.test.tsx`
  - 驗證旅行目錄分組與 route link。

## 驗證紀錄

以下驗證已於本機通過：

- `pnpm run test:phase-9`
- `pnpm tsc --noEmit`
- `pnpm run build`
- `pnpm run seed:audit`
- `git diff --check`
- `git diff --cached --check`

`pnpm run seed:audit` 結果顯示 5 個 travel slug 均具備來源文件、route path、封面媒體與結構化內容；`missingTravelRecords`、`missingCoverMedia`、`missingStructuredContent`、`missingSourceSections`、`missingRoutePaths` 皆為空陣列。

## 瀏覽器 QA 範圍

本階段已完成 build-level route 驗證與 server-render component 回歸測試，並確認 Next.js production build 可產生：

- `/travel`
- `/travel/[slug]`

尚未在本回合啟動本機 dev server 進行真人互動式瀏覽器 QA；原因是本階段的主要可驗收面是 source → seed → Payload type → shared route render 的資料鏈路，且目前尚未執行新的正式環境 seed / deployment。

建議下一步在 Node/Payload migration 問題處理完後，針對以下路由補做桌機與行動版瀏覽器 QA：

- `/travel/202702-thailand-phuket`
- `/travel/202607-chongqing-yangtze-river`
- `/travel`

## 已知限制與阻塞

### 1. Payload migration 尚未產生

本階段新增了 Payload Collection 欄位 `sourceSections`，已完成 `pnpm exec payload generate:types`，但 `pnpm exec payload migrate:create travel-source-sections` 在目前環境失敗。

錯誤摘要：

```text
Error creating migration: ENOENT: no such file or directory, open 'node:crypto?tsx-namespace=...'
```

目前可用 Node 為 `v26.3.1`，推測是 Payload CLI / tsx loader 在 Node 26 下解析 `node:` builtin namespace query 的相容性問題。此階段不手寫資料庫 migration，以避免違反 Payload schema-first 流程。

建議在 Node 20 或 Node 22 環境重跑：

```bash
pnpm exec payload migrate:create travel-source-sections
```

### 2. 尚未執行正式環境 seed / read-back

Phase-11 已完成本地 source coverage、build 與 audit，但尚未對 Production Payload / R2 執行寫入。依 Phase-9 的安全原則，正式環境異動仍需明確授權後才能執行。

### 3. GitHub push / PR 已完成，Production 尚未部署

本階段已推送至 `codex/phase-11-travel-v1-1`，並建立 Draft PR [#22](https://github.com/TavisLi/Li_Family_Web/pull/22)。Production 部署與正式 seed 仍需等待 Payload migration 產生並套用後再執行。

## GitHub 與發佈狀態

- GitHub Issues：#15、#16、#17、#18 的本地實作已完成，但尚未由本回合自動關閉。
- 本地 commit：`42bdbeb feat(travel): publish full planning itineraries`
- Completion report commit：`3d74434 docs: add phase 11 completion report`
- 目前 PR 分支：`codex/phase-11-travel-v1-1`
- 推送狀態：已 push 至 GitHub
- PR 狀態：Draft PR [#22](https://github.com/TavisLi/Li_Family_Web/pull/22)
- Production 發佈：尚未部署本階段變更

## 下一階段準備

建議 Phase-11 後續收尾順序：

1. 切換到 Node 20/22，產生 `travel-source-sections` migration。
2. 重新執行：
   - `pnpm exec payload generate:types`
   - `pnpm tsc --noEmit`
   - `pnpm run build`
   - `pnpm run test:phase-9`
3. 在明確授權下執行 Production dry-run / seed / read-back。
4. 對 `/travel`、`/travel/202702-thailand-phuket`、`/travel/202607-chongqing-yangtze-river` 做桌機與手機瀏覽器 QA。
5. PR #22 通過 review 並合併後，再視情況關閉 #15、#16、#17、#18。

## Phase-11 結論

Phase-11 的本地產品能力已完成：202702 普吉島與 202607 重慶三峽的旅行來源內容都已能透過 seed 進入 Payload 發布模型，並由共用旅行頁呈現；旅行目錄與 coverage audit 也已補強。

此階段尚未視為正式 Production 完成，原因是 Payload migration、Production seed / read-back、瀏覽器 QA、push / PR 仍需後續授權與環境處理。
