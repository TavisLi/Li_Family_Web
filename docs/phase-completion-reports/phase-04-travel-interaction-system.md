# Phase-4 Completion Report

## 1. Phase 概要

**Phase 名稱**：Phase-4 Travel Interaction System  
**工作分支**：`codex/phase-4-travel-interaction-system`  
**提交紀錄**：`263b8ee Implement phase 4 travel interaction system`  
**GitHub 同步**：已 push 至 `origin/codex/phase-4-travel-interaction-system`  
**PR 狀態**：分支已上傳，Draft PR 尚未自動建立，原因是本機 `gh` token 已失效。  
**PR 建立連結**：https://github.com/TavisLi/Li_Family_Web/pull/new/codex/phase-4-travel-interaction-system  
**目前狀態**：Phase-4 功能已完成、seed 已成功、TypeScript / production build / browser QA 已完成；等待 GitHub CLI 重新登入後補建 PR。

---

## 2. Phase 目標與範圍

本 Phase 目標是交付 Web Li 第一個大型內容互動模組：旅遊與規劃互動系統。

需完成的目標行程：

- 規劃中：`202607-chongqing-yangtze-river`
- 已完成：`201307-hainan`
- 已完成：`202308-east-australia`

核心要求：

- 建立 `/travel` 動態列表頁。
- 建立 `/travel/[slug]` 動態詳情頁。
- 所有旅遊頁由 Payload `TravelProjects` 與 seed 後資料驅動。
- 前台不得手寫固定頁面或硬編 `content-source/assets/` 圖片路徑。
- 規劃中行程呈現高密度「家庭旅行作戰室」。
- 已完成行程呈現 editorial travel memory journal。
- 互動入口使用 Comments collection，未登入訪客僅能看到 locked interaction preview。
- 所有前台資料必須透過 `src/lib/data/` layer，不可在 component 直接呼叫 Payload Local API。

---

## 3. 完成交付

### `/travel` 旅遊索引廊道

- 新增 `/travel` App Router 頁面。
- 使用 Payload `TravelProjects` 動態渲染所有旅行項目。
- 視覺定位為「旅遊索引廊道」，避免普通卡片清單。
- 清楚呈現規劃中與已完成行程數量。
- 每個 travel project 可連至 `/travel/[slug]`。
- 已將主導覽加入「旅行」入口。

### `/travel/[slug]` 動態詳情頁

- 重構既有 travel slug page，使 `page.tsx` 保持薄邊界：
  - `generateMetadata`
  - data fetching
  - interaction thread 聚合
  - feature component 渲染
- Open Graph image 優先使用 `coverImage`。
- 詳情頁不再堆疊大量 UI 邏輯於 route file。

### 規劃中行程：重慶長江三峽作戰室

已針對 `202607-chongqing-yangtze-river` 建立 planning view：

- Hero 清楚標示：
  - status：規劃中
  - 日期
  - 參與成員
  - 摘要
  - cover image / fallback
- 建立高密度資訊區：
  - 航班匯合
  - 住宿與艙房
  - 城市與返程交通
  - 參與成員
  - 高溫、登船與安全提醒
  - 每日行程節點
- 每個規劃區塊與每日節點都有 stable `associatedId`：
  - `travel:${slug}:planning:${sectionId}`
  - `travel:${slug}:itinerary:day-${day}`
- 未登入狀態顯示「家人模式限定」locked preview，不讀取私密 comments。

### 已完成行程：海南與東澳回憶頁

已針對 `201307-hainan` 與 `202308-east-australia` 建立 completed view：

- Hero 清楚標示：
  - status：已完成
  - 日期
  - 參與成員或資料預留狀態
  - 摘要
- 建立 editorial memory journal：
  - 回憶敘事
  - 每日里程碑
  - 照片瀑布流 / fallback
  - YouTube 外部影片 placeholder
