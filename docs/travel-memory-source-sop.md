# Travel Memory 人類操作 SOP

填寫方法請直接看 [Markdown template](templates/travel-memory-source-template.md) 內的說明。你負責提供材料、確認內容及批准發布；AI 負責整理與執行檢查。

## 全新項目導入

1. 複製 template，依其中說明填好旅程。把照片放在一個 photos 資料夾，另附影片網址；不用先挑選或分三種資料夾。AI 先以 scanner 計算每個來源檔 byte SHA-256，將 technical Media Registry 放在 Git 忽略的 `.travel-media-staging/<slug>/`。
2. 把材料位置交給 AI，說明「建立新旅行回憶」、公開或家人限定，以及偏好的版型。網址登記、格式整理與 manifest 由 AI 處理。
3. AI 提供一份附縮圖的配置預覽：Overview 封面、每天代表照片、Daily 各片段照片與影片、完整相簿。每張附檔名、建議位置與文字；不確定的日期或景點集中列出讓你確認。
4. 直接用白話修正，例如「這張改到第二天下午」「這張只留相簿」「這張不要發布」。你不必看 JSON 或自行發明技術 ID。
5. AI 完成預演與檢查後，提供網頁預覽及發布清單。你確認內容、手機閱讀與誰能看到，再說「批准發布這份預覽」。
6. AI 執行批准的匯入後，重新讀取網站資料與頁面，交付正式網址及結果。未成功的步驟須明列，不能把預覽當成已發布。

## 舊有項目更新

1. 提供既有網址與這次要改的內容；只交新增照片或文字即可，不必重填整份 template。
2. 告訴 AI 是否在 Admin 修改過內容。已匯入照片用 `assetId` 或已驗證的舊路徑別名核對；檔名與位置本身不能證明是同一份 byte。
3. AI 比較網站現況、上次匯入內容與這次材料，給你新增／修改清單、前後差異及照片位置預覽。網站單獨改過的內容應保留；不同版本由你確認採用哪份。
4. 確認後說「批准這批更新」。刪除、覆寫既有編輯或修改公開範圍須在清單中明列。
5. AI 更新後回讀網站，提供正式網址與變更摘要。若要回復，先說明可回復範圍，再依確認方案處理。

## 照片怎麼交給 AI

- 保留原始照片與 metadata。相機原始檔名可以直接使用；同名檔案要避免互相覆蓋。byte 不同的衍生檔會有自己的 `assetId`。
- 想重新命名的新照片，可用「20260402-063000-海邊-001.jpg」；不知道日期就保留原名，不必猜日期。已匯入照片不要任意改名。
- HEIC/HEIF 可交原檔，由 AI 提出轉檔安排並保留原件。
- AI 綜合檔名、拍攝時間／時區、GPS 與圖像辨識提出配置。缺少或互相矛盾的資訊列為待確認；不能只靠畫面認定人物身分或精確日期。
- 日期優先參考原始照片的拍攝時間，依已知時區換算當地日期，再用 GPS 位置與 Markdown 行程交叉核對；檔案修改時間不當作拍攝日期。跨夜、飛行日、時區缺失或 GPS 與行程不符時列為待確認，不直接改寫原始 metadata。
- 配置預覽附上「建議日期／地點、依據、待確認原因」。證據一致的照片按日批次確認；只逐張詢問有歧義的照片。人類確認後才固定正式配對與 manifest identity。
- AI 起草 altText（畫面看見什麼）與 caption（這張照片的故事），讓你在配置預覽中一起審閱。
- Registry 只保存 hash、檔案與內嵌 metadata、來源及環境別 Media locator。Day、Moment、照片位置、圖說與排列由 Source v2 經你審核；metadata 中的 caption 只能當候選資訊。
- 不必分 cover、gallery、itinerary 三個資料夾；既有資料夾也不必搬動。實際展示位置由確認後的 manifest 與媒體關係決定。

## AI 應完成的檢查

AI 處理網址登記、格式檢查、照片清單與 manifest 草案，並執行匯入預演。重複照片、無法配對、缺少上次匯入基準或版本衝突都要先列出。正式更新前給人可閱讀的摘要，執行後獨立回讀資料與網頁。

既有 Current 採納時先讀取既有 `momentKey`、`placementKey`、關係與排列，提出明確對照供審核；不能用新 scene/hash key 重建、從省略列推定刪除，或由 AI 重分類。hash 引用若缺少該環境已驗證 Media locator，或舊 alias 無 byte 證據，預演列為 BLOCK。Slice 2 只提供本地 Registry／resolver；新 hash 媒體上傳及 Production schema、content、media 更新仍是獨立 gate。

