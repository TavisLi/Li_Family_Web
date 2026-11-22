SELECT '_travel_memories_v.version_cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_memories_v" WHERE "version_cover_image_id" = $1
UNION ALL
SELECT '_travel_memories_v_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_memories_v_rels" WHERE "media_id" = $1
UNION ALL
SELECT '_travel_memory_days_v.version_daily_hero_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_memory_days_v" WHERE "version_daily_hero_image_id" = $1
UNION ALL
SELECT '_travel_memory_days_v_version_moments_placements.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_memory_days_v_version_moments_placements" WHERE "media_id" = $1
UNION ALL
SELECT '_travel_plans_v.version_cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_plans_v" WHERE "version_cover_image_id" = $1
UNION ALL
SELECT '_travel_plans_v_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."_travel_plans_v_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'bucket_items.cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."bucket_items" WHERE "cover_image_id" = $1
UNION ALL
SELECT 'home_config.hero_background_id'::text AS reference, count(*)::bigint AS row_count FROM public."home_config" WHERE "hero_background_id" = $1
UNION ALL
SELECT 'media_locales._parent_id'::text AS reference, count(*)::bigint AS row_count FROM public."media_locales" WHERE "_parent_id" = $1
UNION ALL
SELECT 'media_rels.parent_id'::text AS reference, count(*)::bigint AS row_count FROM public."media_rels" WHERE "parent_id" = $1
UNION ALL
SELECT 'media_tags._parent_id'::text AS reference, count(*)::bigint AS row_count FROM public."media_tags" WHERE "_parent_id" = $1
UNION ALL
SELECT 'payload_locked_documents_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."payload_locked_documents_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'posts.cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."posts" WHERE "cover_image_id" = $1
UNION ALL
SELECT 'timeline_events_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."timeline_events_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'travel_memories.cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_memories" WHERE "cover_image_id" = $1
UNION ALL
SELECT 'travel_memories_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_memories_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'travel_memory_days.daily_hero_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_memory_days" WHERE "daily_hero_image_id" = $1
UNION ALL
SELECT 'travel_memory_days_moments_placements.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_memory_days_moments_placements" WHERE "media_id" = $1
UNION ALL
SELECT 'travel_plans.cover_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_plans" WHERE "cover_image_id" = $1
UNION ALL
SELECT 'travel_plans_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."travel_plans_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'users.avatar_id'::text AS reference, count(*)::bigint AS row_count FROM public."users" WHERE "avatar_id" = $1
UNION ALL
SELECT 'users.card_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."users" WHERE "card_image_id" = $1
UNION ALL
SELECT 'users.hero_image_id'::text AS reference, count(*)::bigint AS row_count FROM public."users" WHERE "hero_image_id" = $1
UNION ALL
SELECT 'users_rels.media_id'::text AS reference, count(*)::bigint AS row_count FROM public."users_rels" WHERE "media_id" = $1
UNION ALL
SELECT 'wrapped_snapshots.hero_media_id'::text AS reference, count(*)::bigint AS row_count FROM public."wrapped_snapshots" WHERE "hero_media_id" = $1
ORDER BY reference;
