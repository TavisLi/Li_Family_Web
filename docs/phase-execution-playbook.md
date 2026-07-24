# Web Li Phase Execution Playbook

版本：1.0
更新日期：2026-07-24
適用範圍：Phase、跨領域功能、schema／seed／Production data、重大文件治理與 release closeout。

## 1. 目的

本 Playbook 將 Phase 1–17 的交付經驗收斂成同一條可執行流程。它解決四個重複出現的問題：

1. Build、merge、deployment、data sync 與 phase close 被混為同一狀態。
2. 一般 Phase 指令被錯誤延伸成 Production write 或 destructive cleanup 授權。
3. 舊 prompt／completion report 被當成現行 repo truth。
4. Completion Report 在 PR 或 Production 真實狀態尚未確定時過早宣稱完成。

## 2. Phase 狀態模型

每個 Phase 使用下列狀態：

```text
Proposed
  ↓
Ready
  ↓
Implementing
  ↓
Locally verified
  ↓
PR ready
  ↓
Merged
  ↓
Production verified
  ↓
Closed
```

不需要部署或資料操作的 Phase，可將不適用階段標記 `N/A`，但 Completion Report 必須說明原因。

## 3. Gate 0：Intake、需求載體與授權

### 3.1 需求啟動方式

Phase 可以由兩種方式啟動：

1. **對話中直接描述需求**：使用者說明問題、目標或期望結果。
2. **引用 GitHub Issue／PRD**：使用者指定既有 Issue、Issue URL 或已批准 PRD。

直接描述需求不代表授權代理自動在 GitHub 建立 Issue。代理先把需求正規化為 scope、acceptance criteria、risks 與授權矩陣；是否發布至 GitHub 是獨立的 HITL 決策。

### 3.2 PRD、Issue、Phase、PR 的關係

| 載體 | 回答的問題 | 粒度 |
| --- | --- | --- |
| PRD | 為什麼做、為誰做、做什麼、成功是什麼、有哪些邊界與取捨？ | 一個產品問題或較完整能力 |
| GitHub Issue | 哪個可獨立領取、端到端完成並驗收的垂直切片？ | 一個可交付工作單元 |
| Phase | 本輪要共同完成與結案的交付容器 | 可包含一個或多個 Issues |
| Pull Request | 哪些實作變更正在被審查、Preview 與合併？ | 可完成一個或多個相關 Issues |

- 簡單、邊界清楚的需求可直接由一個 Issue 承載精簡 PRD，不需要另建長文件。
- 跨模組、具多個 user stories、資料遷移或多個可獨立交付部分的需求，先形成 PRD。
- 一個 PRD 可以拆成多個 tracer-bullet Issues；每個 Issue 必須是可 demo／驗證的端到端 vertical slice，不按 schema／API／UI 拆成水平工作。
- Phase 與 Issue 不要求一對一，但 Completion Report 必須列出本 Phase 實際涵蓋與仍未完成的 Issues。
- PR 只有在 Issue acceptance criteria 全部完成時才使用 `Closes #...`；部分完成使用 `Related to #...`。

### 3.3 PRD 如何保存

- 新 PRD 發布後，以 repository 的 GitHub PRD Issue 為 canonical record；Phase preparation、child Issues、PR 與 Completion Report 都引用同一 URL。
- 對話或 Codex task 中整理的版本在發布前只是草稿，不視為正式 PRD。
- 小幅澄清可以編輯原 PRD Issue，並用 comment 留下變更原因與影響；不得靜默改寫已批准的 acceptance criteria。
- 若需求改變了產品目標、核心 domain、privacy boundary 或 data ownership，應建立新版 PRD Issue並標示 supersedes／superseded by，保留舊 Issue 供追溯。
- 已批准且需長期約束實作的架構決策，另同步到 ADR／架構說明；不把完整 PRD 複製到 `docs/` 形成第二份真相來源。
- `docs/superpowers/specs/` 既有 PRD 是歷史快照，不作為新 Phase 的預設保存位置。

### 3.4 何時使用 `to-issues`

當已有 plan、spec 或 PRD，需要拆成多個可獨立執行的 GitHub Issues 時使用 `to-issues`：

