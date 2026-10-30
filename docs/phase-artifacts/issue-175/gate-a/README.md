# Issue #175 · Gate A visual review evidence

Status: **Gate A — ACCEPT WITH FOLLOW-UP.** Human accepted the visual direction, colors, layouts and interaction design of Corridor, Plan and Memory at PR #178 head `f3dd9f47479c4c9785c23590adbc5d8d9543896f` on 2026-10-30. The Desktop and Mobile prototype is the design reference for B1b. This acceptance applies to the visual prototype, not to technical verification or authorization to begin B1b.

This is a standalone design prototype, not the B1a MapLibre component or a Production preview. Follow-ups below remain open and do not block the conditional Gate A acceptance:

1. The formal map must use real geographic data, not the fictional island shown in the prototype.
2. Real-photo cropping, narrative quality and privacy acceptance remain **UNKNOWN**.
3. Native reduced-motion runtime QA remains **UNKNOWN**.
4. Visual consistency and interaction acceptance of the formal MapLibre component remain **UNKNOWN**.
5. Third-party map provider, cost and Family privacy decisions remain **UNKNOWN**.

## Scope and provenance

- Captured 2026-10-30 in the Codex in-app browser from a loopback-only static server. Repository base: `422efb4798392c7a080cae1c9b64af3bdb1a1fea` (merged PR #177).
- Source: the existing local revised Gate A prototype, SHA-256 `b7784393e53e1cf794a8ddb4d6ce5524a689fb6f5a2f8044b6111eaeae21087f`. It is an untracked local design artifact, not part of that commit. The [first synthetic review copy](https://github.com/TavisLi/Li_Family_Web/blob/0a80f670287506a4ad7f47c4631be9820541cf0b/docs/phase-artifacts/issue-175/gate-a/prototype.html) replaced its photographs with synthetic SVG illustrations.
- The revised [prototype.html](prototype.html), SHA-256 `846f12d7e9a909e55794c1c2f76fc44d2aba80a78bf955c52da17599574b2aa1`, moves mobile map controls below the map and gives Memory an explicitly fictional island outline. Corridor and Plan use locally embedded Natural Earth 1:110m geometry. Names, dates, coordinates, stories and illustrations are examples. No external tile provider, Payload, real travel photos, or Production data is used. Navigation text is illustrative only.
- Captures are full-page screenshots at desktop viewport 1440×900 and mobile viewports 320×844 and 390×844. Plan and Memory show an expanded synthetic item. The six mobile screenshots and Memory desktop were recaptured on 2026-10-30 after the revision; the unaffected Corridor and Plan desktop screenshots remain from the first review. Browser rendering and available fonts are environment-specific.

| View | Desktop | Mobile 320px | Mobile 390px |
| --- | --- | --- | --- |
| Corridor | [Screenshot](corridor-desktop.jpg) | [Screenshot](corridor-320.jpg) | [Screenshot](corridor-390.jpg) |
| Plan | [Screenshot](plan-desktop.jpg) | [Screenshot](plan-320.jpg) | [Screenshot](plan-390.jpg) |
| Memory | [Screenshot](memory-desktop.jpg) | [Screenshot](memory-320.jpg) | [Screenshot](memory-390.jpg) |

## Findings for Human review

1. **320px Corridor collision addressed:** controls now sit beneath the map at mobile widths, outside the marker and attribution areas. Compare the [original](https://github.com/TavisLi/Li_Family_Web/blob/0a80f670287506a4ad7f47c4631be9820541cf0b/docs/phase-artifacts/issue-175/gate-a/corridor-320.jpg) and [revised](corridor-320.jpg) screenshots.
2. **Memory context addressed for the prototype:** a synthetic island and interior contour lines give the markers visible context, explicitly labeled as non-geographic. Compare [original](https://github.com/TavisLi/Li_Family_Web/blob/0a80f670287506a4ad7f47c4631be9820541cf0b/docs/phase-artifacts/issue-175/gate-a/memory-desktop.jpg) and [revised](memory-desktop.jpg). This illustration cannot establish real geography, map-provider suitability, or production rendering.
3. **Synthetic-image limitation remains:** placeholders demonstrate dimensions and layout only. They cannot validate actual family-photo cropping, contrast, or narrative quality. The visual system calls for authorized family imagery, which this synthetic-only review cannot assess.

## Checks and limits

- After revision, all three views at 320px and 390px had document scroll width equal to viewport width; sampled synthetic images loaded. Mobile controls are 44×44px and outside the map; measured marker, zoom button and attribution rectangles did not overlap. The earlier 768px Corridor check had no document-level horizontal overflow.
- After revision, keyboard Enter expanded the Corridor cluster and selected an item with focus and pressed state intact; zoom and reset worked, and the map-unavailable state preserved the list. Memory selection, zoom and Day 03 switching worked. Previously checked desktop popup focus return, year filtering and Plan Day 01 switching are recorded against the [prior review](https://github.com/TavisLi/Li_Family_Web/blob/0a80f670287506a4ad7f47c4631be9820541cf0b/docs/phase-artifacts/issue-175/gate-a/README.md). These are focused checks, not exhaustive accessibility certification.
- Browser console showed no errors or warnings during the sampled checks. The local server recorded a missing `/favicon.ico` request (404); the sampled content images loaded. Layout inspection does not establish contrast compliance or every viewport/state.
- Reduced motion: in the normal browser preference, the selected detail used `chapter-in` and marker transitions were 0.18s. A temporary local test copy forced the reduced CSS branch and disabled the no-preference branch: the detail animation computed to `none`, marker transition to 0.00001s, and scroll behavior to `auto`; selection still worked. The temporary copy was removed. The browser could not emulate the actual operating-system preference, so native reduced-motion runtime behavior remains **UNKNOWN**.
- Human visual acceptance is limited to the approved prototype head above; the open technical and privacy follow-ups are not passes. No B1b execution, external tiles, Payload integration, Schema change, Production deployment, or merge is authorized by this decision.
