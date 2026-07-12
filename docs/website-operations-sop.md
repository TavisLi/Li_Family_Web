# Web Li 網站營運 SOP

> 適用對象：網站擁有者、家庭內容編輯者，以及負責資料同步與程式發布的技術維護者。  
> 目的：讓日常內容更新、完整旅遊上架、程式發布與異常處理，都有清楚且可回溯的操作方式。

---

## 1. 先判斷要走哪一條流程

| 需求 | 正確入口 | 是否需要程式發布 |
| --- | --- | --- |
| 首頁公告、首頁主圖、精選旅程 | Payload Admin → `Home Config` | 否 |
| 成員介紹、頭像、照片 | Payload Admin → `Users`、`Media` | 否 |
| 文章、分類、封面圖 | Payload Admin → `Posts`、`Categories`、`Media` | 否 |
| 家庭大事記 | Payload Admin → `Timeline Events` | 否 |
| 願望清單、年度時光報告 | Payload Admin → `Bucket Items`、`Wrapped Snapshots` | 否 |
| 完整新增或大量更新旅行 | `docs/` + `content-source/` → seed 同步 | 通常不需改程式，但需要受保護的資料同步流程 |
| 新功能、版型、登入權限、修 bug | GitHub branch → PR → Vercel Preview → Production | 是 |

### 三個資料層的責任

1. **Payload Admin / 資料庫**：Production 網站實際讀取的資料；日常內容的操作入口是 `/admin`。
2. **`docs/` 與 `content-source/`**：旅行、素材等可重複同步內容的版本化來源；它們不會自動出現在網站上，必須經過 seed。
3. **GitHub / Vercel**：程式碼、前台行為與部署設定的版本管理和發布管道。

> 重要：旅行 seed 使用 Base／Source／Current 三方 reconciliation。日常 Admin 修改不會被 safe mode 靜默覆蓋；若來源與 Admin 同時修改同一內容，必須先處理 conflict。

---

## 2. 角色與權限原則

| 角色 | 可以做什麼 | 不可做什麼 |
| --- | --- | --- |
| 網站擁有者 | 決定公開性、批准 Production 資料同步與發布、保管 Vercel／Cloudflare／Supabase 權限 | 不在 Git、文件、聊天室貼出 secret |
| 內容編輯者 | 在 Admin 更新文章、圖片、成員、公告、時間軸 | 不修改程式碼、環境變數、Production seed |
| 資料操作員 | 整理來源包、執行 audit、dry-run、經批准後的 seed | 未經批准不得寫入 Production；不得執行刪除型清理 |
| 技術維護者 | 修程式、建立 PR、處理 Vercel／R2 問題 | 不將帳密、cookie 或私密資料寫入程式或報告 |

目前尚未建立可供日常治理使用的「管理員／內容編輯者／一般家人」角色分權。將 Admin 帳號只交給受信任的維護者；若要讓更多家人登入，應先規劃角色型權限與內容審核流程。

---

## 3. 日常內容更新 SOP（不需要部署）

適用於公告、文章、成員簡介、圖片、時間軸、願望清單等小範圍更新。

1. 登入正式網站的 `/admin`。
2. 先確認資料要對外公開還是僅家人可見；未確認時先保留為私密。
3. 圖片先上傳至 `Media`，補上容易辨識的 alt text；再回到文章、成員或旅遊資料建立 relationship。
4. 儲存後，用一般訪客視窗開啟對應頁面；私密內容再以授權家人帳號檢查。
5. 在營運紀錄寫下「日期、操作者、變更摘要、頁面網址、公開／私密狀態」。

### 圖片與影片規則

- 替換首頁 hero、成員照片、既有旅遊封面時，優先在 Admin 替換媒體或 relationship，不要修改前台元件。
- 圖片上傳後，檢查公開 R2 URL 與 thumbnail、medium、large 版本是否可載入。
- 影片只存合法的 YouTube URL；不要上傳 `.mp4`、`.mov` 等原生影片。
- 若圖片缺失，前台會顯示 fallback；這是保護機制，不是永久解法，仍要補回正確媒體。

