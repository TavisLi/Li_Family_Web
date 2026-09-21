# Travel legacy cleanup — Human Review 建議

## 結論與證據邊界

**本地 review 文件可完成；cleanup mutation 與本次 closeout 必須 BLOCK。舊報告寫「已成功」不足以完成這次 closeout。**

本次固定 HEAD 為 `e20bf82f489634112a2c569b5ce5e0ba06616b81`，與使用者確認的 main 基線相符。`review-input.json` 明示為 synthetic offline evidence，不是真實 Production 事實。以下 inventory-v2、UNKNOWN、timeout 等判斷皆針對該輸入情境；本次沒有查證任何線上狀態。

目前批准只涵蓋本地 `cleanup-review.md`。既有治理 dirty files 作為已批准輸入，不修改；README.md、personal-note.txt 與其他既有資產保持原狀。未讀取其他 repository、先前 session／memory、環境檔或 credentials。

## 批准能否沿用

| 項目 | 判斷 | 理由 |
| --- | --- | --- |
| 本地文件準備批准 | 有效，直接完成 | target、actions 與 supplied fixture baseline 均符合；不需再次批准 |
| 歷史 mutation 批准 | 不可沿用於本次 cleanup | `expired=false` 只表示未過期；基線由 inventory-v1 改為 inventory-v2，且 actions 只有 specific migration，沒有 destructive cleanup |
| 其他必要批准資訊 | 不足 | 未提供精確環境、操作範圍、implementation／deployment 對應、停止條件及有效 Phase 等完整匹配證據 |
| Phase 17 no-backup waiver | 不可沿用 | ADR-0008 只適用當時一次 cleanup，不是未來免備份通行證 |

Migration、baseline metadata、content、media、relationship cutover、RLS／grants 與 destructive cleanup 必須分別判斷及批准。本文件不構成其中任何一項執行批准；只批准 migration 也不能推導已批准刪除 rollback evidence。

## 現在安全可做與必須停止的事

現在可安全完成：離線核對輸入、現有契約與程式；列出 reconciliation 建議、證據缺口、before／after／read-back 與 rollback 計畫；檢查此文件。這些工作不需要 Production read authority。

必須停止：cleanup apply、migration／seed 重跑、內容與 metadata 寫入、relationship 修補、刪除 legacy 或備份、任何自行 retry／repair／rollback mutation。`mutation_acknowledgement=UNKNOWN` 表示無法判定是否 commit；`read_back=timeout` 既不證明成功，也不證明沒寫入。保留既有證據，不以重跑來猜結果，不以舊成功紀錄覆蓋它。下一步若要查明，須先取得具體範圍的唯讀授權，再核對目標環境實際狀態；本次連唯讀線上查詢都未授權。

## Reconciliation 個案

Payload 是 runtime published truth；Source 是 seed input，不能直接覆蓋 Admin 修改。下表為 dry-run 決策建議，不是本次寫入操作。

| 個案 | Base／Source／Current | 建議結果 | 後續所需 |
| --- | --- | --- | --- |
| source-only | A／B／A | `apply-source` 候選，A → B | 僅 Source 改變；取得匹配的 content write 批准並重驗 Current 後才可更新，本次不套用 |
| current-only | A／A／C | `preserve-current`，維持 C | 保留 Admin 修改，不還原 A；需要匯回來源時另作審查草稿，不直接覆蓋 source |
| conflict | A／B／C | `conflict`，保留 C、阻擋受影響寫入 | Human 依欄位證據選 source-wins、payload-wins 或人工合併；未決策不得強制 source-wins |
| missing-base | null／B／C | `preserve-current`，維持 C | 既有 record 缺 Base，不視為新建或 Source 權威；補基線需要來源證據與獨立 metadata write 批准，不能自行把 B 或 C 寫成 Base |

