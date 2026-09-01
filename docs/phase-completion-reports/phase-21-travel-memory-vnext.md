# Phase 21 Travel Memory vNext 完成報告

日期：2026-09-01
狀態：**Draft PR open；Production read-only inventoried；Preview／write gates pending**

## Scope

Phase 21 定義為 GitHub Issues #94–#102，依賴順序為：

`#96 → #97/#98 → #99 → #100 → #101 → #102`

#94、#95 為 renderer 缺陷修正，與 #100 一併驗證。所有 Issue 於 2026-09-01 即時查詢均仍為 OPEN；在 PR merge、真實資料 read-back 與適用的 Production 驗證完成前不關閉。

## Out of scope／未授權

- 未執行 Preview deployment。
- 未執行 Production migration、content／media write 或 destructive cleanup。
- 未 merge 或關閉 Issue。
- 未納入工作樹中既有的七個 `202702-thailand-phuket/itinerary/` untracked media。

## Branch／commit／PR／merge

- Branch：`codex/phase-21-travel-memory-vnext`
- Base：`origin/main` at `4805a33`
- Commits：`35ffbc5`（implementation）、`b87ec35`（Production inventory evidence）
- PR：[#103](https://github.com/TavisLi/Li_Family_Web/pull/103)，Draft／OPEN／MERGEABLE；Vercel check 建立時為 PENDING
- Merge：N/A

## Delivered work

### #96 Canonical contract

- 鎖定 `Memory → Day → Moment → Placement` ownership。
- 新增 nullable story role 與 Moment transport schema。
- Admin 新增 moment／placement 時自動產生穩定 UUID key；source key 保持不變。
- Markdown parser 支援日期、主題、當日故事，並檢查必要 heading、Day 連號與未知欄位。
- 提供 additive migration 與 migration package test。

### #97–#100 Content、media 與 renderers

- Overview view model 傳遞 participants、travel ledger、stories、global videos 與 reminders。
- 三套 renderer 呈現完整 Overview／Daily content；cinematic 不再截斷前四日。
- Daily 呈現 transport、meals 與 lodging。
- Photos 依 Media asset identity 去重；asset `altText` 不再被誤當 placement `caption`。
- YouTube placement 使用 video ID 建立穩定 identity，並回報 duplicate／unmatched placement。
- safe seed 以 Base／Source／Current reconciliation 管理 `travel-memory-days`，不猜測未知 placement。
- 無影片時不渲染空白 video frame；首張主要圖片提供 priority。

### #101 Retirement

- 已完成 retirement approval package。
- 實際 cleanup 保持 BLOCKED：需 Production inventory、backup／rollback、dry-run 與 Human approval；本 Phase 沒有執行 destructive action。

### #102 Template／SOP

- 新增 canonical Travel Memory Markdown template。
- 新增人類可照著操作的 Source → local audit → migration gate → Preview → Production apply/read-back → rollback SOP。

## Key files

- `src/payload/collections/TravelMemories.ts`
- `src/payload/collections/TravelMemoryDays.ts`
- `src/scripts/seed-content.ts`
- `src/scripts/travel-memory-day-projections.ts`
- `src/scripts/seed-dry-run.ts`
- `src/scripts/seed.ts`
- `src/lib/travel-memory.ts`
- `src/features/travel/travel-memory-pages.tsx`
- `src/migrations/20260831_120000_phase_21_travel_memory_contract.ts`
- `src/scripts/phase21-travel-memory-inventory.ts`
- `docs/templates/travel-memory-source-template.md`
- `docs/travel-memory-source-sop.md`

## Validation

已完成：

- `PAYLOAD_CONFIG_PATH=src/payload/payload.config.ts pnpm exec payload generate:types`
- `pnpm run test:phase-21`
- `pnpm run test:phase-19`
- `pnpm run build`
- `pnpm tsc --noEmit`（build 後）
- `git diff --check`
- synthetic browser QA：3 memories × Overview/Daily × desktop/mobile，共 12 組 PASS，console errors 0、無水平溢位。

最終交付前會重跑上述 automated gates；命令結果以本報告後續 commit 的工作樹為準。

## Migration／data／read-back

- Migration：additive-only，新增 live/version story role enum column 與 Moment locale transport column。
- Migration package static test：PASS；拒絕 CASCADE、unrelated table 與 data DML。
- Disposable database rehearsal：未完成；本機 Docker daemon 不可用。
- Production inventory：修正版 SELECT-only read-back 已確認三筆 Memories（含 `202602-thailand-phuket`）與 `202702-thailand-phuket` Plan 全部存在；三筆 Memory stable keys 無缺漏。前次把 `202702` 當 Memory target 的 missing 判定已撤回。詳見 `docs/phase-artifacts/phase-21/phase-21-production-read-only-inventory.md`。
- Production content read-back：尚未執行，因 migration/content apply 未獲授權。
- Production data effect：0。

## Browser／Preview／Production QA

- Local browser：PASS，詳見 `docs/phase-artifacts/phase-21/phase-21-browser-qa.md`。
- Preview：pending。
- Production read-only inventory：PASS；`202602` Memory／`202702` Plan ownership 與 Production records 均已確認。
- Production browser/content QA：pending。

## Known limitations／blockers

1. 本機沒有可用的 disposable PostgreSQL，migration 尚未 rehearsal。
2. 前次 `202702` Memory missing 判定已撤回；修正版 read-back 證明 `202602` Memory 與 `202702` Plan 均存在，不需要 create。
3. Preview QA、migration、content write、cleanup 與 merge 均需要各自授權或對應 gate 證據。
4. #101 的 destructive cleanup 不能由「完成 Phase」或 Issue closeout 隱含批准。

## Rollback

- 程式：在 merge 前放棄此 feature branch；merge 後以獨立 revert PR 回復。
- Migration：在無資料依賴新欄位前可執行 migration `down`；若已有 role／transport 資料，先匯出與確認資料影響，不能直接 drop。
- Content：safe reconciliation 保留 current-only edit，conflict 時停止；任何 Production apply 之前須保存 before snapshot，失敗則停止且不 cleanup。

## Issue closeout

| Issue | Local implementation | Current GitHub state | Close condition |
| --- | --- | --- | --- |
| #94 | Complete | OPEN | merged + applicable browser verification |
| #95 | Complete | OPEN | merged + applicable browser verification |
| #96 | Complete | OPEN | contract/migration reviewed and merged |
| #97 | Complete | OPEN | true-data Overview read-back |
| #98 | Complete | OPEN | child reconciliation dry-run/read-back |
| #99 | Complete | OPEN | media placement true-data read-back |
| #100 | Complete | OPEN | Preview/Production visual QA |
| #101 | Approval package only | OPEN | separately approved cleanup + read-back |
| #102 | Complete | OPEN | template/SOP reviewed and merged |

## Next-phase readiness

下一個安全 gate 是：

1. 提供可用的 disposable PostgreSQL，完成 migration rehearsal；
2. 等待 PR #103 CI／Preview，取得 Preview QA 批准後驗證；
3. 依修正版 Production 基線準備 migration／content dry-run approval package；
4. 依證據分別批准 migration、content apply、read-back；
5. #101 cleanup 保持獨立 Human approval。
