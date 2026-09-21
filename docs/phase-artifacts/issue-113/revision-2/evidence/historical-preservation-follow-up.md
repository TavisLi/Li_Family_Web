# #113 Revision 2 historical-preservation follow-up

日期：2026-09-20

## 修正內容

`src/scripts/agent-governance.test.ts` 不再以 `git diff --name-only` 當成 Slice 1–3 untracked evidence 的保全證明。該檢查保留給一般 diff scope；歷史 artifacts 改以既有的 `docs/phase-artifacts/issue-113/slice-3/workspace-before.json` hash baseline 驗證。

- 測試程式 SHA-256：`599f66329f3919becf6d175b0751df0aa60dae3940223a7dd6f6378e01a6fa70`
- baseline 是本次 follow-up 前已存在的 historical artifact；未建立新 baseline 來回推過去未變。
- 實際 hash 比對：20/20 covered files PASS。
- Sensitivity probe：以同一個已涵蓋、untracked 的 historical file 注入錯誤 SHA-256；assertion 如預期失敗。probe 不寫入或修改任何真實 historical evidence。

## 明確 coverage

| Root | Existing baseline covered | Existing baseline not covered |
| --- | ---: | ---: |
| `slice-1` | 12 | 0 |
| `slice-2` | 8 | 0 |
| `slice-3` | 0 | 87 |

Slice 3 的 87 個 artifacts 都在該 workspace snapshot 之後建立或未被它收錄，因此沒有可用的「既有 hash baseline」可驗證其歷史內容。完整清單保存在 `structural-results-follow-up.json` 的 `historicalEvidence.coverageByRoot` 與 `uncoveredFiles`；本 follow-up 只報告這個限制，沒有將當前 hashes 追認為歷史基線。

## 命令與結果

| Command | Result |
| --- | --- |
| `node src/scripts/agent-governance.test.ts` | PASS，10/10 checks |
| `git diff --check` | PASS |
| `git diff --cached --name-only` | PASS；空輸出 |

本輪沒有修改四個 active governance surface、Slice 1–3 historical evidence、Skills、CONTEXT、ADR 或 global settings；未執行 benchmark、canary、Production 或外部操作。
