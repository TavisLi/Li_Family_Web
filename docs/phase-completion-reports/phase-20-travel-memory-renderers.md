# Phase 20 Completion Report — Travel Memory 三套正式 Renderers

日期：2026-08-14

狀態：Implemented／Locally verified；PR、Merge、Production verified、Closed 尚未授權

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
- PR：未建立；使用者尚未批准 push／PR。
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
| Standards＋specification review | 3 個程式契約 finding 已修正；正式 route QA 缺口保留如下 |
| Playwright local renderer QA | Day 3 desktop＋390px、Day 8 desktop＋390px；caption 可見；390px 無 horizontal overflow；0 console errors |
| `pnpm run test:phase-19` | Blocked by pre-existing stale Australia projection assertion：預期 6 個 unassigned videos、現況為 0；本 Phase 未修改該 projection／test |

瀏覽器證據：

- `output/playwright/phase20-editorial-day03-desktop.png`
- `output/playwright/phase20-cinematic-day08-desktop.png`
- `output/playwright/phase20-scrapbook-day03-desktop.png`
- `output/playwright/phase20-scrapbook-day03-mobile.png`
- `output/playwright/phase20-scrapbook-day08-mobile.png`

## Browser／Preview／Production QA

本地 QA route 使用 Hainan Day 3／Day 8 的實際 prototype fixture，直接 render 正式 `TravelMemoryDayPage` component；臨時 route 驗收後已刪除。Day 8 scrapbook 在 390px 的量測為 `innerWidth=390`、`scrollWidth=390`、2 個 captions，無影片空狀態可見。Editorial Day 3 單圖修正後 figure 與 Moment 同為 860px 寬。

因目前 worktree 沒有可用的本地 Payload database／secret，而 Production read 未獲授權，本輪沒有把正式 `/travel/201307-hainan/day/day-03` 與 `day-08` route 接上 published Payload 做最終 browser QA；Preview／Production 均未執行。

## Migration／Data／Read-back

- Schema／migration：N/A，未修改。
- Content／media write：未執行。
- Production read／write：未授權、未執行。
- Renderer identity：沿用既有 Memory／Day／Moment／Placement keys；focused SSR tests 已回讀 canonical links、anchors、captions 與 alt。

## Known limitations／Blockers

- Issue #91 的正式 Hainan route browser acceptance 尚需具有對應 Payload dataset 的 Preview 或明確批准的 Production read-only QA；本地 fixture QA 不能取代該項證據。
- `test:phase-19` 的 Australia `unassignedVideos` 舊期望與現行 main source mapping 不一致，需另案更新 owning projection regression test。
- PR／Preview／Merge／Production verification 均未獲本次授權。

## Rollback

本 Phase 沒有 schema 或資料寫入。若需要撤回，依序 revert review-fix commit `9a32557` 與 implementation commit `855429b`；既有 routes、view models、Payload content 與 legacy fallback 不受影響。

## Issue closeout

- #91 維持 OPEN。
- 本地 renderer implementation 與 component-level QA 已完成；正式 route QA、PR、merge 及 Production verification 未完成前不關閉 Issue。

## Next-phase readiness

下一個 HITL 節點是批准 push／Draft PR，並在具有 Hainan Payload dataset 的 Preview 執行正式 Day 3／Day 8 route browser QA。Production read、write、merge 與 Issue closeout 仍是分開授權。
