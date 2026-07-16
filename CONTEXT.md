# Web Li Family Portal

Web Li is a single family-portal context: it preserves family identity, shared memories, travel planning, writing, and future aspirations while presenting only the appropriate material to each visitor.

## Access and people

**Visitor**:
A person viewing the public experience without a verified family session.
_Avoid_: anonymous family user, guest member

**Family member**:
A person represented by a family profile who may also have a user account for private participation.
_Avoid_: profile, account, visitor

**Family mode**:
The authenticated viewing state that permits access to family-only content and participation.
_Avoid_: private page, admin mode

**Public mode**:
The visitor-facing experience that contains only content intentionally available outside the family.
_Avoid_: logged-out family mode, preview mode

## Source and published content

**Content source**:
The versioned Markdown and asset material under `content-source/` from which structured family content is prepared.
_Avoid_: runtime database, published record

**Seed import**:
The repeatable translation of approved content-source material into runtime records and media relationships.
_Avoid_: manual copy, one-off migration

**Published content**:
The runtime record that the application reads after source material has been imported or edited in the CMS.
_Avoid_: Markdown source, static mock data

**Media asset**:
A photo or external video reference associated with a family member, travel project, post, timeline event, or annual recap.
_Avoid_: local image path, page decoration

## Family experiences

**Family lobby**:
The shared home experience that introduces the family and links to its public and family-only spaces.
_Avoid_: landing page, dashboard

**Member profile**:
The narrative space for one family member's identity, interests, milestones, and media.
_Avoid_: user account, résumé page

**Blog post**:
A dated family-authored article with an author, categories, tags, content, and optional family-only visibility.
_Avoid_: source Markdown article, comment thread

**Timeline event**:
A dated family-memory entry, optionally linked to a travel project, blog post, members, or a completed bucket item.
_Avoid_: generic activity log, bucket item

**Bucket item**:
A shared family aspiration that progresses from the wish pool through in progress to completed.
_Avoid_: task, timeline event

**Annual Wrapped**:
The seasonal, family-only summary of a particular year's shared activity and memories.
_Avoid_: timeline, dashboard report

## Travel

**Travel catalog**:
The complete set of travel projects declared in `docs/travel-projects.md` and their corresponding travel source material.
_Avoid_: selected trips, gallery list

**Travel project**:
One family journey with a stable identity, schedule, people, content, media, and either planning or completed status.
_Avoid_: trip page, itinerary file

**Planning travel**:
A travel-planning workspace used to review, revise, and decide a future journey. It belongs to the planning domain and does not become completed travel by switching the same record's status.
_Avoid_: draft page, incomplete completed travel, future completed travel

**Planning section**:
The ordered, anchor-addressable unit of planning content that preserves its display labels, body, links, media, and independent comment, thumb-up, and thumb-down settings. It is the canonical content unit of a planning travel; derived flight, lodging, and itinerary projections are not automatically part of the planning domain.
_Avoid_: source section number, legacy structured projection, itinerary row

**Travel planning stage**:
The lobby presentation state of a planning travel: active planning while its travel time has not passed, or archived planning after its travel time has passed. Archived planning remains the original plan record and does not become completed travel.
_Avoid_: early idea stage, completed status, completed memory

**Archived travel plan**:
A planning travel whose travel time has passed and which is retained as a historical plan archive. The travel lobby labels this section `過往規劃` / `Archived Plans`; the state may be derived from the travel end date when no manual archive override is required.
_Avoid_: pre-planning idea, completed travel, travel memory

**Completed travel**:
A travel-memory record created for post-trip documentation, photographs, reflection, and sharing. It may reference an originating planning travel but is a separate content record and page experience.
_Avoid_: archived planning travel, planning status, historical page

**Canonical travel slug**:
The stable identifier shared by a travel project's route, source mapping, and travel-specific asset folder.
_Avoid_: display title, filename-only slug

**Travel interaction target**:
A stable, scoped part of a travel project that can receive family comments or reactions.
_Avoid_: page comment, free-form anchor
