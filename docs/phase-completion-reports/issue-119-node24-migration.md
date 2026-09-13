# Issue #119：Node 24 runtime migration

日期：2026-09-13。狀態：**Implemented；部分本地驗證完成；Draft PR；merge / Preview gates 未通過**。

## Scope / delivery

依 #104／Draft PR #123 批准基線實作 Node 20 → 24；fresh main 仍為 `f1796687d2469319c4a465feada1ffc3cb8b59d8`，無程式或依賴 drift，#118 尚未落地。分支 `codex/phase-119-node24`。

1. Runtime selectors：engines `24.x`、兩個本地 selectors `24.21.0`、packageManager `pnpm@10.28.0`；README、AGENTS、架構契約與 Playbook 同步。
2. Compatibility changes：**無**。原 application dependencies、@types/node、lockfile、native allowlist 全部保留。
3. Historical classification：Docker/Compose 標記不支援舊範本；八支 Node20 frozen operations 原封不動，README 列出限制。
4. Draft publishing safety：只停用本分支 Git 自動部署。Vercel Settings 回讀仍 24.x，未更動。

無 Tailwind／UI／#115／schema／Production data／歷史 migration 修改。未 merge、未 release、未關閉 Issue。

## Validation and evidence

[Compact evidence / exact commands / rollback / Preview plan](../phase-artifacts/issue-119/README.md)。Node24 官方 tarball 已驗 SHA256；兩個 runtime 各自乾淨 archive、modules/store，使用 pnpm10.28.0 frozen install。

- 兩邊 install、lint、production build、build 後 tsc、可見 deprecation build 均成功；無 lock delta。
- 41 unique test files：兩邊均 **40 PASS、1 baseline FAIL**。`travel-legacy-cleanup-package.test.ts:212` 與 main 的 migration index 相矛盾，未弱化測試或擅改 migration。
- Payload CLI types/importmap 成功；types 有兩邊一致的既有 comment-only drift，未提交。`--help` 兩邊均 exit1，另以 Node24 `migrate:status` exit0 驗證正式命令。
- 專用 localhost PostgreSQL fixture：SELECT/transaction rollback、Local API/access/login/auth/wrong password assertions 成功。兩邊 smoke 在 destroy 後未退出，已終止測試程序；shutdown 不標 PASS。
- Node20/24 production servers：15 GET routes、RSC、cookie登入/me/登出及 wrong-password401結果一致；Edge PNG成功。Node24 browser 確認 lobby→travel與Admin login實際渲染。
- sharp JPEG→WebP 與 S3 SDK local signed GET/stream/decode 成功。尚未驗真實 R2/TLS、Linux native、mobile、populated Travel detail／完整視覺 parity。
- `git diff --check` PASS；schema/app code/lock/generated files unchanged。

本地測試 servers 與專用 DB 容器已停止、證據保留。沒有 Production reads/writes。

## Unresolved gates / next readiness

- Baseline test failure 和 Local API shutdown 應由 Human review 決定處理範圍；不可稱 full local PASS。
- Preview 尚未部署。分支 no-deploy rule 保護 Draft push；後續依 artifact 的完整 Preview package 與 HITL 取得適當環境批准，再驗確切 commit/deployment/runtime及真實 QA。
- Merged / Production verified / Closed：未執行；仍須人工批准。#115 不啟動。PR 僅 Related to #119，不使用 Closes。

## Rollback

未部署前撤回本 PR 即可。回到 pre-migration `f1796687d2469319c4a465feada1ffc3cb8b59d8`：engines `>=20.9.0 <21`、兩個 selectors `20.20.2`、移除 packageManager；鎖檔無差異。Vercel Settings 原本24.x，不還原成20。重驗 pnpm10.28.0 frozen install/build/test/smoke。

10月1日前已批准的回退可重新 build Node20；此後不可依賴新 Node20 builds，必須核實保留部署與alias回退能力並另批准，或採Node24 forward fix。保留候選舊部署 `dpl_6ss624UGJpHKi3ZRJfKBMfGUG5pr`；本次只讀metadata，未重新宣稱Production QA。無data rollback需求。

## Continuation addendum — 2026-09-13

Human已接受兩項pre-existing baseline debts（legacy migration test failure、Local API shutdown）為#119 out of scope，原測試與行為未更動。這取代前述要求再次審查兩項債務的阻擋狀態，並不將其改報PASS。

從PR #124 head `295595a38559dfb3a9d8b871f0415b487bf4112b`補完乾淨Linux amd64 Node24.21.0/pnpm10.28.0 frozen install、native、lint、build→tsc；41 tests為40 PASS＋同一已接受FAIL。Linux Next/Payload server的GET/RSC/登入登出/Edge通過；macOS20/24＋Linux24的非空Plan/Memory/Day/Photos marker通過，本地Node20/24桌機1280×720與手機390×844實圖版面一致。沒有dependency/schema/app code delta。

**Preview／cloud parity尚未完成，原因是實際環境缺口**：Vercel此branch適用Preview env為空；Supabase只有正式main，沒有隔離branch。尚未取得可供測試users/session的隔離DB，所以未觸發無有效環境的部署，也未複用Production credentials。待Human提供已批准隔離環境，或批准隔離branch成本與本PR限定env後，繼續實際Vercel build/functions、PostgreSQL TLS、R2 read及Preview Browser QA。現有兩項債務不再是此gate的阻擋原因。

證據與具體環境/deployment/rollback package見[continuation evidence](../phase-artifacts/issue-119/README.md)。分支auto-deploy仍停用；PR維持Draft，未merge、未改Production資料、未啟動#115。
