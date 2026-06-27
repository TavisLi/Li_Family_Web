# Phase 10 完成報告：管理員與 Family members 帳號建立

日期：2026-06-27
分支：`codex/admin-family-accounts`
主要實作提交：`160edfb feat: add admin and family account provisioning`
補充修正與本報告：本報告所在提交
GitHub / PR 狀態：本地驗證完成，分支已 push；PR 建立受 GitHub 權限阻擋。
GitHub push：已推送 `codex/admin-family-accounts` 至 `origin`。
PR 狀態：GitHub CLI token 失效，GitHub connector 建立 PR 回傳 403 `Resource not accessible by integration`；需由網站擁有者手動開啟 PR。
PR 建立 URL：

```text
https://github.com/TavisLi/Li_Family_Web/pull/new/codex/admin-family-accounts
```

## 本階段範圍

Phase 10 的目標是建立網站管理員與 Family members 帳號，並把 Payload CMS 後台管理權限從「所有登入使用者」收斂為「指定管理員」。同時新增可重複執行、避免輸出敏感資訊的帳號 provisioning 流程，讓後續營運可安全更新帳號。

本階段使用的帳號來源為使用者本機附件：

```text
/Users/tien-hsinglee/Desktop/Account Creation.txt
```

報告與命令輸出均不記錄密碼、cookie、token 或完整 credential。

## 已交付內容

- `users` collection 新增 `role` 欄位：`admin` / `family`。
- Payload `/admin` 後台只允許 `role=admin` 的使用者進入。
- CMS 管理型資料的 `create` / `update` / `delete` 權限限制為管理員。
- 保留 Family Mode 既有互動能力：家人仍可登入、使用願望清單與留言等家人互動功能。
- 新增帳號 provisioning CLI：

  ```bash
  pnpm run accounts:provision -- --accounts-file /absolute/path/to/account-file
  ```

- CLI 預設 dry-run，不加 `--apply` 不會寫入資料庫。
- CLI 會遮蔽敏感資訊，只輸出 slug、角色、create/update 摘要與 login 結果。
- 附件中的獨立管理員列若使用 `-` 作為 slug，會正規化為穩定 slug `administration`，避免與獨立管理員帳號重複。
- 既有 family profile 的帳密與 role 更新採窄欄位更新，只更新 auth / role 欄位，避免觸發多語 profile 內容的完整 validation 而誤改個人頁資料。

## 帳號與權限結果

Phase 10 完成後，帳號口徑如下：

- Administrators：2 位
  - `administration`
  - `tavis`
- Family members：8 位
  - `tavis`
  - `lynn`
  - `nini`
  - `sophie`
  - `leo`
  - `grandma`
  - `tclee`
  - `anny`

重要定義：

- `role=admin` 代表可進入 Payload CMS 後台。
- `role=family` 代表一般 family-only 帳號。
- Tavis 同時是 administrator 與 family member；因此資料庫角色統計為 `admin: 2`、`family: 7`，但營運身份統計為 `administrators: 2`、`familyMembers: 8`。

Production dry-run 回讀結果：

```json
{
  "counts": {
    "create": 0,
    "update": 9
  },
  "roles": {
    "admin": 2,
    "family": 7
  },
  "access": {
    "administrators": 2,
    "familyMembers": 8
  }
}
```

所有 9 個 identity 的登入驗證皆回報 `login ok`。

## Database migration

已套用 migration：

```text
20260624_143753_add_user_role
```

Payload migration status 顯示：

- `20260619_055511_phase_7_time_capsule`：Batch 1，Ran Yes
- `20260624_143753_add_user_role`：Batch 2，Ran Yes

套用 migration 時，Payload 偵測到資料庫曾使用 dev mode 動態推 schema，並顯示 data-loss warning。此 warning 已由網站擁有者明確同意後才繼續執行。

## 核心檔案

- `src/payload/access/is-admin.ts`：管理員權限判斷。
- `src/payload/access/is-admin.test.ts`：管理員權限與 CMS 管理權限測試。
- `src/payload/collections/Users.ts`：`role` 欄位與 `/admin` access 設定。
- `src/payload/collections/*`、`src/payload/globals/*`：CMS 管理型資料寫入限制為管理員。
- `src/lib/data/bucket-list.ts`：保留家人完成願望清單時的 server-side timeline event 建立流程。
- `src/migrations/20260624_143753_add_user_role.ts`：新增 `users.role` 欄位。
- `src/scripts/account-provisioning.ts`：帳號表格解析、redacted summary、access 統計。
- `src/scripts/provision-accounts.ts`：dry-run / apply provisioning CLI。
- `package.json`：新增 `accounts:provision` script。

## 驗證紀錄

已執行並通過：

```bash
node --import tsx src/payload/access/is-admin.test.ts
node --import tsx src/scripts/account-provisioning.test.ts
node --import tsx src/lib/data/phase-7-domain.test.ts
pnpm exec payload migrate:status
pnpm exec payload generate:types
pnpm tsc --noEmit
pnpm run build
git diff --check
```

Production provisioning 驗證：

- dry-run：`create: 0`、`update: 9`
- access summary：`administrators: 2`、`familyMembers: 8`
- DB read-back：`administration` 與 `tavis` 可進 admin；其餘 family accounts 不可進 admin。
- login verification：9 個 identity 均為 `login ok`。

## Browser QA 與限制

本階段已完成資料庫與 Local API 層級驗證，確認帳號可登入、角色可判斷、後台 access predicate 正確。

尚未完成真人瀏覽器互動 QA：

- 使用 `administration` 或 `tavis` 實際開啟 Production `/admin`。
- 使用一般 family member 實際確認 `/admin` 被拒絕。
- 使用一般 family member 實際登入 `/family/login` 後操作 family-only 頁面。

原因：本階段主要在受保護 CLI / DB provisioning 流程中完成，且報告不記錄 credential。建議後續由網站擁有者在真人瀏覽器以新帳號完成一次抽查。

## 已知限制與營運注意事項

- `role=admin` 是後台管理權限；不要用它判斷「是不是家人」。Tavis 是管理員，也是 family member。
- Provisioning CLI 會更新帳號 email、password、role；不會修改既有 profile 的履歷、興趣、圖片與多語內容。
- 不應把帳號檔或密碼提交到 Git。
- 若未來新增管理員，應先更新帳號來源檔，再用 dry-run 檢查 `administrators` 與 `familyMembers` 摘要。

## 下一步

1. 由網站擁有者使用上述 URL 建立 PR，或重新授權 GitHub CLI 後再由代理建立 PR。
2. 在真人瀏覽器抽查 `/admin` 與 `/family/login`。
3. 合併後於 Production 再次執行一次只讀 dry-run，確認 `create: 0` 且 access summary 維持 `administrators: 2`、`familyMembers: 8`。
