# Phase-6 開工前準備狀態：Family-Only Secure Gate

## 1. 結論

Phase-6 的開工前準備已完成到「可交給下一輪實作」狀態。  
目前唯一硬性 gate 是 Phase-5 PR #5 尚未 merge；因此 Phase-6 正式功能實作應等待 PR #5 merge 後，從最新 `main` 建立 `codex/phase-6-family-access-gate`。

若團隊要求立即開工，需明確採用 stacked branch，並在 PR 描述中標記依賴 PR #5。

---

## 2. GitHub / Branch 狀態

- Phase-5 PR：<https://github.com/TavisLi/Li_Family_Web/pull/5>
- PR state：`OPEN`
- Merge state：`CLEAN`
- Head branch：`codex/phase-5-premium-family-blog`
- Base branch：`main`
- Head latest commit：`6715cdc Prepare phase 6 family access gate`

本地狀態：

- Current branch：`codex/phase-5-premium-family-blog`
- `main`：`0ec2b7a Record phase 5 blog import decisions`
- Phase-5 feature commit：`7ce3229 Implement phase 5 premium family blog`
- Phase-6 prep commit：`6715cdc Prepare phase 6 family access gate`

未提交且不得誤提交的本地檔案：

- `.DS_Store`
- `content-source/blogger/takeout-20260614T010941Z-3-001.zip`

---

## 3. 已完成的 Phase-6 準備文件

- `docs/prompts/Web Li Prompt for Phase_6`
- `docs/phase-preparation/phase-06-family-access-gate.md`
- `docs/phase-preparation/phase-06-preflight-readiness.md`
- `docs/superpowers/plans/2026-06-14-family-access-gate.md`

---

## 4. 開工時必須遵守的順序

1. 等 Phase-5 PR #5 merge，或取得 stacked branch 明確許可。
2. 更新本地 `main`。
3. 建立 `codex/phase-6-family-access-gate`。
4. 確認 `.DS_Store` 與 Blogger Takeout zip 沒有 staged。
5. 執行 baseline：

```bash
pnpm tsc --noEmit
pnpm run build
git diff --check
```

6. 依 `docs/superpowers/plans/2026-06-14-family-access-gate.md` task-by-task 實作。

---

## 5. Phase-6 技術準備重點

### 已存在的權限基礎

- `src/payload/collections/Users.ts`
  - `auth: true`
  - 未登入只讀 `profileVisibility=public`
  - 登入可讀全部 user
- `src/payload/collections/Posts.ts`
  - 未登入只讀 `isPrivate=false`
  - 登入可讀全部 post
- `src/payload/collections/TravelProjects.ts`
  - 未登入只讀 `isPrivate=false`
  - 登入可讀全部 travel project
- `src/payload/collections/Comments.ts`
  - `read/create/update/delete` 都需要 `req.user`

### Phase-6 主要缺口

- `src/lib/data/home.ts` 尚未把登入 user 傳入 members / posts / travel 查詢。
- `src/lib/data/travel.ts` 尚未把登入 user 傳入 travel list/detail 查詢。
- `src/lib/data/posts.ts` 已有局部 current user helper，但需收斂到共用 `src/lib/data/auth.ts`。
- 前台尚無家人登入 / 登出入口。
- Header / Home 尚無清楚的 visitor / family mode 狀態。
- Travel private metadata 需補 generic guard，避免訪客 metadata 洩漏。

---

## 6. 驗收時不可漏掉的隱私檢查

未登入訪客不得在以下位置看到 private data：

- HTML source
- RSC payload / network response
- `generateMetadata` 結果
- JSON-LD script
- Blog / Travel index cards
- Home widgets

不得洩漏的內容類型：

- private post title / summary / body / tags
- private travel title / itinerary / flights / lodging
- private comments / reactions
- family-only profile details
- secret、token、database URL、Payload secret

---

## 7. Phase-7 接續準備

Phase-6 完成後，Phase-7 可以直接依賴：

- `getFamilySession()` 判斷是否顯示 Timeline / Bucket List / Wrapped 完整入口。
- `requireFamilyUser()` 保護 Bucket Item 新增、移動、完成。
- Header family mode 狀態，讓長期互動模組有一致入口。
- 已驗證的 Blog / Travel comment pattern，延伸到 Timeline events。

Phase-6 未完成前，不建議開始 Phase-7 的私密寫入功能。