---

## 4. 新增／完整更新旅行 SOP

適用於一趟新旅行，或需大幅調整行程、住宿、航班、相簿、影片的更新。

### 4.1 準備內容包

1. 在 `docs/travel-projects.md` 加入或更新：呈現名稱、唯一 canonical slug、狀態、Markdown 資料源。
2. 建立／更新 `content-source/travels/[中文旅行名稱].md`，包含行程、航班、住宿、每日行程與可選的 YouTube 影片。
3. 建立與 slug **完全相同**的資料夾：

   ```text
   content-source/assets/travels/[travel-slug]/
     cover/
     gallery/
     itinerary/
   ```

4. 圖片檔名使用小寫英文、數字與 hyphen；cover 與 gallery 檔名必須帶 travel slug，避免 Payload 上傳檔名撞名。
5. 需要指定排序、caption、地點或日程精準關聯時，更新該旅行資料夾內的 `manifest.json`。

### 4.2 同步前的唯讀檢查

在具備專案依賴的終端機執行：

```bash
pnpm run test:seed-content
pnpm run seed:audit
pnpm run seed:phase-9:dry-run
pnpm run seed:travel:dry-run
```

- `seed:audit` 檢查 catalog、封面與結構化資料是否齊全。
- `seed:phase-9:dry-run` 只讀取 Payload，列出 create／update 計畫，不會寫入資料。
- 只處理 travel baseline 或 travel content 時，必須使用 `seed:travel:dry-run`；它會排除 Users、member media、blog 與 Home Config。
- travel action 會區分 `create`、`update`、`preserve`、`conflict`、`skip`；看到 `conflict` 時不可直接執行 safe write。
- 將 dry-run 摘要、抽樣 document ID 與當前 Production URL 留在營運紀錄；不可記錄 credential。

### 4.3 Production 同步與驗收

1. 由網站擁有者明確批准此次 Production 寫入範圍。
2. 在受保護的 Production environment 執行：

   ```bash
   pnpm run seed:phase-9
   pnpm run seed:phase-9:dry-run
   ```

3. 第二次 dry-run 是 read-back；確認預期資料已識別為 update，且沒有意外 delete。
4. 在 Payload Admin 抽查標題語系、關聯圖片、公開 R2 URL 與 itinerary 資料。
5. 實測 `/travel` 和 `/travel/[travel-slug]` 的桌機、手機、封面、照片牆與 YouTube 區塊。

> Phase 9 seed 設計為 idempotent create/update，不應用來刪除 Production 資料。若需要清理歷史媒體，請另開明確範圍的盤點與核准流程。

### 4.4 Travel reconciliation 模式

- Travel 專用 Production write 使用 `pnpm run seed:travel`；預設為 `safe`，建立缺少項目、套用 non-conflicting source 更新、保留 Admin-only 修改、跳過 conflict。
- 不得用全量 `seed:phase-9` 代替 travel-only baseline；在 Users reconciliation 尚未建立前，全量命令可能包含既有 Users update。
- `--source-wins`：只在審查 conflict report 且網站擁有者明確批准後使用；會用 Source 取代衝突的 Payload content。
- `--payload-wins`：明確接受目前 Payload content。需要人工回填來源時，加上 `--export-payload-drafts`，草稿只會寫到 `docs/phase-artifacts/phase-16/exports/`，不會覆蓋 `content-source/travels/*.md`。
- `--source-wins` 與 `--payload-wins` 不可同時使用。
- 新 schema 部署順序固定為：審查 additive migration → 套用 migration → 執行 dry-run → 取得 Production write 批准；不可在 migration 尚未套用時直接執行新版 seed。

---

## 5. 程式或功能發布 SOP

適用於任何程式碼、頁面設計、資料 schema、登入權限、資料讀取行為的變更。

1. 從最新 `main` 建立功能分支，避免直接修改 `main`。
2. 若有資料 schema 變更，先完成 migration 並執行：

   ```bash
   pnpm exec payload generate:types
   pnpm tsc --noEmit
   pnpm run build
   git diff --check
   ```

