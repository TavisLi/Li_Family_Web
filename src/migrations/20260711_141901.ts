import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects" ADD COLUMN "source_metadata_source_file" varchar;
  ALTER TABLE "travel_projects" ADD COLUMN "source_metadata_source_hash" varchar;
  ALTER TABLE "travel_projects" ADD COLUMN "source_metadata_parser_version" varchar;
  ALTER TABLE "travel_projects" ADD COLUMN "source_metadata_last_imported_at" timestamp(3) with time zone;
  ALTER TABLE "travel_projects" ADD COLUMN "source_metadata_base_projection" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_projects" DROP COLUMN "source_metadata_source_file";
  ALTER TABLE "travel_projects" DROP COLUMN "source_metadata_source_hash";
  ALTER TABLE "travel_projects" DROP COLUMN "source_metadata_parser_version";
  ALTER TABLE "travel_projects" DROP COLUMN "source_metadata_last_imported_at";
  ALTER TABLE "travel_projects" DROP COLUMN "source_metadata_base_projection";`)
}
