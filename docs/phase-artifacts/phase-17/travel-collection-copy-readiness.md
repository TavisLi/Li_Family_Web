# Phase 17 Travel Collection Copy Readiness

產生時間：2026-07-16T10:01:03.843Z

**Data-copy write readiness：BLOCKED**

## 摘要

| 指標 | 數量 |
| --- | ---: |
| 舊 TravelProjects | 5 |
| Travel Plans | 2 |
| Active Plans | 1 |
| Archived Plans | 1 |
| Travel Memories | 3 |
| Record-level ready | 5 |
| Record-level blocked | 0 |

## Environment

- Target migrations applied：no
- Target rows：plans 0／memories 0／route identities 0
- Legacy references：media 12／timeline events 2／featured travel 1

### Legacy reference owners

| Slug | Media | TimelineEvents | FeaturedTravel |
| --- | ---: | ---: | ---: |
| 201307-hainan | 0 | 1 | 0 |
| 202308-east-australia | 0 | 1 | 0 |
| 202607-chongqing-yangtze-river | 12 | 0 | 1 |

## Global blockers

- `migration-not-applied`：Phase 17 target collection migrations 尚未完整套用。

## 非空欄位使用數

| 舊欄位 | 非空 records |
| --- | ---: |
| `externalDocIdentifier` | 5 |
| `sourceMetadata` | 5 |
| `coverImage` | 5 |
| `galleryImages` | 5 |
| `itineraryImages` | 5 |
| `summary` | 4 |
| `party` | 3 |
| `flights` | 5 |
| `railSegments` | 1 |
| `lodgings` | 5 |
| `cabinAssignments` | 1 |
| `dailyItinerary` | 5 |
| `foodRecommendations` | 1 |
| `costItems` | 1 |
| `optionalActivities` | 2 |
| `reminders` | 5 |
| `sourceSections` | 5 |
| `externalVideos` | 1 |

## 逐筆判定

| Slug | Target | Plan 顯示 | Readiness | Blockers |
| --- | --- | --- | --- | ---: |
| `201307-hainan` | `travel-memories` | — | ready | 0 |
| `202308-east-australia` | `travel-memories` | — | ready | 0 |
| `202607-chongqing-yangtze-river` | `travel-plans` | archived | ready | 0 |
| `202602-thailand-phuket` | `travel-memories` | — | ready | 0 |
| `202702-thailand-phuket` | `travel-plans` | active | ready | 0 |

## Record blockers

### 201307-hainan

- 無 record-level blocker。

Mappings：
- `title` → `title`
- `slug` → `slug`
- `isPrivate` → `isPrivate`
- `startDate` → `startDate`
- `endDate` → `endDate`
- `summary` → `summary`
- `coverImage` → `coverImage`
- `sourceMetadata.baseProjection` → `sourceMetadata (rebuilt Memory Base/hash)`
- `members` → `participants`
- `party` → `guestParticipants`
- `galleryImages` → `galleryImages`
- `itineraryImages` → `itineraryImages`
- `flights` → `travelLedger.flights`
- `flights[].date` → `travelLedger.flights[].dateLabel`
- `flights[].passengers` → `travelLedger.flights[].passengers`
- `flights[].terminal` → `travelLedger.flights[].terminal`
- `lodgings` → `travelLedger.lodgings`
- `lodgings[].dateRange` → `travelLedger.lodgings[].dateRange`
- `dailyItinerary` → `dailyHighlights`
- `dailyItinerary[].date` → `dailyHighlights[].dateLabel`
- `sourceSections` → `storySections`
- `externalVideos` → `externalVideos`
- `reminders` → `reminders`

### 202308-east-australia

- 無 record-level blocker。

Mappings：
- `title` → `title`
- `slug` → `slug`
- `isPrivate` → `isPrivate`
- `startDate` → `startDate`
- `endDate` → `endDate`
- `summary` → `summary`
- `coverImage` → `coverImage`
- `sourceMetadata.baseProjection` → `sourceMetadata (rebuilt Memory Base/hash)`
- `members` → `participants`
- `party` → `guestParticipants`
- `galleryImages` → `galleryImages`
- `itineraryImages` → `itineraryImages`
- `flights` → `travelLedger.flights`
- `flights[].date` → `travelLedger.flights[].dateLabel`
- `flights[].passengers` → `travelLedger.flights[].passengers`
- `flights[].terminal` → `travelLedger.flights[].terminal`
- `lodgings` → `travelLedger.lodgings`
- `lodgings[].dateRange` → `travelLedger.lodgings[].dateRange`
- `dailyItinerary` → `dailyHighlights`
- `dailyItinerary[].date` → `dailyHighlights[].dateLabel`
- `sourceSections` → `storySections`
- `externalVideos` → `externalVideos`
- `reminders` → `reminders`

### 202607-chongqing-yangtze-river

- 無 record-level blocker。

Warnings：
- `galleryImages`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `itineraryImages`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `flights`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `railSegments`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `lodgings`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `cabinAssignments`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `dailyItinerary`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `foodRecommendations`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `costItems`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `optionalActivities`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `reminders`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。

Mappings：
- `title` → `title`
- `slug` → `slug`
- `isPrivate` → `isPrivate`
- `startDate` → `startDate`
- `endDate` → `endDate`
- `summary` → `summary`
- `coverImage` → `coverImage`
- `sourceMetadata.baseProjection` → `sourceMetadata (rebuilt Plan Base/hash)`
- `party` → `guestParticipants`
- `sourceSections` → `planningSections`

### 202602-thailand-phuket

- 無 record-level blocker。

Mappings：
- `title` → `title`
- `slug` → `slug`
- `isPrivate` → `isPrivate`
- `startDate` → `startDate`
- `endDate` → `endDate`
- `summary` → `summary`
- `coverImage` → `coverImage`
- `sourceMetadata.baseProjection` → `sourceMetadata (rebuilt Memory Base/hash)`
- `members` → `participants`
- `party` → `guestParticipants`
- `galleryImages` → `galleryImages`
- `itineraryImages` → `itineraryImages`
- `flights` → `travelLedger.flights`
- `flights[].date` → `travelLedger.flights[].dateLabel`
- `flights[].passengers` → `travelLedger.flights[].passengers`
- `flights[].terminal` → `travelLedger.flights[].terminal`
- `lodgings` → `travelLedger.lodgings`
- `lodgings[].dateRange` → `travelLedger.lodgings[].dateRange`
- `dailyItinerary` → `dailyHighlights`
- `dailyItinerary[].date` → `dailyHighlights[].dateLabel`
- `sourceSections` → `storySections`
- `externalVideos` → `externalVideos`
- `reminders` → `reminders`

### 202702-thailand-phuket

- 無 record-level blocker。

Warnings：
- `galleryImages`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `itineraryImages`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `flights`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `lodgings`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `dailyItinerary`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `optionalActivities`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。
- `reminders`：網站擁有者已批准的冗餘 planning projection；內容以 planningSections 為準，不搬入新 Plan schema。

Mappings：
- `title` → `title`
- `slug` → `slug`
- `isPrivate` → `isPrivate`
- `startDate` → `startDate`
- `endDate` → `endDate`
- `summary` → `summary`
- `coverImage` → `coverImage`
- `sourceMetadata.baseProjection` → `sourceMetadata (rebuilt Plan Base/hash)`
- `party` → `guestParticipants`
- `sourceSections` → `planningSections`

## 結論

目前只完成唯讀 inventory／copy dry-run；blockers 歸零並取得明確批准前，不得執行 data-copy write。
