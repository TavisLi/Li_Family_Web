# Phase 21 Production Read-only Inventory

- 執行日期：2026-09-01
- 命令：`pnpm run travel:phase-21:inventory`
- 模式：`read-only`
- `PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=false`
- Target fingerprint：host SHA-256 prefix `3ad9f1768815`、database `postgres`
- Production mutation：0

## 結果

| Slug | Status | Days | Moments | Placements | Photo | YouTube | Missing momentKey | Missing placementKey | Captions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `201307-hainan` | published | 8 | 94 | 11 | 11 | 0 | 0 | 0 | 11 |
| `202308-east-australia` | published | 9 | 103 | 87 | 81 | 6 | 0 | 0 | 62 |
| `202702-thailand-phuket` | **MISSING** | — | — | — | — | — | — | — | — |

Parent inventory：

| Slug | Guests | Gallery | Itinerary | Flights | Lodgings | Daily highlights | Stories | Reminders |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `201307-hainan` | 1 | 346 | 11 | 2 | 4 | 8 | 31 | 1 |
| `202308-east-australia` | 0 | 83 | 51 | 4 | 3 | 9 | 28 | 1 |

兩筆既有 Memory 的 `participants`、global `externalVideos`、media `relatedTravelRecord` 與 `relatedMembers` link counts 均為 0。

## 判定

- Production 既有海南／澳洲 Day → Moment → Placement stable identities 可供後續 migration rehearsal/read-back 基線使用。
- Production inventory 與「三筆 Travel Memory」的實作假設不一致：Phuket parent record 不存在。
- 在取得 Phuket create/content-write 明確批准前，不得把後續 dry-run 的 missing parent 當作可自動修復項目。
- 此 inventory 不批准 migration、content/media write 或 #101 destructive cleanup。
