# 管理員與家人帳號權限設計

## 目標

在既有 Payload `users` collection 中建立明確的 `admin` 與 `family` 角色，讓兩個指定管理員可進入 CMS，而家人帳號僅能進入家人模式與私密家庭功能。

## 範圍

- 在 `users` 新增必填 `role` select field，值為 `admin` 或 `family`，預設 `family`。
- 為 `users.access.admin` 加入角色檢查；只有 `role === 'admin'` 的已登入使用者可進入 `/admin`。
- 將 CMS 管理資料的 create／update／delete API 操作限制為 `admin`，避免一般家人略過後台 UI 直接呼叫 API；保留家人對 comments、bucket items 的既有參與權限。
- 保留既有 Family Mode 行為：任一有效 `users` session 都可讀取家人限定內容與參與互動。
- 以一次性、不可提交帳密的受控指令建立或更新：
  - 獨立 Administration 帳號與 Tavis 帳號：`role: admin`。
  - 帳號清單中的其他家人：`role: family`。
  - 已有個人頁面的帳號依 slug 更新，不建立重複 profile record。
  - 沒有個人頁面的帳號以 `familyRole: family` 與 `profileVisibility: family` 建立純登入 record。
- 提供 dry-run，預覽 create／update 計畫但不輸出密碼；實際寫入必須明確帶 `--apply`。

## 不在範圍

- 不建立第二個 administrator collection，也不建立第二套登入系統。
- 不把 email、password 或帳號清單寫入 Git、seed 資料、測試 fixture、文件或完成報告。
- 不變更公開／私密內容的資料存取規則；本次只縮小 CMS 管理入口。
- 不更動既有會員個人頁面內容、媒體關聯或旅遊 seed。

## 資料與權限模型

`Users` 保持唯一的認證 collection。`familyRole` 繼續表示家庭身分（父親、母親、女兒等），新 `role` 只表示系統權限：

| `role` | 可登入家人模式 | 可進 `/admin` | 預期使用者 |
| --- | --- | --- | --- |
| `family` | 是 | 否 | 一般家人帳號 |
| `admin` | 是 | 是 | Administration、Tavis |

Payload 的 `access.admin` 是 CMS 後台的強制邊界。由於 Payload 未設定的 collection write access 預設允許已登入使用者，CMS 管理資料也必須明確加入 `admin` create／update／delete access，不能只隱藏後台 UI。前端家人登入不以 `role` 限制，以維持現有 Family Mode 設計；comments 與 bucket items 維持家人參與。Bucket 完成時建立的 timeline event 改由已驗證的 server action 使用受控的 Local API write。資料操作腳本同樣只由受保護 server-side 環境執行。

## 帳號建立流程

1. 以本機帳號清單檔作為命令的輸入，僅在 process memory 中解析 Markdown table。
2. 先執行 dry-run，根據 slug 與 email 找到既有 `users` record，輸出經遮罩的 action 摘要。
3. 確認摘要後執行 `--apply`：更新 email、password 和 `role`，或建立必要的純登入 record。
4. 寫入後以 `payload.login` 驗證每一個帳號可登入，且不輸出 token、cookie 或 password。
5. 以兩種角色的受保護 request 驗證：admin 可通過 CMS admin access；family 會被拒絕。

如有一筆 account email 已屬於另一個 slug，腳本必須停止並輸出不含敏感資料的衝突訊息，不嘗試合併或覆寫。

## Migration 與回復

- 新欄位以 Payload migration 套用；既有 records 先以預設值 `family` 回填，之後帳號建立流程將兩位管理員提升為 `admin`。
- 所有帳號建立皆為 slug／email 對應的 upsert，重跑不會複製 records。
- 若權限設定錯誤，透過受保護腳本將指定帳號改回 `family` 後重新部署；不刪除帳號或個人 profile。
- 資料庫操作無法由 Vercel deployment rollback 還原，因此執行前保留 dry-run action 摘要。

## 驗收標準

1. `Users` type 含有 `role: 'admin' | 'family'`。
2. 一位 `admin` user 可通過 Payload CMS admin access；一位 `family` user 被拒絕。
3. dry-run 不寫資料、不顯示密碼；apply 僅建立或更新預期帳號。
4. 每個建立／更新帳號皆能以其指定 credential 登入，且 no secret 出現在工具輸出或 Git diff。
5. `pnpm exec payload generate:types`、focused tests、`pnpm tsc --noEmit`、`pnpm run build` 與 `git diff --check` 均通過。
