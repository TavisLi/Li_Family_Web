# TravelProjects Schema、欄位定義與重構規劃

## 文件目的

這份文件用白話說明 `travel_projects` table 的所有主要欄位、為什麼需要它們、前台與 seed 如何使用它們，以及 planning travel 的重構候選。Phase 17 只產出 readiness 與批准方案；取得網站擁有者同意前，不刪欄位、不搬資料、不執行 destructive migration。

本次不是刪除舊欄位，也不是重做旅行資料表。它只是在每筆旅行旁邊增加一組「上次 seed 對照紀錄」，讓系統日後能判斷 Markdown 與 Payload Admin 分別改了什麼。

## 變更前的問題

在 Phase 16 以前，旅行 seed 只知道兩件事：

1. 本次 Markdown／manifest 解析出的 Source。
2. Payload 目前的 Current content。

它不知道「上次成功匯入時的內容」是什麼。因此，只看到 Source 與 Current 不一樣時，系統無法判斷：

- 是 Markdown 剛更新，應該套用到 Payload；
- 還是內容編輯者已在 Payload Admin 修正，應該保留；
- 或兩邊都改了，需要人工處理 conflict。

新增的五個欄位就是補上第三個比較基準 Base。

## Schema 變更總覽

Payload collection 中的邏輯群組名稱是 `sourceMetadata`。Postgres 實際增加五個 nullable columns：

| Payload 欄位 | Postgres column | 類型 | 白話用途 | 現有資料初始值 |
| --- | --- | --- | --- | --- |
| `sourceMetadata.sourceFile` | `source_metadata_source_file` | `varchar` | 記錄這筆旅行對應哪一份 Markdown，避免檔名與 slug 對錯。 | `NULL` |
| `sourceMetadata.sourceHash` | `source_metadata_source_hash` | `varchar` | 保存 Source projection 的 SHA-256 指紋；內容一變，指紋就會不同。 | `NULL` |
| `sourceMetadata.parserVersion` | `source_metadata_parser_version` | `varchar` | 記錄是哪一版 parser 產生資料，方便區分「內容改變」與「解析規則改變」。 | `NULL` |
| `sourceMetadata.lastImportedAt` | `source_metadata_last_imported_at` | `timestamp with time zone` | 記錄最近一次真正接受 Source 更新的時間；單純保留 Admin content 不會冒充成功匯入。 | `NULL` |
| `sourceMetadata.baseProjection` | `source_metadata_base_projection` | `jsonb` | 保存上次接受的 seed projection，作為 Base 與 Source／Current 做三方比較。 | `NULL` |

### 為什麼全部允許 NULL

Production 原本已有 5 筆 travel projects。如果新增欄位時要求必填，就必須同時替舊資料猜值或更新資料，風險較高。

全部 nullable 的效果是：

- migration 只改 table 結構，不改任何既有旅行內容；
- 舊資料會被明確識別為 legacy／missing Base；
- 第一次 safe seed 只建立 baseline metadata，不把 Markdown 覆蓋到 Payload content；
- 等 baseline 存在後，下一次 dry-run 才開始做完整三方比較。

## Base／Source／Current 如何判斷

| Base、Source、Current 狀態 | Safe mode 決策 | 白話說明 |
| --- | --- | --- |
| 三者相同 | `skip` | 沒有人修改，不做事。 |
| Source 改、Current 仍等於 Base | `apply-source` | 只有 Markdown 改了，可以安全更新 Payload。 |
| Source 等於 Base、Current 改了 | `preserve-current` | 只有 Admin 改了，保留人工修改。 |
| Source 與 Current 都改成相同內容 | `already-converged` | 兩邊已自行同步，不重複更新。 |
| Source 與 Current 都改且內容不同 | `conflict` | 不猜哪邊正確；保留衝突欄位並交由人工決定。 |
| 沒有 Base 的既有 record | `preserve-current` | 視為 legacy，先保護網站上的 published content。 |
| Payload 沒有這個 slug | `create` | 這是新的 travel project，可以建立。 |

## Migration 實際執行結果

執行日期：2026-07-11。

### 執行前

