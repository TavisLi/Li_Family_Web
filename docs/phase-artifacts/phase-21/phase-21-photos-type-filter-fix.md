# Phase 21 Photos 類型篩選本地修復

日期：2026-09-03。Related to #99／#100；非整張 Issue 或 Phase 完成證明。

## Scope 與實作

Human 已確認：Photos 提供「全部／照片／影片」，包含每日 YouTube 與全旅程影片；日期篩選只包含該日媒體，保留分頁、去重與返回旅程／每日連結；只改本地呈現，不改內容資料。

程式 commit：`e1a96db`。批准審查起點：`f592e7d387c251654ed05b63369bb974dd7aa484`。本地提交只有 8 個 Photos 程式／測試檔，未納入其他 dirty 文件或素材；沒有 push／deploy／merge。

- 共用 Gallery VM 改為從 generated Placement types 派生的 photo／youtube union；data query 與 route 串接 `type=photo|youtube`，未知值回到全部。
- 每日影片來自 Moment → Placement；全旅程影片來自 parent externalVideos。Gallery 只是讀取投影，不複製／搬移／更新 persisted owners。
- 按日期／地點／類型篩選 → canonical identity 去重 → 分頁。照片以 Media id，影片以 canonical watch／shorts／embed／live identity 去重；全部視圖 daily usage 優先於 global。同一資產在不同日使用時，各日篩選均可回到自己的 Moment。
- 三套 renderer 保留原有視覺語言、caption 與 altText 分離；影片 lazy load、不 autoplay，live URL 保留既有安全 external-link 行為。無效或非 HTTPS YouTube URL 不產生 Gallery item。
- 切換條件重設頁碼；翻頁保留條件。加入語意化 filter nav、aria-current 與 keyboard focus outline。沒有 Day 的 Memory 仍可呈現全旅程影片，不回落至 photo-only legacy gallery。
- Public／Family／draft 的 owning Memory 與 Day access-aware queries 未變更；沒有 Collection、migration、seed、Production content／media 或 schema 變更。

## 測試證據

以 implement／TDD 在既有 projection 與 renderer seam 逐步 RED → GREEN：

1. 混合相簿最初只回傳 1 張照片，預期 3 項（照片＋每日影片＋全旅程影片）。
2. 類型篩選最初未生效（3 而非 2），修正為先篩選再分頁。
3. 重複 daily／global／gallery fixture 最初有 7 而非 4 項；修正 canonical 去重與跨日回跳。
4. 三套 SSR 最初沒有類型 nav，影片被送入圖片 renderer；修正後均有影片 frame、caption、日期與類型 URL。
5. live／watch 同一影片最初顯示兩筆；新增 shared identity helper，保留既有 embed／external-link 行為。

驗收結果：

| 檢查 | 結果 |
| --- | --- |
| `src/lib/travel-memory.test.ts` | PASS：混合媒體、filters、pagination、重複資產、跨日回跳、zero-Day global、unsafe URL |
| `src/features/travel/travel-memory-pages.test.tsx` | PASS：三套 renderer、選中狀態、caption／altText、URL 條件保留／重設頁碼、lazy／無 autoplay |
| `src/features/travel/youtube.test.ts` | PASS：五種網址同 identity、拒絕非 HTTPS／冒名 host，既有 live fallback 不變 |
| package.json 全部 9 組 `test:*` scripts | PASS：r2、seed-content、phase-9、16、17、18、19、daily-parser、phase-21 |
| `pnpm run build` | PASS，Node20.20.2／Next15.4.11 |
| build 後 `tsc --noEmit` | PASS |
| `git diff --check` | PASS |

Build command 明確覆寫 DATABASE_URI 為合成 `127.0.0.1:1`、PAYLOAD_SECRET 為合成值、R2 四項 storage credentials 為空、public URL 為 `.invalid`，schema push=false。Next 顯示發現 `.env.local`／`.env`，但上述連線設定由 command env 優先覆寫；不以 Production DB／R2 驗證 build。

