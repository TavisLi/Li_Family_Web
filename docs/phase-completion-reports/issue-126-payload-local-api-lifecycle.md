# Issue #126 Completion Report — Payload Local API lifecycle

報告日期：2026-09-22
最終狀態：Locally verified

## 1. Phase Scope

### Delivered

- 從最新 `origin/main` `35c072237a2646a1ebe2403c8278b8544b368dae` 重現 Payload Local API assertion 通過、`payload.destroy()` 完成後程序仍不退出的問題。
- 將 root cause 縮小至 `@payloadcms/db-postgres@3.85.1` 啟動時 checkout、但未 release 的 PostgreSQL client，並以 pnpm patch 回植 Payload upstream 已合併修正。
- 新增受 localhost／schema-push／explicit opt-in 約束的真實 Local API smoke 命令，以及不需 DB 的 package regression test。
- 建立 cleanup ownership：Local API assertion → `payload.destroy()` → `pool.end()` → Node 自然退出。

### Out of scope

- Payload／Next 升級、Production／Preview 連線或部署、schema migration、資料或 media 寫入、#118 ruleset／CI enforcement、merge、Issue 關閉。

## 2. Branch／Commit／PR

- Branch：`codex/phase-126-payload-lifecycle`
- Base：`main`／`35c072237a2646a1ebe2403c8278b8544b368dae`
- Implementation commit：`bdc3a18b7`（cleanup guarantee 與 runtime 實作；本報告修訂另以後續 commit 保存）
- Pull Request：N/A；未獲本 task 發布 PR 授權。
- Merge commit：N/A；未 merge。
- Related Issues：GitHub Issue #126；#119 提供原 Node 20／24 baseline；#118 的 required CI enforcement 仍是獨立後續 gate。

## 3. Delivered Work

產品結果：原本 assertion 成功後仍會掛住的 smoke，現在可重複以正確 exit code 自然結束，不再依賴 `process.exit()`、sleep 或 timeout 假裝成功。

