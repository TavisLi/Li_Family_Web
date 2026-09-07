# #101 — 完整 legacy 備份的最小授權範圍

日期：2026-09-07。狀態：**本地合成刪除／還原演練 PASS；Production export 未執行、未批准**。

這不是重新執行 C0 或 Browser QA，也不是 Production cleanup approval。現有 C0 receipt 僅保存 inventory，沒有完整 legacy 正文／歷史版本資料；刪除前需要可還原副本。這次新增的敏感操作是將該範圍的 Production 內容匯出至本機私有檔案。

## 已完成的本地驗證

- 固定 Node 20.20.2；使用已安裝 Payload 3.85.1 Drizzle generator，從 tracked Phase 19 schema snapshot 建立空的 disposable PostgreSQL fixture。這是既有 legacy 實體形狀，不宣稱等同目前所有 Production schema／security。
- 固定 loopback 容器；入口拒絕 inherited DATABASE_URI，沒有 Production mode 或可覆寫連線參數。
- `pg_dump` 備份 8 個 legacy 表；精確保存、刪除並還原 4 個 synthetic relation rows，6 個其他 relation rows 不變。
- 驗證 `DROP ... RESTRICT` 遇外部 FK 時失敗；rollback 後所有 fixture 資料不變。
- 正常刪除 commit 後，使用 `psql --single-transaction -v ON_ERROR_STOP=1` 還原 dump，再還原指定 relation rows。
- 比對 rows、FK、RLS、grants、policies、sequence last_value／is_called 均與 before 相同。
- 最終 session `45312`，exit 0；沒有 Production connection。
- Receipt 狀態：`SYNTHETIC_RETIREMENT_RESTORE_PASS_NOT_PRODUCTION_BACKUP`。
- 合成 dump SHA-256：`9bd2cf73aaa950074a341fcb75c0cce15bb84f2a00cecdd2a9e2a8244bdc5941`。
- 合成 before／after SHA-256：`57641f6bfafdc037745a824aa7f4fe7cc52ff9acc11392a982281a60293c3010`。

檔案：`src/scripts/phase21-retirement-scope.mjs`、`phase21-retirement-scope.test.mjs`、`phase21-retirement-rehearsal.mjs`。scope builder 是 pure statement builder，不含 Production approval、完整 hash drift guard 或執行入口，**禁止單獨當作 Production cleanup executor**。

## 請求的一次性授權

1. 僅讀取三筆正式 Memory `201307-hainan`、`202308-east-australia`、`202602-thailand-phuket` 所屬 legacy 資料、歷史版本、8 個表的 schema／security／sequence metadata，以及兩個共享 rel 表中這兩個 legacy 欄位的精確 rows。先確認 8 表沒有其他 owner；有則停止，不能擴大備份／刪除 scope。
2. 保留正文、locale、version、row IDs、順序及關聯，供原樣還原；不 reimport、不改寫 canonical 內容。排除 Travel Plans、Users／Media 本體、R2 檔案與其他 collection 內容。
3. 本機 Git-ignored `.phase21-private/retirement-backup-<UTC-run-id>/`，0700 目錄、0600 檔案、exclusive create；不提交、不上傳、不發布原始 dump、正文或 credentials。
4. Node 20.20.2 explicit env；`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`；不初始化 Payload。使用一致性 READ ONLY snapshot；DB statement timeout 15 秒、整次 wall-clock 上限 180 秒、dump 上限 32 MiB、relation JSON 上限 2 MiB，超限即停止並保留 checkpoint，不自動擴大上限或重試。
5. 先完成同一 export bootstrap 的本地合成驗證並固定 checksum，再執行一次 Production 唯讀匯出；此次 scope approval 不等於目前已有可執行 Production runner。所有檢查通過後，在 disposable PostgreSQL 還原真實 scoped backup，公開報告僅含 counts／hashes／狀態，不含內容。
6. 任何 env、scope、schema、security、timeout、snapshot、checksum、backup verification 漂移即停止。成功後形成最終 destructive approval package；**不 merge、不 deploy、不執行 Production DDL／DML、cleanup 或 rollback**。

## 後續不重複的工作

既有 C0 與 33 路由 Production QA 沿用；完整備份建立新的 destructive before baseline，不再要求重新選擇 canonical authority 或樣式。Production 實際刪除仍須另一份包含真實 row envelope、完整備份 receipt、restore drill、固定 executor／SQL hashes 的精確批准。

建議批准文字：

> 批准依 phase-21-101-backup-scope-approval.md 完成同入口本地驗證後，執行一次 scoped Production 唯讀 legacy 備份並在本地還原驗證；允許將完整 scoped 正文與版本資料保存至指定 Git-ignored 私有目錄。schema push=false，15 秒 SQL timeout、180 秒總上限與既定檔案上限；任何失敗停止、不重試；不 merge、deploy 或 Production mutation。