3. 推送分支並建立 Pull Request，等待 Vercel Preview。
4. 在 Preview 驗證：`/`、`/travel`、`/blog`、`/timeline`；未登入時確認 `/bucket-list`、`/wrapped` 會導向家人登入。
5. 以授權帳號驗證私密頁；不可讓私密資料出現在未登入頁面的 metadata、JSON-LD 或回應內容。
6. 合併 PR 後，在 Production 重跑同一輪公開與家人流程驗證。
7. 將 PR、Production URL、驗證結果、已知限制與回復方式寫入變更紀錄或 phase completion report。

---

## 6. 固定營運節奏

### 每次內容發布後（5–10 分鐘）

- 檢查公開／私密設定是否正確。
- 以無痕視窗打開實際頁面，確認文字、圖片、連結與手機版沒有明顯問題。
- 若新增圖片，確認至少一個實際 R2 URL 回傳正常。

### 每月

- 檢查 Vercel Production 最近部署是否健康、沒有持續的 runtime error。
- 抽查首頁、旅遊、文章、時間軸，以及一次家人登入流程。
- 檢查 R2 public domain 與常用圖片是否仍能載入。
- 檢視 Admin 帳號清單；移除不再需要維護權限的人員。

### 每季或大型內容上線前

- 對旅行來源執行 `pnpm run seed:audit`。
- 檢查環境變數僅存在 Vercel／受保護環境，沒有進入 Git。
- 檢視過期的私密內容、失效外部連結與不再使用的媒體。
- 需要清理資料前，先列出範圍與回復方案，取得擁有者批准。

---

## 7. 異常與回復 SOP

### 圖片 404 或顯示 fallback

1. 在 Admin 找到對應 Media record，確認其 public R2 URL。
2. 確認 `sourcePath` 對應的本機來源檔仍存在。
3. 只針對確認缺失的檔案執行受控重傳；不可因一張圖片失效而重傳全部媒體。

   ```bash
   pnpm run seed:phase-9:refresh-media -- content-source/assets/...
   ```

4. 重新開啟正式頁面，確認實際圖片 HTTP 成功且 relationship 未改錯。

### 新版程式造成網站回歸

1. 在 Vercel 將最近一次健康 deployment 提升回 Production。
2. 在 PR／營運紀錄記錄故障時間、受影響頁面、回復 deployment、後續修正負責人。
3. **注意：Vercel 回退只能回退程式，不能回退 Payload／Supabase 資料。** 資料同步錯誤時，先保留 dry-run 證據，再以小範圍修正；不要用不明確的全量操作或刪除嘗試回復。

### 發現私密資料被公開

1. 立即在 Admin 將該筆資料改為私密或停止公開關聯。
2. 確認訪客視窗無法再讀取；檢查同頁的 metadata、分享預覽與相關圖片。
3. 記錄暴露範圍與時間，必要時變更相關帳號密碼或撤銷登入。
4. 若根因是權限程式問題，走「程式或功能發布 SOP」修復並做 Preview／Production 驗證。

---

## 8. 重要連結與禁止事項

- 新增旅行內容包：[`travel-content-source-guidelines.md`](./travel-content-source-guidelines.md)
- 照片與素材命名：[`content-source-asset-guidelines.md`](./content-source-asset-guidelines.md)
- Vercel、R2、Preview／Production 驗收：[`production-deployment-checklist.md`](./production-deployment-checklist.md)
- Phase 交付與歷史驗證：[`phase-completion-reports/`](./phase-completion-reports/)

禁止事項：

- 不要把 Vercel、Supabase、Cloudflare、Payload 的 secret 寫入 Git、文件、issue、PR 或前端程式。
- 不要直接修改前台元件來「替換一張圖」或「修正一段內容」。
- 不要把來源檔修改誤當成已上線；來源內容必須完成 seed 與 Production 驗收。
- 未經明確批准，不要在 Production 執行會寫入、刪除或大批重傳媒體的命令。
