# Web Li Family Portal Domain Context

Web Li 是單一家庭入口產品：保存家庭身份、共同記憶、旅行規劃、文字創作與未來願望，並只向每種訪客呈現其被授權讀取的內容。

本文件定義穩定產品詞彙。短期 Phase 狀態、migration 執行紀錄與部署 URL 不放在此處。

## Access and people

**Visitor（訪客）**
沒有有效 family session 的網站瀏覽者。
避免使用：anonymous family user、guest member。

**Family member（家庭成員）**
被家庭內容描述的人；可選擇擁有 Payload user account 參與私密內容。人物內容、帳號與登入狀態不是同一概念。
避免使用：profile、account、visitor。

**Administrator（管理員）**
可進入 Payload Admin 並執行被授權內容管理的人。管理員權限不等於可執行 Production migration 或 destructive cleanup。

**Public mode（公開模式）**
只包含明確允許對外公開內容的訪客體驗。
避免使用：logged-out family mode、preview mode。

**Family mode（家人模式）**
由已驗證 Payload user session 建立的存取狀態，可讀取 family-only 內容並依角色參與互動。
避免使用：private page、admin mode。

## Source, published content and reconciliation

**Content source（內容來源）**
`content-source/` 下的版本化 Markdown、照片與 manifest，作為審查及 seed import 輸入。它不是 runtime database。
避免使用：published record、runtime source of truth。

**Catalog configuration（目錄設定）**
`docs/family-members.md`、`docs/travel-projects.md` 等用來定義應存在的成員或旅行項目及其 stable identity 的版本化設定。Catalog 變更仍需 import／sync 才會進入 runtime。

**Seed import（來源匯入）**
將已批准 source projection 轉譯成 Payload records 與 media relationships 的可重複流程。
避免使用：manual copy、automatic deploy。

**Published content（已發布內容）**
應用程式實際讀取的 Payload collection／global record。它可能由 seed 建立，也可能在 Admin 編輯。
避免使用：Markdown source、static mock。

**Runtime source of truth（運行時真相來源）**
Payload collections／globals。前台不直接解析 `content-source/` 來取代 published records。

**Source projection（來源投影）**
Parser 將 catalog、Markdown 與 manifest 轉成的標準化 domain shape，用來比較與匯入，不是另一份持久化 schema。

**Base／Source／Current**

- **Base**：上一次已接受並記錄的 source projection。
- **Source**：本次解析出的 source projection。
- **Current**：目前 Payload published record。

當同一資料同時允許 Source import 與 Admin editing 時，以三方比較決定 update、preserve 或 conflict。

**Safe reconciliation（安全對帳）**
Source-only change 可套用；Current-only change 保留；Source 與 Current 不同修改同一內容時產生 conflict；缺少 Base 的既有 record 預設 preserve-current。

**Conflict resolution（衝突決策）**
對具體 conflict 選擇 `source-wins`、`payload-wins` 或人工合併。它必須有 dry-run evidence，不能由一般 seed 自動猜測。

**Read-back（回讀驗證）**
Mutation 後重新從目標環境讀取資料，證明 schema、record、relationship、visibility 與預期一致。第二次 dry-run 可以提供收斂訊號，但不能取代 domain-specific full read-back。

## Family experiences

**Family lobby（家庭大廳）**
介紹家庭並連結公開與家人空間的首頁。
避免使用：dashboard、admin home。

**Member profile（成員敘事頁）**
呈現家庭成員身份、興趣、里程碑、媒體與公開聯絡資訊的敘事空間。
避免使用：user account、résumé page。

**Blog post（家庭文章）**
具有作者、日期、分類、標籤、內容與可見性的家庭文字作品。

**Timeline event（時間軸事件）**
帶日期的家庭記憶，可關聯成員、文章、旅行或已完成 bucket item。

**Bucket item（共同願望）**
從願望池、進行中到已實現的家庭 aspiration。它不是一般 task。

**Annual Wrapped（年度時光報告）**
按年份整理家庭活動與記憶的季節性 family-only 故事。

**Media asset（媒體資產）**
由 Payload Media record 管理、實體檔案存於 Cloudflare R2 的照片，或保存為外部 URL 的 YouTube 影片 reference。

## Travel domain

**Travel catalog（旅行目錄）**
`docs/travel-projects.md` 宣告、並由相應 source material 支撐的完整旅行集合。Catalog 是版本化輸入，不等於目前公開可見的 runtime records。

**Travel project（旅行項目）**
對一趟家庭旅程的 umbrella concept。Plan 與 Memory 是不同內容 aggregate，不是同一 record 的 status。

**Travel Plan（旅行計畫）**
審核、修訂與討論未來旅程的互動工作區，保存於 `travel-plans`。

**Planning section（規劃段落）**
有順序、可被 anchor 定位的 Plan canonical content unit，保存顯示標籤、內容、連結、媒體與獨立互動設定。

**Active Plan（規劃中）**
旅行時間尚未結束的 Plan lobby presentation state。

**Archived Plan（過往規劃）**
旅行日期已過但仍保留原始決策與討論脈絡的 Plan。它仍是 Plan，不會自動成為 Memory。

**Travel Memory（旅行回憶）**
行後整理照片、心得、里程碑與分享的獨立作品，保存於 `travel-memories`。可以 optional `originPlan` 關聯原 Plan，但擁有不同 identity。

**Travel Memory Day（每日回憶章節）**
隸屬一筆 Travel Memory、可獨立閱讀與編輯的每日章節，保存於 `travel-memory-days`，以 owning Memory＋`dayKey` 識別。

**Travel Memory Moment（每日回憶片段）**
Day 內具 `momentKey` 的有序敘事位置，用來連結當時的文字、時間、地點與 media placements。它不是 Markdown heading anchor。

**Media placement（媒體敘事位置）**
照片或 YouTube 在特定 Moment 中的使用方式，保存可見 caption、role 與 `placementKey`。它與 Media asset 的檔案、alt text及技術 metadata 分開。

**Canonical travel slug**
由 route、catalog mapping、source mapping 與 travel-local asset folder 共用的 stable identity。

**Travel route identity**
由 `travel-route-identities` 管理的 route ownership，確保 Plan 與 Memory 不會宣稱相同 canonical slug。

**Travel interaction target**
可以接收家庭 comment／reaction 的穩定、具 scope 的旅行內容位置。

**Legacy TravelProject**
Phase 17 cutover 前的 `travel-projects` record。Runtime 已由 Plan／Memory 取代；legacy records 與關聯目前只作 rollback evidence，在獨立批准 cleanup 前不得刪除。

## Delivery vocabulary

**Implemented**
要求已進入工作分支，但不代表驗證、合併或部署。

**Locally verified**
對應 focused tests、build、TypeScript 與本地 QA 已完成。

**PR ready**
分支已 push、PR 已建立、Preview 與審查所需證據齊全。

**Merged**
PR 已合併至 `main`；不代表 Production runtime 或 data 已驗證。

**Production verified**
部署 commit、關鍵路由、實際 HTML、metadata、runtime logs 及適用的 data read-back 已驗證。

**Closed**
Phase acceptance criteria、Issue closeout、Completion Report 與必要 Production evidence 全部完成；未完成範圍已有明確的新 Issue／blocker。
