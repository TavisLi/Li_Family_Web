# Travel Memory 人類操作 SOP

## 交付材料

- **新旅行**：依[旅行回憶模板](templates/travel-memory-source-template.md)填寫行程與故事，提供原始照片資料夾。照片可保留原檔名與 HEIC／HEIF 原件，不必預先分類。說明是否包含影片；要收錄時附上影片網址。
- **更新既有旅行**：提供旅行網址，確認可唯讀匯出的語言與版本（已發布或草稿）。AI 從正式環境匯出這趟旅行的現況 Markdown 給你。直接在副本裡編輯想改的地方，有新照片再附上；其餘內容照原樣保留。
- 指定可讀取的檔案、公開或家人限定、偏好的版型，以及是否需要地圖。私人材料預設留在本機；使用遠端看圖、傳送資料或上傳媒體，須先確認目的、對象與範圍。

## 審閱照片、文字與地圖

1. 開啟本機縮圖預覽，按日期、時間與片段檢查封面、每日代表照、故事中的照片／影片及相簿。若行程時間代表片段開始，確認當天最後片段到何時結束。可批次接受有依據的歸位，只處理會改變結果的疑問；直接指出照片和要移到的片段即可。
2. 逐張審閱替代文字（altText，讓看不到圖片的人知道畫面內容）與圖說（caption，這張照片在此段旅程的故事）。分別確認文字、展示位置與順序。可以保留舊圖說、修正人物或選擇不公開。使用審查頁的「保存回覆」匯出決定，續審時可載入；材料有變時只重審受影響部分。
3. 有地圖時，先選用途。旅行記錄可接受同批相機推定的大致拍攝位置，檢查跨地點、岸上／船上等實質差異即可。缺 GPS 可只顯示片段或標明參考地點。某個場館作為 Moment 的代表點、以及誰可以看到它，都要分別確認。

## 批准與驗收

1. 審閱本次內容清單。更新既有旅行時，AI 會列出你的編輯稿相對於匯出原稿的變更。匯出後若後台也有修改，保留後台單獨改過的內容；同一處改成不同結果時，再由你選擇。移動、清空、移除、覆寫或改變可見範圍，都要列明對象與影響，經你確認才執行。
2. 唯讀匯出依已授權的範圍進行。確認內容預覽後，再按需要分別批准媒體上傳、內容寫入或發布，指明旅程、版本、動作與可回復範圍。變更資料庫結構、刪除、資料回復或超出清單的動作另行批准。
3. 收到結果後，對照批准清單、實際回讀的內容及仍待處理的項目。若已批准發布，開啟正式網址，確認手機閱讀、照片順序、主要語言及公開／家人可見範圍。只有預覽、部分成功或結果不明時，保留該狀態，等受影響項目核實後再驗收。

家人限定照片在上傳前要確認原圖、縮圖及照片描述均只對已登入家人可見，照片尚未加入回憶時也一樣。驗收包括每張物件的雜湊與 Media 資料的獨立讀回。若私有入口尚未確認，暫緩上傳。 AI 應先出示缺件數量、寫入範圍以及短期上傳憑證的安全交接和撤權方式。使用指定的安全入口交付憑證，勿貼到對話。待照片驗收後，再批准建立家人限定草稿。

## 下一次新增旅行

備妥一份旅行回憶稿、原始照片資料夾、可見對象及地圖偏好。把下面這段交給 Luna 或 Sol，填入自己的材料位置即可。

> 請用 travel-memory-media-intake 處理一趟新旅行。回憶稿在〈路徑〉，原始照片在〈資料夾〉，可見對象是〈對象〉，地圖偏好是〈偏好〉。請先給我可審閱的照片順序、圖說、替代文字、地點疑問及預計新增的內容。我確認後，再分別提請讀取、上傳、內容寫入或發布所需的批准。完成後告訴我實際讀回哪些項目及仍待處理的差異。

## #134 可重用匯入工作台

先執行 scanner，讀 summary／review queue，再只看需判斷的本地圖片。`prepare-travel-memory-review.mjs --config <config.json>` 讀取明列的 Source、已保存 Current／英文、舊 Registry、新掃描 Registry 與 photoRoot，以全新 output 建立本地 HTML；metadata 提出候選，不自行決定日期、人物、caption 或移除。Title／UserComment 與其他內嵌文字只作候選。既有 placements 沿用 Current 身分，不重新猜位置；不把 bytes 相同的不同 Media ID 自動合併。

