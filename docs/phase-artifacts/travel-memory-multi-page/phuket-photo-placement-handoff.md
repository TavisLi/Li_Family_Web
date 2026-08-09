# Phuket photo placement handoff

日期：2026-08-09

## Scope

本文件記錄 `202602-thailand-phuket` Travel Memory photo placement 的 source metadata 補齊狀態。此步驟只更新 `content-source` manifest，不寫 Production database。

## 已補 source metadata

`content-source/assets/travels/202602-thailand-phuket/itinerary/` 內 8 張照片已補入 manifest：

| Source path | Day | Section | Time | Location |
| --- | ---: | --- | --- | --- |
| `day-01-splash-beach-arrival-001.jpeg` | 1 | `splash-beach-arrival` | `20:30` | `Splash Beach Resort` |
| `day-02-mai-khao-flight-viewing-001.jpeg` | 2 | `mai-khao-flight-viewing` | `14:30` | `Mai Khao Beach Flight Viewing Point` |
| `day-03-anantara-vacation-club-001.jpeg` | 3 | `anantara-vacation-club` | `10:00` | `Anantara Vacation Club` |
| `day-04-mai-khao-beach-sunset-001.jpeg` | 4 | `mai-khao-beach-sunset` | `16:30` | `Mai Khao Beach` |
| `day-05-rak-elegant-rooftop-pool-001.jpeg` | 5 | `rak-rooftop-pool` | `19:00` | `Rak Elegant Hotel Patong Rooftop Pool` |
| `day-06-patong-beach-dinner-001.jpeg` | 6 | `kans-haus-dinner` | `18:40` | `Kan's haus Cafe & Bistro` |
| `day-07-andaman-pool-villas-family-001.jpeg` | 7 | `villa-family-photo` | `17:30` | `Andaman Pool Villas, Maikhao` |
| `day-08-singapore-jewel-transfer-001.jpeg` | 8 | `singapore-jewel` | `18:00` | `Singapore Jewel Changi Airport` |

## Verification

Local source projection after this metadata update:

| Check | Result |
| --- | ---: |
| `unmatchedMedia` | 0 |
| `unassignedVideos` | 0 |
| Phuket photo placements in source projection | 42 |

Focused checks:

- `pnpm exec tsx src/scripts/seed-content.test.ts`
- `pnpm exec tsx src/scripts/travel-memory-day-projections.test.ts`
- `git diff --check`

Production read-only dry-run after this metadata update:

| Plan item | Count |
| --- | ---: |
| `skip` | 17 |
| `conflict` | 8 |
| `dayCreates` | 0 |
| `dayUpdates` | 0 |
| `styleUpdates` | 0 |
| `missingMedia` | 0 |

All 8 `202602-thailand-phuket` existing daily records remain `conflict` because Production currently has approved YouTube-only daily records while source projection now contains full text/photo moments. This is expected. Do not run source-wins or a whole-day update against Phuket.

## Production apply guidance

To add Phuket photos to Production, use a separate controlled merge that appends photo placements into existing daily records while preserving current YouTube placements. Do not use the general Phase 19 backfill planner for Phuket updates without a merge-specific approval gate.

Minimum approval package for a future write:

- list each existing Phuket day id and `dayIdentity`;
- list exact photo placements to append;
- verify no existing YouTube placement is removed;
- verify no full `moments` array replacement occurs unless explicitly approved;
- read-back Day 1–8 route HTML and confirm `youtube-nocookie.com/embed/` remains.

## 202702 Phuket local files

The following untracked files are not part of `202602-thailand-phuket`; they live under `202702-thailand-phuket`, which is a planning travel project:

- `day-0-singapore-001.jpeg`
- `day-0-singapore-002.jpeg`
- `day-07-splash-001.png`
- `day-07-splash-002.png`
- `day-07-splash-003.png`
- `day-08-singapore-001.png`
- `day-08-westin-001.png`

Keep them out of the `202602-thailand-phuket` Travel Memory work. They should be handled in a future `202702-thailand-phuket` planning-media scope.
