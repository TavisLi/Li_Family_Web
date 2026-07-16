# Phase 17：Travel Plans／Travel Memories Collection Split

正式架構決策見 `docs/adr/0007-travel-plans-and-memories-are-separate-records.md`；本文件保存 Phase 17 的欄位 contract、搬移矩陣與執行證據。

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
| 協作 | `planningSections[].interactions` | Comments、thumb-up、thumb-down 各自獨立，完整保留規劃工作流設定。 |
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
| `sourceSections` | `planningSections`；保留 level、anchor、display labels、body、links、media 與三種 interaction settings | `storySections`；同樣保留完整 section metadata；結構化每日資料另由 `dailyItinerary` 搬入 `dailyHighlights` |
| `galleryImages` | 預設不搬，除非 inventory 證明 Plan 頁使用 | `galleryImages` |
| `flights`, `lodgings` | 不搬 legacy arrays；正式內容已在 `planningSections`，未來是否另建結構化欄位另案決定 | `travelLedger` snapshot |
| `dailyItinerary` | 不搬 legacy array；每日內容由 `planningSections` 保存 | `dailyHighlights` |
| `externalVideos` | 不搬 | `externalVideos` |
| `sourceMetadata` | 舊值封存為 migration evidence；以 Plan transformer 重建新 Base／hash | 舊值封存為 migration evidence；以 Memory transformer 重建新 Base／hash |
| `status` | 不搬；Plan 類型由 collection 表示 | 不搬；Memory 類型由 collection 表示 |

Planning records 的 `galleryImages`、`itineraryImages`、`flights`、`railSegments`、`lodgings`、`cabinAssignments`、`dailyItinerary`、`foodRecommendations`、`costItems`、`optionalActivities`、`reminders`、`externalVideos` 已由網站擁有者批准為不搬移的 legacy projections。未來若產品需要結構化航班／住宿／每日行程，必須以新功能需求另行設計，不從舊 schema 自動繼承。

## 安全切換順序

1. **Additive schema（本切片）**：註冊兩個空 collection、生成型別與 additive migration；舊 runtime 不變。
2. **Inventory**：唯讀確認 2 筆 Plan、3 筆 Memory 及所有 child／relationship non-null counts。
3. **Copy dry-run**：產生逐 slug mapping report；不寫資料。
4. **Copy write**：取得獨立批准後，以 transaction 寫入新 collections；舊表不刪。
5. **Dual-read**：只在 `src/lib/data/travel.ts` 聚合新舊來源，驗證 `/travel`、detail、首頁與 privacy。
6. **Cutover**：read-back、Preview 與 Production browser QA 通過後停止舊表寫入。
7. **Cleanup**：另一次 destructive approval 後才刪除 `travel-projects` 與未採用欄位。

## Production 唯讀 Inventory（2026-07-15）

已執行 `pnpm run seed:travel:copy-readiness:artifact`。命令只使用 Payload `find` 與 Postgres `SELECT`，沒有 migration、create、update 或 delete。

確認結果：

- 舊 `travel_projects`：5 筆。
- 目標分類：2 筆 Plans（1 active、1 archived）與 3 筆 Memories。
- `travel_plans`、`travel_memories`、`travel_route_identities` 尚未存在，row count 視為 0。
- 12 筆 Media 仍引用 `202607-chongqing-yangtze-river`。
- 2 筆 TimelineEvents 分別引用 `201307-hainan` 與 `202308-east-australia`。
- HomeConfig featured travel 引用 `202607-chongqing-yangtze-river`。

欄位 inventory 證明三筆 completed records 的 `itineraryImages`、`reminders`、航班 passengers、住宿 dateRange／roomType／address／booking channel／price／highlights，以及每日行程 segments／meals／lodging 都是 Memory domain 的實際資料，不應因拆表而遺失。因此已補強 `travel-memories` schema，保留 legacy date labels 與完整 ledger／daily highlight 結構；對應 migration `20260715_094310_phase_17_expand_travel_memory_preservation` 仍為 additive-only，尚未執行。

程式審查確認 Planning view 只渲染 source sections。網站擁有者已批准舊 structured arrays 為冗餘 planning projections，不搬入新 Plan；重慶 lodging conflict 因此定案為 `drop-as-redundant`。普吉島 link labels 採 `payload-wins`，保留 Payload Current 的人類可讀名稱。

2026-07-16 Production 唯讀 mapping dry-run 結果為 5 ready／0 blocked：兩筆 Plans 與三筆 Memories 都已通過 record-level mapping。Memory transformer 會完整保留 gallery、itinerary images、daily highlights、flight／lodging ledger、reminders、external videos，以及 source section 的 level、display labels、links、media 與三種 interaction settings。新 collections 不加入 persistent snapshot，遷移期間以完整舊表作 rollback；Plan 與 Memory 的新 Base/hash 都由各自 target transformer 重新建立。

完整逐筆 paths 見 `docs/phase-artifacts/phase-17/travel-collection-copy-readiness.md`。

### Relationship cutover 決策

Media、TimelineEvents 與 HomeConfig 不應繼續只指向 `travel-projects`。在 dual-read slice，這三個 relationship 應改為 polymorphic relation，允許 `travel-plans`／`travel-memories`；資料 copy 必須以舊 related travel 的 status 決定新的 `relationTo`，並在 read-back 驗證 12／2／1 筆引用完整保留。這項變更與 data copy 綁定，不提前修改目前 runtime schema。

## 本切片界線

已產生 migration `20260715_073322_phase_17_add_travel_collections`。UP 只建立新 collection／version／child／route registry tables、indexes、foreign keys，並替 Payload lock relation 增加兩個欄位；沒有 drop、rename、資料 copy 或 `travel_projects` mutation。人工審查另修正 generated DOWN 的相依順序：先移除 lock-table foreign keys／indexes／columns，再 drop 新 tables，避免 `CASCADE` 後重複刪除 constraint。

這份 migration **尚未執行於 Preview 或 Production**。DOWN 會刪除本次新建表，只能作為尚未存放正式資料時的 rollback；有資料後不可把 DOWN 當一般清理工具。

後續 migrations `20260716_045235_phase_17_align_travel_plan_sections` 與 `20260716_091228_phase_17_align_travel_memory_sections` 會把尚為空表的 Plan／Memory section schema 收斂成正式 contract：移除沒有 evidence 的 speculative `kind`，新增 legacy section 實際需要的 level、localized display labels 及獨立 interaction flags。兩份 migration 都含 DROP，但只作用於前面 migrations 剛建立且尚未 copy 資料的新 tables；UP 與 DOWN 都會先檢查各自 target／version 主表必須為空，否則直接拒絕執行，且不讀寫或刪除 `travel_projects`。四份 Phase 17 migrations 必須按順序並在任何 data copy 前執行，且目前尚未取得執行批准。

readiness CLI 只解析 travel catalog 與 travel Markdown，不會載入 profiles、member media 或 Blogger archive；任何 planning slug 找不到 matching Source 時，一律標記 record-level blocked，不允許略過 Base／Source／Current 證據檢查。
