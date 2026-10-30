# Issue #175 · Gate B1b synthetic review

The `/atlas-review` route is a synthetic review surface. It uses the B0 projection and B1a MapLibre component with a local Natural Earth 1:110m land outline; it does not request external tiles or read Payload data. Land geometry was derived from [Natural Earth 1:110m land](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), with properties removed. The committed GeoJSON SHA-256 is `612c66faa26227dc73f03ba149e98bc8e491a7cb31edb02c7b3324e20d40cdfb`. Natural Earth data is public domain. Names, stories, coordinates and illustrations are synthetic examples.

## Browser evidence

Captured 2026-10-30 on loopback from the production build, based on main `dd41793dedf23a8ee1930dad460d667995458380`, with synthetic data and no external tiles. Images are viewport captures because full-page capture clipped the WebGL canvas in the test browser; the map was also checked in a second browser at 320px. Plan and Memory can be selected to expand their details. The extra story capture records a selected Memory item.

| View | 1440 × 900 | 390 × 844 | 320 × 844 |
| --- | --- | --- | --- |
| Corridor | [Desktop](corridor-1440-final.png) | [390](corridor-390-final.png) | [320](corridor-320-final.png) |
| Plan | [Desktop](plan-1440-final.png) | [390](plan-390-final.png) | [320](plan-320-final.png) |
| Memory | [Desktop](memory-1440-final.png) | [390](memory-390-final.png) | [320](memory-320-final.png) |

[Selected Memory story at 320px](memory-story-320-final.png).

- The 320px Plan state had document scroll width 320px. The sampled console had no errors. Network inspection showed only loopback requests in the sampled session.
- Keyboard Enter selected a Memory marker and closed its detail; focus returned to that marker. Core tests cover exact-coordinate groups, selection synchronisation, filtering, missing locations and WebGL/provider fallback.
- Emulated `prefers-reduced-motion: reduce` set the list-button transition property to `none`; camera selection, zoom and reset use zero-duration movement. This is a focused browser check, not an accessibility certification.
- At a global extent, distinct nearby markers can overlap; exact coincident coordinates are grouped and every item remains in the text list. Visual acceptance of this tradeoff remains for Human review.
- Real-photo cropping, narrative and privacy acceptance remain UNKNOWN. Provider, cost, terms, Family privacy, CRS and production integration remain open. No Production deployment or merge is authorized by this evidence.

## Human review minor-fix follow-up

On 2026-10-30, the Memory view was refined against the accepted Gate A warm editorial direction: paper-toned background, deep green controls and story markers, and a quieter story card. MapLibre still uses the local real land geometry and exact-coordinate grouping. Nearby distinct-coordinate overlap remains an open follow-up; no proximity merging was added.

The updated synthetic loopback build was captured at [1440](memory-1440-fix.png), [768](memory-768-fix.png), [390](memory-390-fix.png), [320](memory-320-fix.png), and [320 with an expanded story](memory-story-320-fix.png). The original B1b captures above retain the corresponding pre-fix view. Memory marker selection, list synchronisation, close and focus return, Day 02 switching and reduced-motion transition suppression were checked in the browser. At 320 and 768px, document width equalled viewport width; the sampled console had no errors.

`/atlas-review` is dynamically guarded: `ATLAS_REVIEW_ENABLED=true` is required, together with `VERCEL_ENV=preview` or `development`, or a local `NODE_ENV=development` or `test` when `VERCEL_ENV` is absent. A production `VERCEL_ENV` and unknown environments are denied even with opt-in. A local production-build HTTP check returned 404 for production with opt-in, 404 for preview without opt-in, and 200 for preview with opt-in. This does not authorize a deployment or access to Production.
