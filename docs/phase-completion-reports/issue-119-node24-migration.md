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

## Free Preview completion addendum — 2026-09-13 UTC

**最新狀態：runtime implementation與已批准免費Preview公開唯讀驗證完成；Draft PR #124，停在Human review。** 此節取代前述Preview尚未建立的狀態，不改寫歷史驗證紀錄。

Human拒絕付費隔離branch，已批准本PR限定Preview使用既有Production連線、禁止schema push與一切寫入，只驗公開GET/SSR/RSC/media。已設定六項分支限定env，未修改Vercel Node Settings或Production target。

- Preview實作commit：`c80c7562d67ac345042102714907de92a5bbbf0b`；部署`dpl_C3qAq9MKMyJFSFmAamsqSWUVe1ph`，[Preview](https://li-family-e21ble440-tavis-li-s-projects.vercel.app)。本完成證據的後續commit為docs-only，不冒稱另一個runtime版本已部署。
- 最小驗證支援：僅指定Preview啟用Node版本console probe，公開Supabase CA納入function trace以支援verify-full TLS。無dependency compatibility修復；原鎖檔、frameworks、schema、兩項baseline debts不變。
- Cloud fresh install/cache skipped、pnpm10.28.0、native lifecycle、production build與內建lint/types成功。實際function為Node24.19.0/Linux x64/OpenSSL3.5.7；本地/Linux pin24.21.0，明列平台管理patch差異。
- 13項公開HTTP/RSC/Edge/Next image檢查通過；真實Payload-backed Plan/Memory/Day/Photos、Blog與Member內容成功。R2 JPEG/WebP verified TLS＋stream/sharp解碼成功。桌機／手機實圖、旅行導覽與相簿篩選成功，手機無横向溢出；browser error/warn=0，指定Preview時間窗runtime error/fatal=0。
- 警告：既有Edge static generation、未配置email adapter；只提供public R2 URL的Preview另有upload storage adapter缺失警告，不宣稱上傳驗證。
- Production仍main `f1796687d2469319c4a465feada1ffc3cb8b59d8`／`dpl_6ss624UGJpHKi3ZRJfKBMfGUG5pr`。未做Production部署、資料／schema／session寫入、migration、merge、Release或#115。

完整精簡矩陣、runtime與rollback見[Free Preview evidence](../phase-artifacts/issue-119/README.md)及[preview-results.json](../phase-artifacts/issue-119/preview-results.json)。一般完整logs與HTML只留本機診斷目錄，未提交憑證。

**尚未解除的merge／Production gates**：Human review此PR、明確接受免費方案的cloud Auth/Admin／authenticated S3/upload未測限制，或另批准隔離環境補驗；兩项baseline debts不改報PASS。#119不關閉，#115不啟動。Preview/env只供本PR審查，credential不是server-enforced唯讀；合併／放棄後需撤除部署與六項分支env，僅刪env不會撤銷既有部署快照。Production未切換，無data rollback；程式回退遵循前述Node20/main與10月1日限制。
