import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_travel_plans_planning_sections_kind" AS ENUM('overview', 'transport', 'lodging', 'itinerary-day', 'decision', 'budget', 'reminder', 'freeform');
  CREATE TYPE "public"."enum_travel_plans_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_plans_v_version_planning_sections_kind" AS ENUM('overview', 'transport', 'lodging', 'itinerary-day', 'decision', 'budget', 'reminder', 'freeform');
  CREATE TYPE "public"."enum__travel_plans_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_plans_v_published_locale" AS ENUM('zh-TW', 'en');
  CREATE TYPE "public"."enum_travel_memories_story_sections_kind" AS ENUM('overview', 'day', 'reflection', 'food', 'freeform');
  CREATE TYPE "public"."enum_travel_memories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_memories_v_version_story_sections_kind" AS ENUM('overview', 'day', 'reflection', 'food', 'freeform');
  CREATE TYPE "public"."enum__travel_memories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__travel_memories_v_published_locale" AS ENUM('zh-TW', 'en');
  CREATE TABLE "travel_plans_guest_participants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "travel_plans_guest_participants_locales" (
    "name" varchar,
    "note" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_plans_planning_sections_links" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar
  );

  CREATE TABLE "travel_plans_planning_sections_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_plans_planning_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_travel_plans_planning_sections_kind" DEFAULT 'freeform',
    "level" numeric DEFAULT 2,
    "anchor" varchar,
    "display_day" numeric,
    "date" timestamp(3) with time zone,
    "interactions_comments_enabled" boolean DEFAULT true,
    "interactions_voting_enabled" boolean DEFAULT true
  );

  CREATE TABLE "travel_plans_planning_sections_locales" (
    "title" varchar,
    "subtitle" varchar,
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_plans" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "is_private" boolean DEFAULT true,
    "start_date" timestamp(3) with time zone,
    "end_date" timestamp(3) with time zone,
    "cover_image_id" integer,
    "source_metadata_source_file" varchar,
    "source_metadata_source_hash" varchar,
    "source_metadata_parser_version" varchar,
    "source_metadata_last_imported_at" timestamp(3) with time zone,
    "source_metadata_base_projection" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_travel_plans_status" DEFAULT 'draft'
  );

  CREATE TABLE "travel_plans_locales" (
    "title" varchar,
    "summary" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "travel_plans_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "media_id" integer
  );

  CREATE TABLE "_travel_plans_v_version_guest_participants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_plans_v_version_guest_participants_locales" (
    "name" varchar,
    "note" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_plans_v_version_planning_sections_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_plans_v_version_planning_sections_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_plans_v_version_planning_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "kind" "enum__travel_plans_v_version_planning_sections_kind" DEFAULT 'freeform',
    "level" numeric DEFAULT 2,
    "anchor" varchar,
    "display_day" numeric,
    "date" timestamp(3) with time zone,
    "interactions_comments_enabled" boolean DEFAULT true,
    "interactions_voting_enabled" boolean DEFAULT true,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_plans_v_version_planning_sections_locales" (
    "title" varchar,
    "subtitle" varchar,
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_plans_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_is_private" boolean DEFAULT true,
    "version_start_date" timestamp(3) with time zone,
    "version_end_date" timestamp(3) with time zone,
    "version_cover_image_id" integer,
    "version_source_metadata_source_file" varchar,
    "version_source_metadata_source_hash" varchar,
    "version_source_metadata_parser_version" varchar,
    "version_source_metadata_last_imported_at" timestamp(3) with time zone,
    "version_source_metadata_base_projection" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__travel_plans_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__travel_plans_v_published_locale",
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_travel_plans_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_plans_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "media_id" integer
  );

  CREATE TABLE "travel_memories_guest_participants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "travel_memories_guest_participants_locales" (
    "name" varchar,
    "note" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_daily_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "day" numeric,
    "date" timestamp(3) with time zone
  );

  CREATE TABLE "travel_memories_daily_highlights_locales" (
    "title" varchar,
    "story" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_travel_ledger_flights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "date" timestamp(3) with time zone,
    "flight_number" varchar,
    "departure_time" varchar,
    "arrival_time" varchar
  );

  CREATE TABLE "travel_memories_travel_ledger_flights_locales" (
    "airline" varchar,
    "route" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_travel_ledger_lodgings" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "start_date" timestamp(3) with time zone,
    "end_date" timestamp(3) with time zone
  );

  CREATE TABLE "travel_memories_travel_ledger_lodgings_locales" (
    "hotel" varchar,
    "city" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_story_sections_links" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar
  );

  CREATE TABLE "travel_memories_story_sections_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_story_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "kind" "enum_travel_memories_story_sections_kind" DEFAULT 'freeform',
    "anchor" varchar
  );

  CREATE TABLE "travel_memories_story_sections_locales" (
    "title" varchar,
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_external_videos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "url" varchar
  );

  CREATE TABLE "travel_memories_external_videos_locales" (
    "title" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar,
    "is_private" boolean DEFAULT true,
    "start_date" timestamp(3) with time zone,
    "end_date" timestamp(3) with time zone,
    "cover_image_id" integer,
    "origin_plan_id" integer,
    "source_metadata_source_file" varchar,
    "source_metadata_source_hash" varchar,
    "source_metadata_parser_version" varchar,
    "source_metadata_last_imported_at" timestamp(3) with time zone,
    "source_metadata_base_projection" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "_status" "enum_travel_memories_status" DEFAULT 'draft'
  );

  CREATE TABLE "travel_memories_locales" (
    "title" varchar,
    "summary" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "travel_memories_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "media_id" integer
  );

  CREATE TABLE "_travel_memories_v_version_guest_participants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_guest_participants_locales" (
    "name" varchar,
    "note" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_daily_highlights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "day" numeric,
    "date" timestamp(3) with time zone,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_daily_highlights_locales" (
    "title" varchar,
    "story" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_travel_ledger_flights" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "date" timestamp(3) with time zone,
    "flight_number" varchar,
    "departure_time" varchar,
    "arrival_time" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_travel_ledger_flights_locales" (
    "airline" varchar,
    "route" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_travel_ledger_lodgings" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "start_date" timestamp(3) with time zone,
    "end_date" timestamp(3) with time zone,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" (
    "hotel" varchar,
    "city" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_story_sections_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_story_sections_links_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_story_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "kind" "enum__travel_memories_v_version_story_sections_kind" DEFAULT 'freeform',
    "anchor" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_story_sections_locales" (
    "title" varchar,
    "body" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_external_videos" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_external_videos_locales" (
    "title" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_slug" varchar,
    "version_is_private" boolean DEFAULT true,
    "version_start_date" timestamp(3) with time zone,
    "version_end_date" timestamp(3) with time zone,
    "version_cover_image_id" integer,
    "version_origin_plan_id" integer,
    "version_source_metadata_source_file" varchar,
    "version_source_metadata_source_hash" varchar,
    "version_source_metadata_parser_version" varchar,
    "version_source_metadata_last_imported_at" timestamp(3) with time zone,
    "version_source_metadata_base_projection" jsonb,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__travel_memories_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__travel_memories_v_published_locale",
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_travel_memories_v_locales" (
    "version_title" varchar,
    "version_summary" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "users_id" integer,
    "media_id" integer
  );

  CREATE TABLE "travel_route_identities" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" varchar NOT NULL,
    "owner_key" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "travel_route_identities_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "travel_plans_id" integer,
    "travel_memories_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "travel_plans_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "travel_memories_id" integer;
  ALTER TABLE "travel_plans_guest_participants" ADD CONSTRAINT "travel_plans_guest_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_guest_participants_locales" ADD CONSTRAINT "travel_plans_guest_participants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans_guest_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_planning_sections_links" ADD CONSTRAINT "travel_plans_planning_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_planning_sections_links_locales" ADD CONSTRAINT "travel_plans_planning_sections_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans_planning_sections_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_planning_sections" ADD CONSTRAINT "travel_plans_planning_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_planning_sections_locales" ADD CONSTRAINT "travel_plans_planning_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans" ADD CONSTRAINT "travel_plans_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_plans_locales" ADD CONSTRAINT "travel_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_rels" ADD CONSTRAINT "travel_plans_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_rels" ADD CONSTRAINT "travel_plans_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_plans_rels" ADD CONSTRAINT "travel_plans_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_guest_participants" ADD CONSTRAINT "_travel_plans_v_version_guest_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_guest_participants_locales" ADD CONSTRAINT "_travel_plans_v_version_guest_participants_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v_version_guest_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_planning_sections_links" ADD CONSTRAINT "_travel_plans_v_version_planning_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v_version_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_planning_sections_links_locales" ADD CONSTRAINT "_travel_plans_v_version_planning_sections_links_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v_version_planning_sections_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_planning_sections" ADD CONSTRAINT "_travel_plans_v_version_planning_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_version_planning_sections_locales" ADD CONSTRAINT "_travel_plans_v_version_planning_sections_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v_version_planning_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v" ADD CONSTRAINT "_travel_plans_v_parent_id_travel_plans_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_plans_v" ADD CONSTRAINT "_travel_plans_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_locales" ADD CONSTRAINT "_travel_plans_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_rels" ADD CONSTRAINT "_travel_plans_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_travel_plans_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_rels" ADD CONSTRAINT "_travel_plans_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_plans_v_rels" ADD CONSTRAINT "_travel_plans_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_guest_participants" ADD CONSTRAINT "travel_memories_guest_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_guest_participants_locales" ADD CONSTRAINT "travel_memories_guest_participants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_guest_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_daily_highlights" ADD CONSTRAINT "travel_memories_daily_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD CONSTRAINT "travel_memories_daily_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_daily_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_travel_ledger_flights" ADD CONSTRAINT "travel_memories_travel_ledger_flights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_travel_ledger_flights_locales" ADD CONSTRAINT "travel_memories_travel_ledger_flights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_travel_ledger_flights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_travel_ledger_lodgings" ADD CONSTRAINT "travel_memories_travel_ledger_lodgings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD CONSTRAINT "travel_memories_travel_ledger_lodgings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_travel_ledger_lodgings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_story_sections_links" ADD CONSTRAINT "travel_memories_story_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_story_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_story_sections_links_locales" ADD CONSTRAINT "travel_memories_story_sections_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_story_sections_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_story_sections" ADD CONSTRAINT "travel_memories_story_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_story_sections_locales" ADD CONSTRAINT "travel_memories_story_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_story_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_external_videos" ADD CONSTRAINT "travel_memories_external_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_external_videos_locales" ADD CONSTRAINT "travel_memories_external_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_external_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories" ADD CONSTRAINT "travel_memories_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_memories" ADD CONSTRAINT "travel_memories_origin_plan_id_travel_plans_id_fk" FOREIGN KEY ("origin_plan_id") REFERENCES "public"."travel_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_memories_locales" ADD CONSTRAINT "travel_memories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_rels" ADD CONSTRAINT "travel_memories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_rels" ADD CONSTRAINT "travel_memories_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_rels" ADD CONSTRAINT "travel_memories_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_guest_participants" ADD CONSTRAINT "_travel_memories_v_version_guest_participants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_guest_participants_locales" ADD CONSTRAINT "_travel_memories_v_version_guest_participants_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_guest_participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_daily_highlights" ADD CONSTRAINT "_travel_memories_v_version_daily_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD CONSTRAINT "_travel_memories_v_version_daily_highlights_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_daily_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" ADD CONSTRAINT "_travel_memories_v_version_travel_ledger_flights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights_locales" ADD CONSTRAINT "_travel_memories_v_version_travel_ledger_flights_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_travel_ledger_flights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings" ADD CONSTRAINT "_travel_memories_v_version_travel_ledger_lodgings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD CONSTRAINT "_travel_memories_v_version_travel_ledger_lodgings_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_travel_ledger_lodgings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_story_sections_links" ADD CONSTRAINT "_travel_memories_v_version_story_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_story_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_story_sections_links_locales" ADD CONSTRAINT "_travel_memories_v_version_story_sections_links_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_story_sections_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_story_sections" ADD CONSTRAINT "_travel_memories_v_version_story_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" ADD CONSTRAINT "_travel_memories_v_version_story_sections_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_story_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_external_videos" ADD CONSTRAINT "_travel_memories_v_version_external_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_external_videos_locales" ADD CONSTRAINT "_travel_memories_v_version_external_videos_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_external_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v" ADD CONSTRAINT "_travel_memories_v_parent_id_travel_memories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memories_v" ADD CONSTRAINT "_travel_memories_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memories_v" ADD CONSTRAINT "_travel_memories_v_version_origin_plan_id_travel_plans_id_fk" FOREIGN KEY ("version_origin_plan_id") REFERENCES "public"."travel_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_locales" ADD CONSTRAINT "_travel_memories_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_rels" ADD CONSTRAINT "_travel_memories_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_rels" ADD CONSTRAINT "_travel_memories_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_rels" ADD CONSTRAINT "_travel_memories_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_route_identities_rels" ADD CONSTRAINT "travel_route_identities_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."travel_route_identities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_route_identities_rels" ADD CONSTRAINT "travel_route_identities_rels_travel_plans_fk" FOREIGN KEY ("travel_plans_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_route_identities_rels" ADD CONSTRAINT "travel_route_identities_rels_travel_memories_fk" FOREIGN KEY ("travel_memories_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "travel_plans_guest_participants_order_idx" ON "travel_plans_guest_participants" USING btree ("_order");
  CREATE INDEX "travel_plans_guest_participants_parent_id_idx" ON "travel_plans_guest_participants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_plans_guest_participants_locales_locale_parent_id_uni" ON "travel_plans_guest_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_plans_planning_sections_links_order_idx" ON "travel_plans_planning_sections_links" USING btree ("_order");
  CREATE INDEX "travel_plans_planning_sections_links_parent_id_idx" ON "travel_plans_planning_sections_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_plans_planning_sections_links_locales_locale_parent_i" ON "travel_plans_planning_sections_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_plans_planning_sections_order_idx" ON "travel_plans_planning_sections" USING btree ("_order");
  CREATE INDEX "travel_plans_planning_sections_parent_id_idx" ON "travel_plans_planning_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_plans_planning_sections_locales_locale_parent_id_uniq" ON "travel_plans_planning_sections_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "travel_plans_slug_idx" ON "travel_plans" USING btree ("slug");
  CREATE INDEX "travel_plans_start_date_idx" ON "travel_plans" USING btree ("start_date");
  CREATE INDEX "travel_plans_end_date_idx" ON "travel_plans" USING btree ("end_date");
  CREATE INDEX "travel_plans_cover_image_idx" ON "travel_plans" USING btree ("cover_image_id");
  CREATE INDEX "travel_plans_updated_at_idx" ON "travel_plans" USING btree ("updated_at");
  CREATE INDEX "travel_plans_created_at_idx" ON "travel_plans" USING btree ("created_at");
  CREATE INDEX "travel_plans__status_idx" ON "travel_plans" USING btree ("_status");
  CREATE UNIQUE INDEX "travel_plans_locales_locale_parent_id_unique" ON "travel_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_plans_rels_order_idx" ON "travel_plans_rels" USING btree ("order");
  CREATE INDEX "travel_plans_rels_parent_idx" ON "travel_plans_rels" USING btree ("parent_id");
  CREATE INDEX "travel_plans_rels_path_idx" ON "travel_plans_rels" USING btree ("path");
  CREATE INDEX "travel_plans_rels_users_id_idx" ON "travel_plans_rels" USING btree ("users_id");
  CREATE INDEX "travel_plans_rels_media_id_idx" ON "travel_plans_rels" USING btree ("media_id");
  CREATE INDEX "_travel_plans_v_version_guest_participants_order_idx" ON "_travel_plans_v_version_guest_participants" USING btree ("_order");
  CREATE INDEX "_travel_plans_v_version_guest_participants_parent_id_idx" ON "_travel_plans_v_version_guest_participants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_plans_v_version_guest_participants_locales_locale_pa" ON "_travel_plans_v_version_guest_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_plans_v_version_planning_sections_links_order_idx" ON "_travel_plans_v_version_planning_sections_links" USING btree ("_order");
  CREATE INDEX "_travel_plans_v_version_planning_sections_links_parent_id_idx" ON "_travel_plans_v_version_planning_sections_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_plans_v_version_planning_sections_links_locales_loca" ON "_travel_plans_v_version_planning_sections_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_plans_v_version_planning_sections_order_idx" ON "_travel_plans_v_version_planning_sections" USING btree ("_order");
  CREATE INDEX "_travel_plans_v_version_planning_sections_parent_id_idx" ON "_travel_plans_v_version_planning_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_plans_v_version_planning_sections_locales_locale_par" ON "_travel_plans_v_version_planning_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_plans_v_parent_idx" ON "_travel_plans_v" USING btree ("parent_id");
  CREATE INDEX "_travel_plans_v_version_version_slug_idx" ON "_travel_plans_v" USING btree ("version_slug");
  CREATE INDEX "_travel_plans_v_version_version_start_date_idx" ON "_travel_plans_v" USING btree ("version_start_date");
  CREATE INDEX "_travel_plans_v_version_version_end_date_idx" ON "_travel_plans_v" USING btree ("version_end_date");
  CREATE INDEX "_travel_plans_v_version_version_cover_image_idx" ON "_travel_plans_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_travel_plans_v_version_version_updated_at_idx" ON "_travel_plans_v" USING btree ("version_updated_at");
  CREATE INDEX "_travel_plans_v_version_version_created_at_idx" ON "_travel_plans_v" USING btree ("version_created_at");
  CREATE INDEX "_travel_plans_v_version_version__status_idx" ON "_travel_plans_v" USING btree ("version__status");
  CREATE INDEX "_travel_plans_v_created_at_idx" ON "_travel_plans_v" USING btree ("created_at");
  CREATE INDEX "_travel_plans_v_updated_at_idx" ON "_travel_plans_v" USING btree ("updated_at");
  CREATE INDEX "_travel_plans_v_snapshot_idx" ON "_travel_plans_v" USING btree ("snapshot");
  CREATE INDEX "_travel_plans_v_published_locale_idx" ON "_travel_plans_v" USING btree ("published_locale");
  CREATE INDEX "_travel_plans_v_latest_idx" ON "_travel_plans_v" USING btree ("latest");
  CREATE INDEX "_travel_plans_v_autosave_idx" ON "_travel_plans_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_travel_plans_v_locales_locale_parent_id_unique" ON "_travel_plans_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_plans_v_rels_order_idx" ON "_travel_plans_v_rels" USING btree ("order");
  CREATE INDEX "_travel_plans_v_rels_parent_idx" ON "_travel_plans_v_rels" USING btree ("parent_id");
  CREATE INDEX "_travel_plans_v_rels_path_idx" ON "_travel_plans_v_rels" USING btree ("path");
  CREATE INDEX "_travel_plans_v_rels_users_id_idx" ON "_travel_plans_v_rels" USING btree ("users_id");
  CREATE INDEX "_travel_plans_v_rels_media_id_idx" ON "_travel_plans_v_rels" USING btree ("media_id");
  CREATE INDEX "travel_memories_guest_participants_order_idx" ON "travel_memories_guest_participants" USING btree ("_order");
  CREATE INDEX "travel_memories_guest_participants_parent_id_idx" ON "travel_memories_guest_participants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_guest_participants_locales_locale_parent_id_" ON "travel_memories_guest_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_daily_highlights_order_idx" ON "travel_memories_daily_highlights" USING btree ("_order");
  CREATE INDEX "travel_memories_daily_highlights_parent_id_idx" ON "travel_memories_daily_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_daily_highlights_locales_locale_parent_id_un" ON "travel_memories_daily_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_travel_ledger_flights_order_idx" ON "travel_memories_travel_ledger_flights" USING btree ("_order");
  CREATE INDEX "travel_memories_travel_ledger_flights_parent_id_idx" ON "travel_memories_travel_ledger_flights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_travel_ledger_flights_locales_locale_parent_" ON "travel_memories_travel_ledger_flights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_travel_ledger_lodgings_order_idx" ON "travel_memories_travel_ledger_lodgings" USING btree ("_order");
  CREATE INDEX "travel_memories_travel_ledger_lodgings_parent_id_idx" ON "travel_memories_travel_ledger_lodgings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_travel_ledger_lodgings_locales_locale_parent" ON "travel_memories_travel_ledger_lodgings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_story_sections_links_order_idx" ON "travel_memories_story_sections_links" USING btree ("_order");
  CREATE INDEX "travel_memories_story_sections_links_parent_id_idx" ON "travel_memories_story_sections_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_story_sections_links_locales_locale_parent_i" ON "travel_memories_story_sections_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_story_sections_order_idx" ON "travel_memories_story_sections" USING btree ("_order");
  CREATE INDEX "travel_memories_story_sections_parent_id_idx" ON "travel_memories_story_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_story_sections_locales_locale_parent_id_uniq" ON "travel_memories_story_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_external_videos_order_idx" ON "travel_memories_external_videos" USING btree ("_order");
  CREATE INDEX "travel_memories_external_videos_parent_id_idx" ON "travel_memories_external_videos" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_external_videos_locales_locale_parent_id_uni" ON "travel_memories_external_videos_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "travel_memories_slug_idx" ON "travel_memories" USING btree ("slug");
  CREATE INDEX "travel_memories_start_date_idx" ON "travel_memories" USING btree ("start_date");
  CREATE INDEX "travel_memories_end_date_idx" ON "travel_memories" USING btree ("end_date");
  CREATE INDEX "travel_memories_cover_image_idx" ON "travel_memories" USING btree ("cover_image_id");
  CREATE INDEX "travel_memories_origin_plan_idx" ON "travel_memories" USING btree ("origin_plan_id");
  CREATE INDEX "travel_memories_updated_at_idx" ON "travel_memories" USING btree ("updated_at");
  CREATE INDEX "travel_memories_created_at_idx" ON "travel_memories" USING btree ("created_at");
  CREATE INDEX "travel_memories__status_idx" ON "travel_memories" USING btree ("_status");
  CREATE UNIQUE INDEX "travel_memories_locales_locale_parent_id_unique" ON "travel_memories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_rels_order_idx" ON "travel_memories_rels" USING btree ("order");
  CREATE INDEX "travel_memories_rels_parent_idx" ON "travel_memories_rels" USING btree ("parent_id");
  CREATE INDEX "travel_memories_rels_path_idx" ON "travel_memories_rels" USING btree ("path");
  CREATE INDEX "travel_memories_rels_users_id_idx" ON "travel_memories_rels" USING btree ("users_id");
  CREATE INDEX "travel_memories_rels_media_id_idx" ON "travel_memories_rels" USING btree ("media_id");
  CREATE INDEX "_travel_memories_v_version_guest_participants_order_idx" ON "_travel_memories_v_version_guest_participants" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_guest_participants_parent_id_idx" ON "_travel_memories_v_version_guest_participants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_guest_participants_locales_locale" ON "_travel_memories_v_version_guest_participants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_daily_highlights_order_idx" ON "_travel_memories_v_version_daily_highlights" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_daily_highlights_parent_id_idx" ON "_travel_memories_v_version_daily_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_daily_highlights_locales_locale_p" ON "_travel_memories_v_version_daily_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_travel_ledger_flights_order_idx" ON "_travel_memories_v_version_travel_ledger_flights" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_travel_ledger_flights_parent_id_idx" ON "_travel_memories_v_version_travel_ledger_flights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_travel_ledger_flights_locales_loc" ON "_travel_memories_v_version_travel_ledger_flights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_travel_ledger_lodgings_order_idx" ON "_travel_memories_v_version_travel_ledger_lodgings" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_travel_ledger_lodgings_parent_id_idx" ON "_travel_memories_v_version_travel_ledger_lodgings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_travel_ledger_lodgings_locales_lo" ON "_travel_memories_v_version_travel_ledger_lodgings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_story_sections_links_order_idx" ON "_travel_memories_v_version_story_sections_links" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_story_sections_links_parent_id_idx" ON "_travel_memories_v_version_story_sections_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_story_sections_links_locales_loca" ON "_travel_memories_v_version_story_sections_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_story_sections_order_idx" ON "_travel_memories_v_version_story_sections" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_story_sections_parent_id_idx" ON "_travel_memories_v_version_story_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_story_sections_locales_locale_par" ON "_travel_memories_v_version_story_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_external_videos_order_idx" ON "_travel_memories_v_version_external_videos" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_external_videos_parent_id_idx" ON "_travel_memories_v_version_external_videos" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_external_videos_locales_locale_pa" ON "_travel_memories_v_version_external_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_parent_idx" ON "_travel_memories_v" USING btree ("parent_id");
  CREATE INDEX "_travel_memories_v_version_version_slug_idx" ON "_travel_memories_v" USING btree ("version_slug");
  CREATE INDEX "_travel_memories_v_version_version_start_date_idx" ON "_travel_memories_v" USING btree ("version_start_date");
  CREATE INDEX "_travel_memories_v_version_version_end_date_idx" ON "_travel_memories_v" USING btree ("version_end_date");
  CREATE INDEX "_travel_memories_v_version_version_cover_image_idx" ON "_travel_memories_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_travel_memories_v_version_version_origin_plan_idx" ON "_travel_memories_v" USING btree ("version_origin_plan_id");
  CREATE INDEX "_travel_memories_v_version_version_updated_at_idx" ON "_travel_memories_v" USING btree ("version_updated_at");
  CREATE INDEX "_travel_memories_v_version_version_created_at_idx" ON "_travel_memories_v" USING btree ("version_created_at");
  CREATE INDEX "_travel_memories_v_version_version__status_idx" ON "_travel_memories_v" USING btree ("version__status");
  CREATE INDEX "_travel_memories_v_created_at_idx" ON "_travel_memories_v" USING btree ("created_at");
  CREATE INDEX "_travel_memories_v_updated_at_idx" ON "_travel_memories_v" USING btree ("updated_at");
  CREATE INDEX "_travel_memories_v_snapshot_idx" ON "_travel_memories_v" USING btree ("snapshot");
  CREATE INDEX "_travel_memories_v_published_locale_idx" ON "_travel_memories_v" USING btree ("published_locale");
  CREATE INDEX "_travel_memories_v_latest_idx" ON "_travel_memories_v" USING btree ("latest");
  CREATE INDEX "_travel_memories_v_autosave_idx" ON "_travel_memories_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_travel_memories_v_locales_locale_parent_id_unique" ON "_travel_memories_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_rels_order_idx" ON "_travel_memories_v_rels" USING btree ("order");
  CREATE INDEX "_travel_memories_v_rels_parent_idx" ON "_travel_memories_v_rels" USING btree ("parent_id");
  CREATE INDEX "_travel_memories_v_rels_path_idx" ON "_travel_memories_v_rels" USING btree ("path");
  CREATE INDEX "_travel_memories_v_rels_users_id_idx" ON "_travel_memories_v_rels" USING btree ("users_id");
  CREATE INDEX "_travel_memories_v_rels_media_id_idx" ON "_travel_memories_v_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "travel_route_identities_slug_idx" ON "travel_route_identities" USING btree ("slug");
  CREATE UNIQUE INDEX "travel_route_identities_owner_key_idx" ON "travel_route_identities" USING btree ("owner_key");
  CREATE INDEX "travel_route_identities_updated_at_idx" ON "travel_route_identities" USING btree ("updated_at");
  CREATE INDEX "travel_route_identities_created_at_idx" ON "travel_route_identities" USING btree ("created_at");
  CREATE INDEX "travel_route_identities_rels_order_idx" ON "travel_route_identities_rels" USING btree ("order");
  CREATE INDEX "travel_route_identities_rels_parent_idx" ON "travel_route_identities_rels" USING btree ("parent_id");
  CREATE INDEX "travel_route_identities_rels_path_idx" ON "travel_route_identities_rels" USING btree ("path");
  CREATE INDEX "travel_route_identities_rels_travel_plans_id_idx" ON "travel_route_identities_rels" USING btree ("travel_plans_id");
  CREATE INDEX "travel_route_identities_rels_travel_memories_id_idx" ON "travel_route_identities_rels" USING btree ("travel_memories_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_travel_plans_fk" FOREIGN KEY ("travel_plans_id") REFERENCES "public"."travel_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_travel_memories_fk" FOREIGN KEY ("travel_memories_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_travel_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("travel_plans_id");
  CREATE INDEX "payload_locked_documents_rels_travel_memories_id_idx" ON "payload_locked_documents_rels" USING btree ("travel_memories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travel_plans_guest_participants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_guest_participants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_planning_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_planning_sections_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_planning_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_planning_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_plans_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_guest_participants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_guest_participants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_planning_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_planning_sections_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_planning_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_version_planning_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_plans_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_guest_participants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_guest_participants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_daily_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_daily_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_travel_ledger_flights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_travel_ledger_flights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_travel_ledger_lodgings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_story_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_story_sections_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_story_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_story_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_external_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_external_videos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_memories_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_guest_participants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_guest_participants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_daily_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_story_sections_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_story_sections_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_story_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_story_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_external_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_version_external_videos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_travel_memories_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_route_identities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travel_route_identities_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_travel_plans_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_travel_memories_fk";
  DROP INDEX "payload_locked_documents_rels_travel_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_travel_memories_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "travel_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "travel_memories_id";
  DROP TABLE "travel_plans_guest_participants" CASCADE;
  DROP TABLE "travel_plans_guest_participants_locales" CASCADE;
  DROP TABLE "travel_plans_planning_sections_links" CASCADE;
  DROP TABLE "travel_plans_planning_sections_links_locales" CASCADE;
  DROP TABLE "travel_plans_planning_sections" CASCADE;
  DROP TABLE "travel_plans_planning_sections_locales" CASCADE;
  DROP TABLE "travel_plans" CASCADE;
  DROP TABLE "travel_plans_locales" CASCADE;
  DROP TABLE "travel_plans_rels" CASCADE;
  DROP TABLE "_travel_plans_v_version_guest_participants" CASCADE;
  DROP TABLE "_travel_plans_v_version_guest_participants_locales" CASCADE;
  DROP TABLE "_travel_plans_v_version_planning_sections_links" CASCADE;
  DROP TABLE "_travel_plans_v_version_planning_sections_links_locales" CASCADE;
  DROP TABLE "_travel_plans_v_version_planning_sections" CASCADE;
  DROP TABLE "_travel_plans_v_version_planning_sections_locales" CASCADE;
  DROP TABLE "_travel_plans_v" CASCADE;
  DROP TABLE "_travel_plans_v_locales" CASCADE;
  DROP TABLE "_travel_plans_v_rels" CASCADE;
  DROP TABLE "travel_memories_guest_participants" CASCADE;
  DROP TABLE "travel_memories_guest_participants_locales" CASCADE;
  DROP TABLE "travel_memories_daily_highlights" CASCADE;
  DROP TABLE "travel_memories_daily_highlights_locales" CASCADE;
  DROP TABLE "travel_memories_travel_ledger_flights" CASCADE;
  DROP TABLE "travel_memories_travel_ledger_flights_locales" CASCADE;
  DROP TABLE "travel_memories_travel_ledger_lodgings" CASCADE;
  DROP TABLE "travel_memories_travel_ledger_lodgings_locales" CASCADE;
  DROP TABLE "travel_memories_story_sections_links" CASCADE;
  DROP TABLE "travel_memories_story_sections_links_locales" CASCADE;
  DROP TABLE "travel_memories_story_sections" CASCADE;
  DROP TABLE "travel_memories_story_sections_locales" CASCADE;
  DROP TABLE "travel_memories_external_videos" CASCADE;
  DROP TABLE "travel_memories_external_videos_locales" CASCADE;
  DROP TABLE "travel_memories" CASCADE;
  DROP TABLE "travel_memories_locales" CASCADE;
  DROP TABLE "travel_memories_rels" CASCADE;
  DROP TABLE "_travel_memories_v_version_guest_participants" CASCADE;
  DROP TABLE "_travel_memories_v_version_guest_participants_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_daily_highlights" CASCADE;
  DROP TABLE "_travel_memories_v_version_daily_highlights_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_travel_ledger_flights" CASCADE;
  DROP TABLE "_travel_memories_v_version_travel_ledger_flights_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_travel_ledger_lodgings" CASCADE;
  DROP TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_story_sections_links" CASCADE;
  DROP TABLE "_travel_memories_v_version_story_sections_links_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_story_sections" CASCADE;
  DROP TABLE "_travel_memories_v_version_story_sections_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_external_videos" CASCADE;
  DROP TABLE "_travel_memories_v_version_external_videos_locales" CASCADE;
  DROP TABLE "_travel_memories_v" CASCADE;
  DROP TABLE "_travel_memories_v_locales" CASCADE;
  DROP TABLE "_travel_memories_v_rels" CASCADE;
  DROP TABLE "travel_route_identities" CASCADE;
  DROP TABLE "travel_route_identities_rels" CASCADE;
  DROP TYPE "public"."enum_travel_plans_planning_sections_kind";
  DROP TYPE "public"."enum_travel_plans_status";
  DROP TYPE "public"."enum__travel_plans_v_version_planning_sections_kind";
  DROP TYPE "public"."enum__travel_plans_v_version_status";
  DROP TYPE "public"."enum__travel_plans_v_published_locale";
  DROP TYPE "public"."enum_travel_memories_story_sections_kind";
  DROP TYPE "public"."enum_travel_memories_status";
  DROP TYPE "public"."enum__travel_memories_v_version_story_sections_kind";
  DROP TYPE "public"."enum__travel_memories_v_version_status";
  DROP TYPE "public"."enum__travel_memories_v_published_locale";`)
}
