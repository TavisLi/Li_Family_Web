# Phase-16 準備：Travel Seed Reconciliation 與 Planning Travel 資料治理

## 1. 準備狀態

**Phase 名稱**：Phase-16 Travel Seed Reconciliation
**準備日期**：2026-07-11
**建議工作分支**：`codex/phase-16-travel-seed-reconciliation`
**建議基底**：從最新 `main` 開新分支。
**主要對應議題**：Issue #50「旅行：Travel Project 計劃中項目Table Schema 重構」

Phase-16 的核心不是先刪除 `TravelProjects` 欄位，也不是把 Payload Admin 的內容自動覆蓋回 Markdown，而是建立一個可驗證的 **seed reconciliation** 流程：讓 `content-source/`、Payload Admin 內的 published content、以及上次 seed 匯入基準可以被比較、報告與安全合併。

這個 Phase 應優先保護已在 Payload Admin 進行過的人工調整，避免下一次 travel seed 重新匯入時靜默覆蓋 Admin 修改。同時，它要為後續 Travel Project schema cleanup 鋪路，讓後續欄位精簡或拆表有可靠依據。

### Architecture review 對齊

本文件承接 `architecture-review-20260711-101614.html` 的 Top recommendation：先深化 **Travel catalog and seed import module**，再考慮 Payload schema cleanup。Phase-16 不應從刪欄位、拆表或前台重寫開始，而應先讓 canonical travel slug、source file、status、dates、source projection、media projection 與寫入策略集中在一個可測試 seam 後面。

對應 architecture review 的候選排序：

1. **Travel catalog and seed import module**：Phase-16 必做，作為 reconciliation 的主要 module。
2. **Travel published view module**：Phase-16 只在 reconciliation 需要時準備 projection shape，不主動重構前台。
3. **Travel source-section module**：Phase-16 只處理 source-section diff、anchor 與 interaction safety，不重寫 renderer。
4. **Travel interaction target identity**：Phase-16 避免破壞既有 target；若要穩定 ID，另列後續 schema 設計。
5. **TravelProjects field ownership**：Phase-16 只做 ownership/reporting 與 additive metadata，不做 destructive cleanup。

---

## 2. PRD

### Problem Statement

Travel project 的內容來源目前同時存在於 `content-source/travels/*.md`、`docs/travel-projects.md`、media manifest，以及 Payload Admin 的 published content。早期 seed pipeline 假設 Markdown 是主要結構化來源，但網站上線後，部分 planning travel 內容已經可能在 Payload Admin 中被人工修正。

如果後續再次執行完整 travel seed，系統可能用 Markdown 解析結果覆蓋 Payload Admin 中的人工調整。相反地，如果完全停止 seed，新增 planning travel、媒體關聯、catalog coverage 與可重複部署能力又會失去治理基礎。

固定區分「Markdown-owned」與「Admin-owned」也不夠實用，因為同一個欄位可能在初始匯入時由 Markdown 產生，但後續又被 Admin 修正。例如 `sourceSections`、航班、住宿、每日行程和 section media 都可能同時有 source 版本與 Admin 修正版。使用者不應被要求每次先判斷欄位 ownership；系統應該比較差異並提示衝突。

### Solution

Phase-16 建立 Travel seed reconciliation 機制，以三方比對取代單向覆蓋：

1. **Base**：上次 seed 成功匯入時保存的 travel projection snapshot。
2. **Source**：本次由 `docs/travel-projects.md`、travel Markdown、media manifest 解析出的 projection。
3. **Current**：目前 Payload Admin / database 中的 published content。

Seed import 的預設模式改為 safe reconciliation：

- Source 有變、Current 沒變：可自動套用 source 更新。
- Source 沒變、Current 有變：保留 Payload Admin 修改。
- Source 有變、Current 也有變：標記 conflict，不自動覆蓋。
- 都沒變：跳過。

同時新增可審查的 diff / conflict report，讓維護者可以選擇保留 Payload、接受 Source，或輸出 Payload 內容為 Markdown draft 供人工回填 `content-source/travels/*.md`。

### User Stories

