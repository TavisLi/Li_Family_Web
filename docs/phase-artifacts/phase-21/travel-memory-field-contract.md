# Phase 21 Travel Memory canonical field contract

日期：2026-08-31
Issues：#96、#99、#101

## Canonical ownership

| Content | Canonical owner | Source write | Admin write | Runtime readers | Decision |
| --- | --- | --- | --- | --- | --- |
| identity/access/dates/summary | `travel-memories` | yes | reconciled | Overview/access | KEEP |
| participants/guest participants | `travel-memories` | yes | reconciled | Overview | KEEP |
| flights/lodgings | `travel-memories.travelLedger` | yes | reconciled | Overview | KEEP |
| story sections | `travel-memories.storySections`＋role | yes | reconciled | Overview | KEEP＋ADD role |
| reminders | `travel-memories.reminders` | yes | reconciled | Overview | KEEP |
| global/unassigned YouTube | `travel-memories.externalVideos` | yes | reconciled | Overview | KEEP |
| daily identity/date/theme/story/meals/lodging | `travel-memory-days` | yes | reconciled | Daily/Overview | KEEP |
| itinerary event text/time/location/transport | Day `moments` | yes | reconciled | Daily/Photos links | KEEP＋ADD transport |
| daily photo/YouTube usage | Moment `placements` | yes | reconciled | Daily/Photos | KEEP |
| asset accessibility description | `media.altText` | manifest/Admin | yes | `<img alt>` | KEEP |
| visible contextual copy | placement `caption` | manifest/Admin | yes | figure caption | KEEP; never derive from altText |
| cover | `travel-memories.coverImage` | manifest | yes | Overview/catalog | KEEP |
| unclassified archive photo | `travel-memories.galleryImages` | manifest | yes | Photos | DEPRECATE after placement migration |
| `itineraryImages` | transitional parent relationship | manifest | preserve | no canonical renderer read | DELETE-CANDIDATE |
| `dailyHighlights` | transitional parent daily array | source | preserve | legacy fallback only | DELETE-CANDIDATE |
| parent duplicate reminders/videos | parent canonical fields | source | reconciled | Overview | MERGE into canonical parent owner |
| `Media.relatedMembers` | optional discovery metadata | Admin | yes | no Travel renderer/access | DEPRECATE; inventory before retirement |
| `Media.relatedTravelRecord` | derived Admin discovery metadata | seed/Admin | yes | no access control | DEPRECATE; derive or retire after inventory |

## Identity and conflict rules

- Day：Memory id＋`dayKey`。
- Moment：新 Source 使用 semantic `scene` 產生穩定 key；Admin 自動生成 `moment:<uuid>`。採納既有 Current 時保留原 `momentKey`，未能精確配對須明確審核對照，不重新產生。
- Placement：新 Source photo 使用來源檔 byte SHA-256 `assetId`；舊 path reference 保留相容解析，YouTube 使用 canonical video id；Admin 自動生成 `placement:<uuid>`。採納既有 Current 時保留原 `placementKey`、關係、caption 與順序，不從遺漏列推定移除或重新分類。
- `assetId` 是媒體 byte identity；`sourcePath` 僅為可選舊路徑別名。travel slug 界定 Registry namespace；Registry 只記技術 metadata 和環境 locator，作者編排仍由 Source v2 管理。
- 不使用 array index、Markdown anchor equality 或人工猜日期。
- Missing Base existing child → `preserve-current`；Source-only → update；Current-only → preserve；雙邊不同 → conflict。
- unmatched day/media、duplicate source placement、missing media record、未驗證 hash 對 Media 關係或既有 key 無審核對照，一律 BLOCK write。

## Three-renderer content contract

Overview 必須同時可取得 participants、ledger、stories、reminders、global videos與全部 Days。Daily 必須取得 date/theme/story、transport、meals、lodging、Moments及 placements。Photos 只從 placements與明確 unclassified gallery聚合，按 asset identity 去重，並保留 Day/Moment return link。

## Inventory boundary

本文件目前以 repository schema、三份 canonical Markdown、manifests與 tests 為 current evidence。Production row counts、Admin-only drift與填充率尚未獲 H4 read-only 授權，不以歷史 snapshot 冒充；#101 destructive eligibility 在 fresh Production inventory 前保持 BLOCKED。
