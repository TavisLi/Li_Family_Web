import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "home_config_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "travel_plans_id" integer,
    "travel_memories_id" integer
  );

  ALTER TABLE "timeline_events_rels" ADD COLUMN "travel_plans_id" integer;
  ALTER TABLE "timeline_events_rels" ADD COLUMN "travel_memories_id" integer;
  ALTER TABLE "media_rels" ADD COLUMN "travel_plans_id" integer;
  ALTER TABLE "media_rels" ADD COLUMN "travel_memories_id" integer;
  ALTER TABLE "home_config_rels" ADD CONSTRAINT "home_config_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_config_rels" ADD CONSTRAINT "home_config_rels_travel_plans_fk" FOREIGN KEY ("travel_plans_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_config_rels" ADD CONSTRAINT "home_config_rels_travel_memories_fk" FOREIGN KEY ("travel_memories_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_config_rels_order_idx" ON "home_config_rels" USING btree ("order");
  CREATE INDEX "home_config_rels_parent_idx" ON "home_config_rels" USING btree ("parent_id");
  CREATE INDEX "home_config_rels_path_idx" ON "home_config_rels" USING btree ("path");
  CREATE INDEX "home_config_rels_travel_plans_id_idx" ON "home_config_rels" USING btree ("travel_plans_id");
  CREATE INDEX "home_config_rels_travel_memories_id_idx" ON "home_config_rels" USING btree ("travel_memories_id");
  ALTER TABLE "timeline_events_rels" ADD CONSTRAINT "timeline_events_rels_travel_plans_fk" FOREIGN KEY ("travel_plans_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "timeline_events_rels" ADD CONSTRAINT "timeline_events_rels_travel_memories_fk" FOREIGN KEY ("travel_memories_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_travel_plans_fk" FOREIGN KEY ("travel_plans_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_travel_memories_fk" FOREIGN KEY ("travel_memories_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "timeline_events_rels_travel_plans_id_idx" ON "timeline_events_rels" USING btree ("travel_plans_id");
  CREATE INDEX "timeline_events_rels_travel_memories_id_idx" ON "timeline_events_rels" USING btree ("travel_memories_id");
  CREATE INDEX "media_rels_travel_plans_id_idx" ON "media_rels" USING btree ("travel_plans_id");
  CREATE INDEX "media_rels_travel_memories_id_idx" ON "media_rels" USING btree ("travel_memories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "media_rels" WHERE "path" = 'relatedTravelRecord' LIMIT 1)
      OR EXISTS (SELECT 1 FROM "timeline_events_rels" WHERE "path" = 'relatedTravelRecord' LIMIT 1)
      OR EXISTS (SELECT 1 FROM "home_config_rels" WHERE "path" = 'featuredTravelRecord' LIMIT 1) THEN
      RAISE EXCEPTION 'Phase 17 cutover relationship rollback requires empty shadow relationships';
    END IF;
  END $$;
  ALTER TABLE "home_config_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "home_config_rels" CASCADE;
  ALTER TABLE "timeline_events_rels" DROP CONSTRAINT "timeline_events_rels_travel_plans_fk";

  ALTER TABLE "timeline_events_rels" DROP CONSTRAINT "timeline_events_rels_travel_memories_fk";

  ALTER TABLE "media_rels" DROP CONSTRAINT "media_rels_travel_plans_fk";

  ALTER TABLE "media_rels" DROP CONSTRAINT "media_rels_travel_memories_fk";

  DROP INDEX "timeline_events_rels_travel_plans_id_idx";
  DROP INDEX "timeline_events_rels_travel_memories_id_idx";
  DROP INDEX "media_rels_travel_plans_id_idx";
  DROP INDEX "media_rels_travel_memories_id_idx";
  ALTER TABLE "timeline_events_rels" DROP COLUMN "travel_plans_id";
  ALTER TABLE "timeline_events_rels" DROP COLUMN "travel_memories_id";
  ALTER TABLE "media_rels" DROP COLUMN "travel_plans_id";
  ALTER TABLE "media_rels" DROP COLUMN "travel_memories_id";`)
}
