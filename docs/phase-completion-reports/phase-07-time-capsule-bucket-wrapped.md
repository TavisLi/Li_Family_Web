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
- Report / QA commits：`1789d93`、`43f6442`
- Final closeout commit：本報告提交後位於同一分支 HEAD。

## GitHub Sync / PR 狀態

- 本地 implementation、QA、migration closeout commits 已建立。
- 遠端 Supabase schema 已套用 Phase-7 collections，seed 已完成。
- 分支 push / PR 建立狀態：待本報告最終 commit 後執行。

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
- `src/migrations/20260619_055511_phase_7_time_capsule.ts`
- `src/migrations/20260619_055511_phase_7_time_capsule.json`
- `src/migrations/index.ts`

## 驗證命令

- `source ~/.nvm/nvm.sh; nvm use 20; pnpm exec payload generate:types`：通過，已更新 `src/payload/payload-types.ts`。
- `source ~/.nvm/nvm.sh; nvm use 20; pnpm exec tsx src/lib/data/phase-7-domain.test.ts`：通過。
- `source ~/.nvm/nvm.sh; nvm use 20; pnpm run test:seed-content`：通過。
- `source ~/.nvm/nvm.sh; nvm use 20; pnpm tsc --noEmit`：通過。
- `source ~/.nvm/nvm.sh; nvm use 20; pnpm run build`：通過，Next.js 15.4.11 production build 成功列出 `/timeline`、`/bucket-list`、`/wrapped`。

## Migration / Seed 狀態

- Node 24 下的 `pnpm exec payload migrate:create` 會失敗於 `node:crypto?tsx-namespace=...`；根因為 Payload/tsx CLI 與目前 Node 24 runtime 不相容。
- 已安裝並切換到專案 engines 支援的 Node 20.20.2，並將 Node 20 的 pnpm 固定為 10.23.0。
- `pnpm exec payload migrate:create phase-7-time-capsule --skip-empty --force-accept-warning`：Node 20 下通過，產生 migration snapshot。
- 自動產生的 TS migration 原本是全量 baseline；已改寫為 Phase-7 增量、idempotent migration，保留 JSON snapshot 作為後續 migration diff baseline。
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true pnpm run seed`：通過。
  - Media assets：416/416。
  - Seed 統計：created 246、updated 218、skipped 0、failed 0。
- `pnpm exec payload migrate`：通過，`20260619_055511_phase_7_time_capsule` 已記錄為 batch 1。
- Payload collection count 驗證：`timeline-events=2`、`bucket-items=3`、`wrapped-snapshots=1`；browser QA 互動完成後另新增 1 筆 QA bucket item 與對應 timeline event。

## Browser QA 範圍

已啟動本機 dev server 並使用 in-app browser 完成 QA：

- Public `/timeline`：顯示公開事件「海南三灣的夏日海風」，不顯示 private event，無 DB error。
- Public `/`：首頁顯示 Time Machine、Bucket List、Wrapped CTA，無 DB error。
- Public `/bucket-list`：未登入導向 `/family/login?next=/bucket-list`。
- Public `/wrapped`：未登入導向 `/family/login?next=/wrapped`。
- Family login：使用 seeded family account 登入成功，header 顯示 `Tavis Li` 與登出按鈕。
- Family `/bucket-list`：三欄看板顯示 pool / in-progress / completed；新增 QA 願望、移到進行中、完成願望均通過，完成後顯示「願望完成，已同步寫入時空膠囊」。
- Family `/wrapped`：非發布季顯示年度報告預告與私密統計，不導回登入頁。
- Family `/timeline`：顯示 private event 與 bucket 完成後產生的 timeline event。
- Runtime observation：首頁原本在遠端 Supabase pool `max: 3` 下，因首頁資料層同時發出多筆 Payload query 可能造成 connection timeout；已將 `getHomeData()` 改為順序查詢後，browser QA 與 build 均通過。

## 已知限制與阻塞

- 本機 Node 24 不適合執行 Payload migration CLI；Phase-7 收尾驗證使用 Node 20.20.2。
- Browser QA 新增了一筆 `QA Phase 7 ...` bucket item，並完成後寫入 timeline，用於驗證 server action 與關聯寫入。
- 工作樹中另有未納入本次提交的既有/外部變更：`.DS_Store`、blogger zip、泰國/普吉旅遊內容與 `docs/travel-projects.md` 變更。

## Next Phase Readiness

Phase-7 已具備交接條件。後續可進入 PR review；下一階段若延伸 Wrapped 發布季故事、Bucket item 刪除/歸檔或 Timeline 更細的篩選，需要在既有 `src/lib/data/` 封裝層上延伸，不需改動 Payload v3 架構。
