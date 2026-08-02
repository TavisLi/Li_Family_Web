---
status: accepted
date: 2026-08-02
last-reviewed: 2026-08-02
related:
  - "Issue #73"
  - "Issues #74–#82"
supersedes: null
---

# Travel Memory 多頁樣式共用一個內容模型

## 決策

一筆 Travel Memory 以 Overview、Daily chapter 與 Photos 多頁呈現。每筆 `travel-memories` record 保存一個 `presentationStyle`，可選 `editorial-journal`、`cinematic-timeline` 或 `family-scrapbook`；三種 renderer 必須消費同一組 style-neutral view models，不建立三套 schema 或內容副本。

每日章節保存於獨立 `travel-memory-days` collection，以 owning Memory＋`dayKey` 形成 stable identity。Day 內嵌有序 Moments；Moment 使用 `momentKey`，其 photo／YouTube placements 使用 `placementKey`。媒體 asset metadata 與 narrative placement caption 分開，manifest 的事件 `sectionId` 轉成 `momentKey`，不得再與 Markdown parser anchor 做 equality matching。

`presentationStyle` 由 Payload Admin 管理，不屬於 `content-source` projection。Day／Moment／Placement 的 source-managed fields 使用 Base／Source／Current reconciliation；Admin-only修改不得被 seed 靜默覆寫。

## 後果

- 三種樣式都必須完整支援 Overview、Day、Photos、caption、YouTube、responsive 與 access states。
- Day 可獨立編輯、發布、版本化與直接查詢；Moment／Placement 保持 Day 內部的深層內容，避免額外兩張高操作成本 collections。
- Child routes 必須先尊重 owning Memory 的 Public／Family／draft boundary。
- 缺少或無效 style deterministic fallback 至 `editorial-journal`。
- `TRAVEL_MEMORY_MULTIPAGE_ENABLED` 是 server-only rollout gate；schema、content backfill 與 runtime cutover可以分開批准。
- Legacy Memory arrays／routes 在 cutover、read-back、觀察期與獨立 cleanup 批准前保留。

## 初始配置

- `201307-hainan` → `family-scrapbook`
- `202308-east-australia` → `cinematic-timeline`
- `202602-thailand-phuket` → `editorial-journal`

初始配置的產品決策不等於批准 Production content write。

## 曾考慮的方案

- **全部嵌入 Memory**：拒絕；每日編輯仍困在巨型表單，child query 亦需載入整個 aggregate。
- **Day、Moment、Placement 各自 collection**：拒絕；目前規模不值得三層關聯與獨立 migration／Admin 操作成本。
- **每種 style 一套 schema**：拒絕；會複製內容並分叉 reconciliation、access 與 route contract。
