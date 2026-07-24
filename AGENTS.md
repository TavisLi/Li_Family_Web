# Web Li Agent Operational Guide

本文件定義 AI／自動化代理在 Web Li repository 內的執行規則。產品詞彙以 `CONTEXT.md` 為準，業務與架構以 `docs/全栈系统需求与技术架构说明书.md` 及已接受 ADR 為準，Phase 流程以 `docs/phase-execution-playbook.md` 為準。

## 1. 文件優先級

遇到衝突時依下列順序處理：

1. 使用者在目前任務中的明確指示與批准範圍。
2. `CONTEXT.md` 的領域定義。
3. 已接受的 `docs/adr/` 決策。
4. `docs/全栈系统需求与技术架构说明书.md` 的現行架構契約。
5. 本文件的代理執行規則。
6. domain guideline、Phase preparation、歷史 prompt 與 completion report。

若高優先文件彼此矛盾，停止會造成不可逆影響的動作，提出具體衝突與選項，不得自行覆寫既有決策。

## 2. 技術基線

- Next.js `15.4.11`，App Router only。
- Payload CMS `3.85.1`，嵌入 Next.js。
- Node.js `20.20.2`；使用 `.nvmrc`／`.node-version`。
- Payload Admin route：`src/app/(payload)/admin/[[...segments]]/page.tsx`。
- Payload 必須透過 `withPayload` 注入 Next.js。
- 不使用 Next.js `pages/` 或 Payload v2 慣例。
- 版本事實以 `package.json` 為準；對 API 不確定時查閱對應版本的官方文件。

## 3. 開工前必讀與現況稽核

所有 substantive work 開始前：

1. 執行 `git status --short --branch`，辨識使用者既有 dirty／untracked files。
2. 確認最新 `main`、相關 Issue／PR、Preview／Production 狀態。
3. 讀取 `CONTEXT.md`、相關 ADR、架構契約與 owning domain docs。
4. Schema、seed 或內容工作需掃描相關 `content-source/`、manifest 與現行 parser。
5. 先檢查真實 code／data seam，不從舊 prompt 猜測現況。
6. 將任務轉成可驗證目標，列出 scope、非目標、驗收條件與停止條件。

## 4. 授權與風險邊界

以下是不同授權，彼此不得推導：

1. GitHub Issue／PRD publication or modification。
2. 本地程式／文件修改。
3. Preview deployment。
4. Production read-only inspection。
5. Production schema migration。
6. Production content／media write。
7. Destructive cleanup、drop、delete 或覆蓋 Admin edits。

Phase start、Issue closeout 或「完成」指令不自動批准第 4–7 項。任何 Production mutation 都要先提供 scope、dry-run evidence、before／after verification 與 rollback。

對話中直接描述需求不代表自動建立 GitHub Issue。需要拆分 plan／PRD 時，可使用 `to-issues` 草擬 vertical slices；必須先讓使用者確認粒度與依賴，批准發布後才能寫入 GitHub。完整 HITL 節點見 Phase Playbook。

保留使用者既有變更；不得清理、還原、重寫或提交不在範圍內的 dirty files。若使用者明確要求納入，才視為本次 scope。

## 5. Source、Payload 與資料安全

- Payload collections／globals 是 runtime published source of truth。
- `content-source/` 是版本化 seed input，不是第二套 runtime database。
- 同時允許 Source 與 Admin 編輯的資料必須遵循 Base／Source／Current reconciliation。
- Safe mode 為預設；Source-only 可更新、Current-only 保留、雙方不同修改必須 conflict。
- Missing Base 的既有 record 預設 preserve-current。
- Travel-only 工作使用 `seed:travel`、`seed:travel:dry-run`、`seed:travel:read-back`，不得用全量 seed 順帶修改 Users、member media 或 Home Config。
- Migration、baseline metadata write、content write、media write、relationship cutover 與 destructive cleanup 必須分開報告與批准。
- Payload CLI 顯示 data-loss／dev-schema warning 時停止，不得互動確認後繼續。

## 6. 程式架構邊界

- 所有應用源碼位於 `src/`。
- 路由與 Next.js route boundaries 位於 `src/app/`。
- 業務元件與 domain UI 位於 `src/features/[domain]/`。
- 通用無狀態元件位於 `src/components/`。
- Payload collections／globals／config 位於 `src/payload/`。
- 前台資料讀取必須透過 `src/lib/data/`；route／feature component 不直接呼叫 Payload Local API。
- Domain projection 應由 generated Payload types 的 `Pick`、`Omit` 或 indexed access 派生，不重寫第二份 schema，不使用 `any` 規避型別。
- Secret 不得進入 `"use client"` component、log、report、fixture 或 HTML。

