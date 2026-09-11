---
# 填寫指南：複製本檔，替換示例，保留章節名稱與表頭。這些 YAML 註解不匯入正文。
# title 是旅行名稱；author/date 是文件資料，不等於 Payload 作者或旅行日期。
# startDate/endDate 用帶引號的 YYYY-MM-DD；isPrivate=true 家人限定，false 公開。
# 出行人以「、」分隔；AI 應確認哪些是家庭成員、哪些是外部同行者。
# 行程概覽顯示於 Overview。航班表可加「乘客」欄；無航班時保留章節寫「無航班。」。
# 住宿每次一列，可加「地址」欄，日期目前以文字期間保存。
# 每日區塊從 Day 1 連續排列；複製至最後一天並同步實際日期。
# 主題、當日故事、交通、餐食與住宿顯示於 Daily；不知道的內容不要編造。
# 旅行回憶、最難忘的一天、Family stories 與提醒顯示於 Overview，三種版型共用。
# 外部影片章節填全旅程影片；每日影片另提供日期與網址給 AI 配對確認。
# 照片另交單一 photos 資料夾；AI 產生 manifest/altText/caption 並提供位置預覽。
# 不需手填下方 manifest 示意或技術 ID；版型、網址代稱與來源 Plan 另告訴 AI。
# 航班可選加「航廈」「完整日期」欄；完整日期用 YYYY-MM-DD，例如 2026-04-01。
# 住宿可選加「入住日期」「退房日期」「備註」欄；日期用 YYYY-MM-DD，備註與核心亮點分開。
# 目前實際對應（提供給 AI 檢查，不必由人填寫 Payload 欄位名）：
# title/startDate/endDate/isPrivate → TravelMemories 同名欄位；catalog 另管理 slug/title。
# 行程概覽 → summary；出行人文字 → guestParticipants，並不自動成為 participants 關聯。
# 家庭成員關聯由 members 投影至 participants；AI 須核對名單，不能重複顯示同行者。
# 航班日期 → travelLedger.flights.dateLabel，不是 date；其他現有表頭對應同組文字欄位。
# 航班完整日期 → flights.date；航廈 → flights.terminal。
# 住宿入住日期/退房日期/備註 → lodgings.startDate/endDate/notes。
# 住宿日期 → travelLedger.lodgings.dateRange；酒店/城市/地址/房型/預訂管道/價格/核心亮點
# → hotel/city/address/roomType/bookingChannel/price/highlights。
# 故事章節 → storySections；全旅程外部影片 → externalVideos；提醒 → reminders。
# 每日內容 → 獨立 TravelMemoryDays；TravelMemories.days 是反向關聯，不是可填的陣列。
# 照片 manifest → coverImage/galleryImages 或 Day 的 Moment placements；altText 屬於 Media。
# presentationStyle、originPlan、發布狀態與系統追蹤欄位不由此 Markdown 直接管理。
# 日期建議可參考照片拍攝日期及 GPS，再對照每日行程；不確定時由人確認。
title: "Clean-room Family Coast Memory"
author: "Synthetic fixture"
date: "2026-08-31"
startDate: "2026-04-01"
endDate: "2026-04-02"
isPrivate: true
---

# 👥 核心信息速覽

- **出行人**：Alex、Bo、Chen
- **時間**：2026年4月1日–4月2日（2天1晚）
- **行程概覽**：台北 → 海風鎮 → 台北
- **旅行回憶**：一家人第一次在清晨一起看潮汐。
- **最難忘的一天**：Day 2，在回程前完成一張全家合照。

# ✈️ 航班信息

| 日期 | 航空公司 | 航班 | 航線 | 起飛 | 抵達 | 備註 |
| --- | --- | --- | --- | --- | --- | --- |
| 4/1 | Example Air | EX101 | TPE → SEA | 08:00 | 09:10 | Synthetic data only |

# 🏨 住宿安排

| 日期 | 酒店 | 城市 | 房型 | 預訂管道 | 價格 | 核心亮點 |
| --- | --- | --- | --- | --- | --- | --- |
| 4/1–4/2 | 海風家庭旅店 | 海風鎮 | 家庭房 | Example | N/A | 步行可到海邊 |

# 🗓️ 每日行程詳解

## Day 1 · 4月1日（週三）— 抵達海風鎮

- **主題**：抵達與相聚
- **當日故事**：大家在傍晚海風裡重新聚在一起。

| 時間 | 安排 | 交通 | 備註 |
| --- | --- | --- | --- |
| 10:00 | 抵達旅店 | 接駁車 | 放下行李 |
| 17:00 | 海邊散步 | 步行 | 等待夕陽 |

- **早餐**：自理
- **午餐**：海風麵店
- **晚餐**：家庭合菜
- **住宿**：海風家庭旅店

## Day 2 · 4月2日（週四）— 清晨潮汐與返程

- **主題**：把回憶帶回家
- **當日故事**：潮水退去後，全家留下這趟旅行的最後一張照片。

| 時間 | 安排 | 交通 | 備註 |
| --- | --- | --- | --- |
| 06:30 | 看潮汐 | 步行 | 準備相機 |
| 12:00 | 返回台北 | 接駁車 | Synthetic route |

- **早餐**：旅店早餐
- **午餐**：車站便當
- **晚餐**：返家自理

# 📖 旅行回憶

這趟旅行最重要的不是景點數量，而是兩天都能慢慢說話。

# 💛 最難忘的一天

Day 2 的全家合照成為這趟旅行的代表畫面。

# 👨‍👩‍👧 Family stories

Chen 第一次主動替大家安排合照位置，這件小事後來一直被家人提起。

# 🎬 外部影片

Clean-room journey [https://youtu.be/dQw4w9WgXcQ]

# ⚠️ 旅行提醒

> 提醒：本文件只使用 synthetic data，不得替換成未批准的私人資料後直接發布。

<!--
Canonical media manifest rules:
- manifest altText is required nonblank accessibility copy for every new Memory asset;
- visible caption belongs to one Moment placement;
- itinerary assets require day plus sectionId; Source sectionId becomes momentKey;
- editors never type momentKey or placementKey in Payload Admin.

Travel-local manifest entry example (sourcePath is relative to content-source/assets):
{
  "sourcePath": "travels/YOUR-CANONICAL-SLUG/itinerary/dawn.png",
  "ownerType": "travel",
  "ownerSlug": "YOUR-CANONICAL-SLUG",
  "usage": "itinerary",
  "day": 2,
  "sectionId": "dawn",
  "altText": "三位家人站在退潮的沙灘上",
  "caption": "這趟旅程最後一張全家合照"
}
-->