1. As a website owner, I want travel seed to stop silently overwriting Payload Admin edits, so that published travel content stays trustworthy.
2. As a website owner, I want seed import to report conflicts before writing, so that I can approve risky content changes deliberately.
3. As a content editor, I want Admin edits to survive a routine seed run, so that fixing travel copy in `/admin` does not become wasted work.
4. As a content editor, I want to know when Markdown and Payload both changed the same travel section, so that I can decide which version should become published content.
5. As a travel planner, I want planning travel updates to support both Markdown source work and Payload Admin cleanup, so that itinerary planning can happen without rigid workflow friction.
6. As a maintainer, I want each travel project to retain its canonical travel slug, source file, status, and dates in one validated catalog model, so that route identity and source identity cannot drift.
7. As a maintainer, I want the seed import module to know the last imported snapshot, so that it can compare Base, Source, and Current.
8. As a maintainer, I want safe seed mode to apply only non-conflicting changes, so that routine imports remain low risk.
9. As a maintainer, I want force refresh to require an explicit mode, so that destructive overwrites cannot happen by accident.
10. As a maintainer, I want Payload-wins mode to preserve current published content and optionally export a Markdown draft, so that Admin edits can be reconciled back into content source.
11. As a maintainer, I want Source-wins mode to be explicit and logged, so that replacing Admin edits with source content is auditable.
12. As a maintainer, I want the reconciliation report to include create, update, skip, and conflict counts, so that production seed approval can be based on evidence.
13. As a maintainer, I want conflict reporting at travel project and section level, so that large travel pages are not treated as one opaque blob.
14. As a maintainer, I want media relationship changes to be reconciled separately from text changes, so that image updates do not accidentally rewrite itinerary copy.
15. As a maintainer, I want section interaction settings to avoid blind source overwrite, so that Admin-tuned comment and reaction settings remain stable.
16. As a maintainer, I want `sourceSections` heading-derived display values to stay derivable by default, so that seed does not reintroduce redundant daily display data.
17. As a reviewer, I want tests to prove Base / Source / Current behavior, so that future travel imports do not regress to one-way overwrite.
18. As a reviewer, I want a dry-run mode that reads Payload and prints the reconciliation plan without writing, so that production runs can be reviewed before approval.
19. As a reviewer, I want conflict fixtures using the planning travel projects, so that the risky Phase-16 cases match real travel content.
20. As a future agent, I want clear phase-preparation rules for seed reconciliation, so that schema cleanup is attempted only after reconciliation is reliable.

### Implementation Decisions

- Use `seed reconciliation` as the central product and engineering concept for Phase-16.
- Do not rely on fixed Markdown-owned / Admin-owned field ownership as the primary safety rule. Keep ownership labels only as hints for reporting and default policy.
- Preserve the current architecture decision that published content is Payload-owned. Frontend runtime must continue reading Payload through the data layer, not Markdown files directly.
- Preserve the current architecture decision that canonical travel slug owns source identity, route identity, and travel asset folder identity.
- Build or deepen a Travel catalog and seed import module that validates canonical travel slug, source file, status, dates, source projection, media projection, and write policy behind one seam.
- Keep the Travel catalog module as the first implementation target. Existing fallback maps such as filename-to-slug, status, and date maps should be treated as migration aids, not the long-term interface.
- Add source metadata to travel published content using additive schema only. Metadata should support source file identity, source hash, last imported time, parser version, and last imported projection snapshot or a stable digest of it.
- Prefer storing enough Base information to perform meaningful reconciliation. If a full snapshot is too large for the first pass, store stable per-field or per-section digests and include a follow-up task for full draft export.
- Classify fields in reports as identity / publication, source metadata, structured display projection, faithful source projection, media projection, Admin override, or deprecated candidate. These labels are reporting hints; the Base / Source / Current state machine remains the safety rule.
- Define the reconciliation state machine:

```text
Base == Source && Base == Current -> skip
Base != Source && Base == Current -> apply source update
Base == Source && Base != Current -> preserve current
Base != Source && Base != Current && Source == Current -> mark already converged
Base != Source && Base != Current && Source != Current -> conflict
```

