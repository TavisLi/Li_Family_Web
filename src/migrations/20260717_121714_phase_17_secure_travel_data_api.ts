import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export const phase17TravelDataApiSecurityMigrationName =
  '20260717_121714_phase_17_secure_travel_data_api'

export const phase17TravelDataApiProtectedTables = [
  '_travel_memories_v',
  '_travel_memories_v_locales',
  '_travel_memories_v_rels',
  '_travel_memories_v_version_daily_highlights',
  '_travel_memories_v_version_daily_highlights_locales',
  '_travel_memories_v_version_daily_highlights_segments',
  '_travel_memories_v_version_daily_highlights_segments_locales',
  '_travel_memories_v_version_external_videos',
  '_travel_memories_v_version_external_videos_locales',
  '_travel_memories_v_version_guest_participants',
  '_travel_memories_v_version_guest_participants_locales',
  '_travel_memories_v_version_reminders',
  '_travel_memories_v_version_reminders_items',
  '_travel_memories_v_version_reminders_items_locales',
  '_travel_memories_v_version_reminders_locales',
  '_travel_memories_v_version_story_sections',
  '_travel_memories_v_version_story_sections_links',
  '_travel_memories_v_version_story_sections_links_locales',
  '_travel_memories_v_version_story_sections_locales',
  '_travel_memories_v_version_travel_ledger_flights',
  '_travel_memories_v_version_travel_ledger_flights_locales',
  '_travel_memories_v_version_travel_ledger_lodgings',
  '_travel_memories_v_version_travel_ledger_lodgings_locales',
  '_travel_plans_v',
  '_travel_plans_v_locales',
  '_travel_plans_v_rels',
  '_travel_plans_v_version_guest_participants',
  '_travel_plans_v_version_guest_participants_locales',
  '_travel_plans_v_version_planning_sections',
  '_travel_plans_v_version_planning_sections_links',
  '_travel_plans_v_version_planning_sections_links_locales',
  '_travel_plans_v_version_planning_sections_locales',
  'home_config_rels',
  'media_rels',
  'payload_locked_documents_rels',
  'timeline_events_rels',
  'travel_memories',
  'travel_memories_daily_highlights',
  'travel_memories_daily_highlights_locales',
  'travel_memories_daily_highlights_segments',
  'travel_memories_daily_highlights_segments_locales',
  'travel_memories_external_videos',
  'travel_memories_external_videos_locales',
  'travel_memories_guest_participants',
  'travel_memories_guest_participants_locales',
  'travel_memories_locales',
  'travel_memories_rels',
  'travel_memories_reminders',
  'travel_memories_reminders_items',
  'travel_memories_reminders_items_locales',
  'travel_memories_reminders_locales',
  'travel_memories_story_sections',
  'travel_memories_story_sections_links',
  'travel_memories_story_sections_links_locales',
  'travel_memories_story_sections_locales',
  'travel_memories_travel_ledger_flights',
  'travel_memories_travel_ledger_flights_locales',
  'travel_memories_travel_ledger_lodgings',
  'travel_memories_travel_ledger_lodgings_locales',
  'travel_plans',
  'travel_plans_guest_participants',
  'travel_plans_guest_participants_locales',
  'travel_plans_locales',
  'travel_plans_planning_sections',
  'travel_plans_planning_sections_links',
  'travel_plans_planning_sections_links_locales',
  'travel_plans_planning_sections_locales',
  'travel_plans_rels',
  'travel_route_identities',
  'travel_route_identities_rels',
] as const

function quotedTable(table: string) {
  return `"public"."${table.replaceAll('"', '""')}"`
}

export const phase17TravelDataApiSecurityUpSQL = phase17TravelDataApiProtectedTables
  .flatMap((table) => [
    `ALTER TABLE ${quotedTable(table)} ENABLE ROW LEVEL SECURITY;`,
    `REVOKE ALL PRIVILEGES ON TABLE ${quotedTable(table)} FROM anon, authenticated;`,
  ])
  .join('\n')

export const phase17TravelDataApiSecurityDownSQL = phase17TravelDataApiProtectedTables
  .flatMap((table) => [
    `ALTER TABLE ${quotedTable(table)} DISABLE ROW LEVEL SECURITY;`,
    `GRANT ALL PRIVILEGES ON TABLE ${quotedTable(table)} TO anon, authenticated;`,
  ])
  .join('\n')

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(phase17TravelDataApiSecurityUpSQL))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(phase17TravelDataApiSecurityDownSQL))
}
