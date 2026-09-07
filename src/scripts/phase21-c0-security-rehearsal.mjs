import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { boundedC0Sql } from './phase21-c0-response.mjs'

const sql = readFileSync('docs/phase-artifacts/phase-21/phase-21-c0-security.sql', 'utf8')
const input = `\\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE c0_reader;
CREATE TABLE public.c0_security_fixture (id integer PRIMARY KEY, note text);
ALTER TABLE public.c0_security_fixture ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION pg_temp.security_inventory(text[],bigint) RETURNS TABLE(bytes integer,body text)
LANGUAGE SQL STABLE AS $query$ ${boundedC0Sql(sql)} $query$;
CREATE TEMP TABLE clean AS SELECT body::jsonb->0 AS item FROM pg_temp.security_inventory(ARRAY['c0_security_fixture'],0);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM clean WHERE (item->>'rls_enabled')::boolean AND NOT (item->>'public_table_grant')::boolean AND NOT (item->>'public_column_grant')::boolean) THEN RAISE EXCEPTION 'clean fixture flags failed'; END IF;
 IF EXISTS (SELECT 1 FROM clean, jsonb_array_elements(item->'restricted_role_access') role WHERE (role->>'table_access')::boolean OR (role->>'column_access')::boolean OR NOT (role->>'exists')::boolean) THEN RAISE EXCEPTION 'clean roles failed'; END IF;
END $$;
GRANT SELECT ON public.c0_security_fixture TO c0_reader;
GRANT c0_reader TO anon;
CREATE TEMP TABLE inherited AS SELECT body::jsonb->0 AS item FROM pg_temp.security_inventory(ARRAY['c0_security_fixture'],0);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM inherited, jsonb_array_elements(item->'restricted_role_access') role WHERE role->>'role'='anon' AND (role->>'table_access')::boolean) THEN RAISE EXCEPTION 'inherited grant missed'; END IF;
END $$;
REVOKE c0_reader FROM anon;
GRANT SELECT(note) ON public.c0_security_fixture TO PUBLIC;
CREATE TEMP TABLE public_column AS SELECT body::jsonb->0 AS item FROM pg_temp.security_inventory(ARRAY['c0_security_fixture'],0);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public_column WHERE (item->>'public_column_grant')::boolean) THEN RAISE EXCEPTION 'public column missed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public_column, jsonb_array_elements(item->'restricted_role_access') role WHERE role->>'role'='authenticated' AND (role->>'column_access')::boolean) THEN RAISE EXCEPTION 'effective public column missed'; END IF;
END $$;
ROLLBACK;
SELECT 'C0_SECURITY_SQL_REHEARSAL_PASS' AS result;
`
const output = execFileSync('docker', ['exec', '-i', 'li-family-phase21-c0-mapping', 'psql', '-U', 'postgres', '-d', 'postgres'], { input, encoding: 'utf8', timeout: 30000 })
if (!output.includes('C0_SECURITY_SQL_REHEARSAL_PASS')) throw new Error('Missing completion')
console.log(JSON.stringify({ status: 'C0_SECURITY_SQL_REHEARSAL_PASS', syntheticOnly: true, productionConnections: 0,
  sqlSha256: createHash('sha256').update(sql).digest('hex'), cases: ['clean-roles', 'inherited-table-grant', 'public-column-grant'] }))
