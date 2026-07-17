# Phase-17 準備：Travel Conflict Resolution 與 Schema Cleanup Readiness

## 1. 準備狀態

**Phase 名稱**：Phase-17 Travel Conflict Resolution and Schema Cleanup Readiness  
**準備日期**：2026-07-12  
**決策更新**：2026-07-17
**建議工作分支**：`codex/phase-17-travel-conflict-resolution`  
**建議基底**：從最新 `main` 開新分支。  
**主要對應議題**：Issue #50「旅行：Travel Project 計劃中項目Table Schema 重構」與 Issue #57「旅行：Travel Project 規畫中/前期規劃旅遊項目Table Schema 重構」
**前置條件**：Phase 16 已完成 Base／Source／Current reconciliation、Travel-only Production baseline、full-projection read-back 與 ADR 0006。

Phase 17 的核心不是立即刪除欄位，也不是用 Markdown 覆蓋 Payload Admin。它要先把 Phase 16 找出的五筆 travel conflict 變成可審查、可批准、可回溯的內容決策，並產出 destructive schema cleanup 是否可以進場的證據。

白話來說，Phase 16 已經裝上「不會亂覆蓋 Current」的安全煞車；Phase 17 要做的是逐筆判斷「哪些 Current 是 Admin 想保留的修改、哪些 Source 應該被接受、哪些差異只是 parser 或 array 表示造成的噪音」，再決定是否有足夠依據清理舊欄位。

### 2026-07-16 已批准決策與目前狀態

- 網站擁有者確認 Planning 與 Travel Memory 是不同性質的內容，不存在同一筆 record 或同一頁面由 planning 切換成 completed 的需求。
- 目標架構採獨立 `travel-plans` 與 `travel-memories` collections；正式理由與後果記錄於 ADR 0007。
- Plan 的大廳呈現名稱採「規劃中／Active Plans」與「過往規劃／Archived Plans」，由 `endDate` 推導；不使用容易被理解為早期規劃階段的 `Pre-planning`。
- 重慶 Planning 的 legacy `lodgings` 等 structured arrays 已批准為 `drop-as-redundant`，不搬入新 Plan；正式 planning 內容以 `planningSections` 為準。
- 2027 普吉島 link labels 採 `payload-wins`；Current 的人類可讀 label 進入新 record，Source raw label 留在重建的 Base。
- 舊 `sourceMetadata/Base` 只留在 `travel_projects` 作 migration evidence；新 Plan Base/hash 由目標 transformer 重建，不在新 collections 增加 persistent legacy snapshot。
- 2026-07-16 Production 唯讀 readiness 已提升為五筆 records 全部 ready：2 筆 Plans 與 3 筆 Memories 都完成逐欄 transformer。
- migration／data-copy 執行包已完成：第五份 additive migration 新增 Media、TimelineEvents、HomeConfig 的 polymorphic 影子關聯；copy 會在單一 transaction 內寫入 5 筆 target records 與 12／2／1 筆影子關聯。舊關聯與舊表保留，runtime 暫不切換。
- disposable PostgreSQL 17 本地演練已完成：五份 migrations、synthetic 5-record copy、完整內容／slug／逐 owner relationship verify 全部通過；第一次刻意保留的 Media locale 缺陷也證明 transaction 能完整 rollback，修正後才成功 commit。
- 2026-07-17 已完成 Production controlled migration、5-record data-copy 與完整 read-back。Payload CLI 的 `dev/-1` data-loss 警告未被確認；另行批准的 executor 保留 `dev/-1`，只在單一 transaction 執行五份已審查 UP 並寫入 batch 6 records。Production 現有 Plans 2、Memories 3、Route identities 5 與 12／2／1 shadow relationships，完整雙語/nested content 與逐 owner mappings 均通過；舊 collection、舊 relationships 與既有兩筆 conflict evidence 保留，runtime 尚未 cutover。完整證據見 `docs/phase-artifacts/phase-17/travel-migration-data-copy-approval-package.md`。

本文件以下 PRD 保留 Phase 17 開始時的問題背景與安全要求；最新逐欄決策以 `docs/phase-artifacts/phase-17/`、`docs/data-models/travel-projects-schema.md` 與 ADR 0007 為準。

---

## 2. PRD

### Problem Statement

Issue #50 原本要求重構 planning travel 的 `TravelProjects` table schema、清理冗餘欄位與資料，並依照資料結構調整畫面。Phase 15 已先處理 planning travel layout 與 Markdown template；Phase 16 則建立 reconciliation 安全層，避免 seed 覆蓋 Payload Admin 編輯。

目前 Production 已有五筆 travel Base metadata。read-back 顯示：

- 0 create。
- 0 update。
- 751 travel media skip。
- 5 travel conflict。
- 0 delete。