Human 在 HTML 編輯日期、Moment、placement、順序、caption 與移除決定，保存回覆並可載入。批次、Source／model hash 不符須拒收。保留未決項，Source omission 不代表刪除；明確移除、同圖展示省略與跨 Day 搬移保留逐項 ID／key 對照，Media records／檔案／locators 不隨之刪除。HTML 禁用外部連線，以本地縮圖作審查材料。

內容通過後，`prepare-travel-memory-import.mjs <config.json>` 固定 source／sourceSha256、model／modelSha256、decisions、registry、photoRoot 及全新 output，輸出 Source 副本、完整 Registry、daily plan、已核對 bytes 的 upload inputs 與 compact summary。輸入漂移就停止；不能覆寫舊批次，或把此輸出當 Production 批准。

`travel-memory-import-plan.mjs` 負責 fresh identity／其他語言／null／caption／read-back 保護；`travel-memory-media-transfer.mjs` 負責舊 Registry 保全與 INTENT→CREATED→VERIFIED，寫入不明不重試。`travel-memory-daily-update.mjs` 只是既有 #105 交易內的 operation：Current anchor、必要 locale 更新、實際 ID／關係回讀與零舊歷史損失，commit 與監督仍屬 #105。Daily operation 目前限 Memory 2／九日；其他旅程不能直接套用。Shared retention 仍為 30；runner-only maxPerDoc=0 不承諾未來一般 Admin 編輯的歷史保留。

依 [#134 交付審查](phase-artifacts/issue-134/delivery-review-20261030.md) 區分本地 synthetic、已接受的 Production 結果與未泛化能力。每批私密 Source／Registry／before-image／receipt 保持可恢復，照片及原始證據不進程式 PR；後續大量照片仍逐批審核、批准與回讀。失敗／UNKNOWN 保存已完成結果，停受影響動作，不能借舊批准自行讀取、重傳或清理。

### HEIC 原件與明確轉檔

scanner 可讀 HEIC 尺寸／metadata 並建立 exact-byte assetId；這不代表本機 sharp 已具 HEVC 像素解碼能力。需縮圖／JPEG 匯入時，先按本批決定以本地 ImageIO 或已確認的解碼器明確轉檔，保留 HEIC 原件與 hash；轉檔是不同 assetId，以 technical Registry 的 derivedFrom 指向原件，不宣稱 bytes 相同。新檔獨立掃描，先固定及保留 derivedFrom，再進入 HTML 審查與 JPEG upload preparation；不把 HEIC 檔改副檔名冒充 JPEG，也不因 metadata PASS 就授權上傳。`pnpm run test:issue134:heic` 在 macOS 以 runtime 合成圖驗證此路徑，實際其他平台／Production codec 能力不由此推論。

## 匯入工具版本（2026-11-02）

Travel Memory 的來源匯入統一使用 Source V2／`--memory-v2 <file>`；舊 Memory V1 writer 已停用，任何 reconciliation mode 均在 store I/O 前以 `MEMORY_V1_RETIRED` 拒絕。既有內容、Base、identity、locale、history 與唯讀 legacy parser／projection 保留，不因工具退役清理或重建。Payload Admin 編輯與獨立 Media 工具維持原範圍。

舊一般／travel-only／phase-9 seed 命令不再可用於 Memory；CLI 在讀取 `.env`、初始化 Payload／DB 前拒絕。Travel Plan 保留 `node --import tsx src/scripts/seed.ts --travel-only --plans-only`，只選 planning records 與其 travel-owned Media，不同步 Memory／Day，不連帶寫入 Users／Blog／Home Config。Blog-only 與明確的 Media refresh 入口不由本次退役擴權或改變。

Gate C 的 `memory-v1` case ID 保留以維持原矩陣／receipt 結構，但語義改為「入口退役、零 store I/O、零 mutation」，不再要求成功的 V1 Memory round-trip。正常 Memory 匯入／更新／round-trip 由 V2 驗證。這是本地產品方向，不是 Production 執行或 Gate C 驗收批准。
