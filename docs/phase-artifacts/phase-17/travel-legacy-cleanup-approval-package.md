# Phase 17：Travel Legacy Cleanup 執行核准包

## 目的

本包負責 Phase 17 最後一段 destructive cleanup：在新 runtime 已部署、資料已複製，且已具備可復原備份或網站擁有者明確接受無備份資料遺失風險的前提下，移除不再被程式使用的 legacy `travel_projects` schema。它不修改 `travel-plans`、`travel-memories` 的內容，也不重新執行 data-copy。

白話來說：網站現在已改從兩張新表讀取；這一步是把仍留作保險的舊表與舊關聯清掉。因為刪除後不能靠 DOWN migration 找回舊資料，預設必須有可核對的備份。2026-07-29 Supabase Dashboard 唯讀盤點確認 Free 方案沒有 Scheduled Backup 或 PITR；網站擁有者隨後明確選擇不備份繼續，接受 cleanup 後無法回復 legacy 資料的風險。此為本次一次性 operational waiver，不改變未來 destructive migration 的預設備份要求。

此例外的持久決策紀錄為 ADR-0008。

## 實際刪除範圍

- legacy `travel_projects` 主表、locales、relationships 與 nested arrays：共 33 張表。
- `media.related_travel_id`。
- `timeline_events.related_travel_id`。
- `home_config.featured_travel_id`。
- `payload_locked_documents_rels.travel_projects_id`。
- legacy enum `enum_travel_projects_status`。
- Payload collection config、generated types 與已失效的一次性 copy／baseline 工具。

保留內容：

- `travel_plans` 2 筆、`travel_memories` 3 筆、`travel_route_identities` 5 筆。
- Media 22、TimelineEvents 2、HomeConfig 1 的新 polymorphic relationships。
- 歷史 migration files、Phase 16／17 conflict evidence 與決策文件。
- `payload_migrations` 的既有 `dev/-1` 與 batch 1–7 records。

## 自動停止條件

controlled executor 會在寫入前與 transaction 鎖表後各檢查一次，任一條件不符即拒絕：

1. Production runtime deployment 必須是包含本 cleanup code 的已審查 `main` commit，狀態為 success；executor 會要求 Vercel deployment SHA 與執行時本地 checkout `HEAD` 完全一致，避免用舊 runtime 刪除仍被 Payload config 宣告的 legacy tables。
2. 必須二選一：提供 backup reference、建立時間與驗證時間；或提供精確的 no-backup waiver、接受時間，並確認沒有同時填入任何會被誤認為有效備份的 metadata。
3. inventory 必須維持 legacy 5、Plans 2、Memories 3、Route identities 5，且兩筆 Plans／三筆 Memories 均為 public published。
4. 舊／新 relationships 必須成對維持 Media 22／22、TimelineEvents 2／2、HomeConfig 1／1；shadow 以實際 row count 計算，逐 owner／canonical slug 驗證，重複或額外錯誤 row 也會拒絕。
5. 33 張舊表與四個舊 relationship columns 必須完整存在。
6. `dev/-1`、既有 batch 1–5、batch 6 的五份 schema migrations 與 batch 7 security migration 必須完整存在；batch 8 cleanup record 必須尚未存在。
7. database、implementation、recovery mode（verified backup／no-backup waiver）、deployment 與 inventory 會共同產生 approval token；任何漂移都令舊 token 失效。

## Transaction 行為

`apply` 只接受 `--allow-write`、database fingerprint、approval token 與 recovery confirmation 四重確認。備份模式的 recovery confirmation 是 backup reference；無備份模式必須是精確字串 `I_ACCEPT_IRREVERSIBLE_PHASE_17_LEGACY_DATA_LOSS`。執行時會：

cleanup migration 在 Production 執行完成前刻意不註冊到 Payload 預設 migration index，因此一般 `pnpm exec payload migrate` 無法繞過專用 executor。Production cleanup verify 通過後，才以後續紀錄變更把已執行的 batch 8 migration 納入 index。

1. 鎖定 migration、舊／新 travel 主表及所有受影響 relationship tables。
2. 在鎖內重讀並重算同一 token。
3. 先驗證新資料與 shadow relationships 完整。
4. 先移除外部 foreign keys、indexes 與舊 columns，再一次刪除 33 張 legacy tables 與 enum。
5. 寫入 `20260719_025401`、batch 8 migration record。
6. commit 前確認新表仍為 2／3／5、舊表與舊 columns 均為 0；任一步失敗就 rollback。

## 回復方式

DOWN migration 會明確拒絕建立空的 legacy tables，因為空表不是資料回復。有 verified backup 時，若 cleanup 後需要回復，唯一正確方式是：