- 201307 海南資料與照片較少時，仍以正式產品模組呈現，不出現空白灰框。
- 202308 東澳使用 gallery media relationship 呈現照片節奏。

### 互動系統

- 新增 travel server action：
  - `src/features/travel/actions.ts`
- 新增 optimistic interaction client component：
  - `src/features/travel/travel-interaction-panel.tsx`
- 使用 `useOptimistic` 進行 comment / thumb-up / thumb-down 即時回饋。
- `Comments.associatedType` 使用 `travel`。
- thumb-up / thumb-down 使用 `Comments.reaction` 的 `up` / `down`。
- 未登入訪客：
  - 不讀取 Comments collection 私密資料。
  - 不假裝互動已完成。
  - 顯示 locked interaction preview。

---

## 4. 技術實作概要

新增：

- `content-source/assets/manifest.json`
- `src/app/(app)/travel/page.tsx`
- `src/features/travel/actions.ts`
- `src/features/travel/travel-detail-page.tsx`
- `src/features/travel/travel-index-page.tsx`
- `src/features/travel/travel-interaction-panel.tsx`

修改：

- `src/app/(app)/layout.tsx`
- `src/app/(app)/travel/[slug]/page.tsx`
- `src/components/ui/payload-image.tsx`
- `src/lib/data/travel.ts`
- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`

### Data Layer

`src/lib/data/travel.ts` 已擴充：

- `getFeaturedTravelProjects`
- `getTravelProjects`
- `getTravelProjectBySlug`
- `getTravelInteractionThread`
- `submitTravelInteraction`

所有 Payload Local API 呼叫集中於 `src/lib/data/` server-only layer，前台 component 不直接呼叫 Payload。

### Media Fallback

`PayloadImage` 新增 client-side error fallback：

- media relationship 存在但本地 file URL 404 時，自動切換至 `ImageFallback`。
- 避免 dev/runtime 中出現破圖。
- 符合 Phase-4「media 缺失統一 ImageFallback」要求。

### Seed Manifest

新增 `content-source/assets/manifest.json`，支援：

- `sourcePath`
- `ownerType`
- `ownerSlug`
- `usage`
- `caption`
- `sortOrder`

Phase-4 先支援 travel assets。Manifest 會優先於目錄推斷；若 manifest 不存在或圖片未列入 manifest，仍保留原本 fallback 推斷規則。

### Seed Parser 補強

`src/scripts/seed-content.ts` 已補強：

- Manifest-aware travel media parsing。
- 將 `content-source/assets/travels/202607-chongqing-yangtze-river/...` 正確映射到 TravelProject slug `202607-chongqing-yangtze-river`。
- 支援東澳 H1 航班表解析。
- 支援重慶游輪艙房分配解析。
- 過濾住宿表中的空白/彙總列，避免 seed validation 被污染。
- media seed 依 owner / usage / sortOrder 穩定排序。

---

## 5. 驗證記錄

### 靜態與建置驗證

已通過：

```bash
pnpm run test:seed-content
pnpm tsc --noEmit
pnpm run build
git diff --check
```

Build 結果：

```text
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (5/5)
```

Build route 摘要：

```text
ƒ /travel
ƒ /travel/[slug]
```

### Dev Server

已啟動並確認 Ready：

```bash
pnpm dev --port 3001
```

結果：

```text
Local: http://localhost:3001
✓ Ready
```

### Seed

第一次在 sandbox 內執行時，因 DNS/network 限制無法解析 Supabase pooler：

```text
getaddrinfo ENOTFOUND aws-1-ap-south-1.pooler.supabase.com
```

提權允許網路後重新執行成功：

```bash
pnpm run seed
```

結果：

```text
Seed completed
created: 114
updated: 74
skipped: 0
failed: 0
```

### Browser 驗收

使用 in-app Browser 檢查：

- `/travel`
- `/travel/202607-chongqing-yangtze-river`
- `/travel/201307-hainan`
- `/travel/202308-east-australia`

檢查範圍：

- desktop viewport
- mobile viewport
- Hero 有明確 travel status 與主視覺
- 重慶規劃中頁顯示 locked interaction preview
- 海南已完成頁有正式 placeholder / ImageFallback
- 東澳已完成頁有照片節奏與 YouTube placeholder
- 頁面無 horizontal overflow

Browser 檢查結果：

- `/travel` desktop/mobile：可正常呈現旅遊索引廊道，含規劃中與已完成行程。
- `/travel/202607-chongqing-yangtze-river` desktop/mobile：可正常呈現 planning war room，且未登入時互動入口為 locked。
- `/travel/201307-hainan` desktop/mobile：可正常呈現 completed memory journal、照片 fallback 與 YouTube placeholder。
- `/travel/202308-east-australia` desktop/mobile：可正常呈現 completed memory journal、gallery 區塊與 YouTube placeholder。
- 所有檢查頁面均未出現水平溢出。

---

## 6. 已知限制與處理

### GitHub PR

分支已 push 到 GitHub，但 Draft PR 尚未由 Codex 自動建立。

原因：

```text
gh auth status
The token in default is invalid.
```

後續處理：

```bash
gh auth login -h github.com
```

重新登入後可使用下列連結或 CLI 建立 PR：

https://github.com/TavisLi/Li_Family_Web/pull/new/codex/phase-4-travel-interaction-system

### 本地 media file 404

部分舊 seed 產生的 local media URL 在 dev server 中仍會回 404，例如舊 filename 版本。

已處理：

- `PayloadImage` 已加入 `onError` fallback。
- UI 可降級為 `ImageFallback`，不會呈現破圖。

觀察：

- 重新 seed 後部分新 manifest 對應圖片可正常載入。
- 仍有部分舊 media record 或舊 image size URL 指向不存在的本地檔案。

建議：

- 後續可新增 media cleanup / reseed strategy，清理舊 sourcePath 或舊 generated size URL。
- 若導入 Cloudflare R2 後，應以 R2/CDN URL 作為正式 media URL 來源。

### 工作區狀態

Phase-4 commit 與 push 已完成。工作區仍有未提交 `.DS_Store`：

```text
 M .DS_Store
