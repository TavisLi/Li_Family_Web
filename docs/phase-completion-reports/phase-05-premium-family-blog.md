# Phase-05 Premium Family Blog 完成報告

## Phase 範圍

Phase-5 交付 Payload-backed Premium Family Blog 系統，包含 `/blog` 列表頁、`/blog/[slug]` 文章頁、分類/標籤、作者 Hover Card、安全 Lexical richText 渲染、BlogPosting JSON-LD、未登入 locked interaction preview，以及 heart / cool / applause 暖心反應互動框架。

## Branch / Commit

- Branch：`codex/phase-5-premium-family-blog`
- Commit message：`Implement phase 5 premium family blog`

## GitHub 同步 / PR 狀態

- Push：已推送 `codex/phase-5-premium-family-blog` 至 GitHub。
- PR：已建立，PR #5：<https://github.com/TavisLi/Li_Family_Web/pull/5>

## 已交付功能

- 新增主導覽 Blog 入口。
- 新增 `/blog` 列表頁，顯示 Payload `posts` collection 文章。
- 新增 `/blog/[slug]` 文章頁，支援 metadata 與 JSON-LD `BlogPosting`。
- 新增 Blog tag cloud，可用 query string 進行穩定篩選。
- 新增作者 Hover/Focus Card，連回 `/member/tavis`。
- 新增安全 Lexical renderer，前台不直接渲染 Blogger HTML。
- 新增 Blog reaction/comment panel，未登入顯示 locked preview；登入態透過 server action 委派 data layer 寫入 `comments`。
- 新增 `pnpm run seed:blog`，避免 Phase-5 Blog seed 驗證時重複匯入全部 media。
- 新增 Blogger sample seed 路徑：本機若存在 `content-source/blogger/takeout-20260614T010941Z-3-001.zip` 則優先解析 Takeout；repo 內提交小型 `content-source/blogger/sample-feed.atom` 作為 CI/乾淨環境備援 fixture。
- 依使用者要求納入 `content-source/travels/202308东澳全览9日.md` 的外部影片補充。

## 主要檔案

- `src/app/(app)/blog/page.tsx`
- `src/app/(app)/blog/[slug]/page.tsx`
- `src/features/blog/blog-index-page.tsx`
- `src/features/blog/blog-post-page.tsx`
- `src/features/blog/blog-author-hover-card.tsx`
- `src/features/blog/blog-tag-cloud.tsx`
- `src/features/blog/blog-reaction-panel.tsx`
- `src/features/blog/lexical-renderer.tsx`
- `src/features/blog/actions.ts`
- `src/lib/data/posts.ts`
- `src/scripts/seed-content.ts`
- `src/scripts/seed-content.test.ts`
- `src/scripts/seed.ts`
- `content-source/blogger/sample-feed.atom`
- `content-source/travels/202308东澳全览9日.md`
- `src/components/ui/payload-image.tsx`

## Seed / Import 狀態

- 本地 Blogger Takeout zip 已用於 sample seed，但 zip 約 483MB，且屬使用者匯出資料，未提交至 Git。
- `pnpm run seed:blog` 已成功寫入：
  - Blog categories：19 updated
  - Blog posts：11 created
  - failed：0
- 11 篇文章包含 8 篇 Blogger Takeout sample 與 3 篇 Phase-5 deterministic seed posts。
- 測試覆蓋公開文章、私密文章、無 cover image 文章、多 tags/categories 文章。

## 驗證命令

- `pnpm exec payload generate:types`：通過，Payload types 已更新。
- `pnpm run seed:blog`：通過，`created 11 / updated 19 / failed 0`。
- `pnpm run test:seed-content`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過，`/blog` 與 `/blog/[slug]` 均為 dynamic routes。
- `git diff --check`：通過。

## Browser QA

- Desktop `/blog`：通過，顯示 11 篇文章與 21 個 tag links。
- Desktop `/blog/phase-5-missing-cover-fallback`：通過，顯示 JSON-LD、ImageFallback、作者卡、tags 與 locked preview。
- Author Hover/Focus Card：通過，focus 狀態下 card opacity 由 0 轉為 1。
- Tag cloud interaction：通過，點擊 `Fallback` 後 URL 為 `/blog?tag=Fallback`，結果包含無封面測試文章。
- Mobile `/blog`：通過，390px viewport 無水平 overflow。
- Mobile `/blog/phase-5-missing-cover-fallback`：通過，390px viewport 無水平 overflow，fallback 與 locked preview 正常。
- Browser console error logs：通過，未觀察到 client error。

## 已知限制

- 舊 Blogger 文章內嵌圖片目前不下載到 Payload Media；Phase-5 保留 cover fallback 與內容中的原文連結，後續可做 media migration。
- Blogger Takeout zip 未提交至 Git；正式全量匯入需由具備該 zip 的本地或安全資料環境執行。
- Payload migration CLI 在本機 Node v24 環境建立 migration 時遇到 `node:crypto?tsx-namespace` 相容性問題，因此 Phase-5 未新增 posts schema 欄位；匯入 metadata 改保留在 Lexical content 末尾。
- Tavis avatar 的本地 media 檔案在 dev server 中回 404，`PayloadImage` 已改用 `unoptimized` 並以 `ImageFallback` 容錯，後續 media storage 同步可修復實際頭像。

## 登入互動驗證狀態

- 未登入 locked interaction preview：已實測通過。
- 登入態 comment / reaction：因 Phase-6 Auth 尚未完成，未取得可用前台登入 session，待 Phase-6 補驗。
- `Comments` collection 權限未放寬，未登入訪客不會假裝留言或 reaction 成功。

## Phase-6 準備事項

- 完成前台 Auth/session 後，補測 Blog comment create 與 heart / cool / applause reaction 寫入。
- 規劃 Blogger 全量匯入流程與圖片搬遷策略。
- 若仍需保存更完整 import metadata，可在 Node 20 環境建立正式 Payload migration，再新增 structured metadata 欄位。
