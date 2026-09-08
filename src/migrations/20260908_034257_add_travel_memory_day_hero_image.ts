import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "travel_memory_days" ADD COLUMN "daily_hero_image_id" integer;
    ALTER TABLE "_travel_memory_days_v" ADD COLUMN "version_daily_hero_image_id" integer;
    ALTER TABLE "travel_memory_days" ADD CONSTRAINT "travel_memory_days_daily_hero_image_id_media_id_fk" FOREIGN KEY ("daily_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_travel_memory_days_v" ADD CONSTRAINT "_travel_memory_days_v_version_daily_hero_image_id_media_id_fk" FOREIGN KEY ("version_daily_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "travel_memory_days_daily_hero_image_idx" ON "travel_memory_days" USING btree ("daily_hero_image_id");
    CREATE INDEX "_travel_memory_days_v_version_version_daily_hero_image_idx" ON "_travel_memory_days_v" USING btree ("version_daily_hero_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "travel_memory_days" DROP CONSTRAINT "travel_memory_days_daily_hero_image_id_media_id_fk";
    ALTER TABLE "_travel_memory_days_v" DROP CONSTRAINT "_travel_memory_days_v_version_daily_hero_image_id_media_id_fk";
    DROP INDEX "travel_memory_days_daily_hero_image_idx";
    DROP INDEX "_travel_memory_days_v_version_version_daily_hero_image_idx";
    ALTER TABLE "travel_memory_days" DROP COLUMN "daily_hero_image_id";
    ALTER TABLE "_travel_memory_days_v" DROP COLUMN "version_daily_hero_image_id";
  `)
}
