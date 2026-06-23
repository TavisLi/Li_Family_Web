# Phase 09 完成報告：內容對齊與 v1 發佈準備

日期：2026-06-23
原始交付分支：`codex/phase-9-content-alignment-v1-launch`
Production 媒體修復分支：`codex/phase-9-media-repair`
原始交付合併提交：`e9f703bf8a7f32c46f7161d127242b05ad23b890`
媒體修復提交：本報告所在的 `codex/phase-9-media-repair` 分支 HEAD（以補充 PR 的 commit 為準）
GitHub 原始 PR：[ #9 Content alignment and v1 launch readiness ](https://github.com/TavisLi/Li_Family_Web/pull/9)（已合併）

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

## Production 媒體修復（2026-06-23）

正式網址的 R2 健康檢查發現：部分早期既有 Media record 的資料列仍存在，但對應 R2 object 已遺失。根因是舊 seed 對既有媒體只更新 metadata，不會重新上傳實體檔案。

- 新增受控重傳模式：可指定一張或一小批來源媒體重新上傳，保留同一個 Payload Media record 與既有關聯。
- 已先修復 Tavis hero 圖片；Production 瀏覽器確認主視覺實際載入 800px 圖片。
- 對 `buildSeedContent()` 的 787 個 canonical 來源進行精確盤點，排除只差大小寫的歷史重複 record。
- 已重新上傳 27 張仍被正式網站使用、但回傳 404 的 2023 澳洲東岸行程圖片；每批結果均為 `created: 0`、`failed: 0`。
- 未刪除任何舊 record。少數不再被 canonical 來源引用的歷史 Media record 可能仍保有失效 URL，但不會由目前網站路由使用。

## 核心檔案

- `src/scripts/seed.ts`：Phase 9 seed、dry-run 與回讀式同步。
- `src/scripts/seed-member-locale.ts`：成員多語系寫入資料形狀。
- `src/scripts/seed-media-context.ts`：既有媒體 `sourcePath` 到 ID 的唯讀索引。
- `src/scripts/seed-media-repair.ts`：受控解析單張／小批媒體重傳參數。
- `src/scripts/seed-media-repair.test.ts`：媒體重傳 CLI 參數的回歸測試。
- `src/scripts/seed-content.ts`：旅行／成員來源解析與資料驗證。
- `src/features/travel/completed-travel-ledger.tsx`：已完成旅程的航班與住宿資料簿。
- `docs/travel-projects.md`：五個旅程的 canonical slug。
- `content-source/assets/travels/*/manifest.json`：隨本機媒體檔名同步更新。

## 驗證紀錄

- Phase 9 內容解析、來源稽核、dry-run、媒體命名、多語資料與旅程頁面測試：通過。
- `pnpm run seed:audit`：通過；五個旅程均無缺少旅程 record、封面或結構化內容。
- `pnpm tsc --noEmit`：通過。
- `pnpm run build`：2026-06-23 再次通過（Next.js 15.4.11）。
- `git diff --check`：通過。
- Production dry-run：無新增、無刪除。
- Production 受控媒體重傳：Tavis hero 1 張，以及 2023 澳洲東岸 canonical 行程圖片 27 張；所有命令回報 `failed: 0`。

## 瀏覽器 QA 與已知限制

瀏覽器互動式 QA 已完成以下範圍：

- Production 首頁在桌機尺寸下可載入；Tavis、Lynn 頭像皆實際載入 800px 圖片。
- `/travel/202702-thailand-phuket` 在桌機與 390px 手機尺寸下可載入封面、航班、住宿與每日行程內容。
- `/travel/202308-east-australia` 在 Production 載入完整 9 日內容、航班、住宿與圖片瀑布流；實測封面及前段 gallery 皆載入 1600px R2 圖片，瀏覽器 console 沒有 error。
- 使用 Tavis 測試帳號可登入家人模式；Wrapped 與 Bucket List 都可讀取，Bucket List 顯示 4 筆願望與對應操作按鈕。

首次登入後立即導向 Bucket List 時，in-app browser 曾出現一次暫時性的 `network error`；Production 沒有對應的 500 日誌，重新開啟同頁後即正常。此現象未再次重現，建議持續以真人瀏覽器觀察，但不構成目前發佈阻擋。

R2 公開網址問題已於本報告初版後修復：Production 的 `NEXT_PUBLIC_R2_PUBLIC_URL` 已設定為 Cloudflare R2 的公開 `r2.dev` 網域，並已重新部署。已確認一筆新旅程媒體與 Tavis、Lynn 頭像皆為 HTTP 200。

Tavis 與 Lynn 原本缺少對應的 R2 object；已只重傳這兩個既有 Media 記錄，Payload 為避免既有檔名衝突而產生 `tavis-avatar-1.jpeg` 與 `lynn-avatar-1.jpeg`。未建立新的 Media record，且未刪除資料。

此外，最初一次中斷的媒體同步曾以舊檔名建立部分媒體記錄；本階段沒有執行刪除，避免誤刪 Production 資產。這些可能的舊路徑媒體可在 R2 公開網址修正後，另行盤點並在明確授權下清理。

## GitHub 與發佈狀態

- PR #9 已由使用者轉為 Ready 並合併至 `main`；`main` 合併提交為 `e9f703b`。
- Vercel Production 已部署並使用正式網址：[li-family-web.vercel.app](https://li-family-web.vercel.app/)。
- 媒體修復已建立獨立的 Draft [PR #10](https://github.com/TavisLi/Li_Family_Web/pull/10)（`codex/phase-9-media-repair` → `main`），避免直接將未審核修復工具寫入 `main`。
- 以目前的資料、路由、R2 媒體與建置驗證結果，v1 可視為「第一個正式可用版本」；後續自訂網域、真人登入長期觀察與歷史孤兒媒體清理，屬於非阻擋的營運優化。

## 下一步

1. Review 並合併 Draft [PR #10](https://github.com/TavisLi/Li_Family_Web/pull/10)，讓受控媒體重傳工具與其測試進入 `main`。
2. 持續以真人瀏覽器觀察首次登入後導向；如需保持儲存空間整潔，另開一次已授權的歷史孤兒媒體盤點／清理，不要以一般 Phase 9 seed 自動刪除。
