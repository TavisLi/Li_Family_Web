# #113 Revision 2 — candidate review package

**DRAFT ONLY：只批准產出候選，未批准套用。** 本包不修改 active governance、Skills、CONTEXT、ADR、historical evidence 或任何 global settings。沒有新 model run、Production／外部操作、stage、commit 或 branch switch。

## 可逐字審查的交付

| 檔案 | 用途 |
| --- | --- |
| [draft-core.txt](./draft-core.txt) | 完整 AGENTS 替代候選，沒有需剝除的標頭 |
| [draft-routing.txt](./draft-routing.txt) | 完整可選 owner 索引，取代 mandatory routing |
| [draft-claude.txt](./draft-claude.txt) | 完整 Claude entry，取消共同預讀入口 |
| [draft-playbook-edits.txt](./draft-playbook-edits.txt) | 四個精確文字替換規格：適用性、H1、preflight、validation；不是直接 git apply 的 patch |
| [candidate.patch](./candidate.patch) | 腳本從上述候選產生的四檔 unified diff；只驗證可套用，未套用 |
| [semantic-preservation.md](./semantic-preservation.md) | 29 組原條款的保留、移轉、澄清與刻意流程變更 |
| [draft-slice3-addendum.txt](./draft-slice3-addendum.txt) | 修正先前過強的效率／因果解讀；歷史報告保持原樣 |
| [checks.json](./checks.json) | 候選 hashes、bytes、path checks、保全結果 |
| [check-candidates.py](./check-candidates.py) | 無模型的候選包檢查與 patch 產生器，只寫此目錄的 candidate.patch/checks.json |

## 核心取捨

模型從 task、Git boundary 與實際 seam 出發，自行決定需要查什麼。Owner 仍具有權威，但不等於每輪必讀。取消 common route、固定 Travel ADR 聯集、所有實作先讀 Playbook 的要求；沒有另建 micro-fix／caption-fix 等逐案例流程。

保留 precedence、獨立 authority、approval reuse/失效、dirty/untracked、Public/Family、secret、Base/Source/Current、migration human review/rehearsal/read-back、drift/UNKNOWN 與 #105 邊界。Minimal UI invariants 仍在 core；不實作過時 P04。

驗證自主性改變的是「如何取得足夠證據」與「何時查文件」，不是允許略過已適用的 acceptance/驗證要求。既有 build→tsc 順序、Collection types、Browser coverage 缺口等仍保留。這點是安全保留與減少程序的分界。

## 文字容量，非執行成本

| 表面 | Current UTF-8 bytes | Candidate UTF-8 bytes |
| --- | ---: | ---: |
| AGENTS | 9,022 | 4,792 |
| Owner index | 6,624 | 2,070 |
| Claude entry | 497 | 274 |
| Playbook | 20,828 | 21,365 |

Core 約 4.68 KiB，比原本少 46.9%；略高於上輪 3–4.5 KiB 軟目標。保留直接 UI invariants 與具體安全條款，優先避免重演語意缺口；不以字數為由刪條款。索引不再要求啟動閱讀。Playbook 增加的是自主適用性澄清，並未把 core 全文搬到另一個必讀文件。這些數字只描述文字容量，不是實際讀取量、token savings 或模型能力證明。

## 套用前必須一起解決的依賴

1. 四個 active surfaces 必須同批一致：AGENTS、index、Claude、Playbook。只改 core 會留下相反的閱讀義務。
2. `src/scripts/agent-governance.test.ts` 目前驗證 Slice 1 draft exact equality、固定語句、mandatory common route，並把輸出寫回 Slice 2 artifacts。新候選下預期會失敗；不得刪測試或把這種失敗當新安全回歸。下輪修改測試的 revision input/output，保留舊 fixtures/receipts，新增 Revision 2 保全、owner存在、無強制聯集、UI owner、authority 及禁止範圍檢查。語句命中不能宣稱語意等價。
3. 本包未實作新測試或 behavioral harness。candidate.patch 是完整四檔候選文字差異，**不是可直接批准發布的完整 implementation changeset**。批准候選後才由 Terra 按規格完成測試／本地實作，Astra 審核安全差異。
4. 索引移除讀取義務，可能使模型漏查需要的契約；這是需以行為測試評估的風險，無法由字節或 link check 消除。不能要求代理為了通過 benchmark 刻意少讀必要文件。
5. 既有 architecture legacy retention／cleanup 現況落差仍未解決；本候選不改 product/domain truth、不查 Production。

## 後續工作包與上限提案

| 階段 | 執行者 | 範圍與交付 |
| --- | --- | --- |
| 本輪 | Astra＋腳本 | 只產出本 review package；零新增 model sessions |
| 候選批准後 | 一個 Terra 工作包＋腳本 | 四檔精確修改、修訂 #113 離線測試、候選保全與結果彙整；不建立 #105 runner |
| 語意審查 | Astra | 只看新 diff、保留表、異常與必要 owner；不再讀整套歷史 trace |
| 行為驗收另批准後 | Astra，最多三個 run | F-UI canary 後才考慮 F-DATA/F-SENSITIVE；每個 fresh context、固定輸入、實際 trace |

Luna 僅在腳本無法判定的小量 log 分類時使用，附原始位置；不是必經階段。不要將整段對話傳給下游模型，也不要讓 Terra/Luna 代替 Astra 受測行為。Astra 的語意審查與測試受測 session 分離，不把期望答案灌給受測者。

新的評估工具只擁有 #113 離線 fixture 執行與量測。先做一次環境相容性 canary，記 actual CLI/model/config/catalog 可得識別；環境不一致不得宣稱控制比較。執行順序、工具往返與時間上限應先固定；infrastructure failure 停 queue，不自動重試或提高預算。若 usage 只在 turn end 提供，明列無即時 token 硬上限；按已回報 usage 決定是否停止後續 run。觸限記 INCONCLUSIVE，不刪安全檢查求 PASS。完整 log 留磁碟，模型只取摘要／失敗片段；不得隱藏影響結論的證據。

三個 candidate-only run 是行為驗收，不能證明相對舊版節省。若另需 causal comparison，須另列同環境配對樣本與預算，不能用舊 Slice 3 一次樣本作可比 control。未取得新批准前不啟動上述模型或實作階段。

## 本輪核對

腳本核對既有 1,345 個檔案及 Slice 2 receipt hashes；核對候選相對 link paths、文字 whitespace、mandatory-loading 條款移除、patch 可套用性、`git diff --check` 與空 staging。只做 path 存在檢查，不把它當 Markdown anchor 或語意保留證明。沒有重跑會改寫 Slice 2 evidence 的舊測試。

下一個 Human 決定：是否接受這份完整候選、語意移轉與刻意取消的預讀義務，再授權有限的本地實作。原有 external-write／Production／#105/#114/#118 禁止範圍維持。
