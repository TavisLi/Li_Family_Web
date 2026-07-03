# Phase 14 v1.4 Media and Travel Polish 完成報告

## Phase Scope

Phase 14 v1.4 對應 Issue #40 與 Issue #41，目標是在既有 Travel / Media 架構上改善照片呈現、旅行頁資訊層級與來源章節互動控制。

本階段已交付：

- 共用 `PayloadImage` 改為保留媒體原比例，避免跨頁照片被固定容器裁切。
- 新增旅行完整照片頁 `/travel/[slug]/photos`，並在旅行詳情頁加入照片預覽與完整相簿入口。
- 調整 Travel source section 視覺層級：Level 1 轉為主題區、Level 2 轉為連續內容、Level 3 保留巢狀卡片語意。
- 每日行程標題支援 Day、日期、subtitle 三列拆分顯示。
- Travel source section 新增 comments、thumb-up、thumb-down 三項互動開關，未設定時維持既有全開行為。
- Seed content 可寫入互動開關預設值，避免既有內容在重建資料時失去互動能力。
- Phase 14 browser QA follow-up：補齊首頁、成員頁、旅行索引與旅行詳情頁的媒體容器規則，封面卡片可裁切填滿，內容照片改由圖片比例決定容器高度，並調整 Travel Level-1 / Route Index 漸層標題與卡片內容對齊。
- Phase 14 browser QA follow-up 2：補齊 Travel source section 的密度與資料配置，包括 Level 2 非表格內容改為兩欄、表格維持單欄全寬、Level 2 外框線移除、互動配置全關時不再顯示討論席、每日行程標頭改由獨立欄位控制，並讓內容圖片使用原圖 URL 與 intrinsic layout 避免被 Payload 預設尺寸裁切。
- Phase 14 browser QA follow-up 3：依 production browser annotation 微調旅行來源章節字級與對齊，包括每日行程 Day/date 字級、Level-3 標題 22px、Level-1 漸層色彩強化、注意事項 intro 改由該 Level-1 section 的 localized body 提供、不再硬編在 React 中，且該 Level-1 互動開關關閉以避免多餘討論席；來源圖片 rail 在桌機置中，以及 560px 以上非表格內容雙欄、表格全寬。

## Branch / Commit

- Branch：`codex/phase-14-v1-4-media-travel-polish`
- Implementation commit：`def6c0f Implement phase 14 media and travel polish`
- Completion report commit：本報告提交後位於同一 PR 分支 HEAD。
- Browser QA follow-up branch：`codex/fix-tavis-hero-image-fit`
- Browser QA follow-up commit：以 PR #44 最新 HEAD `Fix media frame display regressions` 為準。
- Browser QA follow-up 2 branch：`codex/phase-14-browser-qa-followup-2`
- Browser QA follow-up 2 commit：本報告提交後位於同一 PR 分支 HEAD。
- Browser QA follow-up 3 branch：`codex/phase-14-browser-qa-followup-3`
- Browser QA follow-up 3 commit：本報告提交後位於同一 PR 分支 HEAD。

## GitHub Sync / PR Status

