# Phase-6 後續工作準備：Family-Only Secure Gate

## 1. 準備狀態

**Phase 名稱**：Phase-6 Family-Only Secure Gate 與 Public/Private 雙模渲染  
**準備日期**：2026-06-14  
**建議工作分支**：`codex/phase-6-family-access-gate`  
**建議基底**：Phase-5 PR merge 進 `main` 後，從最新 `main` 開新分支。  
**目前 Phase-5 PR**：<https://github.com/TavisLi/Li_Family_Web/pull/5>

Phase-6 的核心不是重新匯入 media，而是把現有 Payload access control 接到前台 family session。完成後，訪客只會收到 public data；家人登入後才會解鎖 private travel、private blog、留言互動，以及 Phase-7 的 Timeline / Bucket List / Wrapped 私密入口。

---

## 2. 開工前必須處理

### GitHub 與分支

- Phase-5 PR #5 目前是 Phase-6 的前置基底。
- 建議等 PR #5 merge 後，更新本地 `main`，再建立 `codex/phase-6-family-access-gate`。
- 若必須提前開始，請建立 stacked branch，並在 PR 描述註明依賴 PR #5。
- 不要提交 `.DS_Store`。
- 不要提交 `content-source/blogger/takeout-20260614T010941Z-3-001.zip`，該檔案約 483MB 且屬使用者匯出資料。

### Auth / Session 策略

Phase-6 預設使用 Payload `users` collection 的既有 auth 能力，不新增外部 auth provider。

建議做法：

1. 新增 server-only auth helper，例如 `src/lib/data/auth.ts`。
2. helper 內部封裝 `headers()` 與 `payload.auth()`。
3. 回傳明確型別，例如 `currentUser`、`isFamilyMode`、`familyRole`。
4. `posts.ts` 與 `travel.ts` 目前各自有 `getCurrentUser()`，Phase-6 應改用共用 helper。
5. Client component 只接收非敏感狀態，例如 `isFamilyMode` 與 display name；不要接收 token、cookie、secret 或完整 user object。

### Data privacy audit

現有 Payload collection 已有基礎權限：

- `Users.read`：未登入僅 `profileVisibility=public`，登入可讀全部。
- `Posts.read`：未登入僅 `isPrivate=false`，登入可讀全部。
- `TravelProjects.read`：未登入僅 `isPrivate=false`，登入可讀全部。
- `Comments.read/create/update/delete`：全部需要 `req.user`。

Phase-6 的主要缺口在 data layer：

- `src/lib/data/home.ts` 目前查 members、posts、travel 時未傳入登入 user，因此登入後首頁仍可能只看到 public data。
- `src/lib/data/travel.ts` 的列表與 detail 目前未傳入登入 user，因此家人模式未必能解鎖 private travel。
- `src/lib/data/posts.ts` 已能在 Blog index/detail 傳入 current user，但 auth helper 是局部實作，Phase-6 應收斂成共用方式。

### 測試帳號與 seed

- 先確認本地 seed 已建立可登入的 family user。
- 測試密碼應來自本地 `.env` 或 seed 執行環境，不要寫入前台 component 或提交到文件中的秘密欄位。
- 如 local database 需要重建，先確認是否會覆蓋使用者資料，再執行 seed。

---

## 3. 必讀上下文

Phase-6 開工前必讀：

- `docs/prompts/Web Li Prompt for Phase_6`
- `docs/phase-completion-reports/phase-05-premium-family-blog.md`
- `docs/全栈系统需求与技术架构说明书.md`
  - `3.5 门禁与双模隐私系统 (Family-Only Secure Gate)`
  - `3.6 时空胶囊大事记`
  - `3.7 共同愿望清单与年度时光报告`
