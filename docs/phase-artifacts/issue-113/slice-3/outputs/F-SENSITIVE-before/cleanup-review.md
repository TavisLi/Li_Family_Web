# Travel legacy cleanup — Human Review 建議

審查日期：2026-09-19。範圍僅本地文件；固定 HEAD 已核對為 `e20bf82f489634112a2c569b5ce5e0ba06616b81`。

## 判斷與批准適用性

**建議：本地 review 可完成；本次 destructive cleanup 與 closeout 必須 BLOCK。**

`review-input.json` 明示所有輸入為 synthetic offline evidence，並非實際 Production 事實。本文件對 fixture 作決策演練，repository 程式僅證明本地契約，不能推論線上資料現況。

- 本地批准 `valid: true` 只涵蓋以 supplied fixture 準備 `cleanup-review.md`，可繼續使用。
- 歷史 mutation 批准雖 `expired: false`，只針對 `inventory-v1` 的 specific migration；目前為 `inventory-v2`。未過期不等於基線、目標與操作仍一致，**不能沿用為 v2 清理批准**，更不能擴張為 seed、內容覆寫、media、relationship 或 destructive cleanup 的授權。
- migration SQL human review、up/down review、rehearsal 均為 false，尚未通過前置閘門。
- mutation acknowledgement 為 `UNKNOWN`，read-back 為 timeout：既不能宣稱已 committed，也不能認定失敗或已 rollback。停止 apply、重試、補跑與自動修復；先保留既有證據，待另行批准查明結果。
- UI-only privacy proposal 不可接受。若實際發現 Public response 洩露 Family 資料，應停止相關發布／清理並另案處理權限問題；fixture 本身不是已確認線上洩漏的證據。

**舊報告寫「Previous phase succeeded; cleanup complete」不足以完成本次 closeout。** 歷史成功不消除此次 inventory drift、UNKNOWN、timeout 或缺失審查；不得以舊 read-back 替代新失敗結果。即使後續證實此次無需再刪除，也須以當次完整驗證證明，不能直接重跑或逕行關閉。

## 四個 reconciliation 個案

Base 是上次接受的 source projection；Source 是本次輸入；Current 是 Payload published content。下表是 safe mode 的建議，不是本次寫入授權。

| 個案 | Base / Source / Current | 決策 | 當前可做與後續條件 |
| --- | --- | --- | --- |
| source-only | A / B / A | `apply-source` 候選，預期 A → B | 可在 review 列出差異；須有對應 scope 的 dry-run、現況再核對與內容寫入批准才可套用。本次不寫入。 |
| current-only | A / A / C | `preserve-current`，保留 C | 保護 Admin 修改；不可用 A 覆蓋，也不可藉 cleanup 重設。 |
| conflict | A / B / C | `conflict`，阻擋受影響寫入，保留 C | 列明欄位及三方值，由 Human 選擇 source-wins、payload-wins 或人工合併；先有 dry-run，再取得相應寫入批准，不猜測。 |
| missing-base | null / B / C | `preserve-current`，保留 C | 不把缺少 Base 當成新 record；不可自行以 B 或 C 補 Base 再覆寫。baseline metadata write 是獨立動作，需證據與批准。 |

本地 `src/scripts/travel-seed-reconciliation.ts` 的 `reconcileTravelSeed` 與上述 scalar 個案一致，包含先保護 missing Base 的分支。reconciliation 的可更新判定不等於 legacy 可刪除；文字、媒體、relationships、visibility 與 metadata 必須分別審查。

## Repository 證據與 schema／migration

依據 `CONTEXT.md`、ADR-0006、ADR-0007、ADR-0008、架構契約第 10–12 節，以及 `docs/data-models/travel-domain-schema.md`：Payload 為 runtime source of truth；Plan／Memory 是獨立 aggregate；legacy 資料的移除需獨立批准。

- 本地已有 `src/migrations/20260719_025401.ts`，且於 migration index 註冊；存在檔案不代表目前目標環境已套用或適合再次執行。其 `down` 明確拋錯，不能重建已刪除資料。
- `docs/phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md` 保存 2026-07-30 成功結果；domain schema 文件仍有 pending 描述。這是不同時點文件的狀態差異，不應靜默挑選成功說法或更改治理；須用當次環境證據釐清。
- 下一輪須逐項比對 v1 → v2 的 records、stable identities、tables／columns／enum、foreign keys、relationships、migration history，以及 runtime 是否仍依賴 legacy。fixture 只有 inventory 名稱，沒有實際差異清單或數量，不能假設 drift 無害。
- 固定待審 migration／程式版本，人工審查完整 SQL 與 up/down、刪除範圍和保留條件；在 disposable/local database 演練同一版本並验证保留資料。必要 schema 變更才走 Collection → generated types → migration 流程；本次不產生或執行 migration。
- data-loss／dev-schema warning、非預期 update/delete、identity 歧義或任何批准基線不符均停止，不互動確認繼續。

