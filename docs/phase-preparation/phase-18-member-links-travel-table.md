# Phase 18：成員外部頁連結與旅行航班表格修正

日期：2026-07-30
工作分支：`codex/phase-18-member-links-travel-table`

## Related Issues

- [Issue #68 — Member profile: Option for connecting to outside web page](https://github.com/TavisLi/Li_Family_Web/issues/68)
- [Issue #69 — Bug Fix: 旅遊頁面表格顯示異常](https://github.com/TavisLi/Li_Family_Web/issues/69)

## Problem statement

- Family Lobby 成員卡目前固定導向站內 `/member/[slug]`，無法讓單一成員卡改連既有外部作品頁。
- 重慶旅行頁的 8 欄航班表沿用一般欄寬規則，「航空公司」沒有獨立寬度，在桌面版被壓成逐字直排。

## Current architecture seam

- 成員資料由 Payload `users` collection 擁有，Family Lobby 由 `src/features/home/home-page.tsx` 渲染卡片。
- Travel planning Markdown 由 `src/features/travel/travel-source-sections.tsx` 統一解析並渲染表格；現有 wrapper 已提供小螢幕水平捲動。
- `content-source/` 只作版本化 seed input；本 Phase 不修改 published Travel Plan 內容。

## Proposed minimal design

- 在 `users` 新增 nullable `externalProfileUrl`，只接受 `http`／`https`。
- Family Lobby 只在該值存在時使用外部 URL、新分頁與安全 `rel`；否則保留站內路由。
- 只有「恰為 8 欄且含航空公司欄」的表格使用本次專用 `64rem` minimum width 與欄寬；其他 5／6／7／9 欄表格維持原規則。
- migration 僅新增 nullable column，不回填、不更新任何 Users record。

## Alternatives／tradeoffs

- 把外部 URL 寫死在前端：改動較少，但內容擁有權錯置，後續每次改網址都要重新部署，因此不採用。
- 將所有 8 欄以上表格一律加寬：實作簡單，但會改變其他旅行表格，超出 #69，因此不採用。
- 同分頁開啟外站：互動較直接，但家族網站狀態會被取代；依 Issue 需求採新分頁並清楚標示外部連結。

## Scope

1. 在 Payload `users` collection 新增 optional 外部成員頁 URL。
2. Family Lobby 成員卡片在 URL 留空時維持 `/member/[slug]`；有值時改連外部頁面，並使用外部連結語意。
3. 修正 8 欄航班表格的欄寬配置，避免「航空公司」在桌面版被壓成逐字直排。
4. 產生只新增 nullable 欄位的 additive migration，並為兩個 Issue 補 regression coverage。

## Out of scope

- 不修改既有 Member profile 內容或其他 Users records。
- 不修改 Travel Plan published content、Markdown source 或旅行 seed。
- 不執行 Production migration、Production Users write、merge 或 Issue closeout，除非通過對應 HITL。
- 不重構其他 Family Lobby 或 Travel UI。

## Acceptance criteria

### Issue #68

- Payload Admin 可為單一 User 設定合法的 `http`／`https` 外部成員頁 URL。
- 未設定 URL 的卡片仍連到 `/member/[slug]`。
- 已設定 URL 的卡片在新分頁開啟外部頁，並帶 `noopener noreferrer`。
- migration UP 只新增 `users.external_profile_url` nullable column；DOWN 只移除該 column。
- 經 H5／H6 批准並部署後，`nini` record 可回讀為 Issue 指定 URL。

### Issue #69

- 8 欄航班表的欄寬合計為 100%，「航空公司」取得明確欄寬。
- 桌面版航空公司名稱不再逐字直排。
- 小螢幕保留水平捲動，不壓縮成不可讀欄位。
- 既有 6／7 欄表格與 planning heading regression tests 維持通過。

## Verification

1. `pnpm run test:phase-18`
2. `pnpm exec payload generate:types`
3. 人工審查 migration TS／snapshot／index
4. `pnpm run build`
5. build 完成後執行 `pnpm tsc --noEmit`
6. `git diff --check`
7. 本機 browser QA：Family Lobby 內外部連結與重慶航班表桌面／手機 viewport
8. Preview／Production QA 另依 H9、H5、H6、H10 授權執行

## Browser／route QA matrix

| Route | Viewport／情境 | 驗收 |
| --- | --- | --- |
| `/` | Family Lobby，未設定外部 URL | 成員卡仍進入 `/member/[slug]` |
| `/` | Family Lobby，`nini` 已設定外部 URL | 新分頁開啟指定外站，具外部連結提示 |
| `/travel/202607-chongqing-yangtze-river` | Desktop 1280×720 | 航空公司不逐字直排 |
| 同上 | Mobile 390×844 | 表格水平捲動，欄位保持可讀 |
| 既有 5／9 欄航空公司表格 fixture | Static render | 不套用本次 8 欄專用規則 |

## Data／migration plan

1. 產生並人工審查 additive nullable migration。
2. 在 disposable PostgreSQL 先執行 UP／DOWN，確認 Users 筆數不變且無資料回填。
3. H5 批准後才可執行 Production migration，完成 schema read-back。
4. 部署同一 PR head。
5. H6 批准後只更新 `nini.externalProfileUrl`，再回讀單筆 record。

## Rollback

- Runtime：回退到本 PR 前 deployment。
- Content：清空 `nini.externalProfileUrl`，立即恢復 `/member/nini`。
- Schema：若欄位尚無資料可執行 DOWN；若已有資料，先導出並取得 destructive approval。

## Completion Report

完成證據記錄於 `docs/phase-completion-reports/phase-18-member-links-travel-table.md`。

## Stop conditions

- migration 出現 Users 欄位以外的 drop、rename、data rewrite 或既有資料 update。
- Production schema／Users inventory 與批准基線不同。
- 外部 URL 會使用非 `http`／`https` protocol。
- Preview／Production commit 與本次 PR head 不一致。
