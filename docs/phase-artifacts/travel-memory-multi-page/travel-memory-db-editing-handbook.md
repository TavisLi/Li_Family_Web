# Travel Memory 資料庫編輯手冊

日期：2026-08-09

## 編輯目標

Travel Memory 的新結構是：

```text
Travel Memory
  └─ Travel Memory Day
       └─ Moment
            └─ Placement photo / youtube
```

編輯時請把「媒體檔案本身」與「這張照片/影片放在哪一天、哪個段落、顯示什麼 caption」分開看。

## Collection 對照

| Payload collection | 用途 |
| --- | --- |
| `Travel Memories` | 一趟已完成旅行的主頁、style、封面、舊版 story/ledger/gallery |
| `Travel Memory Days` | 新版每日頁。每筆 day 屬於一個 Travel Memory |
| `Media` | 圖片/影片檔案 metadata；不是故事 placement |

## Travel Memories 必查欄位

在 Admin 裡打開 `Travel Memories`：

| 欄位 | 建議 |
| --- | --- |
| `slug` | 不要改。route identity 依賴它 |
| `status` | 對外頁面必須是 `published` |
| `isPrivate` | Public 頁面應維持 `false` |
| `presentationStyle` | 三個現有 memories 目前固定：Hainan `family-scrapbook`、Australia `cinematic-timeline`、Phuket `editorial-journal` |
| `galleryImages` / `itineraryImages` | 舊版相簿資料，可保留；新版每日頁主要看 Day → Moment → Placement |

## Travel Memory Days 編輯欄位

每個 daily record 建議遵守：

| 欄位 | 規則 |
| --- | --- |
| `memory` | 必選，指向 owning Travel Memory |
| `dayKey` | 固定格式 `day-01`、`day-02`；不要用標題當 identity |
| `day` | 數字 day index，例如 `3` |
| `title` | 每日頁主標題 |
| `theme` | 可選，用於 overview/day card |
| `story` | 可選，當天總敘事 |
| `_status` | 對外要顯示必須是 `published` |

系統會用 `memory + dayKey` 形成 `dayIdentity`，不要手動改 hidden identity。

## Moment 編輯規則

Moment 是每日頁的一段故事。建議：

| 欄位 | 規則 |
| --- | --- |
| `momentKey` | 穩定 key。可用 `itinerary-09-00`、`nanshan-sea-guanyin` 這種 slug |
| `time` | 可選，格式維持來源，例如 `10:30` |
| `location` | 可選，但建議有照片時填寫 |
| `title` | 必填，會直接出現在頁面上 |
| `body` | 可選，適合放該 moment 的文字說明 |

不要重複同一天內的 `momentKey`。

## Placement 編輯規則

Placement 是照片或 YouTube 的「顯示位置」。

### Photo placement

| 欄位 | 規則 |
| --- | --- |
| `placementKey` | 建議用 media `sourcePath`，例如 `content-source/assets/.../day-03...jpeg` |
| `type` | `photo` |
| `role` | 先用 `inline` |
| `media` | 選擇 Payload `Media` record |
| `caption` | 顯示在每日頁照片下方。這與 Media alt text 不同 |

### YouTube placement

| 欄位 | 規則 |
| --- | --- |
| `placementKey` | 建議用 `youtube:<url>` |
| `type` | `youtube` |
| `role` | 先用 `inline` |
| `youtubeUrl` | 原始 YouTube URL |
| `caption` | 影片標題或當日說明 |

前台會轉成 `youtube-nocookie.com/embed/...`；不要直接填 embed URL。

## Media mapping 工作方式

建議先在 `content-source/assets/travels/<slug>/manifest.json` 補 metadata，再由 controlled backfill 生成 placement，避免直接在 DB 一筆筆猜。

每張 itinerary media 至少補：

```json
{
  "sourcePath": "travels/202308-east-australia/itinerary/day-03-melbourne-city-001.jpeg",
  "ownerType": "travel",
  "ownerSlug": "202308-east-australia",
  "usage": "itinerary",
  "day": 3,
  "sectionId": "melbourne-city",
  "time": "09:00",
  "location": "Melbourne",
  "caption": "在墨爾本市區展開一天行程。"
}
```

`sectionId` 會變成 Moment key；同一天同一 `sectionId` 的多張照片會排序後放在同一 Moment。

## 三個 Travel Memory 的目前待辦

### `201307-hainan`

下一步可自動建：

- `day-01`, `day-02`, `day-04`, `day-05`, `day-06`, `day-07`
- 7 個剩餘 photo placements

你需要人工檢查：

- 每張 caption 是否符合語氣。
- 照片是否應該放在目前 manifest 的 `sectionId`。

### `202308-east-australia`

下一步可自動建：

- `day-01` 到 `day-09`
- 101 個 moments
- 51 個 photo placements

你需要人工補：

- 6 支 YouTube videos 要分配到哪一天；目前標題只有 `202308`，無法自動推 day。

已人工決策的 GPS/檔名衝突：

- `day-03-melbourne-federation-square-001.jpeg`：檔名標示 Day 3 / Melbourne / Federation Square，但 GPS/EXIF 指向 Brisbane / 2023-08-10；已改為 `day = 4`、`sectionId = brisbane-city-hall`、`location = Brisbane City Hall`。

已補入 manifest 的 Australia photo metadata 來源規則：

- `day`：以檔名前綴 `day-XX` 為準。
- `time`：以 EXIF 建立時間取 `HH:MM`。
- `sectionId`：依 filename 地點 token 與 GPS cluster 形成穩定 slug。
- `caption`：保守描述地點與當日片段；不把未確認 GPS 衝突寫成確定事實。

### `202602-thailand-phuket`

目前已建：

- `day-01` 到 `day-08`
- 10 個 YouTube placements

你需要人工決定：

- 是否把 8 張 photo placements 納入新版每日頁。
- 如果要納入，建議先確認每張圖的 moment 位置，不要覆寫現有 YouTube-only daily records。

## 發布前 QA 清單

每次 content apply 後都要檢查：

- `/travel/<slug>`：HTTP 200，沒有 `$RX` / `NEXT_HTTP_ERROR_FALLBACK;404`
- `/travel/<slug>/day/<dayKey>`：HTTP 200
- Rendered HTML 有正確 `data-travel-memory-style`
- Caption 文字出現在對應 Day，不跨日
- YouTube 使用 `youtube-nocookie.com/embed/`
- HTML 不含 `http://localhost`
- Vercel runtime logs 沒有 schema/query error

## 不建議手動做的事

- 不要改 `slug`。
- 不要手動填 `dayIdentity`。
- 不要把 YouTube embed URL 填入 `youtubeUrl`；填原始 YouTube URL。
- 不要用一張照片的 filename 直接當 caption。
- 不要在同一天重複 `momentKey` 或 `placementKey`。
- 不要為了讓前台顯示而關閉 RLS 或新增 `anon/authenticated` grants。
