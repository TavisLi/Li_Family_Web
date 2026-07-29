# Phase 17 Completion Report — Travel Plan／Memory Split

報告日期：2026-07-24
主要交付日期：2026-07-15–2026-07-19
最終狀態：Merged；Production verification partial；metadata／read-back blockers 與 legacy cleanup remain open

## 1. Phase Scope

Phase 17 承接 Issue #50／#57 的安全重構部分：

- 解決五筆 travel reconciliation conflicts。
- 將 Travel Plan 與 Travel Memory 拆成獨立 collections。
- 建立跨 collection route identity。
- 準備並執行受控 Production additive migrations。
- Copy 五筆 legacy travel records 與 shadow relationships。
- 加入 RLS／grants security migration。
- 將 data layer、renderer、interactions 與 seed workflow cut over 至 split collections。
- 保留 legacy tables／relationships 作 rollback evidence。

Out of scope：

- Drop legacy `travel-projects` tables／columns。
- 刪除 legacy relationships／records。
- 未經批准的 destructive cleanup。

## 2. Branch／Commit／PR

- Branch：`codex/phase-17-travel-conflict-resolution`
- Preparation PR：[#58](https://github.com/TavisLi/Li_Family_Web/pull/58)
- Implementation PR：[#59](https://github.com/TavisLi/Li_Family_Web/pull/59)
- Merge commit：`9c15df3a3db6bfffd2037674bda10cc87f6c3c0e`
- Related Issues：[#50](https://github.com/TavisLi/Li_Family_Web/issues/50)、[#57](https://github.com/TavisLi/Li_Family_Web/issues/57)

## 3. Delivered Work

### Domain and schema

- `travel-plans`
- `travel-memories`
- `travel-route-identities`
- Optional `originPlan`
- Polymorphic shadow relationships for Media、TimelineEvents、HomeConfig
- Generated runtime union projection

### Reconciliation and seed

- Array-level identities for flights、daily itinerary、source sections、lodgings。
- Conflict register decisions including payload-wins／manual merge。
- Travel seed 依 catalog status 導向 Plan／Memory。
- Default travel workflow 不再建立或更新 legacy `travel-projects`。

### Controlled Production work

- 五份 additive migrations。
- 5-record transactional copy。
- Route identity／relationship copy。
- 70 張相關 tables RLS enable。
- 撤銷 anon／authenticated table privileges。
- Owner read-back 與 migration record verification。

### Runtime

- `/travel` 聚合 Active Plans、Travel Memories、Archived Plans。
- `/travel/[slug]` 透過 route identity 解析。
- 修正 detail navigation pool exhaustion。
- 修正 corridor category navigation。

## 4. Key Files

- `src/payload/collections/TravelPlans.ts`
- `src/payload/collections/TravelMemories.ts`
- `src/payload/collections/TravelRouteIdentities.ts`
- `src/lib/travel-domain.ts`
- `src/lib/travel-runtime.ts`
- `src/lib/data/travel.ts`
- `src/scripts/travel-seed-reconciliation.ts`
- `src/scripts/travel-controlled-migration-cli.ts`
- `src/scripts/travel-data-api-security-cli.ts`
- `src/scripts/travel-legacy-cleanup-cli.ts`
- `docs/adr/0007-travel-plans-and-memories-are-separate-records.md`
- `docs/phase-artifacts/phase-17/`

## 5. Validation

PR #59 記錄以下 Node `20.20.2` 驗證通過：

- `pnpm run test:phase-17`
- `pnpm run test:phase-16`
- `pnpm run test:phase-9`
- `pnpm tsc --noEmit`
- `pnpm run build`
- Local PostgreSQL rehearsal
- Partial-schema negative rehearsal
- Final standards／spec review：0 findings、0 blockers
- 本機 Chrome：travel lobby、分類、五筆旅行卡片與 detail routes

## 6. Production Verification

- PR #59 已於 2026-07-19 merge。
- Vercel Production 已部署 merge commit `9c15df3`，之後 Production 進一步部署 `main@1358d4d`。
- 2026-07-23 重新驗證 `https://li-family-web.vercel.app/travel` 回應 `200`。
- Rendered HTML 已包含「規劃中／旅行回憶／過往規劃」，證明 split runtime 已在 Production 使用。
- Header 已包含 Phase 17 後加入的 crest asset。

目前 Production metadata evidence 顯示 `/travel` canonical／Open Graph 仍指向 `http://localhost:3000`。這是環境／metadata hotfix，不代表 split runtime 回退；需另案修復並驗證。

## 7. Migration／Data

- Production controlled migrations：完成。
- Legacy inventory／baseline hash／migration hash guard：完成。
- Five-record copy：完成。
- Shadow relationship copy：完成。
- RLS／grants security：完成。
- Owner read-back：完成。
- Legacy cleanup：未執行、未批准。

一次後續 `seed:travel:read-back` 曾回報 `TRAVEL_READBACK_TIMEOUT`；該失敗不得被舊 baseline 冒充為新的成功 read-back。PR closeout 的 Production owner read-back 與正式 route evidence分別保留其適用範圍。

## 8. Security／Privacy

- 新 travel tables 與 relationship tables 已加入 RLS／grants protection。
- Public route 只顯示被允許公開的 Plan／Memory。
- Runtime cutover 不以 client-side hiding 取代 server/data-layer filtering。

## 9. Known Limitations／Open Work

- Issues #50／#57 保持 open。
- Legacy tables、records、relationships 與 migration history 仍保留。
- Destructive cleanup 只能在 backup、deployment verification、inventory、relationship mapping、observation window 與新批准完成後執行。
- `BLOCKER-P17-METADATA`：正式站 canonical／Open Graph URL 仍需 hotfix、Production HTML 驗證及 follow-up Issue；在該 blocker 解決或由已批准 Issue 明確接管前，Phase 17 不得標記 `Production verified`／`Closed`。
- 後續 `seed:travel:read-back` timeout 需依當次 query scope 重驗；不得用舊 baseline 取代新 read-back evidence。

## 10. Rollback

- Code：可回復至最近健康的 Vercel Production deployment。
- Data：legacy records／relationships 仍保留，可作 cutover rollback evidence。
- Vercel rollback 不會回復 database mutation；必須依 migration／copy evidence 獨立處理。

## 11. Issue Closeout

- PR #59 已 merge，但未使用 `Closes #50`／`Closes #57`。
- #50／#57 只有在 observation 與另案批准的 legacy cleanup 完成或明確重新定義 acceptance criteria 後才能關閉。

## 12. Final State

| State | Result |
| --- | --- |
| Implemented | Yes |
| Locally verified | Yes |
| PR ready | Yes |
| Merged | Yes，PR #59 |
| Production verified | Partial：split runtime route 已驗證；`BLOCKER-P17-METADATA` 與適用 read-back 尚未完成 |
| Closed | No：implementation 已 merge，但 Phase closeout 尚未通過；#50／#57 與 metadata blocker remain open |

## 13. Closeout Addendum（2026-07-28）

本段記錄原報告之後的狀態，不改寫 2026-07-24 當時的歷史結論。

- `BLOCKER-P17-METADATA` 已解決：PR #64 將 metadata fallback 改為正式網域，PR #65 補上 travel detail `og:url`。
- 最新 `main@edc9bf5` 已由 Vercel 部署至 Production，狀態為 `READY`。
- 正式 `/travel` rendered HTML 包含「規劃中／旅行回憶／過往規劃」，canonical 為 `https://li-family-web.vercel.app/travel`，未出現 `http://localhost:3000`。
- Controlled legacy cleanup 已移植到最新 `main` 的 `codex/phase-17-closeout`，並改為要求部署 SHA 與本地 cleanup checkout SHA 完全一致。
- Node `20.20.2` 下已通過 Payload types generation、seed／Phase 9／Phase 16／Phase 17 tests、build、build 後 TypeScript 與 diff check。
- 因治理文件已改用現行 Travel Plans／Travel Memories 標題格式，本次同步修正 catalog parser 與 regression expectations，避免治理文件更新後 travel seed 無法讀取。
- Production H4 唯讀盤點已於 2026-07-28 執行：核心 records 仍為 5／2／3／5、legacy schema 仍為 33 tables／4 columns；但 Media 為 legacy 22／shadow 21，`202702-thailand-phuket-gallery-001.webp` 缺少一筆 Plan shadow relationship。
- H4 沒有執行任何寫入或刪除。經另案 H6 批准後，已在單一 transaction 只新增 `media_rels.id=79`，獨立唯讀 read-back 為 Media 22／22、invalid mappings 0，其他 Travel／Timeline／Home counts 未改變。
- Cleanup code deployment、backup verification、cleanup apply 與 H5／H8 批准仍未完成。

目前結論：

| State | Result |
| --- | --- |
| Production runtime／metadata | Verified |
| Production data read-back | H4／H6 完成；Media 22／22、invalid mappings 0 |
| Legacy cleanup | 待 cleanup deployment、backup verification 與 H5／H8 |
| Closed | No；#50／#57 尚未 close |

## 14. Closeout Addendum（2026-07-29）

- PR #66 已合併至 `main@f98576c`，原 controlled cleanup code 已完成 Production runtime deployment。
- Supabase Production Dashboard 唯讀盤點確認 Free 方案沒有 Scheduled Backup 或 PITR。網站擁有者明確選擇不備份繼續並接受 legacy schema／records 無法復原；此為一次性 operational waiver。
- cleanup 前 visibility 稽核發現三筆 `travel_memories` 中兩筆仍為 draft；登入管理員可見三筆，但匿名正式頁只顯示一筆，因此 cleanup 立即停止。
- 經另案批准，只將 `201307-hainan`、`202308-east-australia` 的 `_status` 從 `draft` 改為 `published`。獨立 read-back 確認三筆 Memory 均為 public published；匿名 `/travel` HTML 可見三筆 routes。
- 修復後核心 inventory 維持 5／2／3／5、Media 22／22、TimelineEvents 2／2、HomeConfig 1／1；batch 8 cleanup 尚未執行。
- 本地新增 no-backup waiver 防線：verified backup 與 explicit waiver 必須二選一；錯誤 waiver、同時提供兩種 recovery mode、deployment SHA／inventory／relationship 漂移仍會拒絕。

目前結論：

| State | Result |
| --- | --- |
| Production runtime／metadata | Verified |
| Travel Memory public visibility | Verified：匿名頁 3／3 |
| Legacy cleanup | no-backup waiver code 待 PR／merge／deployment，之後才可 inspect／apply |
| Closed | No；batch 8 與 Issue #50／#57 closeout 尚未完成 |