- Keep safe mode as the default. Safe mode can create missing records and apply non-conflicting updates, but must not overwrite conflicts.
- Provide explicit modes for source-wins and payload-wins behavior. These modes must be opt-in and visible in command output.
- Add a read-only reconciliation dry-run before any write mode. Dry-run should be usable as a production approval artifact.
- Add a controlled Payload-to-Markdown export draft path for conflicted travel projects. Export should create a draft or diff artifact, not automatically overwrite the original Markdown source.
- Export drafts must not be written beside `content-source/travels/*.md` with a plain `.md` filename that the existing parser could accidentally import. Use an ignored or parser-excluded artifact path such as `docs/phase-artifacts/phase-16/exports/` unless the implementation explicitly teaches the travel parser to ignore export drafts.
- Do not attempt a full bidirectional sync. Payload-to-Markdown exists only as an assisted reconciliation tool.
- Keep media attachment reconciliation separate from travel text reconciliation. Media changes should report cover, gallery, itinerary, and source-section media changes independently.
- Keep section interaction target identity stable. Heading-derived anchors should not be casually regenerated in ways that orphan comments or reactions.
- Keep section interaction settings and Admin-tuned display overrides out of blind source overwrite.
- Do not drop existing `TravelProjects` fields in Phase-16. Existing fields remain compatible while reconciliation safety is introduced.
- Do not move planning travel rendering to a new route. `/travel/[slug]` remains the shared route.
- Update operational documentation only if Phase-16 changes the approved seed workflow or production dry-run process.

### Testing Decisions

- The highest test seam is the Travel seed reconciliation module: given Base, Source, and Current, it returns skip, apply, preserve, or conflict decisions.
- Tests should assert external behavior and reconciliation outcomes, not internal helper function order.
- Existing seed-content coverage should remain green and continue proving every travel catalog entry has a seed model, structured content, source sections, and media coverage.
- Existing dry-run tests should be extended or mirrored so that dry-run output reports reconciliation plans without writing.
- Add fixtures for:
  - Source changed while Current matches Base.
  - Current changed while Source matches Base.
  - Source and Current both changed differently.
  - Source and Current both changed to the same value.
  - New travel project create path.
  - Missing Base metadata path for legacy records.
  - Section-level conflict in planning travel content.
  - Media projection change without text conflict.
- Add regression coverage using the two planning travel projects: `202607-chongqing-yangtze-river` and `202702-thailand-phuket`.
- Add tests that prove safe mode does not overwrite conflicts.
- Add tests that prove force/source-wins behavior requires explicit mode.
- Add tests that prove Payload-to-Markdown export produces a draft/diff artifact rather than mutating source Markdown automatically.
- Run focused tests first, then the broader seed and build checks required by the final implementation scope.

### Out of Scope

- Dropping `TravelProjects` columns.
- Splitting `sourceSections` into a new collection.
- Replacing Payload as runtime source of truth.
- Frontend runtime reading Markdown or design docs directly.
- Full Travel published view module refactor, unless a small projection is necessary to produce reconciliation output.
- Broad Travel page redesign or source-section renderer rewrite.
- Full automatic bidirectional sync between Payload and Markdown.
- Automatic overwrite of `content-source/travels/*.md` from Payload Admin.
- Production seed writes without explicit approval.
- Cleaning unrelated completed travel gallery behavior.
- Redesigning unrelated routes outside Travel Project seed reconciliation.
- Changing Cloudflare R2 storage strategy.

### Further Notes

- Phase-16 should treat schema cleanup as a later beneficiary, not the first move.
- The main safety improvement is making conflicts visible before writes.
- The first implementation slice can be read-only reconciliation and reporting; write modes can follow after dry-run evidence is stable.
- Any Payload schema change must remain additive and nullable unless explicitly approved after migration review.
- If Payload migration generation reports data-loss warnings, stop and review before applying.

---

## 3. 建議實施計劃

### Phase-16A：Travel catalog / identity module 與只讀 reconciliation core

- 定義 Travel catalog / seed import module 的輸入與輸出。
- 將 canonical travel slug、source file、status、dates 的驗證集中到單一 seam。
- 定義 Base / Source / Current 的 projection shape。
- 補上 reconciliation state machine 測試。
- 建立 field ownership reporting labels。
- 建立 read-only reconciliation report。
- 不改 production 資料，不執行 write seed。

### Phase-16B：legacy-safe dry-run 接入現有 seed 流程

- 將 reconciliation report 接入現有 dry-run。
- 在沒有 Base metadata 的 legacy records 上，預設 report-only / preserve current。
- dry-run 顯示 create / non-conflicting update / preserve / conflict / skip。
- conflict 必須列出 travel slug、欄位或 section anchor、Source 摘要、Current 摘要。
- dry-run 不寫 Payload，不寫 Markdown。

