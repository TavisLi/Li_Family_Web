# Phase 19 Browser QA

日期：2026-08-02

環境：Next.js dev／Node 20.20.2／Playwright CLI／localhost only

## 驗證矩陣

| 頁面 | Viewport | 結果 |
| --- | --- | --- |
| Editorial journal／海南 Day 3 | Desktop | 200；兩張照片均在正確 Moment；caption、alt、時間、地點、返回與下一日導覽可見。 |
| Cinematic timeline／海南 Day 8 | Desktop | 200；10:30 礁湖泳池、12:30 海灘及兩則 caption 可見；空 YouTube placement 不借用其他旅程影片。 |
| Family scrapbook／海南 Day 3 | 390 × 844 | 200；`scrollWidth = innerWidth = 390`，無水平溢出；2 個 figcaption、圖片與導覽可見。 |

三個頁面均為 0 console errors。唯一 warning 是 Next.js dev 對 `127.0.0.1` 靜態資源的 future `allowedDevOrigins` 提示，不影響頁面行為，亦未加入與 Phase 19 無關的 config 修改。

## Screenshots

- `output/playwright/phase19-editorial-day03-desktop.png`
- `output/playwright/phase19-cinematic-day08-desktop.png`
- `output/playwright/phase19-scrapbook-day03-mobile.png`

## 尚未執行

- Preview／Production browser QA：未獲部署／Production 授權。
- 正式 Payload-backed routes 的瀏覽器 QA：schema 與 backfill 尚未進入任何 shared／Production database；目前由 formal renderer tests、build 與 local source-backed prototype 驗證。