- `travel_projects` row count：5。
- 五個 `source_metadata_*` columns：0 個。
- `payload_migrations` 中 `20260711_141901`：0 筆。
- Supabase Postgres 版本：17.6。

### 執行方式

Payload CLI 偵測到資料庫曾使用 dev mode 動態推 schema，並警告繼續可能造成 data loss，因此沒有確認該操作。

實際套用改採單一 transaction：

1. 再次檢查 row count、目標 columns 與 migration record。
2. 執行 migration 檔案中相同的五條 nullable `ADD COLUMN`。
3. 新增 `payload_migrations.name = 20260711_141901`，batch 為 5。
4. 任一步驟失敗就 rollback 整個 transaction。

### 執行後

- `travel_projects` row count：仍為 5。
- 五個 columns：全部存在且 `is_nullable = YES`。
- migration record：`20260711_141901`，batch 5。
- 五個欄位的 non-null count：全部為 0。
- 結論：只改 schema，沒有修改原本五筆旅行資料。

## Production dry-run 審查

正式 `pnpm run seed:phase-9:dry-run` 已越過 schema mismatch，但 Supabase pooler 在 Payload Local API 的大型 collection read／後續重新連線時多次 timeout。沒有任何 dry-run 嘗試執行寫入。

為完成審查，另以相同的 `buildSeedContent` 與 `mediaRecordMatchesSeed` 公開介面，在單一 direct Postgres connection 上執行 controlled read-only audit：

| Action | 數量 | 審查結論 |
| --- | ---: | --- |
| Users update | 6 | 既有 Phase 9 member seed 行為；不是本次 travel baseline 所需。 |
| Travel preserve | 5 | 五筆 travel 都沒有 Base，safe mode 應保留 Current。 |
| Media skip | 783 | Source 與 Production media comparison fields 相符。 |
| Media create | 10 | 全部是 Tavis member assets，與 travel baseline 無關。 |
| Media update | 0 | 沒有既有 media 需要改寫。 |
| Delete | 0 | Workflow 沒有 delete operation。 |

五筆 travel preserve：

| Slug | Production ID | 決策 |
| --- | ---: | --- |
| `201307-hainan` | 1 | preserve |
| `202308-east-australia` | 2 | preserve |
| `202602-thailand-phuket` | 6 | preserve |
| `202607-chongqing-yangtze-river` | 3 | preserve |
| `202702-thailand-phuket` | 7 | preserve |

### Travel-only dry-run

為排除 Users 與 member media，Phase 16 production closeout 新增：

```bash
pnpm run seed:travel:dry-run
pnpm run seed:travel
```

正式 Production travel-only dry-run 已成功：

| Action | 數量 |
| --- | ---: |
| Users | 0 |
| Member media | 0 |
| Travel preserve | 5 |
| Travel media skip | 751 |
| Create | 0 |
| Update | 0 |
| Conflict | 0 |
| Delete | 0 |

這證明下一步若使用 travel-only safe write，不會進入 Users update 路徑，也不會處理 Tavis member assets。

### 為什麼不批准全量 Production write

全量 Phase 9 seed 同時包含 users、travel 與 media。Controlled dry-run 發現 10 筆 media create 全部屬於 Tavis member assets，其中包含工作樹原有、尚未納入 Phase 16 的圖片變更。

若直接執行全量 seed，會把「建立 travel baseline」與「上傳／關聯 Tavis 圖片」混在一起，超出本次批准範圍。因此全量 write 未獲批准；後續只批准並執行 travel baseline metadata write。

## Baseline Production write 結果

網站擁有者於 2026-07-12 明確批准 travel-only Production write。

第一次 `pnpm run seed:travel` 在開始逐筆檢查 751 個既有 travel media 後被 Supabase pooler 提前中止。事後驗證確認：

- baseline 仍為 0；
- source file metadata 仍為 0；
- published-content fingerprint 未改；
- 沒有 media 或 travel content write。

為避免再次掃描已由 dry-run 證明全部為 skip 的 media，改用受控 baseline transaction：

```bash
pnpm run seed:travel:baseline:inspect
pnpm run seed:travel:baseline:apply
pnpm run seed:travel:baseline:verify
```

