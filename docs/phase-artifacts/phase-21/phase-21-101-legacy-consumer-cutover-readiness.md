# Phase 21 #101 Legacy Consumer Cutover／Cleanup Readiness

狀態：**C1 LOCALLY VERIFIED／C2 NOT STARTED／未批准 Production cleanup**

2026-09-06 更新：C0 scoped inventory 與 content read-back 已 PASS；Human Owner 選擇 A，以 published canonical Day／Moment 為唯一 runtime authority。104 筆 itinerary identity 精確對應；25 組 Daily 的非等價內容已由 A 決策處理。C1 本地 cutover 已驗證，仍須 scoped review、Preview QA 與部署後零 legacy-read 證據，不能執行 cleanup。

日期：2026-09-04
範圍：Travel Memory legacy／transition fields；不包含 202702 Phuket Travel Plan、七個未追蹤素材、其他 collection 或任何 schema／content／media write。

## 目的與成功定義

在任何 DROP／DELETE 前，先把仍依賴 legacy 欄位的 runtime、seed、Admin 與 read model 改為 canonical `Memory → Day → Moment → Placement` projection，完成一段可觀察的零讀取窗口，再產生精確、可回滾的 cleanup migration。成功不以「搜尋不到欄位名稱」定義，而以執行期 consumer、資料 destination、權限與 read-back 證據定義。

## 欄位分類與現況（不可擴張）

| 欄位／關係 | 證據與現況 | 本方案處置 |
| --- | --- | --- |
| `travel_memories.dailyHighlights` | C1 前由 runtime adapter、舊 detail renderer 與 seed projection 消費／產生；C1 本地 cutover 後上述 seam 為 0，待 C2 Preview／部署後驗證 | **DELETE CANDIDATE／C1 COMPLETE**；C2 與 destructive approval 通過後才可評估移除 |
| `travel_memories.itineraryImages` | C1 前由 runtime 與 seed 讀取／產生；104 筆候選已精確對應 canonical Placement；C1 本地 seam 為 0，待 C2 Preview／部署後驗證 | **DELETE CANDIDATE／C1 COMPLETE**；unmatched／duplicate 維持 0 且 C2 通過後才可評估移除 |
| `travel_memories.galleryImages` | Photos data layer 與 gallery projection 仍使用；包含未分類相片 | **保留／另案評估**；未分類資產不得在 cleanup 中刪除或猜測掛到 Day |
| `travel_memories.externalVideos` | Overview／Photos 全旅程影片 consumer 仍使用 | **KEEP**；只做 canonical video identity 去重，不刪欄位 |
| `travel_memories.reminders` | Overview／detail renderer 仍使用 | **KEEP**；重複內容只能另提 merge，不作 schema delete |
| `media.relatedMembers`、`media.relatedTravelRecord` | Media collection 仍允許編輯，且關係 inventory／R2 projection 仍依賴 | **DEPRECATE／保留**；除非完成 Admin-only 編輯替代、完整 destination mapping 與觀察期，不得 DELETE |
| `timeline_events.relatedMembers`、`relatedTravelRecord` | 屬 TimelineEvents，不是 Media targets | **OUT OF SCOPE**；不得因同名搜尋結果擴張 cleanup |

## Cutover 階段

### C0 — 冻結與基線（唯讀）

1. 固定 merge commit、Node `20.20.2`、Payload `3.85.1`、`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`。
2. 建立 consumer allowlist：runtime read、seed write projection、Admin field、tests、migration，分開標記，不能以 `rg` 數量代替判定。
3. Production 單連線 read-only inventory：parent／locale／version／Day／Moment／Placement／Media relation counts、non-null samples、FK／RLS／grant；SQL statement timeout 15 秒。
4. 產生 Git-ignored 私有 before snapshot（目錄 0700、檔案 0600、exclusive create），只保存本次 read-back 所需資料，不提交、不上傳。

