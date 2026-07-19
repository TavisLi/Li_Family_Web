# Phase 17 Travel Data API Security Migration 批准包

更新日期：2026-07-17
目前狀態：**Production security migration、獨立 verify 與 Payload owner read-back 已完成；runtime cutover 已在本地實作及驗證，尚未 deploy。**

## 白話摘要

網站目前透過伺服器端 Payload Local API 與 PostgreSQL owner 連線讀寫資料，不需要瀏覽器直接存取 Supabase Data API。因此本次不替 `anon` 或 `authenticated` 建立任何 allow policy，而是：

1. 對 Phase 17 的 67 張新表，以及本階段改動的 3 張 Payload relationship tables，共 70 張表啟用 RLS。
2. 撤銷 `anon`、`authenticated` 對這 70 張表的所有 table privileges。
3. 不變更 Payload database owner、`service_role` 或全域 default privileges。
4. 不刪除舊表、不改資料、不切換 runtime。

實際效果是：即使 Supabase Data API 暴露 `public` schema，瀏覽器端的 anonymous 或 signed-in JWT role 也無法繞過 Payload access rules 讀寫這批 travel tables；Payload server runtime 仍照原本方式工作。

Supabase 官方將 grants 與 RLS 視為兩道不同防線：grants 決定角色能否操作 table，RLS 決定可見／可改的 rows。既有專案也不應假設新 table 一定沒有 Data API grants，因此兩者在同一 migration 一起處理：

- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Secure your data](https://supabase.com/docs/guides/database/secure-data)
- [Data API grant default breaking change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)

## Migration 與執行器

- Migration：`20260717_121714_phase_17_secure_travel_data_api`
- UP：逐表 `ENABLE ROW LEVEL SECURITY`，再對 `anon, authenticated` 執行 `REVOKE ALL PRIVILEGES`。
- 不建立 allow policy；RLS 採 deny-by-default。
- DOWN：逐表 `DISABLE ROW LEVEL SECURITY`，並恢復兩個角色的 `ALL PRIVILEGES`，只供明確 rollback 使用。
- Controlled CLI：`pnpm run seed:travel:secure-data-api <inspect|apply|verify>`。

`apply` 會把 database identity、70 表的 RLS／grants 現況、migration record 與 implementation hash 綁成一次性 approval token。取得明確 Production write 批准後，operator 必須重新執行 `inspect`，只使用同一次輸出的 target 與 token。transaction 內會鎖住 `payload_migrations`、重讀狀態、套用同一份 migration SQL、寫入 migration record，並以 savepoints 跑完 16 組 `SET ROLE` 負向測試；任一狀態漂移或測試不符即 rollback。commit 後再跑一次完整 verify。

## Production 唯讀基線

2026-07-17 inspect 結果：

- database fingerprint：`db:f186aaf5a523`
- 70/70 protected tables 存在。
- RLS enabled：0/70。
- anon 有 privileges：70/70。
- authenticated 有 privileges：70/70。
- security migration record：不存在。

本文件不保存可直接執行的 approval token。程式碼、migration 或 Production state 任一改變，都必須重新 inspect 與重新批准。

## 本地 PostgreSQL 17 演練

在 disposable `postgres:17-alpine` database 建立目前 Payload schema，建立 `anon`／`authenticated` roles，並先授予 Supabase-like table／sequence privileges。基線 inspect 與 Production 一致：70 張皆 `RLS=false`，兩角色皆有 table privileges。

controlled apply 完成後：

- migration record：存在。
- RLS enabled：70/70。
- anon 有 table privileges：0/70。
- authenticated 有 table privileges：0/70。
- `anon`：8 組 SELECT／INSERT／UPDATE／DELETE 全部回傳 SQLSTATE `42501`。
- `authenticated`：8 組 SELECT／INSERT／UPDATE／DELETE 全部回傳 SQLSTATE `42501`。
- 測試涵蓋三張主表、localized child table、shared `media_rels`、INSERT、UPDATE 與 DELETE。
- Payload Local API owner 可讀三個新 collections。
- PostgreSQL owner 可在 transaction 內 INSERT／DELETE 並 rollback，證明未使用 `FORCE ROW LEVEL SECURITY`，不阻斷 server runtime。

## Production 執行條件

Production 已依下列受控流程執行完成；命令保留作為稽核格式，不得使用歷史 token 重跑：

```bash
pnpm run seed:travel:secure-data-api inspect

TRAVEL_SECURITY_TARGET_CONFIRM=<同次 inspect 的 database fingerprint> \
  TRAVEL_SECURITY_WRITE_CONFIRM=<同次 inspect 的 approval token> \
  pnpm run seed:travel:secure-data-api apply -- --allow-write

pnpm run seed:travel:secure-data-api verify
```

## 2026-07-17 Production 執行紀錄

- fresh inspect：database fingerprint `db:f186aaf5a523`、implementation fingerprint `impl:be80a5e2b1af`；70/70 tables 存在、RLS 0/70、anon/authenticated 均為 70/70 有 table privileges，migration record 不存在。
- controlled apply 使用同次 inspect token，在單一 transaction 內完成 70 張表 RLS、grants revoke、batch 7 migration record 與 commit 前 16 組 savepoint negative tests；明確回傳 `committed: true`。
- commit 後獨立重新連線 verify：RLS 70/70、anon 有 privileges 0/70、authenticated 有 privileges 0/70；兩角色各 8 組 SELECT／INSERT／UPDATE／DELETE 全部回傳 SQLSTATE `42501`。
- Payload Local API owner read-back：legacy `travel-projects` 5、`travel-plans` 2、`travel-memories` 3、`travel-route-identities` 5。
- migration history：`20260717_121714_phase_17_secure_travel_data_api` 為 batch 7；既有 `dev/-1` record 保留。
- 正式站 HTTP smoke：`/`、`/travel`、`/family/login` 均回傳 200，未出現 runtime 500。
- 本輪沒有 runtime code cutover、資料 copy、舊表／欄位刪除或其他 Production mutation。

## Runtime cutover 評估

security blocker 已解除，本地 runtime cutover 實作與驗證已完成：

- `src/lib/data/travel.ts` 已停止查詢 `travel-projects`，改讀 `travel-plans` 與 `travel-memories`，再轉為共用 runtime view model。
- `src/lib/data/home.ts` 已改用新 `featuredTravelRecord`；以 collection + id 做套用目前 session access rules 的精確查詢，不直接信任 global relationship depth，也不受首頁列表筆數限制。
- 新 collection 查詢採依序執行，避免本地 browser rehearsal 實際重現的 Supabase pooler connection timeout。
- Phase 17／16／9 tests、TypeScript 與 Node 20.20.2 Production build 通過。
- 公開訪客 `/travel` 與首頁 browser smoke 通過，family-only records 未出現在頁面；Production owner 唯讀 adapter probe 確認 2 Plans／3 Memories 皆能完整轉換。

這些證據只代表目前 branch 可進入 Preview／deploy gate，**不代表 Production runtime 已切換**。仍需完成 family-mode Preview／browser QA、部署與 rollback observation window。舊表／舊欄位清理仍是最後的 destructive phase，必須等待正式 cutover、觀察期與獨立批准。
