# Runtime content records are Payload-owned

The application reads published family content from Payload collections and globals; `content-source/` remains the curated source and seed-import input rather than a second runtime data store. This preserves CMS editing, relations, visibility rules, and generated types while retaining reviewable source material.

## Considered options

- Read Markdown and asset folders directly in frontend routes.
- Use Payload as the runtime source of truth and import structured source material into it.

The latter was chosen because it supports the family portal's linked content, access rules, media ownership, and CMS workflow without duplicating frontend parsing logic.
