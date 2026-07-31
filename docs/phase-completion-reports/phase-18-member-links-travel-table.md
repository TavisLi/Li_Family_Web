# Phase 18 Completion Report — 成員外部頁連結與旅行航班表格修正

日期：2026-07-30

## Status

`Implemented → Locally verified → PR ready`

Draft PR 已建立。Preview 專用 Payload secret 已補齊，但現有舊分支的 Preview `DATABASE_URI` 經驗證為無效 placeholder，已回滾本分支的複製設定；因此目前仍無可用 Preview database，無法完成 Vercel route QA。2026-07-31 依使用者指示改用免費方案：不建立 Supabase paid branch，改以一次性本機 PostgreSQL 補足 schema／seed dry-run 驗證。尚未進入 `Merged`、`Production verified` 或 `Closed`。Production migration、允生 record write、merge 與 Issue closeout 都需要後續 HITL。

## Scope

- Issue #68：讓 Family Lobby 成員卡片可由 Payload User record 選擇內建 Member profile 或外部頁面。
- Issue #69：修正重慶旅行頁 8 欄航班表的航空公司欄位被壓成逐字直排。
- 產生 nullable-only Users migration、regression tests 與 Phase 18 文件。

## Out of scope

- 未修改既有 Member profile 內容或其他 Users records。
- 未修改 Travel Plan published content、Markdown source 或 seed。
- 未執行 Production schema/content write、merge、deploy 或 Issue closeout。

## Branch／commit／PR

- Branch：`codex/phase-18-member-links-travel-table`
- Implementation commit：`9750e6e`
- Review fix／report commit：`bdd2842`
- PR：[Draft PR #71](https://github.com/TavisLi/Li_Family_Web/pull/71)
- Merge：N/A

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

## Browser QA

### Issue #69

- Desktop viewport 1280×720：表格寬 1238px，航空公司欄 173px、表頭高 41px，未逐字直排。
- Mobile viewport 390×844：表格寬 1024px、可視容器 348px、`overflow-x = auto`、航空公司欄 143px。

### Issue #68 deployment-order gate

Production schema 尚無 `users.external_profile_url`。本機新 runtime 連到現有資料庫讀取 Family Lobby 時，以 PostgreSQL `42703 column does not exist` 停止；因此 release 順序必須是：

1. H5 批准並執行 additive migration。
2. Deploy 同一 PR head。
3. H6 批准並只更新 `nini.externalProfileUrl`。
4. 回讀 record，再做 Family Lobby internal／external navigation QA。

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

## Known limitations／blockers

- Draft PR #71 已建立；Preview build READY，Payload secret 已補齊，但 project 目前沒有可供 Phase 18 使用的有效 Preview `DATABASE_URI`。
- 已依使用者要求改用免費方案；免費方案只能提供本地 DB/schema/seed dry-run 證據，不能讓 Vercel Preview 讀到本機 container。
- 尚未執行 Production migration。
- 尚未寫入允生外部 URL。
- Issue #68 因 schema 尚未 rollout，無法完成真實 Lobby browser QA。
- Issue #68／#69 尚不可 close。

## Rollback

- Runtime：回退至本 PR 前 deployment。
- Schema：若尚未寫入外部 URL，可執行 migration DOWN；若已有值，需先導出／確認欄位內容，再決定是否移除。
- Content：清空單筆 `nini.externalProfileUrl` 可立即恢復內建 `/member/nini` 導航。

## Issue closeout／next readiness

- Issue #68：Implemented；local schema／logic verified；Production migration、record write 與 browser QA pending。
- Issue #69：Implemented；local tests 與 responsive browser QA passed；Preview／Production verification pending。
- 下一步：若堅持零外部成本，本 Phase 可維持 Draft PR 並以本地驗證作為 PR evidence，但不能宣稱 Preview route QA completed。若要完成 Vercel Preview route QA，仍需指定一個有效、隔離、可由 Vercel 連線的 PostgreSQL database；不應沿用已證實無效的舊 placeholder，也不應未經獨立批准將 Preview 直接連到 Production database。之後再提交 H5／H6／H9／H10 evidence。
