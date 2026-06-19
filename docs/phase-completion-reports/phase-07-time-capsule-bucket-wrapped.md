# Phase 07 交接報告：時空膠囊、共同願望清單與年度時光報告

## Phase 範圍

Phase-7 目標是完成三個長期情感模組的 MVP，並接回首頁家人模式入口：

- `/timeline`：時空膠囊大事記，支援年份瀏覽與 public/private filtering。
- `/bucket-list`：家庭共同願望看板，支援新增、移動狀態、完成願望。
- `/wrapped`：年度時光報告，支援發布季故事頁與非發布季預告頁。
- 首頁接回 Time Machine Widget、Bucket List Quick View、Wrapped seasonal CTA。

## Branch / Commit

- Branch：`codex/phase-7-time-capsule-bucket-wrapped`
- Implementation commit：`7f4df94`（`Implement phase 7 time capsule modules`）
- Report commit：本報告提交後位於同一分支 HEAD。

## GitHub Sync / PR 狀態

- 本地 implementation commit 已建立。
- 尚未推送 GitHub，尚未建立 PR。
- PR blocker：Payload migration/遠端 Supabase schema 尚未成功套用 Phase-7 新 collections，因此 seed data 與 browser QA 無法完成。詳見「已知限制與阻塞」。

## 已交付功能

- 新增 Payload collections：
  - `TimelineEvents`
  - `BucketItems`
  - `WrappedSnapshots`
- 已重新生成 `src/payload/payload-types.ts`，前台與資料層使用 Payload generated types。
- 新增 `src/lib/data/` 資料層：
  - `timeline.ts`
  - `bucket-list.ts`
  - `wrapped.ts`
  - `phase-7-domain.ts`
- 新增 domain test：年份分組、bucket summary、wrapped 發布季判斷、bucket 完成建立 timeline event payload。
- 新增 `/timeline` route：
  - 年份 segmented controls。
  - 分頁式事件查詢架構。
  - 訪客只讀 public event，家人模式讀 private/full event。
  - 缺圖使用 `PayloadImage` / `ImageFallback`。
- 新增 `/bucket-list` route：
  - 願望池 / 進行中 / 已實現三欄看板。
  - 新增願望。
  - 移動狀態。
  - 完成願望時呼叫 server action，建立 `TimelineEvents` 並回寫 `BucketItems.timelineEvent`。
  - 完成時觸發 Canvas fireworks overlay，無 layout shift。
- 新增 `/wrapped` route：
  - 家人模式限定。
  - 發布季顯示 dynamic client story viewer。
  - 非發布季或無 snapshot 顯示預告頁，不對訪客暴露 private stats。
- 首頁 hub 已接回：
  - 最新 timeline event。
  - 家人模式 bucket quick view，支援首頁直接完成願望。
  - wrapped seasonal CTA。
- Seed pipeline 已新增 Phase-7 demo data upsert：
  - 至少 1 筆 public timeline event。
  - 至少 1 筆 private timeline event。
  - 至少 1 筆 pool bucket item。
  - 至少 1 筆 in-progress bucket item。
  - 至少 1 筆 completed bucket item。
  - 至少 1 筆 wrapped snapshot。

## Key Files

- `src/payload/collections/TimelineEvents.ts`
- `src/payload/collections/BucketItems.ts`
- `src/payload/collections/WrappedSnapshots.ts`
- `src/payload/payload.config.ts`
- `src/lib/data/timeline.ts`
- `src/lib/data/bucket-list.ts`
- `src/lib/data/wrapped.ts`
- `src/lib/data/phase-7-domain.ts`
- `src/lib/data/phase-7-domain.test.ts`
- `src/features/timeline/timeline-page.tsx`
- `src/features/bucket-list/bucket-list-page.tsx`
- `src/features/bucket-list/bucket-list-board.tsx`
- `src/features/bucket-list/actions.ts`
- `src/features/bucket-list/completion-fireworks.tsx`
- `src/features/wrapped/wrapped-page.tsx`
- `src/features/wrapped/wrapped-story-loader.tsx`
- `src/features/wrapped/wrapped-story.tsx`
- `src/features/home/home-page.tsx`
- `src/features/home/home-bucket-quick-view.tsx`
- `src/app/(app)/timeline/page.tsx`
- `src/app/(app)/bucket-list/page.tsx`
- `src/app/(app)/wrapped/page.tsx`
- `src/scripts/seed.ts`

