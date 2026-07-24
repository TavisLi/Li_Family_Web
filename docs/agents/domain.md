# Domain docs

This is a single-context repository.

Before work that depends on domain terminology or architecture decisions, read the root `CONTEXT.md`, `docs/adr/README.md`, and the relevant ADRs. `CONTEXT.md` defines product vocabulary; ADRs record enduring technical and boundary decisions.

Read the ADR that matches the area being changed before proposing an alternative. If a proposal conflicts with one, name that conflict explicitly instead of silently changing the established direction.

Changing an accepted decision requires a proposed superseding ADR and human approval at the architecture HITL gate. A Phase prompt, implementation plan, or Pull Request description does not silently supersede an ADR.

Use the vocabulary in `CONTEXT.md` in issues, PRDs, tests, and implementation notes. In particular, do not blur `content-source` with a runtime record, or `family mode` with public visitor access.
