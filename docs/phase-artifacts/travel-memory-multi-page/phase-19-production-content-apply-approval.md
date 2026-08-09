# Phase 19 Travel Memory Production content apply approval package

日期：2026-08-09

## 目的

本 approval package 用於審核下一步 Production content apply。此步驟只會建立缺少的 `Travel Memory Days` records，不做 schema migration、不寫 media files、不覆寫既有 Phuket daily records。

## 前置狀態

- PR #84 已 merge：`19c21ce docs(travel): map australia itinerary media (#84)`
- Production schema 已具備 Phase 19 `travel-memory-days` 結構。
- 三個 Travel Memories 目前 read-back：

| Travel Memory | ID | Status | Style |
| --- | ---: | --- | --- |
| `201307-hainan` | 1 | `published` | `family-scrapbook` |
| `202308-east-australia` | 2 | `published` | `cinematic-timeline` |
| `202602-thailand-phuket` | 3 | `published` | `editorial-journal` |

目前 Production `travel-memory-days` count：10。

## Read-only dry-run result

| Plan item | Count |
| --- | ---: |
| `create` | 15 |
| `skip` | 2 |
| `preserve-current` | 8 |
| `styleUpdates` | 0 |
| `dayUpdates` | 0 |
| `missingMemories` | 0 |
| `missingMedia` | 8 |

`missingMedia = 8` 只包含 Phuket photo placements；這些不在本次 apply scope。

## 本次建議批准的 apply scope

### `201307-hainan`

建立缺少的 6 個 daily records：

| Day | Moments | Photo placements | YouTube placements |
| --- | ---: | ---: | ---: |
| `day-01` | 6 | 1 | 0 |
| `day-02` | 10 | 1 | 0 |
| `day-04` | 14 | 2 | 0 |
| `day-05` | 13 | 1 | 0 |
| `day-06` | 11 | 1 | 0 |
| `day-07` | 12 | 1 | 0 |

小計：6 days、66 moments、7 photos。

### `202308-east-australia`

建立 9 個 daily records：

| Day | Moments | Photo placements | YouTube placements |
| --- | ---: | ---: | ---: |
| `day-01` | 3 | 1 | 0 |
| `day-02` | 8 | 1 | 0 |
| `day-03` | 15 | 6 | 0 |
| `day-04` | 13 | 4 | 0 |
| `day-05` | 11 | 9 | 0 |
| `day-06` | 11 | 10 | 0 |
| `day-07` | 14 | 11 | 0 |
| `day-08` | 12 | 7 | 0 |
| `day-09` | 14 | 2 | 0 |

小計：9 days、101 moments、51 photos。

已採納人工決策：

- `day-03-melbourne-federation-square-001.jpeg` 因 GPS/EXIF 指向 Brisbane / 2023-08-10，改掛 `day-04`，`sectionId = brisbane-city-hall`，`location = Brisbane City Hall`。

## 本次不包含

- 不更新 `202602-thailand-phuket` 既有 8 個 YouTube-only daily records。
- 不掛入 Phuket 8 張 photo placements。
- 不掛入 Australia 6 支未分日 YouTube videos。
- 不做 schema migration。
- 不改 Travel Memory style。
- 不刪除、不 cleanup、不覆寫 Admin edits。

## 停止條件

執行前若 dry-run 出現以下任一情況，必須停止並重新回報：

- `dayUpdates > 0`
- `styleUpdates.length > 0`
- `missingMemories.length > 0`
- 任一 action 涉及 delete / destructive cleanup
- `preserve-current` 以外的 Phuket daily record update
- Media relationship 找不到 Hainan / Australia 本次需要的 sourcePath

## Apply 後 read-back / QA

Apply 後至少檢查：

- Production `travel-memory-days` count 從 10 變為 25。
- Hainan 新增 `day-01`, `day-02`, `day-04`, `day-05`, `day-06`, `day-07`。
- Australia 新增 `day-01` 到 `day-09`。
- Hainan 新增 7 個 photo placements。
- Australia 新增 51 個 photo placements。
- Phuket 8 個 existing days 仍保留 YouTube-only placements，未被覆寫。
- Routes：
  - `/travel/201307-hainan`
  - `/travel/201307-hainan/day/day-01` 到 `/day/day-08`
  - `/travel/202308-east-australia`
  - `/travel/202308-east-australia/day/day-01` 到 `/day/day-09`
  - `/travel/202602-thailand-phuket/day/day-01` 與 `/day/day-08`
