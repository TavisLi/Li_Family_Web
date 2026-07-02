import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects_source_sections_locales" ADD COLUMN IF NOT EXISTS "display_day" varchar;
  ALTER TABLE "travel_projects_source_sections_locales" ADD COLUMN IF NOT EXISTS "display_date" varchar;
  ALTER TABLE "travel_projects_source_sections_locales" ADD COLUMN IF NOT EXISTS "display_subtitle" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects_source_sections_locales" DROP COLUMN IF EXISTS "display_day";
  ALTER TABLE "travel_projects_source_sections_locales" DROP COLUMN IF EXISTS "display_date";
  ALTER TABLE "travel_projects_source_sections_locales" DROP COLUMN IF EXISTS "display_subtitle";`)
}
