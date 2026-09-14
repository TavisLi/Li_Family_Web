# Issue #104 Node 24 規劃交付

日期：2026-09-12。Scope：Node 20→24 planning／compatibility analysis，供 #119 實作；不含 migration。

## 交付與基線

- 分支：`codex/docs-104-node24-plan`；base：`f1796687d2469319c4a465feada1ffc3cb8b59d8`。
- [完整計畫](../phase-preparation/issue-104-node24-compatibility-plan.md)：inventory、dependency/engine findings、確定與待驗 blockers、精確變更表、驗證矩陣、rollback、#119 順序。
- `vercel.json`：僅停用上述規劃分支自動 deployment，實現使用者不部署要求；main／其他分支保持預設。
- 開工 clean，沒有混入既有使用者修改。

## 證據與限制

Git fetch 後 main／origin/main 一致；已讀 #104、#119、#118。Vercel live Project Settings 是 24.x，但對應 main 的 Production build log 明確以 package engines 選用 20.x、pnpm 10.28.0。官方公告確認 2026-10-01 新 Node 20 部署邊界。全部 evidence 詳見計畫。

文件與路徑／runtime selectors 靜態檢查、`git diff --check` 用於本次文件交付；Node 24 install、tests、build、tsc、Browser QA **未執行**，留給 #119。Preview／Production QA：N/A（本次不部署）；未讀取 Production records、未執行 migration/data write/read-back。

Node 24 runtime 相容性尚待 #119 matrix，不能用 engines 接受或既有 Node 20 build PASS 替代。Docker 為 Node 18 舊範本且有獨立契約缺陷；歷史 frozen operations 保留舊 guards，不能直接重新批准執行。

## PR、狀態與 rollback

文件交付 → 靜態檢查 → Draft PR 供審查；commit SHA／PR URL 以 Git／PR metadata 為準。未 merge，未關閉 #104，#119 未執行，未發布 Release。人工接受計畫後 #119 才以此為 baseline 開工。

本 PR rollback：撤回文件與單一 branch deployment rule；無 runtime／schema／資料還原需求。不得在本規劃分支仍會 push 時移除 no-deploy rule。未來合併至 main 仍可能觸發既有自動 Production deploy，必須另經批准。
