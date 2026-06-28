import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "public_contact_email" varchar;
  ALTER TABLE "users" ADD COLUMN "public_contact_phone" varchar;
  ALTER TABLE "users_locales" ADD COLUMN "public_contact_site_title" varchar;
  ALTER TABLE "users_locales" ADD COLUMN "public_contact_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "public_contact_email";
  ALTER TABLE "users" DROP COLUMN "public_contact_phone";
  ALTER TABLE "users_locales" DROP COLUMN "public_contact_site_title";
  ALTER TABLE "users_locales" DROP COLUMN "public_contact_description";`)
}
