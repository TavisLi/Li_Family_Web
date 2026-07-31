# Phase 18 Completion Report — 成員外部頁連結與旅行航班表格修正

日期：2026-07-30
Production closeout：2026-07-31

## Status

`Implemented → Locally verified → PR ready → Merged → Production verified → Closed`

PR #71 已合併並由 Vercel Production 部署完成。Production schema migration 已套用並 read-back；`nini.externalProfileUrl` 已依 Issue #68 寫入指定外部頁面並回讀確認。首頁與重慶旅行頁正式網域 smoke test 通過；航班表格已用 Production Playwright desktop/mobile 量測確認。Preview 專用 Payload secret 已補齊，但本分支沒有有效 Preview `DATABASE_URI`；2026-07-31 依使用者指示改用免費方案，不建立 Supabase paid branch，改以一次性本機 PostgreSQL 補足 schema／seed dry-run 驗證。

## Scope

- Issue #68：讓 Family Lobby 成員卡片可由 Payload User record 選擇內建 Member profile 或外部頁面。
- Issue #69：修正重慶旅行頁 8 欄航班表的航空公司欄位被壓成逐字直排。
- 產生 nullable-only Users migration、regression tests 與 Phase 18 文件。

## Out of scope

- 未修改既有 Member profile 內容或其他 Users records。
- 未修改 Travel Plan published content、Markdown source 或 seed。
- 未建立 Supabase paid Preview branch。

## Branch／commit／PR

