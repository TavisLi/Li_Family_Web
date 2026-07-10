# Travel Content Source Guidelines

本文件定義新增旅遊項目的內容交付包規格。目標是讓新的旅行 Markdown、照片與影片可以穩定進入 seed pipeline，再由 Payload CMS 與前台 `/travel/[slug]` 動態頁面使用。

---

## 1. 交付包總覽

每個新旅遊項目建議準備三類素材：

```text
content-source/travels/[旅行中文名].md
content-source/assets/travels/[travel-slug]/
YouTube links written inside the Markdown
```

最小交付清單：

```text
content-source/travels/[旅行中文名].md
content-source/assets/travels/[travel-slug]/cover/cover-001.jpeg
content-source/assets/travels/[travel-slug]/gallery/gallery-001.jpeg
content-source/assets/travels/[travel-slug]/itinerary/day-01-[topic]-001.jpeg
```

影片只需提供 YouTube URL，寫入 Markdown 的「外部影片」段落。專案不儲存原生 `.mp4`、`.mov` 影片檔。

---

## 2. Travel Slug

每個旅行項目需有穩定英文 slug，建議格式：

```text
YYYYMM-short-location-or-theme
```

範例：

```text
202607-chongqing-yangtze-river
202308-east-australia
201307-hainan
```

這個 slug 會用於：

- 前台 URL：`/travel/[slug]`
- 照片資料夾：`content-source/assets/travels/[travel-slug]/`
- Payload `TravelProjects` seed 對應
- media relationship owner mapping

新增旅行時，請同時告知 Codex：

- `travel-slug`
- 狀態：`planning` 或 `completed`
- Markdown 檔名
- 是否有照片與影片

---

## 3. Markdown 檔案

旅行 Markdown 放在：

```text
content-source/travels/[原始中文檔名].md
```

規劃中旅遊可先複製並填寫：

```text
docs/templates/planning-travel-source-template.md
```

範例：

```text
content-source/travels/202610日本關西親子7日.md
```

建議結構：

```md
---
title: "202610日本關西親子7日"
author: "Tavis Li"
date: "2026-06-14"
---

# **👥 核心信息速覽**

-   **行程名稱**：日本關西親子7日 — 京都·大阪·奈良
-   **時間**：2026年10月1日-7日（7天6晚）
-   **出行人**：Tavis、Lynn、Nini、Leo
-   **行程概覽**：台北→大阪→京都→奈良→大阪→台北

# **🎬 外部影片**

-   **日本關西旅行影片 1**：https://youtu.be/xxxx
-   **日本關西旅行 Shorts 1**：https://youtube.com/shorts/xxxx

# **✈️ 航班信息**

| 日期 | 航班號 | 航線 | 起飛 | 抵達 | 備注 |
| --- | --- | --- | --- | --- | --- |

# **🏨 住宿安排**

| 日期 | 城市 | 酒店 | 地址 | 電話 |
| --- | --- | --- | --- | --- |

# **🗓️ 每日行程詳解**

## **Day 1 · 10月1日（週四）— 台北→大阪**

| 時間 | 安排 | 交通 | 備注 |
| --- | --- | --- | --- |

# **📝 補充細節**

-   注意事項、心得、限制、推薦點。
```

---

## 4. Planning 與 Completed 的內容重點

### Planning

規劃中行程應著重：

- 出行人
- 航班 / 高鐵 / 交通銜接
- 住宿
- 每日行程節點
- 安全提醒、天氣、長輩小孩照顧事項
- 可討論的規劃區塊

### Completed

已完成行程應著重：

- 回憶敘事
- 每日亮點
- 代表照片
- 外部影片
- 旅行心得
- 補充細節與值得記住的小事

---

## 5. 照片資料夾

旅遊照片放在：

```text
content-source/assets/travels/[travel-slug]/
```

建議子目錄：

```text
cover/
gallery/
itinerary/
```

### Cover

封面照片：

```text
content-source/assets/travels/[travel-slug]/cover/cover-001.jpeg
content-source/assets/travels/[travel-slug]/cover/cover-002.jpeg
```

第一張封面通常作為 TravelProjects 的主要 `coverImage`。

### Gallery

照片牆：