- PR：[#43 Phase 14 v1.4 media and travel polish](https://github.com/TavisLi/Li_Family_Web/pull/43)
- PR base：`main`
- PR head：`codex/phase-14-v1-4-media-travel-polish`
- GitHub merge state：`MERGEABLE / CLEAN`
- Vercel check：`SUCCESS`
- Vercel Preview Comments check：`SUCCESS`
- PR #43 closeout：已合併至 `main`，merge commit `dfd578d2db119876c84aa98bf8a61663cc754fb2`。
- Phase 14 browser QA follow-up PR：[#44 Fix media frame display regressions](https://github.com/TavisLi/Li_Family_Web/pull/44)
- PR #44 closeout：已合併至 `main`，並作為本輪 follow-up 2 的基底。
- Phase 14 browser QA follow-up 2 PR：[#45 Phase 14 travel source QA follow-up](https://github.com/TavisLi/Li_Family_Web/pull/45)
- Phase 14 browser QA follow-up 3 PR：本報告提交與 push 後建立。

## Database / Migration 狀態

本階段包含 Payload schema 與 migration：

- `src/migrations/20260630_150145_travel_source_section_interactions.ts`
- `src/migrations/20260630_150145_travel_source_section_interactions.json`

因 Payload dev-mode schema push 曾顯示 data-loss warning，本階段沒有接受互動式 `payload migrate` prompt，而是改用受控方式確認並套用最小 SQL：

- 目標 table：`travel_projects_source_sections`
- 套用前 row count：`132`
- 套用後 row count：`132`
- 新增欄位：
  - `enable_comments boolean default true`
  - `enable_thumbs_up boolean default true`
  - `enable_thumbs_down boolean default true`
- 重複目標欄位：`0`
- 缺少目標欄位：`0`
- 既有資料值分佈：132 筆皆為 `true / true / true`
- `payload_migrations` 對應 record：`1`

調查結論：未發現欄位重複、目標表結構漂移，或本階段 migration 對既有資料造成刪除、清空、型別覆寫等破壞性影響。

Browser QA follow-up 2 另新增每日行程標頭顯示欄位：

- Migration：`src/migrations/20260701_123939_add_travel_source_section_display_title_fields.ts`
- 目標 table：`travel_projects_source_sections_locales`
- 套用前 row count：`132`
- 套用後 row count：`132`
- 新增欄位：
  - `display_day varchar null`
  - `display_date varchar null`
  - `display_subtitle varchar null`
- 重複目標欄位：`0`
- 缺少目標欄位：`0`
- 新欄位非空值分佈：132 筆既有資料皆為 `null`，未覆寫既有內容。
- `payload_migrations` 對應 record：`1`

調查結論：此次 migration 為 additive nullable 欄位，受控套用前後 row count 不變；未發現欄位重複、表結構漂移，或 Payload 為對齊 schema 而執行刪除、清空、型別覆寫等會影響既有資料的操作。

## Key Files

- `docs/superpowers/specs/2026-06-30-phase-14-v1-4-media-travel-polish-prd.md`
- `src/components/ui/payload-image.tsx`
- `src/app/(app)/travel/[slug]/photos/page.tsx`
- `src/features/travel/travel-photo-gallery.tsx`
- `src/features/travel/travel-detail-page.tsx`
- `src/features/travel/travel-source-sections.tsx`
- `src/features/travel/travel-index-page.tsx`
- `src/features/home/home-page.tsx`
- `src/features/member/member-profile-page.tsx`
- `src/features/member/member-profile-page.test.tsx`
- `src/features/travel/travel-index-page.test.tsx`
- `src/features/travel/travel-interaction-panel.tsx`
- `src/features/travel/travel-detail-page.test.tsx`
- `src/payload/collections/TravelProjects.ts`
- `src/payload/payload-types.ts`
- `src/scripts/seed-content.ts`
- `src/migrations/index.ts`
- `src/migrations/20260701_123939_add_travel_source_section_display_title_fields.ts`

## Validation Commands

Closeout 前已確認：

- `gh pr view 43 --json ...`：PR `MERGEABLE / CLEAN`，Vercel checks 通過。
- Controlled DB migration inspect/apply/verify：通過，row count 維持 `132`，目標欄位與 migration record 已存在。
- `pnpm dev` + `curl -I http://127.0.0.1:3000/travel/202602-thailand-phuket/photos`：`200 OK`。
- `curl -s http://127.0.0.1:3000/travel/202602-thailand-phuket/photos` HTML 檢查：有預期頁面內容，沒有 app error boundary。
- `git diff --check`：通過。
- `node --import tsx src/features/travel/travel-detail-page.test.tsx`：通過。
- `pnpm run test:seed-content`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過，Next.js 15.4.11 production build 成功。

Phase 14 browser QA follow-up 另已確認：

- `node --import tsx src/features/member/member-profile-page.test.tsx`：通過。
- `node --import tsx src/features/travel/travel-index-page.test.tsx`：通過。
- `node --import tsx src/features/travel/travel-detail-page.test.tsx`：通過。
- `git diff --check`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過。

Phase 14 browser QA follow-up 2 另已確認：

- Controlled DB migration inspect：套用前 row count `132`，三個目標欄位不存在、無重複欄位、migration record `0`。
- Controlled DB migration apply/verify：通過，row count 維持 `132`，三個 nullable 顯示欄位已存在，migration record `1`。
- `node --import tsx src/features/travel/travel-detail-page.test.tsx`：通過。
- `node --import tsx src/features/travel/travel-index-page.test.tsx`：通過。
- `node --import tsx src/features/member/member-profile-page.test.tsx`：通過。
- `pnpm run test:seed-content`：通過。
- `git diff --check`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過。

Phase 14 browser QA follow-up 3 另已確認：

- Controlled DB data fix inspect/apply/verify：`202607-chongqing-yangtze-river` Level-1 `注意事項` localized body 已由 `__SECTION_BOUNDARY__` 改為正式 intro 文案，該 section 的 comments、thumb-up、thumb-down 已設為 `false`，更新範圍為 1 筆 section。
- `node --import tsx src/features/travel/travel-detail-page.test.tsx`：通過。
- `node --import tsx src/features/travel/travel-index-page.test.tsx`：通過。
- `pnpm run test:seed-content`：通過。
- `git diff --check`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過。

## Browser / Runtime QA Scope

- 本輪 closeout 使用本機 Next dev server 驗證 `/travel/202602-thailand-phuket/photos` 可回應 `200`。
- HTML smoke 已確認完整照片頁有預期內容，且沒有 `Something needs attention` 或 `Application error` error boundary。
- 本輪沒有進一步做人工桌機/手機瀏覽器視覺截圖比對；視覺細節以 PR preview 與後續 review 為準。
- Browser comments follow-up 覆蓋 production 上回報的 `/member/tavis`、`/travel`、`/travel/202607-chongqing-yangtze-river` 與 `/` 視覺問題：封面/入口卡片統一使用 cover fit；source-section 內容照片使用 intrinsic layout；Travel Level-1 與 Route Index 標題改為更明確的漸層字；首頁 HubPanel 與 Travel Corridor 卡片調整對齊與比例。
- Browser comments follow-up 2 覆蓋 production 上回報的 `/travel#travel-group-planning`、`/travel#travel-group-preliminary`、`/travel/202607-chongqing-yangtze-river`：Travel group 卡片改以圖標、文案、數字橫向分區；Route Index title 去除底色與外框線後改用漸層字；每日行程標頭改由獨立欄位輸出；Level 2 內容增加兩欄資訊密度，表格維持全寬；互動配置全關時不展示討論席；內容圖片改用原圖 URL 避免衍生尺寸裁切。
- Browser comments follow-up 3 覆蓋 production 上回報的 `/travel/202607-chongqing-yangtze-river`：每日行程標題字級調整為 Day 18px、date 16px；非每日 Level-3 標題調整為 22px；Level-1 title 漸層加強；注意事項 intro 維持顯示但來源改為資料表 localized body；`__SECTION_BOUNDARY__` 保留為其他空 Level-1 section 的內部邊界佔位，不作為前台內容；注意事項 Level-1 互動開關關閉以移除多餘討論席；圖片 rail 在桌機置中；非表格文字於 560px 以上雙欄，表格仍單欄全寬。

## Known Limitations

- 工作區仍有使用者管理中的 Tavis media 素材變更，與 Phase 14 browser QA follow-up 無關，未納入本階段 commit。
- Production 視覺驗證需等 PR merge 後由 Vercel production deployment 完成再確認。
- 本階段不新增 comment/reaction collection，也不改 Cloudflare R2 儲存策略。

## Next-Phase Readiness

Phase 14 v1.4 已具備合併條件。PR #43 merge 後，下一階段可從已改善的 Travel media/gallery 與 source-section interaction flags 上延伸，例如更完整的相簿篩選、前台互動資料落地，或 Production 端旅行頁視覺 QA。
