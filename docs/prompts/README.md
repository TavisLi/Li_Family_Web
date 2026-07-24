# Historical Phase Prompts

本目錄保存 Phase 1–9 的歷史執行輸入，用於理解當時 scope 與決策背景。

這些 prompt：

- 不是現行架構 source of truth。
- 可能包含已被後續 Phase、ADR、schema 或 deployment 取代的內容。
- 不得直接複製成新 Phase 指令。
- 不得覆蓋 `CONTEXT.md`、accepted ADR、現行架構文件、Payload Collections 或 Phase Playbook。

新的 substantive work 應使用：

1. GitHub Issue／PRD 或使用者在對話中直接描述的需求。
2. [`../templates/phase-preparation-template.md`](../templates/phase-preparation-template.md)。
3. [`../phase-execution-playbook.md`](../phase-execution-playbook.md)。

需求由對話直接提出時，代理先整理 Issue 草稿與 acceptance criteria；使用者批准發布後才建立 GitHub Issue。需要將複雜需求形成 PRD 時，先取得 `to-prd` publication approval；需要拆成多個 Issues 時，再依 `to-issues` 流程取得 breakdown approval。
