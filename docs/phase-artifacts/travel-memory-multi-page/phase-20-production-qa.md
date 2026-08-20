# Phase 20 Travel Memory Renderer Production QA

日期：2026-08-21（Pacific/Auckland）

## Deployment identity

- PR：[#92](https://github.com/TavisLi/Li_Family_Web/pull/92)
- Merge commit：`f17e162d67ba9181280a4291ffda32dada4d7bf5`
- Vercel deployment：`dpl_Ei6gZYoB5TUxGX87JxAgUFZv4HFg`
- Deployment status：`READY／PROMOTED`
- Production alias：`https://li-family-web.vercel.app`
- Vercel Git source SHA：`f17e162d67ba9181280a4291ffda32dada4d7bf5`

Vercel deployment metadata、GitHub merge commit 與 `origin/main` SHA 三者一致，因此本次驗收不是在舊 deployment 或 Preview 上執行。

## Formal route matrix

| Route | Viewport | HTTP／canonical | Layout | Captions／images | Navigation | Overflow／console |
| --- | --- | --- | --- | --- | --- | --- |
| `/travel/201307-hainan/day/day-03` | 1440×1000 | 200／Production alias | `family-scrapbook／scrapbook-day` | 2／2 loaded | Day 2、Day 4 | 無／0 errors |
| `/travel/201307-hainan/day/day-03` | 390×844 | 200／Production alias | `family-scrapbook／scrapbook-day` | 2／2 loaded | Day 2、Day 4 | 390＝390／0 errors |
| `/travel/201307-hainan/day/day-08` | 1440×1000 | 200／Production alias | `family-scrapbook／scrapbook-day` | 2／2 loaded | Day 7 | 無／0 errors |
| `/travel/201307-hainan/day/day-08` | 390×844 | 200／Production alias | `family-scrapbook／scrapbook-day` | 2／2 loaded | Day 7 | 390＝390／0 errors |

兩條 route 的 rendered HTML 均未出現 `NEXT_HTTP_ERROR_FALLBACK;404`。

## Placement read-back

Day 3：

1. 南山文化旅遊區的海上觀音。圖片 `3648×5472`。
2. 登上鹿回頭公園，俯瞰三亞灣與市區海岸線。圖片 `5472×3648`。

Day 8：

1. 石梅灣艾美的礁湖泳池，是旅程最後一天的度假亮點。圖片 `5472×3648`。
2. 石梅灣艾美幾乎無人的海灘，為八日旅程留下安靜的尾聲。圖片 `5472×3648`。

四張照片均從 Production R2 public URL 實際載入；較後方照片採 browser lazy loading，捲入視窗後 `complete=true` 且 `naturalWidth／naturalHeight` 正常。兩日均顯示「這一天沒有已配置的旅行影片」誠實空狀態。

## Screenshots

- `output/playwright/phase20-production-day03-desktop.png`
- `output/playwright/phase20-production-day03-mobile.png`
- `output/playwright/phase20-production-day08-desktop.png`
- `output/playwright/phase20-production-day08-mobile.png`

## Data and safety

- Production read-only scope：上述兩條 route、其 HTML、console 與公開相片 URL。
- Schema／migration：未執行。
- Content／media／access write：未執行。
- Production secret／database：未讀取、未記錄。
- Existing Phuket untracked files：未修改、未納入。

## Residual note

`pnpm run test:phase-19` 的 Australia `unassignedVideos` assertion 與現行 source mapping 不一致，屬既有測試債務；Phase 20 renderer focused tests、build、typecheck、Preview 及本次 Production route QA 均已通過。
