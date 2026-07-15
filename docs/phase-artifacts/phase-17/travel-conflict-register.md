# Phase 17 Travel Conflict Register

## 證據狀態

- 基準：Phase 16 首次成功的 Production travel-only full-projection read-back。
- 基準結果：0 create、0 update、751 travel media skip、5 travel conflict、0 delete。
- Phase 17 於 2026-07-12 重跑 `seed:travel:read-back`，在 120 秒後 timeout；沒有任何 Production mutation。
- 成功基準為保護 Production 內容而只保存欄位路徑與 category，沒有把完整 Payload 值寫入 Git。下列 Source／Current 摘要因此以欄位形狀與已驗證的編輯語意呈現，不偽造未保存的文字內容。

## 每筆 travel 決策

| Slug | Field path | Category | Source 摘要 | Current 摘要 | 建議決策 | 風險 |
| --- | --- | --- | --- | --- | --- | --- |
| `201307-hainan` | `sourceSections` | faithful-source-projection | Markdown parser 產生的完整 section array | Payload published section array；與 Base／Source 存在 array-level 差異 | `manual-merge`，completed travel 不在 Issue #57 cleanup 範圍 | 無 stable item evidence 前接受 Source 可能改寫歷史內容或 interaction anchor |
| `202308-east-australia` | `sourceSections` | faithful-source-projection | Markdown parser 產生的完整 section array | Payload published section array；與 Base／Source 存在 array-level 差異 | `manual-merge`，completed travel 不在 Issue #57 cleanup 範圍 | 同上；不得因 planning schema cleanup 觸碰 completed travel |
| `202602-thailand-phuket` | `dailyItinerary`、`sourceSections` | structured-display / faithful-source | Source 的 day 與 section projections | Current 的 day 與 section projections；兩個 parent arrays 均有差異 | `manual-merge`，completed travel 保留 Current | 本 Issue 不涵蓋 completed travel；只允許繼續做唯讀 evidence |
| `202607-chongqing-yangtze-river` | `flights`、`lodgings`、`dailyItinerary`、`sourceSections` | structured-display / faithful-source | Source 的 planning structured arrays | Payload published planning arrays；差異尚未取得 owner 決策 | `manual-merge`；先以 stable item diff 降低假 conflict | 四個 arrays 同時覆寫會影響已上線 planning 頁內容；不得 source-wins |
| `202702-thailand-phuket` | `dailyItinerary` | structured-display-projection | Source day projection | Payload published day projection | `manual-merge` | 未取得 item-level evidence 前不自動選邊 |
| `202702-thailand-phuket` | `sourceSections[item-1c51hpg].links` | faithful-source-projection | raw URL 作為 link label | Admin 已將 raw URL 改為人類可讀 label | `payload-wins` | 接受 Source 會明確回退已發布的人工整理 |

## Resolution plan

1. `202702-thailand-phuket` 的 link labels 固定為 `payload-wins` fixture；safe mode 必須保留 Current。
2. `flights` 只在 `flightNumber + date + route` 三者完整且唯一時做 item-level diff。
3. `lodgings` 只在 `dateRange + hotel + city` 三者完整且唯一時做 item-level diff。
4. `dailyItinerary` 只在正整數 `day` 唯一時做 item-level diff。
5. `sourceSections` 只在 `anchor` 完整且唯一時做 item-level diff。
6. 任一 stable key 缺失、重複、或 Base／Source／Current 無法一對一配對時，保留 parent array conflict。
7. 本 artifact 不批准 `payload-wins` write、`source-wins` write、Production content mutation 或 destructive migration。

## Owner approval queue

- 可直接確認：保留 `202702-thailand-phuket` 人類可讀 link labels。
- 仍需內容 owner 審查：兩筆 planning travel 的 `dailyItinerary`，以及重慶的 flights／lodgings／sourceSections。
- 不在 Issue #57：三筆 completed travel 只保留 evidence，不納入 planning table destructive cleanup。
