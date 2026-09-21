# #113 Slice 2 — local governance implementation

狀態：LOCAL IMPLEMENTED / STRUCTURALLY VERIFIED / HUMAN REVIEW PENDING。未 commit、stage、push、建立或修改 GitHub Issue/PR、merge、deploy、release、closeout，未存取 Production，未執行 Slice 3。

## Baseline 與批准

- HEAD、原 `origin/main` 與唯讀 `git ls-remote origin refs/heads/main` 一致：`e20bf82f489634112a2c569b5ce5e0ba06616b81`。
- 由乾淨 tracked `main` 建立本地 `codex/docs-113-governance-slice2`。原本未追蹤的 `slice-1/` 全部逐檔 hash 保留；沒有擅自 stage/commit。
- P01 approved draft SHA-256：`93333794ebbe6b71a8706cbd6172e06b2f608bcb1510d1b0f9a92aca0a41f88c`。
- P02 approved draft SHA-256：`608eaefb60bec56fcbf94cf0287926c31759d93b22d22b9595c8039578b9de06`。
- Active P01/P02 是各批准檔移除第一行 `DRAFT ONLY` 後的逐字內容，驗證 exact equality。
- [manifest.json](./manifest.json) 明確 supersedes 舊 Slice 1 patch proposal；保留歷史檔案，不依賴過時 P04。Minimal UI invariants 留在 AGENTS。

## 實作與 diff 範圍

14 個既有檔修改：AGENTS、Playbook、architecture、Claude entry，以及 10 個 repository Skill entrypoints。

3 個新增治理／驗證檔：`docs/agent-context-routing.md`、`src/scripts/agent-governance.test.ts`、`.agents/skills/design-taste-frontend/references/design-techniques.md`。

8 個本輪 evidence／replay 檔：本 README、manifest、baseline、preservation-fixtures、structural-results、measure-context.py、static-benchmark、validation。精確逐檔 before/after SHA、bytes、Git diff counts 見 [validation.json](./validation.json)。既有 Slice 1 不列為本輪新增變更。

Design-taste 的大量刪除行數是正文移轉至 reference；原始 body SHA 完全一致。其餘九 Skills 的原始正文也逐一 hash 驗證未變。10 個 Claude symlinks 的 link text、target、可讀性皆保留。沒有移除技術能力、安裝依賴或 disable plugin。

Playbook 先接收 architecture 的 Production action/evidence 清單原文，再由 architecture 改引用。Architecture §§1–9 與 §§13–14 byte-identical；只改 §§10–12 的程序 ownership，沒有改 product/domain truth。CONTEXT、accepted ADR、package/lockfile、global config/AGENTS 與本輪核對的 protected files 均未變。

本輪是一個完整本地 changeset，不把中途文件組合當成可用治理版本，亦未啟動其他 agent/task 依賴混合狀態。不是 filesystem transaction 或已合併的原子 commit。

## Structural validation

[structural-results.json](./structural-results.json) 保留 baseline、目前結果及先前嘗試。

- 23 項結構檢查 PASS：approved source equality、10 組安全保留條款與刪除敏感性 probes、precedence、approval reuse/invalidation、共同實作路由、owner/section/link/anchor 存在、直接 UI owner、aliases/protected assets、domain 原文不變、移轉清單原文保留、Skill metadata/body/scope、allowlist、credential signatures。
- 最終使用 bundled Node `v24.19.0` 執行離線測試。沒有載入 application、Payload、env 或 DB。這不證明 repo 指定 `24.21.0` 的 application runtime。
- `git diff --check` PASS。新增 authored text 另做 whitespace 檢查；原樣搬移的技術 reference 保留歷史格式，不以格式整理改寫正文。
- Credential signature scan 加人工 diff 檢視沒有發現新增 secret/credential；不是對整台機器或所有可能 secret 格式的完整證明。
- 未建立假的 model benchmark：routine UI 的 activation exclusions／routing 可由結構確認；模型是否遵循仍需未執行的 Slice 3。

