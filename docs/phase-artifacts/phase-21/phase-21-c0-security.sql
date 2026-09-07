-- $1 reviewed exact table-name allowlist, $2 last pg_class oid (initially 0).
-- Only fields consumed by the fail-closed security validator. Never derive
-- cleanup targets from this result automatically, and keep page responses
-- below the runner's 64 KiB bound.
SELECT c.oid::bigint AS legacy_relation_id, c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  (SELECT jsonb_agg(jsonb_build_object('role',wanted.name,'exists',r.oid IS NOT NULL,
    'superuser',r.rolsuper,'bypass_rls',r.rolbypassrls,
    'table_access',CASE WHEN r.oid IS NULL THEN NULL ELSE has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') END,
    'column_access',CASE WHEN r.oid IS NULL THEN NULL ELSE has_any_column_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,REFERENCES') END)
    ORDER BY wanted.name)
    FROM (VALUES ('anon'),('authenticated')) wanted(name)
    LEFT JOIN pg_roles r ON r.rolname=wanted.name) AS restricted_role_access,
  EXISTS (SELECT 1 FROM aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl WHERE acl.grantee=0) AS public_table_grant,
  EXISTS (SELECT 1 FROM pg_attribute a CROSS JOIN LATERAL aclexplode(a.attacl) acl
    WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped AND acl.grantee=0) AS public_column_grant
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname=ANY($1::text[]) AND c.oid::bigint>$2
ORDER BY c.oid
LIMIT 101;
