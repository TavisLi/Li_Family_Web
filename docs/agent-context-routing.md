# Agent context lookup

這是按需查詢索引，不是開工清單。先處理 task 與實際 seam；只有需釐清契約、變更契約或控制相關風險時，讀能解答問題的 owner 段落。不要依「UI」「Travel」等標籤載入一組文件；已讀且仍有效的內容不重讀。找不到 owner 或證據衝突時回報，停受影響高風險動作。索引不授權操作；authority 與 precedence 由 [AGENTS](../AGENTS.md) 擁有。

| 要釐清的問題 | Owner／定位 |
| --- | --- |
| 詞彙、持久決策 | [CONTEXT](../CONTEXT.md)；[ADR index](./adr/README.md)，只追相關 accepted 決策 |
| Stack、目錄、data access／generated types、domain 契約 | [架構](./全栈系统需求与技术架构说明书.md) §3–§9，按問題定位 |
| UI 視覺語言、presentation family、設計 Skill 分工 | [Li Family visual system](./design/li-family-visual-system.md) 的受影響段落；[Skill routing](./design/skill-routing.md) 只在選 Skill 或處理衝突時查 |
| Source／Admin reconciliation、media ownership | 架構 §5；[ADR-0006](./adr/0006-seed-reconciliation-protects-published-content.md)；source 格式需釐清時查 [source guideline](./travel-content-source-guidelines.md) |
| Public／Family enforcement | 架構 §6；[ADR-0002](./adr/0002-family-mode-is-an-access-boundary.md) |
| Travel placement caption 與多頁共享模型 | [ADR-0009](./adr/0009-travel-memory-pages-share-one-content-model.md)，配合當前 projection／renderer |
| 授權、scope 取捨、schema／資料或 destructive 動作 | [Playbook](./phase-execution-playbook.md) §3–§4、§9；migration 架構 §10。只查涉及 gate；Production inventory 仍需獨立 read authority |
| 驗證適用性、Browser fallback、Preview | Playbook §10–§11；只有實際採用獲准的 Production-backed Preview 才用 §11.1 |
| Git／PR、merge／release、Phase／Issue closeout | 架構 §11；Playbook §2、§5、§11–§14；正式報告用 [模板](./templates/phase-completion-report-template.md) |

Skills 先看 metadata；只讀選用 Skill 及必要 references。歷史 evidence 只沿具體待驗證主張查找，不當現行 authority，不全量掃讀。未知 API 查實際安裝版本的官方文件，不猜最新版本適用性。