### C1 — Canonical projection cutover（本地／Preview）

1. Runtime Overview、Daily、Photos 只從 canonical child projection 取得已映射內容。原先規劃的 legacy read fallback 已被 Human Owner 的 A 決策取代：legacy 欄位不得進入 query，rollback 使用前一 deployment，不在新程式保留雙讀 seam。
2. Seed dry-run 與 reconciliation 改為輸出 canonical destination（collection＋stable key），不產生 synthetic DB ID。
3. 對每一筆 `dailyHighlights`／`itineraryImages` 建立 source key → Day/Moment/Placement mapping；missing Base、Current-only、unmatched、duplicate、collision 任一非零即 BLOCK。
4. 保留標題、日期、現有媒體配置與 Current-only Admin edits；不順帶 reimport、不改 Hainan／Australia transport 或 story role。

### C2 — Regression／觀察期

- focused tests：runtime projection parity、Photos 去重／日期／類型篩選、Daily transport／media、匿名 access、Admin edit round-trip、seed dry-run no-write。
- synthetic disposable PostgreSQL：`up → seed/read-back → down → read-back → up`；驗證內容 checksum、關係數量、FK、RLS／grant 與 rollback。
- Preview GET-only：三套 renderer × Overview／全部 Daily／Photos、desktop／tablet／mobile；檢查圖片實載、無空 footage frame、無 raw Markdown、無水平溢出、鍵盤 focus／heading／contrast／reduced-motion。
- C1 以 query select contract、consumer search 與 tests 證明程式無 legacy read seam；這不是 Production 觀察證據。部署後觀察窗口仍須以 exact commit、route QA 與可用的 query/runtime telemetry 證明未回到 legacy consumer。任何 5xx、access regression、媒體遺失、checksum／row drift 即停止並保留證據，不重試 cleanup。

### C3 — Cleanup readiness package（仍不執行）

只有 C0–C2 全部通過，才產生：

1. 精確 target allowlist（預期僅 `dailyHighlights`、`itineraryImages`；其餘欄位明列 KEEP／DEPRECATE）。
2. Generated UP/DOWN SQL／migration review：不得 CASCADE、不得觸碰其他 collection、不得 DML、不得刪除未映射資料。
3. Physical write envelope：Payload history／locale／relation／route metadata 的預期附帶效應與 row allowlist。
4. Verified backup receipt、restore drill、before／after hashes、row counts、FK／RLS／grant read-back。
5. Human approval package：schema migration、content migration、media write、deploy、cleanup、Issue closeout 各自獨立核准。

### C4 — Production cleanup（未獲授權，不得執行）

執行時必須使用 fresh preflight、同一 executor HEAD 與批准 checksum；交易內驗證 target set／backup／permissions，commit 後獨立 read-back。任何 pending set、checksum、schema、history、row count、RLS／grant、fallback、access 或內容／媒體 drift 立即 BLOCK，不能自行 rollback、retry 或 cleanup 其他項目。

## 明確停止條件

- 任一 canonical destination 缺失、重複、collision、Current／Source conflict。
- 任一 runtime query／seed projection 重新出現 legacy 欄位，或部署後 telemetry 顯示 legacy consumer。
- `galleryImages` 未分類媒體、externalVideos、reminders 或 Media relations 被誤列為 DROP。
- backup／restore drill 不可驗證、Production inventory 與 baseline 漂移、查詢 timeout／權限失敗。
- migration 含 DROP 以外的意外 SQL、CASCADE、unrelated collection 或 data rewrite。
- Preview／Production commit 不一致，或 Browser／accessibility／media read-back 不完整。

## C0 execution checkpoint (2026-09-04)

