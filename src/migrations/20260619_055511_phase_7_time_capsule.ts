import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_timeline_events_source_type" AS ENUM('manual', 'bucket-item', 'travel', 'post');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_bucket_items_status" AS ENUM('pool', 'in-progress', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_wrapped_snapshots_blocks_kind" AS ENUM('memory', 'travel', 'blog', 'wish');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_wrapped_snapshots_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "timeline_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "event_date" timestamp(3) with time zone NOT NULL,
      "year" numeric NOT NULL,
      "related_travel_id" integer,
      "related_post_id" integer,
      "source_type" "enum_timeline_events_source_type" DEFAULT 'manual' NOT NULL,
      "is_private" boolean DEFAULT true,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "timeline_events_locales" (
      "title" varchar NOT NULL,
      "summary" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "timeline_events_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer,
      "users_id" integer
    );

    CREATE TABLE IF NOT EXISTS "bucket_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "enum_bucket_items_status" DEFAULT 'pool' NOT NULL,
      "priority" numeric DEFAULT 3,
      "created_by_id" integer,
      "completed_by_id" integer,
      "completed_at" timestamp(3) with time zone,
      "target_date" timestamp(3) with time zone,
      "cover_image_id" integer,
      "is_private" boolean DEFAULT true,
      "timeline_event_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "bucket_items_locales" (
      "title" varchar NOT NULL,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots" (
      "id" serial PRIMARY KEY NOT NULL,
      "year" numeric NOT NULL,
      "status" "enum_wrapped_snapshots_status" DEFAULT 'draft' NOT NULL,
      "published_at" timestamp(3) with time zone,
      "hero_media_id" integer,
      "is_private" boolean DEFAULT true,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots_locales" (
      "summary" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots_stats" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots_stats_locales" (
      "label" varchar NOT NULL,
      "value" varchar NOT NULL,
      "note" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots_blocks" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "kind" "enum_wrapped_snapshots_blocks_kind" DEFAULT 'memory' NOT NULL,
      "accent" varchar
    );

    CREATE TABLE IF NOT EXISTS "wrapped_snapshots_blocks_locales" (
      "title" varchar NOT NULL,
      "body" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "timeline_events_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bucket_items_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "wrapped_snapshots_id" integer;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_related_travel_id_travel_projects_id_fk') THEN
        ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_related_travel_id_travel_projects_id_fk" FOREIGN KEY ("related_travel_id") REFERENCES "public"."travel_projects"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_related_post_id_posts_id_fk') THEN
        ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_locales_parent_id_fk') THEN
        ALTER TABLE "timeline_events_locales" ADD CONSTRAINT "timeline_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."timeline_events"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_rels_parent_fk') THEN
        ALTER TABLE "timeline_events_rels" ADD CONSTRAINT "timeline_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."timeline_events"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_rels_media_fk') THEN
        ALTER TABLE "timeline_events_rels" ADD CONSTRAINT "timeline_events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_events_rels_users_fk') THEN
        ALTER TABLE "timeline_events_rels" ADD CONSTRAINT "timeline_events_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bucket_items_created_by_id_users_id_fk') THEN
        ALTER TABLE "bucket_items" ADD CONSTRAINT "bucket_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bucket_items_completed_by_id_users_id_fk') THEN
        ALTER TABLE "bucket_items" ADD CONSTRAINT "bucket_items_completed_by_id_users_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bucket_items_cover_image_id_media_id_fk') THEN
        ALTER TABLE "bucket_items" ADD CONSTRAINT "bucket_items_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bucket_items_timeline_event_id_timeline_events_id_fk') THEN
        ALTER TABLE "bucket_items" ADD CONSTRAINT "bucket_items_timeline_event_id_timeline_events_id_fk" FOREIGN KEY ("timeline_event_id") REFERENCES "public"."timeline_events"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bucket_items_locales_parent_id_fk') THEN
        ALTER TABLE "bucket_items_locales" ADD CONSTRAINT "bucket_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bucket_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_hero_media_id_media_id_fk') THEN
        ALTER TABLE "wrapped_snapshots" ADD CONSTRAINT "wrapped_snapshots_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_locales_parent_id_fk') THEN
        ALTER TABLE "wrapped_snapshots_locales" ADD CONSTRAINT "wrapped_snapshots_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wrapped_snapshots"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_stats_parent_id_fk') THEN
        ALTER TABLE "wrapped_snapshots_stats" ADD CONSTRAINT "wrapped_snapshots_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wrapped_snapshots"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_stats_locales_parent_id_fk') THEN
        ALTER TABLE "wrapped_snapshots_stats_locales" ADD CONSTRAINT "wrapped_snapshots_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wrapped_snapshots_stats"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_blocks_parent_id_fk') THEN
        ALTER TABLE "wrapped_snapshots_blocks" ADD CONSTRAINT "wrapped_snapshots_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wrapped_snapshots"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wrapped_snapshots_blocks_locales_parent_id_fk') THEN
        ALTER TABLE "wrapped_snapshots_blocks_locales" ADD CONSTRAINT "wrapped_snapshots_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."wrapped_snapshots_blocks"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_timeline_events_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_timeline_events_fk" FOREIGN KEY ("timeline_events_id") REFERENCES "public"."timeline_events"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_bucket_items_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bucket_items_fk" FOREIGN KEY ("bucket_items_id") REFERENCES "public"."bucket_items"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_wrapped_snapshots_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wrapped_snapshots_fk" FOREIGN KEY ("wrapped_snapshots_id") REFERENCES "public"."wrapped_snapshots"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "timeline_events_slug_idx" ON "timeline_events" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "timeline_events_event_date_idx" ON "timeline_events" USING btree ("event_date");
    CREATE INDEX IF NOT EXISTS "timeline_events_year_idx" ON "timeline_events" USING btree ("year");
    CREATE INDEX IF NOT EXISTS "timeline_events_related_travel_idx" ON "timeline_events" USING btree ("related_travel_id");
    CREATE INDEX IF NOT EXISTS "timeline_events_related_post_idx" ON "timeline_events" USING btree ("related_post_id");
    CREATE INDEX IF NOT EXISTS "timeline_events_updated_at_idx" ON "timeline_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "timeline_events_created_at_idx" ON "timeline_events" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "timeline_events_locales_locale_parent_id_unique" ON "timeline_events_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "timeline_events_rels_order_idx" ON "timeline_events_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "timeline_events_rels_parent_idx" ON "timeline_events_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "timeline_events_rels_path_idx" ON "timeline_events_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "timeline_events_rels_media_id_idx" ON "timeline_events_rels" USING btree ("media_id");
    CREATE INDEX IF NOT EXISTS "timeline_events_rels_users_id_idx" ON "timeline_events_rels" USING btree ("users_id");
    CREATE INDEX IF NOT EXISTS "bucket_items_created_by_idx" ON "bucket_items" USING btree ("created_by_id");
    CREATE INDEX IF NOT EXISTS "bucket_items_completed_by_idx" ON "bucket_items" USING btree ("completed_by_id");
    CREATE INDEX IF NOT EXISTS "bucket_items_cover_image_idx" ON "bucket_items" USING btree ("cover_image_id");
    CREATE INDEX IF NOT EXISTS "bucket_items_timeline_event_idx" ON "bucket_items" USING btree ("timeline_event_id");
    CREATE INDEX IF NOT EXISTS "bucket_items_updated_at_idx" ON "bucket_items" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "bucket_items_created_at_idx" ON "bucket_items" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "bucket_items_locales_locale_parent_id_unique" ON "bucket_items_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_stats_order_idx" ON "wrapped_snapshots_stats" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_stats_parent_id_idx" ON "wrapped_snapshots_stats" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "wrapped_snapshots_stats_locales_locale_parent_id_unique" ON "wrapped_snapshots_stats_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_blocks_order_idx" ON "wrapped_snapshots_blocks" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_blocks_parent_id_idx" ON "wrapped_snapshots_blocks" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "wrapped_snapshots_blocks_locales_locale_parent_id_unique" ON "wrapped_snapshots_blocks_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "wrapped_snapshots_year_idx" ON "wrapped_snapshots" USING btree ("year");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_hero_media_idx" ON "wrapped_snapshots" USING btree ("hero_media_id");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_updated_at_idx" ON "wrapped_snapshots" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "wrapped_snapshots_created_at_idx" ON "wrapped_snapshots" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "wrapped_snapshots_locales_locale_parent_id_unique" ON "wrapped_snapshots_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_timeline_events_id_idx" ON "payload_locked_documents_rels" USING btree ("timeline_events_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bucket_items_id_idx" ON "payload_locked_documents_rels" USING btree ("bucket_items_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_wrapped_snapshots_id_idx" ON "payload_locked_documents_rels" USING btree ("wrapped_snapshots_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_wrapped_snapshots_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_bucket_items_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_timeline_events_fk";
    ALTER TABLE "wrapped_snapshots_blocks_locales" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_blocks_locales_parent_id_fk";
    ALTER TABLE "wrapped_snapshots_blocks" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_blocks_parent_id_fk";
    ALTER TABLE "wrapped_snapshots_stats_locales" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_stats_locales_parent_id_fk";
    ALTER TABLE "wrapped_snapshots_stats" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_stats_parent_id_fk";
    ALTER TABLE "wrapped_snapshots_locales" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_locales_parent_id_fk";
    ALTER TABLE "wrapped_snapshots" DROP CONSTRAINT IF EXISTS "wrapped_snapshots_hero_media_id_media_id_fk";
    ALTER TABLE "bucket_items_locales" DROP CONSTRAINT IF EXISTS "bucket_items_locales_parent_id_fk";
    ALTER TABLE "bucket_items" DROP CONSTRAINT IF EXISTS "bucket_items_timeline_event_id_timeline_events_id_fk";
    ALTER TABLE "bucket_items" DROP CONSTRAINT IF EXISTS "bucket_items_cover_image_id_media_id_fk";
    ALTER TABLE "bucket_items" DROP CONSTRAINT IF EXISTS "bucket_items_completed_by_id_users_id_fk";
    ALTER TABLE "bucket_items" DROP CONSTRAINT IF EXISTS "bucket_items_created_by_id_users_id_fk";
    ALTER TABLE "timeline_events_rels" DROP CONSTRAINT IF EXISTS "timeline_events_rels_users_fk";
    ALTER TABLE "timeline_events_rels" DROP CONSTRAINT IF EXISTS "timeline_events_rels_media_fk";
    ALTER TABLE "timeline_events_rels" DROP CONSTRAINT IF EXISTS "timeline_events_rels_parent_fk";
    ALTER TABLE "timeline_events_locales" DROP CONSTRAINT IF EXISTS "timeline_events_locales_parent_id_fk";
    ALTER TABLE "timeline_events" DROP CONSTRAINT IF EXISTS "timeline_events_related_post_id_posts_id_fk";
    ALTER TABLE "timeline_events" DROP CONSTRAINT IF EXISTS "timeline_events_related_travel_id_travel_projects_id_fk";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "wrapped_snapshots_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bucket_items_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "timeline_events_id";

    DROP TABLE IF EXISTS "wrapped_snapshots_blocks_locales" CASCADE;
    DROP TABLE IF EXISTS "wrapped_snapshots_blocks" CASCADE;
    DROP TABLE IF EXISTS "wrapped_snapshots_stats_locales" CASCADE;
    DROP TABLE IF EXISTS "wrapped_snapshots_stats" CASCADE;
    DROP TABLE IF EXISTS "wrapped_snapshots_locales" CASCADE;
    DROP TABLE IF EXISTS "wrapped_snapshots" CASCADE;
    DROP TABLE IF EXISTS "bucket_items_locales" CASCADE;
    DROP TABLE IF EXISTS "bucket_items" CASCADE;
    DROP TABLE IF EXISTS "timeline_events_rels" CASCADE;
    DROP TABLE IF EXISTS "timeline_events_locales" CASCADE;
    DROP TABLE IF EXISTS "timeline_events" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_wrapped_snapshots_status";
    DROP TYPE IF EXISTS "public"."enum_wrapped_snapshots_blocks_kind";
    DROP TYPE IF EXISTS "public"."enum_bucket_items_status";
    DROP TYPE IF EXISTS "public"."enum_timeline_events_source_type";
  `)
}
