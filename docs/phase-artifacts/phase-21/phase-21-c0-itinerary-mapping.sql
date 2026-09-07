-- C0 query candidate; not a standalone Production executor or cleanup approval.
-- $1: exact three approved Memory slugs; $2: last relation id (initially 0).
-- Return at most 101 rows: executor accepts 100 and treats the extra row as
-- pagination evidence. Repeat in the SAME read-only snapshot, never by OFFSET.
-- Run only after a unique-parent check and with statement_timeout=15000.
-- Counts are bounded output; candidate_count does not establish content parity.
SELECT
  memory.slug,
  memory.id AS memory_id,
  rel.id AS legacy_relation_id,
  rel.media_id,
  rel."order" AS legacy_order,
  (
    SELECT count(*)
    FROM travel_memories_rels sibling
    WHERE sibling.parent_id = memory.id
      AND sibling.path = 'itineraryImages'
      AND sibling.media_id = rel.media_id
  ) AS legacy_usage_count,
  (
    SELECT count(*)
    FROM travel_memory_days day
    JOIN travel_memory_days_moments moment ON moment._parent_id = day.id
    JOIN travel_memory_days_moments_placements placement ON placement._parent_id = moment.id
    WHERE day.memory_id = memory.id
      AND placement.type = 'photo'
      AND placement.media_id = rel.media_id
  ) AS candidate_count,
  (
    SELECT count(*)
    FROM travel_memory_days day
    JOIN travel_memory_days_moments moment ON moment._parent_id = day.id
    JOIN travel_memory_days_moments_placements placement ON placement._parent_id = moment.id
    WHERE day.memory_id = memory.id
      AND placement.type = 'photo'
      AND placement.media_id = rel.media_id
      AND day._status = 'published'
      AND nullif(btrim(day.day_key), '') IS NOT NULL
      AND nullif(btrim(moment.moment_key), '') IS NOT NULL
      AND nullif(btrim(placement.placement_key), '') IS NOT NULL
  ) AS published_keyed_candidate_count,
  destinations.items AS destinations
FROM travel_memories memory
JOIN travel_memories_rels rel ON rel.parent_id = memory.id
LEFT JOIN LATERAL (
  SELECT CASE WHEN count(*) > 20 THEN NULL
    ELSE coalesce(jsonb_agg(to_jsonb(candidate) ORDER BY candidate.day_id, candidate.moment_id, candidate.placement_id), '[]'::jsonb)
    END AS items
  FROM (
    SELECT day.id AS day_id, day.day_key, day._status::text AS day_status,
      moment.id AS moment_id, moment.moment_key,
      placement.id AS placement_id, placement.placement_key
    FROM travel_memory_days day
    JOIN travel_memory_days_moments moment ON moment._parent_id = day.id
    JOIN travel_memory_days_moments_placements placement ON placement._parent_id = moment.id
    WHERE day.memory_id = memory.id AND placement.type = 'photo' AND placement.media_id = rel.media_id
    ORDER BY day.id, moment.id, placement.id
    LIMIT 21
  ) candidate
) destinations ON true
WHERE memory.slug = ANY($1::text[])
  AND rel.path = 'itineraryImages'
  AND rel.id > $2
ORDER BY rel.id
LIMIT 101;
