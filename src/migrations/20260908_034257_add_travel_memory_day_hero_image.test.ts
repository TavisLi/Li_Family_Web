import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('./20260908_034257_add_travel_memory_day_hero_image.ts', import.meta.url),
  'utf8',
)
const up = source.slice(source.indexOf('export async function up'), source.indexOf('export async function down'))

assert.match(up, /ADD COLUMN "daily_hero_image_id" integer/)
assert.match(up, /ADD COLUMN "version_daily_hero_image_id" integer/)
assert.match(up, /FOREIGN KEY \("daily_hero_image_id"\)/)
assert.match(up, /FOREIGN KEY \("version_daily_hero_image_id"\)/)
assert.match(up, /CREATE INDEX "travel_memory_days_daily_hero_image_idx"/)
assert.match(up, /CREATE INDEX "_travel_memory_days_v_version_version_daily_hero_image_idx"/)
assert.doesNotMatch(up, /\b(?:DELETE FROM|DISABLE ROW LEVEL SECURITY|DROP (?:COLUMN|TABLE|TYPE)|INSERT INTO|UPDATE\s+\S+\s+SET)\b/)

console.log('daily hero image migration is additive')
