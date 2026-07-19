import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    do $$
    declare
      missing_legacy_tables integer;
      legacy_projects integer;
      plan_records integer;
      memory_records integer;
      route_identities integer;
      legacy_media_refs integer;
      shadow_media_refs integer;
      legacy_timeline_refs integer;
      shadow_timeline_refs integer;
      legacy_home_refs integer;
      shadow_home_refs integer;
      invalid_relationship_mappings integer;
    begin
      select count(*) into missing_legacy_tables
      from unnest(array[
        'travel_projects_party', 'travel_projects_party_locales',
        'travel_projects_flights', 'travel_projects_flights_locales',
        'travel_projects_rail_segments', 'travel_projects_rail_segments_locales',
        'travel_projects_lodgings', 'travel_projects_lodgings_locales',
        'travel_projects_cabin_assignments', 'travel_projects_cabin_assignments_locales',
        'travel_projects_daily_itinerary_segments', 'travel_projects_daily_itinerary_segments_locales',
        'travel_projects_daily_itinerary', 'travel_projects_daily_itinerary_locales',
        'travel_projects_food_recommendations', 'travel_projects_food_recommendations_locales',
        'travel_projects_cost_items', 'travel_projects_cost_items_locales',
        'travel_projects_optional_activities', 'travel_projects_optional_activities_locales',
        'travel_projects_reminders_items', 'travel_projects_reminders_items_locales',
        'travel_projects_reminders', 'travel_projects_reminders_locales',
        'travel_projects_source_sections_links', 'travel_projects_source_sections_links_locales',
        'travel_projects_source_sections', 'travel_projects_source_sections_locales',
        'travel_projects_external_videos', 'travel_projects_external_videos_locales',
        'travel_projects_locales', 'travel_projects_rels', 'travel_projects'
      ]) as expected(table_name)
      where to_regclass('public.' || expected.table_name) is null;

      if missing_legacy_tables <> 0 then
        raise exception 'Phase 17 cleanup refused: % legacy tables are absent', missing_legacy_tables;
      end if;

      select count(*) into legacy_projects from travel_projects;
      select count(*) into plan_records from travel_plans;
      select count(*) into memory_records from travel_memories;
      select count(*) into route_identities from travel_route_identities;
      select count(*) into legacy_media_refs from media where related_travel_id is not null;
      select count(*) into shadow_media_refs
        from media_rels
        where path = 'relatedTravelRecord'
          and (travel_plans_id is not null or travel_memories_id is not null);
      select count(*) into legacy_timeline_refs from timeline_events where related_travel_id is not null;
      select count(*) into shadow_timeline_refs
        from timeline_events_rels
        where path = 'relatedTravelRecord'
          and (travel_plans_id is not null or travel_memories_id is not null);
      select count(*) into legacy_home_refs from home_config where featured_travel_id is not null;
      select count(*) into shadow_home_refs
        from home_config_rels
        where path = 'featuredTravelRecord'
          and (travel_plans_id is not null or travel_memories_id is not null);
      select count(*) into invalid_relationship_mappings from (
        select media.id from media
          join travel_projects legacy on legacy.id = media.related_travel_id
          where media.related_travel_id is not null and not exists (
            select 1 from media_rels shadow
              left join travel_plans plan on plan.id = shadow.travel_plans_id
              left join travel_memories memory on memory.id = shadow.travel_memories_id
              where shadow.parent_id = media.id and shadow.path = 'relatedTravelRecord'
                and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
                  or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
          )
        union all
        select timeline_events.id from timeline_events
          join travel_projects legacy on legacy.id = timeline_events.related_travel_id
          where timeline_events.related_travel_id is not null and not exists (
            select 1 from timeline_events_rels shadow
              left join travel_plans plan on plan.id = shadow.travel_plans_id
              left join travel_memories memory on memory.id = shadow.travel_memories_id
              where shadow.parent_id = timeline_events.id and shadow.path = 'relatedTravelRecord'
                and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
                  or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
          )
        union all
        select home_config.id from home_config
          join travel_projects legacy on legacy.id = home_config.featured_travel_id
          where home_config.featured_travel_id is not null and not exists (
            select 1 from home_config_rels shadow
              left join travel_plans plan on plan.id = shadow.travel_plans_id
              left join travel_memories memory on memory.id = shadow.travel_memories_id
              where shadow.parent_id = home_config.id and shadow.path = 'featuredTravelRecord'
                and ((legacy.status = 'planning' and plan.slug = legacy.slug and shadow.travel_memories_id is null)
                  or (legacy.status = 'completed' and memory.slug = legacy.slug and shadow.travel_plans_id is null))
          )
      ) invalid;

      if row(legacy_projects, plan_records, memory_records, route_identities) <> row(5, 2, 3, 5) then
        raise exception 'Phase 17 cleanup refused: travel inventory drifted (legacy %, plans %, memories %, identities %)',
          legacy_projects, plan_records, memory_records, route_identities;
      end if;
      if row(legacy_media_refs, shadow_media_refs, legacy_timeline_refs, shadow_timeline_refs, legacy_home_refs, shadow_home_refs)
        <> row(12, 12, 2, 2, 1, 1) then
        raise exception 'Phase 17 cleanup refused: relationship inventory drifted (media %/%, timeline %/%, home %/%)',
          legacy_media_refs, shadow_media_refs, legacy_timeline_refs, shadow_timeline_refs, legacy_home_refs, shadow_home_refs;
      end if;
      if invalid_relationship_mappings <> 0 then
        raise exception 'Phase 17 cleanup refused: % legacy relationships do not match their new owner and canonical slug',
          invalid_relationship_mappings;
      end if;
    end $$;

    alter table "timeline_events" drop constraint "timeline_events_related_travel_id_travel_projects_id_fk";
    alter table "media" drop constraint "media_related_travel_id_travel_projects_id_fk";
    alter table "payload_locked_documents_rels" drop constraint "payload_locked_documents_rels_travel_projects_fk";
    alter table "home_config" drop constraint "home_config_featured_travel_id_travel_projects_id_fk";

    drop index "timeline_events_related_travel_idx";
    drop index "media_related_travel_idx";
    drop index "payload_locked_documents_rels_travel_projects_id_idx";
    drop index "home_config_featured_travel_idx";

    alter table "timeline_events" drop column "related_travel_id";
    alter table "media" drop column "related_travel_id";
    alter table "payload_locked_documents_rels" drop column "travel_projects_id";
    alter table "home_config" drop column "featured_travel_id";

    drop table
      "travel_projects_party", "travel_projects_party_locales",
      "travel_projects_flights", "travel_projects_flights_locales",
      "travel_projects_rail_segments", "travel_projects_rail_segments_locales",
      "travel_projects_lodgings", "travel_projects_lodgings_locales",
      "travel_projects_cabin_assignments", "travel_projects_cabin_assignments_locales",
      "travel_projects_daily_itinerary_segments", "travel_projects_daily_itinerary_segments_locales",
      "travel_projects_daily_itinerary", "travel_projects_daily_itinerary_locales",
      "travel_projects_food_recommendations", "travel_projects_food_recommendations_locales",
      "travel_projects_cost_items", "travel_projects_cost_items_locales",
      "travel_projects_optional_activities", "travel_projects_optional_activities_locales",
      "travel_projects_reminders_items", "travel_projects_reminders_items_locales",
      "travel_projects_reminders", "travel_projects_reminders_locales",
      "travel_projects_source_sections_links", "travel_projects_source_sections_links_locales",
      "travel_projects_source_sections", "travel_projects_source_sections_locales",
      "travel_projects_external_videos", "travel_projects_external_videos_locales",
      "travel_projects_locales", "travel_projects_rels", "travel_projects";

    drop type "public"."enum_travel_projects_status";
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error(
    'Phase 17 legacy cleanup cannot reconstruct deleted travel data. Restore the verified pre-cleanup database backup instead.',
  )
}
