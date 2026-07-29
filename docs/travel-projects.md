# Web Li 旅行目錄與內容配置

更新日期：2026-07-24

本文件定義 Web Li 應管理的旅行 catalog、canonical slug、來源檔與 domain 分類。它是版本化 catalog input，不是 Production runtime database；來源變更必須經 seed reconciliation、批准、read-back 與 runtime 驗證。

## 1. Travel Domain

- `travel-plans` 與 `travel-memories` 是獨立內容，不是同一 record 的 planning／completed status。
- Plan 在旅遊日期未過時顯示為「規劃中／Active Plans」；日期已過後顯示為「過往規劃／Archived Plans」，persisted record 仍是 Plan。
- Travel Memory 是獨立行後作品，可 optional `originPlan`，但必須有不同 canonical slug。
- `travel-route-identities` 管理跨 collection route ownership。
- 正式決策見 [`adr/0007-travel-plans-and-memories-are-separate-records.md`](./adr/0007-travel-plans-and-memories-are-separate-records.md)。

## 2. Phase 17 Runtime 狀態

已完成：

- 五份 Production additive migrations。
- 2 Plans／3 Memories／5 Route Identities transactional copy。
- Media、TimelineEvents、HomeConfig polymorphic shadow relationship copy。
- 相關 tables 的 RLS／grants security migration。
- Data layer、renderer、interaction 與 travel-only seed cutover。
- PR #59 merge 與 Vercel Production deployment。
- 正式站 `/travel` 200，rendered HTML 已顯示「規劃中／旅行回憶／過往規劃」。

仍保留：

- Legacy `travel-projects` records／tables。
- Legacy relationship 欄位。
- Legacy migration evidence。

保留項目只作 rollback evidence。Issue #50／#57 的 destructive cleanup 尚未批准，必須另有 backup、observation、inventory、relationship mapping、批准與 read-back。

Controlled cleanup migration、executor 與核准包已完成本地 PostgreSQL 17 演練，現正依最新 Production commit 更新並重新驗證；在取得 cleanup 前備份、Production 唯讀 inventory／approval token 與 destructive apply 明確批准前，不得執行。詳見 [`phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md`](./phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md)。

詳細模型見 [`data-models/travel-domain-schema.md`](./data-models/travel-domain-schema.md)，執行證據見 [`phase-completion-reports/phase-17-travel-plan-memory-split.md`](./phase-completion-reports/phase-17-travel-plan-memory-split.md)。

## 3. Canonical Identity

每個 catalog item 必須有 stable canonical slug，並同時用於：

- Dynamic route
- Catalog mapping
- Source mapping
- `content-source/assets/travels/[slug]/`
- Travel-local `manifest.json`

Display title、中文 Markdown filename 或旅行年份改變時，不自動改 canonical slug。

## 4. Travel Plans

### 202607 重慶＋長江三峽

- **呈現名稱**：重慶＋長江三峽 8 日－山城精華、三峽遊輪、宜昌探索
- **Canonical slug**：`202607-chongqing-yangtze-river`
- **Collection**：`travel-plans`
- **Source**：`content-source/travels/202607重慶長江三峽8日.md`
- **產品重點**：高密度 planning sections、航班、住宿、提醒、每日節點與家庭決策互動。

### 202702 泰國普吉島

- **呈現名稱**：泰國普吉島度假二刷
- **Canonical slug**：`202702-thailand-phuket`
- **Collection**：`travel-plans`
- **Source**：`content-source/travels/202702泰國普吉島7日.md`
- **Design doc**：[`design/travel/202702-thailand-phuket.design.md`](./design/travel/202702-thailand-phuket.design.md)
- **產品重點**：度假規劃、飯店與交通連結、planning section interaction。
- **Reconciliation fixture**：Admin-edited link labels 必須受 Base／Source／Current 保護。

## 5. Travel Memories

### 201307 海南

- **呈現名稱**：非誠勿擾之海南三亞度假－亞龍灣、海棠灣、石梅灣
- **Canonical slug**：`201307-hainan`
- **Collection**：`travel-memories`
- **Source**：`content-source/travels/201307海南島8日.md`

### 202308 東澳

- **呈現名稱**：東澳全覽 9 日－墨爾本、黃金海岸、悉尼藍山
- **Canonical slug**：`202308-east-australia`
- **Collection**：`travel-memories`
- **Source**：`content-source/travels/202308東澳全覽9日.md`

### 202602 泰國普吉島

- **呈現名稱**：初探泰國普吉島－萬豪度假會、躍浪渡假村、芭東海灘
- **Canonical slug**：`202602-thailand-phuket`
- **Collection**：`travel-memories`
- **Source**：`content-source/travels/202602泰國普吉島8日.md`

Travel Memory 著重照片、心得、里程碑、外部 YouTube 與行後分享，不以 Plan schema 的 planning sections／決策生命週期取代。

## 6. Interaction and Access

- Planning section 可獨立設定 comment、thumb-up、thumb-down。
- Travel Memory 可依其內容 target 提供家庭互動。
- Public mode 只能讀取明確公開的 travel record。
- Family-only內容不得出現在 public HTML、metadata、JSON-LD 或 media relationship。
- Comment／reaction 必須顯示授權 user identity，並由 server/data layer 驗證。

## 7. Source and Seed

- 新增／大量更新旅行依 [`travel-content-source-guidelines.md`](./travel-content-source-guidelines.md)。
- 日常 Admin 修改不應被 safe seed 靜默覆蓋。
- Travel-only dry-run：`pnpm run seed:travel:dry-run`。
- Travel read-back：`pnpm run seed:travel:read-back`。
- 未取得 Production write 批准前只準備 evidence。
- 一般 travel seed 不再寫入 legacy `travel-projects`。