### Phase-16C：source metadata additive schema

- 在 Travel Project published content 增加 source metadata。
- 生成 Payload types。
- 生成並檢查 migration。
- 不刪欄位，不做 destructive cleanup。
- metadata 寫入前後都要能產出 reconciliation report。

### Phase-16D：safe write mode

- 預設 write mode 只套用 non-conflicting changes。
- 衝突項目跳過並報告。
- 每次成功寫入後更新 Base metadata。
- 寫入統計必須可回看。

### Phase-16E：受控 conflict resolution

- 支援 explicit `source-wins`。
- 支援 explicit `payload-wins`。
- 支援 Payload-to-Markdown draft export，用於人工回填 content source。
- export artifact 預設寫到 parser 不會掃描的目錄，例如 `docs/phase-artifacts/phase-16/exports/`。
- 不自動覆蓋原始 Markdown。

### Phase-16F：文件與營運 SOP 更新

- 更新 travel content source 或 website operations SOP 中關於完整旅行 seed 的說明。
- 明確寫出 safe mode、dry-run、conflict report、source-wins / payload-wins 的使用時機。
- Completion report 必須記錄是否有 production write、是否有 migration、是否有 conflict。

---

## 4. 開工前必讀上下文

- `CONTEXT.md`
- `docs/adr/0001-runtime-content-records-are-payload-owned.md`
- `docs/adr/0003-travel-slugs-own-source-and-asset-identity.md`
- `docs/website-operations-sop.md`
- `docs/travel-content-source-guidelines.md`
- `docs/travel-projects.md`
- `docs/templates/planning-travel-source-template.md`
- `content-source/travels/202607重慶長江三峽8日.md`
- `content-source/travels/202702泰國普吉島7日.md`
- `src/payload/collections/TravelProjects.ts`
- `src/scripts/seed-content.ts`
- `src/scripts/seed.ts`
- `src/scripts/seed-audit.ts`
- `src/scripts/travel-section-media.ts`
- `src/lib/data/travel.ts`
- `src/features/travel/`

---

## 5. 建議測試 seam

首選 seam：

- Travel seed reconciliation module。

次要 seam：

- Travel catalog / source import module。
- Existing seed dry-run module。
- Travel source-section renderer only when projection shape changes affect frontend output.

不要以 Payload raw field-by-field implementation detail 作為主要測試面。測試應從「一次 travel seed reconciliation 會做出什麼決策」來驗證。

---

## 6. 建議驗證命令

文件與只讀設計階段：

```bash
pnpm run test:seed-content
pnpm run seed:audit
pnpm run seed:phase-9:dry-run
git diff --check
```

若新增或修改 Payload collection：

```bash
pnpm exec payload generate:types
pnpm exec payload migrate:create
pnpm tsc --noEmit
pnpm run build
git diff --check
```

若新增 reconciliation tests：

```bash
pnpm run test:phase-9
```

注意：`pnpm tsc --noEmit` 不要和 `pnpm run build` 平行執行，避免 `.next/types` 暫態問題。

---

## 7. 風險與處理

| 風險 | 處理方式 |
| --- | --- |
| Admin 已修改但沒有 Base metadata | 第一版視為 legacy unknown，預設 report-only 或 preserve current，不自動覆蓋 |
| Source 和 Current 同時修改 | 標記 conflict，safe mode 跳過 |
| Markdown export 破壞原格式 | 只輸出 draft/diff，不自動覆蓋原始 source |
| Section anchor 改變導致留言 target 漂移 | Phase-16 不做 anchor 大量重寫；若需要穩定 target id，另列後續 schema 設計 |
| Migration 有 data-loss warning | 停止，不套用，回報並重新設計 additive path |
| Production seed 權限與環境不可用 | 記錄 blocker，不用模擬成功 |

---

## 8. Phase-16 完成定義

Phase-16 可視為完成時，應至少達成：

- 有 read-only reconciliation report。
- Safe mode 不會覆蓋 Source / Current 同時改動的 conflict。
- Existing travel seed tests 維持通過。
- Planning travel 的 Base / Source / Current 行為有測試 fixture。
- 若有 schema metadata，migration 為 additive 且已檢查。
- 文件更新說明新的 travel seed 安全流程。
- Completion report 清楚列出是否有 production write；若沒有，明確標示為未執行。
