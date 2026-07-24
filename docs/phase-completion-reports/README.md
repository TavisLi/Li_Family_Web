# Web Li Phase Delivery Index

本目錄保存每個 Phase 的交付證據。Completion Report 記錄當時事實，不因後續 merge／deploy 而重寫原始描述；最終狀態以本索引與報告內的 closeout addendum 為準。

狀態定義見 [`../phase-execution-playbook.md`](../phase-execution-playbook.md)。

## Phase 1–17

| Phase | 主題 | 最終交付狀態 | 報告 |
| --- | --- | --- | --- |
| 1 | Next.js 15／Payload v3 foundation | Merged；歷史交付 | [`phase-01-foundation.md`](./phase-01-foundation.md) |
| 2 | Content seeding pipeline | Merged；歷史交付 | [`phase-02-content-seeding-pipeline.md`](./phase-02-content-seeding-pipeline.md) |
| 3 | Home and member pages | Merged；歷史報告保留早期 closeout wording | [`phase-03-home-member-pages.md`](./phase-03-home-member-pages.md) |
| 4 | Travel interaction system | Merged | [`phase-04-travel-interaction-system.md`](./phase-04-travel-interaction-system.md) |
| 4.1 | Travel content-source readiness | 隨 Phase 7 PR 合併的 cross-phase hardening | [`phase-04-1-travel-content-source-readiness.md`](./phase-04-1-travel-content-source-readiness.md) |
| 5 | Premium family blog | Merged | [`phase-05-premium-family-blog.md`](./phase-05-premium-family-blog.md) |
| 6 | Family access gate | Merged | [`phase-06-family-access-gate.md`](./phase-06-family-access-gate.md) |
| 7 | Timeline／Bucket List／Wrapped | Merged | [`phase-07-time-capsule-bucket-wrapped.md`](./phase-07-time-capsule-bucket-wrapped.md) |
| 8 | Production hardening | Merged、Production verified | [`phase-08-production-hardening.md`](./phase-08-production-hardening.md) |
| 9 | Content alignment and v1 launch | Merged、Production verified | [`phase-09-content-alignment-v1-launch.md`](./phase-09-content-alignment-v1-launch.md) |
| 10 | Admin and family accounts | Merged；PR #30 | [`phase-10-admin-family-accounts.md`](./phase-10-admin-family-accounts.md) |
| 11 | Travel v1.1 planning content | Merged、Production seed／smoke verified | [`phase-11-travel-v1-1-planning-content.md`](./phase-11-travel-v1-1-planning-content.md) |
| 12 | Member profile repair | Merged；PR #33–35 | [`phase-12-v1-2-member-profile-repair.md`](./phase-12-v1-2-member-profile-repair.md) |
| 13 | Travel media and catalog | Merged；PR #39 | [`phase-13-v1-3-travel-media-catalog-beautification.md`](./phase-13-v1-3-travel-media-catalog-beautification.md) |
| 14 | Media and travel polish | Merged；PR #43–46 | [`phase-14-v1-4-media-travel-polish.md`](./phase-14-v1-4-media-travel-polish.md) |
| 15 | Travel planning layout | Merged；PR #51 | [`phase-15-v1-5-travel-planning-layout.md`](./phase-15-v1-5-travel-planning-layout.md) |
| 16 | Travel seed reconciliation | Merged、Production baseline／read-back | [`phase-16-travel-seed-reconciliation.md`](./phase-16-travel-seed-reconciliation.md) |
| 17 | Travel Plan／Memory split | Merged、Production verification partial；metadata blocker 與 legacy cleanup remains open | [`phase-17-travel-plan-memory-split.md`](./phase-17-travel-plan-memory-split.md) |

## 閱讀規則

- Phase 報告不是現行架構 source of truth。
- 現行產品詞彙讀 `CONTEXT.md`。
- 現行架構讀 `docs/全栈系统需求与技术架构说明书.md` 與 ADR。
- 未完成項目必須對應 Issue／blocker，不得只留在「下一步」文字。
- Phase 4.1 是延伸 hardening，不增加 Phase 1–17 的編號計數。
