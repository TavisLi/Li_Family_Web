---
status: proposed
date: 2026-10-30
last-reviewed: 2026-10-30
related:
  - "Issue #167"
  - "Issue #168"
supersedes: null
---

# Travel Atlas 以授權後的現有旅行資料投影地圖

## Context

Corridor、Plan、Memory 與 Showcase 需要共享地理互動，但 Plan 和 Memory 是獨立 Payload records，Day／Moment 有既有 identity，Source 只是匯入輸入。地點及 viewport 可能揭露家庭隱私；底圖 renderer、資料及服務的授權／成本各自不同。

## Proposed decision

在 owning Plan sections／Memory Moments 增加經審查的 optional 地理欄位；具體 Plan stop identity 及 migration 在 PR-03 審查，不能用名稱或 index。保留 Payload published truth 和 Base／Source／Current 安全模式，不建立第二個 travel aggregate。只從 collection／data layer 已授權的 records 派生 renderer projection；public、family、draft 的結果與 cache 隔離，先過濾再計算群組、bounds 及連結。Family 第三方 tile 預設停用，直到 Human 批准其 viewport 資料傳送。

提議以 MapLibre GL JS 作 renderer、MapTiler 為待審核候選服務；地圖失敗時使用文字內容，不以 OSMF 社群服務作無條件 fallback。提議 WGS84 作內部標準並保存 provenance；Google／高德依其 URL 順序提供明示外部導航，高德 CRS／轉換未驗證前停用。詳見 [PR-01 契約](../phase-artifacts/issue-168/travel-atlas-contract.md)。

## Alternatives and consequences

- 直接以前端隱藏 private markers：拒絕，response、bounds 和 cache 已可能洩漏。
- 建立獨立 Atlas collection 複製旅行：拒絕，重複 identity、access 與 reconciliation。
- 單用外部地圖嵌入：缺少可控故事與替代清單，且第三方資料傳送更難限制。
- 自託管 tiles：可再評估，但有維護、資料授權與成本；目前先評估低維護候選。

需新增依賴及未來 additive schema，且服務條款、流量、地區覆蓋、CRS 及隱私均需各自驗證。資料缺失時文字仍完整。此 ADR 為 proposed，不取代 accepted ADR，也不批准實作、migration、Production access／write、deployment 或 merge；Human review 決定是否接受。
