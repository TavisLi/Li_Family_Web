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

若 seed 尚未自動識別新中文檔名，需要在 seed mapping 中加入檔名與 `travel-slug` 對應。這部分可交給 Codex 處理。

---

## 9. 何時需要 Manifest

一般照片只靠資料夾與檔名就可以。

以下情況才建議更新：

```text
content-source/assets/manifest.json
```

- 同一張照片要掛到多個欄位。
- Gallery 需要自訂排序。
- 圖片需要 caption、拍攝地點、人物標註或故事描述。
- Itinerary 圖片需要精準對應到某一天、某個景點或某個時間段。
- 不希望再從檔名推斷用途。

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

---

## 10. 驗證流程

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

---

## 11. Git 注意事項

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
