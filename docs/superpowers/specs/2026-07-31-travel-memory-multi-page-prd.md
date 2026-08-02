## Problem Statement

Canonical GitHub record：[#73](https://github.com/TavisLi/Li_Family_Web/issues/73)（published 2026-08-02）。本檔保留為 Phase 19 implementation snapshot。

現行 Travel Memory 雖已與 Travel Plan 拆成獨立 aggregate，但前台仍以單一長頁承載旅行摘要、每日亮點、帳本、相簿、影片及完整 Markdown sections。固定卡片、缺乏日期導覽與重複內容讓資訊層次不清；超過六天的旅行在亮點區被截斷，照片與 YouTube 也沒有回到實際發生的日期與敘事位置。

`content-source` asset manifest 已可保存照片的 `day`、`time`、`location`、`sectionId` 與 `caption`，但目前 `sectionId` 被誤當成 Markdown section anchor 配對。海南 manifest 使用景點／事件 identity，Markdown parser 則產生另一套 heading anchor，導致 itinerary 照片沒有進入每日內容。Caption 最終主要被當成 Media `altText`，沒有成為讀者可見的照片說明。YouTube 影片則集中於旅行頁底部，與每日敘事脫節。

產品需要先以海南 Day 3 與 Day 8 的真實頁面驗證視覺與閱讀節奏，再決定正式資料表粒度，避免為尚未驗證的頁面結構提前鎖定 schema。三個 prototype 方向不再互相淘汰，而是成為每筆 Travel Memory 可獨立配置的正式呈現樣式。

## Solution

將一筆 Travel Memory 呈現為多頁旅行作品：

1. 旅行首頁負責封面、旅行脈絡、八日導覽、精選回憶與相簿入口。
2. 每日回憶頁保存當日完整故事、時間軸、照片、可見 caption、YouTube、餐食與住宿。
3. 相簿頁按日期、地點及敘事位置整理照片，並能返回所屬每日回憶。
4. 照片與 YouTube 都透過具穩定 identity 的 placement 放進每日 moment；媒體資產本身與它在某段故事中的 caption 分開管理。
5. 第一階段以本地、無 persistence 的 prototype 驗證三種正式呈現樣式。網站擁有者比較海南 Overview、Day 3、Day 8 與 Photos 後，才鎖定三種 renderer 的細節、Collection 粒度與 migration contract。
6. 後續若批准實作，仍以 Payload published content 為 runtime source of truth；`content-source` 只透過 Base／Source／Current reconciliation 進入正式資料。
7. 三種樣式共用同一組 Memory／Day／Moment／Placement 資料與 route-facing view models；切換樣式只改變呈現，不複製內容、改變 URL 或建立三套 schema。

## User Stories

1. As a 訪客, I want to understand the route and character of a trip from its landing page, so that I can choose where to start reading.
2. As a 訪客, I want to see all eight travel days, so that later days are not hidden by a fixed six-card limit.
3. As a 訪客, I want each day to have its own readable page, so that I do not need to scan one very long page.
4. As a 訪客, I want to move to the previous or next day, so that the trip reads like connected chapters.
5. As a 訪客, I want a clear way back to the Travel Memory landing page, so that a daily page is never a dead end.
6. As a 訪客, I want photographs to appear beside the event they document, so that visual and written memories reinforce each other.
7. As a 訪客, I want to read a visible caption under each meaningful photograph, so that the photograph has context beyond accessibility text.
8. As a 使用輔助科技的訪客, I want accurate alt text that is independent from editorial caption copy, so that the image remains understandable without conflating two purposes.
9. As a 訪客, I want YouTube videos to appear inside the corresponding daily moment, so that videos do not become an unrelated block at the bottom of the trip.
10. As a 訪客, I want an honest empty state when a day has no video, so that unrelated footage is never used as a substitute.
11. As a 訪客, I want invalid or unsupported YouTube URLs to fall back to a safe external link, so that the page does not render a broken or unsafe iframe.
12. As a 訪客, I want videos not to autoplay, so that reading remains calm and under my control.
13. As a 訪客, I want to browse photos by day and location, so that a large gallery remains navigable.
14. As a 訪客, I want to return from a gallery photo to its daily story, so that the archive and narrative stay connected.
15. As a mobile visitor, I want captions, timelines and media to remain readable without horizontal overflow, so that the daily story works on a phone.
16. As a Family member, I want family-only memories and their child content to remain private, so that new routes do not weaken the access boundary.
17. As an Administrator, I want to edit a daily story and its media placements without handling one giant Travel Memory form, so that content management remains understandable.
18. As an Administrator, I want the same photo or video to carry placement-specific copy, so that its homepage, gallery and daily-story uses need not share one caption.
19. As an Administrator, I want source imports to preserve Admin-only edits, so that improving manifests does not silently erase published changes.
20. As an Administrator, I want unmapped media reported instead of guessed, so that a wrong day or moment is never silently published.
21. As a maintainer, I want stable Memory, Day, Moment and Placement identities, so that reconciliation can compare arrays at item level.
22. As a maintainer, I want overview, day and gallery routes to request only their required view model, so that a page does not load the entire Memory aggregate.
23. As a maintainer, I want photos and YouTube to share a placement concept while keeping their asset-specific fields, so that narrative ordering has one interface.
24. As a maintainer, I want the first production migration to be additive, so that existing Travel Memory pages remain a rollback path.
25. As the website owner, I want every Travel Memory to select one of three supported presentation styles, so that different journeys can preserve an appropriate visual character without changing their content model.
26. As an Administrator, I want to change a Memory's presentation style in Payload, so that presentation is an explicit published configuration rather than a code deployment.
27. As a visitor, I want Overview, Daily chapter and Photos within one Memory to use a consistent style, so that the journey feels like one work.
28. As a maintainer, I want every style renderer to consume the same style-neutral view models, so that style choice cannot fork the schema or reconciliation path.
29. As a maintainer, I want a deterministic fallback for missing or invalid legacy style values, so that additive rollout does not break an existing Memory.
30. As the website owner, I want schema approval to happen after the prototype verdict, so that table structure follows the validated reading models.
31. As the website owner, I want Production schema, data backfill, runtime cutover and destructive cleanup treated as separate approvals, so that one approval cannot authorize all data risks.

## Implementation Decisions

- The prototype is a local-only, read-only surface. It uses real Hainan Day 3 and Day 8 photographs and copy but does not query Payload, write a database, seed content, deploy or publish GitHub Issues.
- The prototype validates three structurally different, formally supported presentation styles:
  - **Editorial journal** prioritises long-form reading, asymmetric whitespace and figure captions.
  - **Cinematic timeline** prioritises full-bleed scenes, time codes and a film-like daily sequence.
  - **Family scrapbook** prioritises family annotations, photo-back-note character and a warmer personal archive.
- Overview, Day 3, Day 8 and Photos remain switchable inside the same prototype route. The selected variant and view are encoded in URL query parameters so a review state can be shared locally.
- The canonical Payload field is proposed as `presentationStyle` on `travel-memories`, with the exact select values `editorial-journal`, `cinematic-timeline` and `family-scrapbook`.
- `presentationStyle` is Payload Admin-owned runtime configuration. It is deliberately excluded from `content-source` projection and Base／Source／Current reconciliation so a source import cannot overwrite an editorial presentation choice.
- Formal runtime uses an exhaustive renderer registry rather than dynamic component paths. All three renderers must support Overview, Daily chapter, Photos, visible captions, YouTube placements, access states and responsive states through the same style-neutral view models.
- The first migration remains additive and nullable. A missing or invalid value falls back deterministically to `editorial-journal`; the three current records receive explicit values only in the separately approved backfill. Making the field required, if still useful, is a later decision after read-back.
- Approved initial assignment:
  - `201307-hainan` → `family-scrapbook`, reflecting its historical family-album character and photo-led memories.
  - `202308-east-australia` → `cinematic-timeline`, reflecting its multi-city sequence, large media set and dated videos.
  - `202602-thailand-phuket` → `editorial-journal`, reflecting its detailed eight-day resort narrative and long-form reading rhythm.
- The website owner approved this initial assignment on 2026-08-02. The approval is a product configuration decision, not a Production write approval. Changing it later must not change routes, identities or stored narrative content.
- The Hainan source currently has no YouTube URL. The prototype therefore renders an explicit daily video placement and empty state rather than borrowing another trip's footage.
- The first formal implementation seam, if approved, will expose three route-facing interfaces: Travel Memory overview, one daily chapter, and a paginated/filterable gallery. Route modules will not call Payload directly.
- The candidate domain identities are:
  - Memory: canonical travel slug.
  - Day: stable `dayKey`, initially `day-01` style.
  - Moment: explicit semantic `momentKey`, based on the manifest's current event-like `sectionId`.
  - Placement: stable source-path identity for source-managed media, with an explicit generated or Admin-owned identity for CMS-created placements.
- `sectionId` is provisionally renamed to `momentId` in new source contracts. A compatibility parser may temporarily accept both, but the implementation must not compare it to an unrelated Markdown heading anchor.
- Media asset fields and narrative placement fields remain distinct:
  - Asset: file or YouTube URL, type, alt text, source path and technical metadata.
  - Placement: Memory, Day, Moment, role, visible caption, location, time and order.
- Photo and YouTube placements use the same ordering interface. YouTube embeds use the privacy-enhanced host, never autoplay, load lazily and fall back to a safe external link.
- The Day／Placement Persistence shape remains a decision gate after prototype review. The leading candidate is:
  - Keep `travel-memories` as the identity and landing-page aggregate.
  - Add independently readable `travel-memory-days`.
  - Add a placement model that can order photos and YouTube by Day and Moment.
- The prototype must not be promoted directly to production. After the visual-detail verdict, all three styles will be rewritten against formal data interfaces and tests; the prototype switcher will be deleted.
- Existing `galleryImages`, `itineraryImages`, `dailyHighlights`, `storySections[].mediaItems` and `externalVideos` remain transitional rollback evidence until an independently approved cleanup.
- Payload records remain the runtime source of truth. Source imports remain travel-only and use Base／Source／Current reconciliation.
- Child-route access must be derived from and enforced consistently with the owning Travel Memory. UI hiding is not sufficient.
- No common parent collection will be added above Travel Plan and Travel Memory; the accepted Plan／Memory separation remains intact.

## Testing Decisions

- Prototype verification is visual and behavioural rather than a production regression suite: all variant/view URLs render, controls update query parameters, real Day 3/Day 8 captions are visible, and mobile layouts have no horizontal overflow.
- Formal tests will render each of the three current Travel Memories with its assigned style and will exercise Overview, Daily chapter and Photos for every renderer.
- Missing and invalid `presentationStyle` values will prove the deterministic fallback without changing canonical URLs, metadata or access behaviour.
- Formal implementation tests will exercise the highest route-facing data interface rather than Payload query details.
- A Hainan reconciliation fixture will prove:
  - eight Day identities;
  - eleven itinerary media placements;
  - both Day 3 moments;
  - both Day 8 moments;
  - visible captions preserved separately from alt text;
  - zero silent unmatched-to-wrong-day assignments.
- A travel with real dated YouTube sources will prove video-to-Day and video-to-Moment placement, safe embed conversion, no autoplay and fallback behaviour.
- Existing travel seed reconciliation tests remain prior art for Base／Source／Current behaviour and stable item identity.
- Existing travel detail rendering tests remain prior art for public HTML, heading hierarchy and media behaviour.
- Access tests will cover public published Memory, family-only Memory, draft Memory and direct child-route access.
- Migration rehearsals will run on a disposable/local database before any Production approval package.
- Formal completion gates remain focused tests, generated Payload types when schema changes, build, TypeScript after build, `git diff --check`, Preview/browser QA and Production read-back where separately approved.

## Out of Scope

- Publishing or modifying GitHub Issues during the prototype approval.
- Preview or Production deployment.
- Production read-only inventory beyond already approved checks.
- Payload schema creation, migration generation or database mutation during prototype work.
- Travel Plan page redesign.
- Automatic conversion of a Travel Plan into a Travel Memory.
- A new common Travel parent collection.
- Maps, geocoding, GPS extraction or facial recognition.
- Uploading video files; videos remain external YouTube references.
- Automatically inventing a Day or Moment for unclassified media.
- Removing existing Travel Memory arrays or relationships.
- Reusing prototype code as final production code.
- Per-page style overrides within one Travel Memory; one Memory uses one coherent style across its routes.
- Source-managed presentation-style configuration.

## Further Notes

- All three visual directions are approved as supported styles. The remaining prototype verdict records the final tokens, hierarchy, media treatment and responsive behaviour of each style rather than selecting a single winner.
- The schema verdict for Day and Placement follows the page verdict. In particular, the team should decide whether a daily chapter needs independent draft/version lifecycle and whether placements deserve their own queryable collection or can remain embedded under Day. The style field itself does not require three data models.
- The first content proof remains Hainan Day 3 and Day 8 because both days have two semantically located itinerary photographs, distinct visual aspect ratios and sufficiently detailed source narrative.
- Issue granularity、YouTube 獨立 slice 與分段上線方向已獲批准；草案仍不是已發布的 tracker records，發布 GitHub Issues 需要另行明確批准。
