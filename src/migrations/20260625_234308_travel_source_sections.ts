import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "travel_projects_source_sections_links" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"url" varchar NOT NULL
  );

  CREATE TABLE "travel_projects_source_sections_links_locales" (
	"label" varchar NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "travel_projects_source_sections" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"level" numeric NOT NULL,
	"anchor" varchar NOT NULL
  );

  CREATE TABLE "travel_projects_source_sections_locales" (
	"title" varchar NOT NULL,
	"body" varchar NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "travel_projects_source_sections_links" ADD CONSTRAINT "travel_projects_source_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_projects_source_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_projects_source_sections_links_locales" ADD CONSTRAINT "travel_projects_source_sections_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_projects_source_sections_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_projects_source_sections" ADD CONSTRAINT "travel_projects_source_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "travel_projects_source_sections_locales" ADD CONSTRAINT "travel_projects_source_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travel_projects_source_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "travel_projects_source_sections_links_order_idx" ON "travel_projects_source_sections_links" USING btree ("_order");
  CREATE INDEX "travel_projects_source_sections_links_parent_id_idx" ON "travel_projects_source_sections_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_projects_source_sections_links_locales_locale_parent_" ON "travel_projects_source_sections_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "travel_projects_source_sections_order_idx" ON "travel_projects_source_sections" USING btree ("_order");
  CREATE INDEX "travel_projects_source_sections_parent_id_idx" ON "travel_projects_source_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "travel_projects_source_sections_locales_locale_parent_id_uni" ON "travel_projects_source_sections_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "travel_projects_source_sections_links" CASCADE;
  DROP TABLE "travel_projects_source_sections_links_locales" CASCADE;
  DROP TABLE "travel_projects_source_sections" CASCADE;
  DROP TABLE "travel_projects_source_sections_locales" CASCADE;`)
}
