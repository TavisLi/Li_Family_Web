# Phase 16 Travel Seed Reconciliation 完成報告

## 階段範圍

本階段承接 Issue #50 尚未完成的資料治理工作，建立 planning travel 與既有 travel project 共用的 Base／Source／Current reconciliation。範圍包含唯讀 report、safe write、顯式 conflict resolution、Payload draft export、additive source metadata schema、migration 與營運 SOP；沒有刪除 `TravelProjects` 欄位、清理 Production data 或重寫前台。

## 分支與提交

- Branch：`codex/phase-16-travel-seed-reconciliation`
- Implementation commit：`2d66210 Build Phase 16 travel seed reconciliation`。
- Closeout commit：本報告狀態更新提交。
- Pull Request：[PR #52 Phase 16 travel seed reconciliation](https://github.com/TavisLi/Li_Family_Web/pull/52)。
- Production closeout：[PR #53 Phase 16 production schema closeout](https://github.com/TavisLi/Li_Family_Web/pull/53)。
- Baseline closeout：[PR #54 Record Phase 16 Production travel baseline](https://github.com/TavisLi/Li_Family_Web/pull/54)。
- Read-back closeout：[PR #55 Complete Phase 16 Production travel read-back](https://github.com/TavisLi/Li_Family_Web/pull/55)，implementation commit `f878047`。

## GitHub 與同步狀態

- 基底：`main` / `6ce74b8`，開工時與 `origin/main` 同步。
- Issue：[Issue #50](https://github.com/TavisLi/Li_Family_Web/issues/50) 仍為 open；Phase 15 已交付 planning UI 與 Markdown template，本階段完成剩餘 seed/schema 安全層。
- PR #52 checks 通過後已 merge；`main` merge commit 為 `a80e91c`。

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
8. 新增 travel-only dry-run／write scope，排除 Users、member media、blog 與 Home Config。
9. ADR 0006 將 Base／Source／Current 提升為所有雙重編輯來源 published content 的一般安全原則。
10. 完成 Production full-projection read-back 修復：
   - travel-only catalog 以單次 metadata query 加 scoped media query 讀取，避免巨型巢狀聚合與 751 個 SQL placeholders。
   - 只有已具 Base 的五筆 travel 才逐筆讀完整 projection，並加入 120 秒明確 timeout。
   - Payload optional field 回讀的 `null` 與 Source 未提供欄位正規化為等價，移除表示層假差異。
   - dry-run 樣本只顯示 conflict path/category，不輸出完整 Base／Source／Current Production payload。
   - 新增 `pnpm run seed:travel:read-back` 唯讀診斷入口。

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
- `docs/data-models/travel-projects-schema.md`
- `docs/adr/0006-seed-reconciliation-protects-published-content.md`

## TDD 行為覆蓋

- Source changed、Current matches Base → apply source。
- Current changed、Source matches Base → preserve current。
- Source 與 Current 同時不同修改 → conflict，並定位到 planning section anchor。
- Source 與 Current 收斂到相同值 → already converged。
- legacy missing Base → preserve current。
- new travel → create。
- source-wins 必須 explicit；兩種 resolution mode 不可同時指定。
- projection 移除 Payload row ID、正規化日期與 relationship ID。
- projection 將 optional `null` 與 omitted 欄位視為等價。
- Admin 修改過的連結標籤仍被保留，不會因 null normalization 消失。
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

- Production migration：已於 2026-07-11 套用並驗證；migration `20260711_141901`，batch 5。
- Production seed write：已於 2026-07-12 經明確批准，只建立 5 筆 travel reconciliation baseline metadata。
- Migration 前後 `travel_projects` row count 均為 5；五個新欄位全部 nullable，既有五筆資料的 non-null count 全部為 0。
- Payload CLI 因既有 dev-mode schema history 顯示 data-loss 警告，未確認；改用與 migration UP 完全相同的五條 additive SQL，在單一 transaction 內套用並記錄 migration。
- 正式 dry-run 命令已越過 schema mismatch，但 Payload Local API 的大型 collection read／後續連線受到 Supabase pooler timeout 阻擋。
- Controlled read-only fallback 已完成：6 users update、5 travel preserve、783 media skip、10 media create、0 media update、0 delete。
- 10 筆 create 全部是 Tavis member assets，包含工作樹原有變更，故目前不批准全量 Production write。
- Travel-only 正式 Production dry-run 已通過：0 users、0 member media、5 travel preserve、751 travel media skip、0 create／update／conflict／delete。
- 第一次 `seed:travel` 在 media skip 掃描階段被 pooler 提前中止；事後確認 baseline 0、published fingerprint 不變，沒有寫入。
- 改用受控單一 transaction 建立 baseline：rows 5→5、Base 0→5、sourceFile 0→5，published fingerprint 維持 `1d8d9b5c…9815`。
- 五筆 source hash 均為 64 字元、parser version 為 `phase-16-v1`、`lastImportedAt` 維持 NULL。
- Baseline 後的 full-projection read-back 已成功完成：0 create、0 update、751 media skip、5 travel conflict、0 delete。
- 五筆均維持 safe conflict，沒有 content mutation。`202702-thailand-phuket` 已精確定位到 `sourceSections[item-1c51hpg].links`，其中 Current 的人類可讀標籤屬於 Payload Admin 修改，必須保留。
- 其餘部分 travel 的陣列差異目前仍保守報為整體 conflict；Phase 16 不自動合併不相交的 array edits，以免在未能證明安全時覆蓋 Current。
- 後續兩次唯讀重跑分別遇到 pooler connection timeout 與 120 秒 timeout；依限次策略停止，沒有 mutation。第一次完整成功報告是本階段審查依據。
- 詳細 schema 與後續計畫見 `docs/data-models/travel-projects-schema.md`。

## Browser QA 範圍

本階段沒有改動 Travel 前台 renderer 或 route；沒有新增視覺 QA 範圍。既有 travel detail/index SSR regression tests 由 `test:phase-9` 覆蓋。部署後仍應 smoke test `/travel` 與兩個 planning travel route，確認 migration 後 runtime query 正常。

## 已知限制與 blocker

- Production schema 已與 `main` 的 `sourceMetadata` 定義一致。
- legacy 第一次 safe seed 只建立 Base metadata，不把 Source 覆蓋到 Current；需在下一次 dry-run 檢視差異。
- Payload draft 是 JSON projection 包在 Markdown artifact 中，供人工比較與回填，不保證重建原始 Markdown 排版。
- Phase 16 不做 destructive schema cleanup；Issue #50 所述 drop redundant columns/data 仍需在 reconciliation 累積可信 evidence 後另開 migration phase。
- Production pooler 延遲仍可能讓個別唯讀重跑 timeout；命令會明確失敗，不會無輸出提前退出，也不會因此轉入 write。
- 工作樹中原有 Tavis member assets 變更未納入 Phase 16 commit。

## 下一階段準備度

Phase 16 所需的 reconciliation seam、schema、migration、travel-only scope、五筆 Production baseline、full-projection read-back 與 conflict evidence 均已具備。下一階段可人工處理已列出的 travel conflicts；任何 Production content write、array merge 或 destructive schema cleanup 都必須另行提出 dry-run evidence 與批准。
