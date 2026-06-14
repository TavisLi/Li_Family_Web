# Phase 06 完成報告：家人存取閘門

## Phase 範圍

Phase-6 目標是建立 Web Li 的家人模式存取閘門，讓訪客與已登入家人在首頁、部落格、旅遊內容與互動功能中看到正確的公開/私密狀態。此階段同時整理共享 session helper，避免前台 component 直接呼叫 Payload Local API，並補上登入/登出入口與關鍵路由邊界。

本次提交也一併納入使用者提供的內容資料更新：旅遊 Markdown 的成員與影片連結修正，以及新增旅遊內容來源規範文件。

## Branch / Commit

- Branch：`codex/phase-6-family-access-gate`
- Commit：`Implement phase 6 family access gate`（PR 分支最新 HEAD）
- Base：`origin/main`，Phase-5 PR 已合併後切分支

## GitHub Sync / PR 狀態

- 本地驗證已完成。
- 分支已推送：`origin/codex/phase-6-family-access-gate`
- Draft PR：`https://github.com/TavisLi/Li_Family_Web/pull/6`
- 本報告隨 Phase-6 提交一併送出。

## 已交付功能

- 新增共享家人 session helper：`getCurrentUser()`、`getFamilySession()`、`requireFamilyUser()`、`userReq()`。
- 新增純函式 session mapper 與測試，讓 Payload `User` 能穩定轉成家人模式 UI 所需狀態。
- 新增 `/family/login` 登入頁、loading boundary、error boundary。
- 新增 `FamilyLoginForm`，透過 Payload `/api/users/login` 與 `/api/users/logout` 完成登入/登出，並使用 `router.refresh()` 重新取得 server state。
- 新增 `FamilyModeIndicator`，在全站 header 顯示訪客模式、家人模式與登出入口。
- 首頁資料層加入 `familySession`，首頁 hub 文案依訪客/家人模式切換。
- Blog 資料層改用共享 auth helper，登入後可讀私密文章，訪客不可從 index、分類、tag 或 HTML snapshot 取得私密文章資訊。
- Blog populated author email 會在回傳前 scrub，避免公開 HTML/RSC 洩漏 seed login email。
- Travel 資料層改用共享 auth helper，並為私密旅遊 metadata 提供泛用標題與描述。
- Blog 與 Travel 互動面板修正 `useOptimistic` 呼叫時機，避免 React optimistic update warning。
- 併入內容資料更新：海南島旅行出行人修正、東澳旅行新增 YouTube 影片連結、旅行內容來源規範文件與 README 索引更新。
- 依使用者指示，以 `docs/README.md` 內容取代根目錄 `README.md`，讓專案入口文件與 docs 版本一致。

## Key Files

- `src/lib/data/auth.ts`
- `src/lib/data/auth-session.ts`
- `src/lib/data/auth-session.test.ts`
- `src/lib/data/posts.ts`
- `src/lib/data/travel.ts`
- `src/lib/data/home.ts`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/family/login/page.tsx`
- `src/app/(app)/family/login/loading.tsx`
- `src/app/(app)/family/login/error.tsx`
- `src/features/auth/family-login-form.tsx`
- `src/features/auth/family-mode-indicator.tsx`
- `src/features/home/home-page.tsx`
- `src/features/blog/blog-reaction-panel.tsx`
- `src/features/travel/travel-interaction-panel.tsx`
- `docs/travel-content-source-guidelines.md`
- `docs/content-source-asset-guidelines.md`
- `docs/README.md`
- `README.md`
- `content-source/travels/201307海南岛8日.md`
- `content-source/travels/202308东澳全览9日.md`

## 驗證命令

- `pnpm exec tsx src/lib/data/auth-session.test.ts`：通過。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過，Next.js 15.4.11 production build 成功產生 `/family/login`、`/blog`、`/travel` 與動態頁。
- `git diff --check`：提交前執行，確認無 whitespace error。

## Browser QA 範圍

- Desktop public：
  - `/`
  - `/travel`
  - `/blog`
  - `/family/login`
- Mobile 390px public：
  - `/`
  - `/travel`
  - `/blog`
  - `/family/login`
- Authenticated family mode：
  - 以 seeded family account 登入。
  - 首頁顯示家人模式與使用者名稱。
  - `/blog/phase-5-private-family-note` 可讀私密文章，不顯示 locked preview。
  - Blog reaction 與 comment 可提交並重新啟用按鈕。
  - `/travel/202607-chongqing-yangtze-river` 可讀並可提交 travel interaction。
- Leak checks：
  - 未登入抓取 public home/blog/travel HTML snapshot。
  - 未登入抓取 private blog slug dev snapshot。
  - 搜尋私密標題、私密 seed body、私密分類、QA comment、seed login email、常見 secret key 字串，未在公開 snapshot 中命中。

## 已知限制

- 本地 seed 目前沒有 private travel record，因此私密 travel slug 的訪客鎖定行為只能透過資料層與 metadata 邏輯驗證；瀏覽器 QA 使用既有公開 travel route。
- 部分 seed media URL 在本機仍會回 404，屬既有 media seed/檔案可用性問題；前台 fallback 行為未因 Phase-6 變更退化。
- 在同一工作樹先跑 production build 再開 dev server 時，曾遇到 `.next` 快取造成的 dev module error；使用乾淨 dev 啟動流程清除 `.next` 後未再重現。
- Browser QA 期間有新增本機互動資料：private blog comments/reactions 與 travel interaction comments/reactions。
- `.DS_Store` 與 `content-source/blogger/takeout-20260614T010941Z-3-001.zip` 不納入提交。

## Next Phase Readiness

Phase-6 已建立家人模式的基礎 session 與資料存取閘門。Phase-7 可以在此基礎上接入時空膠囊、共同願望清單、年度時光報告或更完整的 private travel seed，不需要重新設計登入與 public/private filtering 流程。
