# Phase 17 Travel Conflict Register

## 最新證據狀態

- 2026-07-15 已成功重跑 Production 唯讀 `pnpm run seed:travel:read-back`。
- 結果：0 create、0 update、754 skip、2 conflict、0 delete。
- 三筆 completed travel 已與 Source 收斂，不再是 conflict；目前只剩兩筆 planning travel。
- 兩筆 conflict 的 `sourceChangedPaths` 均為空，差異都來自 Current-only Payload Admin edits。
- 本文件只記錄決策證據，不批准任何 Production write、migration execution 或 runtime cutover。

## 兩筆 planning conflict

| Slug | Field path | Base → Source | Base → Current | 判定 | 建議決策 |
| --- | --- | --- | --- | --- | --- |
| `202607-chongqing-yangtze-river` | `lodgings` | 無變更 | 8 個 item-level paths：city、roomType、address | Source 未變，Current 增加結構化住宿資訊；不是雙邊衝突 | `payload-wins`：copy 時完整保留 Current lodging projection |
| `202702-thailand-phuket` | `sourceSections[item-1c51hpg].links` | 無變更 | 2 個 label paths | Current 把 raw URL label 改為「安納塔拉度假會」「萬豪度假會」 | `payload-wins`：保留人類可讀 label |

完整 Source／Current 摘要見機器產生的 `travel-conflict-register.generated.md`；該檔只含截短摘要，不是 write payload。機器檔的保守 resolver 仍把重慶標為 `manual-merge`，因為 resolver 不會自動把 structured-display conflict 升級成 `payload-wins`；本文件依額外的 item-level evidence（`sourceChangedPaths = []`、只有 Current paths）提出 owner approval 建議，尚未宣稱已獲批准或可執行 write。

## 為何重慶仍阻擋 Plan copy

內容選邊已可判定為保留 Current，但新 `travel-plans` schema 目前刻意沒有複製舊表的 flights、lodgings、daily itinerary 與其他寬表欄位。若直接只搬 `planningSections`，仍會遺失 Current-only lodging edits 與其他尚未證明可丟棄的結構化資料。

因此 blocker 已從「人工內容衝突」轉為「目標 schema 的 lossless preservation policy」。這不是可以用 `source-wins` 或忽略未接 UI 欄位解決的問題。

## 建議的 lossless migration policy

建議在 `travel-plans` 與 `travel-memories` 都增加一個僅供遷移追溯的 nullable snapshot group，保存：

- `legacyTravelProjectId`
- 舊 record 的完整 Current structured projection，包括 Memory legacy section metadata
- 舊 `sourceMetadata`／Base evidence（封存用途，不直接作為新 schema 的 reconciliation Base）
- `migratedAt`
- migration schema version

正式 UI 仍只使用乾淨的 Plan／Memory domain fields；snapshot 不作為前台 renderer input。新 collection 的 reconciliation Base 必須由 target transformer 重新產生。等 Preview／Production read-back 證明新模型完整，且逐欄確認不再需要 rollback 後，才另案取得 destructive approval 移除 snapshot。

這比把所有 legacy arrays 重新加入正式 Plan schema 更能維持 domain 邊界，也比直接捨棄欄位安全。它仍是新的 schema／copy policy，必須由網站擁有者另行批准後才能實作或寫入資料。

## Owner approval queue

1. 批准兩筆 planning travel 的 conflict resolution 均採 `payload-wins`。
2. 批准以 nullable legacy snapshot 實現 lossless Plan／Memory copy；或指定要把哪些 legacy fields 正式納入各自的 domain schema。
3. additive migrations 套用、data-copy write、relationship cutover 各自仍需獨立批准。