1. 根據 domain glossary、ADR 與 repo truth 草擬 vertical slices。
2. 向使用者展示每個 slice 的 title、blocked-by 與 covered user stories。
3. 使用者確認粒度、拆分與依賴。
4. 只有在使用者批准發布後，才依 dependency order 建立 GitHub Issues。

`to-issues` 不因一般需求描述自動觸發 GitHub mutation，也不修改或關閉 parent Issue。

### 3.5 何時使用 `to-prd`

`to-prd` 將目前對話與 repo understanding 綜合成 PRD，確認 testing seam 後直接發布到 GitHub Issue tracker。因為它包含外部寫入，只有使用者明確批准「產生並發布 PRD」時才能調用。

不需要 PRD：

- 單一 bug、內容或文件修正。
- 單一角色與一個清楚的 end-to-end behavior。
- 沒有新的 domain、privacy、schema 或 Production data 取捨。
- 一份 Issue 的 problem、solution、acceptance criteria 足以完整驗收。

建議 PRD：

- 多個角色、user journeys 或產品狀態。
- 跨多個 domain／module。
- 需要產品、架構、access、data ownership 或外部服務取捨。
- 可能包含多個獨立 vertical slices、PRs 或 Phases。
- 一份短 Issue 無法清楚定義完整成功條件。

必須先取得產品決策再形成 PRD：

- 改變核心 domain model。
- 改變 Public／Family boundary。
- 改變長期 content／data ownership。
- 引入具成本、lock-in 或營運責任的新 external service。

使用 `to-prd` 前，對話中應已有足夠的 Problem、Solution direction、Out of scope 與 test seam。技能不重新訪談；若資訊仍不足，先在對話中釐清，不要用 PRD 填補未知決策。

### 3.6 兩條標準入口

#### 使用者在對話中直接描述

```text
需求描述
  → 代理整理 Issue 草稿＋acceptance criteria
  → 使用者確認／批准發布
  → GitHub Issue
```

若複雜度達 PRD 門檻：

```text
需求描述
  → 建議 PRD並說明原因
  → 確認 test seam
  → 使用者批准調用 to-prd
  → 發布 PRD Issue
  → 如需拆分，草擬 vertical slices
  → 使用者批准拆分
  → 發布 child Issues
```

#### 使用者先建立 GitHub Issue

代理讀取完整 body／comments 後分類：

- **Executable**：problem、scope、acceptance、authority 足夠，進入 Phase preflight。
- **Needs clarification**：小範圍缺口，提出補充草稿；批准後 comment／edit Issue。
- **Epic／PRD-sized**：建議形成 PRD或使用 `to-issues` 拆分；未經批准不另建 Issue。

### 必要輸入

- GitHub Issue／PRD／使用者批准的工作說明。
- Phase 名稱與建議分支。
- 產品目標與實際問題。

### 必須寫清楚

- In scope
- Out of scope
- Acceptance criteria
- Owning domain
- 預期修改檔案／資料
- 不可接受的回歸

### 授權矩陣

| 動作 | 是否已批准 | 所需證據 |
| --- | --- | --- |
| 發布／修改 GitHub Issue | 明列 | Approved issue draft／breakdown |
| 本地文件／程式修改 | 明列 | Scope |
| Preview deployment | 明列 | PR／Preview plan |
| Production read-only | 明列 | Query／route scope |
| Production migration | 個別批准 | Migration review、rehearsal、inventory |
| Production content／media write | 個別批准 | Dry-run、mutation counts、rollback |
| Destructive cleanup | 獨立批准 | Backup、observation、approval token、read-back |

缺少批准時可以準備 evidence，但不得執行對應 mutation。

## 4. Human-in-the-loop（HITL）關鍵節點

HITL 的目的不是讓每個技術步驟都停下等待，而是在人類必須承擔產品取捨、外部發布、Production 風險或不可逆後果時建立明確決策。

### 4.1 必要 HITL

