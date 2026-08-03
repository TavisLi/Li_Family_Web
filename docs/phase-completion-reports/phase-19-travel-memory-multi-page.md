# Phase 19 Completion Report — Travel Memory 多頁回憶

日期：2026-08-02

更新：2026-08-03 — 補記 Draft PR、Neon Free Preview PostgreSQL、Vercel Preview deployment 與 rendered HTML QA。

狀態：Draft PR／Preview verified；Merged、Production verified、Closed 尚未授權

## Scope／Out of scope

本 Phase 在同一個 style-neutral Memory／Day／Moment／Placement 模型上交付三種可配置視覺樣式、每日章節、caption placement、每日 YouTube placement、相簿回鏈、access-aware data layer、additive migration 與 local rollout evidence。

已執行 Draft PR、專用 Preview PostgreSQL、Preview deployment 與 Preview HTML QA。

未執行 Production read、Production schema migration、Production content/media write、runtime cutover、legacy cleanup、merge 或 Issue closeout。

## Branch／Commit／PR／Merge

- Branch：`codex/phase-19-travel-memory-prototype`
- Implementation commit：`890d7d8`（`feat(travel): implement phase 19 memory pages`）
- Review-fix commit：`cf866b3`（`fix(travel): address phase 19 review gaps`）
- Preview rebuild commits：
  - `1740b7b`（`chore(travel): trigger phase 19 preview rebuild`）
  - `f0ce886`（`chore(travel): rebuild preview with canonical url`）
