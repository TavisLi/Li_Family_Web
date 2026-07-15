# Phase 17 Travel Collection Copy Readiness

產生時間：2026-07-15T10:00:35.361Z

**Data-copy write readiness：BLOCKED**

## 摘要

| 指標 | 數量 |
| --- | ---: |
| 舊 TravelProjects | 5 |
| Travel Plans | 2 |
| Active Plans | 1 |
| Archived Plans | 1 |
| Travel Memories | 3 |
| Record-level ready | 0 |
| Record-level blocked | 5 |

## Environment

- Additive migration applied：no
- Target rows：plans 0／memories 0／route identities 0
- Legacy references：media 12／timeline events 2／featured travel 1

### Legacy reference owners

| Slug | Media | TimelineEvents | FeaturedTravel |
| --- | ---: | ---: | ---: |
| 201307-hainan | 0 | 1 | 0 |
| 202308-east-australia | 0 | 1 | 0 |
| 202607-chongqing-yangtze-river | 12 | 0 | 1 |

## Global blockers

- `migration-not-applied`：Additive travel collection migration 尚未套用。
- `legacy-references`：Media、TimelineEvents 或 HomeConfig 仍引用 travel-projects，需要 cutover policy。

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
| `201307-hainan` | `travel-memories` | — | blocked | 2 |
| `202308-east-australia` | `travel-memories` | — | blocked | 2 |
| `202607-chongqing-yangtze-river` | `travel-plans` | archived | blocked | 17 |
| `202602-thailand-phuket` | `travel-memories` | — | blocked | 2 |
| `202702-thailand-phuket` | `travel-plans` | active | blocked | 8 |

## Record blockers

### 201307-hainan

- `sourceMetadata`：舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。
- `sourceSections`：Memory storySections 尚未承接 legacy level、display labels 與 interaction settings；需要 legacy snapshot 或逐欄 transformer。

### 202308-east-australia

- `sourceMetadata`：舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。
- `sourceSections`：Memory storySections 尚未承接 legacy level、display labels 與 interaction settings；需要 legacy snapshot 或逐欄 transformer。

### 202607-chongqing-yangtze-river

- `sourceMetadata`：舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。
- `galleryImages`：目標 Plan schema 尚未承接此欄位。
- `itineraryImages`：目標 Plan schema 尚未承接此欄位。
- `flights`：目標 Plan schema 尚未承接此欄位。
- `railSegments`：目標 Plan schema 尚未承接此欄位。
- `lodgings`：目標 Plan schema 尚未承接此欄位。
- `cabinAssignments`：目標 Plan schema 尚未承接此欄位。
- `dailyItinerary`：目標 Plan schema 尚未承接此欄位。
- `foodRecommendations`：目標 Plan schema 尚未承接此欄位。
- `costItems`：目標 Plan schema 尚未承接此欄位。
- `optionalActivities`：目標 Plan schema 尚未承接此欄位。
- `reminders`：目標 Plan schema 尚未承接此欄位。
- `sourceSections[6].displaySubtitle`：舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。
- `sourceSections[8].displayDay`：舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。
- `sourceSections[8].displayDate`：舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。
- `sourceSections[8].displaySubtitle`：舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。
- `sourceSections[9].displayDay`：舊 localized text 與目標 Plan 欄位型別／名稱不同，尚未定義可逆 transformer。

### 202602-thailand-phuket

- `sourceMetadata`：舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。
- `sourceSections`：Memory storySections 尚未承接 legacy level、display labels 與 interaction settings；需要 legacy snapshot 或逐欄 transformer。

### 202702-thailand-phuket

- `sourceMetadata`：舊 Base projection 使用 TravelProjects schema；必須封存為 migration evidence，並以目標 transformer 重建新的 Base／hash。
- `galleryImages`：目標 Plan schema 尚未承接此欄位。
- `itineraryImages`：目標 Plan schema 尚未承接此欄位。
- `flights`：目標 Plan schema 尚未承接此欄位。
- `lodgings`：目標 Plan schema 尚未承接此欄位。
- `dailyItinerary`：目標 Plan schema 尚未承接此欄位。
- `optionalActivities`：目標 Plan schema 尚未承接此欄位。
- `reminders`：目標 Plan schema 尚未承接此欄位。

## 結論

目前只完成唯讀 inventory／copy dry-run；blockers 歸零並取得明確批准前，不得執行 data-copy write。
