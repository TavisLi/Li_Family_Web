# Travel legacy cleanup — Human Review 建議

## 結論與證據界線

**本地 review 文件可完成；cleanup／mutation／closeout 必須 BLOCK。舊報告寫「已成功」不足以完成這次 closeout。**

本次依據 [review-input.json](review-input.json) 的 synthetic offline fixture，不是真實 Production inventory、執行結果或授權紀錄。固定 HEAD 已本地核對為 `e20bf82f489634112a2c569b5ce5e0ba06616b81`；現有分支為 `codex/docs-113-governance-slice2`。未 fetch、切換分支或查詢外部環境。

Scope 僅此文件：判斷批准適用性、四個 reconciliation 個案、schema／privacy／驗證與 rollback 缺口。Acceptance 是每個判斷均能回指 fixture 或本地 repository，並區分規劃、靜態證據與未執行驗證。既有治理 dirty files 是讀取輸入；README.md、personal-note.txt 及其他既有變更完整保留。程式、schema、migration、source、治理與歷史報告均不修改；不實作或執行 #105／#114／#118，不產生 destructive SQL、executor、manifest、ledger 或 receipt。

## 批准是否可以沿用

| 批准／動作 | 判斷 | 原因與現在可做的事 |
| --- | --- | --- |
| local_review_approval | 可沿用 | target 正是 cleanup-review.md，action 是 local document preparation，fixture baseline 未變且 valid=true；不必重問批准。 |
| historical_mutation_approval | 不可沿用至當前操作 | expired=false 只表示未過期；原 baseline=inventory-v1，當前=inventory-v2，已漂移。原 actions 僅 specific migration，亦不授予 destructive cleanup。環境、精確 migration/hash、範圍與有效停止條件也未充分提供。 |
| Production read-only／重新 inventory | 未批准 | 本次禁止外部存取；只能在本文列出未來所需唯讀範圍，不實際查詢。 |
| migration／baseline metadata／content／media／relationship cutover／RLS-grants／destructive cleanup | 均不能由舊批准推導 | 必須逐類核對獨立批准；現在只準備 Human Review 建議，不執行。 |
| merge／release／closeout | 未批准且證據不合格 | 本地文件完成不等於 cleanup 完成，更不等於 Phase Closed。 |

依 [Playbook §3–§4、§9](docs/phase-execution-playbook.md) 與 [AGENTS](AGENTS.md)，批准重用須 target、actions、scope、baseline、環境、stop conditions、有效期間均符合。不能將「未過期」「程式已存在」「以前成功」當成新的操作權限。

## 現在必須停止的事項

1. inventory-v1 → inventory-v2：停止受影響 migration／cleanup，先補差異與當前精確 target；不默認新 inventory 只是無害變化。
2. mutation_acknowledgement=UNKNOWN：不能推定已 commit，也不能推定已 rollback。保留原始證據，禁止自行 retry、repair、resume、補跑或 rollback mutation，避免重複寫入與破壞判讀。
3. read_back=timeout：本次驗證失敗，不能把空結果視作零筆，也不能以舊 read-back 或舊成功報告覆蓋。未來需另有範圍明確的唯讀調查批准，釐清 transaction／migration record／資料與 relationships 的實際狀態。
4. SQL human review、up/down review、rehearsal 全為 false：migration gate 尚未通過；此次靜態閱讀程式不等於完成該 gate。
5. Family 僅 UI 隱藏的提案：拒絕採用，停止相關 privacy 變更。若未來實際發現 private response／metadata／JSON-LD 洩漏，亦須停止受影響操作並保留安全證據；fixture 的提案不代表已確認線上洩漏。

目前安全工作限本地閱讀、差異判讀、四案建議與缺口文件化。上述阻擋不妨礙本文件交付，但不准以文件準備為由執行其他操作。

## Reconciliation 個案

Base 是上次接受的 source projection，Source 是此次輸入，Current 是 Payload published 現況。以下是 safe mode 的邏輯建議，**不是本次寫入許可，也不是刪除 legacy record 的依據**。

