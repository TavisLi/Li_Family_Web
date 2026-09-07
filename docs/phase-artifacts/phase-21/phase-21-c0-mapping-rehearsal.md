# #101 C0 itinerary mapping SQL 本地 rehearsal

日期：2026-09-05。結果：`C0_MAPPING_SQL_REHEARSAL_PASS_SYNTHETIC_ONLY`。

使用 Node 20.20.2、PostgreSQL `17-alpine` cached image，在本次專用 `li-family-phase21-c0-mapping` container 執行；`--network none`、資料目錄 tmpfs，不讀取 `.env` 或 Production credentials。測試只建立 temporary tables，最後 ROLLBACK；Production connections=0。完成後停止容器，tmpfs synthetic 資料不保留。

執行入口：`src/scripts/phase21-c0-mapping-rehearsal.mjs`。Fixture：`src/scripts/phase21-c0-mapping-rehearsal.sql`。入口載入實際候選 SQL 而非複製查詢，於同一 session 建立 temporary SQL function 並執行斷言。

候選 SQL SHA-256：`748e16bb3e75dab3710e379eca67c6f39df06313c3a4542edec6e6cc0af61ccf`。

已驗證：

- 精確三筆 Memory scope，排除第四筆 Plan slug 與 galleryImages path。
- 相同 Media 的多筆 legacy 關聯及多筆 Placement 都保留計數，不靜默去重。
- Draft Day 的 Placement 可列候選，但不算 published keyed candidate。
- 同一 Media 出現在另一筆 Memory，不算本 Memory destination。
- 空 placement key 不算合格 published candidate。
- 第一頁最多 101 列；以前 100 列最後 id 作下一頁 cursor，保留 sentinel，不漏列。

限制：synthetic schema 僅覆蓋本查詢所用欄位，非完整 Payload migration rehearsal；尚未驗證實際 Production query cost、欄位權限、RLS、response byte cap、timeout 或完整 executor。候選計數亦未證明內容／caption／順序等價。這份 PASS 不代表 C0 完成或 cleanup readiness。

## 分頁執行邊界的離線測試

`node --test src/scripts/phase21-c0-pages.test.mjs` 在 Node 20.20.2 通過 12 項測試。`phase21-c0-pages.mjs` 固定三筆 Memory scope，每頁接受最多 101 列（100＋sentinel）、64 KiB 回應、合計 1 MiB／50 頁上限。驗證排序嚴格遞增、count 有效及 published candidate 為全部 candidate 子集合；查詢例外直接傳回，不重試。

案例包括分頁不遺失／不重複、空結果、query failure、錯誤 scope、重複 id、單頁 row／byte cap、負 count、不可能的 subset、cursor 停滯、total byte cap、page budget。全部使用記憶體 fixture，Production connections=0。

此模組尚未接入 Production executor。Byte cap 目前在完整回應到達後驗證，不能宣稱已限制 PostgreSQL 傳輸或 driver allocation；正式 executor 仍須加入 server-side response cap、交易 timeout、checkpoint、before／after 與私有證據寫入驗證。

## Server-side response cap 補充驗證

新增 `phase21-c0-response.mjs`：以 materialized CTE 將已限制列數的查詢轉成按 relation id 排序的 JSON；PostgreSQL 計算 UTF-8 bytes，超過 65536 時 body 回傳 NULL，僅傳回大小。Client decoder 驗證 envelope、byte count 與 JSON array。此限制控制回傳 body，不限制 PostgreSQL 內部計算記憶體；仍需 statement timeout。

15 項 Node 離線測試通過；PostgreSQL rehearsal 增加 bounded mapping parity 與超限 body=NULL，合計 9 類案例通過。首次本地測試因 JavaScript `replace` 將 SQL `$$` 轉成 `$` 而失敗，transaction 隨 session 結束回滾；改用 replacement callback 後重跑通過。此修正僅屬本地測試，不是 Production 重試。

完整 Production executor 仍未整合，C0 尚未完成。容器已停止，Production connections=0。

## 唯讀 session 組裝驗證

