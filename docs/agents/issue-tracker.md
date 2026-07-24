# Issue Tracker：GitHub

Issues 與 PRDs 使用 repository `TavisLi/Li_Family_Web` 的 GitHub Issues。Pull Request 是實作／審查載體，不是需求收件匣。

## 1. 需求入口

需求可以：

1. 在對話中直接描述。
2. 引用既有 GitHub Issue／URL。
3. 引用已批准 PRD。

直接描述需求時，代理先整理 scope、acceptance criteria、risks 與授權；不得因為 repository 使用 GitHub Issues 就自動發布外部 Issue。發布／修改 Issue 是 HITL gate。

## 2. PRD、Issue、Phase、PR

| 載體 | 作用 |
| --- | --- |
| PRD | 定義產品問題、使用者、目標、非目標、user stories、成功指標與取捨。 |
| Issue | 一個可獨立領取、端到端完成、可驗收的 vertical slice。 |
| Phase | 一輪共同交付容器，可包含一個或多個 Issues。 |
| PR | 實作、Preview、review、merge 的技術載體，可完成一個或多個 Issues。 |

簡單需求可以由一個 Issue 同時承載精簡 PRD。複雜需求先形成 PRD，再拆成 tracer-bullet Issues。

## 3. PRD 保存與版本

- 新 PRD 的 canonical record 是 repository 內的 GitHub PRD Issue；Issue URL 是後續 Phase、child Issues、PR 與 Completion Report 的共同引用。
- 對話中的內容在發布前只是草稿，不視為已保存或已批准的 PRD。
- 發布後的小幅澄清直接編輯 PRD Issue，並以 comment 記錄變更原因、日期與受影響的 acceptance criteria／child Issues。
- 若變更已改寫目標、核心 domain model、Public／Family boundary 或 data ownership，先取得新的產品批准，再以新版 PRD Issue supersede 舊 PRD；舊 Issue 保留並互相連結，不覆寫歷史。
- ADR 與架構文件只承接已批准、需要長期約束實作的決策，不複製整份 PRD。
- `docs/superpowers/specs/` 內既有 PRD 是 Phase 14–15 的歷史快照；保留供追溯，不作為新 PRD 的預設保存位置。

GitHub Issue 不等同於 Git commit：它保存產品需求、討論、狀態與批准紀錄；repository 文件保存長期架構契約及實際交付紀錄。

## 4. `to-issues` Workflow

已有 plan、spec 或 PRD 且需要拆分時：

1. 依 `CONTEXT.md` 與 ADR 草擬 vertical slices。
2. 每個 slice 應穿過所需 schema／data／UI／test，完成後可 demo 或驗證。
3. 向使用者展示 title、blocked-by、covered user stories。
4. 使用者確認粒度、合併／拆分與 dependency。
5. 取得發布批准後，依 dependency order 建立 Issues。
6. 新 Issues 使用 `ready-for-agent` 或使用者指定的正確 triage label。

不得自動修改或關閉 parent Issue。

## 5. `to-prd` Workflow

`to-prd` 適合一個普通 Issue 無法完整承載的產品問題：

- 多個 actors／user journeys。
- 跨多個 modules／domains。
- 需要 architecture、privacy、schema、data ownership 或 external-service 決策。
- 預計拆成多個 vertical slices、PRs 或 Phases。

不適用於單一 bug、清楚的小功能或文件更新；這些由一個具 acceptance criteria 的 Issue 承載即可。

調用前：

1. 對話中已有 Problem、Solution direction、Out of scope。
2. 代理探索 repo truth。
3. 代理提出最高、最少的 testing seams。
4. 使用者確認 seams 並批准發布 PRD。

`to-prd` 會直接發布 GitHub PRD Issue，因此沒有明確 publication approval 時只能準備草稿，不能調用。

發布 PRD 後，若仍需拆分，才進入 `to-issues` 的 breakdown approval 流程。

## 6. Issue Body

每個 executable Issue 至少包含：

```markdown
## Parent

Parent PRD／Issue（如適用）

## What to build

描述端到端行為與使用者結果。

## Acceptance criteria

- [ ] 可驗證條件

## Blocked by

- Issue reference，或 None
```

檔案清單與易過時的程式細節留在 implementation plan／PR，不作為 Issue 主體。

## 7. Close Semantics

- 完成全部 acceptance criteria：PR 可使用 `Closes #123`。
- 只完成部分、準備工作或保留 cleanup：使用 `Related to #123`。
- Completion Report 必須列出 closed、remains open、follow-up Issues。
- Phase merge 不自動等於 Issue close。

## 8. CLI

```bash
gh issue view <number> --comments
gh issue list
gh issue create --title "..." --body "..."
gh issue comment <number> --body "..."
gh issue edit <number> --add-label "..."
gh issue close <number> --comment "..."
```

所有 create／edit／comment／close 都是外部寫入，必須符合使用者批准的 target 與 scope。