受控 script 使用與正式 seed 相同的 `buildSeedContent`、section media attachment、projection normalization 與 SHA-256 hash。它只更新五個 `source_metadata_*` columns；任何 slug 前置條件不符都會 rollback 整個 transaction。

執行結果：

| 驗證項目 | Before | After |
| --- | ---: | ---: |
| `travel_projects` rows | 5 | 5 |
| `baseProjection` non-null | 0 | 5 |
| `sourceFile` non-null | 0 | 5 |
| Published fingerprint | `1d8d9b5c…9815` | `1d8d9b5c…9815` |

每筆資料均符合：

- `sourceFile` 對應正確 Markdown；
- `sourceHash` 長度為 64；
- `parserVersion = phase-16-v1`；
- `baseProjection` 已建立；
- `lastImportedAt = NULL`，因為這次只建立 legacy baseline，沒有宣稱 Source 已覆蓋 Current。

Baseline 後已完成 full-projection read-back 修復。讀取流程先以小型 query 取得 travel metadata，再以 JSON array parameter 限定 751 筆 travel media，最後只對五筆已有 Base 的 travel 逐筆取得完整 projection；命令另有 120 秒 timeout，避免 pending database promise 讓 CLI 無報告退出。

Payload 對 optional 欄位可能回傳明確 `null`，而 Markdown parser 對同一欄位可能直接省略。Phase 16 將這兩種「都沒有值」的表示正規化為等價；這不會忽略非空字串、數字、relationship 或 Admin 編輯文字。

成功的 Production 唯讀報告如下：

| Action | 數量 |
| --- | ---: |
| Travel conflict | 5 |
| Travel media skip | 751 |
| Create | 0 |
| Update | 0 |
| Delete | 0 |

`202702-thailand-phuket` 的 `sourceSections[item-1c51hpg].links` 已確認包含 Payload Admin 將 raw URL 改為人類可讀標籤的 Current-only 編輯，因此 safe mode 保留 Current。其他部分陣列差異仍保守維持 conflict；本階段沒有在無法證明安全時自動合併或覆蓋。

## 建議執行計畫

### 計畫 A：Travel baseline（已完成）

1. Travel-only safe seed 入口已完成，會排除 users、member media、blog 與 Home Config。
2. Travel-only Production dry-run 已完成：五筆 travel preserve，751 travel media skip，其餘 action 為 0。
3. 網站擁有者已明確批准只寫入五筆 travel source metadata。
4. 受控 baseline transaction 已完成。
5. 已驗證：
   - row count 仍為 5；
   - published travel fields 未改；
   - 五筆 `sourceFile/sourceHash/parserVersion/baseProjection` 已建立；
   - `lastImportedAt` 依實際決策保持正確語意；
   - baseline metadata 已完整建立。

Full-projection read-back 已成功取得五筆 conflict evidence，read-back scalability blocker 已解除。Production pooler 仍可能造成個別重跑 timeout，因此後續 write 仍必須使用當次成功 dry-run 報告並另行批准，不能把歷史成功視為永久授權。

### 計畫 B：Tavis media 另案處理

1. 先整理工作樹圖片，確認哪些檔案應保留、命名與用途。
2. 針對 10 筆 media create 做獨立 dry-run／manifest review。
3. 另行批准 member media upload 與 relationship 更新。
4. 不與 travel baseline write 綁在同一批 Production mutation。

### 計畫 C：未來 schema cleanup

只有在 Base metadata 已建立、至少完成一次後續 reconciliation dry-run，並確認 Payload Admin 修改能被正確辨識後，才考慮：

- 哪些 `TravelProjects` 欄位長期未使用；
- 哪些顯示值可由 heading/source projection 推導；
- 哪些欄位是 Admin override，不能刪；
- 是否需要拆 collection 或 drop columns。

任何 drop／rename／資料搬移都必須另開 destructive migration phase，不包含在 Phase 16。

## Rollback 說明

本次 migration 沒有搬資料，因此程式尚未寫入 metadata 前，回復較單純。但 Production 已記錄 migration，不能只刪 migration record 假裝沒執行。

