import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."travel_geo_audience" AS ENUM('family', 'public');
  CREATE TABLE "geo_stops" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "stop_key" varchar,
    "geo_latitude" numeric,
    "geo_longitude" numeric,
    "geo_crs" varchar,
    "geo_provenance" varchar,
    "geo_original_c_r_s" varchar,
    "geo_approval_snapshot" varchar,
    "geo_approval_audience" "travel_geo_audience",
    "geo_approval_confirmed_by" varchar
  );

  CREATE TABLE "geo_stops_locales" (
    "geo_name" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_geo_stops_v" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "stop_key" varchar,
    "geo_latitude" numeric,
    "geo_longitude" numeric,
    "geo_crs" varchar,
    "geo_provenance" varchar,
    "geo_original_c_r_s" varchar,
    "geo_approval_snapshot" varchar,
    "geo_approval_audience" "travel_geo_audience",
    "geo_approval_confirmed_by" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_geo_stops_v_locales" (
    "geo_name" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  ALTER TABLE "travel_plans" ADD COLUMN "geo_access_revision" varchar;
  ALTER TABLE "_travel_plans_v" ADD COLUMN "version_geo_access_revision" varchar;
  ALTER TABLE "travel_memories" ADD COLUMN "geo_access_revision" varchar;
  ALTER TABLE "_travel_memories_v" ADD COLUMN "version_geo_access_revision" varchar;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_latitude" numeric;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_longitude" numeric;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_crs" varchar;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_provenance" varchar;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_original_c_r_s" varchar;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_approval_snapshot" varchar;
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_approval_audience" "travel_geo_audience";
  ALTER TABLE "travel_memory_days_moments" ADD COLUMN "geo_approval_confirmed_by" varchar;
  ALTER TABLE "travel_memory_days_moments_locales" ADD COLUMN "geo_name" varchar;
  ALTER TABLE "travel_memory_days" ADD COLUMN "geo_access_revision" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_latitude" numeric;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_longitude" numeric;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_crs" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_provenance" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_original_c_r_s" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_approval_snapshot" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_approval_audience" "travel_geo_audience";
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD COLUMN "geo_approval_confirmed_by" varchar;
  ALTER TABLE "_travel_memory_days_v_version_moments_locales" ADD COLUMN "geo_name" varchar;
  ALTER TABLE "_travel_memory_days_v" ADD COLUMN "version_geo_access_revision" varchar;
  ALTER TABLE "geo_stops" ADD CONSTRAINT "geo_stops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "geo_stops_locales" ADD CONSTRAINT "geo_stops_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."geo_stops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_geo_stops_v" ADD CONSTRAINT "_geo_stops_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v_version_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_geo_stops_v_locales" ADD CONSTRAINT "_geo_stops_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_geo_stops_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "geo_stops_order_idx" ON "geo_stops" USING btree ("_order");
  CREATE INDEX "geo_stops_parent_id_idx" ON "geo_stops" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "geo_stops_locales_locale_parent_id_unique" ON "geo_stops_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_geo_stops_v_order_idx" ON "_geo_stops_v" USING btree ("_order");
  CREATE INDEX "_geo_stops_v_parent_id_idx" ON "_geo_stops_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_geo_stops_v_locales_locale_parent_id_unique" ON "_geo_stops_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "geo_stops" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE "geo_stops" FROM PUBLIC, anon, authenticated;
  ALTER TABLE "geo_stops_locales" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE "geo_stops_locales" FROM PUBLIC, anon, authenticated;
  ALTER TABLE "_geo_stops_v" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE "_geo_stops_v" FROM PUBLIC, anon, authenticated;
  ALTER TABLE "_geo_stops_v_locales" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE "_geo_stops_v_locales" FROM PUBLIC, anon, authenticated;
  REVOKE ALL PRIVILEGES ON SEQUENCE "geo_stops_locales_id_seq" FROM PUBLIC, anon, authenticated;
  REVOKE ALL PRIVILEGES ON SEQUENCE "_geo_stops_v_id_seq" FROM PUBLIC, anon, authenticated;
  REVOKE ALL PRIVILEGES ON SEQUENCE "_geo_stops_v_locales_id_seq" FROM PUBLIC, anon, authenticated;
`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {

  // Empty-new-fields rollback only. Once new content/history exists, restore or
  // forward-fix requires a separately reviewed recovery plan.
  await db.execute(sql`LOCK TABLE "public"."_geo_stops_v", "public"."_geo_stops_v_locales", "public"."_travel_memories_v", "public"."_travel_memory_days_v", "public"."_travel_memory_days_v_version_moments", "public"."_travel_memory_days_v_version_moments_locales", "public"."_travel_plans_v", "public"."geo_stops", "public"."geo_stops_locales", "public"."travel_memories", "public"."travel_memory_days", "public"."travel_memory_days_moments", "public"."travel_memory_days_moments_locales", "public"."travel_plans" IN ACCESS EXCLUSIVE MODE NOWAIT;
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "geo_stops") OR
       EXISTS (SELECT 1 FROM "geo_stops_locales") OR
       EXISTS (SELECT 1 FROM "_geo_stops_v") OR
       EXISTS (SELECT 1 FROM "_geo_stops_v_locales") OR
       EXISTS (SELECT 1 FROM "travel_plans" WHERE "geo_access_revision" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_plans_v" WHERE "version_geo_access_revision" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memories" WHERE "geo_access_revision" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memories_v" WHERE "version_geo_access_revision" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_latitude" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_longitude" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_crs" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_provenance" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_original_c_r_s" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_approval_snapshot" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_approval_audience" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments" WHERE "geo_approval_confirmed_by" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days_moments_locales" WHERE "geo_name" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "travel_memory_days" WHERE "geo_access_revision" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_latitude" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_longitude" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_crs" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_provenance" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_original_c_r_s" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_approval_snapshot" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_approval_audience" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments" WHERE "geo_approval_confirmed_by" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v_version_moments_locales" WHERE "geo_name" IS NOT NULL) OR
       EXISTS (SELECT 1 FROM "_travel_memory_days_v" WHERE "version_geo_access_revision" IS NOT NULL) THEN
      RAISE EXCEPTION 'Geo down refused: preserve new data/history and use reviewed recovery';
    END IF;
  END $$;
   DROP TABLE "geo_stops" CASCADE;
  DROP TABLE "geo_stops_locales" CASCADE;
  DROP TABLE "_geo_stops_v" CASCADE;
  DROP TABLE "_geo_stops_v_locales" CASCADE;
  ALTER TABLE "travel_plans" DROP COLUMN "geo_access_revision";
  ALTER TABLE "_travel_plans_v" DROP COLUMN "version_geo_access_revision";
  ALTER TABLE "travel_memories" DROP COLUMN "geo_access_revision";
  ALTER TABLE "_travel_memories_v" DROP COLUMN "version_geo_access_revision";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_latitude";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_longitude";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_crs";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_provenance";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_original_c_r_s";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_approval_snapshot";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_approval_audience";
  ALTER TABLE "travel_memory_days_moments" DROP COLUMN "geo_approval_confirmed_by";
  ALTER TABLE "travel_memory_days_moments_locales" DROP COLUMN "geo_name";
  ALTER TABLE "travel_memory_days" DROP COLUMN "geo_access_revision";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_latitude";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_longitude";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_crs";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_provenance";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_original_c_r_s";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_approval_snapshot";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_approval_audience";
  ALTER TABLE "_travel_memory_days_v_version_moments" DROP COLUMN "geo_approval_confirmed_by";
  ALTER TABLE "_travel_memory_days_v_version_moments_locales" DROP COLUMN "geo_name";
  ALTER TABLE "_travel_memory_days_v" DROP COLUMN "version_geo_access_revision";
  DROP TYPE "public"."travel_geo_audience";`)
}