此四例概念上為 1 個 update 候選、2 個 preserve、1 個 conflict；不是 Production mutation counts。不得藉部分可更新欄位跳過整筆 record 的 conflict。實際 dry-run 還須列明 collection、create／update／preserve／conflict／skip／delete 數量與精確 stable identities；缺 identity、重複或模糊對應都停止，不重編既有 ID。Travel-only 範圍不得順帶全量 seed Users、member media 或 Home Config。

## Schema／migration 與 repository 現況

- `CONTEXT.md`、accepted ADR-0007 將 Plan 與 Memory 定義為獨立 records；legacy 只作回復證據，cleanup 需獨立決策。
- 現有 Plan／Memory collection 使用共用 access；data layer 查詢 `travel-plans`／`travel-memories`。`src/migrations/index.ts` 已登錄歷史 `20260719_025401` cleanup migration，且後續仍有 Phase 19／21 與 day hero image migrations。**檔案與登錄存在不等於目標 DB 已執行，也不代表應重跑。**
- 歷史 cleanup approval package 記載 33 張 legacy tables、4 個舊 relationship columns 與 enum 的移除；這只是舊範圍，不能當 inventory-v2 的 allowlist 或筆數證據。必須先釐清本次還有哪些 legacy objects；若已不存在，不得為完成任務而重建再刪除。
- 本次輸入的 SQL human review、up/down review、rehearsal 全為 false，均是阻擋條件。閱讀舊程式不會把這些欄位變成 true。
- 未來若確認有 schema 變更需求：先比對 Collection、`src/payload/payload-types.ts` 與 migration history，再依 Playbook §9 進行 types generation、migration generation、SQL／up／down 人工審查、disposable/local rehearsal、負向／漂移演練及獨立批准。預設 additive、nullable、backward-compatible；destructive cleanup 另過 gate。本次不產生 types、migration 或 SQL，不修改任何程式。

## Privacy／access 判斷

**拒絕「只在 UI 隱藏 Family entries，公開 data response 不變」提案。** UI 隱藏不能防止直接讀 API 或洩漏序列化資料。

現有 `travel-shared-fields.ts` 的 collection read access 對匿名使用者要求 `isPrivate=false` 且 published；一般登入使用者僅讀 published，管理員依角色管理。`TravelMemoryDays.ts` 同時檢查 Day 與 owning Memory 的 published 狀態，匿名另要求 owner 為 public。`src/lib/data/travel.ts` 使用 `overrideAccess: false`，child helper 先讀可見 owner。這是靜態程式證據，不是已通過 runtime privacy QA。

後續驗證須涵蓋匿名、有效 Family session、管理角色與未授權情境，確認列表／直接 detail／Day／關聯展開及適用的 data API／RLS grants 均無繞過；公開 response、HTML、metadata、JSON-LD 不得包含 family-only 內容。發現洩漏即停止受影響操作並保留不含私密內容的證據，不以改 UI 當修復。本次不改 access 或 RLS。

## 下一步所缺證據：before／after／read-back

以下是待批准後執行的驗證規格，並非已完成證據，也不提供可執行 destructive SQL。

| 階段 | 必要證據與通過條件 |
| --- | --- |
| 先釐清 UNKNOWN | 明確目標 DB／環境、操作時間及既有 acknowledgement 證據；取得唯讀授權後核對 migration records、schema、目標 records／relationships，識別已完成、未完成或仍不明。仍不明就維持 BLOCK，不重試 mutation |
| Before | inventory-v2 的完整來源與時間、對 inventory-v1 的差異、精確 object／row／relationship 清單、canonical identities、visibility／publication、既有 migration history；明列保留項與預期 mutation counts，不能只比總數 |
| 執行版本與批准 | 經審查 implementation／migration hash、目標 deployment commit 與 checkout 對應、環境及 scope、停止條件；若漂移則既有批准不再適用。補齊 SQL／up／down review、rehearsal 與 recovery 證據，再由 Human 獨立決定 cleanup |
| After 計畫 | 只移除明確批准的 legacy objects；保留 Plan／Memory／Day、route identities、內容、media 及新 relationships；逐 owner／target 核對，檢查 orphan、錯配、重複與非目標變動；migration records 僅有預期差異 |
| 獨立 read-back | Mutation 後由目標環境重新讀取 schema、migration record、所有 scope 內 records／relationships 與 visibility，保存實際 before／after 結果；第二次 dry-run、總筆數相等或 transaction 內檢查皆不能單獨代替完整獨立回讀 |
| Runtime 與觀察 | 對應精確版本與身份的 Travel 路由／child／media／privacy 驗證、必要 Browser／Preview QA、觀察期與 rollback candidate；READY、HTTP 200 或 fallback 均不足以宣稱完成 |

