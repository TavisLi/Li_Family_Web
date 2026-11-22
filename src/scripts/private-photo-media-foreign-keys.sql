SELECT n.nspname AS source_schema, c.relname AS source_table,
       array_agg(a.attname::text ORDER BY k.ordinality) AS source_columns,
       array_agg(target.attname::text ORDER BY k.ordinality) AS target_columns,
       f.confdeltype AS delete_action, f.convalidated AS validated
FROM pg_catalog.pg_constraint AS f
JOIN pg_catalog.pg_class AS c ON c.oid = f.conrelid
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN LATERAL unnest(f.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
JOIN pg_catalog.pg_attribute AS a ON a.attrelid = f.conrelid AND a.attnum = k.attnum
JOIN pg_catalog.pg_attribute AS target ON target.attrelid = f.confrelid AND target.attnum = f.confkey[k.ordinality]
WHERE f.contype = 'f' AND f.confrelid = 'public.media'::regclass
GROUP BY f.oid, n.nspname, c.relname, f.confdeltype, f.convalidated
ORDER BY n.nspname, c.relname, source_columns;
