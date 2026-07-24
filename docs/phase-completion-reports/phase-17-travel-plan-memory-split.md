# Phase 17 Completion Report — Travel Plan／Memory Split

報告日期：2026-07-24
主要交付日期：2026-07-15–2026-07-19
最終狀態：Production verified；legacy cleanup remains open

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
- 正式站 metadata URL 仍需 hotfix。

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
| Production verified | Yes，split runtime route；metadata hotfix outstanding |
| Closed | Phase 17 implementation closed；legacy cleanup Issues remain open |