若需要 rollback，必須：

1. 確認五欄仍全部 NULL。
2. 在 maintenance window 執行 migration 的 DOWN SQL，刪除五個 columns。
3. 同步處理 `payload_migrations` record。
4. 部署不再查詢 `sourceMetadata` 的舊版程式。

目前沒有 rollback 需要；Production schema 與已合併程式一致。

## Phase 17 欄位級 schema cleanup readiness

### Phase 17 補充後的 domain 結論

網站擁有者已釐清：planning travel 是行前審核、修訂與家庭決策工作台；travel memory 是旅遊結束後的記錄、照片與分享作品。兩者沒有同一筆 record／同一頁面由 planning 切成 memory 的需求。Planning travel 在旅遊時間未過時顯示於「規劃中／Active Plans」，時間已過但仍保留原計畫時顯示於「過往規劃／Archived Plans」；後者不是 early `Pre-planning`，也不是 Travel Memory。

這項補充推翻「planning／completed 只是同一 aggregate status」的原假設。Phase 17 的建議調整為：**建立獨立 `travel-plans` 與 `travel-memories` Payload collections**。兩者各自擁有不同且全域不衝突的 canonical slug；若 Memory 源自某個 Plan，以 optional `originPlan` relationship 保持追溯，不共用 route identity。

現行前台用日期判斷 planning record 應放在「規劃中／Active Plans」或「過往規劃／Archived Plans」：日期已過就歸入 archive。依最新定義，這個判斷方向正確。若歸檔規則永遠只取決於日期，目標模型不應重複儲存一個會與 `endDate` 漂移的 stage；data layer 可回傳 derived `active`／`archived` presentation state。只有未來需要人工提前歸檔、延後歸檔或取消行程時，才增加 `archivedAt`／override reason。

Phase 17 的建議不是立即拆 table，而是先把欄位分成四層：

1. **Identity / publication**：route、狀態、日期、權限，必須保留。
2. **Published view**：前台目前直接讀取的資料，未有替代 projection 前不得刪除。
3. **Faithful source**：`sourceSections` 保留 Markdown 完整內容與 interaction anchors，是 planning 頁主要 renderer input。
4. **Reconciliation metadata**：保護 Admin edits 的 Base evidence，不是前台內容，但在雙來源 workflow 存續期間必須保留。

### 欄位清單與證據

| 欄位 | Payload／seed 角色 | 前台讀取 | Production evidence | Phase 17 判定 |
| --- | --- | --- | --- | --- |
| `title`, `slug`, `status`, `isPrivate`, `startDate`, `endDate` | identity / publication | hero、route、排序、access | 五筆 record 的共用 identity | **必須保留** |
| `externalDocIdentifier` | source file 對應與 hero fallback | hero 在 summary 空白時 fallback | seed catalog 與現有 records 使用 | **暫時保留**；未先將 source identity 完整收斂至 metadata 不得刪 |
| `sourceMetadata` | Base／Source／Current reconciliation | 不直接顯示 | 五筆 Production Base 已建立 | **必須保留** |
| `coverImage` | hero media | hero 直接讀取 | travel media pipeline 使用 | **必須保留** |
| `galleryImages` | completed photo gallery | gallery renderer 讀取 | completed travel 在 scope 外 | **必須保留** |
| `itineraryImages` | seed media projection | 現行 renderer 未直接讀取 | seed／baseline 仍建立 relationship | **可疑冗餘但缺 evidence**；需 non-null count 與 media ownership 審查 |
| `members` | Payload user relationships | hero participant fallback | Admin 可編輯，並非 Markdown 可完整取代 | **必須保留** |
| `summary` | hero 摘要 | hero 直接讀取 | published copy，可由 Admin 修正 | **必須保留** |
| `party` | source participant projection | hero 直接讀取 | planning／completed 共用 | **必須保留** |
| `flights`, `lodgings` | structured travel ledger | completed renderer 直接讀取；planning 主要由 source sections 呈現 | Phase 16 有 conflict，且 completed travel 在 scope 外 | **暫時保留**；不能由 planning-only migration 全域刪除 |
| `dailyItinerary` | completed highlights 與 structured day projection | completed renderer 直接讀取 | 三筆 travel 有 conflict evidence | **必須保留**，直到 completed renderer 有等價替代 |
| `railSegments`, `cabinAssignments` | structured source projection | 現行 Production renderer 未直接讀取 | parser 與 Payload Admin 支援，non-null count 尚未取得 | **可疑冗餘但缺 evidence** |
| `foodRecommendations`, `costItems`, `optionalActivities` | planning structured extras | 元件存在但目前未接入主 planning route | parser／tests 使用，Production non-null count 未取得 | **可疑冗餘但缺 evidence**；先決定是否正式接回 UI |
| `reminders` | structured reminder projection | 主 renderer 未直接讀取；相同內容可能在 source sections | parser／tests 使用，Production non-null count 未取得 | **schema-cleanup candidate**，但尚未批准 |
| `sourceSections` | faithful Markdown projection、section media、互動設定與 anchor | planning 頁主要內容與 interaction IDs；completed 頁亦讀取 | 五筆皆有 conflict evidence | **必須保留** |
| `externalVideos` | completed YouTube embeds | completed renderer 直接讀取 | completed travel 在 scope 外 | **必須保留** |

