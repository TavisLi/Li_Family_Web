# Phase 15 v1.5 旅遊規劃版面完成報告

## 階段範圍

本階段處理 GitHub Issue #47-#50，範圍限於 Travel project 規劃中頁面的 source section 呈現、planning travel seed 冗餘資料控制，以及新增規劃中旅遊 Markdown template。

- #47：注意事項中的短內容在 PC/Mac 橫向空間足夠時，以雙欄掃讀；後續人工 review 補充規則為落單項目維持單欄。
- #48：Level 1 若配置 body，旅行戰情室與注意事項的 body 顯示方式需要一致。
- #49：Travel Project 多處文字在橫向空間足夠時不應不正常換行，尤其長建議與方案比較文字。
- #50：針對 `202607-chongqing-yangtze-river`、`202702-thailand-phuket` 的 planning travel 結構，先做安全的 schema/data 重構切面：保留 Payload 相容欄位，不做破壞性 migration；停止 seed import 寫入可由標題推導的 daily display 冗餘資料，並新增後續 planning travel Markdown template。

## 分支與提交

- Branch: `codex/phase-15-v1-5`
- Pull Request: https://github.com/TavisLi/Li_Family_Web/pull/51
- PR commits covered by this report:
  - `c7b1f86 Fix travel planning source layout`
  - `1cc8288 Document phase 15 travel planning completion`
  - `d76717d Update phase 15 PR status`
  - `451a838 Refine adaptive travel section columns`
  - `9c8cd57 Avoid orphaned compact travel columns`
  - `c809079 Keep compact travel copy readable`
- Review follow-up: 本報告與 planning travel template 的修正位於本報告所在後續 commit，推送後同屬 PR #51。

## GitHub 與 Vercel 狀態

- Branch 已 push 至 `origin/codex/phase-15-v1-5`。
- PR 已建立且仍為 open：#51 `Phase 15 v1.5 travel planning layout`。
- PR body 已設定自動關閉 #47、#48、#49，並以 non-destructive schema/data refactor 方式標註 `Addresses #50`。
- 2026-07-05 最新功能 commit `c809079` 的 Vercel check 已通過。
- 受保護 Preview 曾透過 Vercel connector 驗證 `/travel/202607-chongqing-yangtze-river` 回應 `200 OK`。

## 已交付內容

1. Travel source body renderer 改為 block-aware layout：
   - 複雜表格、長段落、含 URL、含比較資訊或方案比較的段落保持 full width。
   - 欄位少、內容簡短且不易造成換行的表格可在 PC/Mac 雙欄呈現。
   - 短段落與短列表在桌面寬度可雙欄；無法配對的落單短段落維持單欄。
   - 半欄 section 內部固定單欄，避免外層半欄後又被內層二次切欄造成不必要換行。
2. Level 1 intro 統一：
   - `旅行戰情室` 與 `注意事項` 的 body 都使用較寬的說明區與左側導引線。
   - dark reminder tone 與 light planning tone 保持視覺區分。
3. 注意事項區塊調整：
   - PC/Mac 下短項目可雙欄。
   - 深色提醒區的奇數短項目採前段單欄、後續成對並列，避免最後一個短項目被擠在半欄中。
4. seed import 不再寫入 `displayDay`、`displayDate`、`displaySubtitle` 這類可由 daily heading 推導的資料，降低新 planning travel record 冗餘。
5. 新增並修正 planning travel Markdown template：
   - 以 `# 旅行戰情室` 作為 Level 1 起點，符合現有 planning travel source shape。
   - 明確提醒需先更新 `docs/travel-projects.md`。
   - Canonical slug placeholder 改為 `YYYYMM-short-location-or-theme`。
6. 新增 Phase 15 v1.5 PRD，記錄問題、方案、user stories、implementation/testing decisions 與 out-of-scope。

## 關鍵檔案

- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-detail-page.test.tsx`
- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`
- `docs/templates/planning-travel-source-template.md`
- `docs/travel-content-source-guidelines.md`
- `docs/superpowers/specs/2026-07-05-phase-15-v1-5-travel-planning-layout-prd.md`

## 驗證命令

已通過：

```bash
pnpm exec tsx src/features/travel/travel-detail-page.test.tsx
pnpm run test:seed-content
pnpm tsc --noEmit
pnpm run build
git diff --check
```

驗證備註：

- TypeScript 與 build 以專案標準 Node `20.20.2` 執行。
- 本階段未修改 Payload collection，因此未執行 `pnpm exec payload generate:types` 或 migration。
- Vercel Preview 已完成部署並通過 PR check。

## Browser QA 範圍

- 本階段已用 server-side render regression test 覆蓋 Travel source section HTML seam。
- 已在 Chrome 打開最新 Preview 供人工 review：
  - `/travel/202607-chongqing-yangtze-river`
- 人工 review 重點：
  - `旅行戰情室` Level 1 body 是否不再不必要換行。
  - `注意事項` 中防暑、老人小孩、登船、游輪注意事項的單欄/雙欄是否符合 PC/Mac 閱讀密度。
  - `三峽人家費用估算`、`宜昌段住宿與交通` 等短表格雙欄是否可讀。
  - `三峽人家交通方案` 長建議是否保持 full width。

## 已知限制

- #50 的破壞性資料庫清理沒有在本階段執行。原因是現有 published content 可能仍含舊欄位資料；本階段採保守路線，保留相容欄位，先停止未來 seed 產生冗餘資料。若未來要 drop 欄位或清 production data，需要獨立 migration PR 與 production 資料驗證。
- Issue #47 原文提到 Level 3；實際 `202607-chongqing-yangtze-river` 注意事項目前多為 Level 2。此階段主要修正實際 planning source 中的注意事項短 section。nested Level 3 仍維持在父 section 內，避免破壞含表格、media 或 daily child 的閱讀結構。
- 本地工作樹仍有非本 phase 的 Tavis member asset 變更，未納入 commit：
  - `content-source/assets/members/tavis/tavis-hero.jpeg` deleted
  - `content-source/assets/members/tavis/tavis-career-inotera-dept-2.jpeg`
  - `content-source/assets/members/tavis/tavis-hero - 1 (1).jpeg`
  - `content-source/assets/members/tavis/tavis-hero - 1.jpeg`
  - `content-source/assets/members/tavis/tavis-hero..jpeg`

## 下一階段準備度

- Travel renderer seam 已經更深，後續新增 planning travel 不需要再為短文/長文排版做逐頁修正。
- 新 template 可作為下一個 planning travel source 的起點，並與 travel catalog / seed import contract 對齊。
- 若團隊決定進一步清除 Payload redundant columns/data，建議另開 production-safe migration phase，先 audit records、再產生 migration、最後在 Preview/production 明確驗證 row count、欄位狀態與 migration record。
