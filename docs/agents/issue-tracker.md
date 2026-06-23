# Issue tracker: GitHub

Issues and PRDs for this repository live as GitHub Issues. Use the GitHub CLI from inside this clone for issue operations; it infers `TavisLi/Li_Family_Web` from the configured remote.

## Conventions

- Create an issue with `gh issue create --title "..." --body "..."`.
- Read an issue with `gh issue view <number> --comments`.
- List work with `gh issue list`, narrowing by state or label when useful.
- Comment with `gh issue comment <number> --body "..."`.
- Apply or remove labels with `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close completed work with `gh issue close <number> --comment "..."`.

## Pull requests as a triage surface

External pull requests are not a triage surface. Do not automatically include them in issue triage; the team manages pull requests as implementation and review work, not as incoming requests.

## Publishing to the issue tracker

When an engineering skill asks to publish a PRD or other work item, create a GitHub Issue in this repository. A bare issue number always refers to an issue unless the request explicitly identifies a pull request.