`phase21-c0-session.mjs` 已整合 bounded SQL、decoder 與 keyset pages：同一 client 依序開兩個獨立 repeatable-read read-only transactions，核對 15 秒 statement timeout，前後 rows 精確比較。每次查詢留 STARTED／PASS checkpoint；讀取或 checkpoint 失敗即中止後續讀取，開啟的交易仍嘗試 ROLLBACK，保留原始失敗。這是關閉唯讀交易，不是資料恢復操作。

新增 7 項 session 行為測試，連同既有模組共 22 項 Node 測試通過。包括 post-BEGIN checkpoint failure 仍關閉交易。測試使用 injected client，未聲稱 PostgreSQL settings 已實測；正式 client 的連線逾時、持久 checkpoint、inventory 其他查詢、私有 snapshot 與整體 deadline 仍待接入。

## 私有證據保存模組

`phase21-c0-evidence.mjs` 新增獨立 run directory（0700）、逐筆 checkpoint 與單一 snapshot（0600、exclusive create、O_NOFOLLOW）。寫入後 fsync 並透過同一 file handle 回讀 bytes／hash；重複 run 或 snapshot 即停止，既有內容保留。Checkpoint 僅允許 label／queryCount／state，不接受 raw error 欄位。單份證據上限 2 MiB。

`phase21-c0-evidence.test.mjs` 的 4 項實際 filesystem 測試通過：權限與回讀、不覆寫、symlink／unsafe directory 拒絕、checkpoint 欄位與容量限制、run path 驗證。測試資料只存作業系統 temporary directory，內容全為 synthetic。這不是 Production before snapshot；入口仍須在連線前驗證實際 parent 路徑已 Git-ignored，再將此模組接入 session。

## Parent inventory 查詢驗證

新增 `phase-21-c0-parent-inventory.sql`，固定 slug scope，回傳 parent status、locale／version／latest、legacy highlights／media counts 及 Day／Moment／Placement counts；最多 4 列以偵測不符合三筆 parent 的結果。SHA-256：`a3f4e1bb1e72a3ff7e96d6fc82c40934c3fc9e3ec753438e2108341e76f00616`。

PostgreSQL synthetic rehearsal 現在共 10 類案例通過，新增驗證三筆 scope、latest version id、draft 狀態保留與 zero-Day parent。`phase21-c0-parents.test.mjs` 另有 3 項驗證通過：唯一 parent、唯一 latest 與 count 合法性，不使用舊 17 Days 或舊 version count。這些 synthetic id／counts 並非 Production 觀測。

完整 C0 尚缺每日 legacy highlight destination、實際 Placement destination 明細、security／history inventory 及 CLI 整合。此次本機容器已停止，Production connections=0。

## Placement destination 明細補充

Mapping SQL 現在回傳每一候選的 Day id/key/status、Moment id/key、Placement id/key，依固定順序排列；最多 20 候選，21 筆起回傳 NULL 讓 client BLOCK，不能把前 20 筆當作完整結果。Client 比對 destinations.length 與 candidate_count；session 前後比較亦涵蓋實際 destination identity。

新增明細／超限 PostgreSQL 斷言通過，pages＋session 21 項 focused tests 通過。SQL 新 SHA-256：`757b8954f5478ccd33024c6981b335cca1a6010ffec75dad725e6501437ce387`；先前 checksum 屬舊版歷史證據。

這些明細僅證明同一 Memory 與 media id 的候選位置，仍未證明 caption、順序、敘事內容等價。每日 legacy highlight mapping、security/history 與 CLI 仍待完成；Production connections=0，容器已停止。

## Legacy highlight／Daily 查詢與容器停止阻塞

`phase-21-c0-highlights.sql` 與 `phase-21-c0-days.sql` 已建立並通過本地 PostgreSQL rehearsal。Legacy highlight schema 沒有 canonical Day 外鍵或 dayKey，因此明確標記 `UNMAPPED_NO_STABLE_LINK`，不以相同天數推定 destination；canonical Daily identities 獨立列出。

