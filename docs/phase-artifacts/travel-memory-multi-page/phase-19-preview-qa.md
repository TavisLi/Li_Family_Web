# Phase 19 Preview QA

日期：2026-08-03

## 環境

- Preview DB：Neon Free 專用 PostgreSQL，未連接 Production DB。
- Neon project：`little-surf-04196525`
- Neon branch：`br-royal-morning-afhkbilm`
- Database：`neondb`
- Vercel deployment：`dpl_BjJRA9jJwbUXdksucBnPuY2tLNpX`
- Commit：`f0ce8863ea1335df38a6670835acabc6c997471a`
- Preview URL：`https://li-family-web-git-codex-phase-19-tra-8a086f-tavis-li-s-projects.vercel.app`

## Vercel branch env

Branch：`codex/phase-19-travel-memory-prototype`

- `DATABASE_URI`
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_R2_PUBLIC_URL`
- `NEXT_PUBLIC_SERVER_URL`
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED=true`

`NEXT_PUBLIC_SERVER_URL` 已刪除舊 branch-scoped value 後重建為 Preview branch alias，並以最新 deployment HTML 驗證 canonical／Open Graph host。

## Preview DB read-back

最小 QA dataset 已寫入 Preview DB，用於驗證三種樣式與重點 Day／YouTube placement。此資料集不是完整 Production-like seed。

| Memory | Style | Day | Placements | Photos | YouTube | Read-back |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `201307-hainan` | `family-scrapbook` | `day-03` | 2 | 2 | 0 | `南山文化旅遊區的海上觀音。`；`登上鹿回頭公園，俯瞰三亞灣與市區海岸線。` |
| `201307-hainan` | `family-scrapbook` | `day-08` | 2 | 2 | 0 | `石梅灣艾美幾乎無人的海灘，為八日旅程留下安靜的尾聲。`；`石梅灣艾美的礁湖泳池，是旅程最後一天的度假亮點。` |
| `202308-east-australia` | `cinematic-timeline` | N/A | 0 | 0 | 0 | Style assignment only |
| `202602-thailand-phuket` | `editorial-journal` | `day-01` | 1 | 0 | 1 | `20260210-Thailand-Phuket-001` |
| `202602-thailand-phuket` | `editorial-journal` | `day-02` | 1 | 0 | 1 | `20260211-Thailand-Phuket-001` |

## Rendered HTML QA

以 `vercel curl` 對最新 READY Preview deployment 抓取 rendered HTML，驗證結果：

| Route | Result |
| --- | --- |
| `/travel/201307-hainan/day/day-03` | `family-scrapbook` marker、兩個 manifest captions、canonical／OG Preview host 均存在 |
| `/travel/201307-hainan/day/day-08` | `family-scrapbook` marker、兩個 manifest captions、canonical／OG Preview host 均存在 |
| `/travel/202602-thailand-phuket/day/day-01` | `editorial-journal` marker、`youtube-nocookie.com/embed/A1nSo0loipA`、YouTube title、canonical／OG Preview host 均存在 |
| `/travel/202308-east-australia` | Overview canonical／OG Preview host 存在；`cinematic-timeline` style 以 Preview DB read-back 驗證 |

Vercel runtime logs for latest deployment grouped QA requests as HTTP `200`.

## Known limitations

- Preview DB 是最小 QA dataset，不是完整 Production-like seed。
- 未執行 R2/media write；HTML placement、caption、metadata 已驗證，但圖片 binary 供應不作為本輪完成證據。
- `202308-east-australia` overview 目前沒有 `data-travel-memory-style` marker；style 配置以 Preview DB read-back 作為證據。
- Hainan source 目前沒有 YouTube URL；YouTube slice QA 使用 Phuket Day 1／Day 2 的真實來源。
- Supabase Preview check 為 `SKIPPED`，符合本輪改用 Neon Free 專用 Preview PostgreSQL 的決策。
- Vercel build logs 顯示 Node 20 deprecation warning；2026-10-01 後 Vercel 將要求調整 Node 設定，建議另列 tech debt。

## Boundaries

- 未連接或寫入 Production DB。
- 未執行 Production schema migration。
- 未執行 Production content/media write。
- 未執行 runtime cutover、merge、Issue closeout 或 destructive cleanup。