- Current PR HEAD：`f0ce8863ea1335df38a6670835acabc6c997471a`
- Base：`main` at `d0ba20a`
- PR：[#83](https://github.com/TavisLi/Li_Family_Web/pull/83)（Draft）
- Latest Preview deployment：`dpl_BjJRA9jJwbUXdksucBnPuY2tLNpX`
- Preview URL：`https://li-family-web-git-codex-phase-19-tra-8a086f-tavis-li-s-projects.vercel.app`
- Merge：未執行。

## Delivered work

- GitHub canonical PRD #73 與九個 vertical slices #74–#82 已發布、回讀並標記 `ready-for-agent`。
- `travel-memories.presentationStyle` 支援三個固定值與 deterministic fallback。
- 三筆現存 Memory 的受控 backfill 配對已鎖定，但尚未寫入任何 shared／Production database。
- 三筆現存 Memory 的初始 style 配對已寫入專用 Neon Preview DB 做 QA read-back；尚未寫入 Production。
- 新增可獨立發布與版本化的 `travel-memory-days`；Moment／photo／YouTube placement 具穩定 identity。
- 正式 Overview／Day／Photos route-facing view models、access-aware data reads 與 exhaustive renderer registry。
- 海南來源投影證明 8 Days、11 張 itinerary photos、Day 3／Day 8 的時間、Moment 與可見 caption。
- 具日期的 Phuket YouTube 來源可分配至每日章節；缺乏日期的 East Australia 6 筆影片保持 unassigned，不猜測。
- Gallery 可按 Day／location 篩選並分頁；未分類 legacy gallery photos 明確保留，已定位照片可返回所屬 Moment。
- Overview 與單日 route 使用 bounded Payload selects；單日只深層讀取目標 Day。
- Backfill planner 納入既有 Day inventory 與 Base／Source／Current，能分類 create／update／preserve／conflict／skip，避免重跑重複 create。
- Populated Media relationship 會正規化為 ID，避免重跑時產生假 conflict。
- Day／Gallery 先通過 owning Memory access，再讀 child；family-only／draft owner 不可見時不執行 child query。
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED` 為 server-only rollback gate；無新 Days 時 Overview／Photos 保留 legacy renderer。

## Key files

- `docs/adr/0009-travel-memory-pages-share-one-content-model.md`
- `src/payload/collections/TravelMemoryDays.ts`
- `src/lib/travel-memory.ts`
- `src/lib/data/travel.ts`
- `src/features/travel/travel-memory-pages.tsx`
- `src/scripts/travel-memory-day-projections.ts`
- `src/scripts/phase19-travel-memory-backfill.ts`
- `src/migrations/20260802_061812_phase_19_travel_memory_multi_page.ts`

## Validation

| 驗證 | 結果 |
| --- | --- |
| `pnpm run test:phase-19`（Node 20.20.2） | Pass |
| `pnpm run build`（Node 20.20.2） | Pass |
| `pnpm tsc --noEmit` after build | Pass |
| `git diff --check`／`git diff --cached --check` | Pass |
| Disposable PostgreSQL 17 `up → down → up` | Pass |
| Migration read-back | 12 tables；nullable style；0 Day rows；RLS enabled；0 direct Data API grants |
| Playwright local prototype QA | Pass；3 styles；Day 3／8；desktop＋390px mobile；0 console errors |
| Standards＋specification re-review | Pass；沒有仍 actionable 的 P0–P2 finding |
| Vercel Preview check | Pass；`dpl_BjJRA9jJwbUXdksucBnPuY2tLNpX` READY／SUCCESS |
| Preview HTML QA | Pass；海南 Day 3／Day 8 caption、Phuket YouTube slice、canonical／OG Preview host |
| Preview DB read-back | Pass；三種 style assignment、海南 Day 3／8 placements、Phuket Day 1／2 YouTube placements |

Browser、migration 與 Preview 詳細證據分別位於：

- `docs/phase-artifacts/travel-memory-multi-page/phase-19-browser-qa.md`
- `docs/phase-artifacts/travel-memory-multi-page/phase-19-migration-rehearsal.md`
- `docs/phase-artifacts/travel-memory-multi-page/phase-19-preview-qa.md`

## Migration／Data／Read-back

- Migration：已生成、人工審查並在 disposable PostgreSQL 排演；只新增 schema，不回填內容。
- Preview DB：Neon Free 專用 PostgreSQL；project `little-surf-04196525`；branch `br-royal-morning-afhkbilm`；database `neondb`。
- Data：controlled backfill planner 與 reconciliation tests 已完成；最小 QA dataset 已寫入 Preview DB；未寫入 Production。
- Production inventory/read-back：未授權，因此未執行。
- Disposable container：排演後已移除；其資料不可恢復，但只包含最小基線與零內容列的測試 schema。

## Known limitations／Blockers

- Preview DB 是最小 QA dataset，不是完整 Production-like seed。
- 未執行 R2/media write；HTML placement、caption、metadata 已驗證，但圖片 binary 供應不作為本輪完成證據。
- `202308-east-australia` overview 目前沒有 `data-travel-memory-style` marker；style 配置以 Preview DB read-back 作為證據。
- East Australia 的 6 個 YouTube 標題沒有可驗證日期，依 contract 保持 unassigned；需由 Admin 或來源資料補足 Day。
- Hainan source 目前沒有 YouTube URL；YouTube slice QA 使用 Phuket Day 1／Day 2 的真實來源。
- Supabase Preview check 為 `SKIPPED`，符合本輪改用 Neon Free 專用 Preview PostgreSQL 的決策。
- Vercel build logs 顯示 Node 20 deprecation warning；2026-10-01 後 Vercel 將要求調整 Node 設定，建議另列 tech debt。
- Production schema、content write、runtime cutover、merge 與 closeout 都是獨立 HITL gate。

## Rollback

- Runtime 未切換；server-only flag 保持關閉即繼續使用 legacy renderer。
- Schema 尚未進 Production。日後若 schema 已上但 content backfill 未執行，可使用已排演的 `down`。
- Backfill 後不得直接 rollback schema；須先另案處理資料與關聯。
- Legacy arrays、relationships 與 source evidence 完整保留。
- Preview DB 可直接丟棄，不影響 Production。

## Issue closeout

- #73–#82 維持 OPEN。
- #74–#79 已具本地與 Preview evidence，但尚未經 H10 接受，不提前關閉。
- #80、#81、#82 分別等待 Production schema、controlled backfill、runtime cutover 的獨立批准。

## Next-phase readiness

目前已達 Draft PR + Preview verified。下一個 HITL 決策是是否將 PR #83 由 Draft 轉 Ready for review，或保留 Draft 先人工檢視 Preview。Merge、Production migration、Production backfill、runtime cutover 與 Issue closeout 仍需獨立批准。