| 個案 | Base／Source／Current | 建議 | 需要的後續證據／決定 |
| --- | --- | --- | --- |
| source-only | A／B／A | 候選 apply-source：僅在獨立 content write 批准及 gates 通過後將目標值更新為 B；現在不寫入。 | dry-run 確認精確欄位、stable identity、Current 仍為 A、預期 update 數及無 scope 外變更；之後 read-back=B。 |
| current-only | A／A／C | preserve-current，保留 C，不用 A 覆蓋 Admin 修改。 | 比對保留欄位與 after/read-back=C；不順便改寫 Base。 |
| conflict | A／B／C | 標記 conflict，保留 C，停止該衝突的套用；不得自動 source-wins 或自行合併。 | Human 逐案選 Source、Current 或合併結果，具體 diff／dry-run 與獨立 write approval；未解衝突不得進入相關 batch apply。 |
| missing-base | null／B／C | legacy preserve-current，保留 C；不是 create，也不能推測 Base=B 或 Base=C。 | 取得可驗證 Base 來源，或另審 baseline 建立方案與 metadata write 批准；不得藉補 Base 靜默接受覆寫。 |

依 [ADR-0006](docs/adr/0006-seed-reconciliation-protects-published-content.md)、[架構 §5.2](docs/全栈系统需求与技术架构说明书.md) 及 [reconcileTravelSeed](src/scripts/travel-seed-reconciliation.ts) 的 safe／missing-base 分支。四案僅是示例欄位，不代表四筆真實 Production records；不得據此聲稱真實 mutation counts。文字、media、visibility、relationships 與 metadata 必須分開列 scope。不得用全量 seed 順帶更新 Users、member media、Home Config；本文也不執行 travel-only seed。

## Repository 現況與 schema／migration 審查

- [Payload config](src/payload/payload.config.ts) 與 [generated types](src/payload/payload-types.ts) 包含 Travel Memories／Days；目前 config 未註冊 legacy TravelProjects。這只能說明程式模型，不能證明資料庫已無 legacy tables／rows。
- [Migration index](src/migrations/index.ts) 註冊 `20260719_025401`；[該 migration](src/migrations/20260719_025401.ts) 含 Phase 17 cleanup，down 明確拋錯，無法重建被刪除資料。[既有 cleanup package](src/scripts/travel-legacy-cleanup-package.ts) 綁定 Phase 17 的 inventory 與 migration history；不能直接套用 inventory-v2 或充當 #105 通用機制完成證據。
- 架構 §8.4／§9 仍描述保留 legacy records／collection，但現行 config 已不註冊該 collection，migration 又存在 cleanup 程式。這是文件與程式的現況落差，無法離線裁定 Production 真相；保持受影響高風險操作 BLOCK，不修改治理，也不把 migration 檔案存在當成已 apply。
- 若後續有真正 schema 需求，須循 Collection → generate types → generated migration → 人工逐項 SQL／up／down 審查 → disposable/local rehearsal（含 negative／drift）→ approval package → 獲准 apply → read-back。預設 additive、nullable、backward-compatible；destructive cleanup 是另一次決定。本次不生成 migration 或 types。
- 審查需說明 tables、columns、constraints、relationships、migration history、RLS／grants 與影響資料；排除歷史 schema 重播及非預期 drop／rewrite。任何 data-loss／dev-schema warning 都停止，不互動確認後繼續。

## Privacy／access

「Hide Family entries in UI only; leave public data response unchanged」違反 [ADR-0002](docs/adr/0002-family-mode-is-an-access-boundary.md) 及架構 §6。Public 不可收到 private records；必須在 collection／data layer 強制，包含直連 API、SSR HTML、RSC payload、metadata、JSON-LD 與 public media relationships。

本地 [travelCollectionAccess](src/payload/collections/travel-shared-fields.ts) 對匿名讀取要求 published 且 isPrivate=false；[TravelMemoryDays](src/payload/collections/TravelMemoryDays.ts) 還限制 parent Memory 的 published／privacy；[data layer](src/lib/data/travel.ts) 使用 overrideAccess=false，[child access helper](src/lib/data/travel-memory-child-access.ts) 先確認 owner 再讀 child。這些是靜態邊界證據，不是所有 route／API 已驗證或 Production 安全的結論。

