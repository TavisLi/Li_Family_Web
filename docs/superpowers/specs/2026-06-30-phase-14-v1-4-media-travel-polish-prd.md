## Problem Statement

家族網站的媒體與旅行頁已具備基礎資料與互動能力，但目前照片容易因固定容器而被裁切，單張或多張照片的視覺重心不夠穩定；Travel project 頁面的資訊層級仍有過多圓角卡片包裹，Level 1/Level 2/Level 3 的視覺語言不夠清楚。家人查看旅行規劃時，會需要更像正式旅行頁與家庭相簿的呈現方式，而不是只看到資料被放進通用卡片。

## Solution

Phase-14 v1.4 將跨頁媒體呈現改為保留照片與影片原比例，並為旅行頁建立更明確的照片預覽與完整相簿入口。Travel project 頁面會把 Level 1 改成主題感更強的漸層標題區，Level 2 改成區塊內的順序內容，Level 3 保留小型圓角卡片作為次層內容；每日行程的 Level 2 標題會拆成 Day、日期、單日 subtitle 三列。互動席位會支援 comment、thumb-up、thumb-down 逐項開關，未設定時維持既有全開行為。

## User Stories

1. As a family visitor, I want travel photos to keep their original aspect ratio, so that people and scenery are not cropped out.
2. As a family visitor, I want blog, timeline, member, and travel media to share the same no-crop behavior, so that the site feels consistent.
3. As a family visitor, I want a single photo to appear large enough, so that the page does not feel empty beside it.
4. As a family visitor, I want several photos to form a composed preview, so that I can understand the trip atmosphere quickly.
5. As a family visitor, I want a Show all photos entry when a travel project has more photos, so that I can browse the complete gallery separately.
6. As a family visitor, I want the complete travel gallery to preserve photo proportions, so that family memories remain faithful to the original media.
7. As a travel planner, I want Level 1 travel section titles to look like major themes, so that the page hierarchy is easy to scan.
8. As a travel planner, I want Level 1 descriptions to appear under the title when present, so that important context is not buried in cards.
9. As a travel planner, I want Level 2 content to flow inside the Level 1 section without another rounded card, so that the page reads as one continuous itinerary.
10. As a travel planner, I want Level 3 content to remain visually nested, so that supporting details still feel subordinate.
11. As a travel planner, I want daily itinerary headings split into Day, date, and subtitle, so that the daily plan can be scanned at a glance.
12. As a travel planner, I want the daily title typography to remain polished on desktop and mobile, so that the page still feels designed rather than mechanical.
13. As a family member, I want each content module to control whether comments are open, so that not every section needs a discussion box.
14. As a family member, I want each content module to control whether thumb-up is open, so that lightweight approval can be enabled only where useful.
15. As a family member, I want each content module to control whether thumb-down is open, so that decision-making sections can allow disagreement while narrative sections stay calm.
16. As a site maintainer, I want old travel sections without interaction settings to keep existing behavior, so that previous content does not silently lose participation features.
17. As a site maintainer, I want the interaction settings to be optional and additive, so that existing records do not require manual cleanup.
18. As a product owner, I want this work to stay within the existing travel and media architecture, so that Phase-14 improves presentation without rebuilding the data model.
19. As a product owner, I want the implementation to be testable at the shared rendering seams, so that future travel content keeps the same behavior.
20. As a family visitor using mobile, I want the media grid and titles to collapse cleanly, so that the page remains readable on small screens.

## Implementation Decisions

- Use the shared media rendering component as the cross-page no-crop control point, because member profiles, blog posts, timeline events, and travel pages already route through that renderer.
- Add a travel photo preview module and a full travel photo gallery experience, both backed by existing Travel project media relationships.
- Keep the travel detail route as the main narrative page and add a separate full gallery surface for complete photo browsing.
- Preserve existing fallback behavior when media is missing, using the established image fallback visual system.
- Change Travel Level 1 presentation from a dark rounded card into a gradient title treatment with optional descriptive copy beneath it.
- Change Travel Level 2 source sections from rounded cards into ordered content sections within the Level 1 block.
- Keep Travel Level 3 as a rounded nested unit, because it communicates supporting detail rather than main sequence.
- Parse daily Level 2 headings into Day, date, and subtitle rows at render time, so existing content-source headings can benefit without manual rewriting.
- Add optional per-section interaction settings for comment, thumb-up, and thumb-down.
- Default unset interaction settings to enabled, preserving existing behavior for already seeded or CMS-created source sections.
- Use an additive nullable/defaulted Payload migration rather than replacing existing records.
- Keep data reads inside the existing data layer and avoid direct Payload Local API calls from frontend components.

## Testing Decisions

- Test external rendering behavior rather than implementation details: no-crop media output, Level 1 visual treatment, daily title row rendering, full-gallery link behavior, and disabled interaction slot behavior.
- Prefer the existing travel detail rendering seam because it covers source-section hierarchy, section media, daily headings, and interaction placement in one place.
- Keep seed-content coverage active to ensure new optional interaction fields do not break existing content-source parsing.
- Run TypeScript after Payload type generation to prove schema, generated types, route components, and feature components stay aligned.
- Use the existing project validation commands before completion: focused travel render test, seed-content test, typecheck, diff check, and production build.

## Out of Scope

- Replacing Cloudflare R2 or media storage behavior.
- Introducing Vercel Blob.
- Rewriting travel source parsing beyond optional interaction fields.
- Creating a new comment or reaction collection.
- Applying production database migrations without explicit deployment approval.
- Redesigning unrelated family lobby, blog index, member copywriting, or timeline data behavior beyond shared no-crop media rendering.

## Further Notes

This PRD covers Issue #40 and Issue #41 under Phase-14 v1.4. The interaction settings require a Payload schema/type/migration update, but the migration is additive and keeps existing sections enabled by default.
