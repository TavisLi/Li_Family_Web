import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { boundedC0Sql } from './phase21-c0-response.mjs'

// Fixed local container; never reads environment credentials or contacts Production.
const query = readFileSync('docs/phase-artifacts/phase-21/phase-21-c0-itinerary-mapping.sql', 'utf8')
const parentSql = readFileSync('docs/phase-artifacts/phase-21/phase-21-c0-parent-inventory.sql', 'utf8')
const highlightSql = readFileSync('docs/phase-artifacts/phase-21/phase-21-c0-highlights.sql', 'utf8')
const daySql = readFileSync('docs/phase-artifacts/phase-21/phase-21-c0-days.sql', 'utf8')
const fixture = readFileSync('src/scripts/phase21-c0-mapping-rehearsal.sql', 'utf8')
const functionSql = `CREATE FUNCTION pg_temp.c0(text[], integer) RETURNS TABLE
 (slug text,memory_id integer,legacy_relation_id integer,media_id integer,legacy_order integer,
 legacy_usage_count bigint,candidate_count bigint,published_keyed_candidate_count bigint,destinations jsonb)
 LANGUAGE SQL STABLE AS $query$ ${query} $query$;`
const boundedFunction = `CREATE FUNCTION pg_temp.c0_bounded(text[], integer) RETURNS TABLE(bytes integer, body text)
 LANGUAGE SQL STABLE AS $bounded$ ${boundedC0Sql(query)} $bounded$;`
const oversizedQuery = boundedC0Sql("SELECT 1 AS legacy_relation_id, repeat('x', 65536) AS synthetic")
const capTests = `
CREATE FUNCTION pg_temp.c0_highlights(text[],text) RETURNS TABLE(bytes integer,body text)
 LANGUAGE SQL STABLE AS $highlights$ ${boundedC0Sql(highlightSql)} $highlights$;
CREATE FUNCTION pg_temp.c0_days(text[],integer) RETURNS TABLE(bytes integer,body text)
 LANGUAGE SQL STABLE AS $days$ ${boundedC0Sql(daySql)} $days$;
CREATE TEMP TABLE highlights AS SELECT jsonb_array_elements(body::jsonb) AS item FROM pg_temp.c0_highlights(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket'],'');
DO $$ BEGIN
 IF (SELECT count(*) FROM highlights)<>2 THEN RAISE EXCEPTION 'highlight scope failed'; END IF;
 IF EXISTS (SELECT 1 FROM highlights WHERE item->>'mapping_status'<>'UNMAPPED_NO_STABLE_LINK') THEN RAISE EXCEPTION 'inferred day mapping'; END IF;
 IF (SELECT count(DISTINCT item->>'locale_change_fingerprint') FROM highlights)<>2 THEN RAISE EXCEPTION 'locale changes hidden'; END IF;
 IF (SELECT jsonb_array_length(body::jsonb) FROM pg_temp.c0_highlights(ARRAY['201307-hainan'],'h1'))<>1 THEN RAISE EXCEPTION 'text cursor failed'; END IF;
 IF (SELECT jsonb_array_length(body::jsonb) FROM pg_temp.c0_days(ARRAY['201307-hainan'],0))<>2 THEN RAISE EXCEPTION 'day scope failed'; END IF;
END $$;
CREATE FUNCTION pg_temp.c0_parents(text[]) RETURNS TABLE(bytes integer, body text)
 LANGUAGE SQL STABLE AS $parents$ ${boundedC0Sql(parentSql)} $parents$;
CREATE TEMP TABLE parents AS SELECT jsonb_array_elements(body::jsonb) AS item FROM pg_temp.c0_parents(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket']);
DO $$ BEGIN
 IF (SELECT count(*) FROM parents)<>3 THEN RAISE EXCEPTION 'parent scope failed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM parents WHERE item->>'slug'='201307-hainan' AND item->>'latest_version_id'='19' AND item->>'day_count'='2') THEN RAISE EXCEPTION 'parent counts failed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM parents WHERE item->>'slug'='202308-east-australia' AND item->>'latest_version_status'='draft') THEN RAISE EXCEPTION 'draft observation failed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM parents WHERE item->>'slug'='202602-thailand-phuket' AND item->>'day_count'='0') THEN RAISE EXCEPTION 'zero day inventory failed'; END IF;
END $$;
CREATE TEMP TABLE envelope AS SELECT * FROM pg_temp.c0_bounded(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket'],0);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM envelope WHERE bytes=octet_length(body) AND jsonb_array_length(body::jsonb)=101) THEN RAISE EXCEPTION 'bounded mapping parity failed'; END IF;
END $$;
CREATE TEMP TABLE oversized AS ${oversizedQuery};
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM oversized WHERE bytes>65536 AND body IS NULL) THEN RAISE EXCEPTION 'server body cap failed'; END IF;
END $$;
INSERT INTO travel_memory_days_moments_placements SELECT 'overflow-'||n,'m1','photo',10,'overflow-'||n FROM generate_series(1,19) n;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_temp.c0(ARRAY['201307-hainan'],0) WHERE legacy_relation_id=1 AND candidate_count=21 AND destinations IS NULL) THEN RAISE EXCEPTION 'destination overflow not blocked'; END IF;
END $$;
`
const output = execFileSync('docker', ['exec', '-i', 'li-family-phase21-c0-mapping', 'psql', '-U', 'postgres', '-d', 'postgres'], {
  input: fixture.replace('-- C0_QUERY_FUNCTION', () => functionSql + boundedFunction).replace('ROLLBACK;', () => capTests + 'ROLLBACK;'), encoding: 'utf8', timeout: 30000,
})
if (!output.includes('C0_MAPPING_SQL_REHEARSAL_PASS_SYNTHETIC_ONLY')) throw new Error('Missing rehearsal completion')
console.log(JSON.stringify({ status: 'C0_MAPPING_SQL_REHEARSAL_PASS_SYNTHETIC_ONLY', productionConnections: 0,
  querySha256: createHash('sha256').update(query).digest('hex'),
  parentQuerySha256: createHash('sha256').update(parentSql).digest('hex'),
  cases: ['scope', 'duplicates', 'draft', 'cross-memory', 'missing-key', 'page-cap', 'sentinel', 'bounded-parity', 'server-byte-cap', 'parent-inventory'],
}))
