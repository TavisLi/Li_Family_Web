# Travel Memory completed source 人類操作 SOP

Canonical template：`docs/templates/travel-memory-source-template.md`。它是唯一正式的 completed Travel Memory source template；`docs/templates/planning-travel-source-template.md` 只適用 Travel Plan。

## 1. 準備

1. 從 canonical template 複製新檔到 `content-source/travels/`，填入不含秘密的標題、日期、同行成員、航班、住宿、摘要、每日內容與故事。
2. 在 `docs/travel-projects.md` 登記 canonical slug；Markdown、route與 `content-source/assets/travels/[slug]/` 使用同一 slug。
3. 在 frontmatter 明填 `startDate: "YYYY-MM-DD"`、`endDate: "YYYY-MM-DD"` 及 `isPrivate: true`（Family）或 `isPrivate: false`（Public）。日期必須有效、結束不早於開始；日期使用引號，boolean 不加引號。範本預設 Family；公開必須由編輯者明確選擇。`date` 是文件日期，不能代替旅程日期；正文日期也應同步核對。不要把 token、cookie 或帳密放進 source。
4. 新 completed Memory 缺少或填錯上述欄位、必要章節或連續 Day 編號，parser 會拒絕匯入，不再默認 2026-01-01／公開。三筆既有正式 Memory 的舊檔名＋slug mapping 暫保留原解析行為；若它們明填任一新 metadata 欄位，即須完整通過新契約。此相容路徑不是新內容範本，Travel Plan 不受本次修改影響。
5. 有航班時，表格使用範本表頭：`日期／航空公司／航班／航線／起飛／抵達／備註`；可另加 `乘客` 欄，欄位可換順序，名稱不要改寫。起飛／抵達分開填寫；必要值不可留空，`備註` 可空白。沒有航班時保留「航班信息」章節並寫明「無航班。」，不要建立空表格。沒有乘客欄就不產生乘客資料。`出行人` 支援以 `、` 分隔的純名單，也保留名單後的全形括號註記格式。

## 2. 照片與影片

- 接受 `.avif/.gif/.jpeg/.jpg/.png/.webp`；先把 HEIC/HEIF 轉換成其中一種。
- 檔名穩定、描述內容，不用 array index當 identity。
- Manifest 的 `altText` 描述照片看見什麼，供螢幕閱讀器；新 canonical Memory 每張照片都必填非空白值。`caption` 說明這張照片在此故事中的意義，屬於 placement 可見文案，不可代替 `altText`。既有三筆舊格式 Source 暫保留原回落行為；任何內容修正需另作精確比對及批准，不由此 parser 更新自動回填。
- `cover/`、`gallery/`、`itinerary/` 是整理慣例，不是 parser 強制資料夾。canonical 判斷以 manifest `usage` 為準。
- itinerary placement 必須有 `day`、`sectionId`、`sourcePath`；可加 `time/location/caption/sortOrder`。無法匹配就進 unmatched report，不猜。
- Admin 編輯者不填 `momentKey` 或 `placementKey`；系統自動產生。Source 的 `sectionId` 會成為 semantic Moment identity。

## 3. Local audit

1. 執行 canonical contract test與 seed parser tests。
   `pnpm run test:clean-room` 使用暫存 synthetic Source／manifest、假的唯讀資料庫回應及三套實際 HTML renderer；不連 DB／R2，不代表 Browser QA 或真正 import／access 已通過。
2. 執行 `pnpm run seed:travel:dry-run`；確認 parent及 `travel-memory-days` 都有 create/update/preserve/conflict/skip。
3. 若有 missing media、duplicate placement、missing Base或 conflict，停止並由人類決定 Source/Payload/人工合併。

## 4. Migration gate

Schema 變更先產生 types與 migration，人工審查 UP/DOWN，再於 disposable database rehearsal。任何 drop、CASCADE、未批准 collection或 data-loss warning都停止。完成 rehearsal不等於批准 Production。

## 5. Preview與 Human approval

Preview 檢查 Overview、每一個 Daily、Photos；至少 desktop、tablet、390px mobile，並檢查 Public/Family access、alt/caption、heading、keyboard/focus、overflow、broken media與 console error。三套樣式分別用海南、澳洲、普吉島驗收。Human 明確批准後才進下一 gate。

## 6. Production apply/read-back

Production schema migration、content write、media upload、deploy及 destructive cleanup是五個不同批准。獲批准後只執行 approval package列出的 target，隨即獨立 read-back row counts、identity、relationships、visibility與實際 routes。第二次 dry-run不能取代 read-back。

## 7. Rollback與停止條件

- Code rollback使用已知健康 deployment；它不會回復 Payload data。
- Data rollback只使用已審查方案。
- inventory drift、unmatched/duplicate、conflict、migration warning、read-back timeout、private leakage或 commit mismatch：立即停止，保留證據，不自行重試或擴大 scope。