技術機制：before-fix 的 pool 在 `payload.destroy()` 後仍為 `totalCount=2`、`idleCount=1`、`ended=false`；active resources 保留 PostgreSQL TCP／TLS socket，連 `pool.end()` 都會等待該 checked-out client。相同完整 config 在 `disableDBConnect: true` 時可自然退出，排除 Lexical、R2/S3 plugin、HTTP server、watcher 與 test runner 為必要條件。Payload 官方 [#15674](https://github.com/payloadcms/payload/issues/15674) 與已合併 [#17831](https://github.com/payloadcms/payload/pull/17831) 證實同一 root cause；本 branch 對鎖定的 3.85.1 回植 `result.release()`，沒有升級 dependency graph。

Smoke 直接呼叫 Payload Local API 是本 Issue 的刻意測試 seam，用來驗證 adapter lifecycle；它不是 application runtime data path，也沒有繞過 `src/lib/data` 建立新產品資料存取入口。

## 4. Key Files

- `patches/@payloadcms__db-postgres@3.85.1.patch`：回植 upstream bootstrap client release。
- `pnpm-workspace.yaml`／`pnpm-lock.yaml`：固定 patch path 與 hash，讓 fresh install 可重現。
- `src/scripts/payload-local-api-lifecycle-smoke.ts`：真實 Local API read、cleanup ownership 與本機安全 gate。
- `src/scripts/payload-local-api-lifecycle-package.test.ts`：檢查 patch wiring、cleanup nesting，以及禁止 forced exit／timer workaround。
- `package.json`：提供 `test:payload-lifecycle` 命令，使用 production mode 避免 Payload startup 改寫 tracked generated types。

## 5. Validation

| Command／check | Result | Evidence／note |
| --- | --- | --- |
| Before-fix reproduction | PASS（問題已重現） | Local API assertion PASS；destroy 後程序仍活著，pool 有 1 個 checked-out client，需人工中止。 |
| Minimal `disableDBConnect` case | PASS | exit 0；證明 DB access 是 hang 必要條件。 |
| `pnpm run test:payload-lifecycle`／Node 24.21.0 | PASS | 連續 3 個獨立程序皆自然 exit 0；fresh frozen install 後再跑 1 次亦 PASS。 |
| Node 20.20.2 parity smoke | PASS | 自然 exit 0；root cause／修正不是 Node 24 特有。 |
| Lifecycle package regression test | PASS | 驗證 patch、nested cleanup 與無 forced exit／timer。此 test 不冒稱真實 DB runtime exit test。 |
| 全部 61 個 `src/**/*.test.*` | 60 PASS／1 預期 fail-closed | `phase21-c0-package.test.mjs` 是 #101 凍結歷史包，刻意拒絕 Node／package／lockfile delta；未弱化或修改。 |
| `pnpm install --frozen-lockfile` | PASS | 重建 `node_modules`，checked-in adapter patch 正確重套。 |
| `pnpm run lint` | PASS | 無 warning／error。 |
| `pnpm run build` | PASS | Next 15.4.11 production build 完成。 |
| build 後 `pnpm exec tsc --noEmit` | PASS | 無輸出、exit 0。 |
| `git diff --check` | PASS | 無 whitespace error。 |

## 6. Browser／Preview QA

- Preview deployment：N/A；本 task 未授權 Preview deployment，且變更是短生命週期測試／dependency patch，沒有 UI route delta。
- Desktop routes：N/A；無 UI 變更。
- Mobile routes：N/A；無 UI 變更。
- Public mode：N/A；無 access 或 renderer 變更。
- Family mode：N/A；無 access 或 renderer 變更。
- Loading／error／empty：N/A；無 UI state 變更。
- Metadata／JSON-LD：N/A；無 metadata 變更。
- Blocked coverage：GitHub-hosted runner 尚未接上真實 PostgreSQL service；#118 required-check enforcement 未在本 task 內執行。

## 7. Production Verification

- Production deployment：N/A；未授權、未部署。
- Deployment commit：N/A。
- Route HTTP：N/A；無 Production access。
- Rendered HTML：N/A。
- Canonical／Open Graph：N/A。
- Runtime logs：N/A。
- R2 media：N/A；沒有 storage operation。
- Observation window：N/A。

## 8. Migration／Data

- Schema change：N/A；沒有 Collection／schema 變更。
- Migration：N/A；沒有產生或套用 migration。
- Production approval：N/A；沒有要求或使用 Production authority。
- Before inventory：N/A；只使用保留的 disposable localhost PostgreSQL fixture。
- Mutation summary：0；smoke 只做 `users` Local API read，並強制 `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。
- Read-back：N/A；沒有資料 mutation。
- Destructive cleanup：N/A；沒有 drop／delete；測試容器保留。

## 9. Security／Privacy

- Public／Family boundary：未變更；smoke 以 `overrideAccess: false` 執行代表性 read。
- Secret scan：staged diff credential signature scan PASS；repo／文件只有 synthetic localhost fixture 值，沒有真實 secret。
- RLS／grants／access control：N/A；沒有 policy 或 grant 變更。

## 10. Known Limitations and Blockers

- 真實 DB smoke 是可執行的 `test:payload-lifecycle`，但需要 disposable localhost PostgreSQL；不需 DB 的 package test 只驗證 wiring，不能代替 runtime natural-exit 證據。
- #118 尚未提供／啟用此 smoke 的 GitHub-hosted PostgreSQL service 與 required status check；因此目前狀態是 `Locally verified`，不是 `PR ready` 或 CI-enforced。
- 61-file 廣域測試中的 #101 frozen C0 package guard 會對任何現行 runtime／lockfile delta fail-closed；此既有歷史契約不屬 #126 修正範圍。

## 11. Rollback

- Code rollback：在未 merge 狀態放棄本 branch；若未來已 merge，revert #126 commits 並執行 `pnpm install --frozen-lockfile`，即可移除 patch 與 smoke command。
- Data rollback：N/A；沒有資料或 schema mutation。

## 12. Issue Closeout

- Closed：否。
- Remains open：#126 應在 PR review／merge policy 完成後由另行授權 close；#118 的 CI enforcement 仍須獨立處理。
- Follow-up Issues：沿用 #118；本 task 不新增或修改外部 Issue。

## 13. Next-phase Readiness

- 本地實作與真實 runtime evidence 已具備，可進入 Human review／PR 發布 gate。
- 接入 #118 CI 時應直接執行 `test:payload-lifecycle`，提供 disposable PostgreSQL service；timeout 只能作失敗保險，不可當成功條件。
- 未來 Payload 升級時，先檢查 installed adapter 是否已包含 release，再以真實 smoke 重驗後移除 patch；不能只因版本較新就假定修正存在。

## 14. Final State

| State | Result |
| --- | --- |
| Implemented | PASS |
| Locally verified | PASS |
| PR ready | NOT CLAIMED；尚未發布 PR，GitHub-hosted DB smoke 尚未接線。 |
| Merged | NO |
| Production verified | N/A；未授權且無 Production 變更。 |
| Closed | NO；Issue #126 保持 open。 |
