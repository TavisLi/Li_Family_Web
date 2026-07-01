import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects_source_sections" ADD COLUMN "enable_comments" boolean DEFAULT true;
  ALTER TABLE "travel_projects_source_sections" ADD COLUMN "enable_thumbs_up" boolean DEFAULT true;
  ALTER TABLE "travel_projects_source_sections" ADD COLUMN "enable_thumbs_down" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects_source_sections" DROP COLUMN "enable_comments";
  ALTER TABLE "travel_projects_source_sections" DROP COLUMN "enable_thumbs_up";
  ALTER TABLE "travel_projects_source_sections" DROP COLUMN "enable_thumbs_down";`)
}
