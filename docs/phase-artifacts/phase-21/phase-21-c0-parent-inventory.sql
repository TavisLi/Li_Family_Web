-- Fixed three Memory slugs in $1. No historical owner/version count assumptions.
-- LIMIT 4 permits the executor to detect excess/duplicate parents before mapping.
SELECT memory.id AS legacy_relation_id, memory.id AS memory_id, memory.slug,
  memory._status::text AS status,
  (SELECT count(*) FROM travel_memories_locales l WHERE l._parent_id=memory.id) AS locale_count,
  (SELECT count(*) FROM _travel_memories_v v WHERE v.parent_id=memory.id) AS version_count,
  (SELECT count(*) FROM _travel_memories_v v WHERE v.parent_id=memory.id AND v.latest) AS latest_version_count,
  (SELECT max(v.id) FROM _travel_memories_v v WHERE v.parent_id=memory.id AND v.latest) AS latest_version_id,
  (SELECT max(v.version__status::text) FROM _travel_memories_v v WHERE v.parent_id=memory.id AND v.latest) AS latest_version_status,
  (SELECT count(*) FROM travel_memories_daily_highlights h WHERE h._parent_id=memory.id) AS highlight_count,
  (SELECT count(*) FROM travel_memories_rels r WHERE r.parent_id=memory.id AND r.path='itineraryImages') AS itinerary_count,
  (SELECT count(*) FROM travel_memories_rels r WHERE r.parent_id=memory.id AND r.path='galleryImages') AS gallery_count,
  (SELECT count(*) FROM travel_memory_days d WHERE d.memory_id=memory.id) AS day_count,
  (SELECT count(*) FROM travel_memory_days d WHERE d.memory_id=memory.id AND d._status='published') AS published_day_count,
  (SELECT count(*) FROM travel_memory_days d WHERE d.memory_id=memory.id AND nullif(btrim(d.day_key),'') IS NULL) AS missing_day_key_count,
  (SELECT count(*) FROM travel_memory_days d JOIN travel_memory_days_moments m ON m._parent_id=d.id WHERE d.memory_id=memory.id) AS moment_count,
  (SELECT count(*) FROM travel_memory_days d JOIN travel_memory_days_moments m ON m._parent_id=d.id JOIN travel_memory_days_moments_placements p ON p._parent_id=m.id WHERE d.memory_id=memory.id) AS placement_count
FROM travel_memories memory
WHERE memory.slug=ANY($1::text[])
ORDER BY memory.id
LIMIT 4;
