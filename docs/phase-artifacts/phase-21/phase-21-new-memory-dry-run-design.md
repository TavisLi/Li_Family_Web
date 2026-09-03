# 新 Travel Memory 首次 dry-run 報告修正方案

日期：2026-09-03；2026-09-04 更新。狀態：`LOCAL_REPORT_CONTRACT_IMPLEMENTED_VERIFIED`。Human 已確認報告契約；dry-run 報告層與 tests 已修改，write executor 未改。

## 已重現的四個情境

證據：`phase-21-new-memory-dry-run-before.json`。真實 `buildPayloadDryRun`、假的 DB catalog／find 回應；沒有 DB 連線、Payload init 或寫入。

| 情境 | 實際報告 | 判斷 |
| --- | --- | --- |
| 新 parent、media 已存在 | parent create 1，Daily 0 | 漏報兩個 Day |
| 新 parent、新 media | parent＋media create 2，Daily 0 | 漏報兩個 Day及其依賴 |
| 既有 parent、新 media | Day create 2＋media create 1＋media relationship conflict 1，parent preserve | 區分尚待建立的 media 和真正缺來源，不能直接消除原 conflict safeguard |
| Plan 已佔相同 slug | parent collection conflict，Daily 0 | 保留正確的跨 collection 衝突保護 |

## 根因與修正 seam

`buildPhase19TravelMemoryBackfillPlan` 用於實際寫入準備，必須有真實 parent／media IDs；missing parent 時不 materialize Day 是正確的寫入保護。問題是 `buildPayloadDryRun` 把同一結果直接當成完整首次匯入報告，沒有呈現 `missingMemories` 或依賴。

實際 travel-only executor 的順序是 media → parent → Days，因此 dry-run 必須列出完整預期工作，但不能假裝已有 DB IDs，或把報告資料直接轉成寫入 payload。

## Human 已確認並實作的最小報告契約

- 只修改 `buildPayloadDryRun` 的報告層與 tests／clean-room check；不修改實際 seed executor 或 materializer 的 missing-ID gate。
- 尚無 parent ID 的 Day 使用 `Memory slug:dayKey` 作報告 key，不是 persisted `dayIdentity`。
- 沿用 create／preserve／conflict／skip／update action；加 optional `dependsOn`，以 collection＋key 明示 parent／media 必須先成功建立。不得用0、負數或其他假 ID 產生可寫入 payload。
- 只對未發現同 slug Plan collision、確實將 create 的 parent列出預計 Day create；有跨 collection conflict 不能出現無條件成功的 Day 計畫。
- Manifest／Source 無效、unmatched／duplicate placement 與真正缺少 media source，繼續明列 conflict；DB 尚缺但本次 Source 明確會建立的 media，與上述錯誤分開表達。
- 既有 parent／media 都存在時維持舊 key／reconciliation 行為與輸出；不以報告修復批准任何 Production apply。

## 逐項 TDD 驗收

1. 新 parent＋既有 media：報告 parent與全部Days，Day有parent依賴且無existingId。
2. 新 parent＋新 media：報告完整create總數，photo所屬Day另有media依賴；不捏造DB ID。
3. 既有 parent：保留真實Day identity、Base／Source／Current conflict與preserve規則。
4. 缺來源／duplicate／unmatched：仍為conflict，不因加入依賴而吞掉。
5. Plan／Memory slug collision：保持parent conflict，不列無條件child create。
6. sampled CLI actions仍顯示依賴；clean-room由首次dry-run直接驗證兩個預計Day。

完成後執行focused tests、Phase21 suite、隔離build、build後TypeScript與diff check。Production／schema／content／media／push／deploy／merge／cleanup均不在此本地修正範圍。

## 實作結果

- `DryRunAction` 增加 optional `dependsOn`，只包含 `collection` 與 stable key；不保存不存在的 DB ID，也不被 write executor 消費。
- 新 parent 的 Daily report key 為 `slug:dayKey`。parent／media 已存在後，仍使用真實 `parentId:dayKey`。
- Source 內存在、DB 尚未建立的 media 轉成依賴；其 placement 所屬 Day 列 create／update，不再產生假的 missing-media conflict。unmatched 或 duplicate placement 仍分別保留 conflict。
- Plan／Memory slug collision 時不列 child create；原 identity-publication conflict 保留。
- `phase19-travel-memory-backfill` 和 `seed.ts` 寫入流程沒有修改；missing-ID fail-closed 邏輯不放寬。

`phase21-clean-room-check.tsx` 現驗證新 parent＋既有media、新parent＋新media、既有parent＋既有／新media、跨collection collision、unmatched及duplicate。首次新parent＋新media summary為4 creates（parent、media、2Days）、0 conflicts；所有依賴無existingId。輸出更新於 `phase-21-clean-room-projection.json`。

驗證：`test:clean-room`與完整`test:phase-21` PASS；isolated build及build後`tsc --noEmit` PASS；`git diff --check` PASS。Build使用localhost:1 synthetic DB、synthetic secret、空R2 credentials、`.invalid`媒體URL與schema push=false。

本地 Browser QA 曾準備啟動，但Codex平台因使用額度限制拒絕整組tool action；沒有server／browser process被建立，也未繞過。故本文件只解除dry-run報告缺口，不解除Browser、real Payload persistence／access、Preview或Production gate。
