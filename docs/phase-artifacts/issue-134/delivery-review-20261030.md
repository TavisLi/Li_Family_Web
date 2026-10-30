# #134 可重用程式交付候選 — Human review

2026-10-30。此文件是本地候選審查，非結案或發布批准。Related to #134；不使用 Closes。

## 交付與執行邊界

掃描／metadata、HTML 審查與回覆、Registry 增量保全、daily plan／fresh graph、受監督交易內的 Day operation，以及 history／transaction I/O helper 可獨立打包。Source v2 仍是內容契約，Registry 僅保存技術身分。舊 Current omission 不導致刪除；搬移、移除、caption 清空均須明確且綁定輸入的內容決定。不同 Media ID 即使 bytes 相同也保留原關係。

本候選不發布單次 Production dispatcher、批次編號／個別照片恢復分支、憑證來源模組或私人封包。既有 #105 manifest／supervisor／ledger／receipt／批准失效契約仍是操作 owner；operation body 不建立第二 executor、連線、commit、重試或批准。現有共用 supervisor 的混合工作樹變更不屬本候選，不能因 import 字串而整批帶入。

正式 Daily operation 目前仍限定 Memory 2、九日及 zh-TW/en。純掃描／審查可處理其他 slug；其他旅程的 Production execution 尚未泛化。發布此套件不代表可直接重播任何歷史 run 或任意套用新旅程。

## 可重現驗證

- `pnpm run test:issue134`：58 項本地 synthetic 測試；阻擋網路、`.env` 與私人證據目錄。覆蓋掃描、Title／UserComment、HTML 組裝、輸入 hash、Registry、caption／move／null、多語、ID、history 與交易失敗分類。
- `DOCKER_HOST=<local UNIX socket> pnpm run test:issue134:disposable -- <fresh absolute output>`：只允許本機 UNIX Docker service，既有 pinned PG17 image、owned loopback port、無 mount／pull，synthetic Memory／Media roots，真 TravelMemoryDays／Payload；執行後清理自有容器。此驗證不連 Production、不讀真憑證、不證明 R2／遠端 TLS 或完整 Production schema。
- Node 24.21.0／pnpm 10.28.0；以 main 的 Payload 3.90.2、Next 15.5.27 frozen lockfile 離線安裝。build 後才執行 tsc；使用無真憑證的 loopback build sentinel、schema push 關閉。
- 新增的 pure Daily boundary／config 來自歷史程式相同函式；私人 SQL、credential contract 不隨模組載入。歷史原始 bytes／hash 另行保存，歷史 manifest／receipt 不重算。

## 已接受與未宣稱事項

Human 已接受網站視覺、Production r3 COMMITTED／獨立 read-back、61 Moments／743 placements 及 Media 驗收。舊自動 Browser BLOCK 保留；96 個缺本地縮圖不再是網站視覺 blocker。此候選只改工具／測試／文件，沒有網站 route、UI、Collection、ACL、schema、migration 或部署設定差異；不因本候選重開網站 Preview。未建立 exact-SHA Preview，也不把 Human acceptance 標成自動 PASS。

歷史 398-photo consumer 與部分失敗證據可按原驗證邊界重用；它們不自動證明 main 更新後的所有正式 supervisor／遠端路徑。歷史 daily/import/history operation bytes 與已接受 r3 綁定相符；新版 Payload 的受影響 Day operation 另有本輪隔離證據。

Issue 原文 acceptance、證據對照及完整 hashes 隨本地 exact review packet 審查。實際 model token telemetry 未取得；只能記錄固定 workload 的 bytes／讀取數代理，不宣稱實際 token savings。不能僅以本地 build 或單項 media consumer PASS 宣稱 Issue 全部可關閉。

## 收尾補證（2026-10-30）

[去識別補證](closeout-evidence-20261030.json) 以相同 inventory/model/Source／Registry／plan hashes 接通 451 scanned assets → 400 verified new photos → 61 Moments／743 placements → r3 COMMITTED 與獨立回讀。398-photo consumer 的 verified no-op、舊 Registry 保全及部分失敗安全按原證據重用；舊 UNKNOWN 不改寫。這是分段獨立批准的同一工作流程，不宣稱跨儲存與資料庫原子交易。

新增 `pnpm run test:issue134:heic`：macOS ImageIO runtime 產生合成 HEIC，核對掃描 hash／尺寸、重複 bytes、明確 JPEG 轉檔的不同 assetId、derivedFrom、Registry 保全與 upload input preparation；1/1 PASS。HEIC metadata 可讀不代表 sharp 能解碼 HEVC 像素；目前須明確轉檔，不自動替換原件或賦予 upload 權限。

效率以同一批次的 full plan 1,483,468 bytes／summary 3,267 bytes 記錄初始 metadata context 的代理比較。Issue 允許無 token telemetry 時使用代理，不補造歷史計數，也不宣稱整體模型工作量或實際 token savings。先前列為不足的關聯與格式資料由此補證；[Completion Report draft](../../phase-completion-reports/issue-134-delivery-closeout-draft.md) 仍清楚保留待發布／CI／merge／最終結案批准。

## 後續與恢復

Registry、canonical working Source、上一個 accepted Base、technical locator evidence 各自保存在受保護、可恢復的批次材料；不放照片或原始 Production evidence 進程式 PR。每個後續批次固定輸入與版本、沿用成功 receipt／Registry、保留已完成結果。UNKNOWN 寫入先對帳，不重送；新讀取／寫入須符合新封包與有效批准。任何流程能力擴充或真實新缺口另列 follow-up，不以一般內容作業默默擴充 importer。

程式回復可還原此 patch；這不回復已完成的 Production mutation。歷史 Current/history recovery 需要其專屬證據與獨立批准；root/digest 摘要不是可還原的歷史 archive。
