# Issue #114 — representative UI follow-up

日期：2026-09-24。範圍：普通 Family portal／首頁、Travel Editorial day、Travel Cinematic overview；只驗證與修正這三種既有表面。此為 [初次 benchmark](./visual-benchmark.md) 之後的本地實測補記。

## 可比對基準

- **BEFORE** 應用程式由 `git archive d72376dbd9f017d8b41f67d9915e58725b9c29fe` 解出；該 commit 是 #114 文件／Skill 工作前的 app 狀態。開始修改 UI 前，`git diff d72376d -- src public` 無差異。
- **AFTER** 從同一份解出的程式複製，只覆蓋本次修改的 `src/app/(app)/layout.tsx`、`src/features/home/home-page.tsx`、`src/features/travel/travel-memory-pages.tsx`。
- 兩份均注入同一 [合成 fixture](./qa-fixture.ts)，SHA-256 `5902ede29bed060bfda734ab5f17c8d9c3bf2ff3f82e6f839fa02ebea4d3434a`；三個 route 只在暫時 checkout 中以 fixture 呼叫原 renderer。共用 layout 的 session 在兩份均固定為公開模式，header JSX 仍為各自版本。兩份皆停用 Next 開發浮標；無 `.env`、資料庫或 Production 資料，`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`，瀏覽器封鎖非 `127.0.0.1` 請求。
- 同 route、資料、公開狀態及 viewport：`/`、`/travel/synthetic-editorial/day/day-03`、`/travel/synthetic-cinematic`；1440×1000、768×1024、390×844。以 [擷取腳本](./qa-capture.cjs) 捲到每張 lazy image、等待 decode，再逐段擷取可見畫面拼接。Chromium 單次 full-page 擷取曾漏繪 Editorial 的離屏照片，因此丟棄該批，兩側均採相同逐段方法。保存圖像轉為 WebP quality 86，尺寸完全一致。
- [BEFORE metrics](../../../output/playwright/issue114-before-metrics.json)／[AFTER metrics](../../../output/playwright/issue114-after-metrics.json) 記錄 route、viewport、H1、圖片、連結、focus、overflow、console。原頁面路由以 fixture 覆蓋，故本次不驗證連結目的頁的真實資料或權限。

暫時 checkout 的 fixture 接線相同：首頁 route 回傳 `<HomePageView {...portalProps} />`；Editorial day route 回傳 `<TravelMemoryDayPage view={editorialView} />`；Cinematic overview route 回傳 `<TravelMemoryOverviewPage memory={cinematicMemory} />`。兩側 layout 均以 `{ isFamilyMode: false, displayName: '' }` 取代 `getFamilySession()` 呼叫，其餘 layout JSX 維持各自版本；`next.config.mjs` 均設 `devIndicators: false`。這些注入只存在暫時 checkout，不是提交的 app source。

| 表面／viewport | BEFORE | AFTER |
| --- | --- | --- |
| Portal desktop | [圖](../../../output/playwright/issue114-before-portal-desktop.webp) | [圖](../../../output/playwright/issue114-after-portal-desktop.webp) |
| Portal tablet | [圖](../../../output/playwright/issue114-before-portal-tablet.webp) | [圖](../../../output/playwright/issue114-after-portal-tablet.webp) |
| Portal mobile | [圖](../../../output/playwright/issue114-before-portal-mobile.webp) | [圖](../../../output/playwright/issue114-after-portal-mobile.webp) |
| Editorial desktop | [圖](../../../output/playwright/issue114-before-editorial-desktop.webp) | [圖](../../../output/playwright/issue114-after-editorial-desktop.webp) |
| Editorial tablet | [圖](../../../output/playwright/issue114-before-editorial-tablet.webp) | [圖](../../../output/playwright/issue114-after-editorial-tablet.webp) |
| Editorial mobile | [圖](../../../output/playwright/issue114-before-editorial-mobile.webp) | [圖](../../../output/playwright/issue114-after-editorial-mobile.webp) |
| Cinematic desktop | [圖](../../../output/playwright/issue114-before-cinematic-desktop.webp) | [圖](../../../output/playwright/issue114-after-cinematic-desktop.webp) |
| Cinematic tablet | [圖](../../../output/playwright/issue114-before-cinematic-tablet.webp) | [圖](../../../output/playwright/issue114-after-cinematic-tablet.webp) |
| Cinematic mobile | [圖](../../../output/playwright/issue114-before-cinematic-mobile.webp) | [圖](../../../output/playwright/issue114-after-cinematic-mobile.webp) |

手機首個 Tab 的 [Portal 前](../../../output/playwright/issue114-before-portal-focus-mobile.webp)／[後](../../../output/playwright/issue114-after-portal-focus-mobile.webp)、[Editorial 前](../../../output/playwright/issue114-before-editorial-focus-mobile.webp)／[後](../../../output/playwright/issue114-after-editorial-focus-mobile.webp)、[Cinematic 前](../../../output/playwright/issue114-before-cinematic-focus-mobile.webp)／[後](../../../output/playwright/issue114-after-cinematic-focus-mobile.webp) 另有焦點截圖。

## Visual QA 與最小修正