## 7. Schema-first，但不盲目新增 Schema

只有需求真的需要持久化結構變更時才修改 Collection。流程固定為：

1. 讀取現行 Collection、generated types、migration history 與 production inventory。
2. 修改 Payload Collection。
3. 執行 `pnpm exec payload generate:types`。
4. 產生 migration 並人工審查 SQL／up／down。
5. 先在 disposable／local database rehearsal。
6. 提交 Production approval package。
7. 經批准後執行並 read-back。

使用者要求不影響既有資料時，預設 additive、nullable、backward-compatible。Destructive cleanup 必須是獨立 scope。

## 8. UI、媒體與存取

- Tailwind CSS 與現有 shadcn/ui 為主要樣式方式；不新增無必要的第二套 design system。
- 不使用 React inline `style={{}}`；框架自動輸出的 HTML style 不在此限制內。
- 關鍵 route segment 應有合適的 loading／error boundary。
- 缺少媒體時使用既有 `ImageFallback`，但 fallback 是保護機制，不是最終內容完成證據。
- 圖片關聯預設 optional；實際 required business field 必須有需求與 migration 證據。
- 媒體使用 Cloudflare R2 S3 adapter；禁止 Vercel Blob。
- Public／Family access 必須在 collection／data layer 強制，不只在 UI 隱藏。

## 9. 驗證順序

依改動範圍選擇 focused tests。基本順序：

1. Focused unit／regression tests。
2. `pnpm exec payload generate:types`（Collection 變更時）。
3. `pnpm run build`。
4. Build 完成後執行 `pnpm tsc --noEmit`。
5. `git diff --check`。
6. Secret／credential 與 generated migration 審查。
7. Browser／HTTP／Preview QA。

不要並行執行 build 與 TypeScript。Repo 未安裝 Prettier，不要臨時下載 Prettier 作為完成門檻。

Build 通過不等於 runtime、資料或發布完成。若 browser automation 受限，使用 HTTP／rendered HTML／focused test 替代並明確記錄缺口。

## 10. Git、PR 與 Phase 完成

- 從最新 `main` 建立 `codex/phase-*` 或 `codex/docs-*` 分支。
- 不直接 push `main`。
- 每個 commit 應可追溯到本次 scope。
- PR 需記錄 Issue、驗證、資料影響、Preview、已知限制與 rollback。
- 只有真正完成 Issue 所有 acceptance criteria 才使用 `Closes #...`。

Phase 狀態為：

`Implemented → Locally verified → PR ready → Merged → Production verified → Closed`

依 Phase scope，不適用的階段可標記 N/A，但不得省略說明。Phase Completion Report 固定放在 `docs/phase-completion-reports/`，使用中文並包含：

- Scope／out of scope
- Branch／commit／PR／merge
- Delivered work
- Key files
- Validation commands and results
- Browser／Preview／Production QA
- Migration／data／read-back 狀態
- Known limitations／blockers
- Rollback
- Issue closeout
- Next-phase readiness

完整流程見 `docs/phase-execution-playbook.md`。

## 11. 文件治理

- `CONTEXT.md` 只放穩定領域詞彙，不放短期執行狀態。
- 架構契約記錄現行設計與產品要求，不保留過時 schema 當現況。
- ADR 是持久決策；一般 Phase 不靜默改寫。
- `docs/phase-preparation/` 是開工規格，不是完成證據。
- `docs/phase-artifacts/` 存放 dry-run、approval package、migration evidence。
- Completion Report 記錄當時事實；後續狀態用 closeout addendum 或 Phase index 補充，不改寫歷史。
- `docs/prompts/` 的 Phase 1–9 文件是歷史輸入，不得視為現行架構來源。

## 12. 停止條件

遇到下列情況停止高風險動作並回報：

- 文件與現行 schema／ADR 衝突。
- Migration 顯示可能刪除或改寫既有資料。
- Production inventory 與批准基線不同。
- Dry-run 出現未批准 collection、delete、unexpected update 或 conflict。
- Read-back timeout／失敗。
- Preview／Production commit 不一致。
- Public response、metadata 或 JSON-LD 暴露私密資料。
- 操作需要新的 Production／destructive authority。
