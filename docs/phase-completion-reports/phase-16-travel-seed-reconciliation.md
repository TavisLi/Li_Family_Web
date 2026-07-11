# Phase 16 Travel Seed Reconciliation 完成報告

## 階段範圍

本階段承接 Issue #50 尚未完成的資料治理工作，建立 planning travel 與既有 travel project 共用的 Base／Source／Current reconciliation。範圍包含唯讀 report、safe write、顯式 conflict resolution、Payload draft export、additive source metadata schema、migration 與營運 SOP；沒有刪除 `TravelProjects` 欄位、清理 Production data 或重寫前台。

## 分支與提交

- Branch：`codex/phase-16-travel-seed-reconciliation`
- Implementation commit：`2d66210 Build Phase 16 travel seed reconciliation`。
- Closeout commit：本報告狀態更新提交。
- Pull Request：建立後補記。

## GitHub 與同步狀態

- 基底：`main` / `6ce74b8`，開工時與 `origin/main` 同步。
- Issue：[Issue #50](https://github.com/TavisLi/Li_Family_Web/issues/50) 仍為 open；Phase 15 已交付 planning UI 與 Markdown template，本階段完成剩餘 seed/schema 安全層。
- Branch push 與 PR 狀態：完成後補記。

## 已交付內容

1. 新增 Travel seed reconciliation 深模組：
   - 三方 state machine：skip、apply source、preserve current、already converged、conflict、create。
   - 預設 safe mode；`source-wins`／`payload-wins` 必須顯式指定且互斥。
   - projection normalization、stable SHA-256 hash、section-anchor conflict path 與 field category。
   - text、source section、media、identity、Admin override 等 reporting labels。
2. 既有 dry-run 接入 reconciliation：
   - travel action 不再一律顯示 update。
   - summary 新增 preserve 與 conflict 計數，conflict 附欄位／section path。
   - dry-run 仍只有 Payload find，沒有 create／update／delete。
3. safe write 接入現有 seed：
   - legacy record 沒有 Base 時只建立 source baseline metadata，不改 published content。
   - non-conflicting source patch 可更新；同一 record 的 conflict 欄位保留 Current，沒有安全 patch 時整筆跳過。
   - conflict resolution 支援 explicit source-wins 與 payload-wins。
4. Payload-to-Markdown assisted export：
   - `--payload-wins --export-payload-drafts` 輸出 `.payload-draft.md` 審查 artifact。
   - artifact 位於 `docs/phase-artifacts/phase-16/exports/`，不在 parser 掃描的 `content-source/travels/`。
   - 不修改原始 Markdown。
5. 新增 nullable `sourceMetadata`：source file、source hash、parser version、last imported time 與 Base projection。
6. 生成 Payload types 與純 additive migration；UP 只新增五個 nullable columns，沒有 drop／rename／data rewrite。
7. 更新 travel content-source 與 website operations SOP，補上 dry-run、safe、resolution mode 與 migration 部署順序。

## 關鍵檔案

- `src/scripts/travel-seed-reconciliation.ts`
- `src/scripts/travel-seed-reconciliation.test.ts`
- `src/scripts/seed-dry-run.ts`
- `src/scripts/seed.ts`
- `src/payload/collections/TravelProjects.ts`
- `src/payload/payload-types.ts`
- `src/migrations/20260711_141901.ts`
- `docs/website-operations-sop.md`
- `docs/travel-content-source-guidelines.md`
- `docs/phase-preparation/phase-16-travel-seed-reconciliation.md`

## TDD 行為覆蓋

- Source changed、Current matches Base → apply source。
- Current changed、Source matches Base → preserve current。
- Source 與 Current 同時不同修改 → conflict，並定位到 planning section anchor。
- Source 與 Current 收斂到相同值 → already converged。
- legacy missing Base → preserve current。
- new travel → create。
- source-wins 必須 explicit；兩種 resolution mode 不可同時指定。
- projection 移除 Payload row ID、正規化日期與 relationship ID。
- draft export 寫入 parser-excluded artifact，不寫入 content source。
- dry-run summary 分開計算 create／update／skip／preserve／conflict／delete。

## 驗證命令

已通過：

```bash
pnpm run test:phase-16
pnpm run test:phase-9
pnpm run test:seed-content
pnpm run seed:audit
pnpm exec payload generate:types
pnpm tsc --noEmit
git diff --check
```

```bash
pnpm run build
```

全部 Node/Payload 命令使用專案標準 Node `20.20.2`。

## Dry-run 與 Production data 狀態

- Production migration：**未執行**。
- Production seed write：**未執行**。
- Production dry-run：已嘗試並成功連到 Payload，但 Production table 尚未套用本 PR 的 additive migration，因此查詢新 metadata columns 時以 `column ... does not exist` 停止。
- 正確後續順序：PR review → 套用 additive migration → 重跑 dry-run → 審查 reconciliation report → 另行批准 Production write。
- 本階段沒有以 schema push 或手寫 SQL 繞過 migration，也沒有模擬 Production 成功。

## Browser QA 範圍

本階段沒有改動 Travel 前台 renderer 或 route；沒有新增視覺 QA 範圍。既有 travel detail/index SSR regression tests 由 `test:phase-9` 覆蓋。部署後仍應 smoke test `/travel` 與兩個 planning travel route，確認 migration 後 runtime query 正常。

## 已知限制與 blocker

- 新版程式不可在 migration 尚未套用的 Production schema 上讀取 `TravelProjects`；這是 Payload schema-first 的正常部署順序要求。
- legacy 第一次 safe seed 只建立 Base metadata，不把 Source 覆蓋到 Current；需在下一次 dry-run 檢視差異。
- Payload draft 是 JSON projection 包在 Markdown artifact 中，供人工比較與回填，不保證重建原始 Markdown 排版。
- Phase 16 不做 destructive schema cleanup；Issue #50 所述 drop redundant columns/data 仍需在 reconciliation 累積可信 evidence 後另開 migration phase。
- 工作樹中原有 Tavis member assets 變更未納入 Phase 16 commit。

## 下一階段準備度

reconciliation seam、Base metadata 與 safe write 已具備。PR merge 並套用 migration 後，可先取得五筆 travel project 的 legacy baseline dry-run／seed evidence，再決定是否進入 `TravelProjects` destructive cleanup。未取得該 evidence 前，不建議 drop 欄位。
