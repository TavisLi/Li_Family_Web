# Phase 21 #101 — 單一執行現況

更新：2026-09-07。此文件彙整最新證據；歷史 approval package／BLOCK 紀錄保留，不把其中過時的「C2 NOT STARTED」當作目前狀態。

## 結論

**C0 inventory PASS；C1 已部署；Production 33 路由 GET-only 檢查完成；cleanup 尚未執行。**

下一個工程工作是完成可復原的實體退役，不是重新跑同一輪 Preview／Production 路由 QA。所有 Production 寫入仍為 0；本地 Collection 契約移除尚未提交／部署。

## 為何先前反覆 BLOCK

- #105 是 OPEN 的後續可靠性工作，不是已交付的 executor。不能用「已建 Issue」代替落實其要求。
- Browser CLI 的 `run-code` 需要 `(page) => { ... }` 函式；先前用了 statement、反覆 `open` 重建 session，以及不完整追蹤 terminal exit。這些是執行工具問題，不是網站或 DB 壞掉。
- 本次先在 about:blank 做零 Production request 的 rehearsal，再沿用單一 session、使用 `page.goto`、等待可見 `main h1`，並追蹤每一批到 exit 0。Browser 工具 blocker 已解除。
- C0 是資料／權限 inventory；Preview QA 是待部署版本驗證；部署後 QA 是確認實際 Production commit。三者目的不同，但同一版本已完成的證據應重用，不因換了對話或舊文件狀態而重做。

## 已完成證據（不要重跑）

| Gate | 結果／定位 |
| --- | --- |
| C0 | `c0-20260907T021545159Z`，22 queries，`C0_INVENTORY_READBACK_PASS_NOT_CLEANUP_APPROVAL`，Production writes 0 |
| C0 receipt | `.phase21-private/c0-20260907T021545159Z/snapshot.json`；SHA-256 `fb2c42d0a1c109f27fe4db774a8416307c6d4e43c6527564550921c5e8771759`；目錄 0700／檔案 0600／Git ignored |
| C1 | PR #106 merged；Production SHA `3f6b2c4c53e684510265e07fb3b4633d71d5a775` |
| Deployment | `dpl_8uLXMLmdXZXmVZMQNhJJqCAUuhmH`，READY Production；alias `https://li-family-web.vercel.app` |
| Preview | 重用 PR #106 已記錄的 33/33 GET-only QA，不重新執行 |
| Production routes | 本次 home、travel index、3 Overview、25 Daily、3 Photos：33/33 HTTP 200、可見標題、無 application error／raw Markdown／1280px 水平溢出／已完成載入的壞圖；4 批均 exit 0 |

Browser session `phase21-c2-repair`；四批 terminal sessions：9653、93926、43106、18909。攔截器只放行 GET，且阻擋 `/admin`；未開啟 Admin、未送出寫入 API。檢查回傳時合計 880 個 GET interception、31 個 Admin prefetch 被阻擋；這不是整段 session 最終 request 總數，後續第三方 analytics 也會被攔截。未把 offscreen lazy image、完整 accessibility 或 query-level telemetry 宣稱為通過。

Production logs 另有 `/api/og` 的一次 500，原因為 Payload OG 字型檔缺失；本次 public Travel routes 使用的 metadata 圖片來源與該 endpoint 不同。此為已知另項缺陷，不宣稱 Production 全站零錯誤；亦不以此要求重跑全部 Travel QA。沒有 query-level legacy-read telemetry，只有已部署 select contract、測試、route QA 與有界 runtime log 證據。

## Cleanup 的精確邊界

僅退役 `TravelMemories.dailyHighlights`、`TravelMemories.itineraryImages`。保留 galleryImages、externalVideos、reminders、所有 Media 本體與 R2 assets、canonical Day／Moment／Placement、Travel Plans 與七個未追蹤 Phuket Plan 素材。

`dailyHighlights` 對應 8 個實體表（含 locale／version）：

- `travel_memories_daily_highlights_segments_locales`
- `travel_memories_daily_highlights_segments`
- `travel_memories_daily_highlights_locales`
- `travel_memories_daily_highlights`
- `_travel_memories_v_version_daily_highlights_segments_locales`
- `_travel_memories_v_version_daily_highlights_segments`
- `_travel_memories_v_version_daily_highlights_locales`
- `_travel_memories_v_version_daily_highlights`