這代表系統已能保護 Current，但還不能直接進入 schema cleanup。原因是五筆 travel 仍有 conflict，其中 `202702-thailand-phuket` 已明確包含 Payload Admin 將 raw URL label 改成人類可讀標籤的 Current-only 編輯。若 Phase 17 直接使用 `source-wins` 或 destructive migration，仍可能覆蓋人工整理過的 published content。

### Solution

Phase 17 建立一個 Travel conflict resolution workflow：

1. 產出五筆 travel conflict register，列出 slug、field path、category、Source 摘要、Current 摘要、建議決策。
2. 將 conflict 分類為：
   - `payload-wins`：Current 是 Admin 編輯，必須保留。
   - `source-wins`：Source 是正確版本，可在明確批准後套用。
   - `manual-merge`：兩邊都有價值，需要人工合併後再寫入。
   - `parser-noise`：差異來自 null/omitted、排序、array anchor 或表示層，需要改善 projection，而不是改內容。
   - `schema-cleanup-candidate`：差異證明某欄位可由 source projection 或 heading 推導，可能進入後續清理清單。
3. 補強 array-level diff，讓 `flights`、`lodgings`、`dailyItinerary`、`sourceSections` 不再只能整個 array 報 conflict；但在不能證明不相交時仍維持 conflict。
4. 對可安全處理的 conflict 產生 explicit resolution plan，不執行 Production write，直到網站擁有者逐項批准。
5. 產出 schema cleanup readiness report，說明哪些欄位可保留、可延後、可刪除候選，以及刪除前仍缺哪些 evidence。

### User Stories

1. As a website owner, I want to see exactly which travel fields are in conflict, so that I can approve content changes without reading raw JSON.
2. As a content editor, I want Admin-edited link labels and copy fixes to be preserved, so that seed does not undo manual improvements.
3. As a maintainer, I want array conflicts to be broken down by stable item identity where possible, so that one changed itinerary item does not block unrelated safe updates.
4. As a maintainer, I want parser noise separated from real content conflict, so that we fix normalization instead of creating unnecessary editorial work.
5. As a reviewer, I want a per-slug resolution register, so that every future Production write has an approval trail.
6. As a future migration owner, I want schema cleanup candidates backed by read-back evidence, so that destructive migration is not based on guesswork.
7. As a frontend reviewer, I want to know whether renderer changes are actually required by the cleaned data model, so that UI refactor does not race ahead of data truth.

### Implementation Decisions

- Keep Payload published content as runtime source of truth.
- Keep `content-source/` as versioned input, not an automatic overwrite authority.
- Keep Base／Source／Current safe mode as the default for every read-back and dry-run.
- Do not run full `seed:phase-9` for this work. Users reconciliation is not part of Phase 17; six existing Users updates must not be allowed to overwrite Payload Admin-edited user data.
- Use `seed:travel:read-back` and `seed:travel:dry-run` as the default evidence commands.
- Do not execute `source-wins`, `payload-wins`, Production write, or destructive migration without a separate explicit approval.
- Treat `202702-thailand-phuket` link-label edits as a known Admin-protection fixture.
- Add item-level identity for array diff only when there is a stable key such as section anchor, day number, flight number plus route/date, lodging date range, or media source path.
- If an array item cannot be matched safely, keep the parent array as conflict.
- Schema cleanup output should be a readiness report first. Actual drop／rename／data rewrite belongs to a later destructive migration phase unless Phase 17 receives a separate approval with dry-run evidence.

### Testing Decisions

- Add focused tests for conflict register generation from Base／Source／Current.
- Add tests proving Current-only Admin edits remain `payload-wins` or `preserve-current`.
- Add tests for array-level diff matching stable items without collapsing unrelated changes.
- Add tests that unmatched array items remain conflict.
- Add regression coverage for `sourceSections[item-1c51hpg].links` so human-readable Admin labels are not overwritten.
- Keep existing Phase 16 reconciliation tests green.

### Out of Scope

- Production content write without a new approval.
- Full `seed:phase-9` Production write.
- Users update reconciliation.
- Member media upload or Tavis asset processing.
- Automatic overwrite of `content-source/travels/*.md`.
- Dropping `TravelProjects` columns without a separate destructive migration approval.
- Rebuilding `/travel/[slug]` UI before the data decisions are settled.
- Changing storage away from Cloudflare R2.

---

## 3. 建議實施計劃

### Phase-17A：建立 conflict register

- 以 Phase 16 的 read-back evidence 為起點。
- 重新執行 travel-only read-back；若 pooler timeout，使用既有成功 read-back 作為 baseline，並記錄當次 timeout。
- 輸出 parser-safe artifact，例如 `docs/phase-artifacts/phase-17/travel-conflict-register.md`。
- 每筆 conflict 至少包含 slug、field path、category、Current 摘要、Source 摘要、建議決策與風險。

### Phase-17B：改善 array-level diff

