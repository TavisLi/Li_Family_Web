# Phase 21 Production Migration Evidence

日期：2026-09-02
狀態：**PASS — ADDITIVE SCHEMA APPLIED, CONTENT UNCHANGED**

## Execution identity

- Branch：`codex/phase-21-travel-memory-vnext`
- HEAD：`5eada259953abdf82721bd2912d254b160b7c08c`
- Runtime：Node `20.20.2`、Payload `3.85.1`
- Environment：Production database fingerprint `3ad9f1768815/postgres`
- Schema push：`PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`
- Approval：`phase-21-explicit-env-production-migration-approval-package.md`

## Applied migrations

| Migration | Batch | Result |
| --- | ---: | --- |
| `20260629_144118_add_travel_source_section_media` | 11 | PASS；no-op，history metadata only |
| `20260831_120000_phase_21_travel_memory_contract` | 11 | PASS；2 enums + 4 nullable columns |

既有 `dev`／`batch = -1` record 保持不變。

## Schema read-back

- `travel_memories_story_sections.role`：nullable enum，default `NULL`；
- `_travel_memories_v_version_story_sections.role`：nullable enum，default `NULL`；
- `travel_memory_days_moments_locales.transport`：nullable `varchar`，default `NULL`；
- `_travel_memory_days_v_version_moments_locales.transport`：nullable `varchar`，default `NULL`；
- 兩個 role enums 各有 5 個 approved labels，共 10 labels；
- 四個新欄位 non-null counts 均為 0。

## Data and access read-back

| Table | Before | After |
| --- | ---: | ---: |
| `travel_memories_story_sections` | 75 | 75 |
| `_travel_memories_v_version_story_sections` | 409 | 409 |
| `travel_memory_days_moments_locales` | 239 | 239 |
| `_travel_memory_days_v_version_moments_locales` | 461 | 461 |

- 四張 tables 的 RLS：enabled before／after；
- `anon`／`authenticated` direct grants：0 before／after；
- content／media write：0；
- cleanup／rollback／merge／Production deployment：未執行。

## Final verification

- Immediate schema／history／row-count／NULL／RLS／grant read-back：PASS；
- final explicit-env `migrate:status`：兩筆均 batch 11、Ran `Yes`；
- Supabase target-table advisors：只有 INFO，沒有 target-table ERROR；沒有執行任何 advisor remediation。

本證據只證明 Production additive schema migration 完成；不代表 Preview Browser QA、content backfill、PR merge、Production deployment、#101 cleanup 或 Phase 21 closeout 已完成。
