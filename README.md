# Web Li 家庭入口網站

Web Li 是一個長期營運的家庭數位入口，保存家庭成員故事、文章、旅行規劃、旅行回憶、時間軸、共同願望與年度回顧，並以 Public mode／Family mode 控制不同訪客可讀取與參與的內容。

正式網站：[li-family-web.vercel.app](https://li-family-web.vercel.app/)

## 目前已交付

- 家庭大廳與家庭成員敘事頁面
- Payload-backed 家庭 Blog、分類、標籤與家庭互動
- Public mode／Family mode 存取邊界
- Timeline、Bucket List、Annual Wrapped
- Travel corridor、Travel Plan、Archived Plan 與 Travel Memory
- Travel planning sections、照片、YouTube、留言及反應
- Payload Admin、Supabase PostgreSQL、Cloudflare R2
- 可重複執行的 content-source seed 與 Base／Source／Current reconciliation

旅行領域已在 Phase 17 拆分為 `travel-plans` 與 `travel-memories`。舊 `travel-projects` records 與 relationship 欄位目前只作為 rollback evidence，尚未批准 destructive cleanup。

## 技術基線

| 項目 | 現行選型 |
| --- | --- |
| Web framework | Next.js `15.4.11` App Router |
| CMS | Payload CMS `3.85.1`，嵌入 Next.js |
| Runtime | Node.js `20.20.2` |
| Database | Supabase PostgreSQL，serverless pooler |
| Media | Cloudflare R2 S3 adapter |
| UI | React 19、Tailwind CSS、shadcn/ui |
| Deployment | GitHub PR → Vercel Preview → `main` Production |

實際套件版本以 [`package.json`](./package.json)、[`.nvmrc`](./.nvmrc) 與 [`.node-version`](./.node-version) 為準。不要僅依舊 Phase prompt 或早期架構文件推斷版本。

## 內容與資料流

```text
docs catalog + content-source Markdown/assets
                    │
                    ▼
      parser / manifest / reconciliation
                    │
                    ▼
          Payload published records
                    │
                    ▼
       src/lib/data → routes / features
```

- `content-source/` 是可版本化、可審查、可重複匯入的輸入。
- Payload collections／globals 是 Production runtime 的 published source of truth。
- Admin 與 Source 都可能修改的資料，必須以 Base／Source／Current reconciliation 保護 Admin edits。
- 修改來源檔不代表已上線；必須完成 dry-run、批准、同步、read-back 與 Production 驗證。

## 快速開始

### 前置要求

- Node.js `20.20.2`
- pnpm
- 可用的 Supabase PostgreSQL
- 開發上傳媒體時需要 Cloudflare R2

```bash
nvm use
pnpm install
cp .env.example .env
pnpm exec payload migrate
pnpm dev
```

- 前台：`http://localhost:3000`
- Payload Admin：`http://localhost:3000/admin`

任何 migration 執行前都要先確認目前連線的資料庫環境。Production migration、seed 或 destructive cleanup 不屬於一般開發授權。

## 常用驗證

```bash
pnpm run build
pnpm tsc --noEmit
git diff --check
```

有 Collection 變更時：

```bash
pnpm exec payload generate:types
```

Travel 工作依範圍使用：

```bash
pnpm run test:phase-17
pnpm run seed:travel:dry-run
pnpm run seed:travel:read-back
```

`pnpm run build` 與 `pnpm tsc --noEmit` 不要並行執行，以免 `.next/types` 產生競態。

## Phase 工作方式

所有新 Phase 必須遵循：

1. 從最新 `main` 建立 `codex/phase-*` 分支。
2. 先定義 scope、非目標、驗收條件與授權邊界。
3. 讀取 `CONTEXT.md`、相關 ADR、現行程式 seam 與資料 ownership。
4. 執行 focused tests、build、TypeScript、diff 與 Preview QA。
5. 資料 migration、Production write、destructive cleanup 分別取得批准。
6. PR 合併後驗證實際 Production runtime；Vercel `READY` 不能單獨代表完成。
7. 寫入 Phase Completion Report，記錄真實 branch、commit、PR、deployment、data 與 blocker 狀態。

完整流程見 [`docs/phase-execution-playbook.md`](./docs/phase-execution-playbook.md)。

## 文件導覽與優先級

1. [`CONTEXT.md`](./CONTEXT.md)：產品領域詞彙與內容 ownership。
2. [`docs/adr/`](./docs/adr/)：已接受、不可被一般 Phase 靜默推翻的決策。
3. [`docs/全栈系统需求与技术架构说明书.md`](./docs/全栈系统需求与技术架构说明书.md)：現行業務與技術架構契約。
4. [`AGENTS.md`](./AGENTS.md)：AI／代理執行規則。
5. [`docs/phase-execution-playbook.md`](./docs/phase-execution-playbook.md)：Phase 開工至結案流程。
6. [`docs/website-operations-sop.md`](./docs/website-operations-sop.md)：內容更新、資料同步與營運。
7. [`docs/production-deployment-checklist.md`](./docs/production-deployment-checklist.md)：Preview／Production 驗收。
8. [`docs/travel-projects.md`](./docs/travel-projects.md)：旅行 catalog。
9. [`docs/travel-content-source-guidelines.md`](./docs/travel-content-source-guidelines.md)：旅行來源包規範。
10. [`docs/content-source-asset-guidelines.md`](./docs/content-source-asset-guidelines.md)：照片與素材規範。

若文件與 repo 現況衝突，先停止實作並查明哪一方已過時，不要靜默選擇。

## 部署與安全

- Production：Vercel `main` deployment。
- Database：Supabase PostgreSQL。
- Media：Cloudflare R2；禁止引入 Vercel Blob 作為第二套媒體來源。
- Secret 只能存在於本機受保護環境或部署平台，不得寫入 Git、Issue、PR、Completion Report 或 client bundle。
- Production 驗收需檢查路由、實際 HTML、canonical／Open Graph、runtime logs、Public／Family boundary。
- 程式 rollback 不能回復 Payload／Supabase 資料；資料操作必須另有備份、read-back 與回復方案。

詳細步驟見 [`docs/production-deployment-checklist.md`](./docs/production-deployment-checklist.md)。

## 專案性質

本專案為私人家庭網站，目前不接受外部貢獻。內容可能涉及家庭私密資料；未取得網站擁有者批准，不得擴大公開範圍、執行 Production mutation 或輸出私密資料。
