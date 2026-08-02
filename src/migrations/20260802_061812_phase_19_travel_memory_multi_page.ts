import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_travel_memories_presentation_style" AS ENUM('editorial-journal', 'cinematic-timeline', 'family-scrapbook');
  CREATE TYPE "public"."enum__travel_memories_v_version_presentation_style" AS ENUM('editorial-journal', 'cinematic-timeline', 'family-scrapbook');
  CREATE TYPE "public"."enum_travel_memory_days_moments_placements_type" AS ENUM('photo', 'youtube');
  CREATE TYPE "public"."enum_travel_memory_days_moments_placements_role" AS ENUM('hero', 'inline', 'gallery');
  CREATE TYPE "public"."enum_travel_memory_days_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_memory_days_v_version_moments_placements_type" AS ENUM('photo', 'youtube');
  CREATE TYPE "public"."enum__travel_memory_days_v_version_moments_placements_role" AS ENUM('hero', 'inline', 'gallery');
  CREATE TYPE "public"."enum__travel_memory_days_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_memory_days_v_published_locale" AS ENUM('zh-TW', 'en');
  CREATE TABLE "travel_memory_days_moments_placements" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"placement_key" varchar,
	"type" "enum_travel_memory_days_moments_placements_type",
	"role" "enum_travel_memory_days_moments_placements_role" DEFAULT 'inline',
	"media_id" integer,
	"youtube_url" varchar
  );

  CREATE TABLE "travel_memory_days_moments_placements_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memory_days_moments" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"moment_key" varchar,
	"time" varchar
  );

  CREATE TABLE "travel_memory_days_moments_locales" (
	"location" varchar,
	"title" varchar,
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memory_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"memory_id" integer,
	"day_identity" varchar,
	"day_key" varchar,
	"day" numeric,
	"date" timestamp(3) with time zone,
	"source_metadata_source_file" varchar,
	"source_metadata_source_hash" varchar,
	"source_metadata_parser_version" varchar,
	"source_metadata_last_imported_at" timestamp(3) with time zone,
	"source_metadata_base_projection" jsonb,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_travel_memory_days_status" DEFAULT 'draft'
  );

  CREATE TABLE "travel_memory_days_locales" (
	"date_label" varchar,
	"title" varchar,
	"theme" varchar,
	"story" varchar,
	"meals_breakfast" varchar,
	"meals_lunch" varchar,
	"meals_dinner" varchar,
	"lodging" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memory_days_v_version_moments_placements" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"placement_key" varchar,
	"type" "enum__travel_memory_days_v_version_moments_placements_type",
	"role" "enum__travel_memory_days_v_version_moments_placements_role" DEFAULT 'inline',
	"media_id" integer,
	"youtube_url" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_travel_memory_days_v_version_moments_placements_locales" (
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memory_days_v_version_moments" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"moment_key" varchar,
	"time" varchar,
	"_uuid" varchar
  );

  CREATE TABLE "_travel_memory_days_v_version_moments_locales" (
	"location" varchar,
	"title" varchar,
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memory_days_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_memory_id" integer,
	"version_day_identity" varchar,
	"version_day_key" varchar,
	"version_day" numeric,
	"version_date" timestamp(3) with time zone,
	"version_source_metadata_source_file" varchar,
	"version_source_metadata_source_hash" varchar,
	"version_source_metadata_parser_version" varchar,
	"version_source_metadata_last_imported_at" timestamp(3) with time zone,
	"version_source_metadata_base_projection" jsonb,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__travel_memory_days_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__travel_memory_days_v_published_locale",
	"latest" boolean,
	"autosave" boolean
  );

  CREATE TABLE "_travel_memory_days_v_locales" (
	"version_date_label" varchar,
	"version_title" varchar,
	"version_theme" varchar,
	"version_story" varchar,
	"version_meals_breakfast" varchar,
	"version_meals_lunch" varchar,
	"version_meals_dinner" varchar,
	"version_lodging" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "travel_memories" ADD COLUMN "presentation_style" "enum_travel_memories_presentation_style";
  ALTER TABLE "_travel_memories_v" ADD COLUMN "version_presentation_style" "enum__travel_memories_v_version_presentation_style";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "travel_memory_days_id" integer;
  ALTER TABLE "travel_memory_days_moments_placements" ADD CONSTRAINT "travel_memory_days_moments_placements_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_memory_days_moments_placements" ADD CONSTRAINT "travel_memory_days_moments_placements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memory_days_moments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memory_days_moments_placements_locales" ADD CONSTRAINT "travel_memory_days_moments_placements_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memory_days_moments_placements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memory_days_moments" ADD CONSTRAINT "travel_memory_days_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memory_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memory_days_moments_locales" ADD CONSTRAINT "travel_memory_days_moments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memory_days_moments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memory_days" ADD CONSTRAINT "travel_memory_days_memory_id_travel_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."travel_memories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_memory_days_locales" ADD CONSTRAINT "travel_memory_days_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memory_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements" ADD CONSTRAINT "_travel_memory_days_v_version_moments_placements_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements" ADD CONSTRAINT "_travel_memory_days_v_version_moments_placements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memory_days_v_version_moments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements_locales" ADD CONSTRAINT "_travel_memory_days_v_version_moments_placements_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memory_days_v_version_moments_placements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_version_moments" ADD CONSTRAINT "_travel_memory_days_v_version_moments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memory_days_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_version_moments_locales" ADD CONSTRAINT "_travel_memory_days_v_version_moments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memory_days_v_version_moments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v" ADD CONSTRAINT "_travel_memory_days_v_parent_id_travel_memory_days_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_memory_days"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v" ADD CONSTRAINT "_travel_memory_days_v_version_memory_id_travel_memories_id_fk" FOREIGN KEY ("version_memory_id") REFERENCES "public"."travel_memories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memory_days_v_locales" ADD CONSTRAINT "_travel_memory_days_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memory_days_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "travel_memory_days_moments_placements_order_idx" ON "travel_memory_days_moments_placements" USING btree ("_order");
  CREATE INDEX "travel_memory_days_moments_placements_parent_id_idx" ON "travel_memory_days_moments_placements" USING btree ("_parent_id");
  CREATE INDEX "travel_memory_days_moments_placements_media_idx" ON "travel_memory_days_moments_placements" USING btree ("media_id");
  CREATE UNIQUE INDEX "travel_memory_days_moments_placements_locales_locale_parent_" ON "travel_memory_days_moments_placements_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memory_days_moments_order_idx" ON "travel_memory_days_moments" USING btree ("_order");
  CREATE INDEX "travel_memory_days_moments_parent_id_idx" ON "travel_memory_days_moments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memory_days_moments_locales_locale_parent_id_unique" ON "travel_memory_days_moments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memory_days_memory_idx" ON "travel_memory_days" USING btree ("memory_id");
  CREATE UNIQUE INDEX "travel_memory_days_day_identity_idx" ON "travel_memory_days" USING btree ("day_identity");
  CREATE INDEX "travel_memory_days_day_key_idx" ON "travel_memory_days" USING btree ("day_key");
  CREATE INDEX "travel_memory_days_date_idx" ON "travel_memory_days" USING btree ("date");
  CREATE INDEX "travel_memory_days_updated_at_idx" ON "travel_memory_days" USING btree ("updated_at");
  CREATE INDEX "travel_memory_days_created_at_idx" ON "travel_memory_days" USING btree ("created_at");
  CREATE INDEX "travel_memory_days__status_idx" ON "travel_memory_days" USING btree ("_status");
  CREATE UNIQUE INDEX "travel_memory_days_locales_locale_parent_id_unique" ON "travel_memory_days_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memory_days_v_version_moments_placements_order_idx" ON "_travel_memory_days_v_version_moments_placements" USING btree ("_order");
  CREATE INDEX "_travel_memory_days_v_version_moments_placements_parent_id_idx" ON "_travel_memory_days_v_version_moments_placements" USING btree ("_parent_id");
  CREATE INDEX "_travel_memory_days_v_version_moments_placements_media_idx" ON "_travel_memory_days_v_version_moments_placements" USING btree ("media_id");
  CREATE UNIQUE INDEX "_travel_memory_days_v_version_moments_placements_locales_loc" ON "_travel_memory_days_v_version_moments_placements_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memory_days_v_version_moments_order_idx" ON "_travel_memory_days_v_version_moments" USING btree ("_order");
  CREATE INDEX "_travel_memory_days_v_version_moments_parent_id_idx" ON "_travel_memory_days_v_version_moments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memory_days_v_version_moments_locales_locale_parent_" ON "_travel_memory_days_v_version_moments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memory_days_v_parent_idx" ON "_travel_memory_days_v" USING btree ("parent_id");
  CREATE INDEX "_travel_memory_days_v_version_version_memory_idx" ON "_travel_memory_days_v" USING btree ("version_memory_id");
  CREATE INDEX "_travel_memory_days_v_version_version_day_identity_idx" ON "_travel_memory_days_v" USING btree ("version_day_identity");
  CREATE INDEX "_travel_memory_days_v_version_version_day_key_idx" ON "_travel_memory_days_v" USING btree ("version_day_key");
  CREATE INDEX "_travel_memory_days_v_version_version_date_idx" ON "_travel_memory_days_v" USING btree ("version_date");
  CREATE INDEX "_travel_memory_days_v_version_version_updated_at_idx" ON "_travel_memory_days_v" USING btree ("version_updated_at");
  CREATE INDEX "_travel_memory_days_v_version_version_created_at_idx" ON "_travel_memory_days_v" USING btree ("version_created_at");
  CREATE INDEX "_travel_memory_days_v_version_version__status_idx" ON "_travel_memory_days_v" USING btree ("version__status");
  CREATE INDEX "_travel_memory_days_v_created_at_idx" ON "_travel_memory_days_v" USING btree ("created_at");
  CREATE INDEX "_travel_memory_days_v_updated_at_idx" ON "_travel_memory_days_v" USING btree ("updated_at");
  CREATE INDEX "_travel_memory_days_v_snapshot_idx" ON "_travel_memory_days_v" USING btree ("snapshot");
  CREATE INDEX "_travel_memory_days_v_published_locale_idx" ON "_travel_memory_days_v" USING btree ("published_locale");
  CREATE INDEX "_travel_memory_days_v_latest_idx" ON "_travel_memory_days_v" USING btree ("latest");
  CREATE INDEX "_travel_memory_days_v_autosave_idx" ON "_travel_memory_days_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_travel_memory_days_v_locales_locale_parent_id_unique" ON "_travel_memory_days_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_travel_memory_days_fk" FOREIGN KEY ("travel_memory_days_id") REFERENCES "public"."travel_memory_days"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_travel_memory_days_id_idx" ON "payload_locked_documents_rels" USING btree ("travel_memory_days_id");
  ALTER TABLE "travel_memory_days_moments_placements" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments_placements_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_locales" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_locales" ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days_moments_placements" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days_moments_placements_locales" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days_moments" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days_moments_locales" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "travel_memory_days_locales" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v_version_moments_placements" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v_version_moments_placements_locales" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v_version_moments" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v_version_moments_locales" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v" FROM anon, authenticated;
  REVOKE ALL PRIVILEGES ON TABLE "_travel_memory_days_v_locales" FROM anon, authenticated;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_memory_days_moments_placements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments_placements_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_moments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memory_days_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_placements_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_version_moments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memory_days_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_travel_memory_days_fk";
  DROP INDEX "payload_locked_documents_rels_travel_memory_days_id_idx";
  DROP TABLE "travel_memory_days_moments_placements" CASCADE;
  DROP TABLE "travel_memory_days_moments_placements_locales" CASCADE;
  DROP TABLE "travel_memory_days_moments" CASCADE;
  DROP TABLE "travel_memory_days_moments_locales" CASCADE;
  DROP TABLE "travel_memory_days" CASCADE;
  DROP TABLE "travel_memory_days_locales" CASCADE;
  DROP TABLE "_travel_memory_days_v_version_moments_placements" CASCADE;
  DROP TABLE "_travel_memory_days_v_version_moments_placements_locales" CASCADE;
  DROP TABLE "_travel_memory_days_v_version_moments" CASCADE;
  DROP TABLE "_travel_memory_days_v_version_moments_locales" CASCADE;
  DROP TABLE "_travel_memory_days_v" CASCADE;
  DROP TABLE "_travel_memory_days_v_locales" CASCADE;
  ALTER TABLE "travel_memories" DROP COLUMN "presentation_style";
  ALTER TABLE "_travel_memories_v" DROP COLUMN "version_presentation_style";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "travel_memory_days_id";
  DROP TYPE "public"."enum_travel_memories_presentation_style";
  DROP TYPE "public"."enum__travel_memories_v_version_presentation_style";
  DROP TYPE "public"."enum_travel_memory_days_moments_placements_type";
  DROP TYPE "public"."enum_travel_memory_days_moments_placements_role";
  DROP TYPE "public"."enum_travel_memory_days_status";
  DROP TYPE "public"."enum__travel_memory_days_v_version_moments_placements_type";
  DROP TYPE "public"."enum__travel_memory_days_v_version_moments_placements_role";
  DROP TYPE "public"."enum__travel_memory_days_v_version_status";
  DROP TYPE "public"."enum__travel_memory_days_v_published_locale";`)
}
