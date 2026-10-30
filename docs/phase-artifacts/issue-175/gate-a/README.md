# Issue #175 · Gate A visual review evidence

Status: **UNKNOWN — Human visual approval pending.** This is a standalone design prototype, not the B1a MapLibre component or a Production preview.

## Scope and provenance

- Captured 2026-10-30 in the Codex in-app browser from a loopback-only static server. Repository base: `422efb4798392c7a080cae1c9b64af3bdb1a1fea` (merged PR #177).
- Source: the existing local revised Gate A prototype, SHA-256 `b7784393e53e1cf794a8ddb4d6ce5524a689fb6f5a2f8044b6111eaeae21087f`. It is an untracked local design artifact, not part of that commit. The review copy, [prototype.html](prototype.html), SHA-256 `0808042837caac120eb439f8e158d7e4b25426e29987c90aa71f5e69829fe4fc`, replaces its photographs and associated labels with synthetic SVG illustrations; layout and interactions are unchanged.
- Names, dates, coordinates, and stories are prototype examples; illustrations are synthetic. Natural Earth 1:110m geometry is embedded locally. No external tile provider, Payload, real travel photos, or Production data is used. Navigation text is illustrative only.
- Captures are full-page screenshots at desktop viewport 1440×900 and mobile viewports 320×844 and 390×844. Plan and Memory show an expanded synthetic item. Browser rendering and available fonts are environment-specific.

| View | Desktop | Mobile 320px | Mobile 390px |
| --- | --- | --- | --- |
| Corridor | [Screenshot](corridor-desktop.jpg) | [Screenshot](corridor-320.jpg) | [Screenshot](corridor-390.jpg) |
| Plan | [Screenshot](plan-desktop.jpg) | [Screenshot](plan-320.jpg) | [Screenshot](plan-390.jpg) |
| Memory | [Screenshot](memory-desktop.jpg) | [Screenshot](memory-320.jpg) | [Screenshot](memory-390.jpg) |

## Findings for Human review

1. **320px Corridor collision:** the group marker overlaps the zoom-in control and the attribution overlaps the reset control. The marker remains reachable in the tested keyboard path, but the visible collision reduces clarity and the exposed pointer target. See [320px Corridor](corridor-320.jpg).
2. **Memory map legibility:** the local 1:110m geography gives almost no visible land detail at the Memory extent; markers appear on a largely blank field. The prototype cannot establish whether the intended local geographic context is legible. See [desktop Memory](memory-desktop.jpg). Choosing or enabling a map provider is outside this review.
3. **Synthetic-image limitation:** placeholders demonstrate dimensions and layout only. They cannot validate actual family-photo cropping, contrast, or narrative quality. The visual system calls for authorized family imagery, which this synthetic-only review cannot assess.

## Checks and limits

- At 320px and 390px, all three captured views had document scroll width equal to viewport width; synthetic images loaded. At 768px, Corridor had no document-level horizontal overflow. Desktop screenshots show the full pages.
- Keyboard Enter expanded the Corridor cluster and selected an item; the selected list item retained focus and exposed pressed state. On desktop, closing the cluster popup returned focus to its marker. A year filter updated the list/count; the map-unavailable state preserved the filtered list. Zoom changed the SVG viewBox, and Plan Day 01 changed the list. These are focused checks, not exhaustive accessibility certification.
- Browser console showed no errors or warnings during the sampled checks. Layout inspection does not establish contrast compliance or every viewport/state.
- Reduced motion: source inspection found a `prefers-reduced-motion: reduce` transition rule and the chapter animation restricted to `no-preference`. Emulation of the operating-system preference was unavailable in this browser session, so runtime behavior with reduced motion enabled is **UNKNOWN**.
- No Human visual approval is recorded. No external tiles, Payload integration, Schema change, Production deployment, or merge is authorized by this evidence.
