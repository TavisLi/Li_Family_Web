# Travel Memory Source v2 欄位契約

由 src/scripts/travel-memory-v2-coverage.ts 依 Collection 產生。包含 container、array row ID、upload 與 version envelope；version document 的巢狀內容引用本表，不重複計數。

總數 179；source-authorable 95；derived/importer-managed 4；cms/system-managed 80。未分類 0。

## 所有作者欄位共用規則

- Source 路徑使用下表位置與同名欄位；projectMemoryV2 保留 scalar／group，relationship 使用 slug 或 sourcePath 精確解析。完整語法見 [唯一模板](templates/travel-memory-source-template.md)。
- 新建省略可選值：不建立該選項；Payload checkbox 預設仍依 schema（privacy true、互動 true、placement role inline）；缺少 style 時 runtime fallback editorial-journal。必填欄位在匯入前驗證。
- 更新省略：保留 Current，不表示刪除。包括 nested fields、array items、語系；空值不作刪除指令。v2 不提供刪除語法。缺 Base 保留，雙方不同修改同欄位產生 conflict。
- locale 為 zh-TW 或 en；文字依該 locale 投影，非 localized 欄位為全語系共用。未提供的語系不寫入；UI fallback 遵循 Payload 設定。
- 表格欄位皆為文字，日期用 YYYY-MM-DD；role／type／boolean／number 依 schema 驗證。故事與 Day 的富語意內容使用具型別 fenced YAML；不填 DB ID 或 technical key。
- Production 影響欄描述資料用途；是否顯示仍取決於現行 renderer 與版型。寫入 source 不等於發布。

