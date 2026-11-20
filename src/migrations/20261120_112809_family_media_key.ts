import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "family_asset_key" varchar;
  CREATE UNIQUE INDEX "media_family_asset_key_idx" ON "media" USING btree ("family_asset_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $family_media$
   BEGIN
     IF EXISTS (SELECT 1 FROM "media" WHERE "family_asset_key" IS NOT NULL) THEN
       RAISE EXCEPTION 'Family Media access boundary still in use';
     END IF;
   END
   $family_media$;
   DROP INDEX "media_family_asset_key_idx";
  ALTER TABLE "media" DROP COLUMN "family_asset_key";`)
}