`itineraryImages` 及 highlight mediaItems 存在於共享 `travel_memories_rels`／`_travel_memories_v_rels` 的指定 path rows；不能 DROP 共享表、不能用未驗證的 prefix 猜測 DELETE 範圍。最終 envelope 必須列出實際 path、row IDs、owner/version IDs 與 hashes。

原 readiness 文件要求「不得 DML」與移除共享表指定 relation rows 的實際需求不相容。最終 cleanup 批准必須明確涵蓋這些精確 DELETE rows；不能暗中放寬成任意 content write，也不能只 DROP 8 表卻宣稱所有關聯已清乾淨。

## 本地契約退役

已移除 Collection 的兩個欄位並以 Payload 3.85.1 regenerate types；runtime regression 保留含 legacy residue 的 fixture，確認不重新投影它們。沒有改 runtime renderer／Source／Production 資料。生成使用 loopback synthetic DATABASE_URI 與 schema push=false，未初始化 Production DB。

測試：Collection contract 與 runtime regression PASS。完整 working-tree build／tsc 被既有未追蹤 `src/scripts/phase21-content-readonly-audit.ts:149` 的舊型別引用阻擋；不修改該歷史檔。改以 HEAD archive 加上本次四個檔案，在獨立暫存目錄驗證提交候選；結果見 run ledger。

## 真正剩餘的完成條件

1. 提交候選的 focused tests、隔離 build、build 後 TypeScript、diff check 已 PASS。先準備一次有界、唯讀的 **完整 legacy backup**（8 表及指定 shared relation rows、DDL／FK／RLS／grants／sequence state），在 disposable PostgreSQL 還原、驗證並演練精確 cleanup。C0 snapshot 只含 inventory，不是可還原備份，不可拿它冒充。
2. 完成 Collection 契約退役審查，經獨立 merge/deploy 授權部署。舊 DB 表先保留，schema push=false；不得讓仍註冊舊欄位的 CMS 與已刪表的 DB 同時運作。備份必須先於部署，並在最終交易內重新比對；期間 CMS 編輯若改變 legacy relation rows，即停止，不拿舊備份直接刪除。
3. 產出固定 checksum 的 cleanup executor／UP／restore 操作及精確 row envelope；final Production destructive approval 後，僅在交易內作必要 drift check、執行一次並 read-back。漂移即停止，不默認重試。

舊新 C0 的 legacy highlights／itinerary inventory 相同；canonical Australia Moment／Placement totals 有變動（104→97／108→118），不得用舊 canonical totals 當目前批准基線，也不得覆蓋這些編輯。新的 destructive baseline 必須與完整備份是同一個一致性快照。

本文件不授權 Production cleanup、不表示 rollback 已可用，也不把 Phase 17 no-backup waiver 沿用到 Phase 21。現在沒有值得重新詢問的樣式／canonical authority 決策；Human 已選擇 canonical-authoritative，保持不變。

## 2026-09-07 本地 restore drill 完成

新增 `phase21-retirement-rehearsal.mjs`：空的 disposable PostgreSQL、tracked legacy schema、合成內容，驗證 8 表 DROP RESTRICT、外部 FK 阻擋、rollback、pg_dump restore、精確 relation DELETE／restore 及 rows／FK／RLS／grants／policies／sequences 一致。最終 session 45312 exit 0；Production connections 0。scope tests、diff check PASS。既有使用者檔案與 Production 不變。

**這不是 Production backup 已完成。** 下一個真正的授權缺口是匯出完整 scoped 正文／歷史版本至本機私有備份，不是再做 inventory／QA。範圍與本地證據集中於 [backup scope approval](./phase-21-101-backup-scope-approval.md)。在取得這項新增敏感資料匯出授權前，不啟動 Production export；本地 statement builder 也不得當作未審查的 Production cleanup executor。

## 2026-09-07 Production backup stop checkpoint

依批准啟動新的 scoped backup，但第一個唯讀 transaction 的實際 `statement_timeout` 為 `2min`，批准要求為 `15s`；read-only 本身為 `on`。依停止條件立即停止，Production writes／backup／cleanup 均為 0，沒有重試。證據：[phase-21-101-backup-block-2026-09-07-timeout.json](./phase-21-101-backup-block-2026-09-07-timeout.json)。下一次只能修復 bootstrap（在任何 scoped query 前明確 `SET LOCAL statement_timeout='15000'` 並 read-back），取得新的單次批准後再執行。

