---
name: travel-memory-media-intake
description: Prepare, review and reconcile Travel Memory Source v2, original photos, placements and environment-specific Media identities. Use for new travel drafts or scoped updates to an existing Memory.
---

# 旅行回憶導入

先依[人類 SOP](../../../docs/travel-memory-source-sop.md)確認材料、語言、可見對象、地圖偏好與已獲准的動作。沿用[模板](../../../docs/templates/travel-memory-source-template.md)與 [#105 執行契約](../../../docs/phase-artifacts/issue-105/slice-1-run-contract.md)。以下命令從 repo 根目錄執行。私有材料、批准、receipt 及輸出留在本批私有路徑。

## 原件、配置與文案

1. 用 `node --import tsx src/scripts/travel-memory-v2-audit.ts <Source.md>` 核對格式、語系與結構。以 `node --import tsx src/scripts/travel-memory-media-intake.ts --slug <slug> --input <原件資料夾>` 盤點原件。先讀 summary 和 review queue，每個檔案按原始 bytes SHA-256、實際格式及來源辨識。HEIC 若須轉檔，保留原件、記錄 derivedFrom 並核對衍生檔自己的 hash。
2. 對照 Day、Moment、明確時區、拍攝時間和原件縮圖。用 `node --import tsx src/scripts/prepare-travel-memory-review.mjs --config <config.json>` 建立適用的本機審查。Source 定義封面、hero、相簿、片段內展示、影片、順序與 caption。Registry 保存技術身分與 locator。逐張分開確認 placement 的 caption 與 Media 的 altText；重複 hash／多個 Media ID、跨日或不明時區只展開受影響列。
3. 分別保留場景地名、相機拍攝點、場館代表點與來源。優先採用已確認的地名／地址。沒有 GPS 可只保留場景，有 GPS 須審查 datum／CRS 與場景是否相符。同批推斷須標明依據。未知座標系、相機與場館相衝、敏感座標或改變公開範圍交 Human 決定。任何 Moment Geo 的採納或發布另依正式 Geo 流程。

## Supabase 私有投影的 Data API 查核

只在讀取方案使用專用投影、且本次批准涵蓋控制平面時執行。優先沿用仍有效的同專案證據。否則以已登入的 Dashboard Data API Overview／Settings，或涵蓋必要欄位的可信唯讀 Management API 查核。保存專案 ref、觀測時間、來源與經裁切的證據，記錄 `enabled`（布林或 null）、`exposedSchemas` 與 `extraSearchPath`（字串陣列或 null）。未顯示用 null，空陣列代表已觀察為空。不要用 SQL session 的 PostgREST 設定或 API 的未登入錯誤推斷啟用狀態。

用 `node src/scripts/review-data-api-observation.mjs <observation.json> <project-ref> <private-schema>` 檢查欄位與 scope。工具只評估已記錄的證據，操作者仍須核對來源及時效。啟用狀態未知、API 開啟時設定缺失、或任一清單出現私有 schema，一律 BLOCK。當可信控制平面確認 OFF 且介面隱藏設定，可在已審的本批 scope 記錄 ACCEPT WITH FOLLOW-UP。清單仍是 UNKNOWN。Supabase 停用後不提供自動生成的 REST endpoints。重新啟用前檢查兩項設定，發現控制平面漂移時停止後續操作並重核。[Supabase 安全文件](https://supabase.com/docs/guides/api/securing-your-api#disable-the-data-api)

角色、scope、RLS、實際 ACL、rollback 與資料讀取依 #105 和各自的批准核驗。私有投影不可授權給 PUBLIC 或 Data API 角色。保存設定與查核結果至私有審批包。

## 新建、批准與獨立讀回

1. 在已獲准、可見範圍充分的讀取入口取得同一 slug、環境與語言的 snapshot。JSON 包含 `slug, environment, locale, ownerCount, versionCount, inventory`。參照 [readNewMemorySnapshot](../../../src/scripts/travel-memory-new-review.mjs) 的 V2 投影。Production 必須由可強制角色、精確 allowlist 與預算的 reader 產生，並保存 target、可見範圍、版本與 SHA。零 owner 和零版本才走新建；有歷史、缺權限、關聯不唯一或讀回不完整即停。
2. 先對帳原件與目標環境的 Media ID。已有 verified locator 的照片同時核對 bytes 與可見範圍後重用。家人限定草稿的照片須有對應原圖 SHA 的 `familyAssetKey`，單語與全語系快照均須相符。已確認缺件再提出精確 Media 上傳清單、altText、讀回及回復範圍。未核對的 locator 不足以判定缺件。內容、Media、發布等分別批准。
3. 使用 `node --import tsx src/scripts/travel-memory-new-review.mjs preview <slug> <環境> <Source.md> <registry.json> <snapshot.json> <新預演.json>`。交 Human 審核目標、原件、照片順序、語言、隱私、逐項差異與可回復範圍。鎖定批准的檔案 bytes、runner、權限、次數與有效期。
4. 由已獲准的內容 runner 在指定目標調用 `applyReviewedNewMemory`。入口重新核對批准預演，再由交易式 V2 importer 取得鎖並在寫入前核對 inventory、版本與計畫。單一交易包含草稿、Day 與 Base。提交前失敗執行 rollback；提交結果 UNKNOWN 即停止重送。提交後回復需獨立批准。單純呼叫函式不提供 Production 執行權。
5. 由獨立連線取得新 snapshot，執行 `node --import tsx src/scripts/travel-memory-new-review.mjs verify <已批准預演.json> <獨立snapshot.json> <MemoryID>`。另按封包核對既有語系、版本、關聯與非目標的保全，以及有批准時才適用的發布／頁面讀回。回報實際結果與未驗證範圍。更動執行器後需要新建回歸時，可用 `sh src/scripts/travel-memory-new-rehearsal.sh` 在本機隔離 PostgreSQL 排演。

## 更新既有旅行

在已批准的讀取範圍匯出現況 Markdown，保留原稿，僅對編輯稿的差異預演。核對 Base、Source、最新 Current，保全 Current 單邊改動、缺 Base 的既有資料、穩定 keys、各語言、版本及非目標照片關聯。雙改、移動、清空或刪除需明確決定。沿用 [#134 工作台及其適用範圍](../../../docs/travel-memory-source-sop.md#134-可重用匯入工作台)；既有 Daily operation 的執行範圍限 Memory 2／九日。只批准列出的差異，套用後獨立讀回。

## Production 專用 Reader 的核准與讀回

只有既有授權入口不足以完成最小資料讀取時才準備專用投影。先沿用同一 target 的當期 metadata、Data API 判定及已驗 SQL。角色配置使用既有 #105 審批／憑證來源，透過 #105 執行工作樹中 `travel-memory-role-session.mjs` 的交易入口把實際 catalog、固定投影與 SQL SHA 綁進單次封包。人工批准後才設定執行檔案；先用該封包的 `entry.mjs --inspect` 驗證目標、SHA、Node／pg 與 TLS 設定。

配置階段建立 NOLOGIN reader，按相符的 PG 版本核對建立者的管理邊、reader 權限、Data API 角色、原表及 view scope。確認提交後用第二條唯讀連線核對配置前後及提交前的指紋，交易結束要有線上狀態證據。COMMIT 結果或獨立讀回不明，查收據與已證事實，另批對帳。已提交後的回復按 #105 另批。

實際 reader 登入、到期、撤權，以及 Current／Media SELECT 各在相符批准下完成。已批准的角色配置不延伸到上述動作。只讀固定 slug、locale、版本 footprint 與實際 preview 所需的關係；零 owner／零歷史時核對唯一 origin Plan，已驗 locator 方可重用。未知項維持 UNKNOWN，本機合成測試的 PASS 不取代實際角色讀回。

Current 專用會話可用 `travel-memory-current-session.mjs` 接入已審且 exact SHA 驗證的資料讀取計畫。讀取前先確認實際 login／effective 角色與權限邊界，核對 session、READ ONLY、預算和 rollback。零 owner 且零版本只查唯一 origin Plan；此分支沒有 Media 查核覆蓋。既有 owner 分支只覆蓋已驗 owner 的投影與 placement-linked Media metadata，locators 和 bytes 另依核准範圍查證。用 `node --test src/scripts/travel-memory-current-session.test.mjs` 跑不依賴私有批次的聚焦回歸。

家人限定的 Source 在準備上傳前，核對 Media collection 與原圖、所有衍生檔的實際匿名邊界。上傳時的 Media 若尚未連到 Memory，存取控制也要生效。以合成檔核對匿名與 family 身分的 metadata、直接 URL 及 bytes 行為。`isPrivate`、draft 或 object key prefix 本身不足以證實媒體受保護。公開 Media 路徑與家人限定內容不相符時，保留上傳 BLOCK，Current 唯讀仍依其獨立範圍執行。

家人限定照片使用 Media 的 `familyAssetKey` 指向私有 R2 物件。實際使用前以已批准的控制平面證據核對私有 bucket、匿名不可達及 server-only 權限。家人限定 Media 只提供登入後的同源 URL。若已存在家人限定 Media，runtime rollback 也須保留可見範圍檢查。

新草稿的 JPEG 先用 `node --import tsx src/scripts/prepare-travel-memory-family-objects.mjs <candidate.json> <candidate-sha256> <originals-dir> <new-output.json>` 在本機生成原圖與三個衍生檔的 key、長度及 SHA。候選從已審 Registry 與 Source 取 `slug`、`assets` 數量、`totalBytes`，逐列提供 `assetId`、`byteSize`、`mimeType`、`relativeOriginals`、`altTextSha256`。輸出記錄 encoder 版本與 Production presence UNKNOWN。建立實際寫入計畫時，將已審 altText 與其 SHA、目標存在性及可重用的 locator 對帳。

用 `node --import tsx src/scripts/travel-memory-family-photo-reconcile.mjs <input.json> <input-sha256> <new-output.json>` 核對固定清單與已授權取得的觀測。輸入含前一步的 `prepared`、已審 `registry`、`scope`（`slug, locale, environment, accountId, bucket, target: {projectRef, database, schema}`）及同 scope 的 `observations: {scope, entries}`。觀測依 `assetId`，Media 提供 `state`；若為 `FOUND`，附 `id, familyAssetKey, type, mimeType, bytes, altTextSha256, sourcePath, ownerId, publicStorage`。物件依 `key`，`FOUND` 必須有完整 GET 的 `bytes, sha256, mimeType`。只有確實排除權限與讀取失敗時才記 `ABSENT_CONFIRMED`。未觀測需保留 UNKNOWN。輸出分別給完整重用、新建審查與部分恢復審查；逐項結果保存在私有封包。使用前核對觀測來源與當期收據。工具本身沒有外部存取或執行權。

已批准的 Media runner 提供私有 bucket、固定清單、停機預算及獨立讀回 client。每個物件先留持久化 intent，再以 `If-None-Match: *` 新建並讀回完整 SHA。四個物件都通過後才建立未掛接的 Media row、獨立讀回並更新 Registry。任何已存在物件或結果不明先按 #105 對帳。聚焦排演可用 `sh src/scripts/family-media-rehearsal.sh`，它只使用本機 PostgreSQL 與合成 R2。

R2 觀測可由已批准的讀取入口呼叫 `observeFamilyPhotoObjects`。呼叫端須核對 R2 帳號、直接 S3 endpoint、bucket、唯讀憑證範圍、固定清單與總期限，逐項保存觀測。全量上限等於清單物件數，每個 key 只送一次 GET。只有同一直接入口回傳 `NoSuchKey` 與 HTTP 404 才記 `ABSENT_CONFIRMED`。缺桶、權限拒絕、逾時或中斷停止受影響觀測；未取得的項目維持 UNKNOWN。上次寫入結果不明時，依獨立對帳規則處理。[R2 錯誤代碼](https://developers.cloudflare.com/r2/api/error-codes/) · [R2 一致性](https://developers.cloudflare.com/r2/reference/consistency/)
