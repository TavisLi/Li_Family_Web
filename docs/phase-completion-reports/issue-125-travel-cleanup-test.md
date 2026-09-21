# Issue #125 — Travel legacy cleanup 測試修正

報告日期：2026-09-21；狀態：Locally verified／PR ready，尚未 merge 或 close。

## 1. Scope

採 **Path A**：保留已執行的歷史 migration，修正過時的「index 不得登錄」測試。只改測試、現行 schema 說明及本報告；`vercel.json` 停用所有 `codex/phase-*` 分支的自動部署。未改 migration／index、runtime、依賴、schema 或 Travel 產品行為。

## 2. Branch／Commit／PR

- Branch：`codex/phase-125-travel-cleanup-test`。
- 已 fetch 的最新 main 基準：`c2cf8468c9656b5e37eca29704bedb3113c19d37`；本地 main 與 origin/main 相同。
- Implementation commit：本報告隨修正提交，精確 SHA 以 Draft PR head 為準。
- PR：本地驗證完成後建立 Draft，base `main`；merge commit：N/A。
- Related：[#125](https://github.com/TavisLi/Li_Family_Web/issues/125)；#119 為發現來源，#118 的 CI 分類不在本次 scope。
- 既存未追蹤 `docs/phase-artifacts/issue-118/` 原樣保留，未 stage／commit。

## 3. Investigation／Delivered Work

| 問題 | Repository evidence／判定 |
| --- | --- |
| Migration 做什麼、何時引入？ | `05a85ae87`（2026-07-19）引入 `src/migrations/20260719_025401.ts`。UP 檢查 5／2／3／5 inventory、22／2／1 relationships 與逐 owner mapping，再移除外部 FK、4 個舊關聯欄位、33 張 `travel_projects*` 表與舊 enum；沒有 CASCADE。DOWN 明確拒絕重建已刪資料。 |
| 歷史是否要求移除？ | [Phase 17 核准包](../phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md)「保留內容」要求保留歷史 migration files；「執行流程」前的段落明定 **完成 Production cleanup verify 後再納入 index**。原測試只表達執行前狀態，並非永久禁止登錄。 |
| 是否曾合法使用？ | 同核准包記錄 2026-07-19 synthetic rehearsal、2026-07-29 22／22 rehearsal，以及 2026-07-30 Production batch 8 apply／獨立回讀；`d9efb93aa` 提交 Production 完成證據。[Phase 17 完成報告](./phase-17-travel-plan-memory-split.md) 也記錄該 migration record。[PR #67](https://github.com/TavisLi/Li_Family_Web/pull/67) 是執行前 waiver／executor code，不能單憑其 merge 推定 apply；本判定使用後續執行紀錄。 |
| 現在是否 canonical？ | `src/migrations/index.ts` 恰有一次登錄。`741e90d4b`（2026-09-08，[PR #109](https://github.com/TavisLi/Li_Family_Web/pull/109)）加入登錄，位於 Phase 17 security 之後、member timeline／Phase 18／19／21／daily hero migrations 之前。符合核准包的 post-verification history registration。 |
| 後續依賴？ | 後續 5 筆 migration 的 UP 沒有直接引用此 migration 或已刪 `travel_projects` schema；Phase 19 建立 Memory Day，Phase 21 與 hero migration 延伸新模型。`src/scripts/phase21-c0-package.mjs` 與 `docs/phase-artifacts/phase-21/phase-21-101-c0-frozen-package.json` 將此名稱／batch 8 視為歷史基準。保留 predecessor ordering 與 history identity，不能用刪除登錄修測試。 |
| 移除是否安全？ | 沒有刪除理由。移除會令 index 與已記錄的執行歷史不一致，也不能證明 fresh DB 可重播：此 migration 有特定 inventory guard，且歷史 [Phase 18 報告](./phase-18-member-links-travel-table.md) 記錄 CLI 掃描全目錄。保留 history 不等於批准全量 replay。 |

上述 Production 狀態是本次查閱的 repository 歷史證據，並非本次 live read-back。未確認所有現存環境的 applied history，也未聲稱全量 migration 能建立空白 DB；這些問題不由本次 test correction 隱含解決。

## 4. Key Files／Safety Invariants

- `src/scripts/travel-legacy-cleanup-package.test.ts`：import registry 但不呼叫 UP／DOWN；檢查 cleanup 唯一名稱、正確函式、不得以別名重用函式、Phase 17 prerequisites 在前、較新 migrations 在後。
- 同一測試掃描 cleanup 之後的 migration **檔案**（包括未登錄檔案），拒絕 UP 再操作舊 Travel tables／enum／columns；拒絕退休的 `TravelProjects.ts` 與 baseline／copy／controlled-migration 工具回流。這是特定 Travel contract，並非全 migration 名單 snapshot 或通用 SQL 安全分析器。
- 原有 approval、backup／waiver、inventory、read-back、SQL drop 順序與 no-CASCADE assertions 全部保留。
- `docs/data-models/travel-domain-schema.md`：補註 pre-execution gate 與 post-verification registration 的區別，指出 index omission 不構成 CLI 隔離。
- `vercel.json`：以 `codex/phase-*` minimatch 規則停用 phase branches 的 Git 自動部署；不含已合併後的 `main`，且不留下本 PR 的個別分支名稱。

## 5. Validation

正式驗證使用 Node **24.21.0**／pnpm **10.28.0**。依鎖檔安裝，沒有 package／lockfile 修改；安裝使用 `--ignore-scripts`，本次不宣稱 native lifecycle 或 application build 驗證。

| Command／check | Result |
| --- | --- |
| 未修正的 HEAD 測試，Node 24.21.0 | 預期 FAIL，exit 1，正是舊 index exclusion assertion；先前 Node 24.16.0 初步重現相同失敗。 |
| `node --import tsx src/scripts/travel-legacy-cleanup-package.test.ts` | PASS；保留既有安全檢查且修正 canonical registration contract。 |
| 全部 `src/**/*.test.ts`／`src/**/*.test.tsx`，每檔獨立 `node --import tsx` | **47／47 PASS**，含 cleanup、security package、Phase 21 migration package、daily hero additive migration 與治理測試。 |
| `node --import tsx src/scripts/phase21-clean-room-check.tsx` | PASS；synthetic filesystem／fake DB boundary。 |
| R2 preview 額外 `PHASE21_R2_TEST_MODE=storage-enabled`／`no-public-url` | **2／2 PASS**。合計 **50／50 cases PASS**，涵蓋 package scripts 的測試檔與額外 standalone tests。 |
| 負向 sensitivity probes | **10／10** 由 AssertionError 拒絕：缺漏登錄、重複登錄、錯誤 UP、錯誤 DOWN、cleanup 早於 prerequisites、晚於 successors、別名重用、未登錄 legacy SQL、退休 copy CLI、退休 collection。只修改隔離副本。 |
| `pnpm run lint` | PASS，無 warnings／errors。 |
| `pnpm exec tsc --noEmit` | PASS。 |
| `git diff --check`、scope／credential-pattern review | PASS。 |
| `pnpm run build` | N/A：test／docs 修正與 phase-branch 部署停用，無 application runtime 變更；依 Playbook §10 離線 regression 適用性，不為驗證啟動應用或連線 Production。 |

完整測試在 `git archive HEAD` 加上本次改動的本地隔離副本執行；治理測試會寫回自己的歷史 evidence 路徑，因此不可在原工作區跑它。原歷史 evidence 未修改。可重播上述所有 test files／clean-room 與 R2 modes；本機暫存 logs、逐案 exit code 與負向 probe script 位於 `/private/tmp/issue125-validation/`，不是永久或遠端證據。

## 6. Browser／Preview QA

N/A：無 UI／runtime 變更。Desktop/mobile、Public/Family/Admin、loading/error/empty、metadata/JSON-LD、R2 與互動 Browser QA 均未執行。沒有 deployment 授權；`codex/phase-*` 自動部署已停用，不把 READY 當成驗證。

## 7. Production Verification

N/A：本次沒有 Production access，未查 deployment、HTTP／HTML、canonical、logs、R2 或 observation window。歷史 cleanup 證據不可當作今日環境驗證。

## 8. Migration／Data

Schema／migration／index 變更：無。Production inventory／apply／mutation／read-back／destructive cleanup：均未執行。Production approval：N/A，本 Issue 未授權。

## 9. Security／Privacy

Public／Family boundary、RLS／grants／access control 不變。Diff 檢查無 credential signatures；測試使用 synthetic fixtures，未輸出 private Production response。

## 10. Known Limitations and Blockers

無本次 test correction blocker。未證明任意環境可安全執行歷史 cleanup；缺少 applied record 的環境仍須獨立盤點、演練及批准。未跑 DB migration、application build 或 Browser QA，不宣稱這些驗證通過。

## 11. Rollback

可 revert 本 PR 的測試／說明與分支設定；會回到已知過時 assertion。沒有 data rollback。歷史 migration DOWN 仍無法重建已刪 legacy 資料。

## 12. Issue Closeout

Closed：無。#125 保持 open，Draft PR 待 Human review；#118 的 CI 政策與 #119 的既有驗證紀錄不修改。

## 13. Next-phase Readiness

本地測試基準已恢復；本結果可供 #118 評估 required checks，但不是 CI、merge、deployment 或 release 授權。

## 14. Final State

| State | Result |
| --- | --- |
| Implemented | Yes |
| Locally verified | Yes，50 cases 與 10 negative probes |
| PR ready | Yes，僅 Draft |
| Merged | No |
| Production verified | N/A |
| Closed | No |