```text
content-source/assets/travels/[travel-slug]/gallery/gallery-001.jpeg
content-source/assets/travels/[travel-slug]/gallery/gallery-002.jpeg
content-source/assets/travels/[travel-slug]/gallery/gallery-003.jpeg
```

Gallery 適合整體回憶、精選照片、非特定日程節點照片。

### Itinerary

行程節點照片：

```text
content-source/assets/travels/[travel-slug]/itinerary/day-[day-number]-[location-or-topic]-[sequence].[ext]
```

範例：

```text
day-01-osaka-arrival-001.jpeg
day-03-kyoto-fushimi-inari-001.jpeg
day-05-nara-deer-park-001.jpeg
```

---

## 6. 檔名規則

建議：

- 使用小寫英文、數字與 hyphen。
- 使用三位數序號：`001`、`002`、`003`。
- 保留清楚語義：`cover`、`gallery`、`day-03`、`kyoto`、`arrival`。
- 副檔名保持原始格式即可，例如 `.jpeg`、`.jpg`、`.png`、`.webp`。

避免：

```text
IMG_1234.jpeg
Royal Botanic.jpeg
IMG (1).jpeg
final2.jpeg
new-new.jpeg
```

---

## 7. 影片規則

影片只保存 YouTube URL，不儲存影片檔。

在 Markdown 中加入：

```md
# **🎬 外部影片**

-   **旅行影片 1**：https://youtu.be/xxxx
-   **旅行影片 2**：https://youtube.com/shorts/xxxx
```

可接受格式：

```text
https://youtu.be/[id]
https://youtu.be/[id]?si=...
https://youtube.com/shorts/[id]
https://www.youtube.com/watch?v=[id]
```

若有多支影片，按旅程或上傳順序編號即可。

---

## 8. Docs 與 Seed 對應

新增旅行時，通常也需要更新：

```text
docs/travel-projects.md
```

記錄：

- 呈現名稱
- 狀態：規劃中或已完成
- Markdown 資料源
- 頁面重點

### Phase 9 Catalog Contract

`docs/travel-projects.md` 是所有可公開旅遊項目的 catalog。每一個項目都必須明確提供：

- `呈現名稱`：Payload `TravelProjects.title` 的優先來源。
- `Canonical slug`：穩定、唯一，並和 Payload record 與 `/travel/[slug]` 完全一致。
- `數據源`：`content-source/travels/` 下恰好一份 Markdown 檔案。
- 所屬章節：`規劃中的旅遊項目` 或 `已完成的旅遊項目信息`，對應 Payload status。

Catalog parser 會驗證每個 source file 與 canonical slug 都只出現一次，也會拒絕未登錄的旅遊 Markdown。Markdown frontmatter 與標題保留做為行程原始內容；顯示 title 以 catalog 的 `呈現名稱` 優先。

旅遊 Markdown 的 section contract 為：`航班信息`、`住宿安排`、`每日行程詳解`，以及可選的 `返程高鐵`、`游輪艙房分配`、`外部影片`。表格欄位可依行程而不同，但每個資料列必須維持可辨識的欄位順序；外部影片只接受 `youtube.com`、`youtu.be` 的 watch、shorts 或短網址。

---

## 9. 何時需要 Manifest

一般照片只靠資料夾與檔名就可以。

以下情況才建議建立或更新 manifest：

```text
content-source/assets/travels/[travel-slug-or-asset-folder]/manifest.json
```

- 同一張照片要掛到多個欄位。
- Gallery 需要自訂排序。
- 圖片需要 caption、拍攝地點、人物標註或故事描述。
- Itinerary 圖片需要精準對應到某一天、某個景點或某個時間段。
- 不希望再從檔名推斷用途。

### Manifest 放置規則

複雜旅遊項目優先使用 local manifest：

```text
content-source/assets/travels/[travel-asset-folder]/manifest.json
```

全域主 manifest 保留在：

```text
content-source/assets/manifest.json
```

主 manifest 的用途是全域、跨專案、舊資料相容或非 travel 的例外映射；多數 travel 專屬照片不應再集中塞進主 manifest。Seed parser 會先讀主 manifest，再讀 travel local manifest。若同一張圖片兩邊都有設定，local manifest 覆蓋主 manifest。