技術操作：先用 `node --import tsx src/scripts/travel-memory-media-intake.ts --slug <slug> --input <folder>` 產生 `registry.json`、`summary.json`、`review-queue.json`。Source v2 匯入預演可設定 `TRAVEL_MEDIA_REGISTRY` 指向 registry 檔，並明列 `TRAVEL_MEDIA_ENVIRONMENT`；locator 的 `verifiedByteHash` 必須來自該環境可取回 Media bytes 的獨立查證，不以相同 alias、檔名或 URL 代替。scanner 不會自行把 locator 標為 verified。

資料庫結構變更、刪除或額外上傳若超過已批准範圍，要先說明具體影響。遇到資料變動警告、回讀失敗或私密內容外洩，停止並保留證據。程式回退不會自動恢復網站內容；資料回復使用另行確認的方案。

此文件定義 AI 協作流程，不代表已有一鍵辨識／發布工具。依人類決定，實際照片配置預覽與確認留待下一個 Travel Memory 演練；模板欄位覆蓋與匯入保護由 #117 接續處理，不以本文件宣稱演練已完成。

新版材料可指定版型；若你曾在 Admin 改過版型，更新時會保留。若 Source 與 Admin 都改了同一內容且結果不同，AI 必須先請你確認，不可直接覆蓋。舊項目若缺少新版匯入基準，AI 會先保留網站內容並提出另行確認的對照方案。

## #134 可重用匯入工作台

先執行 scanner，讀 summary／review queue，再只看需判斷的本地圖片。`prepare-travel-memory-review.mjs --config <config.json>` 讀取明列的 Source、已保存 Current／英文、舊 Registry、新掃描 Registry 與 photoRoot，以全新 output 建立本地 HTML；metadata 提出候選，不自行決定日期、人物、caption 或移除。Title／UserComment 與其他內嵌文字只作候選。既有 placements 沿用 Current 身分，不重新猜位置；不把 bytes 相同的不同 Media ID 自動合併。

Human 在 HTML 編輯日期、Moment、placement、順序、caption 與移除決定，保存回覆並可載入。批次、Source／model hash 不符須拒收。保留未決項，Source omission 不代表刪除；明確移除、同圖展示省略與跨 Day 搬移保留逐項 ID／key 對照，Media records／檔案／locators 不隨之刪除。HTML 禁用外部連線，以本地縮圖作審查材料。

內容通過後，`prepare-travel-memory-import.mjs <config.json>` 固定 source／sourceSha256、model／modelSha256、decisions、registry、photoRoot 及全新 output，輸出 Source 副本、完整 Registry、daily plan、已核對 bytes 的 upload inputs 與 compact summary。輸入漂移就停止；不能覆寫舊批次，或把此輸出當 Production 批准。

`travel-memory-import-plan.mjs` 負責 fresh identity／其他語言／null／caption／read-back 保護；`travel-memory-media-transfer.mjs` 負責舊 Registry 保全與 INTENT→CREATED→VERIFIED，寫入不明不重試。`travel-memory-daily-update.mjs` 只是既有 #105 交易內的 operation：Current anchor、必要 locale 更新、實際 ID／關係回讀與零舊歷史損失，commit 與監督仍屬 #105。Daily operation 目前限 Memory 2／九日；其他旅程不能直接套用。Shared retention 仍為 30；runner-only maxPerDoc=0 不承諾未來一般 Admin 編輯的歷史保留。

依 [#134 交付審查](phase-artifacts/issue-134/delivery-review-20261030.md) 區分本地 synthetic、已接受的 Production 結果與未泛化能力。每批私密 Source／Registry／before-image／receipt 保持可恢復，照片及原始證據不進程式 PR；後續大量照片仍逐批審核、批准與回讀。失敗／UNKNOWN 保存已完成結果，停受影響動作，不能借舊批准自行讀取、重傳或清理。

### HEIC 原件與明確轉檔

scanner 可讀 HEIC 尺寸／metadata 並建立 exact-byte assetId；這不代表本機 sharp 已具 HEVC 像素解碼能力。需縮圖／JPEG 匯入時，先按本批決定以本地 ImageIO 或已確認的解碼器明確轉檔，保留 HEIC 原件與 hash；轉檔是不同 assetId，以 technical Registry 的 derivedFrom 指向原件，不宣稱 bytes 相同。新檔獨立掃描，先固定及保留 derivedFrom，再進入 HTML 審查與 JPEG upload preparation；不把 HEIC 檔改副檔名冒充 JPEG，也不因 metadata PASS 就授權上傳。`pnpm run test:issue134:heic` 在 macOS 以 runtime 合成圖驗證此路徑，實際其他平台／Production codec 能力不由此推論。