| 節點 | 需要人類決定什麼 | 代理在批准前可以做什麼 |
| --- | --- | --- |
| H1 需求正規化 | Scope、out of scope、acceptance criteria 是否符合原意 | Repo exploration、草擬需求 |
| H2 Issue publication | 是否將草稿／拆分發布或修改到 GitHub | 草擬 PRD、Issue 與 dependency graph |
| H3 產品／架構取捨 | 選擇會改變使用者行為、domain model、privacy 或 supersede ADR 的方案 | 提供 alternatives、tradeoffs、prototype／evidence |
| H4 Production access | 是否允許讀取私密 Production data／logs，scope 多大 | 準備唯讀 query／route 清單 |
| H5 Production migration | 是否執行已審查 migration | Inventory、migration review、local rehearsal、approval package |
| H6 Production content／media write | 是否執行 create／update／upload | Dry-run、mutation counts、rollback |
| H7 Conflict resolution | Source／Payload／人工合併哪一方被接受 | Conflict register、diff、建議 |
| H8 Destructive cleanup | 是否 drop、delete、rewrite 或移除 rollback evidence | Backup、observation、drift check、cleanup rehearsal |
| H9 Merge／release | 是否合併會觸發 Production 的 PR | 完成本地驗證、Preview、review summary |
| H10 Phase acceptance | 是否接受已知限制、關閉 Phase／Issue 或另開 follow-up | Completion evidence、blocker／follow-up draft |

### 4.2 條件式 HITL

以下只有在會實質改變結果時才停下：

- 多個合理的 UI／視覺方向。
- Public／Family visibility 改變。
- 新 external service、成本或 lock-in。
- 測試資料可能進入 Production。
- Scope expansion 或跨 domain refactor。
- Rollback 會回退使用者可見功能或丟失新資料。

### 4.3 可預先授權

使用者可以明確預先授權一組可逆、邊界清楚的動作，例如「完成文件修改、commit、push 並建立 Draft PR」。預先授權必須列出：

- Target
- Allowed actions
- Excluded actions
- Stop conditions
- 有效期間／Phase

預先授權不涵蓋未列出的 Production mutation 或 destructive action。

## 5. Gate 1：Preflight

1. `git fetch origin`。
2. 確認 `main` 與 `origin/main`。
3. 執行 `git status --short --branch`。
4. 記錄使用者既有 dirty／untracked files。
5. 確認 Node `20.20.2`。
6. 讀取：
   - `CONTEXT.md`
   - 相關 ADR
   - 架構契約
   - Owning domain docs
   - 現行 source／schema／data layer／renderer／tests
7. 檢查相關 Issue、PR、Vercel deployment 與 Production evidence。
8. 從最新 `main` 建立 `codex/phase-*` 分支。

### Gate output

- Current-state snapshot
- Dirty-file boundary
- Relevant decisions
- Known blockers
- Branch

## 6. Gate 2：Repo truth 與差距分析

將每項需求分類：

| 層級 | 問題 |
| --- | --- |
| Source | Catalog／Markdown／manifest 是否正確？ |
| Schema | Payload Collection 是否能表達需求？ |
| Migration | 目標環境是否已有 schema？ |
| Runtime data | Payload records／relationships 是否存在？ |
| Data layer | `src/lib/data/` 是否正確讀取與限制？ |
| UI | Route／feature 是否渲染正確？ |
| Access | Public／Family／Admin boundary 是否正確？ |
| Deployment | Preview／Production 是否使用對應 commit？ |
| Operations | Read-back、rollback、營運方式是否存在？ |

不要因為某一層已完成就宣稱整體完成。

## 7. Gate 3：實施規格

Substantive Phase 使用 `docs/templates/phase-preparation-template.md`，至少包含：

- Problem statement
- User stories／acceptance criteria
- Current architecture seam
- Proposed minimal design
- Alternatives and tradeoffs
- Test plan
- Browser／route QA matrix
- Data and migration plan
- Rollback
- Stop conditions
- Completion Report path

若提案衝突 ADR，必須先新增 superseding ADR，經批准後才能實作。

## 8. Gate 4：最小實作

1. 先建立能證明需求的 regression／contract test。
2. 修改最小必要 seam。
3. Schema 變更先改 Payload Collection，再生成 types。
4. 不建立只用一次的抽象。
5. 不修改相鄰、不在 scope 的格式或程式。
6. 變更造成的 unused code 可以清除；既有 dead code 不在本 Phase 清除。
7. 每個 changed line 都要能追溯到 acceptance criterion。

## 9. Gate 5：資料與 Migration

### 9.1 風險分層

1. Read-only inventory
2. Additive nullable schema
3. Baseline metadata write
4. Content／media create or update
5. Relationship cutover
6. Destructive cleanup

每一層都有獨立批准；不能以「已批准 migration」推導「已批准 content write」。

### 9.2 固定順序