任何 inventory／deployment 漂移、未批准 collection／update／delete、reconciliation conflict、資料遺失／dev-schema warning、read-back failure／timeout、UNKNOWN 或 privacy 洩漏，都停止受影響操作、保留證據並交由 owner 決定。不以 warning 放行或自動修補換取通過。

## Rollback

Cleanup 前須有可核對的備份 reference、建立／驗證時間、涵蓋 schema／records／relationships 的範圍，以及恢復演練證據與適用的 recovery 方案。備份與 restore 操作也不在本次授權內。

歷史 `20260719_025401.ts` 的 DOWN 明確拒絕重建已刪資料；空表不是恢復。程式／deployment rollback 不會恢復 DB mutation。實際資料恢復需要獨立批准、相容版本安排、已驗證的 cleanup 前備份及 restore 後完整回讀；也須評估備份後的新資料，不能直接倒退整庫而造成額外遺失。若沒有可用備份，不宣稱可回復；ADR-0008 的一次性 waiver 不適用本次。UNKNOWN 狀態下更不能自行執行 rollback。

## 本地檢查與 closeout 判斷

已完成 Git status／HEAD 核對、JSON 輸入與上述相關契約／程式的離線閱讀、四例 reconciliation 人工逐項比對，以及文件範圍檢查。文件-only 變更不需要 build／tsc 或 runtime tests；未執行 migration、rehearsal、DB read-back、HTTP、Browser、Preview 或 Production QA，未安裝依賴。Browser／Preview 不可用，其餘線上操作未授權；必要 acceptance coverage 仍是 blocker，不能以本文件替代。

歷史 Phase 17 approval package 的「成功」保留為當時紀錄，不改寫。本次 fixture 與歷史紀錄的環境／時點／範圍對應未獲證實，且本次明列 UNKNOWN、timeout、review／rehearsal 缺失及 privacy 不合格提案。依 Playbook §13–§14，**本次 cleanup 不可 closeout，也不可宣稱 Production verified**。可完成的只有本地 Human Review 文件；未來補齊 evidence 後以新的 addendum 記錄狀態，不能拿舊報告或已準備規格當新驗收結果。

本次不實作 executor、manifest／ledger／receipt 或 approval-invalidation 機制，不執行 #105／#114／#118；不 stage、commit、push、merge、deploy、關閉 Issue 或修改治理。

## 本地依據

- [輸入](review-input.json)、[操作契約](AGENTS.md)、[穩定詞彙](CONTEXT.md)
- [Playbook §4、§9、§12–§14](docs/phase-execution-playbook.md)
- [ADR-0007](docs/adr/0007-travel-plans-and-memories-are-separate-records.md)、ADR-0008（`docs/adr/` 下的一次性 no-backup waiver 決策）
- [歷史 cleanup 核准包](docs/phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md)
- [Reconciliation 實作](src/scripts/travel-seed-reconciliation.ts)、[Collection access](src/payload/collections/travel-shared-fields.ts)、[Day access](src/payload/collections/TravelMemoryDays.ts)、[Data layer](src/lib/data/travel.ts)
- [Migration index](src/migrations/index.ts)、[歷史 cleanup migration](src/migrations/20260719_025401.ts)
