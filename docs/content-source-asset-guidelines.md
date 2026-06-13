# Content Source Asset Guidelines

本文件定義 `content-source/assets/` 的照片與媒體檔案治理規則，供 seed pipeline、後續頁面開發與人工整理素材時遵循。

目標是讓預置照片可以作為 Payload CMS 的初始資料來源，同時避免前台 component 硬編圖片路徑。所有預置照片都應透過 seed 建立為 Payload Media 記錄，再由 Members、TravelProjects、Posts 或 HomeConfig 的 media relationship 引用。

---

## 1. 核心原則

1. `content-source/assets/` 只作為 seed 初始資料來源。  
   正式使用時，前台應讀取 Payload Media relationship，不直接讀取 `content-source/assets/` 路徑。

2. 目錄結構代表媒體用途。  
   Seed pipeline 會依照資料夾與檔名判斷圖片要掛到哪個資料欄位。

3. 檔名應穩定、可讀、可排序。  
   避免使用相機原始檔名、空格、括號、混合大小寫與不明縮寫。

4. 後台替換優先於修改前台。  
   若日後要替換首頁 hero、成員照片或旅遊封面，應在 Payload Admin 中更換 media relationship 或上傳新照片，而不是修改前台 component。

5. 圖片缺失時由前台統一顯示 `ImageFallback`。  
   不應為了避免缺圖而在 component 裡硬編備用圖片。

---

## 2. 目前目錄結構

```text
content-source/assets/
  members/
    [member-slug]/
  travels/
    [travel-slug]/
      cover/
      gallery/
      itinerary/
  the_grand_family_lobby/
```

目前已使用的 member slug 範例：

```text
grandma
leo
lynn
nini
sophie
tavis
```

目前已使用的 travel slug 範例：

```text
201307-hainan
202308-east-australia
202607-chongqing
```

---

## 3. 成員照片規則

成員照片放在：

```text
content-source/assets/members/[member-slug]/
```

建議檔名格式：

```text
[member-slug]-avatar.[ext]
[member-slug]-hero.[ext]
[member-slug]-gallery-[sequence].[ext]
[member-slug]-career-[topic]-[sequence].[ext]
```

範例：

```text
tavis-avatar.jpeg
tavis-hero.jpeg
tavis-gallery-001.jpeg
tavis-career-yangtze-memory-001.jpeg
lynn-avatar.jpeg
lynn-hero.jpeg
lynn-gallery-002.jpeg
```

### 用途對應

| 檔名或目錄語義 | Payload relationship 用途 |
| --- | --- |
| `avatar` | 成員頭像 |
| `hero` | 成員首頁主視覺 |
| `gallery` | 成員照片牆 |
| `career` | 履歷、職涯或里程碑相關圖片 |

### 注意事項

- `[member-slug]` 應與 Payload / docs 中的成員 slug 保持一致。
- 同類型多張照片使用三位數序號，例如 `001`、`002`、`003`。
- 不建議使用 `photo1`、`image-final`、`new-new` 這類無法判斷用途的檔名。

---

## 4. 旅遊照片規則

旅遊照片放在：

```text
content-source/assets/travels/[travel-slug]/
```

每個旅遊專案建議使用以下子目錄：

```text
cover/
gallery/
itinerary/
```

### 4.1 Cover

封面照片放在：

```text
content-source/assets/travels/[travel-slug]/cover/
```

建議檔名：

```text
cover-001.jpeg
cover-002.jpeg
```

第一張封面通常會作為 TravelProjects 的主要 `coverImage`。

### 4.2 Gallery

照片牆放在：

```text
content-source/assets/travels/[travel-slug]/gallery/
```

建議檔名：

```text
gallery-001.jpeg
gallery-002.jpeg
gallery-003.jpeg
```

Gallery 適合放整體回憶、精選照片、非特定日程節點的照片。

### 4.3 Itinerary

行程節點照片放在：

```text
content-source/assets/travels/[travel-slug]/itinerary/
```

建議檔名：

```text
day-[day-number]-[location-or-topic]-[sequence].[ext]
```

範例：

```text
day-03-melbourne-city-hosier-lane-001.jpeg
day-05-gold-coast-surfers-paradise-001.jpeg
day-08-sydney-royal-botanic-001.jpeg
```

### 用途對應

| 目錄 | Payload relationship 用途 |
| --- | --- |
| `cover/` | 旅遊封面圖 |
| `gallery/` | 旅遊照片牆 |
| `itinerary/` | 行程節點或日程互動照片 |

---

## 5. 家庭大廳照片規則

家庭大廳照片放在：

```text
content-source/assets/the_grand_family_lobby/
```

建議檔名：

```text
lobby-001.jpeg
lobby-002.jpeg
lobby-003.jpeg
```

這些圖片可用於 HomeConfig，例如首頁 hero、家庭大廳輪播、家庭精選視覺等。

---

## 6. 檔名規範

建議：

- 使用小寫英文、數字與 hyphen。
- 使用三位數序號：`001`、`002`、`003`。
- 保留清楚語義：`cover`、`gallery`、`avatar`、`hero`、`career`、`day-03`。
- 副檔名保持原始格式即可，例如 `.jpeg`、`.jpg`、`.png`、`.webp`、`.gif`。

避免：

- 空格：`Royal Botanic.jpeg`
- 括號：`IMG (1).jpeg`
- 相機原始檔名：`2023IMG - 74.jpeg`
- 大小寫混用：`Burleigh-Head`
- 無語義命名：`new.jpeg`、`final2.jpeg`

---

## 7. 新增照片流程

1. 先判斷照片歸屬：
   - 成員：放到 `members/[member-slug]/`
   - 旅遊：放到 `travels/[travel-slug]/cover|gallery|itinerary/`
   - 首頁家庭大廳：放到 `the_grand_family_lobby/`

2. 依照用途命名。

3. 執行 seed 前，確認檔案不包含 `.DS_Store` 或其他系統暫存檔。

4. 執行：

   ```bash
   pnpm run test:seed-content
   pnpm run seed
   ```

5. 到 Payload Admin 確認 Media 與 relationship 是否正確建立。

---

## 8. 前台使用規則

前台 component 不應直接引用：

```text
content-source/assets/...
```

前台應透過 `src/lib/data/` 取得 Payload 資料，再使用資料中的 media URL。

若 media 缺失，統一顯示 `ImageFallback`。

---

## 9. 何時需要 Seed Manifest

目前階段可以先依賴目錄與檔名語義，不需要立即建立 manifest。

當出現以下需求時，再導入 `content-source/assets/manifest.json`：

- 同一張照片需要掛到多個資料欄位。
- Gallery 需要自訂排序，且排序不能只靠檔名。
- 圖片需要 caption、拍攝地點、人物標註或故事描述。
- Itinerary 圖片需要精準對應到某一天、某個景點、某個時間段。
- 不希望再從檔名推斷用途。

Manifest 範例：

```json
{
  "sourcePath": "travels/202308-east-australia/gallery/gallery-001.jpeg",
  "ownerType": "travel",
  "ownerSlug": "202308-east-australia",
  "usage": "gallery",
  "caption": "Sydney city walk",
  "sortOrder": 1
}
```

---

## 10. Git 注意事項

請提交：

- 有意義的圖片檔案
- 目錄結構調整
- 命名規則相關文件

請不要提交：

- `.DS_Store`
- 臨時輸出檔
- Payload 上傳產物
- 未確認用途的大量原始照片

若只是替換已存在圖片，請注意這可能會影響 seed 後的 Media 記錄。若前台已進入正式維護階段，優先在 Payload Admin 中替換 Media。
