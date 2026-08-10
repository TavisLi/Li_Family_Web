# Phuket Production photo append approval package

日期：2026-08-09

## 目的

本 approval package 用於審核是否將 `202602-thailand-phuket` source projection 中已補齊的 photo moments append 到 Production 既有 8 個 `travel-memory-days` records。

這不是 general source-wins update。本次 proposed write 必須保留 Production 目前已發布的 YouTube slice，只追加照片，不建立新 day、不刪除、不覆寫整天內容。

## 前置狀態

- PR #86 已 merge：`9577264 docs(travel): map phuket itinerary photos (#86)`。
- `content-source/assets/travels/202602-thailand-phuket/manifest.json` 已能將 Phuket itinerary photos 投射到每日回憶。
- 本地 source projection read-back：

| Check | Result |
| --- | ---: |
| `unmatchedMedia` | 0 |
| `unassignedVideos` | 0 |
| Proposed append days | 8 |
| Proposed append photo moments | 34 |
| Proposed append photo placements | 42 |

Production 目前狀態：

| Travel Memory | ID | Status | Style | Current daily records |
| --- | ---: | --- | --- | ---: |
| `202602-thailand-phuket` | 3 | `published` | `editorial-journal` | 8 |

Production 既有 Phuket daily records 目前是已批准的 YouTube-only records：

| Day | Day identity | Current YouTube placements |
| --- | --- | ---: |
| Day 1 | `3:day-01` | 1 |
| Day 2 | `3:day-02` | 1 |
| Day 3 | `3:day-03` | 1 |
| Day 4 | `3:day-04` | 1 |
| Day 5 | `3:day-05` | 1 |
| Day 6 | `3:day-06` | 1 |
| Day 7 | `3:day-07` | 3 |
| Day 8 | `3:day-08` | 1 |

總計：8 days、10 YouTube placements。

## 建議批准的 apply scope

Append 34 個 photo moments／42 張 photos 到既有 `202602-thailand-phuket` Day 1–8。

| Day | Append photo moments | Append photos | Moment keys |
| --- | ---: | ---: | --- |
| Day 1 | 3 | 4 | `wuhan-dmk-transfer`, `breeze-restaurant-dinner`, `splash-beach-arrival` |
| Day 2 | 4 | 5 | `breeze-restaurant-breakfast`, `jungle-splash-waterpark`, `mai-khao-flight-viewing`, `thai-rific-hotpot` |
| Day 3 | 4 | 5 | `turtle-village-starbucks`, `anantara-vacation-club`, `marriott-pool-swim`, `lobby-fire-show` |
| Day 4 | 3 | 4 | `early-mai-khao-beach`, `family-beach-walk`, `mai-khao-beach-sunset` |
| Day 5 | 4 | 5 | `marriott-checkout`, `basil-thai-kitchen-lunch`, `patong-arrival`, `rak-rooftop-pool` |
| Day 6 | 6 | 7 | `why-not-lunch`, `patong-walk`, `lyns-spa-massage`, `patong-beach-afternoon`, `patong-beach-sunset`, `kans-haus-dinner` |
| Day 7 | 5 | 6 | `return-to-mai-khao`, `andaman-pool-villas`, `jungle-splash-second-round`, `villa-family-photo`, `breeze-new-year-dinner` |
| Day 8 | 5 | 6 | `phuket-airport-departure`, `phuket-airport-transfer`, `singapore-jewel`, `airport-lounge-dinner`, `jewel-waterfall-night` |

## 本次不包含

- 不建立 `travel-memory-days` records。
- 不刪除任何 records、moments、placements、media。
- 不改 `travel-memories` 主 record。
- 不改 `presentationStyle`。
- 不更新 Hainan / Australia。
- 不更新 `202702-thailand-phuket` planning travel。
- 不處理目前工作樹中 7 個 `202702-thailand-phuket` untracked files。
- 不執行 schema migration。
- 不用 general Phase 19 source-wins/backfill 直接覆寫 Phuket daily records。

## Production write 停止條件

執行前或 transaction 內若發現以下任一情況，必須停止，不得 commit transaction：

- 找不到 `travel-memories.slug = 202602-thailand-phuket` 或 ID 不是目前 read-back 的 `3`。
- 8 個 day records 不完整，或 day identity 不是 `3:day-01` 到 `3:day-08`。
- 現有 YouTube placement 總數不是 10。
- 任一既有 YouTube placement 在 proposed update 後減少、改 URL、改 caption 或改 placement key。
- append plan 不是 exactly 34 photo moments / 42 photo placements。
- source projection 出現 `unmatchedMedia` 或 `unassignedVideos`。
- 任一 proposed photo `sourcePath` 找不到 Production Media record。
- 任一 proposed photo placement key 已存在於該 day。
- dry-run 顯示任何 create/delete/full-day overwrite/style update。
- transaction 或 read-back timeout。

## 建議執行方式

使用一次性 controlled append script：