1. 回退到 cleanup 前 deployment。
2. 從已驗證的 cleanup 前 database backup／PITR restore。
3. 重新執行 owner read-back，確認五筆 legacy travel 與 22／2／1 relationships。

若使用本次 no-backup waiver，步驟 2 不存在：deployment 可以回退，但已刪除的 legacy tables、五筆 legacy records 與舊 relationships 無法重建。新 `travel_plans`／`travel_memories` runtime records 仍由 transaction read-back 保護，但不能把它們宣稱為 legacy schema 的完整備份。

## 本地演練結果（2026-07-19）

- 使用 disposable `postgres:17-alpine`。
- 載入 Production schema-only dump；未複製 Production rows。
- 建立 synthetic legacy 5、Plans 2、Memories 3、Route identities 5 與 12／2／1 雙邊 relationships。
- 負向演練把一筆 Media shadow relationship 改指另一個 Plan；即使總數仍為 12／12，inspect 仍因逐 owner／canonical slug mapping 不一致而拒絕。
- 修正 synthetic mapping 後 inspect 通過，token：`phase-17-cleanup:47b6f3d1a6cb5c0c`（只屬於本地一次性 DB，不可用於 Production）。
- 單一 transaction apply committed；read-back 為 Plans 2、Memories 3、Route identities 5、legacy tables 0、legacy columns 0。
- migration record `20260719_025401` 為 batch 8；既有 `dev/-1` 與 batch 1–7 records 未更動。
- 獨立 verify 再次通過。

## 22／22 基線複驗（2026-07-29）

- 使用一次性 `postgres:17-alpine`，只載入 synthetic schema／rows，沒有連線或複製 Production 資料。
- 基線與最新 Production inventory 對齊：legacy 5、Plans 2、Memories 3、Route identities 5、Media 22／22、TimelineEvents 2／2、HomeConfig 1／1，且 Plans 2、Memories 3 均為 public published。
- 直接執行目前 `20260719_025401` migration SQL，guard 通過並完成 cleanup。
- cleanup 後獨立 read-back：legacy tables 0、legacy columns 0；Plans 2、Memories 3、public published Plans 2／Memories 3、Route identities 5；shadow relationships 維持 Media 22、TimelineEvents 2、HomeConfig 1。
- 本次複驗亦確認 migration 的 Production relationship guard 已由舊 12／12 baseline 修正為現行 22／22，且 executor 的 post-readback 會檢查 22／2／1 shadow relationships。

## Production 現況與尚缺批准

- PR #59 merge commit 已完成 runtime cutover。2026-07-28 最新 `main@edc9bf5` 的 Vercel Production deployment 為 `READY`；正式 `/travel` HTML 已顯示三類旅行內容，canonical 使用 `https://li-family-web.vercel.app/travel`，未再出現 localhost。
- PR #66 已將原 controlled cleanup code 合併至 `main@f98576c` 並完成 Production runtime deployment；本次新增的 no-backup waiver 仍須另行 PR、merge 與 deployment，最終執行時 deployment SHA 必須與本地 `HEAD` 完全一致。
- 2026-07-29 Supabase Dashboard 唯讀盤點確認 Free 方案沒有 Scheduled Backup、backup reference、retention 或 PITR；沒有執行 upgrade、restore、建立 project 或產生費用。
- 網站擁有者已明確選擇不備份繼續，接受 legacy schema／records 刪除後無法回復；executor 仍須以精確 waiver confirmation 產生當次 approval token。
- Production H4、H6 與 H7 發布狀態修復已完成；no-backup executor 尚待 PR／deployment，因此尚未產生最終 cleanup approval token，也尚未執行 batch 8。

## Production H4 唯讀盤點（2026-07-28 23:06 CST）

盤點以資料庫 `READ ONLY` transaction 執行，沒有寫入、migration、delete 或 drop：

- Database fingerprint：`db:f186aaf5a523`。
- Production deployment：`main@edc9bf55dd69a3fb1197435ba20bf01077b5b096`，Vercel `READY`。
- Records：legacy projects 5、Plans 2、Memories 3、Route identities 5。
- Schema：legacy tables 33、legacy relationship columns 4。
- Relationships：TimelineEvents 2／2、HomeConfig 1／1。
- Media 現況為 legacy 22、shadow 21，發現 1 筆不一致：
  - Media `id=1472`、`202702-thailand-phuket-gallery-001.webp`
  - legacy owner：`202702-thailand-phuket`（planning）
  - 新 `travel-plans` shadow relationship：缺少；正確 target 為 `travel_plans.id=2`、slug `202702-thailand-phuket`