`sourcePath` 一律使用相對於 `content-source/assets/` 的路徑，這樣主 manifest 和 local manifest 可以共用同一個 schema。

Manifest 範例：

```json
{
  "sourcePath": "travels/202610-kansai/gallery/gallery-001.jpeg",
  "ownerType": "travel",
  "ownerSlug": "202610-kansai",
  "usage": "gallery",
  "caption": "Kyoto evening walk",
  "sortOrder": 1
}
```

### Itinerary 精細 Manifest

如果某個旅行項目的 Markdown 已經寫到每天多個時間點、景點或餐廳，建議不要把大量照片複製到 `itinerary/`。更好的方式是保留完整 `gallery/`，再用該 travel 的 local manifest 指定哪些 gallery 照片屬於哪一天、哪個行程節點。

範例：

```json
{
  "sourcePath": "travels/202602-thailand-phuket/gallery/gallery-022.jpeg",
  "ownerType": "travel",
  "ownerSlug": "202602-thailand-phuket",
  "usage": "itinerary",
  "day": 2,
  "sectionId": "mai-khao-flight-viewing",
  "time": "14:30",
  "location": "Mai Khao Beach Flight Viewing Point",
  "caption": "餐後回到邁考海灘，看飛機低空掠過海灘上方。",
  "sortOrder": 2030
}
```

建議欄位：

| 欄位 | 說明 |
| --- | --- |
| `sourcePath` | 相對於 `content-source/assets/` 的圖片路徑 |
| `ownerType` | 旅遊項目固定為 `travel` |
| `ownerSlug` | 對應 travel slug |
| `usage` | 精細行程照片使用 `itinerary` |
| `day` | 第幾天，數字 |
| `sectionId` | 穩定英文節點 ID，例如 `patong-beach-sunset` |
| `time` | Markdown 行程中的時間，若有 |
| `location` | 景點、酒店、餐廳或機場名稱 |
| `caption` | 前台可用的照片說明與 alt text |
| `sortOrder` | 建議用 `day * 1000 + sequence * 10`，方便同日排序 |

Seed parser 會保留這些 metadata，並寫入 Media tags，例如 `day-02` 與 `section:mai-khao-flight-viewing`，供後續前台依日程節點分組。

## 10. Travel Design Docs

若某個旅遊項目需要專屬頁面風格，設計文檔放在：

```text
docs/design/travel/[travel-slug].design.md
```

範例：

```text
docs/design/travel/202702-thailand-phuket.design.md
```

設計文檔用途：

- 記錄色彩、字體、版面、影像語彙與互動語氣。
- 作為 Phase 實作時的設計依據。
- 不作為前台 runtime 直接讀取的資料來源。

實作頁面時，應將設計文檔轉為結構化欄位，例如 `designProfile`、`presentation.template` 或 Payload TravelProjects 的對應欄位。`/travel/[slug]` 路由仍保持一致，由資料中的 template/profile 決定渲染方式。

---

## 11. 驗證流程

素材整理完成後，建議執行：

```bash
pnpm run test:seed-content
pnpm run seed
```

若 seed 或 collection 有更新，再視情況執行：

```bash
pnpm exec payload generate:types
pnpm tsc --noEmit
pnpm run build
```

前台驗證：

- `/travel`
- `/travel/[travel-slug]`
- desktop viewport
- mobile viewport
- cover image fallback
- gallery rendering
- YouTube embed / placeholder

Phase 9 另需執行：

```bash
pnpm run seed:audit
pnpm run seed:phase-9:dry-run
```

第一個指令不需要 secret，驗證 source/catalog/media 覆蓋。第二個指令需要受保護的 Payload / database environment，但只會讀取既有 record，輸出 create/update/delete 計畫與 document ID 樣本；它不會寫入任何資料。取得明確同意後才執行 `pnpm run seed:phase-9`。

---

## 12. Git 注意事項

請提交：

- 有意義的 Markdown 旅行資料
- 有用途且命名穩定的圖片
- 必要的 manifest 更新
- 必要的 docs/travel-projects.md 更新

請不要提交：

- `.DS_Store`
- 臨時輸出檔
- 未確認用途的大量原始照片
- Payload 上傳產物
- 原生影片檔案
