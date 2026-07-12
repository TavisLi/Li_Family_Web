# Phase 16 TravelProjects Table Schema 變更說明

## 文件目的

這份文件用白話說明 Phase 16 對 `travel_projects` table 做了什麼、為什麼需要這些欄位、現有旅行資料是否受影響，以及下一步應如何安全建立 reconciliation baseline。

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

### 為什麼目前仍不批准 Production write

全量 Phase 9 seed 同時包含 users、travel 與 media。Controlled dry-run 發現 10 筆 media create 全部屬於 Tavis member assets，其中包含工作樹原有、尚未納入 Phase 16 的圖片變更。

若現在直接執行全量 seed，會把「建立 travel baseline」與「上傳／關聯 Tavis 圖片」混在一起，超出本次批准範圍。因此目前停在 dry-run review，不執行 Production write。

## 建議執行計畫

### 計畫 A：先建立 travel baseline（travel-only 入口已完成）

1. Travel-only safe seed 入口已完成，會排除 users、member media、blog 與 Home Config。
2. Travel-only Production dry-run 已完成：五筆 travel preserve，751 travel media skip，其餘 action 為 0。
3. 取得網站擁有者對「只寫入五筆 travel 的 source metadata」明確批准。
4. 執行一次 `pnpm run seed:travel` safe baseline write。
5. 驗證：
   - row count 仍為 5；
   - published travel fields 未改；
   - 五筆 `sourceFile/sourceHash/parserVersion/baseProjection` 已建立；
   - `lastImportedAt` 依實際決策保持正確語意；
   - 第二次 dry-run 不再把 legacy 誤認為可覆蓋。

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