未來需驗證匿名、有效 Family session、Admin、未登入／失效 session，以及 overview／day／photos／直接 API／media relationships 的負向案例。Family session 不等於 Admin 或 migration operator。若 RLS／grants 需改動，必須另有批准。報告僅保存去敏結果，不收錄 cookie、credentials、私密原文或完整 private response。

## 下一步缺少的 before／after／read-back 與 rollback 證據

下列是供 Human 決策的證據清單，不是執行命令；此次不採集、不 apply、不復原。

| 階段 | 所需證據 | 當前缺口 |
| --- | --- | --- |
| 先釐清 UNKNOWN | 經另批的唯讀調查：operation 與 transaction 對應、migration record、實際 schema／records／relationships；保留 timeout 與原始 acknowledgement。 | fixture 只有 UNKNOWN／timeout，無法確定成功、失敗或部分狀態。 |
| Before | environment／database identity、程式及 deployment commit、script/migration hash、inventory-v1/v2 差異、精確 stable IDs、target 與非 target counts／內容摘要、relationships、privacy、migration history、schema 與權限快照。 | 無 live inventory、identity、diff 或對應部署證據；離線 HEAD 不等於部署 HEAD。 |
| 預期變更 | 分類列出 create／update／preserve／conflict／skip／delete 與 collection scope，before/after 預期值、無關資料不變條件、SQL/up/down 人工審查與 rehearsal 結果。 | 四例不能替代真實 dry-run；所有指定 migration review/rehearsal 均未通過。 |
| Recovery | 經驗證且能回復目標資料／schema／relationships 的 backup、還原演練、復原範圍與可能丟失後續變更的說明；獨立 recovery authority。 | fixture 未給 backup 或有效 waiver；不能聲稱可 rollback。 |
| 新批准 | 精確 target、允許／排除動作、環境、inventory-v2 基線、hash、counts、stop conditions、有效期間及各類獨立批准。 | 舊 migration approval 不適用，也沒有 destructive approval。 |
| After／read-back | mutation acknowledgement 確定後，完整核對 migration record、所有 target records／relationships、schema、非 target 不變及 privacy；記錄實際值與預期差異。 | 目前 timeout，不能當 PASS；失敗或 UNKNOWN 即停，不自行重跑 mutation。 |
| Runtime／observation | 經批准環境的 route／access／metadata／media QA、實際 deployment commit、觀察窗口及異常紀錄。 | Browser／Preview 不可用；未進行 HTTP、Production smoke 或觀察。 |

Rollback 必須區分 code 與 data：回退部署不能復原已刪除 rows／schema／relationships；上述 legacy migration 的 down 也不是資料 rollback。[ADR-0008](docs/adr/0008-phase-17-cleanup-allows-one-time-no-backup-waiver.md) 僅限 2026-07-29 Phase 17 的一次性 no-backup waiver；不得泛化至此次 inventory-v2，更不能豁免 review、drift、read-back 或獨立 apply approval。若 Human 未來考慮新例外，需另行審查明確不可復原的後果，本文不授予例外。

## Closeout 與本次驗證

**舊報告「Previous phase succeeded; cleanup complete」不構成本次 closeout 證據。** 本次已有 baseline drift、UNKNOWN、timeout、缺 review/rehearsal 與不合格 privacy 提案；依 Playbook §12–§14，不能用歷史成功抵銷新失敗。保留原歷史報告，待新的實際證據與獨立 closeout 決定後，以 addendum／Phase index 更新，不改寫舊事實、不關閉 Issue、不宣稱 Phase Closed。

本次完成 fixture 與本地規則／程式的靜態交叉檢查；文件相對連結、四案語意、diff whitespace、敏感資訊與 scope 邊界檢查均完成。既有 dirty／untracked 檔案以 SHA-256 前後比對確認未變，本次 repository 僅新增此文件。未讀取 .env／credentials，未使用網路或安裝依賴。

Application build、tsc、generated types 與 runtime tests：N/A，本次僅 review 文件，沒有 executable config／schema／程式修改。Browser／Preview QA 不可用且未執行；HTTP／Production／read-back／rehearsal 均未執行，不能稱為 fallback runtime validation。文件交付完成，cleanup acceptance 與 closeout 仍 BLOCK。