可重播：

```bash
node src/scripts/agent-governance.test.ts --baseline
node src/scripts/agent-governance.test.ts
python3 docs/phase-artifacts/issue-113/slice-2/measure-context.py
git diff --check
```

使用支援直接 TypeScript 執行的 Node；本輪最後一次使用 app bundled Node 24.19.0。測試只將輸出寫回 structural-results.json；measure-context.py 只更新 static-benchmark.json。重跑後需刷新 validation receipt hashes，不以舊 receipt 代表新輸出。

### 已處理失敗／未執行的檢查

最初 allowlist 檢查受到 Git 中文路徑 quoting、absolute/relative path 差異影響；已改用 NUL-delimited Git output 並核對兩種 path representation。失敗保留在 prior_results，不當成產品回歸。

System 與 bundled Python 都缺 PyYAML，Skill Creator quick_validate 無法完成；未安裝套件。改以執行中的 dependency-free regression 驗證本次實際使用的 frontmatter 子集：required name/description、唯一兩欄、合法名稱、JSON-quoted YAML string、長度與字元限制，另驗證 scope/reference/body preservation。

Optional focused tsc 嘗試因 repository 未安裝 node_modules/typescript 而不可用；未宣稱 typecheck PASS。Application build、完整 tsc、Browser/Preview/Production QA 均未執行：本輪範圍為治理文件及離線 structural utility，沒有 app/schema/runtime change。離線 utility 已由 Node 24 執行通過。

## Actual static context-cost fixtures

[static-benchmark.json](./static-benchmark.json) 使用實作檔案的真實 UTF-8 bytes、行範圍、file/payload SHA；baseline 讀固定 Git commit blobs，不用已改檔案冒充 before。共同路由完整計入，選取範圍交集不重算。

| Fixture | Before bytes / files | After bytes / files | Delta |
| --- | ---: | ---: | ---: |
| F-UI routine member spacing | 34,023 / 6 | 28,529 / 6 | −5,494（−16.15%） |
| F-DATA Travel caption projection | 56,688 / 11 | 60,845 / 12 | +4,157（+7.33%） |
| F-SENSITIVE migration/cleanup preparation | 61,862 / 11 | 54,767 / 12 | −7,095（−11.47%） |

這些只是 static instruction-read byte proxies，不是 token、模型效能、實際 tool calls 或行為改善。Host/tool/catalog overhead、task/code/test/data/evidence bytes 在兩邊一致排除。Data/sensitive 保守保留完整相關 glossary；敏感準備也加入 approved Travel 路由所需 ADR0003 與架構 §8。

F-DATA 增加是必要 common intake/Git/validation 路由及較完整 core 的成本；不為追求下降刪安全 context。舊 Slice 1 的預估降幅不再代表實作。沒有執行 Slice 3。

## Remaining risks／review boundary

1. 結構檢查能確認批准文字保留、引用可達與正文完整，不能證明自然語言的所有行為；actual activation、approval rounds、completion quality 留 Slice 3。
2. Plugin/global discovery 未重設或重新驗證，這輪 session 既有 catalog 不保證即時更新；新 session 的模型行為尚未驗證。
3. F-DATA 靜態成本增加，需 review 接受或另批准後續精簡；本輪不改已批准 core/routing 追求數字。
4. 舊 F15 domain 文件的歷史狀態疑點保持原文，未藉治理實作修正；CONTEXT/ADR/Production truth 不在本輪變更範圍。
5. #105/#114/#118 未實作；#105 的 runner/ledger/receipt/invalidation execution contract 沒有複製。這裡的 receipt 僅記錄 #113 structural audit。
6. Stage/commit/push/GitHub/merge/deploy/release/closeout 與 Slice 3 仍需另行授權。

Rollback 僅限本輪 allowlist 的本地變更，須保留原 Slice 1 與其他使用者資產；本輪未執行 rollback 或 cleanup。
