---
# Source v2 唯一模板；註解不匯入網站。完整欄位對應見 docs/travel-memory-source-v2-coverage.md。
sourceVersion: 2
locale: zh-TW
title: Clean-room Family Coast Memory
slug: 202604-clean-room-coast
startDate: '2026-04-01'
endDate: '2026-04-02'
isPrivate: true
summary: 台北 → 海風鎮 → 台北
presentationStyle: cinematic-timeline
participants: [tavis]
originPlan: clean-room-coast-plan
coverImage: travels/202604-clean-room-coast/photos/coast.png
galleryImages:
  - travels/202604-clean-room-coast/photos/coast.png
---

<!--
填寫方法（此段不顯示於網站）：
1. sourceVersion 固定 2；title、slug、旅行起訖日期、isPrivate 必填。
   slug 與旅行目錄、照片目錄一致；title 是網頁名稱。日期用帶引號 YYYY-MM-DD。
   locale 選 zh-TW 或 en；本次只寫該語系文字，不清除另一語系。
   既有項目若缺少該語系的 v2 匯入基準，先保留 Admin 內容並停止套用；新增翻譯須另行確認基準，不從另一語系猜測對應。
   日期、privacy、版型、關係等非 localized 欄位是共用值，翻譯檔必須一致。
2. summary 是 Overview 摘要。presentationStyle 選 editorial-journal、
   cinematic-timeline、family-scrapbook，所有頁面共用；新建省略用 runtime 預設。
   participants 填家庭成員 slug（由 AI 核對）；外部同行者填 name／note 表。
   originPlan 是原 Plan slug，無原 Plan 就刪除此行。不要填資料庫 ID。
3. coverImage 是 Overview 封面；galleryImages 是相簿路徑及順序；
   dailyHeroImage 是 Daily 與 Overview 日卡封面。路徑相對 content-source/assets。
   照片可只放單一 photos 資料夾；不知道的日期、人物及位置由人確認。
4. 簡單資料用表格，空白格表示没填。沒有資料可刪除該表及標題。
   航班所有欄位可選；住宿僅 hotel 必填。dateLabel／dateRange 是顯示文字，
   date／startDate／endDate 是實際日期。airline 航空公司、flightNumber 班號、
   route 航線、passengers 乘客、terminal 航廈、departureTime／arrivalTime 時間文字。
   hotel 飯店、city 城市、address 地址、roomType 房型、bookingChannel 訂房管道、
   price 價格、highlights 亮點、notes 備註。表格內的直線符號使用反斜線跳脫。
5. 故事、每日、提醒、資產使用下方 YAML 區塊，可複製多個，保留縮排。
   body／story 內可寫多行 Markdown。區塊外不放正文；未知欄位、null、空字串報錯。
   level 是標題層級 1–3；anchor 是固定段落連結；title 是顯示標題。
   displayDay／displayDate／displaySubtitle 是可選天數、日期、副標題。
   story role 選 featured-memory、travel-reflection、unforgettable-day、
   family-story、additional-information。body 必填；links／mediaItems 可選。
   interactions 三個開關控制留言、讚、倒讚；省略遵循 Payload 預設。
6. day 是 1–99，第幾天；date 是可選當地日期，不以檔案修改時間猜測；
   dateLabel 顯示日期，title 每日標題，theme 主題，story 每日故事。
   moments 依填寫順序呈現。scene 是固定片段名稱，例如「碼頭清晨散步」，
   匯入器用它產生技術識別，不需手填 momentKey。建立後保留 scene；
   網頁文字改 title 即可。同一天 scene 不能重複。time 時間、location 地點、
   body 故事、transport 交通；meals 是三餐、lodging 當日住宿。
7. placement type=photo 時只填 media 路徑；youtube 時只填 youtubeUrl。
   role 選 hero／inline／gallery。caption 是此使用位置的可見故事文字。
   同照片可在不同片段有不同 caption；同片段不可重複同照片／同 YouTube。
   placementKey 自動產生。altText 另在資產區，描述畫面供無障礙使用。
8. memory-media 是 v2 的媒體 manifest；sourcePath 固定，photo 需要實體檔案，
   video 填 youtubeUrl。altText 必填；tags 標籤；relatedMembers 已確認人物 slug。
   focalX／focalY 是可選裁切焦點 0–100 百分比；ownership 由根 slug 解析。
   舊 manifest 的 usage／day／sectionId／sortOrder 對應 v2 明確配置與排列，
   time／location 放 Moment，caption 放 placement。v2 不同時套用舊 JSON manifest。
