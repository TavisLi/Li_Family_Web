import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectMigrationBaseline } from './migration-prerequisites.mjs'
const schema = 'CREATE TABLE public.example (\n    id integer NOT NULL\n);\n'
const up = 'CREATE TABLE "new_child" (\n "id" integer\n);\nALTER TABLE "example" ADD COLUMN "geo" varchar;\nALTER TABLE "new_child" ADD CONSTRAINT "fk" FOREIGN KEY ("id") REFERENCES "public"."example"("id");'
test('checks known names but does not assert fidelity',()=>{const r=inspectMigrationBaseline(schema,up);assert.equal(r.status,'STATIC_NAMES_MATCH_ONLY');assert(r.unknown.includes('roles/RLS/grants parity'))})
test('blocks missing table, conflicting column and missing referenced parent column',()=>{
  assert.deepEqual(inspectMigrationBaseline('',up).missingTables,['example'])
  assert.equal(inspectMigrationBaseline(schema.replace('id integer','id integer,\n    geo varchar'),up).collisions.length,1)
  assert.equal(inspectMigrationBaseline(schema.replace('id integer','other integer'),up).missingParentColumns.length,1)
})
