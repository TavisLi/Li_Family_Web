import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_travel_memories_story_sections_role" AS ENUM(
      'featured-memory',
      'travel-reflection',
      'unforgettable-day',
      'family-story',
      'additional-information'
    );
    CREATE TYPE "public"."enum__travel_memories_v_version_story_sections_role" AS ENUM(
      'featured-memory',
      'travel-reflection',
      'unforgettable-day',
      'family-story',
      'additional-information'
    );
    ALTER TABLE "travel_memories_story_sections"
      ADD COLUMN "role" "enum_travel_memories_story_sections_role";
    ALTER TABLE "_travel_memories_v_version_story_sections"
      ADD COLUMN "role" "enum__travel_memories_v_version_story_sections_role";
    ALTER TABLE "travel_memory_days_moments_locales"
      ADD COLUMN "transport" varchar;
    ALTER TABLE "_travel_memory_days_v_version_moments_locales"
      ADD COLUMN "transport" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_travel_memory_days_v_version_moments_locales" DROP COLUMN "transport";
    ALTER TABLE "travel_memory_days_moments_locales" DROP COLUMN "transport";
    ALTER TABLE "_travel_memories_v_version_story_sections" DROP COLUMN "role";
    ALTER TABLE "travel_memories_story_sections" DROP COLUMN "role";
    DROP TYPE "public"."enum__travel_memories_v_version_story_sections_role";
    DROP TYPE "public"."enum_travel_memories_story_sections_role";
  `)
}