新增 SQL 斷言確認同一天的兩筆 highlights 均保留未映射狀態、Plan scope 排除、locale 內容差異 fingerprint、text cursor 與 Daily owner scope。MD5 fingerprint 僅作同輪變動訊號，不是安全雜湊或內容等價證明。

此次 SQL rehearsal 成功之後，`docker stop li-family-phase21-c0-mapping` 被 automatic approval review 以 usage limit 拒絕；未繞過、未重送，容器目前是否停止尚未核實。這次容器為 network=none／tmpfs／synthetic-only；不能套用上方先前輪次「容器已停止」的結論。本地文件更新與 `git diff --check` 可正常執行。

另已草擬 `phase-21-c0-security.sql`（exact table allowlist 的 RLS／ACL／policy／constraint／trigger）與 `phase-21-c0-history.sql`（含 dev marker），尚未 rehearsal 或接入 executor。ACL catalog 不能單獨證明角色繼承後的有效權限，CLI 必須另作 role／effective privilege 核對。完整 C0 尚未完成，Production connections=0。

## 內容 inventory 與交易整合

`phase21-c0-inventory.mjs` 已整合 parent、Daily、highlight 與 itinerary 查詢；固定 owner 範圍，對照 parent counts 偵測 child 漏讀。Text highlight cursor 使用 UTF-8 byte order 對應 SQL C collation，bounded JSON aggregation 也使用相同排序。

`readC0ContentSession` 已將完整內容 inventory 接入兩次獨立唯讀交易，before／after 比較整份結果。新增測試證明 itinerary 為空時 parent latest version 漂移仍會 BLOCK，不發起第三次讀取；session 8 項測試通過，inventory 3 項測試通過。

此整合仍是 injected-client 本地驗證；security/history、實際 pg client、整體 deadline 與 CLI 尚待完成，未取得新的 Production evidence。

## Security／history snapshot 整合

`readC0InventorySession` 現已在每次唯讀交易內先讀 security/history，再讀 content，並比較完整 before／after snapshot。`phase21-c0-security.mjs` 要求 exact table allowlist 完整、RLS=true、migration names 與 manifest 完全相同（重複也 BLOCK），以及保留唯一 dev／batch=-1 marker。

新增 4 項 security 行為測試通過，與 8 項 session 測試合計 12 PASS。僅為 injected-client 驗證；SQL catalog 查詢尚待 PostgreSQL rehearsal。ACL、policy、constraint、trigger 被納入 snapshot 供同輪漂移比對，但 role inheritance／有效權限與批准 baseline 的安全判定仍未完成，不能以此宣稱 Production 權限 PASS。實際 pg client、deadline、manifest 鎖定及 CLI 亦尚待接入。

## 有效權限 gate 補充

Security SQL 加入 `has_table_privilege`／`has_any_column_privilege` 查詢 `anon`、`authenticated` 的有效表／欄位權限，以及 role 存在、superuser、bypass-RLS flags；另外展開 ACL 檢查 PUBLIC table／column grants。Validator 要求角色齊全且無上述權限；缺角色不當作「無權限」PASS。

新增權限異常測試通過，security suite 共 5 PASS。此處 effective privilege SQL 仍未在 PostgreSQL rehearsal 驗證，不能據此推定實際 Production 權限狀態。執行前還須將完整 table allowlist 與角色期望鎖入 approval manifest。

## Security PostgreSQL rehearsal 完成

`phase21-c0-security-rehearsal.mjs` 在本機 PostgreSQL 執行實際 security SQL，結果 `C0_SECURITY_SQL_REHEARSAL_PASS`。SQL SHA-256：`c18cf3fcaf36c7d039c9fc19fd34043e99cdbc18f29f9307ab0983607609bb1e`。

實測三類：無授權角色、經群組繼承 SELECT、PUBLIC 欄位 SELECT。有效權限與 PUBLIC ACL 訊號均符合預期。專用 synthetic roles／table 在 transaction 內建立，最終 ROLLBACK，Production connections=0。此證據證明 catalog SQL 行為，不代表 Production 權限已驗證。

先唯讀 inspect 確認先前未停止容器為 running／network=none；本輪新的 Docker 審核與 rehearsal 均通過，隨後 stop 成功。先前 usage-limit 導致的容器停止缺口現已解除。

