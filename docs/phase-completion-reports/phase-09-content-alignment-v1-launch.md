# Phase 09 完成報告：內容對齊與 v1 發佈準備

日期：2026-06-21  
分支：`codex/phase-9-content-alignment-v1-launch`  
最終提交（報告撰寫前）：`c6f18d3c9627f91f0072c44b737ac0bfba87ac74`  
GitHub Draft PR：[ #9 Content alignment and v1 launch readiness ](https://github.com/TavisLi/Li_Family_Web/pull/9)

## 本階段範圍

將 `docs/travel-projects.md`、旅行 Markdown、旅程媒體清單與 Payload Production 資料對齊，並補足 v1 發佈前的可重複同步、唯讀稽核與安全驗證流程。

## 已交付內容

- 五個旅程皆有明確 canonical slug，並已完成來源文件、Payload record 與共享 `/travel/[slug]` 路由對齊。
- 旅程內容匯入已支援航班、住宿、逐日行程、外部 YouTube 影片與完成旅程資料簿顯示。
- 所有旅程 cover／gallery 本機檔案已改為以旅程 slug 為前綴，共重新命名 665 個檔案；Payload 上傳前的暫存檔也使用全域唯一名稱，避免不同旅程的 `gallery-xxx` 同名碰撞。
- 新增來源稽核、Production dry-run，以及「先讀回既有媒體、再更新成員／旅程」的回讀式同步模式。
- 成員資料已正確寫入 `zh-TW` 與 `en` locale；英文語系保留完整 fallback 內容，並使用英文姓名作為顯示名稱。
- YouTube 嵌入限制為合法 YouTube URL，並使用 `youtube-nocookie`，避免任意第三方 iframe。

## Production 同步結果

正式媒體同步完成後，回讀式同步結果為：

- 787 個媒體已確認在 Production 存在。
- 成員、旅程與首頁設定共更新 12 筆。
- `created: 0`、`updated: 12`、`failed: 0`。
- 最終 dry-run：798 個來源皆已有對應資料，`creates: 0`、`updates: 798`、`deletes: 0`。

dry-run 的 798 筆「update」代表此工具以來源路徑比對到既有資料，並非需要再次上傳 798 個檔案。

## 核心檔案

- `src/scripts/seed.ts`：Phase 9 seed、dry-run 與回讀式同步。
- `src/scripts/seed-member-locale.ts`：成員多語系寫入資料形狀。
- `src/scripts/seed-media-context.ts`：既有媒體 `sourcePath` 到 ID 的唯讀索引。
- `src/scripts/seed-content.ts`：旅行／成員來源解析與資料驗證。
- `src/features/travel/completed-travel-ledger.tsx`：已完成旅程的航班與住宿資料簿。
- `docs/travel-projects.md`：五個旅程的 canonical slug。
- `content-source/assets/travels/*/manifest.json`：隨本機媒體檔名同步更新。

## 驗證紀錄

- Phase 9 內容解析、來源稽核、dry-run、媒體命名、多語資料與旅程頁面測試：通過。
- `pnpm run seed:audit`：通過；五個旅程均無缺少旅程 record、封面或結構化內容。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：通過（Next.js 15.4.11）。
- `git diff --check`：通過。
- Production dry-run：無新增、無刪除。

## 瀏覽器 QA 與已知限制

瀏覽器互動式 QA 已完成以下範圍：

- Production 首頁在桌機尺寸下可載入；Tavis、Lynn 頭像皆實際載入 800px 圖片。
- `/travel/202702-thailand-phuket` 在桌機與 390px 手機尺寸下可載入封面、航班、住宿與每日行程內容。
- 使用 Tavis 測試帳號可登入家人模式；Wrapped 與 Bucket List 都可讀取，Bucket List 顯示 4 筆願望與對應操作按鈕。

首次登入後立即導向 Bucket List 時，in-app browser 曾出現一次暫時性的 `network error`；Production 沒有對應的 500 日誌，重新開啟同頁後即正常。此現象未再次重現，但建議在正式合併前由真人瀏覽器再確認一次首次登入後的導向體驗。

R2 公開網址問題已於本報告初版後修復：Production 的 `NEXT_PUBLIC_R2_PUBLIC_URL` 已設定為 Cloudflare R2 的公開 `r2.dev` 網域，並已重新部署。已確認一筆新旅程媒體與 Tavis、Lynn 頭像皆為 HTTP 200。

Tavis 與 Lynn 原本缺少對應的 R2 object；已只重傳這兩個既有 Media 記錄，Payload 為避免既有檔名衝突而產生 `tavis-avatar-1.jpeg` 與 `lynn-avatar-1.jpeg`。未建立新的 Media record，且未刪除資料。

此外，最初一次中斷的媒體同步曾以舊檔名建立部分媒體記錄；本階段沒有執行刪除，避免誤刪 Production 資產。這些可能的舊路徑媒體可在 R2 公開網址修正後，另行盤點並在明確授權下清理。

## GitHub 與發佈狀態

- 分支已推送至 GitHub。
- Draft PR #9 已建立，尚未合併。
- 因 PR 尚未合併，Production 網站程式碼尚未包含本分支的前端與同步工具變更；Production Payload 內容則已依本報告同步。
- v1 尚不可宣告正式上線，剩餘主要工作為 Draft PR review／合併，以及真人瀏覽器對首次登入後導向的確認。

## 下一步

1. 在真人瀏覽器確認首次登入後會直接進入目標私密頁，並處理 Draft PR review 後再合併。
2. 如需保持儲存空間整潔，另開一次已授權的舊路徑媒體盤點／清理；不要以一般 Phase 9 seed 自動刪除。
