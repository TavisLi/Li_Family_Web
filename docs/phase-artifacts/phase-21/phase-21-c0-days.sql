-- Independent canonical identity inventory; not a day-number crosswalk.
SELECT d.id AS legacy_relation_id, m.id AS memory_id, m.slug,
  d.day_identity, d.day_key, d.day::text AS day, d._status::text AS status,
  (SELECT count(*) FROM travel_memory_days_locales l WHERE l._parent_id=d.id) AS locale_count,
  (SELECT count(*) FROM _travel_memory_days_v v WHERE v.parent_id=d.id) AS version_count,
  (SELECT count(*) FROM _travel_memory_days_v v WHERE v.parent_id=d.id AND v.latest) AS latest_version_count,
  (SELECT max(v.id) FROM _travel_memory_days_v v WHERE v.parent_id=d.id AND v.latest) AS latest_version_id,
  (SELECT max(v.version__status::text) FROM _travel_memory_days_v v WHERE v.parent_id=d.id AND v.latest) AS latest_version_status
FROM travel_memories m JOIN travel_memory_days d ON d.memory_id=m.id
WHERE m.slug=ANY($1::text[]) AND d.id > $2
ORDER BY d.id
LIMIT 101;
