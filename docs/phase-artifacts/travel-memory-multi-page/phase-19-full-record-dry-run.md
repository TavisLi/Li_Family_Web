# Phase 19 Travel Memory 全量 record dry-run

日期：2026-08-09

## 範圍

本文件回應「把三個 Travel Memory 的 record 全部建完、輸出完整網頁、列出外用到的 media、並提供資料庫編輯手冊」的第一步：Production read-only dry-run。

本次沒有執行 Production write、media upload、Issue closeout 或 cleanup。

## 目前 Production 狀態

| Travel Memory | Status | Style | Source days | Production days |
| --- | --- | --- | ---: | ---: |
| `201307-hainan` | `published` | `family-scrapbook` | 8 | 2 |
| `202308-east-australia` | `published` | `cinematic-timeline` | 9 | 0 |
| `202602-thailand-phuket` | `published` | `editorial-journal` | 8 | 8 |

目前已存在：

- Hainan：`day-03`、`day-08`，含 4 個 photo placements。
- Phuket：`day-01` 到 `day-08`，含 10 個 YouTube placements。
- Australia：style 已設定，但尚無 daily records，因此 overview 仍回 legacy renderer。

## 全量建立建議

Dry-run 計算結果：

| Action | Count | 說明 |
| --- | ---: | --- |
| `create` | 15 | 可新增 15 個 daily records |
| `skip` | 2 | Hainan `day-03`、`day-08` 與 source/base/current 一致 |
| `preserve-current` | 8 | Phuket 8 days 已有 YouTube-only Production records；不應用全 source 覆蓋 |
| `styleUpdates` | 0 | 三個 style 已正確 |
| `dayUpdates` | 0 | dry-run 不建議更新既有 days |

建議下一次 Production apply 只建立缺少的 15 個 days：

| Travel Memory | Days to create | Moments | Photo placements | YouTube placements |
| --- | --- | ---: | ---: | ---: |
| `201307-hainan` | `day-01`, `day-02`, `day-04`, `day-05`, `day-06`, `day-07` | 66 | 7 | 0 |
| `202308-east-australia` | `day-01`–`day-09` | 101 | 51 | 0 |

暫不建議自動更新 Phuket 8 days，原因是目前 Production 裡的 Phuket days 是刻意建立的 YouTube-only slice；全量 planner 會將現有 days 判定為 `preserve-current`，避免覆寫。

## Media inventory

### 已可自動掛入 daily record 的 media

| Travel Memory | Count | 說明 |
| --- | ---: | --- |
| `201307-hainan` | 11 | manifest 已具備 `day` 與 `sectionId`；目前 4 張已在 Day 3/8，剩餘 7 張可隨缺少 days 一起掛入 |
| `202602-thailand-phuket` | 0 | 目前 Production days 只放 YouTube；photo placement 未納入已批准 scope |
| `202308-east-australia` | 51 | 已依檔名前綴補 `day`，依 EXIF time / GPS cluster / filename 補 `sectionId`、`location`、`caption`；可隨缺少 days 一起掛入 |

### 需要人工補 metadata 後才能掛入的 media

更新 Australia manifest 後重跑 dry-run，顯示 `missingMediaCount = 8`。這不是檔案不存在；問題是 Phuket 8 張 photo placements 不在目前已批准 Production backfill scope，且既有 Phuket daily records 是 YouTube-only slice，不應被全量覆寫。

#### `202308-east-australia`：51 張 itinerary media 已補 Day / Moment mapping

這 51 張已可由 backfill planner 產生 photo placements。`day` 以檔名前綴為準；`time` 以 EXIF 建立時間為準；`sectionId` 與 caption 依 GPS cluster 與 filename 保守推定。

依 GPS/EXIF 覆核後調整 1 張：

- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-federation-square-001.jpeg`：檔名標示 Day 3 / Melbourne / Federation Square，但 EXIF GPS 與日期指向 Brisbane / 2023-08-10；已依人工決策改為 `day = 4`、`sectionId = brisbane-city-hall`、`location = Brisbane City Hall`。

本次已補 metadata 的 media：

- `content-source/assets/travels/202308-east-australia/itinerary/day-01-taipei-melbourne-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-02-phillip-island-penguin-parade-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-city-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-city-hosier-lane-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-federation-square-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-flinders-lane-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-puffing-billy-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-puffing-billy-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-03-melbourne-the-edge-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-04-brisbane-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-04-brisbane-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-04-brisbane-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-broadbeach-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-pacific-fair-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-pelican-watching-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-sky-point-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-sky-point-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-05-gold-coast-surfers-paradise-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Burleigh-Head-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Burleigh-Head-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Burleigh-Head-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-005.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-006.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-06-gold-coast-Currumbin-007.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-004.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-005.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-006.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-007.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-008.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-city-009.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-tower-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-07-sydney-tower-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-blue-mountains-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-blue-mountains-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-blue-mountains-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-sydney-royal-botanic-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-sydney-royal-botanic-002.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-sydney-royal-botanic-003.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-08-sydney-royal-botanic-004.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-09-sydney-taipei-001.jpeg`
- `content-source/assets/travels/202308-east-australia/itinerary/day-09-sydney-taipei-002.jpeg`

#### `202602-thailand-phuket`：8 張 photo placement 待另案批准

這 8 張有明顯 day naming，但目前未納入已批准 Production backfill，建議人工確認後另案加入：

- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-01-splash-beach-arrival-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-02-mai-khao-flight-viewing-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-03-anantara-vacation-club-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-04-mai-khao-beach-sunset-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-05-rak-elegant-rooftop-pool-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-06-patong-beach-dinner-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-07-andaman-pool-villas-family-001.jpeg`
- `content-source/assets/travels/202602-thailand-phuket/itinerary/day-08-singapore-jewel-transfer-001.jpeg`

### Unassigned videos

Australia 有 6 支影片，但標題沒有可安全換算到單日的日期，因此 planner 不自動掛入每日頁：

- `202308 東澳全覽 9 日旅行影片` — `https://youtu.be/xWvDgcgKMHw`
- `202308 東澳全覽 9 日旅行影片 2` — `https://youtu.be/N5njJSh3MDE?si=WvG7rif050J_7XOY`
- `202308 東澳全覽 9 日旅行影片 3` — `https://youtu.be/_Uxvkbb86DU`
- `202308 東澳全覽 9 日旅行影片 4` — `https://youtube.com/shorts/XesGnj1dBak?feature=share`
- `202308 東澳全覽 9 日旅行影片 5` — `https://youtu.be/Q0ABeW6JICo`
- `202308 東澳全覽 9 日旅行影片 6` — `https://youtu.be/Cw7PYsIPSJA`

## 建議的下一個 apply gate

可批准的最小安全 apply：

1. 建立 Hainan 剩餘 6 個 day records，含 7 個已可自動掛入的 photo placements。
2. 建立 Australia 9 個 day records，含 51 個 photo placements；Federation Square 檔名衝突照片已依 GPS/EXIF 改掛 Day 4 Brisbane City Hall。
3. 不更新 Phuket 既有 8 days。
4. 不處理 Australia 6 支 unassigned videos；標題沒有日資訊，需人工指定每日 placement。
5. 不處理 Phuket 8 張 photo placements；改由另案批准，避免覆寫 YouTube-only daily records。
6. Apply 後重跑 Production QA：
   - Hainan 8 days 全部 200。
   - Australia overview 進入 `cinematic-timeline` renderer。
   - Phuket YouTube pages 不回歸。

停止條件：

- 出現任何 `dayUpdates`、delete、unexpected style update。
- `missingMemories` 不為空。
- Production route 出現 `$RX` 或 `NEXT_HTTP_ERROR_FALLBACK;404`。
- Runtime logs 出現 DB/schema error。
