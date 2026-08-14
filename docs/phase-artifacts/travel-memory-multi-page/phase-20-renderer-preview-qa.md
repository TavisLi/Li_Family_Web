# Phase 20 Travel Memory Renderer Preview QA

日期：2026-08-14

## Scope

- Draft PR：[#92](https://github.com/TavisLi/Li_Family_Web/pull/92)
- Renderer commit：`6f1c30d28096b7425ef56b16460ffbfe11b5fb98`
- Vercel deployment：`dpl_J7bLKeGyDevHkgDvTH6WWpxpcYzF`
- Branch alias：`https://li-family-web-git-codex-phase-20-tra-8dc4a7-tavis-li-s-projects.vercel.app`
- Payload dataset：Neon project `little-surf-04196525`／branch `br-royal-morning-afhkbilm`／database `neondb`
- Production read／write：未執行

## Preview configuration

依使用者批准，Phase 20 branch-scoped Preview 配置以下名稱；本文件不記錄任何 secret value：

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED`
- `NEXT_PUBLIC_R2_PUBLIC_URL`
- `NEXT_PUBLIC_SERVER_URL`

Neon read-only query 確認 `201307-hainan` 存在，且 `presentation_style=family-scrapbook`。沒有執行 schema、content 或 media write。

## Formal route results

| Route | Viewport | HTTP／layout | Captions | Overflow | Console |
| --- | --- | --- | --- | --- | --- |
| `/travel/201307-hainan/day/day-03` | 1440×1000 | 200／`scrapbook-day` | 2 | 無 | 0 errors |
| `/travel/201307-hainan/day/day-03` | 390×844 | 200／`scrapbook-day` | 2 | 無（390＝390） | 0 errors |
| `/travel/201307-hainan/day/day-08` | 1440×1000 | 200／`scrapbook-day` | 2 | 無 | 0 errors |
| `/travel/201307-hainan/day/day-08` | 390×844 | 200／`scrapbook-day` | 2 | 無（390＝390） | 0 errors |

Day 3 captions：

1. 南山文化旅遊區的海上觀音。
2. 登上鹿回頭公園，俯瞰三亞灣與市區海岸線。

Day 8 captions：

1. 石梅灣艾美的礁湖泳池，是旅程最後一天的度假亮點。
2. 石梅灣艾美幾乎無人的海灘，為八日旅程留下安靜的尾聲。

兩日均呈現「這一天沒有已配置的旅行影片」誠實空狀態。Day 3 導向 Day 8、Day 8 導向 Day 3，與目前僅含兩日的 Preview dataset 一致。

## Screenshots

- `output/playwright/phase20-preview-day03-desktop.png`
- `output/playwright/phase20-preview-day03-mobile.png`
- `output/playwright/phase20-preview-day08-desktop.png`
- `output/playwright/phase20-preview-day08-mobile.png`

## Known limitations

- Preview dataset 僅有 Day 3／Day 8，未驗證完整八日的相鄰日導覽。
- Preview 沒有同步相片 binary，故正式 route 顯示既有圖片 fallback；placement caption、alt、版面與 responsive 行為已驗證。
- Vercel build 有 Node 20 將於 2026-10-01 停止支援的提示；本次 deployment 為 Ready，兩條正式 route 均為 HTTP 200。