| Payload 路徑 | 分類 | required | Source／映射 | 語意與 Production 影響 |
| --- | --- | --- | --- | --- |
| TravelMemories.title | source-authorable | 必填（父項存在時） | frontmatter.title | 顯示標題 |
| TravelMemories.slug | source-authorable | 必填（父項存在時） | frontmatter.slug | 旅行網址與跨文件穩定識別 |
| TravelMemories.isPrivate | source-authorable | 可選 | frontmatter.isPrivate | 家人限定或公開 |
| TravelMemories.startDate | source-authorable | 必填（父項存在時） | frontmatter.startDate | 開始／入住日期 |
| TravelMemories.endDate | source-authorable | 必填（父項存在時） | frontmatter.endDate | 結束／退房日期 |
| TravelMemories.summary | source-authorable | 可選 | frontmatter.summary | Overview 摘要 |
| TravelMemories.coverImage | source-authorable | 可選 | frontmatter.coverImage | Overview 封面照片路徑 |
| TravelMemories.participants | source-authorable | 可選 | frontmatter.participants | 家庭成員 slug 清單 |
| TravelMemories.guestParticipants | source-authorable | 可選 | 同行者表 | 外部同行者清單 |
| TravelMemories.guestParticipants[].name | source-authorable | 必填（父項存在時） | 同行者表[].name | 同行者姓名 |
| TravelMemories.guestParticipants[].note | source-authorable | 可選 | 同行者表[].note | 同行者備註 |
| TravelMemories.guestParticipants[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.presentationStyle | source-authorable | 可選 | frontmatter.presentationStyle | Overview、Daily、Photos 共用版型 |
| TravelMemories.originPlan | source-authorable | 可選 | frontmatter.originPlan | 原始 Plan slug |
| TravelMemories.days | derived/importer-managed | 可選 | Payload reverse join | Payload reverse join |
| TravelMemories.galleryImages | source-authorable | 可選 | frontmatter.galleryImages | 完整相簿照片路徑與順序 |
| TravelMemories.travelLedger | source-authorable | 可選 | 航班表＋住宿表 | Overview 旅程資料簿 |
| TravelMemories.travelLedger.flights | source-authorable | 可選 | 航班表 | 航班列 |
| TravelMemories.travelLedger.flights[].date | source-authorable | 可選 | 航班表[].date | 實際日期 |
| TravelMemories.travelLedger.flights[].dateLabel | source-authorable | 可選 | 航班表[].dateLabel | 日期顯示文字 |
| TravelMemories.travelLedger.flights[].airline | source-authorable | 可選 | 航班表[].airline | 航空公司 |
| TravelMemories.travelLedger.flights[].flightNumber | source-authorable | 可選 | 航班表[].flightNumber | 航班號 |
| TravelMemories.travelLedger.flights[].route | source-authorable | 可選 | 航班表[].route | 航線 |
| TravelMemories.travelLedger.flights[].passengers | source-authorable | 可選 | 航班表[].passengers | 搭機成員文字 |
| TravelMemories.travelLedger.flights[].departureTime | source-authorable | 可選 | 航班表[].departureTime | 起飛時間文字 |
| TravelMemories.travelLedger.flights[].arrivalTime | source-authorable | 可選 | 航班表[].arrivalTime | 抵達時間文字 |
| TravelMemories.travelLedger.flights[].terminal | source-authorable | 可選 | 航班表[].terminal | 航廈 |
| TravelMemories.travelLedger.flights[].notes | source-authorable | 可選 | 航班表[].notes | 備註 |
| TravelMemories.travelLedger.flights[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.travelLedger.lodgings | source-authorable | 可選 | 住宿表 | 住宿列 |
| TravelMemories.travelLedger.lodgings[].startDate | source-authorable | 可選 | 住宿表[].startDate | 開始／入住日期 |
| TravelMemories.travelLedger.lodgings[].endDate | source-authorable | 可選 | 住宿表[].endDate | 結束／退房日期 |
| TravelMemories.travelLedger.lodgings[].dateRange | source-authorable | 可選 | 住宿表[].dateRange | 住宿期間顯示文字 |
| TravelMemories.travelLedger.lodgings[].hotel | source-authorable | 必填（父項存在時） | 住宿表[].hotel | 飯店名稱 |
| TravelMemories.travelLedger.lodgings[].city | source-authorable | 可選 | 住宿表[].city | 城市 |
| TravelMemories.travelLedger.lodgings[].address | source-authorable | 可選 | 住宿表[].address | 地址 |
| TravelMemories.travelLedger.lodgings[].roomType | source-authorable | 可選 | 住宿表[].roomType | 房型 |
| TravelMemories.travelLedger.lodgings[].bookingChannel | source-authorable | 可選 | 住宿表[].bookingChannel | 訂房管道 |
| TravelMemories.travelLedger.lodgings[].price | source-authorable | 可選 | 住宿表[].price | 價格文字 |
| TravelMemories.travelLedger.lodgings[].highlights | source-authorable | 可選 | 住宿表[].highlights | 住宿亮點 |
| TravelMemories.travelLedger.lodgings[].notes | source-authorable | 可選 | 住宿表[].notes | 備註 |
| TravelMemories.travelLedger.lodgings[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.storySections | source-authorable | 可選 | memory-story | Overview 故事段落 |
| TravelMemories.storySections[].level | source-authorable | 必填（父項存在時） | memory-story.level | 標題層級 1–3 |
| TravelMemories.storySections[].title | source-authorable | 必填（父項存在時） | memory-story.title | 顯示標題 |
| TravelMemories.storySections[].anchor | source-authorable | 必填（父項存在時） | memory-story.anchor | 段落連結錨點 |
| TravelMemories.storySections[].displayDay | source-authorable | 可選 | memory-story.displayDay | 段落天數標籤 |
| TravelMemories.storySections[].displayDate | source-authorable | 可選 | memory-story.displayDate | 段落日期標籤 |
| TravelMemories.storySections[].displaySubtitle | source-authorable | 可選 | memory-story.displaySubtitle | 段落副標題 |
| TravelMemories.storySections[].role | source-authorable | 可選 | memory-story.role | 故事語意或照片使用方式 |
| TravelMemories.storySections[].body | source-authorable | 必填（父項存在時） | memory-story.body | Markdown 敘事內文 |
| TravelMemories.storySections[].links | source-authorable | 可選 | memory-story.links | 段落外部連結 |
| TravelMemories.storySections[].links[].label | source-authorable | 可選 | memory-story.links[].label | 連結顯示文字 |
| TravelMemories.storySections[].links[].url | source-authorable | 必填（父項存在時） | memory-story.links[].url | 外部連結網址 |
| TravelMemories.storySections[].links[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.storySections[].mediaItems | source-authorable | 可選 | memory-story.mediaItems | 段落照片路徑與順序 |
| TravelMemories.storySections[].interactions | source-authorable | 可選 | memory-story.interactions | 段落互動開關 |
| TravelMemories.storySections[].interactions.commentsEnabled | source-authorable | 可選 | memory-story.interactions.commentsEnabled | 留言開關 |
| TravelMemories.storySections[].interactions.thumbsUpEnabled | source-authorable | 可選 | memory-story.interactions.thumbsUpEnabled | 讚開關 |
| TravelMemories.storySections[].interactions.thumbsDownEnabled | source-authorable | 可選 | memory-story.interactions.thumbsDownEnabled | 倒讚開關 |
| TravelMemories.storySections[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.externalVideos | source-authorable | 可選 | 影片表 | Overview 全旅程影片 |
| TravelMemories.externalVideos[].title | source-authorable | 可選 | 影片表[].title | 顯示標題 |
| TravelMemories.externalVideos[].url | source-authorable | 必填（父項存在時） | 影片表[].url | 外部連結網址 |
| TravelMemories.externalVideos[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.reminders | source-authorable | 可選 | memory-reminder | Overview 補充資訊 |
| TravelMemories.reminders[].category | source-authorable | 必填（父項存在時） | memory-reminder.category | 提醒分類標題 |
| TravelMemories.reminders[].items | source-authorable | 可選 | memory-reminder.items | 提醒內容清單 |
| TravelMemories.reminders[].items[].text | source-authorable | 必填（父項存在時） | memory-reminder.items[].text | Markdown 提醒內文 |
| TravelMemories.reminders[].items[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.reminders[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.sourceMetadata | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemories.sourceMetadata.sourceFile | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemories.sourceMetadata.sourceHash | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemories.sourceMetadata.parserVersion | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemories.sourceMetadata.lastImportedAt | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemories.sourceMetadata.baseProjection | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.memory | derived/importer-managed | 必填（父項存在時） | 根文件 slug 精確解析 parent | 根文件 slug 精確解析 parent |
| TravelMemoryDays.dayIdentity | cms/system-managed | 必填（父項存在時） | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.dayKey | derived/importer-managed | 必填（父項存在時） | Day.day → day-NN | Day.day → day-NN |
| TravelMemoryDays.day | source-authorable | 必填（父項存在時） | memory-day.day | 第幾天（1–99） |
| TravelMemoryDays.date | source-authorable | 可選 | memory-day.date | 實際日期 |
| TravelMemoryDays.dateLabel | source-authorable | 可選 | memory-day.dateLabel | 日期顯示文字 |
| TravelMemoryDays.title | source-authorable | 必填（父項存在時） | memory-day.title | 顯示標題 |
| TravelMemoryDays.theme | source-authorable | 可選 | memory-day.theme | Daily 主題 |
| TravelMemoryDays.story | source-authorable | 可選 | memory-day.story | Daily 故事 |
| TravelMemoryDays.dailyHeroImage | source-authorable | 可選 | memory-day.dailyHeroImage | Daily 與 Overview 日卡封面照片路徑 |
| TravelMemoryDays.moments | source-authorable | 可選 | memory-day.moments | 按作者順序的每日片段 |
| TravelMemoryDays.moments[].momentKey | cms/system-managed | 必填（父項存在時） | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.moments[].time | source-authorable | 可選 | memory-day.moments[].time | 片段時間文字 |
| TravelMemoryDays.moments[].location | source-authorable | 可選 | memory-day.moments[].location | 片段地點 |
| TravelMemoryDays.moments[].title | source-authorable | 必填（父項存在時） | memory-day.moments[].title | 顯示標題 |
| TravelMemoryDays.moments[].body | source-authorable | 可選 | memory-day.moments[].body | Markdown 敘事內文 |
| TravelMemoryDays.moments[].transport | source-authorable | 可選 | memory-day.moments[].transport | 交通方式 |
| TravelMemoryDays.moments[].placements | source-authorable | 可選 | memory-day.moments[].placements | 片段內照片與 YouTube 的順序 |
| TravelMemoryDays.moments[].placements[].placementKey | cms/system-managed | 必填（父項存在時） | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.moments[].placements[].type | source-authorable | 必填（父項存在時） | memory-day.moments[].placements[].type | 照片／影片類型 |
| TravelMemoryDays.moments[].placements[].role | source-authorable | 可選 | memory-day.moments[].placements[].role | 故事語意或照片使用方式 |
| TravelMemoryDays.moments[].placements[].media | source-authorable | 可選 | memory-day.moments[].placements[].media | 照片資產路徑 |
| TravelMemoryDays.moments[].placements[].youtubeUrl | source-authorable | 可選 | memory-day.moments[].placements[].youtubeUrl | YouTube 網址 |
| TravelMemoryDays.moments[].placements[].caption | source-authorable | 可選 | memory-day.moments[].placements[].caption | 這一次使用的可見圖說（不是 altText） |
| TravelMemoryDays.moments[].placements[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.moments[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.meals | source-authorable | 可選 | memory-day.meals | Daily 餐食 |
| TravelMemoryDays.meals.breakfast | source-authorable | 可選 | memory-day.meals.breakfast | 早餐 |
| TravelMemoryDays.meals.lunch | source-authorable | 可選 | memory-day.meals.lunch | 午餐 |
| TravelMemoryDays.meals.dinner | source-authorable | 可選 | memory-day.meals.dinner | 晚餐 |
| TravelMemoryDays.lodging | source-authorable | 可選 | memory-day.lodging | Daily 住宿文字 |
| TravelMemoryDays.sourceMetadata | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.sourceMetadata.sourceFile | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.sourceMetadata.sourceHash | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.sourceMetadata.parserVersion | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.sourceMetadata.lastImportedAt | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| TravelMemoryDays.sourceMetadata.baseProjection | cms/system-managed | 可選 | 禁止手填；CMS／匯入基準管理 | 技術識別／匯入基準；不直接顯示 |
| Media.type | source-authorable | 必填（父項存在時） | memory-media.type | 照片／影片類型 |
| Media.youtubeUrl | source-authorable | 可選 | memory-media.youtubeUrl | YouTube 網址 |
| Media.altText | source-authorable | 必填（父項存在時） | memory-media.altText | 資產無障礙描述，不作為敘事圖說 |
| Media.sourcePath | source-authorable | 可選 | memory-media.sourcePath | 相對 content-source/assets 的穩定檔案路徑 |
| Media.tags | source-authorable | 可選 | memory-media.tags | 資產標籤 |
| Media.tags[].tag | source-authorable | 必填（父項存在時） | memory-media.tags[].tag | 單一標籤文字 |
| Media.tags[].id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.relatedMembers | source-authorable | 可選 | memory-media.relatedMembers | 照片人物的家庭成員 slug |
| Media.relatedTravelRecord | derived/importer-managed | 可選 | 根文件 slug → travel-memories 關係 | 根文件 slug → travel-memories 關係 |
| TravelMemories.id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.createdAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.updatedAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories._status | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.parent | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.version | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.createdAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.updatedAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.latest | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemories.versions.autosave | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.createdAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.updatedAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays._status | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.parent | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.version | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.createdAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.updatedAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.latest | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| TravelMemoryDays.versions.autosave | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.id | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.createdAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.updatedAt | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.url | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.thumbnailURL | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.filename | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.mimeType | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.filesize | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.width | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.height | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.url | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.width | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.height | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.mimeType | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.filesize | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.thumbnail.filename | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.url | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.width | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.height | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.mimeType | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.filesize | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.medium.filename | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.url | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.width | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.height | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.mimeType | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.filesize | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.sizes.large.filename | cms/system-managed | 系統管理 | 禁止手填 | Payload／storage／version 管理；versions.version 重用完整 document 欄位契約 |
| Media.focalX | source-authorable | 可選 | memory-media.focalX | 裁切焦點水平百分比 0–100 |
| Media.focalY | source-authorable | 可選 | memory-media.focalY | 裁切焦點垂直百分比 0–100 |
