# Phase 17 Travel Migration／Data-copy 執行與批准包

更新日期：2026-07-16
目前狀態：**執行包已備妥；Production migration 與 data-copy 尚未批准、尚未執行。**

## 白話摘要

這次不是把舊 `travel-projects` 直接改名，也不會先刪除任何舊資料。執行順序是：

1. 先新增 `travel-plans`、`travel-memories` 與三組「新關聯欄位」。
2. 在同一個 database transaction 內，把 5 筆 travel 複製到新 collections，並把 12 筆 Media、2 筆 TimelineEvents、1 筆 HomeConfig 的新關聯一併填好。
3. 舊 travel records 與舊關聯欄位完全保留，網站仍可依現有程式讀取舊資料。
4. copy 後先執行 read-back、Preview／Production QA 與觀察；之後才另案批准 runtime cutover。
5. 刪除舊 table／欄位是更後面的 destructive cleanup，本包不包含。

因此，本包的 rollback 不是「copy 後立刻刪新表」，而是保留舊 runtime、修正新資料或在確認新影子關聯為空後才允許 migration DOWN。這能避免為了回退新資料而破壞仍正常運作的網站。

## 已凍結的 Production inventory

2026-07-16 的只讀 `inspect` 結果：

- 5 筆舊 travel：2 筆 Plans、3 筆 Memories。
- record-level blockers：0。
- 新目標 rows：Plans 0、Memories 0、Route identities 0。
- 舊關聯：Media 12、TimelineEvents 2、HomeConfig featured travel 1。
- 新影子關聯：全部 0。
- 5 份 Phase 17 migrations 均尚未套用。
- database fingerprint：`db:f186aaf5a523`。
- 本文件不保存可直接執行的 approval fingerprint；implementation 或資料一變，舊值即失效。取得 Production write 批准後，必須重新執行 `inspect`，只使用同一次輸出的 command。

fingerprint 不是永久密碼。它綁定 database identity、copy CLI／executor implementation、五筆 copy 後內容、每份 migration 檔案 hash 與每筆關聯的精確 source／owner ID；任何 target database、執行程式、內容、record、migration SQL／snapshot 或關聯映射改變，都必須重新執行 inspect，並只使用新輸出的 fingerprints。

## Migration 順序

必須依 `src/migrations/index.ts` 的固定順序一次執行：

1. `20260715_073322_phase_17_add_travel_collections`
2. `20260715_094310_phase_17_expand_travel_memory_preservation`
3. `20260716_045235_phase_17_align_travel_plan_sections`
4. `20260716_091228_phase_17_align_travel_memory_sections`
5. `20260716_094718_phase_17_add_travel_cutover_relationships`

第五份 migration 只新增：

- Media `relatedTravelRecord`
- TimelineEvents `relatedTravelRecord`
- HomeConfig `featuredTravelRecord`

三者皆為 optional polymorphic relationship，可指向 `travel-plans` 或 `travel-memories`。舊 `relatedTravel`／`featuredTravel` 不改名、不刪除，現有 runtime 不會被迫提前 cutover。第五份 migration 的 DOWN 在影子關聯非空時會拒絕執行，避免無聲遺失已 copy 的關聯。

## 執行命令

所有命令固定使用 Node `20.20.2`。一次只允許一位 operator 執行 migration／copy，不與 deploy 或其他 seed 同時進行。

### 1. Migration 前只讀檢查

```bash
pnpm run seed:travel:copy inspect
```

必須確認：

- `recordBlockers = 0`
- target row counts 全為 0
- shadow relationship counts 全為 0
- 輸出的 projects、舊關聯數量與批准內容一致

### 2. 套用 additive migrations

此步驟會修改 database schema，必須另外取得 Production migration 批准後才能執行：

```bash
pnpm exec payload migrate
```

完成後重新執行 `inspect`；必須確認 5 份 migrations 都已 applied，target 仍為空，fingerprint 與批准時相符。

### 3. Transactional data-copy

只有取得 data-copy write 批准後，才使用 inspect 當下輸出的完整命令。格式如下：

```bash
TRAVEL_COPY_TARGET_CONFIRM=<inspect 輸出的 database fingerprint> \
  TRAVEL_COPY_WRITE_CONFIRM=<inspect 輸出的 approval fingerprint> \
  pnpm run seed:travel:copy apply -- --allow-write
```

`apply` 的安全性：

