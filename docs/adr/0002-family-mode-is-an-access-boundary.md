---
status: accepted
date: 2026-06-14
last-reviewed: 2026-07-24
supersedes: null
---

# Family mode is an access boundary

Public mode exposes only explicitly public records, while family mode is established by an authenticated Payload user session and unlocks family-only reads and participation. Access is enforced in the data and collection layer, not merely hidden by frontend presentation, because travel details, comments, bucket items, and annual recaps contain private family material.

## Consequences

Unauthenticated visitors can see locked previews where appropriate, but may not receive private records or create interactions. New family experiences must declare their public-versus-family behavior before their UI is designed.
