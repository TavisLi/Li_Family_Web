# PR #181 — accepted decisions and remaining acceptance

Human accepted r27 isolated synthetic Gate C and authorized narrow Draft PR publication on 2026-11-02. These follow-ups remain open. Ownership is shared by the PR #181 maintainer (technical evidence) and Human/product owner (acceptance decisions). The PR stays Draft; none of these decisions authorizes Production, deployment, pruning, merge or release.

| Follow-up | Evidence required | Decision boundary |
| --- | --- | --- |
| Shared try-lock fail-fast / Admin and autosave | Under contention, visibly report that saving did not complete; preserve current editor inputs; provide a safe manual retry after re-read/conflict checking. Exercise unrelated Travel edits as well as same-owner and parent/Day edits. Show ordinary save and autosave behavior in Admin, beyond direct API rejection. | Shared lock is accepted. Actual conflict rate and Admin usability remain unverified. Any retry of uncertain writes requires its own reviewed behavior; no automatic retry is implied. |
| Unbounded Travel history | Measure retained versions and bytes under a representative synthetic editing workload, including ordinary saves/autosave behavior; evaluate backup size and restore time; define capacity monitoring and a budget before claiming operational readiness. | `maxPerDoc=0` is accepted as the current preservation policy. Long-term retention and any pruning/archive implementation require a separate decision and evidence that approvals/Base/IDs/history remain valid. |
| Production fidelity / readiness | Separately scoped #158/#161/#162/#105 evidence for actual schema/migration state, roles/RLS/grants and applicable data/API parity; review applicable Preview/Admin behavior. | Synthetic schema and API success do not establish Production parity. Production access, migration, content/media writes, deployment and merge/release remain independent gates. |

Report each follow-up as OPEN/UNKNOWN until its concrete evidence is reviewed. Do not close Issue #180 or describe PR #181 as Production-ready based solely on the r27 or new-head CI result.
