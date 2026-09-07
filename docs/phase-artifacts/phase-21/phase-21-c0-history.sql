-- $1 cursor, initially 0. Preserve dev marker; observe only.
SELECT id AS legacy_relation_id, name, batch
FROM public.payload_migrations
WHERE id>$1
ORDER BY id
LIMIT 101;