- `docs/family-members.md`
- `docs/travel-projects.md`
- `content-source/`
- `src/payload/collections/Users.ts`
- `src/payload/collections/Posts.ts`
- `src/payload/collections/TravelProjects.ts`
- `src/payload/collections/Comments.ts`
- `src/lib/data/home.ts`
- `src/lib/data/posts.ts`
- `src/lib/data/travel.ts`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/loading.tsx`
- `src/app/(app)/error.tsx`

實作 Payload / Next.js API 若不確定，需查閱當前官方文件；本專案固定使用 Next.js 15 App Router 與 Payload CMS v3 stable。

---

## 4. 現有基礎可復用

### Payload access control

目前 collection 權限已符合 Phase-6 的大方向。除非驗證發現漏洞，不建議為 Phase-6 進行大幅 schema 重構。

### Blog interaction pattern

Phase-5 已建立 Blog locked preview 與 server action 寫入流程：

- 未登入：顯示 locked preview。
- 已登入：透過 data layer 與 `Comments` collection 建立 comment / reaction。
- Reaction 支援 `heart`、`cool`、`applause`。

Phase-6 完成前台登入後，需補測 Phase-5 尚未驗證的登入態 Blog comment / reaction。

### Travel interaction pattern

Phase-4 已建立 Travel interaction panel 與 server action：

- 未登入：locked preview。
- 已登入：留言與 `up` / `down` reaction。

Phase-6 應讓登入態能一致解鎖 travel private detail 與互動資料。

### App shell 與 boundary

- `src/app/(app)/layout.tsx` 已有全域 app shell 與主導覽。
- `src/app/(app)/loading.tsx` 與 `src/app/(app)/error.tsx` 已存在。
- 新增 login route 或 family-only route 時，視需要補 nested loading/error。

---

## 5. 建議實作範圍

### Auth helper

建議新增：

- `src/lib/data/auth.ts`

建議輸出：

- `getCurrentUser()`
- `getFamilySession()`
- `requireFamilyUser()`（只在 server action 或 family-only server route 使用）
- `isFamilyMode` 型別化結果

所有 helper 必須 `import 'server-only'`。

### Auth feature

建議新增：

- `src/features/auth/actions.ts`
- `src/features/auth/family-login-form.tsx`
- `src/features/auth/family-mode-indicator.tsx`
- `src/app/(app)/family/login/page.tsx`

登入與登出可使用 server action；完成後要 refresh 或 revalidate 受影響路由：

- `/`
- `/travel`
- `/blog`
- `/timeline`
- `/bucket-list`
- `/wrapped`

若 Payload auth cookie API 行為不確定，先做最小 spike，確認 cookie 在 App Router server action / route handler 中可被瀏覽器持久化，再擴充 UI。

### Data layer 接線

需更新：

- `src/lib/data/home.ts`
  - members / posts / travel 查詢在登入時傳入 `req: { user }`。
  - 回傳 `familySession` 或 `isFamilyMode`，讓首頁可切換 public / private 入口。
- `src/lib/data/travel.ts`
  - list/detail 查詢在登入時傳入 `req: { user }`。
  - interaction thread 繼續維持登入限定。
- `src/lib/data/posts.ts`
  - 改用共用 auth helper。
  - 確認 private post 不出現在未登入 metadata / JSON-LD。

### UI / UX

- Header 或首頁需顯示 family mode 狀態。
- 訪客看到明確但不洩密的「家人模式」入口。
- 登入後顯示目前家人身份或 display name。
- 登出後 public data 應立即恢復，不殘留 private cards。
- Bucket List / Timeline / Wrapped 入口在訪客模式只顯示精簡或 locked preview；家人模式才顯示完整 CTA。

---

## 6. 隱私驗收清單

### 靜態驗證

```bash
pnpm tsc --noEmit
pnpm run build
git diff --check
```

若更新 Payload collection：

```bash
pnpm exec payload generate:types
```

### Browser QA

未登入訪客：

- `/`
- `/travel`
- 至少一篇 public travel detail
- `/blog`
- 至少一篇 public blog detail
- family login route
- mobile viewport
- desktop viewport

登入家人：

- `/`
- `/travel`
- 至少一篇 private travel detail
- `/blog`
- 至少一篇 private blog detail
- Blog comment create
- Blog heart / cool / applause reaction
- Travel comment create
- Travel up / down reaction
- logout 後回到 public mode

### Data leak check

未登入狀態需抽查：

- HTML source
- RSC payload / network response
- `generateMetadata` output
- JSON-LD script

不得包含：

- private post title / summary / body
- private travel title / itinerary / flights / lodging
- private comments / reactions
- family-only profile details
- secret、token、database URL、Payload secret

---

## 7. 已知風險

- 本地 Node v24 曾在 Payload migration CLI 遇到 `node:crypto?tsx-namespace` 相容性問題。Phase-6 應盡量避免 schema 變更；若必須建立 migration，建議使用 Node 20 相容環境。
- Payload auth cookie 與 Next.js App Router server action 的接線需要實測，不能只靠型別通過。
- 家人模式登入後的資料刷新必須覆蓋首頁、Blog、Travel；只刷新目前頁可能導致使用者誤以為 private data 沒有解鎖。
- 未登入頁面的 metadata / JSON-LD 很容易意外洩漏 private title，Phase-6 必須把 metadata 也納入驗收。

---

## 8. Phase-7 Readiness

Phase-6 完成後，Phase-7 可以直接依賴：

- `isFamilyMode` 判斷 Timeline / Bucket List / Wrapped 是否解鎖。
- `requireFamilyUser()` 保護 Bucket Item create / move / complete。
- `Comments` 的登入限定互動模式，延伸到 timeline 事件。
- 首頁 family mode 狀態，接上 Time Machine Widget、Bucket List Quick View、Wrapped seasonal CTA。

若 Phase-6 未完成登入與 private data unlock，Phase-7 不應開始私密互動寫入，否則會把願望清單與年度報告暴露在不穩定的權限模型上。