## CLI 離線 package 入口

新增 `phase21-c0-cli.mjs --inspect-package`，Node 20.20.2 執行結果 `C0_LOCAL_PACKAGE_INSPECTED_NOT_EXECUTION_APPROVAL`。它核對 PR #103 merge object 與相關 tracked 程式／schema tree，列出 18 筆 migration names、6 份 SQL 與 C0 scripts／dependencies checksums。未讀取 `.env`、未載入 pg，Production connections=0。

`--run` 在入口被拒絕為 `C0_PACKAGE_BLOCK`；目前仍沒有 Production 執行模式。此設計讓本地 package 可審查而不誤啟連線。完整 table allowlist、最終 manifest 凍結、deadline、實際 pg client 與端到端 rehearsal 尚需完成，不能把離線檢查當作 C0 PASS。

## Table allowlist 與連線設定

Offline package 現在從 Phase 19 migration schema snapshot 列出 Travel Memory／Day（含版本表）、Media、route identities、migration history 的精確 table names，並將該 snapshot 納入 checksum。這僅定義 security metadata scope，不擴大 content query scope；仍須核對之後 migration 沒有改變 table set。

`phase21-c0-connection.mjs` 只建立 options，不連線：固定 Production hostname hash／database、要求 NODE_ENV=production 與 schema push=false、拒絕繼承 options 及可覆蓋 host/db 的 URL parameters，設定 read-only／15 秒 statement timeout、10 秒 connection timeout、20 秒 client query timeout。兩項 synthetic option tests 通過；CLI 尚未使用連線 options，沒有新的 Production 連線。

## Execution lifecycle 與 deadline

`phase21-c0-execute.mjs` 將 connect、完整 inventory session、close、私有 snapshot receipt 串接；5 分鐘 deadline 到期即拒絕結果並開始關閉 client。每次 query／checkpoint 前後檢查期限，防止晚到 connect 結果觸發後续查詢或成功 snapshot。Client end 僅呼叫一次；保留第一個錯誤，不讓 cleanup error 覆蓋。

3 項 injected-client 測試通過：卡住的 connect 超時、checkpoint failure 阻止連線、cleanup error 保留原始失敗。此 timer 是合作式停止，CLI 仍須 process-level deadline 處理 driver 永久不退出；不能宣稱已驗證真實 pg 連線生命週期。Production connections=0。

## CLI process deadline

CLI 現在經固定 worker path 執行離線 package inspect。外層 310 秒 deadline 使用 SIGKILL，等待 child close 後才返回；總 stdout/stderr 上限 64 KiB，超限即停止，failure 不回傳 raw output。無 shell interpolation 或 restart。

`phase21-c0-worker-process.test.mjs` 的 3 類實際 subprocess 測試通過：正常退出、無限迴圈強制停止、輸出超限／錯誤訊息保護。整合後 `--inspect-package` 通過。Production 執行模式仍未開放，實際 pg 端到端 rehearsal 與最終 manifest 尚待完成。

## 真實 pg client 端到端 rehearsal

`node src/scripts/phase21-c0-pg-rehearsal.mjs --local-synthetic-only` 在 Node 20.20.2 返回 `C0_REAL_PG_LIFECYCLE_PASS`，queryCount=20，Production connections=0。使用本輪專用 `li-family-phase21-c0-e2e`，localhost 127.0.0.1:55441、tmpfs、synthetic password；入口拒絕繼承 DATABASE_URI。

實際 pg driver 完成 connect、read-only／15s settings 驗證、security/history、parents／days／highlights／itinerary、兩個獨立 snapshot 相等、close，以及 0700／0600 私有證據寫入回讀。結果為三筆 parents、兩筆 UNMAPPED_NO_STABLE_LINK highlights、五筆 itinerary 關聯；只證明 inventory lifecycle，不代表 mapping ready。Synthetic receipt 位於 OS temporary directory，不是 Production backup。

容器已停止。最後仍需凍結完整 package manifest、審查 Production 專用入口與提出新的單次執行 approval；尚未執行 Production C0。
