# Travel Atlas：PRD、UX 與實作契約

狀態：PR-01 提案，待 Human review；基線 `431f0cdcb0cb1151cacc7d9cf2d59a3317b5a635`。關聯 [Epic #167](https://github.com/TavisLi/Li_Family_Web/issues/167)、[PR-01 #168](https://github.com/TavisLi/Li_Family_Web/issues/168)、[Proposed ADR](../../adr/0010-travel-atlas-map-projection.md)。本文件是規格，不是 runtime、schema、資料、部署或後續 PR 的執行批准。

## 產品與邊界

讓訪客從 Corridor 辨識家庭足跡，進入 Plan 的每日行程或 Memory 的故事；家人可依現有權限查看私密旅行。成功是能找到旅行、理解一天的順序、選定地點並開啟導航，及由地點返回相應章節；地圖不可用時仍能完成閱讀。非目標：自動地理編碼、即時定位追蹤、行程最佳化、離線地圖、實際道路路線推算、第二套旅行資料、批量補齊既有資料。線段只代表經審核的地點順序，不能暗示真實行走路徑。

設計 read：先看旅程與故事，再用地圖提供空間脈絡；Plan 和 Corridor 清楚克制，Memory 保留各自敘事風格，Showcase 只在有故事目的時放大鏡頭。沿用 [視覺系統](../../design/li-family-visual-system.md) 的字型、語意色、Lucide、Tailwind／shadcn 與真實家庭影像；Corridor／Plan 為 Standard，Memory 為 Premium，指定 Showcase 才用 Showcase motion。不把照片 fallback 當內容完整證據。

## 體驗規格

### 共通

地圖是現有頁面的增強區塊，旁邊始終有等價的文字清單；地圖無法載入、WebGL 不支援、位置缺失或空集合時保留清單與章節，顯示具體狀態，不顯示虛構針點。地名、日期、狀態以文字表達；選取同步更新清單、標記及詳情，僅使用穩定 identity，不依陣列位置。改篩選若所選項不再可見則清除選取，不留舊 popup。地圖控制有可見名稱、鍵盤 focus、縮放／重置與替代清單；標記可由清單操作，非依 hover。關閉 popup 後 focus 返回觸發器；地圖不攔截頁面滾動，無鍵盤陷阱。狀態 announce 只說可見結果數與選取內容。

Desktop：最大內容寬度沿用頁面，地圖與清單並列，清單可捲動但頁面導覽始終可達。Mobile（先驗證 390px，另測 320px）：單欄，標題與篩選、精簡地圖、清單依序；選取的詳情在清單內展開，不以遮滿畫面的不可關閉面板阻擋閱讀。觸控目標至少 44×44 CSS px，地圖操作不依賴 hover；無水平溢位，sticky 區域不遮 focus／錨點。鍵盤、螢幕閱讀器及 200% 縮放均能使用文字路徑。

### 視覺設計規格

- **版面**：Desktop 以地圖為主要視覺、旁側清單為閱讀與操作入口；標題和篩選放在地圖上方，避免遮住地理內容。Mobile 依標題／篩選 → 地圖 → 清單排序，地圖保留穩定高度與可見控制，展開詳情不覆蓋頁面導覽；390px 與 320px 檢查文字、觸控及安全邊界。
- **Markers／clusters**：單點使用清晰輪廓與中心符號；Plan 可顯示當日順序號，Memory 可用故事符號，選取時以外框、大小及可見標籤共同區分，不只依靠顏色。重合地點以含可見旅行數的 cluster 呈現，點選展開對應清單；不同縮放下標記不遮蔽主要控制，focus 明顯且觸控命中區至少 44px。
- **Popup／cards**：Popup 簡潔顯示地名、日期／狀態與一個明確動作，必要時可關閉；列表卡以標題、次要日期及地點建立層級，Memory 可用授權照片與 placement caption，無圖沿用 ImageFallback。Mobile 詳情在清單內展開，文字不截斷關鍵資訊；不得靠 popup 承載唯一內容。
- **色彩與影像**：使用既有 background／foreground／card／primary／accent 等語意 token，藍／金／綠只作克制提示；底圖降低與標記、文字的視覺競爭，歸屬資訊保持可讀。選取、狀態與路線同時使用形狀、線型或文字區分，實測淺／深色及照片上的對比。照片以真實旅行影像作敘事焦點，不用裝飾性漸層取代內容。
- **動態節奏**：一般 hover／focus／選取回饋即時至約 200ms；章節切換約 200–450ms 且可中斷。Showcase 的鏡頭和示意路線只在章節轉換時服務敘事，時長逐案量測，不自動循環；reduced motion 直接定位並保留完整內容與控制。

### Corridor

頁面先顯示標題、可見旅行數與年份／狀態篩選，再顯示地圖與對應列表。狀態依既有 Plan 的 endDate 推導 active／archived，Memory 為 completed memory，不以日期把 Plan 轉成 Memory。初始為全部可見年份與狀態；篩選後地圖和列表使用同一已授權集合。相同地點使用經人工確認的共同地點識別或完全相同有效座標群組，不能靠近似地名或距離猜測；群組顯示可見旅行數及逐筆連結，兩筆同座標不互相覆蓋。選群組開列表，選旅行進既有 canonical route；無座標旅行仍在列表中且標示位置未提供。無結果提供清除篩選。

### Plan

保留現有 planningSections 的閱讀、互動及順序；每日導覽選 day／section 後，清單顯示該日有地點的已審核項目，地圖顯示同一批標記。選清單項目聚焦標記並展開地址／導航；選標記同步清單，不能替代原文。切換日保留可預期 focus，重設選取；無有效座標的項目保留原文，可在地址足夠時以文字查詢導航，不生成估計位置。Google／高德按鈕明示會開外部服務及分享目的地，只有使用者點擊才送出；不要求地理定位。

### Memory

Overview 的地圖為故事索引；Day 依 `dayKey` 顯示該日 Moment 順序，選標記／列表項定位相同 `momentKey` 的標題與其 photo placement；文字、caption 和照片保留各自 ownership。由 Overview 點選地點進相應 Day 的穩定錨點；返回保留可達的導覽。沒有位置的 Moment 繼續完整呈現；沒有照片使用現有 fallback，不刪故事。所有既有 presentationStyle 消費同一授權 projection，不能各建資料副本。

### Cinematic Showcase

故事以「地區總覽 → Day → 選定 Moment／照片」為可手動前進／返回的章節；鏡頭移動和線段高亮只解釋章節關係，時間軸與照片文字同時可讀。只用已知有序點畫明確標示為示意的直線；缺兩個有效點不畫線。單次轉場可中斷，手動選擇立即生效；無自動循環、scroll hijack 或強制播放，離開頁面停止動畫。`prefers-reduced-motion: reduce` 及使用者停止時，鏡頭直接定位、無飛行／視差／自動播放，故事與 controls 完整；動態切換偏好立即生效。至少測低階手機、背景／回頁、WebGL context loss、連續快速操作；超過效能預算則回退靜態視圖和列表。

## 資料、身份與安全

依 [CONTEXT](../../../CONTEXT.md)、[ADR-0001](../../adr/0001-runtime-content-records-are-payload-owned.md)、[0002](../../adr/0002-family-mode-is-an-access-boundary.md)、[0003](../../adr/0003-travel-slugs-own-source-and-asset-identity.md)、[0006](../../adr/0006-seed-reconciliation-protects-published-content.md)、[0007](../../adr/0007-travel-plans-and-memories-are-separate-records.md)、[0009](../../adr/0009-travel-memory-pages-share-one-content-model.md)：Payload 是 published truth；Source 是匯入輸入；Plan／Memory identity 不合併。當前 Plan 以 `planningSections.anchor` 識別 section；Memory Day 以 owning Memory＋`dayKey` 識別，Moment 以 `momentKey` 識別，placement 用 `placementKey`，照片以 SHA-256 assetId 識別。Moment 目前 `location` 是文字，並非座標證據。

提議 PR-03 在既有 owning records 的適當 section／Moment 上增設 optional 地理資訊，而非建立第二個旅行 aggregate：顯示名稱、經緯度、座標參考系與 provenance／人工確認狀態；Plan 若一 section 需要多個地點，需具穩定 stop key 的有序項目（不可用 index 或名稱為 identity），具體欄位及 legacy identity migration 在 PR-03 審查決定。Memory 的 Moment 可對應單一 optional 地點；旅程級概覽點必須明確標記為概覽，不從第一張照片猜測。latitude [-90,90]、longitude [-180,180]、有限數、兩值成對；缺值、模糊來源、未知 CRS、無效值不輸出點。`0,0` 不因為零而視為缺失。不得根據地址或 GPS 自動公開位置；任何匯入及手工編輯需明確 ownership／visibility 審查。

來源與 Admin 共編時，以旅行／section stop key 或 Memory／dayKey／momentKey 為粒度，地理欄位整組進 Base／Source／Current：Source-only 可更新；Current-only 保留；雙方不同修改 conflict；既有 record Missing Base preserve-current；未提供 Source 不代表刪除。順序／relationship 改動獨立列出；不得以缺項刪 Current。Plan stop key 的生成、保存與舊記錄對照先 dry-run 並人工核對，不以地名重建。報告 create/update/preserve/conflict/skip/delete、可見性及 before-image；conflict 不自動寫入。schema、baseline metadata、content／media／relationship 寫入與 cleanup 各自獨立 gate，完整 read-back 不可用第二次 dry-run 代替。

| 讀取者 | 資料層／projection 最小輸出 | 禁止 |
| --- | --- | --- |
| Public | 僅 published 且 `isPrivate=false` 的 Plan／Memory；Day 必須自身及 owning Memory published 且 owner public；只投影授權地點與必要標籤 | private／draft 座標、計數、bounds、群組、URL、照片、metadata、HTML／RSC／JSON-LD、log 或 cache 洩漏 |
| Family session | 經認證可讀 published family 內容，Day 同時符合 owner；資料層仍檢查 session | 把 family projection 放入 shared public cache、將 draft 暴露給普通家人 |
| Admin | 依現有 Admin 權限編輯／預覽 draft；預覽獨立、不可進 public cache | 使用 overrideAccess 的資料繞過 owner 判斷後送 public |

聚合、年份、群組數、bounds、線段、頁面 metadata 與 navigation URL 皆在 access 過濾後推導，避免側信道。對 family／draft 的 responses 使用符合現有 session policy 的 private/no-store，絕不跨使用者共享快取；登出切換時清除 client 選取及已載入資料。Tile provider 可見 IP、referer 與所請求地圖範圍；禁止將 private 座標／標籤放入 tile URL 或傳給 geocoder／analytics；敏感地點即使僅以 viewport 請求也可能洩漏，family map 預設不載入第三方地圖，除非 owner 明確批准資料傳送與用途；文字列表仍可用。外部導航的明確點擊是將目的地交給第三方，不等於背景傳送授權。

## 地圖、成本與導航

截至 2026-10-30 的建議，啟用前重新核對條款、流量、額度、地區覆蓋與 key 限制；估算不足以承諾免費。MapLibre GL JS 是 [BSD-3-Clause](https://github.com/maplibre/maplibre-gl-js/blob/main/LICENSE.txt) renderer，不含底圖；依實際 Next／React 與 CSP／worker 相容性在 PR-02 選定並鎖版本，延遲載入、卸載釋放 WebGL。MapTiler Cloud 為候選：其 [Free](https://www.maptiler.com/cloud/pricing/) 頁列 $0、適合測試／個人或非商業用途；額度與超額處理需查實際 account，付費 Flex 頁列 $30/月起與額外流量計費，不能預設自動升級。其 [attribution](https://docs.maptiler.com/guides/map-design/attribution/add-attribution/) 要求每張地圖顯示供應商與 OSM 歸屬、Free 額外 logo。公開瀏覽器 key 不是 secret，限站點／scope、監控與配額；真正 secret 不進 client。

[OSMF 公共 tile](https://operations.osmfoundation.org/policies/tiles/) 是有限、無 SLA 的社群資源，需 attribution、有效 referer、遵守 cache 且禁止預抓；不是可保證容量的生產 fallback。自託管需運維、資料授權和成本，現階段不選。候選方案無法滿足條款、預算、可用性或隱私時，fallback 為文字清單及現有內容，不自動切到另一供應商或在背景重試。正式供應商、預算上限、條款及 family 第三方政策為 Human 決策／PR-02 上線前置。

內部提議以 WGS84 的經度、緯度（MapLibre `[lng, lat]`）保存經確認座標，原始來源 CRS／provenance 不覆蓋；未知 CRS 不轉換、不導航。Google [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) 用 `api=1`、URL encoding，destination 座標順序 `lat,lng`，不需 API key；不傳自動收集的 origin，支援缺座標時明確地址查詢，使用者確認目的地。高德 [URI](https://lbs.amap.com/api/uri-api/guide/travel/route) 的 `to` 格式為 `lng,lat[,name]`；中國地區資料與底圖 CRS 需分別核對，高德輸入的 GCJ-02 與 WGS84 不可直接混用。轉換方案、授權、適用區域、精度與實測 fixture 尚未確認：在 PR-02 完成核對之前，不輸出高德座標導航按鈕；不假設簡單國界判斷或套用未核准轉換。對不支援／缺地址／無法驗證坐標情形顯示不可用及原因；不虛報路線正確。URL 只由選定、已授權項目生成，不含其他 private stop。

## 實作與驗收：七個獨立 PR

所有 PR：依當前 main／accepted ADR 重新核對 scope；測試實際 target head、Public／Family／draft 邊界、loading／empty／error、keyboard／mobile；Human review、merge、migration、Production read/write、部署及 release 均依治理獨立批准。依賴是交付順序，不代表批准或可跳過 gate；每一項使用 synthetic fixture，不以 Production 資料自動補齊。

| PR | 依賴與範圍 | 可獨立驗收 |
| --- | --- | --- |
| 01 | 本文件＋Proposed ADR；docs only | 三頁與 Showcase、ownership、安全、供應商、導航、測試矩陣及 PR-02–07 供 Human review；不改 runtime／schema／Production。 |
| 02 | 01 核准；共用地圖核心、可存取 fallback、Google／經驗證的高德導航，先用 synthetic data | 點／選取／清除、URL encoding 與座標順序、空值／錯誤／WebGL fallback、reduced motion、鍵盤及 privacy；高德未通過 CRS gate 保持停用；provider 成本與政策核准後才上線。 |
| 03 | 01 核准；依 02 的界面契約建立 optional geo 與安全 source/Admin reconciliation | generated types、migration up/down 審查、schema-fidelity disposable rehearsal；stable key、legacy、missing Base、雙改衝突、無刪除、access／read-back 與 rollback 計畫；Production 各 gate 另批。可與 02 並行設計但整合需兩者。 |
| 04 | 02＋03；Plan 每日地圖與導航 | synthetic 多日／無位置／同點／公開及私密 fixture：日切換、清單與點一致、原文完整、導航只送已選點，權限及 responsive 矩陣通過。 |
| 05 | 02＋03；Memory Overview／Day／Moment 故事連結 | 三個 presentationStyle 使用同一 projection；Day owner access、momentKey／placementKey、無地點／照片、深連結、照片 caption 不丟失，權限與 mobile 矩陣通過。 |
| 06 | 02＋03；可見 Plan／Memory 的 Corridor | 年份／狀態篩選一致、同點多旅行與無座標列表、canonical routes；private/draft 不影響 Public 計數／bounds／HTML/cache，手機鍵盤通過。 |
| 07 | 04＋05＋06；Showcase 與端到端 QA | 故事章節／示意線、可中斷控制、reduced motion、provider failure fallback；完整下表 evidence、head／環境記錄與已知差異；無故障即放行或僅憑 READY 當證據。 |

## 測試矩陣與風險

| 面向 | 最低場景及通過條件 |
| --- | --- |
| 視覺／互動 | 320／390、768、1440px；Public、Family、Admin 預覽；地圖／清單／filters／detail、空／loading／error，無裁切、重疊或不可達操作；記錄 route、head、fixture、viewport 截圖與操作。 |
| 安全 | 匿名、一般家人、Admin；public/family/draft owner × published/draft Day；直接 API、HTML、RSC、metadata、JSON-LD、bounds、cluster count、URL、network、cache 與登出切換均不得洩漏不該看內容；驗證 response 而非只看 UI。 |
| 可存取性 | 鍵盤完整路徑及 focus return、SR 名稱與狀態、44px 觸控、200% zoom、對比、reduced motion 動態切換；地圖不可用時文字完成核心任務。 |
| 效能 | 同裝置／網路與 fixture 比較 baseline；記錄 LCP ≤2.5s、INP ≤200ms、CLS ≤0.1 目標及 bundle、tile requests、低階手機互動／context loss；不達標記 BLOCK 或經 owner 審查調整範圍，不把實驗室測量當 field evidence。 |
| 地理／導航 | 邊界值、0,0、部分值、無效／未知 CRS、同點、順序變更；Google 和高德（啟用前）以可公開 fixture 比對實際裝置、不同地區與供應商座標，核對位置和外部應用缺失 fallback。 |
| 資料 | additive nullable、舊資料無變更、types／migration／down、disposable rehearsal；三方比較、stable identities、conflict、before-image、scope 與完整 read-back。 |

主要風險：第三方 viewport 洩露家人位置（預設禁用 family 第三方 tiles）；CRS 錯配導錯路（高德停用直到驗證）；免費方案變價或超額（預算及 kill switch，文字 fallback）；缺失或雙改造成資料損失（safe mode 和獨立 write gates）；WebGL 或手機效能（延遲載入及列表）；群組洩漏 private record（先授權再聚合）。供應商的實際 account、成本上限、中國可用性及合法轉換方案目前 UNKNOWN，需 Human 選擇／後續驗證，不能作為已完成 evidence。
