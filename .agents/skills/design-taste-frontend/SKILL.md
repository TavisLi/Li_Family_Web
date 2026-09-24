---
name: design-taste-frontend
description: "Primary creative direction for a new Li Family page or an explicitly requested visual redesign; not routine UI maintenance."
---

# Creative direction

Use this Skill as the sole Creative Director for the named design task. First read the current page, audience, content, and requested effort tier; state a one-line design read that names the hierarchy and mood. Choose composition, typography, whitespace, imagery, and motion to serve that read. Avoid generic card repetition, decoration without purpose, and inaccessible novelty.

Precedence: current user requirement → [Li Family visual system](../../../docs/design/li-family-visual-system.md) → repository architecture and installed stack → this Skill → generic technique defaults. `AGENTS.md` governs authority. Creative direction chooses **what and why**; `shadcn-stack` confirms **how**. Never silently install packages, replace fonts or Lucide, add another design system, upgrade Tailwind, expand scope, or treat a technique as permission for a redesign.

Use `li-family-design-system` for the shared product language. Use `redesign-existing-projects` for an existing-page audit and refinement; do not run two Creative Director Skills on one task. For ordinary UI fixes that follow existing patterns, use the visual system and relevant implementation guidance directly. Use `visual-qa` after visual changes.

## Read only the relevant reference

- Type scale and bilingual text: [typography](references/typography.md).
- Composition, spacing, imagery, and content density: [layout](references/layout.md).
- Requested animation: [motion](references/motion.md).
- Forms and interaction states: [interaction](references/interaction.md).
- Explicit system exploration or block work: [design-systems](references/design-systems.md).
- Distinctiveness audit: [anti-patterns](references/anti-patterns.md).
- Explicit redesign: [redesign](references/redesign.md).

Reference material contains generic examples and possible techniques. Its package, font, icon, motion, dark-mode, and output prescriptions are optional ideas only when compatible with the user request and Li Family contract. Load a heading or subsection when possible, not the whole file.