```

此變更在 Phase-4 開始前已存在或與 Phase-4 交付無關，未納入 commit。

---

## 7. 設計復盤

### 已達成

- `/travel` 不再是普通列表，而是具索引廊道感的旅遊入口。
- 規劃中與已完成行程具備不同資訊節奏：
  - planning：高密度、可比較、可討論。
  - completed：editorial、記憶敘事、照片節奏。
- 互動功能沒有偽造登入狀態或 fake user。
- Comments access 邊界維持嚴格：
  - 未登入不讀私密 comments。
  - 未登入只顯示 locked preview。
- 大型 travel UI 已移入 `src/features/travel/`，避免 route page 膨脹。
- media relationship 與 fallback 機制比 Phase-3 更健壯。

### 待後續確認

- 重新登入 GitHub CLI 後補建 Draft PR。
- 若要驗證登入後 comment / thumb-up / thumb-down 真實寫入，需要 Phase-6 登入流程或可用 family session。
- R2 正式接入後，需重跑 travel gallery media QA。

---

## 8. Phase-5 / 後續工作準備

Phase-5 開始前建議：

1. 補建 Phase-4 Draft PR。
2. 決定是否先 merge Phase-4 回 `main`。
3. 若下一個 Phase 會依賴 travel media，先清理舊 media URL / 確認 R2 策略。
4. 若下一個 Phase 會依賴互動能力，先安排 Phase-6 family login/session 或提供測試帳號流程。
5. 後續每個 Phase 完成後，Completion Report 固定放置於：

```text
docs/phase-completion-reports/
```

並需完成：

- local commit
- GitHub push
- Draft PR 或 PR blocker 記錄
- 下一 Phase handoff notes
