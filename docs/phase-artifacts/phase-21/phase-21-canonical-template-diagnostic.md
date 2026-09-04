# Phase 21 canonical template clean-room 診斷

日期：2026-09-03。狀態：`CLEAN_ROOM_BLOCKED_SOURCE_CONTRACT`；沒有 Production 連線或寫入。

檢查工作樹起點 `4d49261`，parser 與 canonical template 未改。#102 要求新內容不依賴舊旅程特例即可完整導入；現有 tests PASS 尚不能證明此要求。

## 真實 parser 輸出與範本不一致

將 `docs/templates/travel-memory-source-template.md` 透過現有 `parseTravelMarkdown` 解析，catalog 使用既有 test 的 synthetic slug `209904-clean-room-coast`：

| 範本內容 | 實際 parser 輸出 | 判斷 |
| --- | --- | --- |
| 2026年4月1日–4月2日 | startDate／endDate 均為 `2026-01-01` | FAIL |
| Day1 4月1日、Day2 4月2日 | dates 為1月1日／1月2日 | FAIL：錯誤 parent date 傳到 children |
| 起飛08:00、抵達09:10 | departureTime／arrivalTime 均缺少 | FAIL |
| 未提供乘客欄 | passengers=`4/1` | FAIL：把日期當成乘客 |
| 出行人 Alex、Bo、Chen | party 缺少 | FAIL |
| 範本沒有可被 parser 採用的 privacy 宣告 | isPrivate=false | 不具可供新內容安全選擇的隱私契約 |

本輪已用 Node20.20.2 的獨立 assert CLI 實際跑到 exit1；預期日期／起降時間與 passengers 比對失敗，不是只憑搜尋結果推測。

## 根因

- `src/scripts/seed-content.ts:628` 從硬編碼 `travelDatesBySlug` 取日期；未知 slug 回落至固定 `2026-01-01`，沒有讀範本文中的日期。
- 同函數直接指定 `isPrivate: false`；SOP 要求人類確認 Public／Family，但沒有將此選擇帶入新旅程 Source 的可執行方式。
- `parseFlights` 只解析同儲存格的時間範圍，沒有讀範本分開的起飛／抵達欄；以 flightIndex==2 猜測第一欄是 passengers，與此範本不符。
- `parseParty` 要求出行人名單後有全形括號，範本的純名單沒有括號而被漏讀。
- `travel-memory-source-contract.test.ts` 只驗證兩個Day、theme/story、transport、flightNumber與hotel，沒有assert精確日期、visibility、起降時間或同行者；另外單獨呼叫validator，不代表匯入入口強制validation。

## 最小修正方向（待 Human 確認，未修改 parser）

1. 新的 canonical completed-memory source 明填 `startDate`、`endDate`、`isPrivate`，建立嚴格日期與 boolean validation；缺漏／非法值停止，不能默認為任意日期或公開。
2. 航班按表頭取得日期、起降時間、航班、乘客、航線與備註，不以 column index 猜乘客；同行者支援範本中的純名單。
3. 將上述欄位加入真實 parser → parent／Day projection regression，並驗證新入口會拒絕錯誤source。
4. 修正前後保存三筆既有正式 Source projections 的 hash／精確差異。不能因本地parser修好就重新匯入；任何與185項方案相關差異均另列並保持Production apply gate。
5. 在格式正確後，才繼續 canonical template → manifest → travel-only dry-run → 三renderer／Photos 的clean-room驗證。不要在錯誤的日期上建立更多PASS證據。

本輪尚未修改 canonical source 格式、parser、Source資料、Schema或Production；沒有push／deploy／merge／Issue close。Photos的本地修復與海南事故恢復是獨立工作，不因本診斷改變其狀態。

## 修正前正式 Source 基線

