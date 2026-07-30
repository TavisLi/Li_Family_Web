---
status: accepted
date: 2026-07-29
last-reviewed: 2026-07-29
related:
  - "Issue #50"
  - "Issue #57"
  - "docs/phase-artifacts/phase-17/travel-legacy-cleanup-approval-package.md"
supersedes: "ADR-0007 的 Phase 17 cleanup 備份前置條件；其餘決策維持有效"
---

# Phase 17 cleanup 允許一次性 no-backup waiver

## 決策

Phase 17 的 legacy `travel_projects` destructive cleanup 原則上仍須有可復原的 Production backup。2026-07-29 唯讀盤點確認目前 Supabase Free 方案沒有 Scheduled Backup 或 PITR；網站擁有者明確批准不備份繼續，並接受五筆 legacy records、33 張 legacy tables 與舊 relationships 刪除後無法回復。

因此只針對 Phase 17 這一次 cleanup，verified backup 可以由 explicit no-backup waiver 取代。waiver 必須包含完整 ISO-8601 接受時間與精確確認字串，並納入 approval token；不得同時提供 backup metadata。這項例外不放寬 deployment SHA、database fingerprint、records、relationships、schema inventory、migration history、transaction recheck、read-back 或獨立 Production apply approval。

## 後果

- 若使用 waiver，deployment 可以回退，但被刪除的 legacy schema／records／relationships 沒有資料復原路徑。
- `travel_plans` 2 筆、`travel_memories` 3 筆、`travel_route_identities` 5 筆與新 polymorphic relationships 仍須在 transaction 前後完整驗證。
- 一般 destructive migration 與未來 Phase 仍預設要求 verified backup；不得引用本 ADR 自動繞過備份。
- Production apply 必須使用包含本 ADR executor 防線的已審查、已部署 commit，且本地 checkout SHA 必須與 deployment SHA 完全一致。

## 實施狀態

- Supabase backup／PITR 唯讀盤點完成；沒有執行 upgrade、restore、建立 project 或產生費用。
- 網站擁有者已在目前 Phase 17 對話明確批准 no-backup cleanup 方向。
- no-backup executor 尚待 PR、merge、Production deployment、當次 inspect token 與 destructive apply。

## 曾考慮的方案

- **升級 Supabase 取得 Scheduled Backup／PITR**：未採用；會變更方案並可能產生費用，未獲批准。
- **先匯出手動 logical backup**：未採用；網站擁有者明確選擇不備份繼續。
- **永久保留 legacy schema**：未採用；無法完成 Issue #50／#57 的 schema cleanup 目標。
