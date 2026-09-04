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
| `202602-thailand-phuket` | published | 8 | 42 | 52 | 42 | 10 | 0 | 0 | 52 |

Parent inventory：

| Slug | Guests | Gallery | Itinerary | Flights | Lodgings | Daily highlights | Stories | Reminders |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `201307-hainan` | 1 | 346 | 11 | 2 | 4 | 8 | 31 | 1 |
| `202308-east-australia` | 0 | 83 | 51 | 4 | 3 | 9 | 28 | 1 |
| `202602-thailand-phuket` | 0 | 191 | 42 | 8 | 4 | 8 | 16 | 1 |

三筆既有 Memory 的 `participants`、media `relatedTravelRecord` 與 `relatedMembers` link counts 均為 0。Phuket 有 10 筆 global `externalVideos`；海南／澳洲為 0。

Planning inventory：

| Slug | Payload status | Planning sections |
| --- | --- | ---: |
| `202702-thailand-phuket` | published | 20 |

此處 `published` 是 Payload 文件發布狀態；collection ownership 與 source status 仍為 Travel Plan／planning，不代表旅行已完成。

## 判定

- Production 三筆既有 Memories 的 Day → Moment → Placement stable identities 均無缺漏，可供後續 migration rehearsal/read-back 基線使用。
- 前次 inventory 誤把 planning slug `202702-thailand-phuket` 當成 Memory target；該次 `MISSING` 結果已撤回，不代表 Phuket Memory 缺少。
- 正確 collection ownership：`202602-thailand-phuket` 是 Travel Memory；`202702-thailand-phuket` 是 Travel Plan。
- 修正版 read-back 顯示兩筆 record 都存在，不需要 create。
- 此 inventory 不批准 migration、content/media write 或 #101 destructive cleanup。