1. Production inventory
2. Collection change
3. Generate types
4. Generate migration
5. Review generated migration
6. Disposable/local rehearsal
7. Negative／drift rehearsal
8. Approval package
9. Production apply
10. Migration record read-back
11. Record／relationship read-back
12. Runtime smoke
13. Observation window
14. Separate destructive cleanup decision

### 8.3 Seed-managed published content

- Base／Source／Current reconciliation。
- Default safe mode。
- Dry-run 必須顯示 create、update、preserve、conflict、skip、delete 與 collection scope。
- Travel 使用 travel-only commands。
- Conflict 未處理時不執行 source-wins。
- Payload export 只能寫入 parser-safe artifacts，不直接覆蓋 source。

## 10. Gate 6：本地驗證

依風險選擇 focused tests，然後依序：

```bash
pnpm run build
pnpm tsc --noEmit
git diff --check
```

有 Collection 變更時先執行：

```bash
pnpm exec payload generate:types
```

### 驗證要求

- Build 與 TypeScript 不並行。
- 不臨時安裝 Prettier。
- 檢查 secret、credential、cookie、private response。
- 檢查 generated migration 沒有重播歷史 schema 或意外 drop。
- 檢查 working tree 沒有混入非 scope files。

## 11. Gate 7：PR 與 Preview

PR 至少包含：

- Summary
- Related Issues
- In／out of scope
- Test evidence
- Preview URL／check
- Data／migration status
- Security／privacy impact
- Known limitations
- Rollback

Preview QA 至少按適用範圍覆蓋：

- Public desktop
- Public mobile
- Family mode
- Admin
- Loading／error／empty state
- Metadata／JSON-LD
- R2 image
- Dynamic route
- Interaction write/read-back

Vercel `READY` 只證明 deployment build 完成，不證明 route、database、metadata 或 access 正確。

## 12. Gate 8：Merge 與 Production

1. 確認 PR checks、review 與 mergeability。
2. 合併後記錄 merge commit。
3. 確認 Production deployment 對應該 commit。
4. 驗證關鍵路由 HTTP status。
5. 檢查實際 HTML，不只看 client shell。
6. 檢查 canonical、Open Graph、Twitter image 使用正式網域。
7. 檢查 runtime errors／5xx。
8. 驗證 Public／Family access。
9. 有資料變更時完成 full read-back。
10. 記錄 observation window 與 rollback candidate。

程式 rollback 不會回復 Payload／Supabase mutation；資料 rollback 必須使用已批准的獨立方案。

## 13. Gate 9：Closeout

使用 `docs/templates/phase-completion-report-template.md`。

### Phase Closed 必須滿足

- Acceptance criteria 全部有 evidence。
- Branch／commit／PR／merge 狀態真實。
- 適用的 Preview／Production QA 完成。
- 適用的 migration／data read-back 完成。
- Blocker 已解決或轉成明確 Issue。
- Completion Report 已進入 PR／main。
- Issue 只有在所有條件完成時才 close。
- Local `main` 已同步；feature branch cleanup 是刻意且安全的。

若 Phase 需要下一階段，先完成本 Phase closeout，再寫基於已合併證據的 preparation doc。

## 14. Completion Report 誠實性規則

- 不用舊 evidence 代替新的失敗 read-back。
- 不把「PR open」寫成「已合併」。
- 不把「Vercel READY」寫成「Production verified」。
- 不把「來源檔已更新」寫成「Production data 已同步」。
- 不把 fallback 顯示寫成最終 media 完成。
- 不隱藏使用者 dirty files 或 browser QA blocker。
- 報告保留當時事實；後續用 addendum 或 Phase index 更新最終狀態。

## 15. Phase 1–17 的可重用門檻

- Schema-first 必須以真實需求為前提，不為推測新增欄位。
- Dynamic route、data layer、generated types 是跨 Phase 架構底線。
- Access boundary 在 data／collection layer。
- Content parity 是 release gate。
- Media 使用 diff-based sync，避免全量重傳。
- Node 20.20.2 是 Payload tooling baseline。
- 視覺 annotation 應在 Preview merge 前收斂。
- Admin edits 必須受 reconciliation 保護。
- Plan／Memory 是獨立 aggregate。
- Legacy cleanup 永遠晚於 cutover、read-back、觀察與獨立批准。
