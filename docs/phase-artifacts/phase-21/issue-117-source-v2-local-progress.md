# #117 Source v2 本地進度證據

日期：2026-09-11。分支：`codex/phase-21-117-source-v2`。基線：`c770e2b`。

此文件記錄工作中狀態，不代表最終驗收、PR ready 或發布。

## 本輪新增

- 修正 Source path／member slug 轉 Payload relationship 的 typed projection；不以 `any` 避開型別錯誤。
- Admin 刪除整組清單後，Source 新變更不得自動恢復；先以失敗測試重現，再修正為 conflict。
- 提醒項目以人類固定 `entry` 衍生 row ID，文字修改不改 identity；entry 不進 Payload 業務欄位。
- 缺少 `--memory-v2` 的 apply、混用 v1 scope／override 或 apply/dry-run 同時指定，在環境初始化前拒絕。
- 缺少該 locale Base 時保留 Current、阻擋 apply，不從其他語系推導 ownership。自動新增第二語系基準尚未提供。
- 澳洲 v2 golden fixture 由版本化 Markdown 與 manifest 機械轉換；原檔與 manifest 不改。只供測試，不登記第二筆 catalog，不可直接套用到既有 Production。
- 對齊 SOP、內容來源指南、資產指南與 catalog 說明，將 v1 目錄推斷／Markdown 範例與 v2 分開。

## 已取得的本地證據

| 命令 | 結果與範圍 |
| --- | --- |
| `pnpm test:memory-v2` | PASS；模板解析、typed projection、coverage 檔一致、無效輸入、保護 Admin、缺語系 Base 阻擋、in-memory Payload boundary 匯入測試 |
| `pnpm seed:travel:v2:audit src/scripts/fixtures/travel-memory-v2-australia.md` | PASS；9 days、4 flights、3 lodgings、28 stories、91 moments、57 placements；134 references 僅符號對應，未驗證資料庫關聯 |
| `pnpm test:phase-21` | PASS；包含保留的 v1 fixture regression、clean-room projection、day/parser/key/seed safety、renderer tests |
| `pnpm run build` | PASS；使用本地合成 secret 與不可連線的 localhost database URI，schema push=false，無 Production 連線 |
| build 後 `pnpm tsc --noEmit` | PASS；後續小幅安全修正須在最終交付前再次完整跑 build → tsc |

澳洲航班、住宿、故事與影片 projection 與 v1 比對一致；新增 fixture 沒有 Media 資產宣告，因原 manifest 未提供完整 altText，不把 caption 當作 altText 補入。

## 仍未完成的交付門檻

1. 最終逐欄 fixture 覆蓋與分類計數審查，包含所有 array identity 與跨語系共享欄位案例。
2. 真正 Payload hooks／upload naming／read-back 路徑驗證；目前匯入測試使用記憶體替身，不是假冒資料庫演練。
3. Catalog 與 v2 frontmatter 一致性檢查，以及 legacy-to-v2 baseline adoption 的明確限制審查。
4. 最終 standards／spec review 與環境級 Payload/read-back 驗收仍待人工審查。已提交 `c60f528`、推送分支並建立 PR #121；PR 不使用 `Closes #117`。

## 資料與授權

Production reads/writes、migration、R2 upload、merge、deployment：均未執行。沒有沿用其他 Issue 的批准。應用程式未增加 schema 欄位；collection 只修改版型說明文字。

部分匯入失敗不保證原子回復；須保留證據、查核目標現況，另行確認重試或回復，不直接重跑。程式 rollback 不代表資料 rollback。