### 為何建議拆成兩個 collections

1. **內容形狀不同**：plan 需要議程、選項、提醒、互動與修訂；memory 需要敘事、照片、影片、心得與歷史 ledger。分拆可讓 Payload Admin 只顯示該 domain 真正需要的欄位。
2. **生命週期不同**：active／archived 是 plan 的大廳呈現狀態；memory 不應參與，也不應由 plan 原地改 status 產生。
3. **前台入口不同**：大廳分區、detail renderer 與使用者目的不同，沒有同頁切換需求。
4. **資料治理更安全**：planning 的 Markdown reconciliation、Admin edits 與 conflict resolution 不必碰 completed memories；completed media／story schema 也不會把 planning table 撐成寬表。
5. **刪除冗餘更可證明**：欄位是在新 collection 中按 domain 重新定義，而不是從共用表 drop 後賭另一種內容沒在使用。

分拆的代價是 route resolver、跨 collection slug collision、首頁合併查詢與 migration 複雜度。這些代價可以由 `src/lib/data/travel.ts` 的聚合介面、catalog validation，以及 optional `originPlan` relationship 隱藏；不需要為只有五筆資料再增加一張抽象 parent table。依 ADR 0003，每個 record 的 canonical slug 分別擁有自己的 `/travel/[slug]` route 與 asset folder；例如由 Plan 建立 Memory 時必須核發新的 memory slug，不能讓兩筆 record 同時宣稱相同 slug。

### 建議目標模型

**`travel-plans`**

- identity：title、slug、isPrivate、startDate、endDate。
- archive presentation：預設由 `endDate` 推導 active／archived；若未來需要人工 override，再增加 nullable `archivedAt` 與原因。
- collaboration：members、party、sourceSections、interaction settings。
- planning projections：flights、rail segments、lodgings、daily itinerary、cost／food／optional activities／reminders，只保留經頁面或 Admin workflow 證明需要者。
- reconciliation：externalDocIdentifier、sourceMetadata、media projection。

**`travel-memories`**

- identity：title、slug、isPrivate、travel dates。
- optional traceability：`originPlan` relationship；建立 memory 時可連回原 plan，但不是原 record 改 status。
- storytelling：summary／story、daily highlights、source sections（若 completed renderer 仍需要）。
- media：cover、gallery、external videos；completed ledger 需要的 flights／lodgings可作 snapshot，而非 planning collaboration data。
- 不包含 planning stage、planning interaction settings 或 planning reconciliation policy，除非另有 completed source import workflow。

兩個 collections 的 slug 必須在 application catalog 層做跨 collection collision check；`/travel/[slug]` 可保持不變，由 data layer 先解析 plan 或 memory，前端 route 不直接呼叫 Payload。

### 安全遷移順序

