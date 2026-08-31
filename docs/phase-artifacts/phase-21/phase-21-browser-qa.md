# Phase 21 Browser QA

- 執行日期：2026-08-31
- 執行方式：本地 Next.js dev server + Playwright CLI
- 資料：clean-room synthetic fixture；未連線 Payload／Preview／Production
- viewport：desktop `1440 × 1000`、mobile `390 × 844`

## 驗證矩陣

| Travel Memory | Presentation style | Overview | Daily | Desktop | Mobile |
| --- | --- | --- | --- | --- | --- |
| 2013 海南 | family-scrapbook | PASS | PASS | PASS | PASS |
| 2023 澳洲東岸 | cinematic-timeline | PASS | PASS | PASS | PASS |
| 2027 普吉島 | editorial-journal | PASS | PASS | PASS | PASS |

共 12 個 route／viewport 組合。每個組合均確認：

- renderer 與指定 presentation style 一致；
- Overview 顯示旅程資料簿與完整日期入口；
- Daily 顯示交通、餐食／住宿與 placement；
- 無 video 時不建立空白 footage frame；
- `document.documentElement.scrollWidth === window.innerWidth`，無水平溢位；
- browser console error 為 0。

澳洲 cinematic Overview 同時在橫向日期導覽與視覺卡片序列呈現全部 8 日，因此 DOM 中有 16 個 day links；這是同一批 8 個日期的兩種入口，不是重複資料。

## 證據

- `output/playwright/phase21-cinematic-overview-desktop.png`
- `output/playwright/phase21-editorial-day-mobile.png`

本地 fixture 曾觸發 Next.js LCP image priority 開發警告；已將 Editorial／Scrapbook 第一張 placement 設為 priority。沒有 browser console error。

## 尚未覆蓋

- Preview deployment 與真實 Payload read-back；
- Production HTTP／browser QA；
- migration 後的真實 `role`／`transport` 資料。

上述項目分別屬於 Preview、Production read-only、Production migration／content write gate，不由本地 QA 推導完成。
