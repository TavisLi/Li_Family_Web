---
status: accepted
date: 2026-06-20
last-reviewed: 2026-07-24
supersedes: null
---

# Family media uses Cloudflare R2

Family media is stored through the Cloudflare R2 S3-compatible adapter rather than Vercel Blob, with Payload Media records owning the associated metadata and relationships. The choice keeps image delivery and CMS media management aligned with the project's declared storage constraint and avoids introducing a second production media store.
