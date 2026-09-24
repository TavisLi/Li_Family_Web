# GitHub platform governance

Repository work starts from the relevant Issue and its accepted scope. Use the [work form](../.github/ISSUE_TEMPLATE/work.yml) or [Production-sensitive form](../.github/ISSUE_TEMPLATE/production-sensitive.yml) for new work; the [PR template](../.github/pull_request_template.md) records only the change and evidence delta.

The [agent authority](../AGENTS.md) and [execution Playbook](phase-execution-playbook.md) own approval and closeout. [#105](phase-artifacts/issue-105/slice-1-run-contract.md) owns Production execution and Preview QA evidence; [#114](design/li-family-visual-system.md) owns visual judgment. This GitHub layer supplies CI result and metadata pointers.

`CI / gate` is initially non-required. Read back the tested SHA, check context and GitHub App identity before proposing a Ruleset. A green check is code verification for its stated scope; deployment and Production decisions retain their separate evidence and approval.

The workflow uses standard GitHub-hosted runners, no artifact upload or cache, and no Production credentials. Routine review reads run, SHA, scope, terminal checks, blocker, and links. On failure, inspect the failed job and a bounded relevant log excerpt. Stop automatic repair after two attempts in the same failure class without new evidence, as recorded in [#118](https://github.com/TavisLi/Li_Family_Web/issues/118) and its accepted Slice 2 plan.
