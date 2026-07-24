# Phase XX Preparation — [名稱]

狀態：Proposed／Ready
建議分支：`codex/phase-xx-short-name`
Owning Issue／PRD：[#XX](https://github.com/TavisLi/Li_Family_Web/issues/XX)
預計 Completion Report：`docs/phase-completion-reports/phase-xx-short-name.md`

## 0. Intake Source

- [ ] 使用者在對話中直接描述
- [ ] 既有 GitHub Issue
- [ ] 已批准 PRD
- [ ] 其他：

### PRD／Issue 關係

- Parent PRD／Issue：
- 本 Phase 包含的 vertical-slice Issues：
- Issue draft／breakdown 是否已由使用者批准：
- 是否達到 PRD 門檻，理由：
- `to-prd` publication approval（如適用）：

## 1. 問題與產品目標

以使用者可理解的方式描述目前問題、為什麼值得在本 Phase 解決，以及成功後的產品影響。

## 2. Scope

### In scope

-

### Out of scope

-

## 3. Acceptance Criteria

- [ ]
- [ ]

## 4. 授權矩陣

| 動作 | 狀態 | 說明／所需證據 |
| --- | --- | --- |
| 發布／修改 GitHub Issue | Approved／Not approved | |
| 本地文件／程式修改 | Approved／Not approved | |
| Preview deployment | Approved／Not approved | |
| Production read-only | Approved／Not approved | |
| Production migration | Approved／Not approved | |
| Production content／media write | Approved／Not approved | |
| Destructive cleanup | Approved／Not approved | |

## 4.1 HITL Decisions

| Gate | Decision owner | 何時需要 | Approval evidence |
| --- | --- | --- | --- |
| Scope／acceptance | Product owner | Phase ready 前 | |
| Issue publication | Product owner | GitHub write 前 | |
| Architecture／privacy | Product owner／maintainer | 改變 domain／ADR／visibility 時 | |
| Production migration／write | Site owner | Mutation 前 | |
| Conflict resolution | Content／site owner | Source／Current conflict 時 | |
| Destructive cleanup | Site owner | Drop／delete 前 | |
| Merge／release | Maintainer | Production-triggering merge 前 | |
| Phase acceptance | Product owner | Closeout | |

## 5. Current-state Evidence

- Branch／HEAD：
- Related PR／deployment：
- Repo implementation：
- Production runtime：
- Production data：
- Existing dirty files：

## 6. 必讀上下文

- `CONTEXT.md`
- `docs/全栈系统需求与技术架构说明书.md`
- Related ADR：
- Owning domain docs：
- Relevant source／schema／data layer／renderer／tests：

## 7. Proposed Minimal Design

描述準備修改的 seam、資料流與不變項。若涉及 schema，說明為何現行 Collection 無法表達需求。

## 8. Alternatives and Tradeoffs

| 方案 | 優點 | 代價／風險 | 決策 |
| --- | --- | --- | --- |
| | | | |

## 9. Data／Migration Plan

- Schema impact：
- Existing-record impact：
- Migration type：
- Dry-run／inventory：
- Before／after verification：
- Rollback：
- Stop conditions：

不涉及資料時填寫 `N/A`。

## 10. Implementation Steps

1. [工作] → verify: [證據]
2. [工作] → verify: [證據]
3. [工作] → verify: [證據]

## 11. Test and QA Matrix

| 層級 | 驗證 | 預期 |
| --- | --- | --- |
| Focused test | | |
| Build | `pnpm run build` | Pass |
| TypeScript | `pnpm tsc --noEmit` | Pass |
| Diff | `git diff --check` | Pass |
| Preview desktop／mobile | | |
| Public／Family | | |
| Metadata／JSON-LD | | |
| Production／read-back | | |

## 12. Risks and Stop Conditions

-

## 13. Completion Definition

明列哪些 Phase 狀態適用：

- [ ] Implemented
- [ ] Locally verified
- [ ] PR ready
- [ ] Merged
- [ ] Production verified／N/A
- [ ] Closed
