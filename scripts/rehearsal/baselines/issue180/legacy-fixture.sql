-- Deterministic synthetic legacy Plan, both locales and version history.
INSERT INTO public.travel_plans(id,slug,is_private,_status,source_metadata_base_projection) VALUES (-180,'synthetic-legacy-180',true,'draft','{"legacy":"preserve"}');
INSERT INTO public.travel_plans_locales(id,_parent_id,_locale,title) VALUES (-180,-180,'zh-TW','合成舊行程'),(-181,-180,'en','Synthetic legacy plan');
INSERT INTO public.travel_plans_planning_sections(id,_order,_parent_id,anchor) VALUES ('synthetic-section-180',1,-180,'legacy-anchor');
INSERT INTO public._travel_plans_v(id,parent_id,version_slug,version_source_metadata_base_projection,snapshot) VALUES (-180,-180,'synthetic-legacy-180','{"history":"preserve"}',true);
INSERT INTO public._travel_plans_v_locales(id,_parent_id,_locale,version_title) VALUES (-180,-180,'zh-TW','歷史版本'),(-181,-180,'en','Historical version');
