# Issue #104：Node 20 → Node 24 相容性與 #119 執行計畫

日期：2026-09-12。狀態：規劃完成、待人工審查；Node 24 實測尚未開始。

需求：[#104](https://github.com/TavisLi/Li_Family_Web/issues/104)；執行：[#119](https://github.com/TavisLi/Li_Family_Web/issues/119)。本文件是 #119 的規劃基線；開始實作只補現況 delta，不另複製一份規劃。#119 驗收後才進入 #115 Tailwind 工作。

## 1. 決策與範圍

建議直接以現有 dependency graph 遷移至 Node **24.x**，先不升級 Next、React、Payload、Tailwind 或其他應用依賴。主要套件的 locked engines／peers 接受 Node 24 與目前 framework 組合；這是靜態相容性結論，**不是 clean install、build 或 runtime PASS**。

#104 只讀 repository、Issue、平台設定與既有 build logs，交付文件 PR。未切換／安裝 Node、未安裝依賴、未執行 DB／seed／migration、未部署、未 merge、未發布 Release。唯一非 Markdown 修改是 `vercel.json` 的 `git.deploymentEnabled["codex/docs-104-node24-plan"]=false`，防止本文件分支 push 自動部署；不影響 main 或 #119 分支。

驗收：runtime inventory、版本／平台差異、相容性風險、檔案清單、依賴策略、驗證矩陣、rollback 與執行順序均可追溯。Node 24 未測項明確交由 #119；沒有以舊 Production READY 充作 Node 24 evidence。

## 2. 當前 inventory 與 Issue delta

開工 worktree clean；fetch 後 `main = origin/main = f1796687d2469319c4a465feada1ffc3cb8b59d8`。當時無 open PR。已讀 AGENTS、CONTEXT、Phase Playbook、架構契約與 access／R2 ADR；維持 Payload published source、data-layer access boundary 與 R2 storage。

| Surface／authority | 本次實際觀察 | #119 目標／處理 |
| --- | --- | --- |
| `package.json` engines | `>=20.9.0 <21` | `24.x`，正式 major authority |
| `.nvmrc`、`.node-version` | 均 `20.20.2` | 同一個經驗證的 24 patch；開工選定並記錄 |
| 主機 shell | `/opt/homebrew/bin/node` = `v26.5.0` | 每次先驗證 executable／version；不能把 shell 當 repo baseline |
| package manager | 沒有 `packageManager`／`devEngines.packageManager` | 固定 `packageManager: pnpm@10.28.0`，先沿用已部署版本 |
| `pnpm-lock.yaml` | format `9.0`；含 engines、peers、native optional packages | frozen lockfile，禁止整體重新解析 |
| `.npmrc` | `legacy-peer-deps=true` | 不以此證明 peer 相容；暫保留，檢查 install warning |
| `pnpm-workspace.yaml` | allowBuilds：esbuild、sharp、unrs-resolver | 驗證所選 pnpm 是否識別；必要時只調整等效 allowlist |
| `next.config.mjs` | `withPayload(nextConfig)`；未設定 standalone | 保留 Next/Payload seam |
| scripts | build/dev/start/lint/Payload 使用 `NODE_OPTIONS=--no-deprecation`；tests 多為 `node --import tsx` | 保留正式命令，另作可見 deprecation 的診斷 |
| `vercel.json` 基線 | framework `nextjs`、outputDirectory `null`；沒有 Node selector | 不新增第二個 Node authority |
| Vercel Project Settings | **24.x**；project `li-family-web` | 已符合目標，暫無 Dashboard mutation 必要 |
| Vercel 實際 build selection | **20.x**，package engines 覆蓋 Project Settings | 改 engines 後確認 build 與 Node Functions 皆 24 |
| Vercel pnpm | build log：`10.28.0`，依 project creation date 選擇 10.x | 固定版本後核對實際 install log |
| CI | 無 `.github/`，無 repo Actions workflows | #118 尚 open；#119 不等待 CI 建置，沿用本地＋Preview；#118 後讀同一 selector |
| `Dockerfile` | `node:18-alpine`；runner 依賴 `.next/standalone`；deps 階段未 COPY workspace allowlist | 非現行 Vercel 路徑；已知舊範本，見下節 |
| `docker-compose.yml` | `node:18-alpine`、`pnpm@latest`、Mongo service | 與正式 PostgreSQL 架構不符；不得假稱可用容器 baseline |
| DB | `@payloadcms/db-postgres`；Supabase PostgreSQL pooler；max 3、connect/idle timeout 10 秒 | TLS、pool、startup、CLI 於隔離 DB 驗證；不改 schema |
| Auth | `src/lib/data/auth.ts` 呼叫 `payload.auth`；Users 管理 session | 驗證 cookies、登入／登出、拒絕訪客私密 reads |
| Media | Payload sharp＋S3 adapter／AWS SDK；R2 public URL fallback | 驗證真實 image transform 與受控媒體讀取 |
| Edge | `src/app/api/og-default/route.tsx` 明列 `runtime='edge'` | 仍是 Edge，不能稱為 Node 24 function；驗證回應回歸即可 |
| 操作 automation | `src/scripts` 中有固定 Node 20 guards；無 repo workflow／shell automation runtime selector | 區分現行工具與 immutable 歷史操作，見第 5 節；不推測主機全域排程 |

Vercel read-only evidence：project `prj_9JnWOR9OEhA3zRZJKXMUh2qVE0v4`；Production `dpl_6ss624UGJpHKi3ZRJfKBMfGUG5pr`，READY、main commit `f179668…`，與 repo 一致。最近 Preview `dpl_FbrvGCtEerFEjaAN8aukNJvCP1X2`，READY、commit `d05c4a45d150621e2f803d09bb63d27910bf1e3f`，是 #122 的舊 Preview，不是 #119 evidence。[Production inspector](https://vercel.com/tavis-li-s-projects/li-family-web/6ss624UGJpHKi3ZRJfKBMfGUG5pr)。

Production build log 確認 engines 將 Dashboard 24.x 覆蓋為 20.x、pnpm 10.28.0、Next 15.4.11、build 成功，且使用舊 build cache。沒有取得執行中 function 的精確 patch，不能宣稱雲端也是 20.20.2。

#104 的 2026-10-01 新部署截止日期仍正確：官方區分「新 Builds／Functions 不再接受 Node 20」與「既有部署繼續運作」。不要把 upstream Node 20 EOL（2026-04-30）或 Vercel major selector 誤寫成本地 patch 保證。[Vercel 公告](https://vercel.com/changelog/node-js-20-is-being-deprecated)。

## 3. Compatibility findings

下表版本取自 `package.json`／`pnpm-lock.yaml`，不是 registry latest。`engines` 容許只代表可進入 #119 實測。

| 元件 | locked baseline／靜態結論 | #119 關鍵證據 |
| --- | --- | --- |
| Next／SWC | Next 15.4.11，Node `^18.18.0 || ^19.8.0 || >=20.0.0` | production build、SSR/RSC、native SWC Linux 載入 |
| Payload family | payload 與五個直接 @payloadcms 套件均 3.85.1；payload／next adapter engines `^18.20.2 || >=20.9.0` | config／Admin／Local API／CLI startup |
| Payload Next peer | 明確接受 `>=15.4.11 <15.5.0`；目前符合 | 不需順帶升級 Next major |
| React／React DOM | 19.2.1；Next peer ^19.0.0；Payload storage peer 包含 ^19.2.1 | hydration、server actions、Auth 行為 |
| PostgreSQL | pg 8.20.0（Node >=16）、drizzle-orm 0.45.2、drizzle-kit 0.31.7 | TLS connect、bounded query、transaction rollback、migration status；pg-native 為 optional peer，不能當成已安裝 |
| Auth／crypto | Payload auth；lock 中 jose 5.10.0／6.2.3 | token/session、cookie、失效／錯誤密碼；不能只測登入頁 GET |
| R2 client | @aws-sdk/client-s3 3.1065.0，Node >=20 | S3 signing／TLS／stream、public media URL；不更新 AWS SDK |
| sharp | 0.34.5，Node `^18.17.0 || ^20.3.0 || >=21.0.0` | fresh optional native binary、JPEG/WebP resize/metadata、Linux 路徑；macOS PASS 不替代 Linux |
| native/build tools | SWC、sharp/libvips、esbuild 0.18.20／0.25.12／0.28.0、unrs-resolver 1.12.2 | 各 dependency owner、平台 binary／install scripts；不 bulk override 多版本 |
| TS／lint | TypeScript 5.6.3 >=14.17；ESLint 8.57.1 >=16 分支；eslint-config-next 15.4.11 | lint、build 後 tsc；ESLint EOL 是既有 debt，非 Node 24 升級理由 |
| Node types | @types/node range ^22.5.4、locked 22.19.20 | 不是 runtime selector；先留原 graph，之後建議對齊 24 types，獨立小 commit 驗證 TS 5.6.3；不可未測就強升 TypeScript |
| parser/UI tooling | gray-matter 4.0.3、GraphQL 16.14.2、Tailwind 3.4.17、PostCSS、Sass 1.77.4 等 | parser/projection、Lexical render、CSS build regression；全部維持現版 |
| tsx／ESM | tsx 4.22.4 >=18；root type=module；mjs + TS；createRequire/import.meta.resolve 存在 | 保留 `node --import tsx`，不改用原生 TS stripping 取代；測 config alias 與 CJS/ESM CLI |

Node 20→24 必須合併檢視 [20→22](https://nodejs.org/en/blog/migrations/v20-to-v22) 與 [22→24](https://nodejs.org/en/blog/migrations/v22-to-v24) 的變化，但不建立 Node 22 中繼 migration。重點為 module loading／require(esm)、crypto/OpenSSL 3.5、TLS、streams/fetch、Buffer／移除 API 與 child-process 行為。靜態搜尋未見應用直接使用 `process.binding`、`process.assert`、`SlowBuffer`、`new Buffer`、`fs.F_OK`、`shell: true`；這不涵蓋完整 transitive dependency runtime。`spawn(process.execPath, …)` 的 worker 會繼承父程序，因此父 executable 必須驗證。

正式 scripts 隱藏 deprecation；#119 在隔離環境額外用 `NODE_OPTIONS=--trace-deprecation pnpm exec next build`、`NODE_OPTIONS=--trace-deprecation node --import tsx <focused-test>` 作診斷，避免 package script 覆蓋 options。比較 Node 20/24 warning，新的 critical error 要修復；既有 warning 分開記錄。

## 4. Runtime contract、依賴策略與 blockers

- `engines.node = 24.x`；`.nvmrc`／`.node-version` pin 同一個當時可用且經測試的 24 patch。Vercel 只控制 major，patch 自動更新；記錄實際 build/function patch，接受同 major 的受控 patch drift，不假裝可以在 Vercel 固定本地 patch。[Vercel 版本規則](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)。
- package manager 固定 **pnpm 10.28.0**（本次平台實證），而非 latest。Node 24 可用 pnpm 10；實作時使用受控 Corepack／明確版本 bootstrap，核對 `node -p process.execPath`、`node --version`、`pnpm --version`。Vercel 版本選擇亦需確認。[pnpm](https://pnpm.io/installation)、[Vercel package managers](https://vercel.com/docs/package-managers)。
- **尚無證據需要更換應用依賴版本**。先原 lockfile clean install；`@types/node` 24 為建議的型別對齊，不是執行 Node 24 的必要條件。若目前 TS 無法接受候選 types，保留現有 types、記錄限制，先判定是否實際 blocker，不能擴大為 TS/framework migration。
- `allowBuilds` 是否由 pnpm 10.28.0 正確採用必須實測。Docker deps 階段目前漏 COPY `pnpm-workspace.yaml`，不能以一般 Vercel install 成功推論 Docker script policy 正確。
- **確定會阻擋 Node 24 的項目**：root engines、舊 selectors、固定 process.version 的操作 guards；Docker Node 18 更是既有 drift。
- **待實測 gate**：clean macOS/Linux install、native binaries、Payload CLI/DB/Auth、Preview runtime parity。這些阻擋 #119 merge acceptance，不代表禁止開始隔離驗證。
- **Docker 既有缺陷**：runner 要 standalone、Next config 未啟用；Compose 用 Mongo、runtime 卻為 postgresAdapter。推薦 #119 將 Docker 明列為「不支援的歷史範本」，在兩個檔案頂部與 README 加入明確用途／禁止作 runtime baseline 的說明，保留原證據，不悄悄宣稱容器已遷移。若 owner 要求 Docker 是受支援入口，先批准最小 Docker 修復範圍，再做 Node 24 image、固定 pnpm、COPY allowlist、PostgreSQL 與 output 契約、container smoke；不能只換 image 即 PASS。不為本計畫另改 DB 架構。
- #118 不構成 blocker；沒有 CI 時須提供可重播本地及 Preview evidence。主機全域 Codex／LaunchAgent 未納入 repo runtime，也未在本次修改；#119 若實際依賴某外部 runner，先記錄 path／version delta。

## 5. #119 精確檔案與外部設定清單

| 檔案／surface | 必要動作 |
| --- | --- |
| `package.json` | engines 24.x；packageManager pnpm@10.28.0；types 僅按上節條件更新 |
| `.nvmrc`、`.node-version` | 同一個經測 Node 24 patch |
| `README.md` | runtime 表、prerequisites、bootstrap、Docker 非支援狀態 |
| `AGENTS.md` | 技術基線 Node 24，移除現行 Node 20 命令要求 |
| `docs/全栈系统需求与技术架构说明书.md` | runtime row；major/patch authority 區分 |
| `docs/phase-execution-playbook.md` | Gate 1 Node check、最後的 tooling baseline |
| `Dockerfile`、`docker-compose.yml` | 推薦標示 historical unsupported；若批准支援 Docker 才實作上一節完整最小修復 |
| `pnpm-lock.yaml` | 原則 unchanged；只在必需 dependency/types 調整時產生 focused diff |
| `pnpm-workspace.yaml` | 僅在證明 pnpm 10.28 allowBuilds 不適用時改為受支援的等效 native allowlist |
| `next.config.mjs` | 一般 migration unchanged；僅支援 Docker 方案才處理 standalone |
| `vercel.json` | 正式 Node migration 不需新增 Node 設定；本次規劃分支 no-deploy rule 不阻擋 #119 |
| `docs/phase-artifacts/issue-119/` | 新增版本、命令、結果、commit/deployment、警告 delta、rollback evidence |
| `docs/phase-completion-reports/issue-119-node24-migration.md` | 記錄實作／驗證／PR 與未完成的 merge/Production gates |
| Vercel Project Settings | 本次已 24.x，預期無更動；若開工 drift，先提交 current→target、scope、影響、rollback 並取得外部設定批准 |
| 未來 `.github/workflows/` | #118 若先落地則逐檔列出 delta、讀 .nvmrc；否則交 #118 延後整合，不於 #119 建整套 CI |

下列 **8 個精確 Node 20 guard 檔案**是歷史批准操作的一部分，不能 search-and-replace 放寬後重跑：

- `src/scripts/phase21-c0-package.mjs`
- `src/scripts/phase21-c0-pg-rehearsal.mjs`
- `src/scripts/phase21-retirement-rehearsal.mjs`
- `src/scripts/phase21-retirement-actual-ddl-rehearsal.mjs`
- `src/scripts/phase21-retirement-final-preflight.mjs`
- `src/scripts/phase21-retirement-production-backup.mjs`
- `src/scripts/phase21-retirement-production-apply.mjs`
- `src/scripts/phase21-retirement-restore-readback.mjs`

推薦 #119 於 runtime 文件明列這些為 frozen historical operations、不能在新 runtime 使用；保留 guards／checksum evidence。`phase21-c0-package.mjs` 另把 package.json/lock 與固定舊 commit 比對，因此即使改 Node guard 也不會合法通過。若仍需作現行 backup/recovery，必須產出新版獨立操作 package、在隔離 DB rehearsal、取得新批准；這會阻擋該操作的 Node 24 readiness，不能阻擋一般應用測試，也不能冒稱全 repository 每一個歷史程式都支援 Node 24。歷史 completion reports／frozen manifests 不改寫。

## 6. #119 驗證矩陣（本次均未執行）

共同 evidence：commit、OS/arch/libc、Node executable/version、pnpm version、lock SHA、命令、exit code、關鍵錯誤／warning。每組使用相同 fixture/schema；不保存密碼、cookie、DB URI 或私密 response。Node 20.20.2 baseline 與 Node 24 候選各自乾淨 checkout、node_modules、store／build cache，不刪使用者現有資產。

| Gate | 具體操作 | PASS／停止條件 |
| --- | --- | --- |
| Bootstrap | `pnpm install --frozen-lockfile`；兩個 Node 環境使用 pnpm 10.28.0；baseline 用原 engines、candidate 用新 engines | 無 lockfile drift、unsupported engine、遺漏 native install；先查 blocked scripts |
| Native | Node import sharp，於 temp fixture resize JPEG→WebP 並讀 metadata；build 載入 SWC；tsx 執行 | macOS 與 Vercel Linux 均可用；不從舊 node_modules 複製 binary |
| Lint | `pnpm run lint` | exit 0；區分既有警告，不擅改 Tailwind |
| Unit／projection | `pnpm run test:phase-9`、`test:phase-16`、`test:phase-17`、`test:phase-18`、`test:phase-19`、`test:phase-21`、`test:memory-v2`、`test:r2` | 可去重相同測試檔但保留覆蓋清單；parser、memory、reconciliation、R2 全 PASS |
| Auth／access／metadata focused | `node --import tsx src/lib/data/auth-session.test.ts`；`src/payload/access/is-admin.test.ts`、`src/lib/site-metadata.test.ts` 同方式 | 訪客／家人／Admin 邊界、URL 語意不變 |
| Build → typecheck | `pnpm run build` 完成後才 `pnpm tsc --noEmit`；另執行可見 deprecation 診斷 | 兩者 exit 0；路由數／類型、bundle、warning delta 可解釋 |
| Payload CLI | 隔離 env：`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`；`pnpm exec payload --help`、`pnpm exec payload generate:types`、`pnpm exec payload generate:importmap` | CLI/alias/ESM 成功；生成物不應有非預期 diff |
| DB／migration tooling | 只在 disposable PostgreSQL 載入測試 schema／fixture；`pnpm exec payload migrate:status`、startup、SELECT、測試 transaction rollback；必要 migration rehearsal 僅 disposable DB | 無 schema push、未對 Production 連線；不要無條件跑 migrate（歷史 migration 有資料前提） |
| App server | `pnpm start`；相同 fixture 下測 `/`、`/blog`、`/member/<fixture>`、`/travel`、Plan、Memory、day/photos、`/timeline`、`/bucket-list`、`/wrapped` | status、實際 HTML/RSC 無 digest、權限/導航/metadata parity；正確拒絕/redirect 也列預期 |
| API／Auth integration | disposable users：`/family/login`、`/admin`、`/api/users/me`，Payload REST read／GraphQL read；實際登入／登出／錯誤密碼／家人與訪客 | cookie/session 正確；私密 records 不外洩；登入可能寫 session，只用隔離 DB |
| Media／Edge | fixture image 及 R2 GET、失效圖片 fallback、`/api/og-default` | 真圖成功＋fallback 行為一致；Edge 不冒稱 Node function |
| Preview | 批准後 deployment 綁 #119 head；確認 install/build、process.version、functions startup、上述 representative routes/Auth/media、logs | READY 不夠；在受保護 logs 記錄 Node 24，不加公開診斷 endpoint；無 critical runtime error |
| Parity review | Node 20 與 24 相同 fixture、route/API/auth/media 結果及 warning 對照；桌機／手機導航 smoke | 不要求 pixel 級矩陣，但可見渲染回歸阻擋 merge |
| Scope review | `git diff --check`、selectors scan、依賴／secret／generated diff 審查 | 沒有 Tailwind/framework/schema/data mutation、沒有未解 runtime blocker |

隔離 Preview DB 為首選。若 Preview 連 Production，只能依 Playbook 另批 branch-scoped GET-only 路徑、schema push=false；不得登入、操作 Admin、seed、upload 或 migration。這種 Preview 不能代替隔離環境的完整 Auth integration。無可用 fixture／可認證 Preview／runtime evidence 時如實 BLOCK 對應 gate。

## 7. Rollback 與 #119 執行順序

Rollback package 必須在 merge 前包含：實際 pre-migration commit（本次候選為 f179668…，開工重查）、舊三個 selectors、原 lock SHA／必要依賴 diff、pnpm、Vercel setting（目前 24.x）、最後已驗證部署 ID／aliases、測試結果及授權。

10 月 1 日前，可在批准後 revert #119 code/selectors/必要依賴，再使用原 20.x engines 重建；Dashboard 原值是 24.x，不應盲目「還原」成 20.x。10 月 1 日後不可依賴重新 build Node 20：保留既有部署，另核實平台當時 rollback candidate／保留期限／alias 切換能力並取得批准；官方保證舊 function 繼續執行不等於保證任意舊部署都可重新 promote。若無可用舊 deployment，採修復 Node 24 的 forward fix；不要自行改用 container 規避期限。程式回退不還原資料，本次與 #119 都不應需要 Production data rollback。

建議順序：

1. 人工審查本 #104 plan；#119 refresh main／平台／#118 delta，確認 Docker 與 frozen-tool 分類；先保留 pre-migration evidence。
2. 建立隔離 Node 20 baseline 與同版本 pnpm、fixtures；記錄現存 failure，避免歸因給 Node 24。
3. #119 單獨分支只改 selectors／packageManager／現行 docs；固定 Node 24 patch；原 graph clean install。Docker 先依上節推薦標明 unsupported。
4. 跑 native、focused tests、lint、build、tsc、CLI／DB／Auth parity。只有可重現 Node 24 blocker 才加入最小 dependency fix，逐一記錄原因／版本／差異。
5. 另評估 @types/node 24 小 commit，不順帶升級 TS；再重跑受影響 gates。
6. 批准 Preview 後以 migration commit deploy、記錄 build/function version、實際 smoke 與 runtime logs；外部設定若已 24.x 不動。
7. 完成 parity／rollback package、PR／completion report，**停止等候 merge 與 Production 授權**。建議 2026-09-25 前達 merge-ready，預留至 09-30 的修復與批准時間；不是自動部署期限。
8. 另經批准 merge／Production deploy/read-only verification／觀察後才接受 #119，後續 #115 仍為獨立工作。#118 落地時將相同 Node 24 contract 納入 CI。

## 8. #104 交付檢查與來源

本次驗證為檔案／lock 靜態審查、Git main 比對、GitHub Issues、Vercel metadata/build log read-back、官方文件查證及文件 diff 檢查。沒有 Node 24 install/build/test 結果；這些屬 #119，不在此偽填 PASS。

外部文件於 2026-09-12 查閱；live docs 可能更新，套件特定版本仍以鎖檔為準。補充：[sharp 安裝與跨平台 optional dependencies](https://sharp.pixelplumbing.com/install/)、[Vercel Git branch deployment control](https://vercel.com/docs/project-configuration/git-configuration)。
