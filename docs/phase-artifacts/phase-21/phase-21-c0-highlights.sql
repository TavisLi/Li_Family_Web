-- $1 exact Memory slugs; $2 last legacy highlight id (initially empty string).
-- No Day foreign key or dayKey exists on this legacy array. Report unmapped
-- identity explicitly; never synthesize an approved destination from day/order.
SELECT h.id AS legacy_relation_id, m.id AS memory_id, m.slug,
  h.day::text AS legacy_day, h.date::text AS legacy_date, h._order AS legacy_order,
  (SELECT count(*) FROM travel_memories_daily_highlights_locales l WHERE l._parent_id=h.id) AS locale_count,
  (SELECT md5(coalesce(jsonb_agg(to_jsonb(l) ORDER BY l._locale)::text, '[]'))
    FROM travel_memories_daily_highlights_locales l WHERE l._parent_id=h.id) AS locale_change_fingerprint,
  'UNMAPPED_NO_STABLE_LINK'::text AS mapping_status
FROM travel_memories m
JOIN travel_memories_daily_highlights h ON h._parent_id=m.id
WHERE m.slug=ANY($1::text[]) AND h.id COLLATE "C" > $2::text COLLATE "C"
ORDER BY h.id COLLATE "C"
LIMIT 101;