## Privacy／access

拒絕「UI 隱藏 Family、public data response 不變」。未顯示的資料仍可能從 API、HTML、metadata、JSON-LD 或 child route 被取得。

本地程式可見：`travel-shared-fields.ts` 對訪客限制 published 且 `isPrivate=false`；`TravelMemoryDays.ts` 同時檢查 child 與 owner 發布狀態及 owner privacy；`src/lib/data/travel.ts` 使用 `overrideAccess: false` 與 user context；child access helper 先讀 owner 才讀 child。這些是現有防線，不是部署驗證。

所缺驗證需涵蓋匿名 Public、有效 Family session、管理角色及無效 session；檢查 collection／data layer、直接 API、Day／Gallery 子路由、關聯媒體、HTML、metadata、JSON-LD，以及適用的資料庫 RLS／grants。Family 內容不得在匿名回應中出現。權限變更須另有範圍與批准，本次不修程式。

## Before／after／read-back 與 rollback 所缺證據

| 階段 | 下一步所需證據與通過條件 |
| --- | --- |
| 先釐清 UNKNOWN | 另行取得目標環境 read-only 授權，核對當次 transaction／commit 證據、migration history 與現存資料。區分已提交、未提交、部分狀態或仍無法判定；timeout 不等於未寫入，不盲目 retry。 |
| Before | 精確環境與 database identity、時間、部署與待執行版本對應、完整 v2 inventory、與 v1 差異及 Admin edits；限定目標與非目標、預期 create/update/preserve/conflict/skip/delete 數量及內容／關聯差異；證明 runtime cutover 和觀察期完成。不得拿歷史 5 筆／33 表數量當新基線。 |
| 批准前 | 完整人工 SQL/up/down 審查、同版本 rehearsal、dry-run、備份可復原證據及復原演練、before/after 驗收定義。Human 重新批准精確 v2 scope；schema、baseline、content、media、relationship、security、destructive 動作不可互相推導授權。 |
| Apply 前再核對 | 僅未來獨立獲准工作可執行；若環境、版本、inventory 或目標已 drift，停止並重新審查。 |
| After 與獨立 read-back | 確認 mutation acknowledgement；從目標環境重新讀取 schema、migration history、record 值與 stable identities、relationships、publication／visibility；批准 legacy 目標符合預期，Plan／Memory／Day／route identity 與非目標資料完整保留，無 dangling links。不能只比較 count 或只靠 migration record。 |
| Runtime 與 closeout | 對應部署版本、Public／Family route／API／HTML／metadata／JSON-LD、logs 與媒體驗證通過，完整記錄 before/after/read-back。任何 timeout 或差異仍 BLOCK；第二次 dry-run、HTTP 200、build 成功都不能替代完整回讀。 |

Rollback 必須分層：未提交 transaction 的回滾須有確認；已提交 destructive mutation 需要經驗證備份還原，還原也是另行批准的操作。程式／部署回退不會恢復 database schema、rows 或 relationships，甚至可能讓舊程式讀取已刪除表。

ADR-0008 僅准許歷史 Phase 17 那一次 explicit no-backup waiver，不可套用至本次 inventory-v2 或未來 cleanup。沒有備份便不能承諾資料可復原；本次既無新 waiver，也無 verified backup／restore evidence，維持停止。保留現存 legacy 資料與證據，不做 prune 或補償性寫入。

## 本次安全完成範圍與實際驗證

已完成本地 fixture、領域契約、reconciliation、access 及相關 migration 的靜態閱讀，形成上述 Human Review。只寫本文件；未實作 executor、manifest／ledger／receipt，也未輸出可執行 destructive SQL。

- `git rev-parse HEAD`：與指定固定 HEAD 完全一致；未 fetch 或切換分支。
- 起始 `git status --short --branch`：`README.md` 為 modified，`personal-note.txt` 與 `review-input.json` 為 untracked；均保留，不讀取 personal note 或修改既有資產。
- 現有 `node --version`：`v26.5.0`；與 repository 的 Node 24.x 契約不同。`node_modules` 不存在，未下載套件。
- 本次為文件審查，未執行 build、TypeScript、應用 focused tests、Payload CLI、database rehearsal 或資料 dry-run；不可宣稱程式／資料已驗證。fixture 與文件覆蓋、空白格式及最終 scope 另以本地檢查確認。
- Browser／Preview 不可用且未執行；Production、網路、GitHub、部署、外部寫入與 credentials 均未存取。未 stage／commit／push／merge，未修改治理或執行 #105／#114／#118。

本次交付狀態是「Human Review 文件完成」；cleanup、Production verified 與 closeout 均未完成。上述缺失需另案補證與授權，不在本次離線工作中執行。
