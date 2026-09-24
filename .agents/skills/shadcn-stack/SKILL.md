---
name: shadcn-stack
description: "Implement Li Family UI components within the repository's installed Next, Tailwind, shadcn, and icon stack."
---

# Stack-aware component implementation

Before editing, inspect `package.json`, `components.json`, `tailwind.config.ts`, `src/app/globals.css`, and the affected `src/components/ui` files as needed. Use installed versions and existing aliases as the source of truth. At Issue #114 baseline: Next 15.4.11, React 19.2.1, Tailwind 3.4.17, shadcn configuration `radix-nova`, CSS variables, Lucide, and `@/components/ui`. Verify values again when a later task depends on them.

Use existing components and variants before adding a new one. If a needed shadcn component is absent, check current official documentation against installed versions and review the generated changes before accepting them. Do not run `shadcn add` or install dependencies merely because a creative reference suggests a component. No Tailwind migration, icon replacement, second design system, or framework change without an explicit task. Keep style in Tailwind/CSS rather than React inline `style={{}}`.

The [Li Family visual system](../../../docs/design/li-family-visual-system.md) decides appearance; this Skill translates it into current code. Preserve access boundaries, loading/error states, and responsive behavior. Follow `AGENTS.md` for verification and authority.
