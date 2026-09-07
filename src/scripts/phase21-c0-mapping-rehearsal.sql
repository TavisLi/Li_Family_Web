\set ON_ERROR_STOP on
-- Synthetic fixtures only; execute inside a dedicated local disposable container.
BEGIN;
CREATE TEMP TABLE travel_memories (id integer PRIMARY KEY, slug text);
ALTER TABLE travel_memories ADD COLUMN _status text DEFAULT 'published';
CREATE TEMP TABLE travel_memories_locales (_parent_id integer);
CREATE TEMP TABLE _travel_memories_v (id integer, parent_id integer, latest boolean, version__status text);
CREATE TEMP TABLE travel_memories_daily_highlights (id text PRIMARY KEY,_parent_id integer,day numeric,date timestamptz,_order integer);
CREATE TEMP TABLE travel_memories_daily_highlights_locales (_parent_id text,_locale text,title text);
CREATE TEMP TABLE travel_memory_days_locales (_parent_id integer);
CREATE TEMP TABLE _travel_memory_days_v (id integer,parent_id integer,latest boolean,version__status text);
CREATE TEMP TABLE travel_memories_rels (id integer PRIMARY KEY, parent_id integer, path text, media_id integer, "order" integer);
CREATE TEMP TABLE travel_memory_days (id integer PRIMARY KEY, memory_id integer, day_key text, _status text);
ALTER TABLE travel_memory_days ADD COLUMN day_identity text;
ALTER TABLE travel_memory_days ADD COLUMN day numeric;
CREATE TEMP TABLE travel_memory_days_moments (id text PRIMARY KEY, _parent_id integer, moment_key text);
CREATE TEMP TABLE travel_memory_days_moments_placements (id text PRIMARY KEY, _parent_id text, type text, media_id integer, placement_key text);
INSERT INTO travel_memories(id,slug) VALUES (1,'201307-hainan'),(2,'202308-east-australia'),(3,'202602-thailand-phuket'),(4,'202702-thailand-phuket');
INSERT INTO _travel_memories_v VALUES (19,1,true,'published'),(20,2,true,'draft'),(21,3,true,'published');
INSERT INTO travel_memories_rels VALUES
 (1,1,'itineraryImages',10,1),(2,1,'itineraryImages',10,2),
 (3,1,'itineraryImages',11,3),(4,1,'itineraryImages',12,4),
 (5,1,'itineraryImages',13,5),(6,1,'galleryImages',14,6),
 (7,4,'itineraryImages',10,1);
INSERT INTO travel_memory_days(id,memory_id,day_key,_status) VALUES (1,1,'day-01','published'),(2,1,'day-02','draft'),(3,2,'day-01','published');
INSERT INTO travel_memories_daily_highlights VALUES ('h1',1,1,NULL,1),('h2',1,1,NULL,2),('h3',4,1,NULL,1);
INSERT INTO travel_memories_daily_highlights_locales VALUES ('h1','zh-TW','synthetic'),('h2','zh-TW','synthetic different');
INSERT INTO travel_memory_days_moments VALUES ('m1',1,'moment-1'),('m2',2,'moment-2'),('m3',3,'moment-3');
INSERT INTO travel_memory_days_moments_placements VALUES
 ('p1','m1','photo',10,'photo-10'),('p2','m1','photo',10,'photo-10-again'),
 ('p3','m2','photo',11,'photo-11'),('p4','m3','photo',12,'photo-12-other-memory'),
 ('p5','m1','photo',13,'');
-- Loader inserts exact candidate SQL as a temporary function here.
-- C0_QUERY_FUNCTION
CREATE TEMP TABLE results (slug text,memory_id integer,legacy_relation_id integer,media_id integer,legacy_order integer,legacy_usage_count bigint,candidate_count bigint,published_keyed_candidate_count bigint,destinations jsonb);
INSERT INTO results SELECT * FROM pg_temp.c0(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket'],0);
DO $$ BEGIN
 IF (SELECT count(*) FROM results) <> 5 THEN RAISE EXCEPTION 'scope or path exclusion failed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM results WHERE legacy_relation_id=1 AND legacy_usage_count=2 AND candidate_count=2 AND published_keyed_candidate_count=2) THEN RAISE EXCEPTION 'duplicates hidden'; END IF;
 IF NOT EXISTS (SELECT 1 FROM results WHERE legacy_relation_id=3 AND candidate_count=1 AND published_keyed_candidate_count=0) THEN RAISE EXCEPTION 'draft counted as published'; END IF;
 IF NOT EXISTS (SELECT 1 FROM results WHERE legacy_relation_id=4 AND candidate_count=0) THEN RAISE EXCEPTION 'cross-memory match'; END IF;
 IF NOT EXISTS (SELECT 1 FROM results WHERE legacy_relation_id=5 AND candidate_count=1 AND published_keyed_candidate_count=0) THEN RAISE EXCEPTION 'missing key accepted'; END IF;
 IF NOT EXISTS (SELECT 1 FROM results WHERE legacy_relation_id=1 AND jsonb_array_length(destinations)=2 AND destinations->0->>'placement_id'='p1' AND destinations->1->>'placement_id'='p2') THEN RAISE EXCEPTION 'destination identity lost'; END IF;
END $$;
INSERT INTO travel_memories_rels SELECT n,1,'itineraryImages',1000+n,n FROM generate_series(10,114) n;
TRUNCATE results;
INSERT INTO results SELECT * FROM pg_temp.c0(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket'],0);
DO $$ BEGIN
 IF (SELECT count(*) FROM results) <> 101 THEN RAISE EXCEPTION 'page cap failed'; END IF;
 IF (SELECT max(legacy_relation_id) FROM results) <> 105 THEN RAISE EXCEPTION 'keyset ordering failed'; END IF;
END $$;
TRUNCATE results;
INSERT INTO results SELECT * FROM pg_temp.c0(ARRAY['201307-hainan','202308-east-australia','202602-thailand-phuket'],104);
DO $$ BEGIN
 IF (SELECT count(*) FROM results) <> 10 OR (SELECT min(legacy_relation_id) FROM results) <> 105 THEN RAISE EXCEPTION 'sentinel lost on next page'; END IF;
END $$;
ROLLBACK;
SELECT 'C0_MAPPING_SQL_REHEARSAL_PASS_SYNTHETIC_ONLY' AS result;
