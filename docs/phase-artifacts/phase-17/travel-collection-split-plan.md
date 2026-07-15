# Phase 17：Travel Plans／Travel Memories Collection Split

## 決策

`planning` 與 `completed` 不再視為同一筆 TravelProject 的兩個狀態。目標模型拆成：

- `travel-plans`：行前審核、修訂、家庭決策與互動。
- `travel-memories`：行後記錄、照片、故事與分享。

Plan 的旅遊日期經過後，仍是同一筆 Plan，只會由大廳從「規劃中／Active Plans」移到「過往規劃／Archived Plans」。它不會自動轉成 Memory，也不儲存重複的 `active`／`archived` business status。

## 已建立的目標 Schema

### `travel-plans`

| 分組 | 欄位 | 設計理由 |
| --- | --- | --- |
| Identity | `title`, `slug`, `isPrivate`, `startDate`, `endDate` | Plan 自己擁有 route identity；大廳位置由 `endDate` 推導。 |
| 摘要與媒體 | `summary`, `coverImage` | Hero 與大廳卡片需要；媒體 relationship 保持 optional。 |
| 參與者 | `members`, `guestParticipants` | Payload Users 與非帳號旅伴分開保存。 |
| 規劃內容 | `planningSections[]` | 以穩定 `anchor` 表示 overview、交通、住宿、日程、決策、預算、提醒與自由段落。 |
| 協作 | `planningSections[].interactions` | Comments／voting 只屬於規劃工作流。 |
| 來源治理 | `sourceMetadata` | 保留 Base／Source／Current reconciliation 證據。 |
| 反向追溯 | `memories` Join | 虛擬欄位；不重複儲存關聯。 |

`planningSections` 的 anchor 在單筆文件內必須唯一。日期只決定 `active`／`archived` presentation；未來若真的需要人工提前歸檔，再另案增加 nullable override，而不是先加入容易漂移的 status。

### `travel-memories`

| 分組 | 欄位 | 設計理由 |
| --- | --- | --- |
| Identity | `title`, `slug`, `isPrivate`, `startDate`, `endDate` | Memory 擁有自己的 route identity，不借用 Plan slug。 |
| 來源追溯 | `originPlan` | Optional、單向 relationship；Memory 可獨立存在。 |
| 摘要與參與者 | `summary`, `participants`, `guestParticipants` | 行後作品的介紹與共同旅人。 |
| 媒體 | `coverImage`, `galleryImages` | 照片分享；所有 media relationships 都是 optional。 |
| 行程亮點 | `dailyHighlights[]` | 以天為單位保存行後精選故事與照片。 |
| 歷史帳本 | `travelLedger.flights`, `travelLedger.lodgings` | 保存實際搭乘／住宿 snapshot，不承擔規劃協作。 |
| 故事 | `storySections[]` | Overview、每日、反思、美食或自由敘事；anchor 必須唯一。 |
| 分享 | `externalVideos[]` | 行後影片連結。 |
| 來源治理 | `sourceMetadata` | 目前三筆 completed Markdown 仍需遷移與 reconciliation，因此先保留為 optional。 |

## 共用約束

- 兩個 collection 各自在資料庫內有 unique slug index。
- `beforeValidate` 會先 canonicalize slug（trim、lowercase、格式驗證），並提供跨 collection collision 的即時錯誤。
- 隱藏的 `travel-route-identities` registry 以單一 database unique index 序列化兩個 collection 的 route ownership，關閉 concurrent writes 的競態；它只存 slug、owner key 與 owner relationship，不承載旅遊內容。
- 公開讀取必須同時符合 `isPrivate = false` 與 Payload draft `_status = published`。
- Family 登入者可讀 private published content，但不能讀 draft／versions；只有內容管理者可讀 draft／versions，create／update／delete 也維持 admin 權限。
- 兩個 collection 都啟用 Payload drafts／versions；`_status` 是發布狀態，不是 Plan／Memory 的 domain status。
- `originPlan` 的外鍵採 `ON DELETE SET NULL`；刪除 Plan 不會連鎖刪除 Memory。

## 舊欄位搬移方向

| `travel-projects` | Planning record | Completed record |
| --- | --- | --- |
| identity、privacy、dates、summary、cover | 搬到 Plan 共用欄位 | 搬到 Memory 共用欄位 |
| `members`, `party` | `members`, `guestParticipants` | `participants`, `guestParticipants` |
| `sourceSections` | `planningSections`；保留 anchor、links、media、interaction IDs | `storySections`／`dailyHighlights`；需逐筆 mapping review |
| `galleryImages` | 預設不搬，除非 inventory 證明 Plan 頁使用 | `galleryImages` |
| `flights`, `lodgings` | 先由 `planningSections` 承接；是否另建結構化欄位須由兩筆 Plan 的實際 UI 證明 | `travelLedger` snapshot |
| `dailyItinerary` | 先映射成 itinerary-day planning sections | `dailyHighlights` |
| `externalVideos` | 不搬 | `externalVideos` |
| `sourceMetadata` | 原樣保留 Base evidence | 原樣保留，待 completed importer policy 確認 |
| `status` | 不搬；Plan 類型由 collection 表示 | 不搬；Memory 類型由 collection 表示 |

`railSegments`、`cabinAssignments`、`foodRecommendations`、`costItems`、`optionalActivities`、`reminders`、`itineraryImages` 不做猜測式搬移。先以 Production read-only inventory 與 renderer usage 決定映射到 section、保留結構化欄位或淘汰。

## 安全切換順序

1. **Additive schema（本切片）**：註冊兩個空 collection、生成型別與 additive migration；舊 runtime 不變。
2. **Inventory**：唯讀確認 2 筆 Plan、3 筆 Memory 及所有 child／relationship non-null counts。
3. **Copy dry-run**：產生逐 slug mapping report；不寫資料。
4. **Copy write**：取得獨立批准後，以 transaction 寫入新 collections；舊表不刪。
5. **Dual-read**：只在 `src/lib/data/travel.ts` 聚合新舊來源，驗證 `/travel`、detail、首頁與 privacy。
6. **Cutover**：read-back、Preview 與 Production browser QA 通過後停止舊表寫入。
7. **Cleanup**：另一次 destructive approval 後才刪除 `travel-projects` 與未採用欄位。

## 本切片界線

已產生 migration `20260715_073322_phase_17_add_travel_collections`。UP 只建立新 collection／version／child／route registry tables、indexes、foreign keys，並替 Payload lock relation 增加兩個欄位；沒有 drop、rename、資料 copy 或 `travel_projects` mutation。人工審查另修正 generated DOWN 的相依順序：先移除 lock-table foreign keys／indexes／columns，再 drop 新 tables，避免 `CASCADE` 後重複刪除 constraint。

這份 migration **尚未執行於 Preview 或 Production**。DOWN 會刪除本次新建表，只能作為尚未存放正式資料時的 rollback；有資料後不可把 DOWN 當一般清理工具。