## 本機 Browser QA

使用實際 Gallery projection／renderer 與本次 build CSS，localhost 合成伺服器 `127.0.0.1:55440`、獨立 `phase21-photos-local` browser session。不是 Next route integration 或真實 DB QA。

三套風格 × 1440×900、768×1024、390×900 共 9 組流程完成，QA command terminal exit0：

- 以 keyboard Enter 進入照片篩選，合成照片 complete／naturalWidth 正常。
- Day2 → 影片：沒有照片或 global film；回跳連結包含 Day2／Moment。
- 所有日期 → 下一頁：保留 type，能看到 global film。
- aria-current、可見 keyboard focus、單一 H1、無水平溢出。
- 沒有 pageerror。CSP `frame-src 'none'` 刻意封鎖影片並產生 console error；不能宣稱 console 全無錯誤或真實影片播放 PASS。

頁面 CSP 與 browser interception 均禁止非 localhost requests。影片截圖中的封鎖 frame 是此測試隔離措施，不是實際 YouTube 可播放性證據。三張390px截圖已人工檢視：

- `output/playwright/phase21-photos-editorial-journal-mobile.png`
- `output/playwright/phase21-photos-cinematic-timeline-mobile.png`
- `output/playwright/phase21-photos-family-scrapbook-mobile.png`

QA server／browser 已停止；合成 harness 保留於本機 `/private/tmp/phase21-photos-qa.6enXOS/`，截圖不納入程式提交。首輪 wrapper 的 npm metadata fetch 失敗後改用已存在的 Playwright CLI，沒有安裝／更新 package；首輪 QA harness 因 VM 沒有 URL global 失敗，修正 localhost guard 後完整重跑通過。這些本機 QA 嘗試不是 Production 重試。

## Standards

獨立靜態審查：硬性規範違規 0；非阻擋建議 1。`src/lib/travel-memory.ts` 引用既有 `features/travel/youtube` 純 helper，長期可考慮移入 lib；現行文件沒有明文禁止，為避免額外重構本輪不搬移。

## Spec

獨立靜態審查：已批准 Photos slice 的可確認新增規格缺陷 0。檢查涵蓋 route → data query → Gallery VM → 三 renderer；不把 #99 其他未完成工作算成此 commit 缺陷，也不宣稱完整 #99 完成。

## 剩餘 gate 與 rollback

- 尚未 push、Preview deploy、真實媒體／access／影片播放 QA，未 merge。需要後續明確部署／QA 範圍，不把 local PASS 當成上線 PASS。
- 海南 Production 恢復檢查於 `2026-09-03T12:15:49.450Z` CONNECT 失敗後已停止；本修復不恢復其正文或發布狀態，不重試 DB。
- 185 項 apply、#101 destructive cleanup、#102 完整 clean-room 與 Phase closeout 均未因本修復完成。
- Rollback 為另行批准後 revert `e1a96db`；本修復沒有 DB changes，因此沒有資料回滾或 schema migration。

## 2026-09-04 current-HEAD Browser recheck

- 在本地 HEAD `70961a8` 完成 build 後，重用相同 localhost synthetic harness 與實際 build CSS，以獨立 `phase21-current-head` Playwright session 重跑三套風格 × `1440×900`、`768×1024`、`390×900`，共 9 組流程，結果 `SYNTHETIC_PHOTOS_BROWSER_PASS`。
- 每組均重新驗證 keyboard Enter 類型篩選、可見 focus、日期／類型 URL、Day 2 回跳、daily／global video ownership、分頁保留 type、圖片載入、單一 H1 與無水平溢位；`pageerror=[]`。
- browser interception 與 CSP 只允許 `127.0.0.1:55440`，外部媒體持續封鎖；沒有連 Payload／Preview／Production。session 與 localhost server 均已關閉。
- 此 recheck 證明本地後續 #102 parser／dry-run commits 未回歸 Photos；仍不能代替新 head push 後的真實 Preview、R2 bytes、YouTube 播放或 access QA。
