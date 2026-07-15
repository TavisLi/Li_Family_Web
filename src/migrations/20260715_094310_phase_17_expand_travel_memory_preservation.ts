import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "travel_memories_daily_highlights_segments" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "time" varchar
  );

  CREATE TABLE "travel_memories_daily_highlights_segments_locales" (
    "activity" varchar,
    "transport" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_reminders_items" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "travel_memories_reminders_items_locales" (
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_memories_reminders" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "travel_memories_reminders_locales" (
    "category" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_daily_highlights_segments" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "time" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_daily_highlights_segments_locales" (
    "activity" varchar,
    "transport" varchar,
    "notes" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_reminders_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_reminders_items_locales" (
    "text" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_travel_memories_v_version_reminders" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_travel_memories_v_version_reminders_locales" (
    "category" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  ALTER TABLE "travel_memories_daily_highlights" ADD COLUMN "date_label" varchar;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD COLUMN "theme" varchar;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD COLUMN "meals_breakfast" varchar;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD COLUMN "meals_lunch" varchar;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD COLUMN "meals_dinner" varchar;
  ALTER TABLE "travel_memories_daily_highlights_locales" ADD COLUMN "lodging" varchar;
  ALTER TABLE "travel_memories_travel_ledger_flights" ADD COLUMN "date_label" varchar;
  ALTER TABLE "travel_memories_travel_ledger_flights" ADD COLUMN "terminal" varchar;
  ALTER TABLE "travel_memories_travel_ledger_flights_locales" ADD COLUMN "passengers" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings" ADD COLUMN "date_range" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD COLUMN "address" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD COLUMN "room_type" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD COLUMN "booking_channel" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD COLUMN "price" varchar;
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" ADD COLUMN "highlights" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights" ADD COLUMN "date_label" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD COLUMN "theme" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD COLUMN "meals_breakfast" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD COLUMN "meals_lunch" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD COLUMN "meals_dinner" varchar;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" ADD COLUMN "lodging" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" ADD COLUMN "date_label" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" ADD COLUMN "terminal" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights_locales" ADD COLUMN "passengers" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings" ADD COLUMN "date_range" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD COLUMN "address" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD COLUMN "room_type" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD COLUMN "booking_channel" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD COLUMN "price" varchar;
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" ADD COLUMN "highlights" varchar;
  ALTER TABLE "travel_memories_daily_highlights_segments" ADD CONSTRAINT "travel_memories_daily_highlights_segments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_daily_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_daily_highlights_segments_locales" ADD CONSTRAINT "travel_memories_daily_highlights_segments_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_daily_highlights_segments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_reminders_items" ADD CONSTRAINT "travel_memories_reminders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_reminders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_reminders_items_locales" ADD CONSTRAINT "travel_memories_reminders_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_reminders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_reminders" ADD CONSTRAINT "travel_memories_reminders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_memories_reminders_locales" ADD CONSTRAINT "travel_memories_reminders_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_memories_reminders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_segments" ADD CONSTRAINT "_travel_memories_v_version_daily_highlights_segments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_daily_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_daily_highlights_segments_locales" ADD CONSTRAINT "_travel_memories_v_version_daily_highlights_segments_loca_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_daily_highlights_segments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_reminders_items" ADD CONSTRAINT "_travel_memories_v_version_reminders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_reminders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_reminders_items_locales" ADD CONSTRAINT "_travel_memories_v_version_reminders_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_reminders_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_reminders" ADD CONSTRAINT "_travel_memories_v_version_reminders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_travel_memories_v_version_reminders_locales" ADD CONSTRAINT "_travel_memories_v_version_reminders_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_travel_memories_v_version_reminders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "travel_memories_daily_highlights_segments_order_idx" ON "travel_memories_daily_highlights_segments" USING btree ("_order");
  CREATE INDEX "travel_memories_daily_highlights_segments_parent_id_idx" ON "travel_memories_daily_highlights_segments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_daily_highlights_segments_locales_locale_par" ON "travel_memories_daily_highlights_segments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_reminders_items_order_idx" ON "travel_memories_reminders_items" USING btree ("_order");
  CREATE INDEX "travel_memories_reminders_items_parent_id_idx" ON "travel_memories_reminders_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_reminders_items_locales_locale_parent_id_uni" ON "travel_memories_reminders_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_memories_reminders_order_idx" ON "travel_memories_reminders" USING btree ("_order");
  CREATE INDEX "travel_memories_reminders_parent_id_idx" ON "travel_memories_reminders" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_memories_reminders_locales_locale_parent_id_unique" ON "travel_memories_reminders_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_daily_highlights_segments_order_idx" ON "_travel_memories_v_version_daily_highlights_segments" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_daily_highlights_segments_parent_id_idx" ON "_travel_memories_v_version_daily_highlights_segments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_daily_highlights_segments_local_1" ON "_travel_memories_v_version_daily_highlights_segments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_reminders_items_order_idx" ON "_travel_memories_v_version_reminders_items" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_reminders_items_parent_id_idx" ON "_travel_memories_v_version_reminders_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_reminders_items_locales_locale_pa" ON "_travel_memories_v_version_reminders_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_travel_memories_v_version_reminders_order_idx" ON "_travel_memories_v_version_reminders" USING btree ("_order");
  CREATE INDEX "_travel_memories_v_version_reminders_parent_id_idx" ON "_travel_memories_v_version_reminders" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_travel_memories_v_version_reminders_locales_locale_parent_i" ON "_travel_memories_v_version_reminders_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "travel_memories_daily_highlights_segments" CASCADE;
  DROP TABLE "travel_memories_daily_highlights_segments_locales" CASCADE;
  DROP TABLE "travel_memories_reminders_items" CASCADE;
  DROP TABLE "travel_memories_reminders_items_locales" CASCADE;
  DROP TABLE "travel_memories_reminders" CASCADE;
  DROP TABLE "travel_memories_reminders_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_daily_highlights_segments" CASCADE;
  DROP TABLE "_travel_memories_v_version_daily_highlights_segments_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_reminders_items" CASCADE;
  DROP TABLE "_travel_memories_v_version_reminders_items_locales" CASCADE;
  DROP TABLE "_travel_memories_v_version_reminders" CASCADE;
  DROP TABLE "_travel_memories_v_version_reminders_locales" CASCADE;
  ALTER TABLE "travel_memories_daily_highlights" DROP COLUMN "date_label";
  ALTER TABLE "travel_memories_daily_highlights_locales" DROP COLUMN "theme";
  ALTER TABLE "travel_memories_daily_highlights_locales" DROP COLUMN "meals_breakfast";
  ALTER TABLE "travel_memories_daily_highlights_locales" DROP COLUMN "meals_lunch";
  ALTER TABLE "travel_memories_daily_highlights_locales" DROP COLUMN "meals_dinner";
  ALTER TABLE "travel_memories_daily_highlights_locales" DROP COLUMN "lodging";
  ALTER TABLE "travel_memories_travel_ledger_flights" DROP COLUMN "date_label";
  ALTER TABLE "travel_memories_travel_ledger_flights" DROP COLUMN "terminal";
  ALTER TABLE "travel_memories_travel_ledger_flights_locales" DROP COLUMN "passengers";
  ALTER TABLE "travel_memories_travel_ledger_lodgings" DROP COLUMN "date_range";
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DROP COLUMN "address";
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DROP COLUMN "room_type";
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DROP COLUMN "booking_channel";
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DROP COLUMN "price";
  ALTER TABLE "travel_memories_travel_ledger_lodgings_locales" DROP COLUMN "highlights";
  ALTER TABLE "_travel_memories_v_version_daily_highlights" DROP COLUMN "date_label";
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DROP COLUMN "theme";
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DROP COLUMN "meals_breakfast";
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DROP COLUMN "meals_lunch";
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DROP COLUMN "meals_dinner";
  ALTER TABLE "_travel_memories_v_version_daily_highlights_locales" DROP COLUMN "lodging";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" DROP COLUMN "date_label";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights" DROP COLUMN "terminal";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_flights_locales" DROP COLUMN "passengers";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings" DROP COLUMN "date_range";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DROP COLUMN "address";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DROP COLUMN "room_type";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DROP COLUMN "booking_channel";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DROP COLUMN "price";
  ALTER TABLE "_travel_memories_v_version_travel_ledger_lodgings_locales" DROP COLUMN "highlights";`)
}
