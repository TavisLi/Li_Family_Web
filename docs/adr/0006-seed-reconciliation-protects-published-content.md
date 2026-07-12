# Seed reconciliation protects published content

當一類 published content 同時允許版本化 Content source 匯入與 Payload Admin 人工編輯時，seed import 不得把 Source 當成可以無條件覆蓋 Current 的唯一真相。系統必須使用 Base／Source／Current reconciliation，或提供具相同保護能力的機制。

## Decision

- Payload published content 仍是 application runtime source of truth。
- Content source 是可審查、可重複匯入的輸入，不是對 Current content 的無條件覆蓋權。
- Base 代表上次接受的 source projection；Source 代表本次解析結果；Current 代表 Payload 現況。
- Safe mode 是所有 seed-managed published content 的預設模式。
- Missing Base 的既有 record 視為 legacy，預設 `preserve-current`，不得用 Source 猜測或覆蓋。
- Source-only change 可以套用；Current-only change 必須保留；雙方不同修改必須標記 conflict。
- `source-wins` 等覆蓋 Current 的模式必須明確指定、先有 dry-run evidence，並取得 Production mutation 批准。
- Dry-run、schema migration、baseline metadata write 與 content update 是不同風險層級，不得用一次廣泛批准全部涵蓋。
- Seed 命令必須支援足夠窄的 mutation scope。Travel baseline 不得順帶更新 Users、member media、Home Config 或其他 collection。
- Media、relationship、權限／visibility 與文字 projection 應分開報告；一類 action 的批准不代表其他類別也獲准。

## Applicability

本決策適用於同時具備以下兩種寫入來源的資料：

1. Git 內 versioned source／manifest／import source。
2. Payload Admin 或其他人工 published-content 編輯入口。

例如 TravelProjects 符合此條件。未來若 Users、Posts、Timeline Events、Home Config 或其他 collection 同時支援 source import 與 Admin editing，也必須先建立自己的 projection、Base metadata 與 reconciliation policy，才能允許既有 record update。

本決策不要求所有 collection 共用同一份 projection。共用的是 state machine 與安全原則；每個 domain 仍需定義自己的 identity、source projection、Admin override、media projection 與 conflict granularity。

純 Admin-owned、純系統產生，或沒有外部 source import 的資料不需要為了形式而增加 Base metadata。

## Consequences

- 一般 seed 可以建立缺少的 record，但更新既有 published content 前必須先證明不會覆蓋 Admin change。
- 在某 collection 尚未建立 reconciliation 前，既有 record 應預設 preserve；需要更新時使用獨立、明確批准的受控流程。
- Production dry-run 必須顯示 create、update、preserve、conflict、skip 與 delete count，並列出 mutation scope。
- 跨 collection 的全量 seed 不再適合作為單一功能 baseline 的預設 Production 寫入入口。
- 第一個具體實作是 Phase 16 Travel seed reconciliation；它是此原則的 reference implementation，不是只限 Travel 的例外規則。

## Considered alternatives

- **Markdown 永遠覆蓋 Payload**：拒絕。會讓 Admin 修正靜默遺失。
- **Payload 永遠覆蓋 Source**：拒絕。會失去 versioned source 的可重複部署與審查價值。
- **固定宣告每個欄位只屬於 Source 或 Admin**：不足。同一欄位可能先由 Source 建立、後由 Admin 修正；仍需要 Base 判斷實際變化。
- **只靠操作者記得不要跑錯命令**：拒絕。安全範圍必須由 dry-run 與命令 scope 在程式上強制。
