# Phase 21 Preview 連線 Production DB 唯讀 QA 證據

- 日期：2026-09-01
- PR：[#103](https://github.com/TavisLi/Li_Family_Web/pull/103)
- Branch：`codex/phase-21-travel-memory-vnext`
- PR head／deployment source：`d5873e2`
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
