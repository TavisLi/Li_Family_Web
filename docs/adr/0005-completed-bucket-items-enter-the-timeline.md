---
status: accepted
date: 2026-06-19
last-reviewed: 2026-07-24
supersedes: null
---

# Completed bucket items enter the timeline

Completing a bucket item creates a linked, private timeline event in the same application workflow instead of relying on an external webhook. The decision makes a shared aspiration's completion part of the family memory without adding a separate synchronization service or leaving the timeline dependent on manual duplication.

## Consequences

A completion operation must be safe to repeat without creating duplicate timeline entries. The created event keeps the bucket item's privacy setting and retains the link back to the completed aspiration.
