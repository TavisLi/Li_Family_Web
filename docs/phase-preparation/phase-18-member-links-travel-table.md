# Phase 18：成員外部頁連結與旅行航班表格修正

日期：2026-07-30
工作分支：`codex/phase-18-member-links-travel-table`

## Related Issues

- [Issue #68 — Member profile: Option for connecting to outside web page](https://github.com/TavisLi/Li_Family_Web/issues/68)
- [Issue #69 — Bug Fix: 旅遊頁面表格顯示異常](https://github.com/TavisLi/Li_Family_Web/issues/69)

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

## Stop conditions

- migration 出現 Users 欄位以外的 drop、rename、data rewrite 或既有資料 update。
- Production schema／Users inventory 與批准基線不同。
- 外部 URL 會使用非 `http`／`https` protocol。
- Preview／Production commit 與本次 PR head 不一致。