9. 新建時省略可選欄位就不建立；CMS checkbox／role 預設仍適用。
   更新省略欄位、陣列項目、表格列或語系都代表保留；[] 也不代表刪除。
   v2 無刪除語法。需刪除或更換 scene／sourcePath 時，交 AI 提出明確對照另案處理。
   舊紀錄無 v2 Base 時整份保留，先作基準審查，不直接覆蓋 Admin。
   無唯一識別的表格列／提醒內容若無法配對，回報 conflict，不猜列序。
10. 系統 ID、timestamp、sourceMetadata、dayIdentity、momentKey、placementKey、
    發布狀態不要手填。新建匯入先建立草稿，預覽確認後再發布。
    這是 synthetic 範例；欄位的網站呈現仍依實際版型，並非每個欄位都直接顯示。
-->

# 同行者
| name | note |
| --- | --- |
| Alex | 家庭朋友（合成示例） |

# 航班
| date | dateLabel | airline | flightNumber | route | passengers | departureTime | arrivalTime | terminal | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-04-01 | 4/1 上午 | Example Air | EX101 | TPE → SEA | 全員 | 08:00 | 09:10 | T2 | Synthetic data only |

# 住宿
| startDate | endDate | dateRange | hotel | city | address | roomType | bookingChannel | price | highlights | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-04-01 | 2026-04-02 | 4/1–4/2 | 海風家庭旅店 | 海風鎮 | 海岸路 1 號（示例） | 家庭房 | Example | N/A | 步行可到海邊 | 合成資料 |

# 影片
| title | url |
| --- | --- |
| Clean-room journey | https://youtu.be/dQw4w9WgXcQ |

# 故事 海風裡的相聚
```memory-story
level: 2
title: 海風裡的相聚
anchor: coast-reflection
displayDay: 兩天一夜
displayDate: '2026年4月'
displaySubtitle: 把時間留給家人
role: travel-reflection
body: |
  這趟旅行讓大家有時間慢慢說話。
links:
  - label: 旅程補充
    url: https://example.com/coast
mediaItems:
  - travels/202604-clean-room-coast/photos/coast.png
interactions:
  commentsEnabled: true
  thumbsUpEnabled: true
  thumbsDownEnabled: false
```

# 每日 Day 1
```memory-day
day: 1
date: '2026-04-01'
dateLabel: 4月1日（週三）
title: 抵達海風鎮
theme: 抵達與相聚
story: |
  大家在傍晚海風裡重新聚在一起。
dailyHeroImage: travels/202604-clean-room-coast/photos/coast.png
moments:
  - scene: 海邊第一次散步
    title: 傍晚的散步
    time: '17:00'
    location: 海風鎮沙灘
    body: |
      等待夕陽，也留下合照。
    transport: 步行
    placements:
      - type: photo
        role: hero
        media: travels/202604-clean-room-coast/photos/coast.png
        caption: 我們一起記住的黃昏
      - type: youtube
        role: inline
        youtubeUrl: https://youtu.be/aqz-KE-bpKQ
        caption: 當日影片
meals:
  breakfast: 自理
  lunch: 海風麵店
  dinner: 家庭合菜
lodging: 海風家庭旅店
```

# 每日 Day 2
```memory-day
day: 2
date: '2026-04-02'
title: 清晨潮汐與返程
moments:
  - scene: 清晨潮汐
    title: 把回憶帶回家
    placements:
      - type: photo
        role: gallery
        media: travels/202604-clean-room-coast/photos/coast.png
        caption: 同一資產在另一個片段的圖說示例
```

# 提醒
<!-- 每個提醒項目用 entry 填一個固定、易懂的名稱，例如「隨身準備」。修改 text 或重排時保留 entry；它不是資料庫 ID。 -->
```memory-reminder
category: 行前筆記
items:
  - entry: 隨身準備
    text: |
      - 帶著相機
      - 留一點時間給散步
```

# 資產
```memory-media
sourcePath: travels/202604-clean-room-coast/photos/coast.png
type: photo
altText: 合成示例：海岸邊的藍色天空
tags:
  - tag: 海岸
relatedMembers: [tavis]
focalX: 50
focalY: 40
```