1. 讀取 Production Payload。
2. 在 transaction 內 lock 相關 travel memory day / media tables。
3. 重新從 merged `content-source` 產生 Phuket source projection。
4. 過濾出 photo-only moments。
5. 對每一天建立 merged moments：`existing Production moments + proposed photo moments`。
6. 寫回既有 day record。
7. commit 後獨立 read-back。

不得使用 general seed 或 full source-wins update 直接覆蓋既有 Phuket day。

## Apply 後 read-back / QA

Apply 後至少檢查：

- Production `travel-memory-days` total 仍為 25。
- `202602-thailand-phuket` 仍為 8 days。
- Phuket total photo placements 變為 42。
- Phuket total YouTube placements 仍為 10。
- Day 7 仍保留 3 個 YouTube placements。
- Day 1–8 每頁 HTTP 200。
- Day 1–8 rendered HTML：
  - `data-travel-memory-style="editorial-journal"` 存在。
  - `youtube-nocookie.com/embed/` 存在。
  - 不含 `$RX`。
  - 不含 `NEXT_HTTP_ERROR_FALLBACK;404`。
- Spot checks：
  - Day 1 有 `Splash Beach Resort` photo moment。
  - Day 4 有 `Mai Khao Beach` / sunset photo moment。
  - Day 8 有 `Singapore Jewel Changi Airport` photo moment。

## Rollback

若 append 後出現 regression，rollback 方式必須只移除本次追加的 photo-only moments：

1. 停止後續 writes。
2. 對 `3:day-01` 到 `3:day-08` 逐日定位本次 append 的 34 個 photo moment keys。
3. 從每個 day 的 `moments` array 移除這些 photo moment keys。
4. 保留原本 Production YouTube moment 與 10 個 YouTube placements。
5. read-back 確認 Phuket 回到 8 days、0 photos、10 YouTube placements。

## 需要使用者批准的下一步

若接受本 package，請明確批准：

> 批准執行 Phuket Production photo append：append 34 photo moments / 42 photos to existing `202602-thailand-phuket` days, preserve all 10 YouTube placements, no creates/deletes/full-day overwrite.

## 執行結果

使用者已於 2026-08-09 批准執行 Production append：

> 批准執行 Phuket Production photo append：append 34 photo moments / 42 photos to existing 202602-thailand-phuket days, preserve all 10 YouTube placements, no creates/deletes/full-day overwrite.

### Inspect / approval token

Production read-only inspect 通過，approval token：

```text
58c4bcc537b18726
```

Inspect 時 Production 狀態：

| Check | Result |
| --- | ---: |
| Phuket days | 8 |
| Current YouTube placements | 10 |
| Current photo placements | 0 |
| Planned append photo moments | 34 |
| Planned append photo placements | 42 |

### Apply

Apply 已在 transaction 內完成並 commit。Transaction 內重新驗證同一 approval token，然後逐日 append photo-only moments。

Commit 後 read-back：

| Check | Result |
| --- | ---: |
| Phuket days | 8 |
| Current YouTube placements | 10 |
| Current photo placements | 42 |
| Remaining append photo moments | 0 |
| Remaining append photo placements | 0 |

Per-day read-back：

| Day | Day identity | Moments after append | YouTube placements | Photo placements |
| --- | --- | ---: | ---: | ---: |
| Day 1 | `3:day-01` | 4 | 1 | 4 |
| Day 2 | `3:day-02` | 5 | 1 | 5 |
| Day 3 | `3:day-03` | 5 | 1 | 5 |
| Day 4 | `3:day-04` | 4 | 1 | 4 |
| Day 5 | `3:day-05` | 5 | 1 | 5 |
| Day 6 | `3:day-06` | 7 | 1 | 7 |
| Day 7 | `3:day-07` | 6 | 3 | 6 |
| Day 8 | `3:day-08` | 6 | 1 | 6 |

### Production route QA

Production rendered HTML QA 已通過：

| Route set | Result |
| --- | --- |
| `/travel/202602-thailand-phuket/day/day-01` 到 `/day/day-08` | HTTP 200 |
| Style marker | `data-travel-memory-style` + `editorial-journal` present |
| YouTube slice | `youtube-nocookie.com/embed/` present on Day 1–8 |
| RSC error marker | no `$RX` |
| 404 fallback marker | no `NEXT_HTTP_ERROR_FALLBACK;404` |
| Spot text | Day 1 `Splash Beach Resort`, Day 4 `Mai Khao Beach`, Day 8 `Singapore Jewel Changi Airport` present |

### 實際使用的 controlled script

本次使用：

```bash
pnpm exec tsx src/scripts/phase19-phuket-photo-append.ts inspect
PHUKET_PHOTO_APPEND_CONFIRM='58c4bcc537b18726' PHUKET_PHOTO_APPEND_TEXT='append 34 photo moments / 42 photos to existing 202602-thailand-phuket days, preserve 10 youtube placements' pnpm exec tsx src/scripts/phase19-phuket-photo-append.ts apply --allow-write
pnpm exec tsx src/scripts/phase19-phuket-photo-append.ts verify
```
