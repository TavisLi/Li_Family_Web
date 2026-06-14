# Phase-5 後續工作準備：Premium Family Blog

## 1. 準備狀態

**Phase 名稱**：Phase-5 Premium Family Blog  
**準備日期**：2026-06-14  
**建議工作分支**：`codex/phase-5-premium-family-blog`  
**建議基底**：Phase-4 merge 進 `main` 後，從最新 `main` 開新分支。  
**目前所在分支**：`codex/phase-4-travel-interaction-system`  
**Phase-4 狀態**：功能與文檔已完成並 push；Draft PR 尚未建立，原因是本機 GitHub CLI token 失效。

Phase-5 目標是交付家庭 Blog 的正式內容系統，包括列表頁、文章詳情頁、分類與標籤、作者關聯、RichText 渲染、SEO structured data，以及留言與暖心反應互動。

---

## 2. 開工前必須處理

### GitHub 與分支

- Phase-4 分支已推送：`origin/codex/phase-4-travel-interaction-system`
- Phase-4 PR 建立連結：<https://github.com/TavisLi/Li_Family_Web/pull/new/codex/phase-4-travel-interaction-system>
- 本機 `gh` token 已失效，需重新登入後才能自動建立 PR：

```bash
gh auth login -h github.com
```

建議流程：

1. 先建立 Phase-4 PR。
2. Review / merge Phase-4 到 `main`。
3. `git fetch origin` 並切到最新 `main`。
4. 從最新 `main` 建立 `codex/phase-5-premium-family-blog`。

若 Phase-5 必須在 Phase-4 尚未 merge 前開工，應明確標記為 stacked branch，並在 completion report 中記錄它依賴 Phase-4 分支。

### 內容資料

Phase-5 prompt 要求 Blog 必須使用 Payload `posts` collection 與 Lexical richText，不可使用靜態 Markdown 假資料作為正式資料源。

目前已確認：

- `src/payload/collections/Posts.ts` 已存在。
- `src/payload/collections/Categories.ts` 已存在。
- `src/payload/collections/Comments.ts` 已支援 `associatedType: "blog"`。
- `src/lib/data/posts.ts` 目前只有 `getLatestPosts`，尚未支援 Blog list/detail/tag/comment/reaction。
- `content-source/` 目前主要覆蓋 profiles、travels、timeline 類資料；開工前需確認是否要新增正式 Blog seed 來源，或先用 Payload CMS 後台建立文章資料。

建議在實作前先決定：

- Phase-5 是否需要新增 Blog seed 腳本與內容來源。
- 測試用公開文章與私密文章各至少一篇。
- 每篇測試文章至少包含 author、category、tags、coverImage 可缺省案例、Lexical content。

### 登入互動驗證

`Comments` collection 目前 `read/create/update/delete` 都需要 `req.user`。因此未登入瀏覽器只能驗證 locked preview，不能真正送出留言或反應。

Phase-5 驗收時需二選一：

- 使用已有登入 session 驗證留言與 reaction。
- 若 Phase-6 Auth 尚未完成，保留「家人模式限定」locked preview，並在 completion report 記錄真實登入互動待 Phase-6 補驗。

---

## 3. 必讀上下文

Phase-5 開工前必讀：

- `docs/全栈系统需求与技术架构说明书.md`
  - `3.4 Premium Family Blog`
  - `5.1 Posts`
  - `5.3 Comments`
- `docs/family-members.md`
- `docs/travel-projects.md`
- `content-source/`
- `docs/prompts/Web Li Prompt for Phase_5`
- `src/payload/collections/Posts.ts`
- `src/payload/collections/Categories.ts`
- `src/payload/collections/Comments.ts`
- `src/lib/data/posts.ts`
- `src/payload/payload-types.ts`

實作 Payload / Next.js API 若不確定，需查閱當前官方文件；本專案固定使用 Next.js 15 App Router 與 Payload CMS v3 stable。

---

## 4. 現有基礎可復用

### Data Layer pattern

Phase-4 已建立可參考的 server-only data layer pattern：