- 為 `sourceSections` 使用 stable section anchor。
- 為 `dailyItinerary` 使用 day number 或 heading-derived day identity。
- 為 `flights` 使用 flight number、date、route 的組合 key。
- 為 `lodgings` 使用 date range、hotel name、city 的組合 key。
- 無法穩定配對時不自動合併。

### Phase-17C：建立 resolution plan

- 將每個 conflict 分成 `payload-wins`、`source-wins`、`manual-merge`、`parser-noise`、`schema-cleanup-candidate`。
- 對 `payload-wins` 項目可產出 Payload draft export，供人工回填 source，但不得自動覆蓋 Markdown。
- 對 `source-wins` 項目只產生 dry-run plan，等待 Production write 批准。
- 對 `manual-merge` 項目產出人工編輯清單。

### Phase-17D：schema cleanup readiness

- 對照 `TravelProjects` collection、source projection、frontend renderer 與 Production Current。
- 建立欄位清單：
  - 必須保留。
  - 可由 source projection 產生但暫時保留。
  - 可疑冗餘但缺 evidence。
  - 可進入 destructive migration 候選。
- 每個候選欄位都要說明 frontend 是否仍讀取、Payload Admin 是否仍編輯、Production 是否仍有非空資料、是否能從 Base／Source／Current 推導。

### Phase-17E：文件與批准包

- 更新 `docs/data-models/travel-projects-schema.md`，加入 Phase 17 conflict resolution 結果。
- 若準備進入 destructive migration，新增一份 migration approval note，列出 row count、non-null count、rollback、Preview／Production 驗證步驟。
- Phase completion report 必須清楚寫明是否有 Production write；若沒有，寫明只完成 readiness。

---

## 4. 開工前必讀上下文

- `CONTEXT.md`
- `docs/adr/0001-runtime-content-records-are-payload-owned.md`
- `docs/adr/0003-travel-slugs-own-source-and-asset-identity.md`
- `docs/adr/0006-seed-reconciliation-protects-published-content.md`
- `docs/adr/0007-travel-plans-and-memories-are-separate-records.md`
- `docs/phase-completion-reports/phase-16-travel-seed-reconciliation.md`
- `docs/data-models/travel-projects-schema.md`
- `docs/website-operations-sop.md`
- `docs/travel-content-source-guidelines.md`
- `docs/travel-projects.md`
- `content-source/travels/201307海南島8日.md`
- `content-source/travels/202308東澳全覽9日.md`
- `content-source/travels/202602泰國普吉島8日.md`
- `content-source/travels/202607重慶長江三峽8日.md`
- `content-source/travels/202702泰國普吉島7日.md`
- `src/payload/collections/TravelProjects.ts`
- `src/scripts/travel-seed-reconciliation.ts`
- `src/scripts/seed-dry-run.ts`
- `src/scripts/seed.ts`
- `src/scripts/travel-readback-probe.ts`
- `src/features/travel/`
- `src/lib/data/travel.ts`

---

## 5. 建議驗證命令

文件與 artifact 階段：

```bash
pnpm run seed:travel:read-back
pnpm run seed:travel:dry-run
git diff --check
```

若修改 reconciliation 或 diff 程式：

```bash
pnpm run test:phase-16
pnpm run test:phase-9
pnpm tsc --noEmit
pnpm run build
git diff --check
```

若修改 Payload collection：

```bash
pnpm exec payload generate:types
pnpm exec payload migrate:create
pnpm tsc --noEmit
pnpm run build
git diff --check
```

任何 migration 在 Production 前都必須先人工審查 UP/DOWN，遇到 Payload data-loss warning 必須停止，不可確認。

---

## 6. 完成條件

Phase 17 可視為完成，需同時滿足：

- 五筆 travel conflict 都有 register entry 與建議決策。
- Admin-edited Current 欄位，特別是 `202702-thailand-phuket` link labels，不會被 safe mode 覆蓋。
- Array-level diff 已能降低假 conflict，或已明確記錄不能安全拆分的原因。
- 沒有使用全量 seed 觸發 Users update 或 member media mutation。
- 若沒有 Production write，completion report 明確寫出「readiness only」。
- 若有 Production write，必須附當次 dry-run evidence、批准範圍、write 結果與 read-back。
- Schema cleanup candidates 有欄位級 evidence；未獲 destructive migration 批准前不得 drop／rename／rewrite。
- 獨立 Plan／Memory collection 決策、Archived Plans 命名與 rollback policy 已同步至 ADR、領域詞彙、schema 文件與 travel catalog 文件。
- Issue #50 與 #57 的完成範圍必須以實際 migration／copy／cutover 狀態判斷；readiness 完成不等於可以提前關閉 issue。
- 分支已 push，PR 已建立，Vercel／CI 狀態或 blocker 已記錄在 completion report。
