# Phase 15 v1.5 Travel Project Planning Layout Completion Report

## Phase Scope

本階段處理 GitHub Issue #47-#50，範圍限於 Travel project 規劃中頁面的 source section 呈現、planning travel seed 冗餘資料控制，以及新增規劃中旅遊 Markdown template。

- #47：注意事項 Level 3 相關內容，短文字在 PC/Mac 橫向空間足夠時以兩欄掃讀。
- #48：Level 1 若配置 body，旅行戰情室與注意事項的 body 顯示方式需要一致。
- #49：Travel Project 多處文字在橫向空間足夠時不應不正常換行，尤其長建議與方案比較文字。
- #50：針對 `202607-chongqing-yangtze-river`、`202702-thailand-phuket` 的 planning travel 結構，先做安全的 schema/data 重構切面：保留 Payload 相容欄位，不做破壞性 migration；停止 seed import 寫入可由標題推導的 daily display 冗餘資料，並新增後續 planning travel Markdown template。

## Branch / Commit

- Branch: `codex/phase-15-v1-5`
- Implementation commit: `c7b1f86 Fix travel planning source layout`
- Completion report commit: 本報告所在 commit

## GitHub Sync / PR Status

- 截至本報告初稿：尚未 push，尚未建立 PR。
- 本階段完成條件要求 push 與 PR；會在本報告提交後繼續執行。

## Delivered Features

1. Travel source body renderer 改為 block-aware layout：
   - table 永遠 full width。
   - 長段落、含 URL、含比較資訊或方案比較的段落 full width。
   - 短段落與短列表在桌面寬度可維持雙欄。
2. 注意事項 Level 1 intro 改為和一般 Level 1 intro 對齊的窄欄說明型呈現，只保留 dark reminder tone 的差異。
3. seed import 不再寫入 `displayDay`、`displayDate`、`displaySubtitle` 這類可由 daily heading 推導的資料，降低新 planning travel record 冗餘。
4. 新增 planning travel Markdown template，後續新增規劃中旅遊可從 template 進入 seed pipeline 或 Payload Admin 整理流程。
5. 新增 Phase 15 v1.5 PRD，記錄問題、方案、user stories、implementation/testing decisions 與 out-of-scope。
6. 依 `improve-codebase-architecture` 產出 temp architecture report：
   - `/private/tmp/architecture-review-20260705194612.html`

## Key Files

- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-detail-page.test.tsx`
- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`
- `docs/templates/planning-travel-source-template.md`
- `docs/travel-content-source-guidelines.md`
- `docs/superpowers/specs/2026-07-05-phase-15-v1-5-travel-planning-layout-prd.md`

## Validation Commands

已通過：

```bash
node --import tsx src/features/travel/travel-detail-page.test.tsx
pnpm run test:seed-content
pnpm tsc --noEmit
pnpm run build
git diff --check
```

備註：`pnpm` 指令在目前 shell 顯示 Node engine warning，因為執行環境是 Node `v24.14.0`，而專案偏好 `>=20.9.0 <21`。上述命令仍全部通過；本階段未修改 Payload collection，因此未執行 `pnpm exec payload generate:types` 或 migration。

## Browser QA Scope

- 本階段已用 server-side render regression test 覆蓋 Travel source section HTML seam。
- 尚未啟動本機 browser QA 或 Playwright screenshot；若 PR review 需要，建議在 Preview deployment 檢查：
  - `/travel/202607-chongqing-yangtze-river`
  - `/travel/202702-thailand-phuket`
  - desktop PC/Mac 寬度下的注意事項、旅行戰情室、三峽人家交通方案等段落。

## Known Limitations

- #50 的破壞性資料庫清理沒有在本階段執行。原因是現有 published content 可能仍含舊欄位資料；本階段採用 senior database architecture 的保守路線：保留相容欄位，先停止未來 seed 產生冗餘資料。若未來要 drop 欄位或清 production data，需要獨立 migration PR 與 production 資料驗證。
- 本地工作樹仍有非本 phase 的 Tavis member asset 變更，未納入 commit：
  - `content-source/assets/members/tavis/tavis-hero.jpeg` deleted
  - `content-source/assets/members/tavis/tavis-career-inotera-dept-2.jpeg`
  - `content-source/assets/members/tavis/tavis-hero - 1 (1).jpeg`
  - `content-source/assets/members/tavis/tavis-hero - 1.jpeg`
  - `content-source/assets/members/tavis/tavis-hero..jpeg`

## Next-Phase Readiness

- Travel renderer seam 已經更深，後續新增 planning travel 不需要再為短文/長文排版做逐頁修正。
- 新 template 可作為下一個 planning travel source 的起點。
- 若團隊決定進一步清除 Payload redundant columns/data，建議另開一個 production-safe migration phase，先 audit records、再產生 migration、最後在 Preview/production 明確驗證 row count、欄位狀態與 migration record。
