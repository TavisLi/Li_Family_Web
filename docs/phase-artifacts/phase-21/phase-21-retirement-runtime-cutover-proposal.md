# Phase 21 Travel Memory retirement runtime cutover 提案

日期：2026-09-04

狀態：`PROPOSED_AWAITING_HUMAN_CONFIRMATION`

Issue：#101；依賴 #94–#100 的新 Preview 驗收。

## 目前阻擋事實

- #96 欄位契約只有 `travel-memories.dailyHighlights` 與 `travel-memories.itineraryImages` 是 `DELETE-CANDIDATE`。
- `dailyHighlights` 仍由 `src/lib/travel-runtime.ts` 投影成 legacy completed renderer 的 `dailyItinerary`；`itineraryImages` 仍被 runtime projection 與 seed parent projection讀／寫。
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED=false` 時，`/travel/[slug]` 仍使用 legacy completed renderer；若只移除欄位讀取，舊模式會靜默失去每日內容。
- `galleryImages` 仍是 unclassified archive photo 的 canonical owner；`externalVideos`、`reminders` 是 KEEP；Media discovery relationships 只有 DEPRECATE。它們不屬於本次兩欄位 cutover。

## 建議的最小介面決策

在 PR #103 新 head 的三筆正式 Memory Preview 驗收通過後：

1. completed Travel Memory 的 Overview／Day／Photos 永遠使用 vNext canonical routes 與 view models，不再以 rollout flag 回到 legacy completed renderer；Travel Plan route與 planning renderer完全不變。
2. 即使一筆 Memory 暫時沒有 published Days，Overview 仍自然呈現 parent facts／stories，並顯示沒有日期章節的空狀態；不得回讀 `dailyHighlights` 補畫面。
3. `TravelRuntimeRecord` 不再暴露或讀取 `dailyHighlights`／`itineraryImages`；Memory index、首頁卡片與 metadata 只取實際使用的 title、slug、access、dates、summary、cover 等欄位。
4. travel-only seed／dry-run 不再把 `dailyHighlights`／`itineraryImages` 放進新的 Source projection；現存欄位值仍保留，任何普通 seed update 都不得以 `undefined`／空陣列清除它們。
5. 這一階段只完成 runtime／seed cutover 與 tests；不修改 Payload Collection、generated types、migration 或 Production data。觀察期、inventory、backup、精確 destructive migration 與 Human approval 仍是後續獨立 gate。

## 不採用的替代方案

- **保留 rollout flag，但停止欄位讀取**：legacy completed renderer 會失去每日內容，呈現契約倒退。
- **把 canonical Days 再轉回 legacy `dailyItinerary`**：新增第二個 Daily view model與轉接規則，違反三套 renderer 共用 canonical model的方向。
- **現在直接移除 schema／資料**：尚無新 head Preview、觀察期與 destructive approval，不符合 #101 stop conditions。

## 待 Human 確認的 TDD 行為

依序一項一個 RED → GREEN：

1. completed Memory 即使 Days 為空，route仍選擇 vNext Overview，不回到 legacy completed renderer；Plan行為不變。
2. runtime Memory projection不含 `dailyItinerary`／`itineraryImages`，首頁與索引的既有欄位仍完整。
3. Memory seed target不再管理兩個 candidate fields；帶有 legacy Current／Base值的 safe dry-run保持 preserve／skip，不產生清空 patch。
4. 靜態 consumer contract只允許兩欄位出現在 Collection／generated types／migration／inventory／retirement evidence，不允許 runtime或default seed writer讀寫。
5. focused tests、完整 Phase 21、build、build後TypeScript、diff check及三筆正式 Preview Browser QA全部通過，才把 runtime cutover標為可觀察；仍不等於批准 cleanup。

## 需要的下一項外部 gate

先 push 現有五個本地 commits至 Draft PR #103，完成新 Vercel Preview 的 GET-only 真實資料驗收。若新 Preview未通過 #94–#100，立即停止本 cutover，不以刪除 legacy fallback掩蓋新 renderer缺陷。
