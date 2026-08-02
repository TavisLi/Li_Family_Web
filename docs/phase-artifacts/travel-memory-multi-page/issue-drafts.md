# Travel Memory 多頁重構：Issue 草案

狀態：**Published 2026-08-02／GitHub canonical records 已建立**

Canonical PRD：[#73](https://github.com/TavisLi/Li_Family_Web/issues/73)

本文件保留發布前草案快照與拆分依據；實際狀態、討論與 acceptance criteria 以 GitHub Issues 為準。

Published children：[#74](https://github.com/TavisLi/Li_Family_Web/issues/74)、[#75](https://github.com/TavisLi/Li_Family_Web/issues/75)、[#76](https://github.com/TavisLi/Li_Family_Web/issues/76)、[#77](https://github.com/TavisLi/Li_Family_Web/issues/77)、[#78](https://github.com/TavisLi/Li_Family_Web/issues/78)、[#79](https://github.com/TavisLi/Li_Family_Web/issues/79)、[#80](https://github.com/TavisLi/Li_Family_Web/issues/80)、[#81](https://github.com/TavisLi/Li_Family_Web/issues/81)、[#82](https://github.com/TavisLi/Li_Family_Web/issues/82)。

## 已批准拆分原則

- 三種 presentation styles 均正式支援，並由每筆 Travel Memory 配置一種。
- YouTube placement 維持獨立 vertical slice。
- Production schema、content backfill、runtime cutover 分拆，降低上線風險。
- Destructive cleanup 不屬於本組 Issues，日後另案批准。

## 建議拆分總覽

1. Prototype 決策與正式資料契約
2. 每筆 Travel Memory 可配置的三種 presentation styles
3. 海南 Day 3 第一條端到端每日回憶
4. 海南 Day 8 與完整八日導覽
5. 每日 YouTube placement
6. 可回到每日故事的 Travel Memory 相簿
7. Production additive schema rollout
8. Production controlled backfill 與 read-back
9. Runtime cutover、Production verification 與 closeout

---

## Draft 1 — 鎖定 Travel Memory 多頁閱讀模型與資料契約

### What to build

以本地海南 prototype 驗證 Editorial journal、Cinematic timeline、Family scrapbook 三種正式樣式，記錄各自 Overview、Daily chapter、Photos 的視覺細節，並收斂 style-neutral route-facing interfaces、Day／Moment／Placement identity 與 Payload schema approval package。

此切片不建立 Production schema，也不把 prototype code 直接提升為正式實作。

### Acceptance criteria

- [ ] 海南 Overview、Day 3、Day 8、Photos 可在三種樣式間切換。
- [ ] Day 3 與 Day 8 使用真實照片與 manifest caption。
- [ ] 每日頁可看到 YouTube placement 與海南無影片的誠實空狀態。
- [ ] 三種樣式各自的 hierarchy、tokens、media treatment 與 responsive verdict 已記錄。
- [ ] 正式資料契約包含 Memory／Day／Moment／Placement identity。
- [ ] 決定 Day 是否需要獨立 draft/version lifecycle，以及 Placement 採 collection 或嵌入 Day。
- [ ] 正式 interfaces 不含樣式專屬資料分叉。
- [ ] 正式實作明確要求重寫 prototype。
- [ ] 此切片不執行 Payload schema、Production write 或部署。

### Blocked by

None — can start immediately.

### User stories covered

1–15、25、27–31。

---

## Draft 2 — 交付每筆 Travel Memory 可配置的三種 presentation styles

### What to build

在 `travel-memories` 增加 additive、nullable 的 `presentationStyle` select，建立 exhaustive renderer registry，讓三個正式 renderer 共用相同 Overview／Day／Gallery view models。設定由 Payload Admin 管理，不進入 `content-source` reconciliation。

### Acceptance criteria

- [ ] Select 值固定為 `editorial-journal`、`cinematic-timeline`、`family-scrapbook`。
- [ ] Missing／invalid legacy value deterministic fallback 至 `editorial-journal`。
- [ ] 三種 renderer 均支援 Overview、Daily chapter、Photos、caption、YouTube、access 與 responsive states。
- [ ] 切換樣式不改變 canonical URL、Day／Moment／Placement identity 或內容資料。
- [ ] 同一 Memory 的所有 route 使用同一 published style。
- [ ] `presentationStyle` 不由 manifest、seed projection 或 Base／Source／Current 覆寫。
- [ ] Renderer registry 使用 exhaustive typed mapping，不接受可執行 component path 設定。
- [ ] 三個現存 Memories 的初始配置只在受控 backfill 執行，不夾帶於 schema migration。
- [ ] Prototype switcher 不進入正式 runtime。

### Blocked by

- Draft 1 — 鎖定 Travel Memory 多頁閱讀模型與資料契約。

### User stories covered

15–19、22–31。

---

## Draft 3 — 交付海南 Day 3 第一條端到端每日回憶

### What to build

依已批准資料契約，以 additive schema、travel-only source projection、route-facing interface 與正式每日頁交付 `201307-hainan/day-03`。南山海上觀音及鹿回頭照片必須依 Moment 顯示可見 caption，並保留獨立 alt text。

### Acceptance criteria

- [ ] Additive schema migration 經人工審查，沒有 drop、rename 或既有資料改寫。
- [ ] Day identity 為穩定 `day-03`，不依顯示標題。
- [ ] `nanshan-sea-guanyin` 與 `luhuitou-overlook` 為兩個穩定 Moment。
- [ ] 兩張照片均顯示於正確 Moment。
- [ ] Caption 可見，且與 Media alt text 分開儲存／投影。
- [ ] 直接存取每日路由仍執行 owning Memory 的 public／family／draft access。
- [ ] 每日頁提供返回 Memory 首頁與上一日／下一日導航。
- [ ] Base／Source／Current dry-run 報告 create、update、preserve、conflict、skip、delete。
- [ ] 沒有 Production migration 或 content write，除非另案取得對應批准。

### Blocked by

- Draft 1 — 鎖定 Travel Memory 多頁閱讀模型與資料契約。
- Draft 2 — 交付可配置的三種 presentation styles。

### User stories covered

3–8、15–24、27–31。

---

## Draft 4 — 補齊海南 Day 8 與完整八日旅行導覽

### What to build

在 Day 3 tracer 穩定後，以同一正式 interface 交付 Day 8，並讓 Travel Memory 首頁列出 Day 1–Day 8。Day 8 的礁湖泳池與海灘照片需回到正確時間與 Moment。

### Acceptance criteria

- [ ] Memory 首頁列出完整八天，沒有固定六天截斷。
- [ ] Day 3 與 Day 8 使用同一 route／data interface，不新增一日一套特例。
- [ ] Day 8 礁湖泳池照片定位於 10:30。
- [ ] Day 8 海灘照片定位於 12:30。
- [ ] 兩張照片均顯示 manifest caption 與地點。
- [ ] Day 8 可返回首頁並可前往上一個已發布 Day。
- [ ] 未完成 Day 顯示一致內容狀態，不產生 dead link。
- [ ] 手機與桌面均無橫向溢出。

### Blocked by

- Draft 3 — 交付海南 Day 3 第一條端到端每日回憶。

### User stories covered

1–8、15、21–22、27–29。

---

## Draft 5 — 將 YouTube 安全編排到相應每日 Moment

### What to build

讓照片與 YouTube 共用 placement ordering interface。使用具有真實日期影片來源的 Travel Memory 作端到端 fixture，支援 Day／Moment 定位、privacy-enhanced embed、lazy loading、no autoplay 與安全 fallback。海南沒有影片時只呈現已批准的空狀態。

### Acceptance criteria

- [ ] YouTube placement 必須有 owning Memory 與 Day；Moment 可選但若提供必須可驗證。
- [ ] 有 Moment 的影片出現在相應故事段落，而不是旅行頁底部總表。
- [ ] 只有 Day 的影片出現在該日「當日影片」區。
- [ ] 無 Day 的影片保持 unassigned 並進入 dry-run 報告，不自動猜測。
- [ ] Embed 使用 `youtube-nocookie.com`、lazy load 且沒有 autoplay。
- [ ] 無效 URL 顯示安全外部連結或明確錯誤狀態。
- [ ] 同一 canonical placement 不重複顯示。
- [ ] Family-only direct route 不洩露影片標題、caption 或 URL。
- [ ] 海南頁不挪用其他旅行影片。
- [ ] 三種 presentation styles 均能呈現相同 YouTube placement contract。

### Blocked by

- Draft 3 — 交付海南 Day 3 第一條端到端每日回憶。

### User stories covered

9–12、16、18、20、23、28。

---

## Draft 6 — 建立可回到每日故事的 Travel Memory 相簿

### What to build

重寫 Travel Memory Photos 為可分頁、可按 Day／location 篩選的影像檔案。每張照片顯示 placement caption、時間與地點，並能返回所屬每日 Moment。相簿只查詢 gallery view model，不載入完整 Memory 長文。

### Acceptance criteria

- [ ] 相簿支援 Day filter，且 filter 可由 URL 表示。
- [ ] 每張照片顯示可見 caption。
- [ ] 有 Day／Moment 的照片可返回每日故事位置。
- [ ] 無 Day 的 gallery-only 照片仍可呈現，但明確標示未分類。
- [ ] 大量照片使用分頁或 cursor，不一次序列化完整相簿。
- [ ] 圖片保留合理原始比例，不裁掉主要人物與景點。
- [ ] Direct gallery access 執行 owning Memory access。
- [ ] 三種 styles 共用 gallery view model，且 mobile／keyboard／empty state 經 QA。

### Blocked by

- Draft 3 — 交付海南 Day 3 第一條端到端每日回憶。
- Draft 4 — 補齊海南 Day 8 與完整八日旅行導覽。

### User stories covered

13–16、18、22、27–29。

---

## Draft 7 — 執行 Production additive schema rollout

### What to build

在 migrations、disposable/local rehearsal、Preview regression 與 approval package 完成後，只執行已批准的 Production additive schema migration。不得在同一操作寫入 Travel Memory 內容或切換 runtime。

### Acceptance criteria

- [ ] Migration 前 inventory 與批准基線一致。
- [ ] Migration SQL／up／down 經人工審查，沒有 drop、rename、delete 或內容 backfill。
- [ ] `presentationStyle` 為 nullable，舊 runtime 在空值下仍可運作。
- [ ] Day／Moment／Placement 新結構保持 additive、nullable、backward-compatible。
- [ ] Production migration 完成後只做 schema read-back。
- [ ] 任何 data-loss warning、inventory drift 或 read-back failure 均停止後續工作。
- [ ] 舊 arrays／relationships 完整保留。

### Blocked by

- Draft 2–6 全部完成並通過 Preview QA。
- Production schema migration 另行明確批准。

### User stories covered

24、27–31。

---

## Draft 8 — 執行 Production controlled backfill 與 read-back

### What to build

在 schema rollout 驗證完成後，以 travel-only controlled executor 寫入批准的 Days、Moments、Placements 與三筆 `presentationStyle`，隨即進行逐筆 read-back。此切片不切換 runtime。

### Acceptance criteria

- [ ] Backfill 前 travel-only dry-run 沒有未批准 collection、delete、unexpected update 或 unresolved conflict。
- [x] 初始 style assignment 已由網站擁有者於 2026-08-02 確認。
- [ ] 海南 read-back 為 8 Days、11 itinerary placements、0 silent wrong-day mapping。
- [ ] 有真實影片的 Memory read-back 證明 Day／Moment placement。
- [ ] 三個現存 Memories 各有一種不同且有效的 `presentationStyle`。
- [ ] Admin-only style choice 不會被 source reconciliation 覆寫。
- [ ] Read-back timeout／失敗時不進入 runtime cutover。
- [ ] 舊 runtime 仍是對外服務路徑。

### Blocked by

- Draft 7 — Production additive schema rollout 完成並 read-back。
- Production content write 另行明確批准。

### User stories covered

18–24、26、29、31。

---

## Draft 9 — 執行 runtime cutover、Production verification 與 closeout

### What to build

在 backfill read-back 與 Preview browser QA 通過後，以獨立批准切換正式 Overview／Day／Photos runtime，驗證三種 style、access、metadata 與 rollback，完成觀察與 closeout。不得刪除 legacy data。

### Acceptance criteria

- [ ] Deployed commit 與批准 commit 一致。
- [ ] 三筆現存 Memories 分別以三種已批准 style 呈現。
- [ ] Overview、Day、Photos、caption 與 YouTube placement 經 Production QA。
- [ ] Public、family-only、draft visibility 均符合 access contract。
- [ ] Canonical、Open Graph metadata 與 child-route response 正確。
- [ ] Missing style fallback 與 rollback 路徑均經驗證。
- [ ] 觀察期內舊 runtime／資料仍可回退。
- [ ] Completion report 分別記錄 schema、data、runtime、Production verification 狀態。
- [ ] 未刪除舊 arrays、relationships 或 source evidence。

### Blocked by

- Draft 8 — Production controlled backfill 與 read-back 完成。
- Runtime cutover／deployment 另行明確批准。

### User stories covered

1–31。

## 已確認決策

Issue 粒度、YouTube 獨立 slice、分段 rollout 與三筆現存 Travel Memories 的初始樣式配對均已批准：

- `201307-hainan` → `family-scrapbook`
- `202308-east-australia` → `cinematic-timeline`
- `202602-thailand-phuket` → `editorial-journal`

上述批准已另行延伸至 #73–#82 的 GitHub publication；仍不等於批准 Production schema migration、content write 或 runtime cutover，這些維持獨立授權。