## 驗證命令

- `pnpm exec payload generate:types`：通過，已更新 `src/payload/payload-types.ts`。
- `pnpm exec tsx src/lib/data/phase-7-domain.test.ts`：通過。
- `pnpm run test:seed-content`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過，Next.js 15.4.11 production build 成功列出 `/timeline`、`/bucket-list`、`/wrapped`。
- `git diff --check`：通過。

## Migration / Seed 狀態

- `pnpm exec payload migrate:create`：失敗。
  - 錯誤：`ENOENT: no such file or directory, open 'node:crypto?tsx-namespace=...'`
  - 觀察：本機目前只有 Node 24；Payload/tsx 在此環境下誤把 `node:crypto?tsx-namespace=...` 當作檔案路徑讀取。
- `pnpm exec payload migrate:create phase-7-time-capsule --skip-empty --force-accept-warning`：同樣失敗。
- `pnpm run seed`：提權後可連 Supabase，但因遠端 schema 尚未套用新 collections，失敗於缺少 `payload_locked_documents_rels.timeline_events_id`。
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true pnpm run seed`：已經使用核准的提權嘗試，但 Drizzle schema pull 最後因 Supabase 連線 timeout 失敗。

## Browser QA 範圍

已啟動本機 dev server 並使用 in-app browser 嘗試 QA：

- `/timeline`：可載入路由 metadata，但頁面內容被 DB query 錯誤阻擋；錯誤指向 `timeline_events` / `timeline_events_rels` / `timeline_events_locales` 查詢所需資料表尚未存在。
- `/bucket-list`：未登入訪客正確導向 `/family/login?next=/bucket-list`。
- `/wrapped`：未登入訪客正確導向 `/family/login?next=/wrapped`。
- `/`：首頁 metadata 可載入，但 Phase-7 最新 timeline quick view 被相同 `timeline_events` query 錯誤阻擋。

阻塞原因：遠端 Supabase schema 尚未成功加入 Phase-7 collections 與 relationship 欄位，實際打開 `/timeline` 與首頁會在 server data query 階段撞到 DB schema 缺欄位；`/bucket-list`、`/wrapped` 的登入後完整互動 QA 也需等 schema 與 seed 完成後才能驗證。

已完成替代驗證：

- Production build 可編譯三個新 route。
- Server/action/data-layer TypeScript 全綠。
- Domain 行為測試全綠。
- 未登入保護路由 redirect 行為已在 browser 中確認。

待 schema migration 成功後，建議補跑：

- Desktop public：`/`、`/timeline`、`/wrapped` login redirect / locked behavior。
- Desktop family mode：`/bucket-list` 新增、移動、完成願望，確認 timeline event 建立。
- Mobile 390px：`/timeline`、`/bucket-list`、`/wrapped` 無水平 overflow。
- Public leak check：未登入 HTML 不包含 private timeline title、private wrapped stats、bucket item title。

## 已知限制與阻塞

- Migration CLI 在目前 Node 24 環境不可用；需切到專案 engines 支援的 Node 20/18 或修正 Payload/tsx CLI 問題後重跑 migration。
- 遠端 Supabase schema 尚未套用 Phase-7 collections，因此 seed 與 browser QA 尚未完成。
- 未建立 GitHub push / PR；原因是 Phase completion 依規則需先完成 migration、seed 與 browser QA，或在 PR 中明確標記此 blocker。
- 工作樹中另有未納入本次提交的既有/外部變更：`.DS_Store`、blogger zip、泰國/普吉旅遊內容與 `docs/travel-projects.md` 變更。

## Next Phase Readiness

程式碼層已可交接。下一步需要先解決 Payload migration 執行環境或使用正式 schema migration 流程套用 Supabase schema，然後重跑 seed 與 browser QA。完成後即可推送分支並建立 PR。
