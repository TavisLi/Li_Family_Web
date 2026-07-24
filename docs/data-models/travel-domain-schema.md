# Travel Domain Schema

版本：1.0
更新日期：2026-07-24
狀態：Current runtime model；legacy cleanup pending

## 1. 文件目的

本文件以白話說明 Web Li 現行旅行資料模型、collection responsibility、identity、內容 ownership 與 legacy 過渡邊界。

精確欄位以以下 source 與 generated types 為準：

- `src/payload/collections/TravelPlans.ts`
- `src/payload/collections/TravelMemories.ts`
- `src/payload/collections/TravelRouteIdentities.ts`
- `src/payload/collections/travel-shared-fields.ts`
- `src/payload/payload-types.ts`

Phase 16／17 migration、copy 與批准證據存放於 `docs/phase-artifacts/phase-17/`，不在本模型文件重複完整執行日誌。

## 2. 為什麼不再使用單一 TravelProject

舊 `travel-projects` 同時承擔：

- Catalog identity
- Future planning workspace
- Completed memory
- Source projection
- Media projection
- Admin-editable content
- Route ownership

這讓 `status=planning／completed` 被用來切換兩種目的、內容形狀與生命週期完全不同的 aggregate，並累積冗餘欄位。

現行決策：

- Plan 是未來旅程的決策工作區。
- Memory 是行後記錄與分享作品。
- 兩者可關聯，但不共享 record identity。
- Route identity 由獨立 registry 保證唯一。

詳見 ADR-0007。

## 3. Travel Plan

Collection：`travel-plans`

### 責任

- 保存未來旅程的規劃內容。
- 保存有順序、可定位、可獨立互動的 planning sections。
- 保存日期、公開性、成員、封面、影片及 source metadata。
- 旅行日期過後仍保存原始規劃與討論。

### 核心欄位類型

| 類別 | 目的 |
| --- | --- |
| Identity | `title`、`slug` |
| Access | `isPrivate` |
| Time | `startDate`、`endDate` |
| Presentation | `summary`、`routeSummary`、`coverImage`、`featured` |
| People／media | `members`、`media`、`externalVideos` |
| Canonical planning content | `planningSections` |
| Seed ownership | `sourceMetadata` |

### Planning section

Planning section 是 Plan 的 canonical content unit：

- Stable anchor
- Sort order
- Display day／date／subtitle overrides
- Localized title／body
- External links
- Media items
- Comment／thumb-up／thumb-down flags

Display override 可留空；parser 不應為了填滿欄位把可推導值寫成新的 source truth。

### Archived Plan

Lobby 可依 `endDate` 推導 Active／Archived。Archived 不是 schema status transition，也不會建立 Memory。

## 4. Travel Memory

Collection：`travel-memories`

### 責任

- 保存旅行完成後的照片、心得、里程碑與分享。
- 可以在沒有 Plan 時獨立存在。
- 可以 optional `originPlan` 追溯原規劃。

### 核心欄位類型

| 類別 | 目的 |
| --- | --- |
| Identity | `title`、`slug` |
| Access | `isPrivate` |
| Time | `startDate`、`endDate` |
| Presentation | `summary`、`routeSummary`、`coverImage`、`featured` |
| People／media | `members`、`media`、`externalVideos` |
| Memory content | 里程碑、心得與適用的行後內容 |
| Origin | Optional relationship to `travel-plans` |
| Seed ownership | `sourceMetadata` |

Memory 不重用 Plan slug，也不把同一 Plan record 的 status 改成 completed。

## 5. Travel Route Identity

Collection：`travel-route-identities`

### 責任

- 維護 canonical slug → owner collection／record。
- 防止 Plan 與 Memory 宣稱同一 slug。
- 讓 `/travel/[slug]` 不需要依序猜測多個 collections。

### 不變項

- 一個 canonical slug 只對應一個 active owner。
- Plan／Memory create or update 時同步 route identity。
- Delete 前移除相應 identity。
- Cross-collection slug collision 在 validation 階段拒絕。

## 6. Runtime Projection

Travel Plan 與 Memory 共用部分 renderer，但 runtime union 不是第四份 schema。

`src/lib/travel-runtime.ts` 的 projection：

- 從 generated `TravelPlan`／`TravelMemory` 派生。
- 提供 renderer 所需的 discriminated shape。
- 保留 `kind`／owner collection，避免把 Plan／Memory 再模糊成單一 status record。
- 不使用 `any` 或複製 Payload schema。

## 7. Relationships

Phase 17 為以下 owner 新增 polymorphic relationships：

- Media
- TimelineEvents
- HomeConfig featured travel

過渡期同時保留 legacy relationship，目的為：

- Copy verification
- Runtime rollback
- Observation

它不是永久雙寫設計。清除前必須證明所有 current consumers 已使用新 relationship。

## 8. Source Metadata and Reconciliation

需要 Source／Admin 共存的欄位由 `sourceMetadata` 保存 Base evidence。

### Safe behavior

- Source changed、Current unchanged → update。
- Current changed、Source unchanged → preserve。
- Source／Current both changed differently → conflict。
- Missing Base legacy record → preserve-current。

### Stable array identity

| Array | Identity |
| --- | --- |
| Flights | flight number＋date＋route |
| Daily itinerary | day |
| Planning／source sections | anchor |
| Lodgings | date range＋hotel＋city |

Identity absent／unmatched 時保留 parent-level conflict，不猜測合併。

## 9. Access and Database Security

- Collection read 依 Public／Family access rule。
- Create／update／delete 依 user role。
- Production 新 travel tables 與 relationship tables 已啟用 RLS。
- anon／authenticated table privileges 已撤銷；Payload owner connection 負責合法 server access。
- RLS／grants 是 database defense-in-depth，不取代 Payload access control。

## 10. Phase 17 Production State

已完成：

- Additive schema migrations。
- Plans 2、Memories 3、Route Identities 5 copy baseline。
- Shadow relationship copy。
- RLS／grants migration。
- Runtime／seed cutover。
- Production deployment 與 `/travel` rendered HTML verification。

尚未清除：

- Legacy `travel-projects` table／records。
- Legacy relationship columns。
- Historical migration records。

## 11. Legacy Cleanup Gate

Destructive cleanup 必須全部滿足：

1. 最新 runtime 已部署。
2. Production observation window 完成。
3. Public／Family routes 無 legacy reads。
4. Relationship inventory 完整。
5. Backup／restore evidence 完整。
6. Cleanup script／migration hash 固定。
7. Drift check 通過。
8. 網站擁有者批准明確 targets。
9. Apply 後 schema／record／route read-back。

任何條件不滿足都停止。一般 Payload migration runner 不自動執行 legacy cleanup。

## 12. Rollback

- Code rollback：提升最近健康 Vercel deployment。
- Runtime data rollback：使用仍保留的 legacy records／relationships。
- Migration／copy rollback：依 approval package 的 transaction／read-back evidence。

Vercel rollback 不回復 database mutation；兩者必須分開操作。

## 13. Related Evidence

- `docs/adr/0006-seed-reconciliation-protects-published-content.md`
- `docs/adr/0007-travel-plans-and-memories-are-separate-records.md`
- `docs/phase-artifacts/phase-17/travel-collection-split-plan.md`
- `docs/phase-artifacts/phase-17/travel-migration-data-copy-approval-package.md`
- `docs/phase-artifacts/phase-17/travel-data-api-security-approval-package.md`
- `docs/phase-completion-reports/phase-17-travel-plan-memory-split.md`
