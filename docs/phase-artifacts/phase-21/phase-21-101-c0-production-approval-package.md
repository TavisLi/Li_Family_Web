# #101 C0 Production 唯讀 preflight 批准方案（新基準）

狀態：PREPARED。此文件只準備新的 C0 基準；尚未連線 Production、尚未執行 preflight，亦不構成 cleanup 批准。

## 已鎖定的本地包

- 基準 commit：PR #106 已合併的 `3f6b2c4c53e684510265e07fb3b4633d71d5a775`。
- Frozen manifest：`docs/phase-artifacts/phase-21/phase-21-101-c0-frozen-package.json`。
- Manifest SHA-256：`722d2a10b0d066fba52e5add7d83abcf7922e03103db76409031dfbc6e2312bc`。
- 範圍：正式 Travel Memory `201307-hainan`、`202308-east-australia`、`202602-thailand-phuket` 的 parent、Daily、legacy highlight identity／count、itinerary Media-to-placement candidates、相關安全 catalog 與 migration history。
- 明確排除：`202702-thailand-phuket` Travel Plan 與其七個未追蹤素材；不讀取任何不在上述唯讀查詢所需範圍的內容。

舊的 `phase-21-c0-frozen-package.json` 與其 approval/block/read-back 文件是先前嘗試的歷史證據，保留原樣，不可作為本包的批准依據。

## 待另行明確批准的一次性入口

工作目錄：`/Users/tien-hsinglee/Project/li-family-web`

```sh
NODE_ENV=production PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false /Users/tien-hsinglee/.nvm/versions/node/v20.20.2/bin/node --env-file=.env src/scripts/phase21-c0-cli.mjs --production-readonly 722d2a10b0d066fba52e5add7d83abcf7922e03103db76409031dfbc6e2312bc
```

此命令只可在使用者明確批准此 SHA 後執行一次。任何失敗立即 BLOCK，不重試、不恢復先前 run。

## 技術限制與停止條件

- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`；僅使用 `BEGIN ... READ ONLY` 交易。
- SQL statement timeout 15 秒、connect timeout 10 秒、client query timeout 20 秒；整輪 cooperative deadline 300 秒、process deadline 310 秒。
- 分頁每頁最多 101 rows（100 + sentinel）、64 KiB；每個資料集最多 50 pages／1 MiB；全 session 最多 110 queries；Placement candidates 超過 20 即 BLOCK。
- 前後兩個獨立 repeatable-read snapshots 必須相同；checksum、manifest、tree、target、scope、identity、counts、migration history、RLS、PUBLIC 或受限角色有效權限、timeout、response cap、checkpoint 或 snapshot 漂移，任一不符即 BLOCK。
- 不允許 content、media、schema 或 migration write，不 publish、不 cleanup、不 merge、不關 Issue。

## 私有證據與處理邊界

正式執行才會在 `.phase21-private/c0-<UTC timestamp>/` 建立 evidence：目錄 0700，檔案 0600，exclusive create、fsync 與 read-back；Git ignore 檢查失敗即 BLOCK。證據不提交、不上傳、不發布；未完成 run 保留，不自行清理。

此 preflight 即使 PASS，也只證明本次受限 inventory 可讀且前後觀測一致；它不證明 canonical 與 legacy 完全等價、零 runtime consumer、完整備份、cleanup readiness，且不授權任何 destructive action。後續 crosswalk／內容比較／觀察期／獨立 cleanup approval 仍是必要 gate。

## 本地驗證

- 對應新基準的 package test 採 TDD：先驗證未匯出 frozen manifest path 的 RED，再以共享常數修正為 GREEN。
- `/Users/tien-hsinglee/.nvm/versions/node/v20.20.2/bin/node --test src/scripts/phase21-c0-*.test.mjs`：54 PASS、0 FAIL。
- `--inspect-package` 與新 frozen manifest deep equality 相符；`productionConnections: 0`。

因此此文件僅表示「可供審核、待 Production 唯讀授權」；目前沒有新的 Production C0 結果。