`phase-21-canonical-source-before.json` 已於 `2026-09-03T12:39:42.565Z` 從目前未修改的parser重新產生並完成磁碟回讀／file-checksum驗證。範圍固定海南、澳洲、202602普吉島共3筆／25個Source Days；不包含202702 Travel Plan或其7個未追蹤素材。

基線包含parser／day projector／hash helper／template／catalog／3份Markdown的檔案SHA-256、逐筆完整Source hash、逐欄位hash、Day projection hash與Source計數。生成使用 `buildScopedMemorySeedContent` → `buildTravelMemoryDayProjections` → `travelProjectionHash`；沒有Payload init或DB連線。

這是之後評估parser修改差異的**本地Source基線**，不是Production備份、不是內容正確性背書，也不能替代185項apply所需的fresh Current preflight。未覆寫既有field-plan artifacts；canonical metadata修正方向仍待Human確認。

## 2026-09-03 Human 確認後的本地修正

Human 已確認上述範本修正方向。本節取代前文「待確認／未修改 parser」的現況；前文保留為診斷歷史。狀態：`LOCAL_TEMPLATE_PARSER_VERIFIED_NOT_DEPLOYED`，不代表 #102 或整個 Phase 21 完成。

- Canonical frontmatter 新增 `startDate`、`endDate`、`isPrivate`；範本明填 2026-04-01 至 2026-04-02，預設 Family。未知 completed source 在真實 parser 入口強制驗證；缺漏、無效日期、日期倒置、非 boolean、必要章節缺失與 Day 不連續均拒絕。
- 航班依精確表頭解析，可重排、可選 `乘客`，保留日期／起降時間／航線／備註。另確認舊 seed Zod shape 會丟棄 `airline`，已補 optional Source 欄位以支援新範本；Payload 現有欄位不變，不產生 migration。舊來源原本不輸出的 airline 繼續不輸出，避免未批准的 Source 差異。
- Canonical 同行者支援純 `、` 分隔名單。Legacy Source 保留原解析路徑；未改三份正式 Markdown、manifest、catalog、Plan 或未追蹤素材。兩份 synthetic Daily fixtures 補新必填 metadata／章節，保留其原本測試的 Daily 邊界內容。
- 依 TDD 逐項執行 RED → GREEN：日期／privacy、入口 validation、航班欄位、同行者。新增欄序／optional passengers／explicit public／known slug 不繞過驗證的回歸檢查。

### 驗證與資料差異

- Node 20.20.2：`pnpm run test:phase-21`、`pnpm run test:seed-content` PASS。
- `pnpm run build` PASS，完成後 `pnpm exec tsc --noEmit` PASS；`git diff --check` PASS。
- Build 明確以 localhost:1 synthetic DATABASE_URI、synthetic PAYLOAD_SECRET、空 R2 credentials、`.invalid` public media URL 覆蓋外部服務設定，`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。未執行 Production 連線或寫入。
- `phase-21-canonical-source-after.json` 與 before 基線比對：3 筆 Source 全量 hash、25 個 Day 完整 projection hash、媒體計數／排序 source path hash 全部相同，changedFields=[]。保留的舊格式缺陷不因 hash 相同而被宣稱正確。
- 比對腳本初稿曾因 undefined field hashing 與 paths wrapper 遺漏失敗；已修正比對方法為原基線的 `travelProjectionHash({paths: sorted sourcePaths})`，未更動 before artifact，最後重新 assert 全部通過。這些是本地檢查程式錯誤，未觸及 Production。
- GitHub read-only remote check 因 DNS 失敗，無法刷新 PR／remote 現況；沒有 push、deploy、merge、cleanup 或 Issue 修改。本輪變更尚未提交。

### 後續界線

本地 source contract 已修復；完整 #102 的 manifest → travel-only dry-run → 三 renderer／Photos clean-room 驗收尚未全部完成。既有 Production 海南事件與連線 BLOCK 不因本輪本地成功而解除；任何新 Production 檢查／恢復仍需獨立批准。
