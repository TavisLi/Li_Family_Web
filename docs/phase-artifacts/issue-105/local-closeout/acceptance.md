# Issue #105 — local closeout acceptance review

基線：已接受的 Slices 1–3（`2e89f3a04`）。本輪只使用 Node 24.21.0 與 loopback `127.0.0.1:55444/issue105` 上的 disposable PostgreSQL 17、合成資料及本地檔案。沒有使用 #101 私有備份、Preview、Production 或外部 Human approval source。以下編號沿用前次 Issue-wide acceptance 稽核；`PASS` 只代表欄內列出的驗證範圍。

| # | Acceptance criterion | 狀態 | 證據及界線 |
| --- | --- | --- | --- |
| 1 | 單次執行 manifest、實際 artifact bytes 與授權範圍 | PASS | [Slice 1 契約](../slice-1-run-contract.md)、`run-contract.test.mjs`；每個本地 run 的 manifest 仍通過實際 byte hash 驗證。 |
| 2 | 同一入口的正常與故障矩陣 | PASS | [12 次實際 session](./runs/matrix.json) 均經 `run-local-session.mjs` → `run-local-rehearsal.mjs` → 同一 `executeRun`/SQL plan；每次重建同一合成 fixture，包含 warning、silent exit、delay、oversize、cancel、disconnect、rollback、commit acknowledgment、signal、deadline、long wait。每次都核對 terminal、receipt、current-state，故障沒有變成 PASS。 |
| 3 | Sequential、keyset、row/byte/query/round-trip/deadline bounded I/O | PASS | [Slice 2 rehearsal](../slice-2-rehearsal.md)、`run-executor.test.mjs`、`run-executor.pg.test.mjs`；本輪矩陣沿用同一 executor。 |
| 4 | Optimized snapshot 與獨立 reference 完整 scope 對照 | PASS | [獨立全表與 catalog ID 掃描](./scope-parity.json)、`run-local-scope-parity.pg.test.mjs` 8/8；新增 target、path 移動、protected/canonical 內容、index/grant drift 後再恢復 baseline。此項僅證明合成 disposable fixture。 |
| 5 | #101 真實私有備份的全量 restore 與非目標資料保護 | OPEN | 私有備份未使用。本地合成 fixture 無法證明真實資料完整性。需另行授權隔離環境匯入該備份，對全量 row/catalog scope 執行 preflight、apply、restore 與獨立 read-back；不連 Production。 |
| 6 | Bootstrap、signal、deadline 及每種終止結果有 receipt/current-state | PASS | [矩陣](./runs/matrix.json) 的 `silent-exit`、`signal`、`deadline`、`rollback-failure`、`commit-ack-loss`；`run-local-session.test.mjs` 2/2 特別驗證 parent 在 malformed manifest 與缺少 bound input 時仍寫出 receipt、terminal、ledger/current-state。 |
| 7 | Agent 等同一 live session，無空輪詢 | PASS | [本輪實際工具觀察](./agent-wait.json)：36,353 ms 的 long-wait run，兩次有內容的 shell session 呼叫，0 empty polls；不是模擬計數。 |
| 8 | Ledger、單一 current-state、終止 UNKNOWN 不隱藏 | PASS | [Slice 1 契約](../slice-1-run-contract.md)、`run-contract.test.mjs`、[矩陣各 run](./runs/matrix.json)。 |
| 9 | Approval reuse/invalidation 與有限 read retry | PASS | `run-local-approval.test.mjs`、[同一實際 normal manifest 的本地 replay](./efficiency.json)：source callback 確認後同一決策可重用；manifest/target/scope/期限/revocation mismatch 阻擋；manifest byte hash 綁定的 policy 最多一次 transient read retry；mutation、UNKNOWN、超額重試阻擋。approval 是明示的 **test-only fixture**，沒有宣稱實際 Human 批准。 |
| 10 | Exact Preview deployment/commit/auth entry 的 QA 證據 | OPEN | [Slice 3 contract](../slice-3-review.md) 只有 mock 驗證。需另行授權指定 Preview deployment 與身份入口，實際擷取路由、desktop/mobile、console 和 data/schema fingerprints。 |
| 11 | 真實 Browser GET-only method 證據 | OPEN | 本輪沒有 Preview/Browser 存取。需與 #10 同一次獨立授權的 Preview QA，以 request guard 記錄真實 method/path，驗證 0 blocked requests。 |
| 12 | 完整實際 replay 指標 | PASS | [同一批 12 個真實 run 的測量](./efficiency.json) 含每情境 status/code、run elapsed、兩個 CLI 的 stdout bytes/elapsed/tool calls/empty polls；[agent wait](./agent-wait.json) 是另外觀察到的 live wait。沒有 token telemetry，故只宣稱 byte reduction，**不宣稱 token 節省**。Approval 指標明列 1 個 test fixture、0 Human rounds、0 repeated requests；不能推論真實 Human 流程速度。 |
| 13 | 同輸入 verbose/compact 實測比較且保留 failure state | PASS | [實際 CLI 捕捉](./efficiency.json)：每個已記錄 run 同時由 `run-local-verbose.mjs` 與 `run-agent-summary.mjs` 讀取；12/12 status/code 一致，236,537 → 3,632 stdout bytes，縮減 98.46%；故障仍是 BLOCK/UNKNOWN。verbose 是本地全 artifact formatter，並非 #101 歷史執行。 |

## Verification

- Node 24.21.0 focused tests：`run-contract`、`run-executor`、`run-executor-terminal`、`run-agent-summary`、`run-local-approval`、`run-local-session`，22/22 PASS。
- `run-local-closeout-evidence.test.mjs`：2/2 PASS；逐一重讀 12 個 manifest 的實際 bytes、terminal/receipt/current-state 與比較報告。
- Disposable PostgreSQL tests 分開執行：原 `run-executor.pg.test.mjs` 14/14 PASS；獨立 `run-local-scope-parity.pg.test.mjs` 8/8 PASS。兩套測試共享且會修改同一 fixture，不能平行跑；平行嘗試造成一次正常情境互相干擾，順序重跑全部通過。
- [12 情境最終矩陣](./runs/matrix.json)：3 PASS、3 BLOCK、6 UNKNOWN；每次重建與 bound backup 相同的合成 fixture，沒有自動 mutation retry。`run-local-closeout-evidence.test.mjs` 可重新驗證已保存的結果。

這是本地審查提交，**不是** #5、#10、#11 的放行、Production 操作授權、merge 或 Issue closure。後三項各須按上表另行授權與核對；本輪在此停下等待 Human review。