1. 先新增兩個 collections 與 generated types，不刪舊 `TravelProjects`。
2. 建立 read-only migration inventory：2 筆 planning、3 筆 completed，以及每個 array／media child table count。
3. 先搬兩筆 planning 到 `travel-plans`，保存 slug、sourceMetadata、sourceSections anchors 與 interaction IDs；大廳繼續依 `endDate` 推導 active／archived，並把程式命名從模糊的 preliminary 改為 archived plan。
4. 搬三筆 completed 到 `travel-memories`，驗證 gallery、highlights、ledger、videos 與 privacy。
5. `src/lib/data/travel.ts` 暫時 dual-read，讓 `/travel`、`/travel/[slug]` 與首頁維持同一介面。
6. Preview／Production read-back 證明五筆頁面內容與路由不變後，停止舊 collection 寫入。
7. 另一次批准後才 drop 舊 collection／child tables；DOWN 必須能恢復舊 schema 與五筆 snapshot。

### 建議批准範圍

Phase 17 建議先批准下一個安全 slice，而不是直接批准 drop：

1. 保留所有 shared／renderer-consumed fields。
2. 對 `itineraryImages`、`railSegments`、`cabinAssignments`、`foodRecommendations`、`costItems`、`optionalActivities`、`reminders` 做 Production non-null count（read-only）。
3. 核准 `travel-plans`／`travel-memories` 的 target schema，以及 archived plan 是否永遠採日期推導。
4. 決定 `TravelPlanningExtras` 要正式接入 plan detail，或不帶入新 collection。
5. 解決兩筆 planning travel 的 conflict register 後，再產出 data-copy migration approval note。
6. migration approval note 必須包含 exact UP／DOWN、row count、每個 child table count、Preview 驗證、Production maintenance window 與 rollback。

在上述 evidence 完成前，Issue #57 的 destructive migration 狀態為 **not ready**。這是 readiness 結論，不是 Phase 失敗：它避免以 planning 需求誤刪 completed travel 仍在使用的資料。

## Phase 17 已批准的 additive collection slice

網站擁有者已批准獨立 `travel-plans`／`travel-memories` 目標模型。第一個安全切片已完成 schema code、generated types 與 additive migration 草稿；詳細欄位與搬移矩陣見 `docs/phase-artifacts/phase-17/travel-collection-split-plan.md`。

這項批准只涵蓋新增空 collections 與 migration readiness，不等於批准：

- Preview／Production migration 執行；
- 五筆舊資料 copy；
- 前台或 seed 切換到新 collections；
- drop／rename／rewrite `travel_projects`。

舊 `TravelProjects` 仍是目前 runtime source。下一個可逆步驟是 Production read-only inventory 與 copy dry-run；完成逐欄 mapping evidence 後，再請網站擁有者批准 data-copy write。

## Phase 17 Production inventory 結果

2026-07-15 已完成 Production 唯讀 inventory 與 copy-readiness artifact，確認 2 筆 Plans（1 active、1 archived）、3 筆 Memories，且目標三張主表尚未套用。三筆 Memories 的 schema 已依真實非空欄位補強，因此 Memory domain 不再以刪除詳細 ledger／daily itinerary 換取表面上的 schema 精簡。

目前 data-copy write 仍為 **blocked**：

- additive migrations 尚未套用；
- 12 筆 Media、2 筆 TimelineEvents、1 筆 HomeConfig 仍引用舊 collection；
- 兩筆 Plans 的結構化規劃欄位尚未完成 conflict／等價性決策。

最新 Production read-back 已將五筆粗粒度 conflict 收斂為兩筆 Current-only Admin edits；但 lossless copy readiness 經第二輪審查修正為 0 ready／5 blocked。三筆 Memories 仍需保存 legacy `sourceSections` 的 level／display／interaction metadata；五筆舊 `sourceMetadata.baseProjection` 也不能原樣冒充新 schema 的 reconciliation Base。建議 Plan 與 Memory 都使用 nullable migration snapshot 保存 legacy Current／Base evidence，再用目標 transformer 重建新的 Base，而不是把所有舊寬表欄位重新變成正式 domain fields。

詳細 evidence：`docs/phase-artifacts/phase-17/travel-collection-copy-readiness.md`。在上述三類 blocker 歸零前，Issue #57 不進入 destructive migration。
