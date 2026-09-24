---
name: visual-qa
description: "Run scope-matched visual and interaction regression checks for a Li Family UI change."
---

# Visual acceptance

Inspect the changed surface in a real browser when available. Capture before/after evidence from the same route, data, viewport, and state; label synthetic, Preview, and Production sources distinctly. A prior screenshot is a baseline, not proof of current runtime behavior. Record commit, environment, viewport, date, and result. Do not claim improvement without a comparable pair or an explicit issue resolved in the new view.

For affected pages, check desktop, tablet, and 390px mobile as risk warrants. Check typography hierarchy and Chinese/English line wrapping, whitespace, image crop and alt/caption roles, horizontal overflow, navigation, hover/active/focus, keyboard, contrast, reduced motion, and loading/empty/error states. Include console errors and broken assets. A small change needs only affected routes, states, and viewports; a new presentation or cross-site token change needs broader coverage.

Compare with the [visual system](../../../docs/design/li-family-visual-system.md). Count obvious generic patterns only when the rubric and examples are recorded. If browser or target data is unavailable, report the gap as `UNKNOWN` and use focused render/HTML checks only as limited evidence. This Skill grants no Preview deployment or Production access.
