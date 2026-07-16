import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "travel_memories" LIMIT 1)
      OR EXISTS (SELECT 1 FROM "_travel_memories_v" LIMIT 1) THEN
      RAISE EXCEPTION 'Phase 17 Memory schema alignment requires empty target tables';
    END IF;
  END $$;
  ALTER TABLE "travel_memories_story_sections" ADD COLUMN "level" numeric DEFAULT 2;
  ALTER TABLE "travel_memories_story_sections" ADD COLUMN "interactions_comments_enabled" boolean DEFAULT true;
  ALTER TABLE "travel_memories_story_sections" ADD COLUMN "interactions_thumbs_up_enabled" boolean DEFAULT true;
  ALTER TABLE "travel_memories_story_sections" ADD COLUMN "interactions_thumbs_down_enabled" boolean DEFAULT true;
  ALTER TABLE "travel_memories_story_sections_locales" ADD COLUMN "display_day" varchar;
  ALTER TABLE "travel_memories_story_sections_locales" ADD COLUMN "display_date" varchar;
  ALTER TABLE "travel_memories_story_sections_locales" ADD COLUMN "display_subtitle" varchar;
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD COLUMN "level" numeric DEFAULT 2;
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD COLUMN "interactions_comments_enabled" boolean DEFAULT true;
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD COLUMN "interactions_thumbs_up_enabled" boolean DEFAULT true;
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD COLUMN "interactions_thumbs_down_enabled" boolean DEFAULT true;
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" ADD COLUMN "display_day" varchar;
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" ADD COLUMN "display_date" varchar;
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" ADD COLUMN "display_subtitle" varchar;
  ALTER TABLE "travel_memories_story_sections" DROP COLUMN "kind";
  ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "kind";
  DROP TYPE "public"."enum_travel_memories_story_sections_kind";
  DROP TYPE "public"."enum__travel_memories_v_version_story_sections_kind";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "travel_memories" LIMIT 1)
      OR EXISTS (SELECT 1 FROM "_travel_memories_v" LIMIT 1) THEN
      RAISE EXCEPTION 'Phase 17 Memory schema rollback requires empty target tables';
    END IF;
  END $$;
  CREATE TYPE "public"."enum_travel_memories_story_sections_kind" AS ENUM('overview', 'day', 'reflection', 'food', 'freeform');
  CREATE TYPE "public"."enum__travel_memories_v_version_story_sections_kind" AS ENUM('overview', 'day', 'reflection', 'food', 'freeform');
  ALTER TABLE "travel_memories_story_sections" ADD COLUMN "kind" "enum_travel_memories_story_sections_kind" DEFAULT 'freeform';
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD COLUMN "kind" "enum__travel_memories_v_version_story_sections_kind" DEFAULT 'freeform';
  ALTER TABLE "travel_memories_story_sections" DROP COLUMN "level";
  ALTER TABLE "travel_memories_story_sections" DROP COLUMN "interactions_comments_enabled";
  ALTER TABLE "travel_memories_story_sections" DROP COLUMN "interactions_thumbs_up_enabled";
  ALTER TABLE "travel_memories_story_sections" DROP COLUMN "interactions_thumbs_down_enabled";
  ALTER TABLE "travel_memories_story_sections_locales" DROP COLUMN "display_day";
  ALTER TABLE "travel_memories_story_sections_locales" DROP COLUMN "display_date";
  ALTER TABLE "travel_memories_story_sections_locales" DROP COLUMN "display_subtitle";
  ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "level";
  ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "interactions_comments_enabled";
  ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "interactions_thumbs_up_enabled";
  ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "interactions_thumbs_down_enabled";
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" DROP COLUMN "display_day";
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" DROP COLUMN "display_date";
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" DROP COLUMN "display_subtitle";`)
}