- Approved command ran once with Node `20.20.2`, explicit `--env-file=.env`, `NODE_ENV=production`, and `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`.
- Result: `SCOPED_BACKUP_BLOCK_NO_RETRY` before the first database query; `productionWrites=0`.
- Stop reason: locked evidence expected `src/scripts/seed-content.ts` SHA-256 `fea5156216f34b6a8aa25fd53bd0b1eb9c6613d32103edeace38554cd52377e3`, while the current file is `7638014836a6432408c73e05ea63c8689e4f7eea46b2ada59b2fadcf8e5fb9b6`. This is a code/evidence drift gate, not a Production data finding.
- Evidence: [phase-21-backup-block-2026-09-04T14-33-55-211Z.json](./phase-21-backup-block-2026-09-04T14-33-55-211Z.json)
- Per approval, no retry was attempted and no cleanup, DROP/DELETE, content/media/schema write, merge, or Issue closeout was performed.

## 現況與下一步

目前只有本地 static consumer evidence 與 readiness plan；沒有 Production cleanup migration、DROP／DELETE SQL、backup、觀察期或 destructive approval。C0 曾在本地 checksum gate 停止；下一步先完成獨立 C0 executor 與離線驗證，再提出精確命令供新的單次執行批准。#101 維持 **BLOCKED／未執行 cleanup**。

## 2026-09-05 本地診斷與 executor 修正方向

### 已確認原因

`git show f592e7d:src/scripts/seed-content.ts | shasum -a 256` 精確得到原鎖定值 `fea5156216f34b6a8aa25fd53bd0b1eb9c6613d32103edeace38554cd52377e3`。目前 HEAD `e27691b` 的檔案則為 `7638014836a6432408c73e05ea63c8689e4f7eea46b2ada59b2fadcf8e5fb9b6`；該檔案沒有 working-tree 修改。Git history 顯示 `77472a8` 與 `70961a8` 加入 canonical source metadata、altText、航班資料與輸入驗證。這解釋了 checksum 差異來源，不能據此宣告 Production 資料一致。

前次選用 `phase21-scoped-backup-readonly.ts` 不適合直接作為 C0：它讀取 185 項 content apply 的 frozen plan，呼叫 `verifyFrozenPlan`，並以舊 `phase-21-field-side-effects-readonly.json` 比較版本數。C0 要建立發布後 inventory；Hainan id=19 已有另行接受的發布決策，舊版本數不能直接成為本次期望值。單純替換 checksum 會掩蓋 executor 用途不合的問題。保留舊 runner、frozen evidence 與 block checkpoint，不改寫歷史。

### 獨立 C0 executor 必須滿足的契約（待實作／未執行）

1. 先取得 PR #103 merge object 並比對相關 consumer／schema 與 executor；目前本機尚無 `6d45b6d` object，不能宣稱已驗證 merged tree。固定新的 code manifest，不使用 185 項 apply plan。
2. 以三筆正式 Memory slug 查得唯一 parent，再由 parent 關係取得 Day；不把舊 17 Days 數量當作 fresh inventory 結果。排除 `202702-thailand-phuket`。
3. 單連線、唯讀交易、15 秒 statement timeout；每批有明確 row／byte 上限及總查詢／時間上限，溢出即停止。明確載入環境，確認 schema push=false；不初始化 Payload 或執行 seed。
4. 逐項輸出 legacy array identity → canonical Day/Moment/Placement destination。日期或順序不得當作模糊替代 identity；missing、ambiguous、duplicate 分別列出。inventory 完成與 mapping 可 cutover 分開判定，存在未映射資料即不具 cleanup readiness。
5. 記錄 parent／locale／version／child／相關 Media 的 scoped counts、FK、RLS、grants 與 migration history；version 狀態作本次觀測，與使用者已接受發布決策比對。既有合法 draft 不得自動發布。
6. 在本次 before／after 比較 drift。私有證據使用獨立 C0 路徑、0700／0600、exclusive create；公開報告只含必要計數、hash、checkpoint，不包含正文或 credentials。
7. 離線驗證 SQL 唯讀限制、scope 排除、missing／duplicate mapping、response cap、timeout 與不可覆寫證據；通過後鎖定 executor／SQL／code manifest checksum，列出精確命令再取得新的單次 Production 執行批准。前次 no-retry 決策保持有效。