修正版已在 transaction 內回讀 `15s`，但第二次 snapshot comparison 又因 runner 把累積 query count 誤放入被 hash 的 snapshot 而停止；該差異是 executor metadata，不是 Production row evidence。Production writes／backup／cleanup 仍為 0，沒有第三次執行。證據：[phase-21-101-backup-block-2026-09-07-snapshot-counter.json](./phase-21-101-backup-block-2026-09-07-snapshot-counter.json)。修復已完成：query count 僅留在最後 receipt，不進入 snapshot hash；下一次仍須新單次批准。

## 2026-09-07 Production backup 與 local restore PASS

經新的單次授權，修正版在兩個獨立 repeatable-read／read-only snapshot 均回讀 `statement_timeout=15s`，內容一致。Production writes 0；私有 backup SHA-256 為 `7f6041a1a0caf3b3b7b0dccbb575d3b3a3a6c4aa56b648fcc879a2e23b52e46b`，大小 1,688,166 bytes，40 queries。私有目錄為 `.phase21-private/retirement-backup-2026-09-07T09-19-11-293Z/`，0700／0600 且 Git ignored。

範圍包含三筆正式 Memory、39 個相關 version、8 個 legacy tables 與兩張 shared relation table 的 exact legacy path rows：25 highlights、223 segments、50 highlight locales、446 segment locales、342 version highlights、2,873 version segments、668 version highlight locales、5,596 version segment locales，以及 104 current／1,753 version relation rows。本機 disposable PostgreSQL 已將 10 張 scoped tables、12,080 rows 還原，逐表 normalised row hash 一致；Production connections 0。

這個 restore read-back 證明 scoped raw rows 與欄位形狀可重建；它**不**取代最終 DDL executor 的 FK／index／sequence／security DDL read-back，也不授權 DROP／DELETE。Production cleanup、merge、deploy 均未執行。

最終 target allowlist、RESTRICT DDL review 與未完成 gates 已固定於 [final cleanup readiness](./phase-21-101-final-cleanup-readiness.md)。Drizzle 的原始候選含 `CASCADE`，明確拒絕；最終 contract 一律使用 child-first `DROP ... RESTRICT`。

## 2026-09-07 final preflight／DDL rehearsal PASS

Production final preflight `retirement-final-preflight-2026-09-07T09-43-40-368Z` PASS：backup SHA 一致，15 秒 timeout，20 queries，16 constraints、20 indexes、5 sequences，metadata／relation envelope 均無 drift，Production writes 0。Disposable actual-DDL rehearsal 亦 PASS：1,857 exact relation deletes、8 個 `DROP ... RESTRICT`、rollback PASS，4 筆非目標 relations 保留。證據：[phase-21-101-final-preflight-pass-2026-09-07.json](./phase-21-101-final-preflight-pass-2026-09-07.json)。這仍不等於 Production apply approval。

## 2026-09-07 Production apply BLOCK

取得 destructive approval 後，Production apply session 超出 operational wait window，沒有產生成功或 failure receipt；依 fail-closed 原則只中止該唯一 session，不重試。獨立 read-back 確認 8 張 legacy tables 仍存在，`travel_memories_rels` legacy rows 仍為 104、`_travel_memories_v_rels` 仍為 1,753，故未觀測到 Production commit，cleanup 未完成。證據：[phase-21-101-production-apply-block-2026-09-07.json](./phase-21-101-production-apply-block-2026-09-07.json)。下一步只能修正 executor（避免逐筆 Production round-trip）並重新取得一次性批准。

修正版已把 1,857 筆 exact relation DELETE 壓為兩個集合式 tuple batches，disposable actual-DDL rehearsal PASS（8 個 `RESTRICT` drops、rollback、4 個非目標 relations）。但經新的單次批准後，fresh Production preflight 在 `relations` stage 得到 `Query read timeout`，因此在 cleanup transaction 前立即 BLOCK，Production writes 0，未重試。證據：[phase-21-101-corrected-preflight-block-2026-09-07.json](./phase-21-101-corrected-preflight-block-2026-09-07.json)。

## 2026-09-07 Production cleanup PASS

以 batch-bounded exact-ID preflight（38 queries）重新確認 backup SHA、rows、metadata、DDL 與權限 gates 一致後，單一 Production transaction 成功刪除 1,857 筆 exact legacy relation rows（2 個 batch statements），並依 child-first 順序執行 8 個 `DROP ... RESTRICT`。獨立 read-back PASS。沒有內容、媒體、環境變數寫入、merge 或 Issue closeout。證據：[phase-21-101-production-cleanup-pass-2026-09-07.json](./phase-21-101-production-cleanup-pass-2026-09-07.json)。