- Rendered HTML 不含 `$RX` / `NEXT_HTTP_ERROR_FALLBACK;404`。
- Australia overview 進入 `cinematic-timeline` renderer。
- Hainan overview 進入 `family-scrapbook` renderer。
- Phuket YouTube embeds 仍使用 `youtube-nocookie.com/embed/`。

## Rollback

若 apply 後出現 runtime regression，優先回滾方式：

1. 停止後續 content writes。
2. 以 `dayIdentity` 定位本次新增 records：
   - `1:day-01`, `1:day-02`, `1:day-04`, `1:day-05`, `1:day-06`, `1:day-07`
   - `2:day-01` 到 `2:day-09`
3. 使用批准後的 rollback script 或 Admin 手動移除這 15 個 newly-created daily records。
4. 不動既有 Phuket 8 days、Hainan day-03/day-08、Travel Memories 主 records、Media records。

## 需要使用者批准的下一步

若接受本 package，請明確批准：

> 批准執行 Phase 19 Production content apply：create Hainan 6 days + Australia 9 days，禁止 dayUpdates/styleUpdates/Phuket updates。

## 執行紀錄

### 2026-08-09 Production apply

使用者已批准：

> 批准執行 Phase 19 Production content apply：create Hainan 6 days + Australia 9 days，禁止 dayUpdates/styleUpdates/Phuket updates。

執行結果：

- 已建立 15 個 `travel-memory-days` records。
- Hainan 新增 6 days：`day-01`, `day-02`, `day-04`, `day-05`, `day-06`, `day-07`。
- Australia 新增 9 days：`day-01` 到 `day-09`。
- Phuket 沒有 create/update/delete。
- 沒有 `styleUpdates`。
- 沒有 `dayUpdates`。

Read-back 結果：

| Travel Memory | Days | Moments | Photo placements | YouTube placements |
| --- | ---: | ---: | ---: | ---: |
| `201307-hainan` | 8 | 94 | 11 | 0 |
| `202308-east-australia` | 9 | 101 | 51 | 0 |
| `202602-thailand-phuket` | 8 | 8 | 0 | 10 |

總計：

- `travel-memory-days`：25
- Hainan：8 days 完整。
- Australia：9 days 完整。
- Phuket：維持既有 YouTube-only daily records。

Production route QA：

- `/travel/201307-hainan` 與 Day 1–8：HTTP 200，`data-travel-memory-style="family-scrapbook"`。
- `/travel/202308-east-australia` 與 Day 1–9：HTTP 200，`data-travel-memory-style="cinematic-timeline"`。
- `/travel/202308-east-australia/day/day-04`：HTML 含 `Brisbane City Hall`。
- `/travel/202602-thailand-phuket/day/day-01`、`/day/day-08`：HTTP 200，`data-travel-memory-style="editorial-journal"`，HTML 含 `youtube-nocookie.com/embed/`。
- 上述 route HTML 均未出現 `$RX` 或 `NEXT_HTTP_ERROR_FALLBACK;404`。

### 執行中發現並修正的 planner 問題

第一次 apply 在 transaction 內被 Payload validation 擋下，沒有 commit、沒有部分寫入。原因是 Australia Markdown 行程中多個 segment 的時間為 `—`；原本 `segmentMomentKey()` 會把 `—` 正規化成 `itinerary--`，導致同一天多個 moments 重複 key，違反 `TravelMemoryDays.moments` 的 unique `momentKey` validation。

修正：

- `segmentMomentKey()` 現在會移除 slug 前後連字號；若正規化後沒有英數字，fallback 到 `itinerary-${index + 1}`。
- 新增 Australia regression test，確保每日 projection 不產生重複 `momentKey`。

Post-apply dry-run：

| Plan item | Count |
| --- | ---: |
| `skip` | 17 |
| `conflict` | 3 |
| `preserve-current` | 5 |
| `dayCreates` | 0 |
| `dayUpdates` | 0 |
| `styleUpdates` | 0 |
| `missingMedia` | 8 |
| `missingMemories` | 0 |

`conflict = 3` 只涉及 Phuket Day 1 / Day 2 / Day 8 的 source-vs-current moments 差異；本次 apply gate 明確禁止 Phuket writes，因此沒有更新 Phuket。