### Consumer 分類更正

`src/lib/data/travel.ts` 的 `getTravelMemoryReadContext` 明確 select canonical Overview 欄位，僅 Photos 額外選取 `galleryImages`；未選取 `dailyHighlights`／`itineraryImages`。剩餘 legacy seam 是 `src/lib/travel-runtime.ts` 的 Memory adapter，以及 `src/features/travel/travel-detail-page.tsx` 對 `dailyItinerary` 的顯示，還有 seed projection。後續需追查舊 detail route／rollout gate 是否實際到達，不能以欄位名稱出現在同一檔案或 types 中就判定 canonical renderer 仍讀取。

### 2026-09-05 merge 與 route evidence 補充

- 已成功 `git fetch origin main`。`origin/main` 為 PR #103 merge `6d45b6d`；`git diff HEAD origin/main` 無差異。因此現行 tracked tree 與 merge tree 一致；上述「本機尚無 merge object」已解除。這不證明 Production deployment 使用相同 commit。
- `src/app/(app)/travel/[slug]/page.tsx` 的 metadata 與 page 都先呼叫 `getTravelProjectBySlug`；後者查詢 Memory 時沒有縮小 select，並呼叫 legacy adapter。即使多頁 gate 開啟，adapter 仍會投影 legacy arrays。
- 同一 route 只有在 `project.kind === 'memory'`、多頁 gate 開啟且 `memory?.days.length` 非零時使用 canonical Overview。否則進入 `TravelDetailPage`，其 completed view 讀取 `dailyItinerary`。因此需包含「沒有可讀 Daily」情境；不可假定三筆 Memory 都已有 Daily。
- `getFeaturedTravelProjects` 與 `getTravelRecordByRelationship` 亦經 adapter；零 legacy 讀取驗證須涵蓋首頁 featured、travel index、metadata 與 detail fallback。
- 已建立 [itinerary mapping 查詢草案](./phase-21-c0-itinerary-mapping.sql)，逐筆以同一 Memory 與精確 media id 計數候選 Placement，使用 relation id keyset、每頁 101 列（100＋下一頁哨兵）。SQL 欄位已對照 Phase 17／19 migration；尚未經 PostgreSQL rehearsal，未在 Production 執行。候選數不證明 caption／順序／發布內容等價；executor 與完整 destination read-back 仍待完成。

## 2026-09-06 content parity read-back

C0 inventory、104 筆 itinerary candidate identity 及 25 組 Day content read 已完成唯讀 PASS；Production writes 為 0。完整結果見 `phase-21-content-parity-result-2026-09-06.md`。

結果不能支持直接 cleanup：legacy 的 223 個 segments 沒有完整 tuple 可證明與 canonical Moment 等價；英文主要依賴 `zh-TW` fallback；Australia day-01～03 有 4 個中文欄位不同及 4 個英文 legacy-only 欄位。下一 gate 是 Human Owner 選擇 canonical-authoritative cutover 或 preserve-legacy migration。未決策前不得進入 C1 或 cleanup。

### A 決策與 C1 本地狀態

Human Owner 已選擇 canonical-authoritative cutover。C1 本地實作與驗證已完成：runtime query／adapter／completed fallback 與 Memory parent seed target 不再消費或產生 `dailyHighlights`、`itineraryImages`；canonical child projection 保留。完整證據見 `phase-21-101-c1-local-cutover-2026-09-06.md`。

狀態更新為 **C1 LOCALLY VERIFIED／C2 NOT STARTED／cleanup 未批准**。下一步必須先 scoped review，再另行批准 push／Preview GET-only QA 與零 legacy-read 觀察；不得直接執行 cleanup。