- `src/lib/data/travel.ts`
- `src/features/travel/actions.ts`
- `src/features/travel/travel-interaction-panel.tsx`

Phase-5 應在 `src/lib/data/posts.ts` 擴充 Blog 專用資料函式，避免在 React component 中直接呼叫 Payload Local API。

### Media fallback

Phase-4 已補強：

- `src/components/ui/payload-image.tsx`
- `src/components/ui/image-fallback.tsx`

Blog cover image 缺失或 media URL 404 時，應沿用 `PayloadImage` 與 `ImageFallback`，不得出現破圖或空白灰框。

### 互動體驗

Phase-4 已建立 optimistic interaction 的可參考模式：

- 未登入：顯示 locked preview。
- 已登入：使用 server action 寫入 `Comments`。
- Client 端使用 `useOptimistic` 立即反饋。

Phase-5 的 reaction 必須對應：

- `heart`
- `cool`
- `applause`

---

## 5. 建議實作範圍

### Route files

- `src/app/(app)/blog/page.tsx`
- `src/app/(app)/blog/[slug]/page.tsx`

Route file 應保持薄邊界，只負責：

- `generateMetadata`
- JSON-LD
- data fetching
- feature component 組裝
- notFound / private access fallback

### Feature modules

建議新增：

- `src/features/blog/blog-index-page.tsx`
- `src/features/blog/blog-post-page.tsx`
- `src/features/blog/blog-author-hover-card.tsx`
- `src/features/blog/blog-tag-cloud.tsx`
- `src/features/blog/blog-reaction-panel.tsx`
- `src/features/blog/actions.ts`

若 RichText renderer 沒有專案既有安全方式，建議新增：

- `src/features/blog/lexical-renderer.tsx`

RichText renderer 必須基於 Payload Lexical output 的實際型別與安全節點白名單實作，不可使用 `dangerouslySetInnerHTML` 直接渲染未知內容。

### Data Layer

建議在 `src/lib/data/posts.ts` 擴充：

- `getBlogIndex`
- `getBlogPostBySlug`
- `getBlogTagCloud`
- `getBlogInteractionThread`
- `submitBlogInteraction`

所有函式都應使用 `src/payload/payload-types.ts` 的型別。不得手寫 `any`。

---

## 6. SEO 與結構化資料

Blog detail page 需加入：

- `generateMetadata`
- Open Graph title / description / image
- article published time
- author metadata
- 基本 JSON-LD `BlogPosting`

JSON-LD 建議欄位：

- `@context`
- `@type`
- `headline`
- `datePublished`
- `author`
- `image`
- `mainEntityOfPage`

私密文章不得暴露完整內容於 public metadata 或 JSON-LD。

---

## 7. Phase-5 驗收清單

### 靜態驗證

```bash
pnpm tsc --noEmit
pnpm run build
git diff --check
```

若更新 seed：

```bash
pnpm run test:seed-content
pnpm run seed
```

若更新 Payload collection：

```bash
pnpm exec payload generate:types
```

### Browser QA

使用 in-app Browser 檢查：

- `/blog`
- 至少一篇公開文章 `/blog/[slug]`
- 一篇 cover image 缺失或載入失敗文章
- desktop viewport
- mobile viewport
- tag cloud 互動
- author hover card
- 未登入 locked interaction preview
- 已登入 comment / reaction，如 session 可用

### Completion Report

Phase-5 完成後，需新增：

```text
docs/phase-completion-reports/phase-05-premium-family-blog.md
```

報告需包含：

- Phase 範圍
- branch / commit
- GitHub push / PR 狀態
- 已完成頁面與互動
- 主要檔案
- 驗證命令結果
- Browser QA 結果
- 已知限制
- Phase-6 準備事項

---

## 8. Phase-6 銜接提醒

Phase-6 是 Auth / Family Access Control。Phase-5 的留言與 reaction 若因未登入無法完整端到端驗證，需在 Phase-6 補做登入態互動驗證。

Phase-5 應避免臨時打開 public comment write access，否則會破壞 Comments collection 既有權限模型。
