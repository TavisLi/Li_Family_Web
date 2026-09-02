# Phase 21 Preview 連線 Production DB 唯讀 QA 證據

- 日期：2026-09-01
- PR：[#103](https://github.com/TavisLi/Li_Family_Web/pull/103)
- Branch：`codex/phase-21-travel-memory-vnext`
- Initial PR head／deployment source：`d5873e2`
- Post-migration Browser QA deployment source：`6e6fbe0`
- Preview alias：`https://li-family-web-git-codex-phase-21-tra-8ea7ad-tavis-li-s-projects.vercel.app`

## Human approval 與界線

Human 已確認 Preview 將取得可能具有寫入權限的 Production `DATABASE_URI`，並批准只為 PR #103 唯讀 Browser QA 設定 branch-specific Preview 環境變數與重新部署。

允許：

- public route GET；
- rendered response 與 runtime log read-back；
- 指定 branch 的 Preview environment configuration 與 redeploy。

排除：

- Admin／登入提交；
- write API、seed 或其他資料 mutation；
- schema push／migration；
- Production environment 修改；
- merge。

## Branch-scoped Preview environment

下列名稱均限制在 `codex/phase-21-travel-memory-vnext` 的 Preview scope；證據不保存值：

- `DATABASE_URI`（sensitive）
- `PAYLOAD_SECRET`（sensitive）
- `NEXT_PUBLIC_R2_PUBLIC_URL`（sensitive）
- `NEXT_PUBLIC_SERVER_URL`
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED=true`
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`

`vercel env ls preview codex/phase-21-travel-memory-vnext` 已確認六個變數均為 branch-scoped。Production environment 未修改。

## Deployment 與唯讀驗證

第一次 Preview deployment `dpl_EaTPFiXUCtoEg5pjNbY4p4uhFAtA` 的 `/travel` 回傳 server error，Digest `1159229531`；runtime log 證明原因為缺少 Payload secret。

補齊 branch-scoped environment 後重新部署：

- Deployment：`dpl_CtUUbKms7DP1nSv1w2TLijJKJ4eh`
- 狀態：Vercel `READY`
- Source commit：`d5873e2`
- `/travel` transport status：HTTP `200`
- Render 結果：**BLOCKED**，RSC 內含 server error Digest `91166848`

Runtime log 的根因為 PostgreSQL `42703`：

```text
column travel_memories_storySections.role does not exist
```

這證明 Preview 已取得必要 runtime secret 與 database connection，但 Phase 21 code 會查詢尚未套用至 Production schema 的 `storySections.role`。HTTP `200` 只代表 RSC transport 成功，不能視為頁面 render PASS。

## 結論與 data effect

- Preview Browser QA：**BLOCKED_AT_SCHEMA_GATE**。
- Production schema／data effect：`0`。
- 未開啟 Admin、未呼叫 write API、未執行 seed／migration／schema push。
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false` 保持生效。
- 不得為解除此 blocker 自動執行 Production migration；下一步必須回到 H5，先完成 disposable database rehearsal、migration approval package 與獨立 Human approval。
- Branch-scoped Production credential 目前保留給尚未完成的 PR #103 QA；PR merge、放棄或不再需要時，依 closeout gate 移除並 read-back scope。

## 2026-09-02 post-migration GET-only Browser re-QA

Human 明確批准使用已登入的 Chrome Vercel session，只對 PR #103 exact Preview URL 執行 GET-only Browser QA；允許導航經過 Vercel authentication surface，但不開 Admin、不呼叫寫入 API、不修改環境變數、資料或 schema，也不 merge。

檢查結果：**PARTIAL PASS／BLOCKED_AT_TRUE_DATA_OVERVIEW_PRESENTATION**。

已通過：

- exact `/travel` 可完整 render，title 為 `Travel | Web Li`，不再出現 `Application error`、server-side exception 或 Digest；console errors `0`，無水平溢位。
- 索引正確分類 `202602-thailand-phuket` 為「旅行回憶」、`202702-thailand-phuket` 為「規劃中」；另列出 `202308-east-australia` 與 `201307-hainan` 兩筆 Memory。
- `202308-east-australia/day/day-02` Daily renderer 完整 render，包含 9 個內容 heading、25 張 main image；無 raw Markdown marker、console error 或水平溢位。
- `202308-east-australia/photos` Contact Sheet 完整 render，顯示 `164 FRAMES`、分頁與篩選；首屏 lazy-load 後有 12 張 main image、69 個 main link；無 console error 或水平溢位。
- 三筆 Memory overview 都已解除先前 PostgreSQL `42703` schema blocker，能完成 server render。

阻擋項：

- `202602-thailand-phuket`、`202308-east-australia`、`201307-hainan` 三筆 true-data overview 的補充內容仍把 Markdown table、`**bold**`、list marker、blockquote marker 與 `__SECTION_BOUNDARY__` 顯示成純文字。
- 因此 schema/runtime recovery 已 PASS，但 #94／#95／#100 所需的 true-data overview presentation 尚不能宣告 PASS；不得以 Daily／Photos PASS 或 HTTP 200 代替。

本輪 data／schema／environment effect 為 `0`。未開啟 Admin、未提交表單、未呼叫 write API、未修改 Preview／Production environment、未執行 migration／seed／content 或 media write、未 merge。

## 2026-09-02 renderer fix re-QA closeout

`BLOCKED_AT_TRUE_DATA_OVERVIEW_PRESENTATION` 已由 renderer-only commit `37ad364` 解除。根因是 `MemoryOverviewArchive` 直接輸出儲存的 Markdown text，且未使用既有 boundary guard；不是 Production content 或 view model 遺失。

新 Preview deployment `dpl_DMS7V1LY1ZWsYVM5b1LvWKTokWJr` 已鎖定 `37ad364` 並為 `READY`。三筆 Memory × desktop/mobile 共六組 GET-only Chrome QA 全部 PASS，semantic table／strong／blockquote 可見、raw Markdown 與 boundary marker 均不存在、console errors 0、無頁面或 table wrapper 越界。完整矩陣與修復證據見 `phase-21-overview-markdown-fix.md`。

此 closeout 只代表 PR #103 Preview 的 Overview Markdown presentation PASS；不推導 merge、Production deployment、Production content mutation 或 Issue closeout。
