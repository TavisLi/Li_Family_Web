# Canonical travel slugs own source and asset identity

Each travel project's canonical slug is the identity shared by the `/travel/[slug]` route, the runtime project record, and its travel-local asset folder and manifest. This avoids duplicated one-off routes and prevents source-path or media relations from drifting when a display title or filename changes.

## Consequences

Every travel catalog entry and travel Markdown file must map to a stable canonical slug. Travel-specific media mappings live under `content-source/assets/travels/[slug]/manifest.json`; the local manifest takes precedence over global exceptions.
