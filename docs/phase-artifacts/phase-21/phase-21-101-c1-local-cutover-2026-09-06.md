# Phase 21 #101 C1 Local Consumer Cutover

狀態：**LOCALLY VERIFIED／未部署／未批准 cleanup**

## Human decision

2026-09-06 Human Owner 選擇 content parity package 的 **A：Canonical-authoritative cutover**：published Travel Memory Day／Moment 是唯一 runtime 內容權威；缺少 direct English locale 時允許明確使用 `zh-TW` fallback。Legacy segment wording 不再是逐字保留的 runtime contract。

## 本地改動

- `travelRuntimeMemorySelect` 成為首頁／Travel index、featured relationship、slug metadata/detail 共用的 Memory query interface。
- query interface 明確不選取 `dailyHighlights`、`itineraryImages`；仍保留 #101 scope 外的 `galleryImages`。
- runtime adapter 不再投影 `dailyItinerary`／`itineraryImages`。
- legacy completed-detail fallback 不再渲染 `dailyItinerary` Memory Journal；canonical Overview／Day／Photos data paths保持不變。
- Memory parent seed projection 不再產生 `dailyHighlights`／`itineraryImages`。
- Base／Current reconciliation projection 也忽略這兩個 legacy 欄位，避免未來 seed 把 cutover 誤解為清空 Production legacy data；實際刪除只能走獨立 cleanup migration。
- source parser 的 `dailyItinerary` 與 `travel-memory-day-projections` 保留，繼續建立 canonical Day／Moment／Placement。

## TDD 與驗證

- RED：runtime select interface 尚不存在；seed target 仍含兩個 legacy 欄位。
- GREEN：adapter／query／seed projection 完成最小 cutover。
- Focused runtime、detail、index、seed target、reconciliation、dry-run tests：PASS。
- `pnpm run test:phase-17`: PASS。
- `pnpm run test:phase-19`: PASS。
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false pnpm run test:phase-21`: PASS；clean-room `productionConnections=0`、`persistentWrites=0`。
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false pnpm run build`: PASS。
- build 後 `pnpm tsc --noEmit`: PASS。
- `git diff --check`: PASS。

第一次 build 在型別檢查發現 query select 缺 Payload 必備 `createdAt`／`updatedAt`；補入這兩個非 legacy metadata 後，第二次 build PASS。沒有用型別斷言掩蓋問題。

## 範圍邊界

- Production DB／schema／content／media writes：0。
- 未執行 seed、deploy、push、merge、cleanup、DROP／DELETE。
- 未變更 `galleryImages`、`externalVideos`、`reminders` 或 Media relationships。
- 未納入 `202702-thailand-phuket` Travel Plan 與七個未追蹤素材。

## 下一 gate

先完成本次 scoped diff review，之後才可另行批准 commit／push／Preview GET-only Browser QA。Preview 必須驗證三筆正式 Memory 的 Overview／全部 Daily／Photos，以及首頁、Travel index、metadata 和 canonical hard-cutover fallback route；query select contract、consumer search 與可用 telemetry 必須共同支持 legacy read 為 0。C2 通過前不得準備或執行 Production cleanup。
