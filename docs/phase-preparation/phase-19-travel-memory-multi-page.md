# Phase 19 Preparation — Travel Memory 多頁回憶與可配置視覺樣式

狀態：Locally verified；雙軸 review 通過；PR ready
建議分支：`codex/phase-19-travel-memory-prototype`
Owning PRD：[#73](https://github.com/TavisLi/Li_Family_Web/issues/73)
預計 Completion Report：`docs/phase-completion-reports/phase-19-travel-memory-multi-page.md`

## 0. Intake Source

- [x] 使用者在對話中直接描述
- [ ] 既有 GitHub Issue
- [x] 已批准 PRD
- [x] 已批准九個 vertical-slice Issue drafts 與 publication

### PRD／Issue 關係

- Parent PRD：[#73](https://github.com/TavisLi/Li_Family_Web/issues/73)。
- 本 Phase 包含：prototype／contract、presentation styles、海南 Day 3、海南 Day 8、YouTube placement、story-linked gallery、Production schema、backfill、runtime cutover 九個 slices。
- Issue granularity、依賴、YouTube 獨立 slice、三段 rollout 及三筆初始樣式配對均已批准。
- Phase 19 可完成本地實作、migration rehearsal、Preview-ready evidence；Production mutation、merge／release 與 Issue closeout仍需各自過閘。

## 1. 問題與產品目標

現行 Travel Memory 把摘要、每日亮點、帳本、照片、影片與長篇 sections 放在單一長頁。每日卡片固定截斷六天，manifest caption 沒有回到正確照片位置，`sectionId` 又被錯誤視為 Markdown anchor，YouTube 只集中在頁尾。Phase 19 將一趟回憶改成旅行首頁、每日章節與相簿多頁作品，並讓每筆 Memory 選擇一種完整支援的視覺樣式。

## 2. Scope

### In scope

- `travel-memories.presentationStyle` 三值配置與 deterministic fallback。
- 獨立 `travel-memory-days` collection；Day 內含穩定 Moments 與 photo／YouTube placements。
- Style-neutral overview／day／gallery data interfaces。
- 三個正式 renderer：Editorial journal、Cinematic timeline、Family scrapbook。
- `/travel/[slug]` Memory overview、`/travel/[slug]/day/[dayKey]`、`/travel/[slug]/photos`。
- 海南 Day 3／Day 8 caption placement regression；真實日期 YouTube placement contract。
- Additive migration、local rehearsal、Production approval packages 與 rollback evidence。
- 舊 Memory fields／runtime 保留為回退路徑。

### Out of scope

- Production schema migration、content/media write 或 runtime cutover，除非另行批准。
- Merge 或 Production-triggering release，除非 H9 批准。
- Legacy arrays、relationships、source evidence 的刪除。
- Travel Plan redesign、共用 parent collection、地圖／GPS、人臉辨識或影片檔上傳。

## 3. Acceptance Criteria

- [x] 三種樣式均透過相同 view models 呈現 Overview、Day、Photos、caption、YouTube 與 access／empty states。
- [x] 海南首頁列出 Day 1–8；Day 3／8 有獨立 route 與相鄰導航。
- [x] 海南四張重點照片依 dayKey／momentKey 呈現 manifest caption，不與 Media altText 混用。
- [x] YouTube 可定位 Day／Moment，使用 privacy-enhanced lazy iframe、無 autoplay與安全 fallback。
- [x] Gallery 可按 Day 篩選、顯示 caption，並返回 Daily Moment。
- [x] Public／Family／draft child route 不弱化 owning Memory access。
- [x] Migration additive、nullable、無 drop／rename／content write；Production rollout 三段獨立批准。
- [x] Focused tests、generated types、build、post-build TypeScript、diff check 與 browser QA 通過。

## 4. 授權矩陣

| 動作 | 狀態 | 說明／所需證據 |
| --- | --- | --- |
| 發布／修改 GitHub Issue | Completed | #73–#82 已發布並回讀；皆有 `ready-for-agent`。 |
| 本地文件／程式修改 | Approved | Phase 19 scope。 |
| Preview deployment | Not approved | 可準備 Draft PR；部署需確認 Vercel 行為。 |
| Production read-only | Not approved | 可準備 query 清單。 |
| Production migration | Not approved | 需 migration review、local rehearsal、inventory、H5。 |
| Production content／media write | Not approved | 需 dry-run counts、rollback、H6。 |
| Destructive cleanup | Not approved | 本 Phase 明確排除。 |

## 4.1 HITL Decisions

| Gate | 狀態／證據 |
| --- | --- |
| H1 Scope／acceptance | 已批准 PRD、九個 slices 與初始樣式配對。 |
| H2 Issue publication | 已完成：#73–#82。 |
| H3 Architecture／visual | 三種樣式均正式支援；本文件採獨立 Day＋內嵌 Moment／Placement。 |
| H4 Production access | 未批准。 |
| H5 Production migration | 未批准。 |
| H6 Production content write | 未批准。 |
| H8 Destructive cleanup | 未批准且 out of scope。 |
| H9 Merge／release | 未批准。 |
| H10 Phase acceptance | 待 completion evidence。 |

## 5. Current-state Evidence

- Branch／HEAD：`codex/phase-19-travel-memory-prototype`／`d0ba20a`，與 `main`、`origin/main` 一致。
- Existing dirty files：本 Phase 已核准的 PRD、Issue drafts、本地 prototype route／assets；preflight 前無其他 dirty files。
- Node：shell 預設 26.5.0；所有 repo commands 固定使用 Node 20.20.2 runtime path。
- Repo implementation：Memory 仍用單一詳情頁、`dailyHighlights`、`storySections`、legacy gallery／itinerary arrays 與頁尾 `externalVideos`。
- Caption defect：`travel-section-media.ts` 將 manifest `sectionId` 與 parser `sourceSections.anchor` 直接相等比較。
- Production runtime／data：本 Phase 未取得 read-only access；不以歷史 evidence 冒充現況。

## 6. 必讀上下文

- `CONTEXT.md`
- `docs/全栈系统需求与技术架构说明书.md`
- `docs/adr/0003-travel-slugs-own-source-and-asset-identity.md`
- `docs/adr/0007-travel-plans-and-memories-are-separate-records.md`
- `docs/data-models/travel-domain-schema.md`
- `docs/travel-projects.md`
- 現行 Memory collection、travel runtime/data layer、routes、renderer、seed projection、manifest parser 與 focused tests。

## 7. Proposed Minimal Design

- Memory 保持 aggregate identity；新增 nullable `presentationStyle`。Payload Admin owns this field，source import 不管理。
- 新增 `travel-memory-days`，以 owning Memory relationship＋`dayKey` 組合形成 stable identity。Day 包含 date、title、theme、story、meals、lodging 與有序 Moments。
- Moment 以 `momentKey` 識別，內嵌 placements。Placement 以穩定 `placementKey` 識別，type 為 photo 或 YouTube；caption、time、location、role 與 order 屬 placement，Media altText 留在 asset。
- Renderer registry 對三個 select 值 exhaustive mapping；缺值／未知值 fallback `editorial-journal`。
- Child reads 先由 access-aware Memory query取得 owner，再查 Days；collection access 同步保護 Admin／Family／Public direct API。
- Legacy arrays 在 cutover觀察期保留；沒有新 Days 時現行 Memory page仍可回退。

## 8. Alternatives and Tradeoffs

| 方案 | 優點 | 代價／風險 | 決策 |
| --- | --- | --- | --- |
| Days／Moments／Placements 全嵌入 Memory | collection 最少 | Admin 巨型表單、每日 query／版本不可獨立 | 拒絕 |
| Day、Moment、Placement 各自 collection | query 最靈活 | 三層關聯、migration／Admin操作過重 | 拒絕 |
| 獨立 Day，內嵌 Moments／Placements | 每日可獨立編輯；只新增一 collection | Gallery 需聚合 Days | 採用 |
| 三種樣式各自 schema | renderer 自由 | 內容重複、reconciliation 分叉 | 拒絕 |

## 9. Data／Migration Plan

- Schema impact：一個 nullable Memory select＋一個 additive Day collection。
- Existing-record impact：migration 不回填；missing style fallback；legacy runtime 保留。
- Migration type：additive、nullable、backward-compatible。
- Local rehearsal：generated migration 在 disposable PostgreSQL 執行 up／down／up，檢查無 drop／unexpected rewrite。
- Production sequence：inventory → schema apply/read-back → separate content backfill/read-back → Preview → separate runtime cutover。
- Rollback：cutover 前不依賴新 fields；cutover 後可回退舊 runtime，資料不刪除。
- Stop：data-loss warning、inventory drift、unresolved reconciliation conflict、read-back failure、private child leakage。

## 10. Implementation Steps

1. Schema／projection contract test → verify: style fallback、dayKey／momentKey／placementKey。
2. Additive collections＋generated types → verify: focused collection tests與 migration review。
3. Day 3 tracer route＋renderer registry → verify: visible captions／navigation／access。
4. Day 8、完整 Overview、YouTube與 Gallery → verify: route-facing integration tests。
5. Local rehearsal＋browser matrix → verify: build、tsc、desktop／mobile／metadata。
6. Review、commit、Draft PR與 approval packages → verify: two-axis review、PR read-back。

## 11. Test and QA Matrix

| 層級 | 驗證 | 預期 |
| --- | --- | --- |
| Projection | Source → Day／Moment／Placement | 8 Days、11 Hainan photos、captions preserved、0 wrong-day guessing |
| Data interface | Overview／one Day／Gallery | bounded, access-aware, style-neutral |
| Renderer | all three styles × key views | coherent style、same content contract |
| YouTube | dated source、invalid URL、empty | correct Day、nocookie、lazy、no autoplay、safe fallback |
| Build | `pnpm run build` | Pass |
| TypeScript | `pnpm tsc --noEmit` after build | Pass |
| Diff | `git diff --check` | Pass |
| Browser | Hainan overview／Day 3／Day 8／photos desktop＋mobile | no overflow、caption and navigation visible |
| Public／Family | owner and direct child routes | no privacy regression |
| Production／read-back | Not authorized | approval packages only |

## 12. Risks and Stop Conditions

- `sectionId` 與 Markdown anchor 繼續混用。
- Child collection access無法證明與 owner一致。
- Generated migration含 drop、rename或既有 content mutation。
- Prototype code被直接當正式 code 使用。
- GitHub／Preview／Production state與本地 commit不一致。

## 13. Completion Definition

- [x] Implemented
- [x] Locally verified
- [x] PR ready（push／Draft PR 尚未授權）
- [ ] Merged（H9）
- [ ] Production verified（H5／H6／H9）
- [ ] Closed（H10）
