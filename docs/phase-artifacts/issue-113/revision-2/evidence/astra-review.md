# Revision 2 Astra review

日期：2026-09-20。結論：**ACCEPT WITH FOLLOW-UP**，限本地治理文字實作；不是行為驗收或發布批准。

## 確認結果

- 四個 active governance surfaces 的 SHA-256 均等於批准的 `revision-2/checks.json` candidate hashes；candidate.patch 本身 hash 亦相符。
- 審讀 core 與 semantic-preservation map：獨立 authority、有效批准重用、dirty boundary、Public/Family、secret、Base/Source/Current、migration human review/rehearsal/read-back、UNKNOWN 與 #105 owner 保留。取消強制預讀是已批准的刻意變更，未發現 Terra 額外改寫治理語意。
- 將測試的 evidence 輸出位置改至 `/tmp` 後獨立重跑，8/8 PASS；原 receipt/results 未覆寫。Node v26.5.0，僅代表離線腳本執行，非 canonical Node 24 應用驗證。
- 獨立核對 Slice 3 workspace-before 的 1,345 個 snapshot entries，排除本輪五個明確允許修改的檔案，其餘零 mismatch。此快照不能涵蓋建立後新增的所有 Slice 3 artifacts。
- `git diff --check` PASS；staging 為空。HEAD e20bf82f489634112a2c569b5ce5e0ba06616b81，branch codex/docs-113-governance-slice2。

## 必要 follow-up：保全測試存在盲點

`src/scripts/agent-governance.test.ts` 的「historical evidence is not rewritten」僅檢查 `git diff --name-only`。Slice 1–3 artifacts 目前 untracked，因此修改它們也不會出現在該輸出，測試仍可能 PASS。這是測試證據不足，未發現實際歷史檔案被改寫。

建議有限修正：將 symlink 與 historical-preservation 分成兩項；使用可取得的既有 hash baseline 驗證受保護檔案，明列覆蓋數與未涵蓋檔案。不得把現在才建立的 baseline 當作過去未變的證明。以臨時 fixture 驗證「untracked 歷史檔案被改動」會被偵測，不修改真實歷史證據。只有 git diff 的檢查不得再稱為歷史保全證明。

另建議在新 receipt 列入測試腳本的 SHA-256，以識別產生結果的確切程式。這是證據補強，不需要重寫治理 core 或新增通用 runner。

## 邊界與下一步

本次未修改 active governance、測試程式、Terra receipt 或歷史證據；只新增本 review。沒有 Production／外部操作、stage、commit、模型 benchmark。

先補上述有限測試缺口，再以新的 receipt 記錄結果。行為驗收仍未執行：F-UI canary，通過後才進 F-DATA/F-SENSITIVE，最多三個新受測 runs；須另獲執行批准。靜態 bytes 不代表 token savings，且既有一次樣本不能作同環境 causal control。
