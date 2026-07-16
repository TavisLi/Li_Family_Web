---
status: accepted
---

# Travel Plan 與 Travel Memory 是獨立記錄

Travel Plan 是審核與修訂未來旅程的互動工作區，Travel Memory 則是記錄與分享實際旅程的行後作品。因此兩者使用獨立的 `travel-plans` 與 `travel-memories` collections，不把同一筆 `TravelProject` 從 `planning` 切換成 `completed`；需要追溯來源時，可用 optional `originPlan` relationship 連結，但不共用 identity。

## 後果

- Plan 在旅遊日期經過後仍是 Plan。大廳依 `endDate` 推導 `Active Plans` 或 `Archived Plans`；不使用 `Pre-planning`，因為它會誤導為更早期的規劃階段。
- Memory 擁有獨立 canonical slug，也可在沒有 Plan 的情況下存在。Plan 與 Memory 不得宣稱同一個 route identity。
- Planning 正式內容以有順序的 `planningSections` 保存；舊 planning flights、lodgings、itinerary 與 extras 不會只因曾存在於共用 schema 就自動搬入。
- Runtime cutover 必須透過 data layer 聚合兩個 collections、保留跨 collection relationships，並在 copy、read-back、cutover、觀察期與備份完成前保留 legacy `travel_projects` tables 作 rollback evidence。
- Media、TimelineEvents 與 HomeConfig 先新增 polymorphic shadow relationships；data-copy 填入新關聯但保留 legacy relationship 欄位，直到 runtime cutover 與觀察期完成。這是過渡期相容策略，不是永久保存兩套關聯。
- 本決策不批准 Preview／Production migrations、data copy、relationship cutover 或 destructive cleanup；這些動作仍須分別過閘。

## 曾考慮的方案

- **保留單一 collection，將 `planning` 切換成 `completed`**：拒絕。兩者的使用目的、內容形狀、頁面體驗與編輯生命週期不同。
- **增加共用 parent travel table**：拒絕。以目前規模，route ownership 與聚合可以在不增加另一個 content aggregate 的前提下完成。
