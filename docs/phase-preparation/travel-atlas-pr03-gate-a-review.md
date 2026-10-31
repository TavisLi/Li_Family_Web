# Travel Atlas PR-03 — Gate A Human review

日期：2026-10-30；Issue 身分核對：2026-10-31。狀態：**條件式設計草案；Human review，未授權實作**。Epic [#167](https://github.com/TavisLi/Li_Family_Web/issues/167)；PR-03 [Issue #180](https://github.com/TavisLi/Li_Family_Web/issues/180)（已核對，open）。本次僅文件，不進行 schema、Production access、資料寫入、部署或 merge。

2026-10-31 Human 決定：**Gate A ACCEPTED WITH FOLLOW-UP**，接受範圍僅限本文件所述設計方向及下列補充決策；不代表 Gate B／C PASS、Issue acceptance 完成或後續執行批准。

2026-10-31 material-gap 核對：GitHub main 仍為 `d8139e4561f7c4bb47fdc8d8c0e00e099660c829`（本次查證）；本地 HEAD／`origin/main` 仍為下列舊 SHA，原工作區 dirty／untracked 證據保留。以下新增內容均為 **proposed**，Human 尚未接受；實際安全性及相容性須由 Gate B／C 證明。

## 基線與證據

- 本次複審於 **2026-10-31 01:03 UTC** 核對 GitHub main 為 `d8139e4561f7c4bb47fdc8d8c0e00e099660c829`。以該固定 SHA 讀回 23 份受影響契約／實作（AGENTS、CONTEXT、PR-01、6 份 accepted ADR、ADR-0010、Plan／Memory／Day／shared fields、PR-02 projection、data access、Source v2 parser／import／reconcilers／seed projections／target、#158 operator doc），其 Git blob SHA 全部與本地 `origin/main@dd41793` 相同；所以下列舊 SHA 固定連結仍對應現行受審內容，並非假設本地 ref 已更新。另核對 PR #174／#176／#177 已 merged、#179 變更範圍及 #180／#158 現行 Issue。遠端 AGENTS 的舊「強制換 thread」規則由本次使用者提供的有效 AGENTS 取代；本次仍停 Human review，沒有切 branch／更新 ref。
- 審查的本地 `origin/main` 為 `dd41793dedf23a8ee1930dad460d667995458380`，含 PR-01 #174、PR-02 #176／#177 與 #178；GitHub 於 2026-10-31 00:09 UTC 回報 main 為 `d8139e4561f7c4bb47fdc8d8c0e00e099660c829`，即 #179 的 merge commit。本地 ref 尚未更新；以下 ownership／schema 原始檔仍依 dd41793 審查，並依 #179 diff 核對漂移。原 checkout 為 `codex/phase-134-slice-3@8c6276c4ee5fa68531ddeeb1a957d14274257f69`，大量既有 dirty／untracked 證據不屬本任務。
- 2026-10-31 核對 [#180](https://github.com/TavisLi/Li_Family_Web/issues/180)：Gate A 停 Human review，依賴 #175／PR #176–#179。[#179](https://github.com/TavisLi/Li_Family_Web/pull/179) 已合併，新增 synthetic 地圖審查介面、local Natural Earth 輪廓與 route guard，擴充地圖呈現但不接 Payload 或改 schema；其資料層已授權輸入前提不變。該合併證據不能證明正式地圖的 privacy、provider 或 Production integration 已完成。
- 以下連結固定至審查 commit： [PR-01 契約](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/docs/phase-artifacts/issue-168/travel-atlas-contract.md)、[PR-02 projection](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/lib/travel-atlas.ts)、[ADR-0010](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/docs/adr/0010-travel-atlas-map-projection.md)。ADR-0010 在此基線仍為 **proposed**，不得誤稱 accepted；本提案遵循 PR-01 契約，並以 accepted ADR 0001、0002、0003、0006、0007、0009 為準。PR-01 文件本身仍標「待 Human review」；合併不代表該標記已更新或授權後續操作。
- [Plan](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/payload/collections/TravelPlans.ts) 有 `planningSections.anchor`、localized 原文，無 stop 模型；[Memory](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/payload/collections/TravelMemories.ts) 與 Plan 為獨立 records，`originPlan` 只是 optional provenance；[Day](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/payload/collections/TravelMemoryDays.ts) 以 Memory＋`dayKey` 識別，Moment 有 `momentKey` 和 localized 文字 `location`，後者不是座標。現有 Admin 產生 Moment key，且 day 內驗證唯一。
- [共享 access／source metadata](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/payload/collections/travel-shared-fields.ts) 對一般讀者限制 published，匿名另限 public；Day 還要求 owning Memory published、匿名時 public。`sourceMetadata.baseProjection` 是上次接受的 Source projection。既有 [Memory reconciliation](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/src/scripts/travel-memory-v2-reconciliation.ts) 是參考實作，不證明新 geo 已受保護。

## 最小模型提案

不新增 Atlas collection，也不改變 Plan／Memory ownership。以下是供審核的語意模型，非已生成的 Payload schema；具體儲存形狀、locale 和 migration 必須在實作前驗證。

| Owner | 建議新增 | 身份與用途 |
| --- | --- | --- |
| Plan `planningSections` | optional 有序 `geoStops` array，每項 `stopKey` 和 optional `geo` | `(Plan ID, section anchor, stopKey)`；一 section 可有多點，順序是資料而非 identity。Plan ID 與 source slug 的對照須經既有 identity 機制確認。 |
| Memory Day `moments` | optional `geo` group | `(Memory ID, dayKey, momentKey)`；一 Moment 至多一點，原 `location`、文字及 placements 保留。 |

`geo` 建議含 localized 顯示名稱、optional 座標組 `latitude`／`longitude`／`crs`、來源描述與原始 CRS、人工確認狀態，以及獨立的發佈許可狀態。所有欄位 nullable／optional；既有內容沒有地點時不建立預設座標或許可。原始 CRS／來源是審核資訊，不自動從地址或照片推導。明確採用 `WGS84` 供投影；只有完整、有限、範圍合法（緯度 ±90、經度 ±180）、CRS 已確認且人工確認／發佈允許的座標可產生 marker；`0,0` 合法。未知／部分／未確認不輸出座標，文字仍可讀；無自動 geocoding、轉換或批量補值。是否需要單獨旅程概覽點與地址欄位尚待具體需求；本提案不憑第一個 stop 或照片推算，也不加入 speculative 欄位。

`stopKey` 建議新項建立時一次產生並持久保存不透明 UUID，source 匯入需提供並保存同一 key；在 section 內驗證非空、唯一且更新時不可靜默變更。移動 section 視為身份變更，須明確 mapping／人工審查；排序、地名及座標變化不得產生新 key。既有 section 並無 geo stop，因此 schema migration 不需為文字自動生成 stop。未來需導入已有外部 stops 時，先離線產生持久 mapping 清單、檢查重複／歧義、dry-run 與 Human 核對；不得靠名稱、index、位置或重新執行時再生成 key 推測配對。重複、缺 key、section anchor 不唯一或 mapping 不明則 BLOCK 該項。

上述規則也適用既有 `momentKey`／`placementKey`：沿用 Current 原值，不把既有 key 轉成新 UUID。`TravelMemoryDays.withGeneratedTravelMemoryKeys` 會對缺 key 產生新 key，Source v2 `projectMemoryV2` 會在未提供 `momentKey` 時由 slug／day／scene 推導；兩者都不是 legacy mapping 證據。PR-03 對已有 Moment 的 geo update 必須在生成／寫入前驗證精確 key 與 owner；缺 key、改 key、改 section anchor／dayKey 或跨 owner 移動一律先列 mapping／conflict，不讓既有 fallback 靜默配對。新 Admin 項的一次生成與既有項的身份保全須由 server 驗證，不能只靠 `admin.readOnly`。PR-02 `TravelAtlasEntry.id` 須由包含 `plan`／`memory` 類型的完整 owner tuple 無歧義編碼，跨旅行／Day 的同名 key 不得碰撞；Payload array row ID 與 renderer group ID 都不取代 domain key。

具體輸出建議採版本化、可逆的結構化 tuple 編碼：Plan `['plan', planId, anchor, stopKey]`；Memory `['memory', memoryId, dayKey, momentKey]`。編碼保留字串邊界及型別，不以未跳脫分隔符串接；必須在資料層授權及 identity 驗證後才輸出。Day 重綁 Memory、key／anchor 變更與跨 owner 搬移不能只以新 ID 視為新項而遺留或刪除舊項；先列出舊／新完整 tuple 與非目標影響，缺少一對一經審 mapping 則 conflict／保留 Current，亦不得沿用舊 geo 許可。

## Source／Admin reconciliation

以完整來源地理內容 group（座標、名稱、來源／原始 CRS）作原子比較單位，依上述完整 owner identity 做 Base／Source／Current 比較；人工確認／發佈決策另由下節的 Admin 權限控制，不接受 Source 自行批准。localized 名稱以明確 locale 值比較，禁用 fallback 冒充該 locale 的 Base；非 localized 座標／key 不得由另一 locale 的 import 覆蓋。序列化須固定 locale、欄位順序及 null／缺項語意並測試。當 Current＝Base 且 Source 改變才提出 source-only update；Source＝Base 而 Current 變動則保留 Current；兩者有不同變更為 conflict；同值變更可保留並在核准後推進 Base。既有 record 缺 Base 或無法證明其 geo 子 projection 的 Base 時 preserve-current，不能把空欄位猜成已接受的 Base。新項只有明確 key、owner、合法資料及審查過的 visibility 才列 create，geo 許可預設未批准。

Source 未提供 geo 或 stop 不代表刪除／清空；明確清除亦列為獨立受審項目，預設不執行。依 stable key 比較項目，順序和 relationship 另報；不同順序或雙方改序不得靜默覆寫。dry-run 分列 create／update／preserve／conflict／skip／delete、排序、visibility、baseline metadata 與 before-image，具體標識必須避免洩漏私密位置。conflict 不自動寫入；Base 僅在相應內容成功寫入並 read-back 後按已批准契約推進，失敗／UNKNOWN 不推進。內容、baseline metadata、relationship、migration、cleanup 各有獨立授權；不得借用全量 seed 更新其他資料。

**實作落差，不能直接重用為 PASS**：現有 `reconcileMemoryV2` 對 group 遞迴逐欄 merge，`keyed()` 不認識 `geoStops.stopKey`，且部分巢狀 Base 缺失不等於整筆 Missing Base；PR-03 須先做 geo 子 Base 完整性與原子比較，不能把 Source 改 latitude、Current 改 longitude 合成第三個位置。Plan seed `mapSection()` 尚未攜帶 geo，`writeTravelSeedTarget()` 會寫入其 source metadata；Memory Source v2 的 Base 實際位於 **owning Memory** 的 `sourceMetadata.baseProjection.locales[locale].days[dayKey]`，不能假定 Day metadata 已有 Base。最小修正是沿用既有 domain envelope、明確版本／geo 子 projection，保留其他 locale／domain Base；舊 reader／writer 若不能保留新欄位，對受影響寫入 fail closed。須以 legacy Plan seed、Memory v1／v2 及 Admin 編輯的 round-trip 證明：省略 geo、改原文或改序不會清空 geo／許可、重建 array row IDs、覆寫 Base、丟失 placements／caption／relationships。不得將驗證範圍擴成自動採納舊資料。

**Gate B／C 分項驗收**：以同一 synthetic before-image 的獨立副本分別執行 (1) 舊 Plan seed 更新 section 文字／排序並保留 geoStops、stopKey、row IDs 與非目標 Base；(2) Memory v1 更新既有 Memory，保全 parent envelope 中非目標 Base、Days、placements、caption 和 relationships；(3) Memory v2 單一 locale 更新 Day，保全其他 locale、非 localized geo、Current keys／row IDs 和 parent envelope 的其餘 days／assets；(4) Admin 讀取後只改無關文字及排序再儲存，保全非目標欄位、既有版本與關聯。已批准的目標 Base 更新另行報告與讀回。每項比較 before／after 的完整非目標集合與 row IDs，並檢查缺 geo 子 Base、缺 Source、雙方分別改不同座標、空值／缺項及重複 key。無法安全 round-trip 的舊路徑須在任何寫入前阻擋，不能以 dry-run 或單元 mock 取代實際 Payload／DB 驗證。

## 權限與洩漏邊界

除現有 owner／Day access，geo 發佈必須由資料層強制：預設未批准，只有明確批准之欄位才可給已授權讀者。Public 僅 published 且 public owner；Family 為經認證的 published 內容；Admin draft／審核資料限管理者。新增 field access 或安全 projection 的實際選擇須證明直接 Payload REST／GraphQL／Local API 與巢狀關係不能繞過；只在 UI 或地圖投影過濾不足。若無法讓已發佈 owner 的未批准 geo 對直接 API 安全，則不實作／不發布，直到有可驗證的欄位保護方案。

接受的許可方向：人工確認與發佈許可由 Admin 寫入，Source 不得設定／繼承批准；區分未批准、Family 可讀、Public 可讀 audience，並與 owner／Day access 取交集。批准綁定完整 geo 值與 owner identity；座標、名稱／來源、CRS 或 owner mapping 改變時重新確認，不能因 owner 由 private 改 public 而升級許可。一般儲存／匯入不得重新批准。

**Human 補充決策（已接受）**：Audience 縮小立即收緊存取並使舊批准失效；恢復發佈需 Admin 明確重新批准。首版完整 geo（含所有 locale）整組批准，不提供 locale 獨立批准。

**Gate B 必須提出的 proposed 審核綁定方案**：受管理者權限保護的確認與 audience 記錄，綁定完整 owner tuple、所有 locale 明確值、座標／CRS／provenance 及受審 audience 的版本化 canonical snapshot 或其私有 fingerprint；fingerprint 及審核內容不得洩漏給未授權讀者。位置、owner／Day access 或 audience 改變時，server 必須原子撤銷舊許可或令讀取時的綁定比對失效；無法保證原子性時先撤銷再改值，失敗維持未批准。Source 只能提內容，包含 source-only update；不得透過欄位、Base、舊 writer、Admin 自動儲存或 replay 設定／恢復批准。並發 Admin 審核與 Source 更新須驗證 Current 版本，讀後已變更則 conflict／拒絕。snapshot／fingerprint 的具體儲存方式由 Gate B 提出最小可驗證方案，Human 決策要求的值綁定、並發控制及批准失效規則不得弱化。

**Base 也是私密資料副本**：現有 `sourceMetadataField()` 只有 Admin UI read-only，沒有 field read access；Memory 的 parent Base 還可能包含 Day geo。新增 geo 前，所有含 geo 的 Base／provenance／審核資料須由 collection field access 限管理者（包含 owning Memory 的 envelope、各 locale 與 versions），或證明等價且覆蓋直接 API 的隔離；只遮罩 `moments.geo` 不足。非管理者不得透過 geo／Base 的 where、sort、count 或 relationship 查詢推測未授權值。Local API consumer 在 `src/lib/data` 綁定 session、明確 `overrideAccess:false` 並輸出 generated types 派生的 allowlist DTO；有意 bypass 的受控內部流程不得將原 record／Base 交給 client。測試 published owner 含未批准 geo、Family-only geo、直接 parent／Day／version 查詢及查詢側信道，確認名稱／地址也遵守相同許可。

資料層必須對未批准、Family、Public 分別套用「讀者 audience ∩ owner／Day 狀態」；draft／versions 僅 Admin。須覆蓋 geo 名稱、座標、來源、原始 CRS、各 locale、審核記錄及 Base 的所有副本，包括 parent envelope、nested relationships、REST／GraphQL／Local API、版本與 fallback locale。對不具權限的 geo／Base 查詢，where／sort／count／聚合與 relationship 過濾須拒絕或只基於該讀者已授權集合，不能以 response 刪欄後的結果數、排序或錯誤差異推知隱藏值。Payload 欄位 access 是否足以約束查詢與 nested array 目前 **UNKNOWN**；Gate B 需選定並證明可行的 server-side enforcement，不能證明則阻擋受影響資料的儲存／發佈及消費。測試不同隱藏值替換後，匿名／Family 的 response、count、排序、bounds、cache 與錯誤不得洩漏差異；不允許 client 先收到完整原始 record 再過濾。

既有 Moment `location`、section 原文與其他既有可見文字不自動視為 geo 發佈許可或可安全公開的替代值；Gate B／C 須盤點所選 DTO、搜尋與 metadata 是否把待保護位置重複輸出。若既有公開內容已含相同位置，列為獨立 privacy 審查問題，不能以 PR-03 的資料遮罩宣稱該內容已隱藏，也不自動改寫既有文字。

PR-02 `projectTravelAtlasEntries` 明確假設輸入已授權，僅驗 WGS84、將無效點留於文字清單並以完全相同座標群組；它不驗人工確認或發佈許可。未來 adapter 必須先完成 owner、Day、geo 欄位過濾，再建立 markers、cluster、bounds、數量、連結、導航、metadata、HTML／RSC／JSON-LD 和 cache；避免 `item` 攜帶未授權原物件。Family／draft private/no-store，session 切換清除資料；family 第三方 tiles 預設停用，單次明確導航點擊不等於背景傳送同意。不可把私密座標送 analytics、geocoder、tile URL 或 log；測試直接 API 與所有上述側信道。

## Migration、rehearsal 與 rollback 提案

1. Human 確認模型及身份、隱私決策後，下一實作 gate 才能生成 Payload types 與 additive nullable migration；檢查現有 migration history、localized arrays／versions 的實際 SQL，逐項人工審查 up／down、鎖、約束、預設和舊資料相容性。不得依此文件執行 migration。
2. [#158](https://github.com/TavisLi/Li_Family_Web/issues/158) 已 closed，限縮交付為 semantic replay 與一個 Memory consumer；其[操作文件](https://github.com/TavisLi/Li_Family_Web/blob/dd41793dedf23a8ee1930dad460d667995458380/docs/rehearsal-environments/issue-158.md)可作 disposable 的基礎，但 migration readiness／legacy parity／physical fingerprint／source-role RLS parity 仍 BLOCK，platform／collation UNKNOWN。不能把既有 local PASS 當此 migration 或 live fidelity PASS。先依 #158 的限制取得適用 baseline／schema-fidelity 證據，再對新 up/down、舊資料及真實 Payload consumer 做獨立 disposable rehearsal；未有足夠 baseline 時 migration rehearsal 保持 BLOCK。
3. Synthetic 驗證至少涵蓋空／legacy、重排與 stable key、重複／缺 key、locale、Source-only／Admin-only／雙改／Missing Base／缺項、部分與無效 CRS、0,0、公開／家人／draft owner × Day、直接 API、cache 及 projection 洩漏、before-image、完整 read-back、失敗與 transaction rollback；驗證歷史版本保留及可能的 `maxPerDoc=30` pruning，不能假定 rollback 恢復被刪版本。
4. 若未來獲得分開的 Production 權限，先有 exact target／baseline、before-image、dry-run、變更範圍、回復與讀回計畫；schema、metadata、content、relationship 分開批准。先停新讀寫並回退 consumer 以保持舊版可讀；有資料後執行 down 可能刪 geo 和版本資料，**不是安全回復**。必須先保存並驗證備份／before-image，提出經 rehearsal 驗證的 restore 或 forward-fix、資料損失及 read-back，並取得獨立批准；不得自動 down、清理或覆寫。任何 warning、drift、read-back failure／UNKNOWN 保留證據並停止受影響 live action。

Disposable 的前置安全條件沿用 #158／#105：只使用 owner-marked 隔離 DB／storage、受審 schema-only artifact 與 deterministic synthetic fixture，不繼承本 repo `.env`、Production DB／R2／email credentials，並明確關閉 dev schema push。證據綁定 exact HEAD／lockfile／Payload adapter／PostgreSQL／baseline artifact／migration state／fixture／executor；schema-only restore 不等於已執行 migration，不偽造 migration receipt。generated SQL 必須檢查 live／localized／array／version tables、FK／index／lock 及新增表的 RLS／grants，禁止夾帶歷史 drop、backfill 或權限擴張。分別驗證 up、尚無 geo 資料時的 down、含新資料時的備份 restore、舊 consumer 可讀寫及非目標 row／history 保全；transaction rollback 不能代替 restore。成功、失敗、中斷均保留 #105 receipts 並讀回本 run 資源清理；cleanup UNKNOWN 仍 BLOCK。#158 deferred fidelity／migration／legacy 工作由 #161／#162 追蹤，不因 #158 closed 而放行；本次沒有執行 rehearsal 或取得任何新 live baseline。

Gate C 的 evidence 分開列示：(a) 連線前核實 run-owned DB／storage、環境隔離與拒絕 Production target／credential、dev push disabled；(b) types、migration source 與 generated SQL 的精確 hash 及人工 up／down 審查；(c) 實際 migration up／空新欄位 down 的 migration state、schema 與 read-back；(d) 實際 Payload transaction rollback 的 row／relationship／locale 比對；(e) 含 synthetic geo 的受保護 before-image、獨立 backup restore 與完整 read-back；(f) version history／pruning 前後比對與非目標保全；(g) 成功／失敗／中斷的終端結果、僅本 run 的 cleanup 和 absent read-back。各結果分別 PASS／BLOCK／UNKNOWN，任一必要項未證明不得合併成整體 PASS；不得建立虛構 migration rows、以 schema-only restore 聲稱 migration 已執行，或把含新資料的 down 當安全回復。

## 複審的 material gaps 與最小 follow-up

以下是本次發現並補入設計的要求，**文件補正不是實作修復證據**。

| 缺口／風險 | 現行證據 | 最小修正與關閉條件 |
| --- | --- | --- |
| P1：遮罩 geo 仍可能從 Base 洩漏位置 | `travel-shared-fields.ts: sourceMetadataField` 無 field read access；`travel-memory-v2-import.ts: nextEnvelope` 在 parent 保存 Day Base | Gate B 保護所有 geo／Base 副本；Gate C Public／Family／Draft 直接 API、locale／version／查詢側信道測試通過。 |
| P1：來源自批或座標改動後沿用舊批准 | 草案原本未限定確認／許可 writer、audience 與失效規則 | Human 確認上述 Admin-owned、值綁定、audience 交集方向；Gate B／C 證明 Source 不能批准，改值／owner／audience 不會帶出舊許可。 |
| P1：逐欄合成位置／Missing geo Base／舊 writer 相容性 | `reconcileMemoryV2: merge/keyed`、`mapSection`、`writeTravelSeedTarget`；現行 envelope 不是 Day-local Base | Gate B 加原子 geo 比較與子 Base gate、保留 envelope；Gate C legacy writer round-trip、雙改不同分量、其他 locale Base／非目標保全通過。 |
| P2：既有 fallback 改 key／跨 owner ID 碰撞 | `withGeneratedTravelMemoryKeys`、`projectMemoryV2`、PR-02 泛型 `id` | Gate B 以 Current stable keys／明確 mapping 及無歧義 tuple ID 接口；Gate C 重排／改名／缺 key／跨旅行同名 key 測試通過。 |
| P1：把 semantic replay 或 down 當 migration／資料回復 PASS | #158 現行 narrowed closeout、operator doc；`maxPerDoc=30` | Gate C 取得適用 fidelity／migration-state 證據並獨立驗證 migration、legacy consumer、restore／history 與 cleanup；未完成仍 BLOCK／UNKNOWN。 |

## 狀態與下一 gate

- **PASS（文件審查範圍）**：已定位 owning schema、現有權限及 PR-02 投影接口，核對 #179 與 main 漂移，提出身份、三方共編、隱私、migration／rollback 和測試邊界；未執行 runtime 驗證。
- **BLOCK**：實作／migration readiness、Production schema fidelity、legacy parity 與實際 access／rollback 驗證尚無本變更證據；本 gate 不授權它們。ADR-0010 在審查基線尚未 accepted，不得提升其決策地位。
- **UNKNOWN**：實際 Production schema／資料、geo 的確切 Payload field access 和 migration 形狀；沒有 Production 讀取。
- **ACCEPTED WITH FOLLOW-UP（Human 已接受）**：範圍僅含本文件的 ownership、identity、原子 geo reconciliation、Admin 許可／副本保護、rollback 設計方向，以及本次補充的 audience 縮小、整組 locale 批准與 Gate B 綁定方案要求。上表 follow-up 必須落在 #180 Gate B／C，未完成不得宣稱 PR-03 驗收／整合／migration ready。ADR-0010 的狀態維持 proposed；本決定不更新 ADR 或授權後續執行。
- **本次驗證**：固定 main／Issue／PR 與 23 份 blob 比對、契約／程式靜態審查及文件差異／引用／secret 檢查；build、TypeScript、Browser／Preview、CI、Payload access 與 disposable rehearsal 均未執行，對本次 docs-only correction 為 N/A，對後續 runtime acceptance 仍缺證據。
- **唯一下一 gate：Human review**。Gate A 已按上述範圍接受；後續若提出 Gate B，先核對 main 與契約，再依獨立授權進行本地實作。Gate B／C follow-up、schema migration／Production 讀寫、部署與 merge 均未獲本次批准。