| 面向 | BEFORE 發現 | AFTER／限制 |
| --- | --- | --- |
| 視覺層級 | Portal 的 H1→六個成員入口、Editorial 的日期→H1→moment／caption、Cinematic 的 hero→場次→影像卡皆清楚。Portal 六張毛玻璃卡重複強調容器。 | 保留三種內容順序；Portal 成員卡改為平實白色表面、輕陰影，沒有重排或重寫。Hero 上既有浮動玻璃標籤仍在，後續改版另議。 |
| 一致性／Skill routing | 共用 header 對三種 presentation 相同；舊焦點只用瀏覽器預設藍色 1px。 | 按 `redesign-existing-projects` 做既有頁 audit，依 `li-family-design-system` 與 `visual-qa` 選最小 scope，`shadcn-stack` 核對 Tailwind 3／現有組件；未啟動新頁 Creative Director／Showcase。Header 為金色 2px focus；portal 入口、Editorial 返回、Cinematic 影像卡按各自語氣加 2px focus。 |
| Responsive／影像 | 三面九組畫面均無水平 overflow；圖片 8/8、3/3、11/11 載入。中文標題、caption、章節順序和 crop 在三種 viewport 可讀。 | 同樣九組為 200、零 console/page error、零 overflow、圖片全數載入；前後截圖寬高逐組相同。重複的合成照片只是 fixture 限制，不能評真實照片編輯品質。 |
| Interaction | 主導覽、入口、返回及場次卡可聚焦；普通連結多為預設細焦點。Cinematic 卡片在 reduced-motion 下仍套用 700ms transition；hover 縮放 CSS 可覆蓋較早的 transform override。 | 實測 Portal 入口 1px→2px、Editorial 返回 1px→2px、Cinematic 影像卡 1px→2px。Cinematic reduced-motion hover 的 image `transform:none`、`transition-property:none`、`duration:0s`；一般模式保留既有 hover。Portal 卡片位移只在 motion-safe 下作用。連結目的頁未以 synthetic route 全面驗證。 |
| Accessibility | Portal header 首個 Tab：藍色 auto 1px。Editorial 小字 `#897d6e`／`#806f5d` 對紙色 `#f7f2e9` 約 3.61／4.33:1；Cinematic 黑底章節註記 `white/45` 約 4.43:1。圖片有 fixture alt，Editorial placement 有獨立可見 caption。 | Header 金色 solid 2px；Editorial 指定小字改 `#6f6254` 約 5.30:1；Cinematic 黑底章節註記改 `white/70` 約 10.02:1。這些是指定平面色的對比計算，不取代整站自動／人工無障礙稽核。Hero 圖上可變背景與未涉頁面未量測。 |

Generic-pattern 判準：在沒有內容理由時重複套用同一裝飾效果才計入；內容驅動的六個成員入口、八個 day card，以及 fixture 重複照片不計。Portal 成員卡的毛玻璃＋強 hover 陰影記 **1→0**；Hero 上既有浮動玻璃標籤記 **1→1**，未因本次小修全面重做。Editorial **0→0**；Cinematic **0→0**，深色場次與影像節奏有敘事用途。

Portal 空 travel 區的 `ImageFallback` 可見；Travel empty／error、登入後 Family 私密內容、連結目的頁與 Production 媒體未在本次 fixture matrix 驗證。這些結果不作為其 PASS 聲明。

## Context 與執行量測

| 載入項目 | 檔案 | `wc -c` bytes |
| --- | --- | ---: |
| Skill 入口 | `li-family-design-system` 1,111；`redesign-existing-projects` 1,258；`shadcn-stack` 1,396；`visual-qa` 1,417 | 5,182 |
| 治理文件 | `li-family-visual-system.md` 8,123；`skill-routing.md` 6,090 | 14,213 |
| 受影響 source | `layout.tsx` 3,259；`home-page.tsx` 17,152；`travel-memory-pages.tsx` 65,847 | 86,258 |
| Stack 核對檔 | `package.json`、`components.json`、`tailwind.config.ts`、`globals.css`、`button.tsx` | 15,214 |

Skill＋治理文件檔案大小合計 **19,395 bytes**；加上 source 與 stack 檔的全部大小上限為 **120,867 bytes**。程式碼實際只讀相關範圍；這些是檔案大小代理，並非模型 token 或精確工具輸出 bytes。未載入 Creative Director、Showcase、產圖、Tailwind migration reference。

可量測的保留證據：最終 BEFORE／AFTER 擷取各 1 次腳本、共 18 次 route visit、18 張完整圖＋6 張手機 focus 圖；另有 18 次局部 focus／motion 診斷 route visit。取證過程共有 BEFORE 4 次、AFTER 3 次擷取嘗試（修正 hydration、離屏截圖與開發浮標問題），UI 改動 4 回合。系統沒有可用的完整 agent tool-call／token telemetry，因此不報總 token 節省或虛構總 tool calls。

## 本地驗證與狀態

- 最後的 AFTER source 在無 `.env` 的合成 checkout 以 `next build` 完成；repository `tsc --noEmit` 通過；`git diff --check` 通過。`pnpm run build` 因此環境 pnpm 嘗試網路查 registry 並要求重建 symlinked `node_modules` 而中止，遂直接呼叫已安裝的 Next CLI；未安裝依賴或修改 node_modules。
- 實際 UI 變動僅三個 source 檔，無資料存取、schema、framework、Tailwind migration、Production 或 Preview 動作。這份報告只記錄本地 QA；分支推送及 PR 建立依使用者授權作為獨立 review delivery gate，未授權 merge。#114 代表性 UI 的同條件比較已完成；本地 fixture 對正式資料／完整使用者旅程的限制如上。
