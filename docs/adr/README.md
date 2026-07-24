# Architecture Decision Records

ADR 記錄 Web Li 已接受、會跨 Phase 持續生效的架構決策。一般 Phase 不得靜默推翻；若新需求需要改變決策，新增 superseding ADR 並取得產品／架構 HITL 批准。

## Status

- `proposed`：討論中，不可作為既定架構。
- `accepted`：現行決策。
- `superseded`：已由新 ADR 取代。
- `deprecated`：不再建議使用，但可能仍有過渡相容。

## Index

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](./0001-runtime-content-records-are-payload-owned.md) | Runtime content records are Payload-owned | accepted |
| [0002](./0002-family-mode-is-an-access-boundary.md) | Family mode is an access boundary | accepted |
| [0003](./0003-travel-slugs-own-source-and-asset-identity.md) | Canonical travel slugs own source and asset identity | accepted |
| [0004](./0004-family-media-uses-cloudflare-r2.md) | Family media uses Cloudflare R2 | accepted |
| [0005](./0005-completed-bucket-items-enter-the-timeline.md) | Completed bucket items enter the timeline | accepted |
| [0006](./0006-seed-reconciliation-protects-published-content.md) | Seed reconciliation protects published content | accepted |
| [0007](./0007-travel-plans-and-memories-are-separate-records.md) | Travel Plan and Memory are separate records | accepted |

## Required Metadata

```yaml
---
status: accepted
date: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
related:
  - issue-or-doc
supersedes: null
---
```

`related`、`supersedes` 沒有內容時可以省略。ADR body 至少說明 Decision、Consequences、Considered alternatives；涉及 rollout 時另外記錄 Implementation status。
