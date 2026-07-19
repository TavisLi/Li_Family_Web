# Phase 17 Travel Conflict Register

## 最新證據狀態

- 2026-07-15 已成功重跑 Production 唯讀 `pnpm run seed:travel:read-back`。
- 結果：0 create、0 update、754 skip、2 conflict、0 delete。
- 三筆 completed travel 已與 Source 收斂，不再是 active conflict；仍在下表保留逐 slug 的最終處置軌跡。
- 兩筆 conflict 的 `sourceChangedPaths` 均為空，差異都來自 Current-only Payload Admin edits。
- 本文件只記錄決策證據，不批准任何 Production write、migration execution 或 runtime cutover。

## 五筆 travel 的最終處置軌跡

| Slug | Field／category | Source／Current 摘要 | 最終判定 | 建議／批准決策 |
| --- | --- | --- | --- | --- |
| `201307-hainan` | 無 active field／`none` | 最新 read-back 為 Source = Current；沒有待處理差異 | migration transformer 可 lossless 搬入 Memory | `converged-no-write`：不再修改舊 Current，搬入 `travel-memories` |
| `202308-east-australia` | 無 active field／`none` | 最新 read-back 為 Source = Current；沒有待處理差異 | migration transformer 可 lossless 搬入 Memory | `converged-no-write`：不再修改舊 Current，搬入 `travel-memories` |
| `202602-thailand-phuket` | 無 active field／`none` | 最新 read-back 為 Source = Current；沒有待處理差異 | migration transformer 可 lossless 搬入 Memory | `converged-no-write`：不再修改舊 Current，搬入 `travel-memories` |
| `202607-chongqing-yangtze-river` | `lodgings`／`structured-display-projection` | Source 沒有新增變更；Current-only 保留 city、roomType、address | Planning 正式內容由 `planningSections` 擁有 | `drop-as-redundant`：不搬 legacy `lodgings`，保留舊表作 migration evidence |
| `202702-thailand-phuket` | `sourceSections[item-1c51hpg].links`／`faithful-source-projection` | Source 保留 raw URL labels；Current-only 是 Admin 人類可讀 labels | Payload Admin 的人類可讀標籤必須保留 | `payload-wins`：Current labels 搬入新 Plan；Source raw labels 留在新 Base |

## 兩筆仍有差異的 planning evidence

| Slug | Field path | Base → Source | Base → Current | 判定 | 建議決策 |
| --- | --- | --- | --- | --- | --- |
| `202607-chongqing-yangtze-river` | `lodgings` | 無變更 | 8 個 item-level paths：city、roomType、address | Planning 頁不讀取此 projection；住宿畫面來自 Source Section「住宿安排」 | `drop-as-redundant`：不搬入新 Plan schema |
| `202702-thailand-phuket` | `sourceSections[item-1c51hpg].links` | 無變更 | 2 個 label paths | Current 把 raw URL label 改為「安納塔拉度假會」「萬豪度假會」 | 已批准 `payload-wins`：保留人類可讀 label |

完整 Source／Current 摘要見機器產生的 `travel-conflict-register.generated.md`；該檔只含截短摘要，不是 write payload。機器檔仍保守保留歷史 conflict classification；本文件記錄網站擁有者後續批准的 domain 決策。這些決策只解除 record mapping blocker，不批准 Production write。

## 為何重慶不再阻擋 Plan copy

程式證據確認 Planning view 只渲染 `sourceSections`；`lodgings`、`flights`、`dailyItinerary` 與 planning extras 沒有接入 Planning view。舊 seed 從同一份 Markdown 再解析這些 arrays，形成重複 projection。網站擁有者已批准不把它們搬入新 Plan schema；住宿正式內容以 `planningSections` 中的「住宿安排」section 為準。

新的 Plan transformer 保留 section level、localized display labels、body、links、media，以及獨立 comment／thumb-up／thumb-down 設定。普吉島 Current link labels 進入新 record；新 Base 仍保存 Source 的 raw labels，因此未來 reconciliation 能辨認 Current-only override。

## 已批准的 migration rollback policy

新 collections **不增加 persistent legacy snapshot**。遷移期間由完整舊 `travel_projects` table 作 rollback source：

- 新舊 collections 並存，舊表先保持可讀且不刪除。
- 新 Plan 只搬正式 domain fields；approved redundant projections 留在舊表。
- 舊 Base 留在舊表作 migration evidence；新 Base 由 Plan transformer 重建。
- Preview／Production read-back、relationship cutover、觀察期與資料庫備份完成後，才另案批准 drop 舊表及 child tables。

2026-07-16 Production 唯讀 mapping dry-run 已確認五筆 records 都是 record-level ready：兩筆 Plans 分別為 archived／active，三筆 Memories 也已完成 lossless mapping 與新 Base/hash transformer。2026-07-17 已完成五份 additive migrations、5-record copy、12／2／1 shadow relationship copy、完整 read-back 與 70-table security migration；舊表仍保留作 rollback evidence。

## 目前仍未完成／需另案批准

1. runtime cutover branch 的 Preview／Production deploy 與觀察期。
2. 舊 `travel_projects`、child tables 與舊 relationship 欄位的 destructive cleanup。
3. Issue #50／#57 關閉；必須依 deploy、觀察與 cleanup 的實際結果判斷。
