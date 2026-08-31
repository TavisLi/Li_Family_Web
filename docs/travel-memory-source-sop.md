# Travel Memory completed source 人類操作 SOP

Canonical template：`docs/templates/travel-memory-source-template.md`。它是唯一正式的 completed Travel Memory source template；`docs/templates/planning-travel-source-template.md` 只適用 Travel Plan。

## 1. 準備

1. 從 canonical template 複製新檔到 `content-source/travels/`，填入不含秘密的標題、日期、同行成員、航班、住宿、摘要、每日內容與故事。
2. 在 `docs/travel-projects.md` 登記 canonical slug；Markdown、route與 `content-source/assets/travels/[slug]/` 使用同一 slug。
3. 確認 Public/Family visibility；不要把私人內容、token、cookie或帳密放進 source。

## 2. 照片與影片

- 接受 `.avif/.gif/.jpeg/.jpg/.png/.webp`；先把 HEIC/HEIF 轉換成其中一種。
- 檔名穩定、描述內容，不用 array index當 identity。
- `altText` 描述照片看見什麼，供螢幕閱讀器；`caption` 說明這張照片在此故事中的意義，會顯示在頁面。兩者不可互相代替。
- `cover/`、`gallery/`、`itinerary/` 是整理慣例，不是 parser 強制資料夾。canonical 判斷以 manifest `usage` 為準。
- itinerary placement 必須有 `day`、`sectionId`、`sourcePath`；可加 `time/location/caption/sortOrder`。無法匹配就進 unmatched report，不猜。
- Admin 編輯者不填 `momentKey` 或 `placementKey`；系統自動產生。Source 的 `sectionId` 會成為 semantic Moment identity。

## 3. Local audit

1. 執行 canonical contract test與 seed parser tests。
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