- 相鄰 Phuket Media 的既有 row shape 均為 `order=null`、`path=relatedTravelRecord`、`travel_plans_id=2`、`travel_memories_id=null`；因此 H6 修復可被限制為只替 `parent_id=1472` 新增同形 relationship，且必須先重驗該 row 仍不存在。
- 依旅程分組：重慶 12／12 完整；普吉島 10 筆 legacy media 中只有 9 筆 shadow 完整。
- batch 6 的五筆 Phase 17 schema migration 與 batch 7 security migration 均存在；batch 8 cleanup migration 尚未存在。

結論：Production 沒有 travel record 遺失，但盤點當下不符合 destructive cleanup 前置條件。原 Media 12／12 baseline 已因後續內容增加而過時，修復後正確基準為 22／22。

## Production H6 單筆 Relationship 修復（2026-07-28 23:15 CST）

- 寫入前 `READ ONLY` dry-run 再次確認 database fingerprint `db:f186aaf5a523`、Media 22／21、invalid mappings 1，且 `parent_id=1472` 尚無 `relatedTravelRecord`。
- 在單一 serializable transaction 中鎖定 `media_rels` 與目標 owner rows，只執行一筆 `INSERT`；沒有 update、delete、Travel content mutation 或其他 Media mutation。
- 新增 row：`media_rels.id=79`、`order=null`、`parent_id=1472`、`path=relatedTravelRecord`、`travel_plans_id=2`、`travel_memories_id=null`。
- Commit 前 read-back：Media 22／22、invalid mappings 0；Travel records 5／2／3／5、TimelineEvents 2／2、HomeConfig 1／1 均未改變。
- Commit 後以獨立連線及 `READ ONLY` transaction 再驗證，結果維持 Media 22／22、invalid mappings 0，且只有上述一筆 target relationship。
- 若需要回退這次內容修復，刪除 `media_rels.id=79` 屬於新的 destructive mutation，必須另行批准；本次未執行回退。

H6 修復已通過。Destructive cleanup 前仍必須完成 no-backup waiver code merge／Production deployment，然後重新執行 controlled inspect 產生當次 approval token。

## Production H7 Travel Memory 發布狀態修復（2026-07-29）

- 正式站登入管理員時顯示三筆 Memory，但匿名 HTML 只顯示 `202602-thailand-phuket`；唯讀資料庫盤點確認 `201307-hainan`、`202308-east-australia` 仍為 `_status=draft`。
- 根因是 Phase 17 data-copy transformer 嘗試複製 legacy `_status`，但 legacy `travel_projects` 沒有 Payload drafts 欄位，目標表因而採用 schema 預設 `draft`；舊 verify 只比對 manifest 中存在的欄位，沒有把 published visibility 納入驗收。
- 經網站擁有者另案批准，以單一 guarded SQL statement 只將上述兩個 slug 的 `_status` 從 `draft` 改為 `published`；statement 必須同時找到兩筆 `is_private=false` 的 draft，否則更新 0 筆。
- Mutation 回傳恰好兩筆；獨立 read-back 確認三筆 Memory 均為 `published`、`is_private=false`。
- 其他 inventory 維持 legacy／Plans／Memories／Route identities 5／2／3／5、Media 22／22、TimelineEvents 2／2、HomeConfig 1／1，batch 8 record 仍為 0。
- 匿名正式 `/travel` HTML 已同時找到 `201307-hainan`、`202308-east-australia`、`202602-thailand-phuket` 三筆 route。

## 2026-07-28 最新 main 本地再驗證

以下驗證已在 Node `20.20.2`、`codex/phase-17-closeout` 執行通過：

- `pnpm exec payload generate:types`
- `pnpm run test:seed-content`
- `pnpm run test:phase-9`
- `pnpm run test:phase-16`
- `pnpm run test:phase-17`
- `pnpm run build`
- `pnpm tsc --noEmit`
- `git diff --check`

另已人工確認 cleanup UP migration 僅移除批准清單中的 legacy columns／tables／enum，不含 `CASCADE`；DOWN migration 明確要求以 backup restore 回復資料。

因此，目前可以提交與審查本 cleanup PR，但不得執行 Production `apply`，Issue #50／#57 也尚不能宣稱完成。

## 指令

```bash
pnpm run seed:travel:cleanup inspect
pnpm run seed:travel:cleanup apply -- --allow-write
pnpm run seed:travel:cleanup verify
```

Production 執行時的 confirmation variables 必須直接採用當次 inspect 輸出；不得使用本文件的本地 token。

本次 no-backup inspect 還必須明確提供：

```bash
TRAVEL_CLEANUP_NO_BACKUP_ACCEPTED_AT=<approved timestamp>
TRAVEL_CLEANUP_NO_BACKUP_WAIVER=I_ACCEPT_IRREVERSIBLE_PHASE_17_LEGACY_DATA_LOSS
```
