# Phase 21 #96／#97／#98／#99／#102 最終 acceptance evidence

日期：2026-09-09

合併基線：`origin/main` `65640c8`（PR [#111](https://github.com/TavisLi/Li_Family_Web/pull/111)）
範圍：只整理既有 implementation、read-only inventory、測試與 Human visual acceptance；沒有執行 Production mutation，也沒有關閉 GitHub Issue。

## 判定方法

- `PASS` 表示每個 Issue acceptance criterion 都能連到可重現的程式、測試、唯讀資料或 Human acceptance 證據。
- 文件不把歷史 local/Preview 測試誤稱為新的 Production apply。Issue #98／#99 明確要求「Production mutation 維持未執行」，該條件已由對應 evidence 滿足。
- 先前在此 worktree 的依賴安裝嘗試曾因 DNS 無法解析 npm registry 而停止；不把該次嘗試列為驗證。依賴就緒後，已在 Node `20.20.2`、`65640c8` 基線完整執行 `pnpm run test:phase-21` 並通過。
- Human 已於本次 closeout 前明確驗收 #94、#95、#100 的視覺呈現；這是 current deployed overview／scene navigation／daily card 呈現的產品 acceptance，不取代 schema、reconciliation 或 media identity 的技術證據。

## 總覽

| Issue | 判定 | 結案所依據 | 尚未執行的外部動作 |
| --- | --- | --- | --- |
| #96 | PASS | canonical field contract、ADR、Production read-only inventory、Phase 21 contract suite | GitHub close |
| #97 | PASS | typed shared Overview VM／三 renderer tests、三筆 Preview GET-only QA、Human visual acceptance | GitHub close |
| #98 | PASS | parser／reconciliation／dry-run／all-date renderer tests、clean-room 與 browser evidence | GitHub close；Production content/media write 不在 scope |
| #99 | PASS | placement ownership contract、duplicate/unmatched safeguards、Photos filters/tests/browser evidence | GitHub close；Production media write 不在 scope |
| #102 | PASS | canonical template、human SOP、fixture validation、clean-room end-to-end evidence | GitHub close |

## #96 — canonical contract

| Acceptance criterion | Evidence |
| --- | --- |
| 三筆正式 Memory 的 parent／Day／Moment／Placement inventory 可重跑 | `docs/phase-artifacts/phase-21/phase-21-production-read-only-inventory.md`：`pnpm run travel:phase-21:inventory`、三筆 Memory、25 Days、stable key 缺漏均為 0、Production writes 0。 |
| Markdown → parser → Payload → projection → renderer mapping | `docs/phase-artifacts/phase-21/travel-memory-field-contract.md` 的 canonical ownership 與 three-renderer contract；`src/scripts/travel-memory-source-contract.test.ts` 納入 `test:phase-21`。 |
| 欄位處置與 ownership | 同一 field contract 對 owner 與 KEEP／ADD／MERGE／DEPRECATE／DELETE-CANDIDATE 逐列定義；涵蓋 stories、transport、global videos、gallery、daily media、reminders 與兩個 Media relationship 欄位。 |
| reconciliation／key／caption／altText | field contract 的 identity/conflict rules；ADR `0009` 規定 Admin technical key 自動生成且唯讀，並分離 asset altText 與 placement caption。 |
| migration、cleanup、rollback、read-back 分階段 | `docs/phase-completion-reports/phase-21-travel-memory-vnext.md` 的 migration/read-back/rollback；#101 實際 cleanup 另有 `phase-21-101-current-state.md`，不混入本 Issue。 |
| owning ADR 與 focused tests | `docs/adr/0009-travel-memory-pages-share-one-content-model.md`（accepted）與 `package.json` `test:phase-21` 的 contract、inventory、seed-safety、projection、renderer tests。 |

## #97 — Overview

| Acceptance criterion | Evidence |
| --- | --- |
| 共用、generated-type-derived Overview VM，route 不直查 Payload | ADR `0009` 的 shared style-neutral model contract；`src/lib/travel-memory.ts`、`src/features/travel/travel-memory-pages.tsx` 與 `src/lib/travel-memory.test.ts`／`src/features/travel/travel-memory-pages.test.tsx`。 |
| participants、ledger、stories、reminders、global video 與 optional 收合 | `travel-memory-field-contract.md` 的 Overview contract；clean-room renderer output 覆蓋 Overview，並檢查同行者、航班、住宿、stories 與影片。 |
| 三套 renderer 使用同一契約 | ADR `0009`；`phase-21-clean-room-projection.json` 列出 Editorial、Cinematic、Family Scrapbook 的三個 Overview render。 |
| 三筆正式資料、access、browser QA | `phase-21-preview-production-db-read-only-qa.md` 記錄三筆 true-data Overview 的 GET-only Preview QA；使用者已驗收 #94/#95/#100 目前視覺呈現。collection/data-layer access contract 未因 renderer change 修改。 |

## #98 — Daily child reconciliation

| Acceptance criterion | Evidence |
| --- | --- |
| Daily parser 與 approved Day／Moment fields | `travel-memory-source-contract.test.ts`、`test:daily-parser`、`travel-memory-day-projections.test.ts`；ADR `0009` 定義 Day identity、Moment transport 與 Placement key。 |
| child dry-run、Base/Source/Current、Missing Base | `phase-21-new-memory-dry-run-design.md` 與 `phase-21-clean-room-projection.json`：parent、Day、media dependency、preserve-current、collision、unmatched、duplicate 都有 action/report assertion。 |
| 三 renderer、無影片收合、全部日期 | `phase-21-browser-qa.md` 的三種 style Overview/Daily desktop/mobile matrix；`test:phase-21` 含 daily parser、projection、reconciliation、renderer tests。 |
| 澳洲影片 ownership assertion | `phase-21-clean-room-manifest-fix.md` 記錄 global/daily video 去重與 Day filter；`phase-21-photos-type-filter-fix.md` 記錄 daily/global YouTube identity regression。 |
| migration/rehearsal/quality gates，且無 Production content mutation | completion report 的 additive migration rehearsal與 read-back；Production inventory documents confirm no content/media write。 |

## #99 — media ownership

| Acceptance criterion | Evidence |
| --- | --- |
| 唯一 owner 與 Moment → Placement 投影 | `travel-memory-field-contract.md` 的 canonical ownership/three-renderer contract；ADR `0009`。 |
| stable identity、duplicate/unmatched fail-closed | field contract identity rules；`phase-21-clean-room-projection.json` 的 collision/unmatched/duplicate conflict cases；`phase-21-new-memory-dry-run-design.md`。 |
| altText/caption、Admin technical keys、YouTube identity | ADR `0009` 與 `phase-21-clean-room-manifest-fix.md`；`phase-21-photos-type-filter-fix.md` 的 URL canonical identity／unsafe URL tests。 |
| relationship-field disposition | canonical field contract 對 `relatedMembers`、`relatedTravelRecord` 指定 DEPRECATE/derive-or-retire boundary；Production inventory 記錄三筆 count 均為 0。 |
| Photos filters、dedupe、return links與三筆 fixtures | `phase-21-photos-type-filter-fix.md` 的 type/date/pagination/dedup/browser matrix；`phase-21-clean-room-manifest-fix.md` 的 three-source regression（25 Days、724 media）與 clean-room Photos renderer coverage。 |
| 無 Production media mutation | production inventory/read-only evidence與 Photos artifact 都記錄 writes 0。 |

## #102 — canonical template and SOP

| Acceptance criterion | Evidence |
| --- | --- |
| 唯一 canonical template、符合 field contract | `docs/templates/travel-memory-source-template.md`；`docs/travel-memory-source-sop.md` 明指它為唯一 completed Memory template，Planning template 僅供 Plan。 |
| parser fixture validation | `src/scripts/phase21-clean-room-check.tsx` 直接讀 template；`test:clean-room` 和 `travel-memory-source-contract.test.ts` 均納入 `test:phase-21`。 |
| presentation locations、caption/alt、folder/manifest、Admin keys | SOP 第 2 節與 template manifest rules；field contract/ADR 定義 renderer owner 與 system-generated keys。 |
| human process | SOP 第 1–7 節依序覆蓋準備、audit、travel-only dry-run、conflict、migration、Preview/Human approval、Production apply/read-back、browser QA、rollback 與 stop conditions。 |
| synthetic clean-room | `phase-21-clean-room-manifest-fix.md` 與 `phase-21-clean-room-projection.json`：parser、source builder、dry-run、12 renderer outputs（Overview/Daily/Photos × 3 styles），且 production connections/persistent writes 為 0。 |
| history preservation/privacy | SOP 禁止 secrets；template 為 synthetic fixture；本 closeout 採 addendum，未改寫歷史 completion report。 |

## 結案建議與邊界

這五個 Issue 的 implementation 與 acceptance evidence 已具備關閉條件。下一個動作僅是把本文件及 closeout addendum 經 PR 審查、merge 後，逐張關閉 #96、#97、#98、#99、#102；不應順帶關閉 #105，也不應把 Issue close 視為對 Production content/media write 或其他 cleanup 的授權。
