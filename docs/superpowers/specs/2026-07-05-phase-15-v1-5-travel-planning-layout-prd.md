## Problem Statement

Travel project planning pages already contain the correct published content, but the rendering interface still made some source bodies look inconsistent. Level 1 body copy could appear differently between the travel war room and reminders, short Level 2 and Level 3 reminder details did not always use desktop horizontal space well, and long planning advice could wrap too aggressively despite enough page width. At the same time, planning travel seed import had started to duplicate display data that can be derived from Markdown headings, making future planning travel records harder to maintain.

## Solution

Phase 15 v1.5 deepens the Travel project source-section renderer so the same source body interface can choose the correct layout for different content blocks: complex tables and long advice use full width, while short notes and simple low-density tables can remain in a desktop two-column scan pattern. The phase also reduces future planning travel data redundancy by keeping backward-compatible Payload fields but no longer writing derived daily display values during seed import. A planning travel Markdown template gives future trips a repeatable source shape for seed import or Payload Admin entry.

## User Stories

1. As a family member planning a trip, I want short Level 2 and Level 3 reminder details to use two columns on PC and Mac when space is available, so that the page is easier to scan.
2. As a family member planning a trip, I want long advice paragraphs to use full width, so that important planning recommendations do not wrap awkwardly.
3. As a family member planning a trip, I want Level 1 body copy to feel consistent between the travel war room and reminders, so that the page hierarchy is predictable.
4. As a family member reviewing a transportation decision, I want comparison text to stay readable, so that I can understand tradeoffs between options quickly.
5. As a family member reviewing simple cost or lodging tables, I want compact tables to use two desktop columns when the content remains readable, so that the page does not waste horizontal space.
6. As a product owner, I want the Travel project renderer to fix these layout issues through one shared seam, so that future planning trips inherit the behavior.
7. As a site maintainer, I want seed import to avoid writing display data that can be derived from headings, so that planning travel records have less redundant data.
8. As a site maintainer, I want existing Payload records to stay compatible, so that old planning travel pages do not require a destructive migration.
9. As a site maintainer, I want a planning travel Markdown template, so that future planning trips can be added through content-source with fewer parser mistakes.
10. As a site maintainer, I want the template to match the existing Travel project catalog and seed-import contract, so that content-source and published content stay aligned.
11. As a product owner, I want this work to avoid unrelated database or Payload changes, so that the phase stays focused on Issue #47 through Issue #50.
12. As a reviewer, I want regression tests at the shared Travel rendering seam, so that the behavior is proven without testing implementation details.
13. As a reviewer, I want seed-content regression coverage, so that future seed imports do not reintroduce redundant daily display fields.

## Implementation Decisions

- Use the existing Travel source-section renderer as the primary module and test seam for visual issues across Travel project planning pages.
- Keep the SourceBody interface small and place block layout decisions inside the module implementation.
- Treat complex or dense tables as full-width blocks because they need horizontal scan space.
- Allow simple two-column, low-row-count tables to remain eligible for desktop two-column section layout when they do not create awkward wrapping or excessive density.
- Treat long paragraphs, URL-heavy text, and comparison advice as full-width blocks because they become difficult to read in half-width columns.
- Keep short Level 2 sections, nested Level 3 child sections, short paragraphs, and short list groups eligible for two-column desktop layout.
- Keep orphaned short sections full-width when they cannot pair cleanly with a neighboring compact section.
- Apply the same narrow explanatory body treatment to Level 1 reminder introductions and regular Level 1 introductions, while preserving their different light and dark visual tones.
- Keep existing optional Payload fields for daily display values to preserve backward compatibility with published content.
- Stop writing derived daily display values during seed import; the renderer can derive day, date, and subtitle from the heading when explicit values are absent.
- Do not create a destructive migration to drop existing fields or existing data in this phase.
- Add a planning travel Markdown template that can be used as the starting point for future planning travel seed content.
- Keep all frontend data access through the existing data layer; this phase does not introduce direct Payload Local API access from frontend modules.

## Testing Decisions

- Test the Travel renderer through static render output because that is the highest existing seam for source-section hierarchy, body layout, media, daily titles, and interaction seats.
- Test that long transportation advice remains visible and receives full-width layout behavior.
- Test that short Level 2 and nested Level 3 reminder sections are eligible for PC/Mac two-column layout without reintroducing internal two-column wrapping inside compact cards.
- Test that Level 1 body treatments are present for both the regular planning group and the reminder group.
- Test seed-content parsing to ensure planning travel source sections no longer emit derived daily display fields.
- Preserve existing seed-content tests that prove planning trips retain flights, lodgings, daily itinerary, source sections, reminders, costs, foods, and optional activities.
- Run the standard verification set for this scope: focused Travel render test, seed-content test, TypeScript, production build, and git diff check.

## Out of Scope

- Dropping Payload columns or deleting existing production data.
- Applying a production database migration.
- Replacing the TravelProjects collection with a new collection.
- Reworking completed travel gallery behavior.
- Changing Cloudflare R2 media storage.
- Redesigning unrelated family lobby, member, blog, timeline, bucket list, or wrapped routes.

## Further Notes

This PRD covers Issue #47, Issue #48, Issue #49, and the safe first slice of Issue #50. The database architecture decision is intentionally conservative: reduce new redundancy at the seed import seam while preserving existing published records and optional Payload fields until a separate destructive cleanup is explicitly approved.
