# Phase 20 Completion Report — Travel Memory 三套正式 Renderers

日期：2026-08-14

狀態：PR ready／Preview verified；Merge、Production verified、Closed 尚未授權

## Scope／Out of scope

本 Phase 修正 Phase 19 將三種 presentation style 委派給同一套頁面 hierarchy、只替換主題 token 的視覺落差。Editorial journal、Cinematic timeline、Family scrapbook 現在各自擁有 Overview、Daily chapter、Photos 結構，仍消費同一組 style-neutral Memory／Day／Moment／Placement view models。

未修改 Payload schema、migration、資料投影、canonical route、access rule、Travel Plan 或 Production content／media。

## Branch／Commit／PR／Merge

- Issue：[#91](https://github.com/TavisLi/Li_Family_Web/issues/91)
- Parent：#73
- Branch：`codex/phase-20-travel-memory-renderers`
- Base：`origin/main` at `4ab53fe`
- Implementation commit：`855429b`（`fix(travel): restore distinct memory renderers (#91)`）
- Review-fix commit：`9a32557`（`fix(travel): skip empty cinematic hero media`）
- PR：[#92](https://github.com/TavisLi/Li_Family_Web/pull/92)（Draft）
- Preview deployment：`dpl_J7bLKeGyDevHkgDvTH6WWpxpcYzF`（Ready；renderer commit `6f1c30d`）
- Merge：未執行。

## Delivered work

- Editorial journal：全幅封面、非對稱章節索引、長文閱讀節奏、單圖完整內容寬度與 editorial figure caption。
- Cinematic timeline：全幅場景 lead、時間碼導覽、sticky daily timeline、film-like media sequence 與 contact sheet gallery。
- Family scrapbook：紙張紋理、家庭相簿層級、交錯／錯位照片、照片背記與照片信封 gallery。
- YouTube 保留在所屬 Moment；缺 URL 或全日無有效影片時顯示 style-specific 誠實空狀態。
- Gallery 不再以 media asset alt text 冒充 placement caption；caption 缺失時顯示明確的無說明狀態。
- Focused tests 鎖定三套 Overview／Day／Photos 的不同結構、caption／alt、Moment anchor、previous／next、YouTube、空狀態及 Hainan Day 8 fixture。

## Key files

- `src/features/travel/travel-memory-pages.tsx`
- `src/features/travel/travel-memory-pages.test.tsx`
- `output/playwright/phase20-*.png`

## Validation

| 驗證 | 結果 |
| --- | --- |
| `node --import tsx src/features/travel/travel-memory-pages.test.tsx`（Node 20.20.2） | Pass |
| `pnpm run build`（Node 20.20.2） | Pass |
| `pnpm tsc --noEmit` after build | Pass |
| `git diff --check`／`git diff --cached --check` | Pass |
| Standards＋specification review | Pass；3 個程式契約 finding 已修正 |
| Playwright local renderer QA | Day 3 desktop＋390px、Day 8 desktop＋390px；caption 可見；390px 無 horizontal overflow；0 console errors |
| Preview formal route QA | Day 3／Day 8 desktop 1440px＋mobile 390px；HTTP 200；caption、導覽、無影片狀態可見；無 horizontal overflow；0 console errors |
| `pnpm run test:phase-19` | Blocked by pre-existing stale Australia projection assertion：預期 6 個 unassigned videos、現況為 0；本 Phase 未修改該 projection／test |

瀏覽器證據：

- `output/playwright/phase20-editorial-day03-desktop.png`
- `output/playwright/phase20-cinematic-day08-desktop.png`
- `output/playwright/phase20-scrapbook-day03-desktop.png`
- `output/playwright/phase20-scrapbook-day03-mobile.png`
- `output/playwright/phase20-scrapbook-day08-mobile.png`
- `output/playwright/phase20-preview-day03-desktop.png`
- `output/playwright/phase20-preview-day03-mobile.png`
- `output/playwright/phase20-preview-day08-desktop.png`
- `output/playwright/phase20-preview-day08-mobile.png`

## Browser／Preview／Production QA

本地 QA route 使用 Hainan Day 3／Day 8 的實際 prototype fixture，直接 render 正式 `TravelMemoryDayPage` component；臨時 route 驗收後已刪除。Day 8 scrapbook 在 390px 的量測為 `innerWidth=390`、`scrollWidth=390`、2 個 captions，無影片空狀態可見。Editorial Day 3 單圖修正後 figure 與 Moment 同為 860px 寬。

經使用者批准，在 Phase 20 branch-scoped Preview 建立獨立 Preview secret，並連接既有 Hainan Preview Neon dataset。正式 `/travel/201307-hainan/day/day-03` 與 `day-08` route 均為 HTTP 200；Chrome authenticated Preview QA 覆蓋 1440×1000 與 390×844。四個 viewport 均渲染 `scrapbook-day`、兩個 placement captions、跨日導覽及誠實的無影片狀態；`scrollWidth` 等於 viewport width，console errors 為 0。

詳細 read-back 與限制見 `docs/phase-artifacts/travel-memory-multi-page/phase-20-renderer-preview-qa.md`。Production 未執行。

## Migration／Data／Read-back

- Schema／migration：N/A，未修改。
- Preview configuration：僅新增 Phase 20 branch-scoped `DATABASE_URI`、`PAYLOAD_SECRET`、`TRAVEL_MEMORY_MULTIPAGE_ENABLED`、`NEXT_PUBLIC_R2_PUBLIC_URL`、`NEXT_PUBLIC_SERVER_URL`；未將 secret 寫入 repository、log 或 QA artifact。
- Preview dataset read-back：Neon project `little-surf-04196525`、branch `br-royal-morning-afhkbilm`；`201307-hainan` 存在且 presentation style 為 `family-scrapbook`。
- Content／media write：未執行。
- Production read／write：未授權、未執行。
- Renderer identity：沿用既有 Memory／Day／Moment／Placement keys；focused SSR tests 已回讀 canonical links、anchors、captions 與 alt。

## Known limitations／Blockers

- Preview dataset 僅保留 Day 3／Day 8，因此前後導覽依 dataset 順序在兩日之間互連，不能驗證完整八日相鄰導覽。
- Preview dataset 沒有同步相片 binary；頁面使用既有圖片 fallback。Caption placement、alt、版面與空狀態已驗證，但實際 R2 相片視覺仍待具備媒體檔的環境驗收。
- Vercel build 提示 Node 20 將於 2026-10-01 停止支援；本次 build／runtime 未受影響，升級需另案處理。
- `test:phase-19` 的 Australia `unassignedVideos` 舊期望與現行 main source mapping 不一致，需另案更新 owning projection regression test。
- Merge／Production verification 未獲本次授權。

## Rollback

本 Phase 沒有 schema 或資料寫入。若需要撤回，依序 revert review-fix commit `9a32557` 與 implementation commit `855429b`；既有 routes、view models、Payload content 與 legacy fallback 不受影響。

## Issue closeout

- #91 維持 OPEN。
- Renderer implementation、Draft PR 與正式 Preview route QA 已完成；Preview 媒體 binary、merge 及 Production verification 未完成前不關閉 Issue。

## Next-phase readiness

下一個 HITL 節點是審閱 Draft PR #92 與正式 Preview 截圖，決定是否補齊 Preview 媒體 binary 或進入 merge 審批。Production read、write、merge 與 Issue closeout 仍是分開授權。

## Production closeout addendum（2026-08-21）

本節只追加後續狀態，不改寫 2026-08-14 Completion Report 當時的歷史事實。

- PR #92 已於 2026-08-16 合併；merge commit 為 `f17e162d67ba9181280a4291ffda32dada4d7bf5`。
- Vercel Production deployment `dpl_Ei6gZYoB5TUxGX87JxAgUFZv4HFg` 為 `READY／PROMOTED`，Production alias 為 `https://li-family-web.vercel.app`，Git source SHA 與 merge commit 完全一致。
- 經使用者批准的 Production read-only QA 已覆蓋 Hainan Day 3／Day 8 正式 route，各自於 1440×1000 與 390×844 驗收。
- 四個 viewport 均為 HTTP 200、`family-scrapbook／scrapbook-day`，placement captions 與 alt text 正確、相片 binary 實際載入、相鄰日導覽正確、無影片誠實空狀態可見、無 horizontal overflow、0 console errors。
- Canonical URL 均指向 Production alias；HTML 未出現 `NEXT_HTTP_ERROR_FALLBACK;404`。
- 沒有執行 Production schema、content、media 或 access write。
- Production 證據：`docs/phase-artifacts/travel-memory-multi-page/phase-20-production-qa.md`。
- Issue #91 已依使用者批准以 `completed` 關閉；Production QA 證據記錄於 [closeout comment](https://github.com/TavisLi/Li_Family_Web/issues/91#issuecomment-5360268023)。
- Closeout publication：branch `codex/docs-phase-20-production-closeout`，evidence commit `a692b18`，Draft PR [#93](https://github.com/TavisLi/Li_Family_Web/pull/93)。

本 addendum 完成後，Phase 20 lifecycle 為 `Implemented → Locally verified → PR ready → Merged → Production verified → Closed`。既有 `test:phase-19` Australia `unassignedVideos` stale assertion 仍屬獨立測試債務，不影響本 Phase renderer acceptance。