- Branch：`codex/phase-18-member-links-travel-table`
- Implementation commit：`9750e6e`
- Review fix／report commit：`bdd2842`
- PR：[PR #71](https://github.com/TavisLi/Li_Family_Web/pull/71)
- Merge commit：`f50821c0bf3a90aa159069407cb9f9d72ff2dcf0`
- Production deployment：`dpl_D4XrRuxPZznQWksjJSnWivAdxqrA`，Vercel `READY`

## Delivered work

### Issue #68

- `users.externalProfileUrl` 為 optional、非 localized 的 text field。
- validator 只接受合法 `http`／`https` URL。
- URL 留空時卡片維持 `/member/[slug]`。
- URL 有值時卡片使用外部 URL、`target="_blank"`、`rel="noopener noreferrer"`、外部連結 icon 與 screen-reader 說明。
- Payload types 與 migration snapshot 已重新產生。

### Issue #69

- 8 欄航班表使用 `64rem` minimum width。
- 航班表 8 個欄位取得合計 100% 的專用欄寬；航空公司欄為 14%。
- 專用規則只在「恰為 8 欄且含航空公司欄」時啟用；既有 5／6／7／9 欄表格規則不變。
- 小 viewport 仍由原有 `overflow-x-auto` 提供水平捲動。

## Key files

- `src/payload/collections/Users.ts`
- `src/features/home/member-portal-link.ts`
- `src/features/home/home-page.tsx`
- `src/features/travel/travel-source-sections.tsx`
- `src/migrations/20260730_140837_phase_18_member_external_profile_url.ts`
- `src/migrations/20260730_140837_phase_18_member_external_profile_url.json`
- `docs/phase-preparation/phase-18-member-links-travel-table.md`

## Validation

- `pnpm run test:phase-18`：通過。
- `pnpm run test:phase-17`：通過。
- `pnpm exec payload generate:types`（Node 20.20.2）：通過。
- `pnpm run build`（Node 20.20.2）：通過。
- build 完成後 `pnpm tsc --noEmit`（Node 20.20.2）：通過。
- `git diff --check`：通過。
- credential pattern scan：未找到疑似 secret。
- 免費替代驗證（2026-07-31）：一次性本機 PostgreSQL 17 container 上以 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true` 建立目前 schema，read-back 確認 `users.external_profile_url` 存在且 `is_nullable = YES`。
- 免費替代驗證（2026-07-31）：同一一次性 DB 執行 `pnpm run seed:travel:dry-run`，結果為 creates 756、updates 0、conflicts 0、deletes 0，刪除風險說明為 seed workflow 不實作 delete。
- Production smoke（2026-07-31）：`GET /` 與 `GET /travel/202607-chongqing-yangtze-river` 正式網域皆為 HTTP 200。
- Production browser QA（2026-07-31）：Playwright desktop 1280×720 與 mobile 390×844 量測通過。

## Independent review

- Standards review 找到原實作會影響其他 5／9 欄航空公司表格，已收斂到指定 8 欄 shape，並新增非目標表格回歸測試。
- Standards review 指出 Phase preparation 缺少必要欄位，已補齊 problem、architecture seam、minimal design、tradeoffs、QA matrix、migration、rollback 與 Completion Report path。
- Spec review 確認 Issue #68 的 Production record write／read-back 尚未完成；本報告維持 pending，不宣稱 Issue ready。
- 單次使用的 link resolver 保留為可測試的安全語意 seam，集中外部連結的 `target`／`rel` 契約，未擴展為通用抽象。

## Migration rehearsal／data

Payload 自動產生的第一版 migration 同時帶入 Phase 17 cleanup drift，包含多個未批准 `DROP TABLE`；依 stop condition 未執行，並人工收斂成：

- UP：只新增 nullable `users.external_profile_url varchar`。
- DOWN：只移除 `users.external_profile_url`。

Disposable PostgreSQL 17 rehearsal：

- 建立 2 筆假 Users records。
- UP 後 Users 仍為 2 筆，新欄位 `is_nullable = YES`、populated count = 0。
- DOWN 後 Users 仍為 2 筆，新欄位 count = 0。
- 臨時 container 已停止並自動移除。

Production migration（2026-07-31）：

- Preflight read-back：`external_profile_url` column count = 0、`nini` user count = 1、Phase 18 migration count = 0、Users count = 9。
- 以 Supabase migration transaction 新增 `public.users.external_profile_url varchar`，並補 `payload_migrations.name = 20260730_140837_phase_18_member_external_profile_url`，避免後續 Payload migration runner 重跑撞欄位。
- Post-migration read-back：`external_profile_url is_nullable = YES`、Phase 18 migration count = 1、Users count = 9、populated external URL count = 0。

Production content write（2026-07-31）：

- 只更新 `slug = 'nini'` 的 `external_profile_url` 為 `https://cancan-lierixia-novel.mjdhdsbcn8.chatgpt.site/zh-Hans`。
- Read-back：`nini_target_url_count = 1`、`populated_external_profile_url_count = 1`、Users count = 9。

## Browser QA

### Issue #69

- Desktop viewport 1280×720：表格寬 1238px，航空公司欄 173px、表頭高 41px，未逐字直排。
- Mobile viewport 390×844：表格寬 1024px、可視容器 348px、`overflow-x = auto`、航空公司欄 143px。

### Issue #68 deployment-order gate

Production schema rollout 已完成。原先 gate 是：

1. H5 批准並執行 additive migration。
2. Deploy 同一 PR head。
3. H6 批准並只更新 `nini.externalProfileUrl`。
4. 回讀 record，再做 Family Lobby internal／external navigation QA。

以上 4 步已於 2026-07-31 完成。

### Vercel Preview

- Implementation head 的 deployment `dpl_9svnXnNvoy5vUjyTwvB9vyZZkUxY` 為 `READY`，deployed commit 為 `bdd28422ba77261bb63097ba8d06ad3b5586dcab`。
- 初次受保護 Preview 的 `GET /travel/202607-chongqing-yangtze-river` 回傳 HTTP 500，runtime log 為 `missing secret key. A secret key is needed to secure Payload.`。
- 經使用者批准後，新增只適用 `codex/phase-18-member-links-travel-table` 的 sensitive Preview `PAYLOAD_SECRET`；未讀取或修改 Production secret。
- 驗證時的 redeployment `dpl_8dUoDm8EB3eEur3ZqyEhKXeTBf5V` 為 `READY`，deployed commit 為 `79e9a808fe1925610adcf5a1f7ce24bb8b43c2bc`。
- Payload secret 錯誤已消失；同一旅行 route 仍回 HTTP 500，runtime log 顯示 `DATABASE_URI` 回退至 `127.0.0.1:5432` 並 `ECONNREFUSED`。現有 Preview `DATABASE_URI` 只綁定舊分支 `codex/phase-15-v1-5`，未授權擴大到本分支。
- 2026-07-31 經使用者批准後，以不輸出連線字串的方式，將舊 Phase 15 Preview `DATABASE_URI` 暫時複製到 Phase 18 branch scope。
- Redeployment `dpl_E6Xi5oCHWpjsoNZx5qJ7uYBceeSz` 為 `READY`，deployed commit 為 `f40052215a3601d51c5bc637ae31582f8d5d6f2e`；旅行 route 仍回 HTTP 500，runtime log 改為 `getaddrinfo ENOTFOUND base`，證實來源值本身是不可用 placeholder，而非真實 database connection。
- 依 rollback 原則，已只移除新加的 Phase 18 `DATABASE_URI` 並回查確認；舊 Phase 15 與 Production env 未修改。所有暫存明文 env／OIDC 檔案已永久刪除。
- 因此 Preview route QA 仍停在 database connection 邊界；不能把 build／deployment READY 視為功能通過。

### Free Preview alternative

- 取消建立 Supabase Branch；未呼叫 paid branch `confirm_cost` 或 `create_branch`，因此沒有新增每小時費用。
- 使用一次性本機 PostgreSQL 17 container 作為免費替代驗證環境，只驗證 schema 與 seed dry-run，不連到 Production 或 Supabase Preview。
- `payload migrate:status` 在本機 DB 顯示 Payload CLI 會掃描 `src/migrations` 全目錄，包含 Phase 17 destructive cleanup 檔 `20260719_025401`；基於 stop condition，未對一次性 DB 執行全量 `payload migrate`。
- 改以 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true` 在一次性 DB 建立目前 schema；read-back 顯示 `users.external_profile_url` 欄位存在且 nullable。
- `pnpm run seed:travel:dry-run` 在一次性 DB 上完成主要輸出：creates 756、updates 0、conflicts 0、deletes 0。
- 實際 `pnpm run seed:travel` 因全量 media 建檔進度過慢，僅寫入 11 筆 media、尚未建立 travel plan，即停止；此結果不作為 route QA 通過證據。
- 一次性 container 僅供本機驗證，完成後可停止移除；它不能替代 Vercel Preview 的遠端 `DATABASE_URI`，因此 Preview route QA blocker 仍存在。

### Production QA

- Vercel Production deployment `dpl_D4XrRuxPZznQWksjJSnWivAdxqrA` 為 `READY`，由 merge commit `f50821c0bf3a90aa159069407cb9f9d72ff2dcf0` 觸發。
- `https://li-family-web.vercel.app/`：HTTP 200，首頁 HTML 輸出 Nini 外部連結、`target="_blank"`、`rel="noopener noreferrer"`、外部連結 icon 與 screen-reader 文案。
- `https://li-family-web.vercel.app/travel/202607-chongqing-yangtze-river`：HTTP 200。
- Desktop 1280×720：航班表 `tableClass = min-w-[64rem] ... table-fixed`，table width 1238px、航空公司欄 173px、表頭高 41px。
- Mobile 390×844：wrapper client width 348px、scroll width 1024px、`overflow-x = auto`、has horizontal scroll = true、航空公司欄 143px。

## Known limitations／blockers

- Preview branch 仍沒有有效、隔離、可由 Vercel 連線的 `DATABASE_URI`；本次依使用者要求改用免費替代驗證，未建立 Supabase paid branch。
- Preview route QA 仍不可宣稱完成；Production route QA 已完成。

## Rollback

- Runtime：回退至本 PR 前 deployment。
- Schema：目前已有 `nini.externalProfileUrl` 資料；若需移除欄位，需先導出／確認欄位內容，再決定是否執行 DOWN。
- Content：清空單筆 `nini.externalProfileUrl` 可立即恢復內建 `/member/nini` 導航。

## Issue closeout／next readiness

- Issue #68：Production verified；可 close。
- Issue #69：Production verified；可 close。
- Phase 18：Closed。若未來需要恢復 Preview route QA，仍需指定一個有效、隔離、可由 Vercel 連線的 PostgreSQL database；不應沿用已證實無效的舊 placeholder，也不應未經獨立批准將 Preview 直接連到 Production database。