- 沒有 `--allow-write` 就拒絕。
- database 或 approval fingerprint 不符就拒絕。
- 任何 migration 未 applied、record blocker 非 0、或 target 非空就拒絕。
- transaction 開始後會重新讀取 Payload Current 與所有 legacy reference mappings，重算 approval fingerprint；與 transaction 外批准內容不同就 rollback。
- transaction 會先以固定順序對 legacy／target 主表取得 `SHARE ROW EXCLUSIVE` table locks；從 transaction 內重讀、copy 到 commit 期間，Admin、seed 或另一個 copy process 都不能同時改動這些 records。locks 在 commit／rollback 時由 PostgreSQL 自動釋放。
- 全部 5 筆 create、中英文 localized update、route identity hooks 與 15 筆影子關聯 update 共用同一個 Payload request transaction。
- 任一步驟失敗會 rollback；不會留下半套 copy。
- 不修改 `travel-projects`、舊 relationship 欄位或 `content-source/`。

### 4. Read-back

```bash
TRAVEL_COPY_TARGET_CONFIRM=<批准時的 database fingerprint> \
  TRAVEL_COPY_WRITE_CONFIRM=<批准時的 approval fingerprint> \
  pnpm run seed:travel:copy verify
```

verify 必須確認：

- Plans 2、Memories 3、Route identities 5。
- 三組 target slug 與 5 筆 manifest 完全相符。
- 新影子關聯為 Media 12、TimelineEvents 2、HomeConfig 1，且逐筆 owner ID、target collection、target slug 都與 frozen mapping 相符。
- 舊關聯仍為 Media 12、TimelineEvents 2、HomeConfig 1。
- record transformers 仍為 0 blockers。
- 中英文與 nested arrays 的完整 target content 與批准 manifest 相符；Payload 自動產生的 row IDs／timestamps 不參與內容比較。

## Rollback 與停止條件

### Migration 後、copy 前

若網站檢查或 schema inspection 失敗，target 與影子關聯仍為空時，可在 maintenance window 依 Payload migration 流程回退。四份 section migrations 與第五份 relationship migration 都有 empty-data guard。

### Copy transaction 內失敗

CLI 會 rollback 同一個 request transaction。停止後重新執行 `inspect`，target 與影子關聯應回到 0；若不是 0，不可重跑 apply，需先調查 transaction／hook 行為。

### Copy commit 後驗證失敗

不要執行 destructive DOWN，也不要刪除舊表。因 runtime 尚未 cutover，網站仍使用舊 `travel-projects`。先停止後續 deploy，保存 verify 輸出，針對新 collections 修正或設計受控清除方案；任何清除都需新的明確批准。

## 本地驗證紀錄

已完成：

- Payload types 重新生成。
- Phase 17 schema、transformer、locale materialization、nested array ID、approval gate、transaction executor 單元測試。
- `pnpm tsc --noEmit`。
- `pnpm run build`。
- Production 只讀 inspect；確認 5 ready／0 blocked、12／2／1 舊關聯與 5 份 missing migrations。
- migration UP／DOWN 人工審查；第五份 DOWN 已加入非空影子關聯拒絕條件。
- Docker PostgreSQL 17 disposable database 實跑。先以 `pg_dump --schema-only --schema=public` 只讀取得 Production schema，不複製任何 Production rows，再建立 synthetic 5-travel／12／2／1 fixture。
- 五份 Phase 17 migrations 全部成功：155ms、29ms、9ms、6ms、10ms。
- 第一次本地 apply 在 Media localized validation 失敗；同一 transaction 成功 rollback，確認 target Plans 0、shadow Media 0。修正 reference update 固定使用 `zh-TW` locale 後，第二次 apply 成功 commit。
- 本地 verify 通過：Plans 2、Memories 3、Route identities 5；5 個 slugs、完整中英文／nested content、12 筆 Media owner mappings、2 筆 TimelineEvent mappings、1 筆 HomeConfig mapping 全部相符。
- commit 後再次 apply 正確被 `Travel copy targets must be empty before apply` 拒絕，證明不可重複匯入。

本地真實 database 演練已完成，但 synthetic fixture 不是 Production rows。Production 執行前仍建議在可丟棄的 Preview database clone 再完成一次相同 `migrate → inspect → apply → verify` 演練；這項建議不等於本輪已批准 Preview 或 Production write。

## 本輪不批准的事項

- Production `payload migrate`
- Production `seed:travel:copy apply`
- runtime dual-read／cutover
- 清空或刪除 `travel-projects`
- 刪除舊 relationship 欄位
- Issue #50／#57 關閉

上述每一項都要依實際完成狀態另行批准；「執行包準備完成」不等於「Production migration 已批准」。
