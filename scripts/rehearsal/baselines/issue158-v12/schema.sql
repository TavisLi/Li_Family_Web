--
-- PostgreSQL database dump
--

\restrict Issue158SchemaOnly20261010

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: _locales; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public._locales AS ENUM (
    'zh-TW',
    'en'
);


ALTER TYPE public._locales OWNER TO postgres;

--
-- Name: enum__travel_memories_v_published_locale; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memories_v_published_locale AS ENUM (
    'zh-TW',
    'en'
);


ALTER TYPE public.enum__travel_memories_v_published_locale OWNER TO postgres;

--
-- Name: enum__travel_memories_v_version_presentation_style; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memories_v_version_presentation_style AS ENUM (
    'editorial-journal',
    'cinematic-timeline',
    'family-scrapbook'
);


ALTER TYPE public.enum__travel_memories_v_version_presentation_style OWNER TO postgres;

--
-- Name: enum__travel_memories_v_version_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memories_v_version_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum__travel_memories_v_version_status OWNER TO postgres;

--
-- Name: enum__travel_memories_v_version_story_sections_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memories_v_version_story_sections_role AS ENUM (
    'featured-memory',
    'travel-reflection',
    'unforgettable-day',
    'family-story',
    'additional-information'
);


ALTER TYPE public.enum__travel_memories_v_version_story_sections_role OWNER TO postgres;

--
-- Name: enum__travel_memory_days_v_published_locale; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memory_days_v_published_locale AS ENUM (
    'zh-TW',
    'en'
);


ALTER TYPE public.enum__travel_memory_days_v_published_locale OWNER TO postgres;

--
-- Name: enum__travel_memory_days_v_version_moments_placements_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memory_days_v_version_moments_placements_role AS ENUM (
    'hero',
    'inline',
    'gallery'
);


ALTER TYPE public.enum__travel_memory_days_v_version_moments_placements_role OWNER TO postgres;

--
-- Name: enum__travel_memory_days_v_version_moments_placements_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memory_days_v_version_moments_placements_type AS ENUM (
    'photo',
    'youtube'
);


ALTER TYPE public.enum__travel_memory_days_v_version_moments_placements_type OWNER TO postgres;

--
-- Name: enum__travel_memory_days_v_version_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_memory_days_v_version_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum__travel_memory_days_v_version_status OWNER TO postgres;

--
-- Name: enum__travel_plans_v_published_locale; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_plans_v_published_locale AS ENUM (
    'zh-TW',
    'en'
);


ALTER TYPE public.enum__travel_plans_v_published_locale OWNER TO postgres;

--
-- Name: enum__travel_plans_v_version_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum__travel_plans_v_version_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum__travel_plans_v_version_status OWNER TO postgres;

--
-- Name: enum_bucket_items_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_bucket_items_status AS ENUM (
    'pool',
    'in-progress',
    'completed'
);


ALTER TYPE public.enum_bucket_items_status OWNER TO postgres;

--
-- Name: enum_comments_associated_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_comments_associated_type AS ENUM (
    'travel',
    'timeline',
    'blog'
);


ALTER TYPE public.enum_comments_associated_type OWNER TO postgres;

--
-- Name: enum_comments_reaction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_comments_reaction AS ENUM (
    'none',
    'up',
    'down',
    'heart',
    'cool',
    'applause'
);


ALTER TYPE public.enum_comments_reaction OWNER TO postgres;

--
-- Name: enum_media_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_media_type AS ENUM (
    'photo',
    'video'
);


ALTER TYPE public.enum_media_type OWNER TO postgres;

--
-- Name: enum_site_config_social_links_platform; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_site_config_social_links_platform AS ENUM (
    'github',
    'linkedin',
    'youtube',
    'instagram',
    'other'
);


ALTER TYPE public.enum_site_config_social_links_platform OWNER TO postgres;

--
-- Name: enum_timeline_events_source_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_timeline_events_source_type AS ENUM (
    'manual',
    'bucket-item',
    'travel',
    'post'
);


ALTER TYPE public.enum_timeline_events_source_type OWNER TO postgres;

--
-- Name: enum_travel_memories_presentation_style; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memories_presentation_style AS ENUM (
    'editorial-journal',
    'cinematic-timeline',
    'family-scrapbook'
);


ALTER TYPE public.enum_travel_memories_presentation_style OWNER TO postgres;

--
-- Name: enum_travel_memories_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memories_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_travel_memories_status OWNER TO postgres;

--
-- Name: enum_travel_memories_story_sections_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memories_story_sections_role AS ENUM (
    'featured-memory',
    'travel-reflection',
    'unforgettable-day',
    'family-story',
    'additional-information'
);


ALTER TYPE public.enum_travel_memories_story_sections_role OWNER TO postgres;

--
-- Name: enum_travel_memory_days_moments_placements_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memory_days_moments_placements_role AS ENUM (
    'hero',
    'inline',
    'gallery'
);


ALTER TYPE public.enum_travel_memory_days_moments_placements_role OWNER TO postgres;

--
-- Name: enum_travel_memory_days_moments_placements_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memory_days_moments_placements_type AS ENUM (
    'photo',
    'youtube'
);


ALTER TYPE public.enum_travel_memory_days_moments_placements_type OWNER TO postgres;

--
-- Name: enum_travel_memory_days_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_memory_days_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_travel_memory_days_status OWNER TO postgres;

--
-- Name: enum_travel_plans_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_travel_plans_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_travel_plans_status OWNER TO postgres;

--
-- Name: enum_users_family_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_family_role AS ENUM (
    'father',
    'mother',
    'daughter',
    'son',
    'grandmother',
    'family'
);


ALTER TYPE public.enum_users_family_role OWNER TO postgres;

--
-- Name: enum_users_profile_visibility; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_profile_visibility AS ENUM (
    'public',
    'family'
);


ALTER TYPE public.enum_users_profile_visibility OWNER TO postgres;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'family'
);


ALTER TYPE public.enum_users_role OWNER TO postgres;

--
-- Name: enum_users_theme_persona; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_users_theme_persona AS ENUM (
    'neutral',
    'tavis',
    'lynn',
    'leo',
    'academy',
    'heritage'
);


ALTER TYPE public.enum_users_theme_persona OWNER TO postgres;

--
-- Name: enum_wrapped_snapshots_blocks_kind; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_wrapped_snapshots_blocks_kind AS ENUM (
    'memory',
    'travel',
    'blog',
    'wish'
);


ALTER TYPE public.enum_wrapped_snapshots_blocks_kind OWNER TO postgres;

--
-- Name: enum_wrapped_snapshots_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_wrapped_snapshots_status AS ENUM (
    'draft',
    'published'
);


ALTER TYPE public.enum_wrapped_snapshots_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _travel_memories_v; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v (
    id integer NOT NULL,
    parent_id integer,
    version_slug character varying,
    version_is_private boolean DEFAULT true,
    version_start_date timestamp(3) with time zone,
    version_end_date timestamp(3) with time zone,
    version_cover_image_id integer,
    version_origin_plan_id integer,
    version_source_metadata_source_file character varying,
    version_source_metadata_source_hash character varying,
    version_source_metadata_parser_version character varying,
    version_source_metadata_last_imported_at timestamp(3) with time zone,
    version_source_metadata_base_projection jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__travel_memories_v_version_status DEFAULT 'draft'::public.enum__travel_memories_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale public.enum__travel_memories_v_published_locale,
    latest boolean,
    autosave boolean,
    version_presentation_style public.enum__travel_memories_v_version_presentation_style
);


ALTER TABLE public._travel_memories_v OWNER TO postgres;

--
-- Name: _travel_memories_v_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_id_seq OWNED BY public._travel_memories_v.id;


--
-- Name: _travel_memories_v_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_locales (
    version_title character varying,
    version_summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_locales_id_seq OWNED BY public._travel_memories_v_locales.id;


--
-- Name: _travel_memories_v_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    media_id integer
);


ALTER TABLE public._travel_memories_v_rels OWNER TO postgres;

--
-- Name: _travel_memories_v_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_rels_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_rels_id_seq OWNED BY public._travel_memories_v_rels.id;


--
-- Name: _travel_memories_v_version_external_videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_external_videos (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    url character varying,
    _uuid character varying
);


ALTER TABLE public._travel_memories_v_version_external_videos OWNER TO postgres;

--
-- Name: _travel_memories_v_version_external_videos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_external_videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_external_videos_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_external_videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_external_videos_id_seq OWNED BY public._travel_memories_v_version_external_videos.id;


--
-- Name: _travel_memories_v_version_external_videos_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_external_videos_locales (
    title character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_version_external_videos_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_external_videos_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_external_videos_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq OWNED BY public._travel_memories_v_version_external_videos_locales.id;


--
-- Name: _travel_memories_v_version_guest_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_guest_participants (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    _uuid character varying
);


ALTER TABLE public._travel_memories_v_version_guest_participants OWNER TO postgres;

--
-- Name: _travel_memories_v_version_guest_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_guest_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_guest_participants_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_guest_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_guest_participants_id_seq OWNED BY public._travel_memories_v_version_guest_participants.id;


--
-- Name: _travel_memories_v_version_guest_participants_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_guest_participants_locales (
    name character varying,
    note character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_version_guest_participants_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_guest_participants_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_guest_participants_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq OWNED BY public._travel_memories_v_version_guest_participants_locales.id;


--
-- Name: _travel_memories_v_version_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_reminders (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    _uuid character varying
);


ALTER TABLE public._travel_memories_v_version_reminders OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_reminders_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_reminders_id_seq OWNED BY public._travel_memories_v_version_reminders.id;


--
-- Name: _travel_memories_v_version_reminders_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_reminders_items (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    _uuid character varying
);


ALTER TABLE public._travel_memories_v_version_reminders_items OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_reminders_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_reminders_items_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_reminders_items_id_seq OWNED BY public._travel_memories_v_version_reminders_items.id;


--
-- Name: _travel_memories_v_version_reminders_items_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_reminders_items_locales (
    text character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_version_reminders_items_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_items_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_items_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq OWNED BY public._travel_memories_v_version_reminders_items_locales.id;


--
-- Name: _travel_memories_v_version_reminders_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_reminders_locales (
    category character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_version_reminders_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_reminders_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq OWNED BY public._travel_memories_v_version_reminders_locales.id;


--
-- Name: _travel_memories_v_version_story_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_story_sections (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    anchor character varying,
    _uuid character varying,
    level numeric DEFAULT 2,
    interactions_comments_enabled boolean DEFAULT true,
    interactions_thumbs_up_enabled boolean DEFAULT true,
    interactions_thumbs_down_enabled boolean DEFAULT true,
    role public.enum__travel_memories_v_version_story_sections_role
);


ALTER TABLE public._travel_memories_v_version_story_sections OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_story_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_story_sections_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_story_sections_id_seq OWNED BY public._travel_memories_v_version_story_sections.id;


--
-- Name: _travel_memories_v_version_story_sections_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_story_sections_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    url character varying,
    _uuid character varying
);


ALTER TABLE public._travel_memories_v_version_story_sections_links OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq OWNED BY public._travel_memories_v_version_story_sections_links.id;


--
-- Name: _travel_memories_v_version_story_sections_links_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_story_sections_links_locales (
    label character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memories_v_version_story_sections_links_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_links_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_links_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq OWNED BY public._travel_memories_v_version_story_sections_links_locales.id;


--
-- Name: _travel_memories_v_version_story_sections_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_story_sections_locales (
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    display_day character varying,
    display_date character varying,
    display_subtitle character varying
);


ALTER TABLE public._travel_memories_v_version_story_sections_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_story_sections_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq OWNED BY public._travel_memories_v_version_story_sections_locales.id;


--
-- Name: _travel_memories_v_version_travel_ledger_flights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_travel_ledger_flights (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    date timestamp(3) with time zone,
    flight_number character varying,
    departure_time character varying,
    arrival_time character varying,
    _uuid character varying,
    date_label character varying,
    terminal character varying
);


ALTER TABLE public._travel_memories_v_version_travel_ledger_flights OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_flights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_flights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq OWNED BY public._travel_memories_v_version_travel_ledger_flights.id;


--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_travel_ledger_flights_locales (
    airline character varying,
    route character varying,
    notes character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    passengers character varying
);


ALTER TABLE public._travel_memories_v_version_travel_ledger_flights_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq OWNED BY public._travel_memories_v_version_travel_ledger_flights_locales.id;


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_travel_ledger_lodgings (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    _uuid character varying,
    date_range character varying
);


ALTER TABLE public._travel_memories_v_version_travel_ledger_lodgings OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq OWNED BY public._travel_memories_v_version_travel_ledger_lodgings.id;


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memories_v_version_travel_ledger_lodgings_locales (
    hotel character varying,
    city character varying,
    notes character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    address character varying,
    room_type character varying,
    booking_channel character varying,
    price character varying,
    highlights character varying
);


ALTER TABLE public._travel_memories_v_version_travel_ledger_lodgings_locales OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locale_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq OWNER TO postgres;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locale_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq OWNED BY public._travel_memories_v_version_travel_ledger_lodgings_locales.id;


--
-- Name: _travel_memory_days_v; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v (
    id integer NOT NULL,
    parent_id integer,
    version_memory_id integer,
    version_day_identity character varying,
    version_day_key character varying,
    version_day numeric,
    version_date timestamp(3) with time zone,
    version_source_metadata_source_file character varying,
    version_source_metadata_source_hash character varying,
    version_source_metadata_parser_version character varying,
    version_source_metadata_last_imported_at timestamp(3) with time zone,
    version_source_metadata_base_projection jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__travel_memory_days_v_version_status DEFAULT 'draft'::public.enum__travel_memory_days_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale public.enum__travel_memory_days_v_published_locale,
    latest boolean,
    autosave boolean,
    version_daily_hero_image_id integer
);


ALTER TABLE public._travel_memory_days_v OWNER TO postgres;

--
-- Name: _travel_memory_days_v_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_id_seq OWNED BY public._travel_memory_days_v.id;


--
-- Name: _travel_memory_days_v_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v_locales (
    version_date_label character varying,
    version_title character varying,
    version_theme character varying,
    version_story character varying,
    version_meals_breakfast character varying,
    version_meals_lunch character varying,
    version_meals_dinner character varying,
    version_lodging character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memory_days_v_locales OWNER TO postgres;

--
-- Name: _travel_memory_days_v_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_locales_id_seq OWNED BY public._travel_memory_days_v_locales.id;


--
-- Name: _travel_memory_days_v_version_moments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v_version_moments (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    moment_key character varying,
    "time" character varying,
    _uuid character varying
);


ALTER TABLE public._travel_memory_days_v_version_moments OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_version_moments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_version_moments_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_version_moments_id_seq OWNED BY public._travel_memory_days_v_version_moments.id;


--
-- Name: _travel_memory_days_v_version_moments_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v_version_moments_locales (
    location character varying,
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    transport character varying
);


ALTER TABLE public._travel_memory_days_v_version_moments_locales OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq OWNED BY public._travel_memory_days_v_version_moments_locales.id;


--
-- Name: _travel_memory_days_v_version_moments_placements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v_version_moments_placements (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    placement_key character varying,
    type public.enum__travel_memory_days_v_version_moments_placements_type,
    role public.enum__travel_memory_days_v_version_moments_placements_role DEFAULT 'inline'::public.enum__travel_memory_days_v_version_moments_placements_role,
    media_id integer,
    youtube_url character varying,
    _uuid character varying
);


ALTER TABLE public._travel_memory_days_v_version_moments_placements OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_placements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_placements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq OWNED BY public._travel_memory_days_v_version_moments_placements.id;


--
-- Name: _travel_memory_days_v_version_moments_placements_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_memory_days_v_version_moments_placements_locales (
    caption character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_memory_days_v_version_moments_placements_locales OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_placements_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_memory_days_v_version_moments_placements_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq OWNED BY public._travel_memory_days_v_version_moments_placements_locales.id;


--
-- Name: _travel_plans_v; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v (
    id integer NOT NULL,
    parent_id integer,
    version_slug character varying,
    version_is_private boolean DEFAULT true,
    version_start_date timestamp(3) with time zone,
    version_end_date timestamp(3) with time zone,
    version_cover_image_id integer,
    version_source_metadata_source_file character varying,
    version_source_metadata_source_hash character varying,
    version_source_metadata_parser_version character varying,
    version_source_metadata_last_imported_at timestamp(3) with time zone,
    version_source_metadata_base_projection jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__travel_plans_v_version_status DEFAULT 'draft'::public.enum__travel_plans_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    snapshot boolean,
    published_locale public.enum__travel_plans_v_published_locale,
    latest boolean,
    autosave boolean
);


ALTER TABLE public._travel_plans_v OWNER TO postgres;

--
-- Name: _travel_plans_v_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_id_seq OWNED BY public._travel_plans_v.id;


--
-- Name: _travel_plans_v_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_locales (
    version_title character varying,
    version_summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_plans_v_locales OWNER TO postgres;

--
-- Name: _travel_plans_v_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_locales_id_seq OWNED BY public._travel_plans_v_locales.id;


--
-- Name: _travel_plans_v_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    media_id integer
);


ALTER TABLE public._travel_plans_v_rels OWNER TO postgres;

--
-- Name: _travel_plans_v_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_rels_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_rels_id_seq OWNED BY public._travel_plans_v_rels.id;


--
-- Name: _travel_plans_v_version_guest_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_guest_participants (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    _uuid character varying
);


ALTER TABLE public._travel_plans_v_version_guest_participants OWNER TO postgres;

--
-- Name: _travel_plans_v_version_guest_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_guest_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_guest_participants_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_guest_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_guest_participants_id_seq OWNED BY public._travel_plans_v_version_guest_participants.id;


--
-- Name: _travel_plans_v_version_guest_participants_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_guest_participants_locales (
    name character varying,
    note character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_plans_v_version_guest_participants_locales OWNER TO postgres;

--
-- Name: _travel_plans_v_version_guest_participants_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_guest_participants_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq OWNED BY public._travel_plans_v_version_guest_participants_locales.id;


--
-- Name: _travel_plans_v_version_planning_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_planning_sections (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    level numeric DEFAULT 2,
    anchor character varying,
    interactions_comments_enabled boolean DEFAULT true,
    _uuid character varying,
    interactions_thumbs_up_enabled boolean DEFAULT true,
    interactions_thumbs_down_enabled boolean DEFAULT true
);


ALTER TABLE public._travel_plans_v_version_planning_sections OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_planning_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_planning_sections_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_planning_sections_id_seq OWNED BY public._travel_plans_v_version_planning_sections.id;


--
-- Name: _travel_plans_v_version_planning_sections_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_planning_sections_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    url character varying,
    _uuid character varying
);


ALTER TABLE public._travel_plans_v_version_planning_sections_links OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq OWNED BY public._travel_plans_v_version_planning_sections_links.id;


--
-- Name: _travel_plans_v_version_planning_sections_links_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_planning_sections_links_locales (
    label character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public._travel_plans_v_version_planning_sections_links_locales OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_links_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_links_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq OWNED BY public._travel_plans_v_version_planning_sections_links_locales.id;


--
-- Name: _travel_plans_v_version_planning_sections_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._travel_plans_v_version_planning_sections_locales (
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    display_day character varying,
    display_date character varying,
    display_subtitle character varying
);


ALTER TABLE public._travel_plans_v_version_planning_sections_locales OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq OWNER TO postgres;

--
-- Name: _travel_plans_v_version_planning_sections_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq OWNED BY public._travel_plans_v_version_planning_sections_locales.id;


--
-- Name: bucket_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bucket_items (
    id integer NOT NULL,
    status public.enum_bucket_items_status DEFAULT 'pool'::public.enum_bucket_items_status NOT NULL,
    priority numeric DEFAULT 3,
    created_by_id integer,
    completed_by_id integer,
    completed_at timestamp(3) with time zone,
    target_date timestamp(3) with time zone,
    cover_image_id integer,
    is_private boolean DEFAULT true,
    timeline_event_id integer,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bucket_items OWNER TO postgres;

--
-- Name: bucket_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bucket_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bucket_items_id_seq OWNER TO postgres;

--
-- Name: bucket_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bucket_items_id_seq OWNED BY public.bucket_items.id;


--
-- Name: bucket_items_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bucket_items_locales (
    title character varying NOT NULL,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.bucket_items_locales OWNER TO postgres;

--
-- Name: bucket_items_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bucket_items_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bucket_items_locales_id_seq OWNER TO postgres;

--
-- Name: bucket_items_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bucket_items_locales_id_seq OWNED BY public.bucket_items_locales.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    slug character varying NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: categories_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories_locales (
    title character varying NOT NULL,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.categories_locales OWNER TO postgres;

--
-- Name: categories_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_locales_id_seq OWNER TO postgres;

--
-- Name: categories_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_locales_id_seq OWNED BY public.categories_locales.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    associated_type public.enum_comments_associated_type NOT NULL,
    associated_id character varying NOT NULL,
    reaction public.enum_comments_reaction DEFAULT 'none'::public.enum_comments_reaction,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: comments_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments_locales (
    comment_text character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.comments_locales OWNER TO postgres;

--
-- Name: comments_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_locales_id_seq OWNER TO postgres;

--
-- Name: comments_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_locales_id_seq OWNED BY public.comments_locales.id;


--
-- Name: home_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_config (
    id integer NOT NULL,
    hero_background_id integer,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);


ALTER TABLE public.home_config OWNER TO postgres;

--
-- Name: home_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_config_id_seq OWNER TO postgres;

--
-- Name: home_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_config_id_seq OWNED BY public.home_config.id;


--
-- Name: home_config_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_config_locales (
    hero_title character varying DEFAULT 'Welcome to Web Li'::character varying NOT NULL,
    hero_subtitle character varying,
    announcement character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.home_config_locales OWNER TO postgres;

--
-- Name: home_config_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_config_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_config_locales_id_seq OWNER TO postgres;

--
-- Name: home_config_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_config_locales_id_seq OWNED BY public.home_config_locales.id;


--
-- Name: home_config_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.home_config_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    travel_plans_id integer,
    travel_memories_id integer
);


ALTER TABLE public.home_config_rels OWNER TO postgres;

--
-- Name: home_config_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.home_config_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.home_config_rels_id_seq OWNER TO postgres;

--
-- Name: home_config_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.home_config_rels_id_seq OWNED BY public.home_config_rels.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    id integer NOT NULL,
    type public.enum_media_type DEFAULT 'photo'::public.enum_media_type NOT NULL,
    youtube_url character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    url character varying,
    thumbnail_u_r_l character varying,
    filename character varying,
    mime_type character varying,
    filesize numeric,
    width numeric,
    height numeric,
    focal_x numeric,
    focal_y numeric,
    sizes_thumbnail_url character varying,
    sizes_thumbnail_width numeric,
    sizes_thumbnail_height numeric,
    sizes_thumbnail_mime_type character varying,
    sizes_thumbnail_filesize numeric,
    sizes_thumbnail_filename character varying,
    sizes_medium_url character varying,
    sizes_medium_width numeric,
    sizes_medium_height numeric,
    sizes_medium_mime_type character varying,
    sizes_medium_filesize numeric,
    sizes_medium_filename character varying,
    sizes_large_url character varying,
    sizes_large_width numeric,
    sizes_large_height numeric,
    sizes_large_mime_type character varying,
    sizes_large_filesize numeric,
    sizes_large_filename character varying,
    source_path character varying,
    _objectkey character varying
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_id_seq OWNER TO postgres;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: media_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_locales (
    alt_text character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.media_locales OWNER TO postgres;

--
-- Name: media_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_locales_id_seq OWNER TO postgres;

--
-- Name: media_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_locales_id_seq OWNED BY public.media_locales.id;


--
-- Name: media_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    travel_plans_id integer,
    travel_memories_id integer
);


ALTER TABLE public.media_rels OWNER TO postgres;

--
-- Name: media_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_rels_id_seq OWNER TO postgres;

--
-- Name: media_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_rels_id_seq OWNED BY public.media_rels.id;


--
-- Name: media_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.media_tags OWNER TO postgres;

--
-- Name: media_tags_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_tags_locales (
    tag character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.media_tags_locales OWNER TO postgres;

--
-- Name: media_tags_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_tags_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_tags_locales_id_seq OWNER TO postgres;

--
-- Name: media_tags_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_tags_locales_id_seq OWNED BY public.media_tags_locales.id;


--
-- Name: payload_kv; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_kv (
    id integer NOT NULL,
    key character varying NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE public.payload_kv OWNER TO postgres;

--
-- Name: payload_kv_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_kv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_kv_id_seq OWNER TO postgres;

--
-- Name: payload_kv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_kv_id_seq OWNED BY public.payload_kv.id;


--
-- Name: payload_locked_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_locked_documents (
    id integer NOT NULL,
    global_slug character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_locked_documents OWNER TO postgres;

--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_locked_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_locked_documents_id_seq OWNER TO postgres;

--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_locked_documents_id_seq OWNED BY public.payload_locked_documents.id;


--
-- Name: payload_locked_documents_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_locked_documents_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    categories_id integer,
    posts_id integer,
    comments_id integer,
    media_id integer,
    timeline_events_id integer,
    bucket_items_id integer,
    wrapped_snapshots_id integer,
    travel_plans_id integer,
    travel_memories_id integer,
    travel_memory_days_id integer
);


ALTER TABLE public.payload_locked_documents_rels OWNER TO postgres;

--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_locked_documents_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_locked_documents_rels_id_seq OWNER TO postgres;

--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_locked_documents_rels_id_seq OWNED BY public.payload_locked_documents_rels.id;


--
-- Name: payload_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_migrations (
    id integer NOT NULL,
    name character varying,
    batch numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_migrations OWNER TO postgres;

--
-- Name: payload_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_migrations_id_seq OWNER TO postgres;

--
-- Name: payload_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_migrations_id_seq OWNED BY public.payload_migrations.id;


--
-- Name: payload_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_preferences (
    id integer NOT NULL,
    key character varying,
    value jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_preferences OWNER TO postgres;

--
-- Name: payload_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_preferences_id_seq OWNER TO postgres;

--
-- Name: payload_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_preferences_id_seq OWNED BY public.payload_preferences.id;


--
-- Name: payload_preferences_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payload_preferences_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer
);


ALTER TABLE public.payload_preferences_rels OWNER TO postgres;

--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payload_preferences_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_preferences_rels_id_seq OWNER TO postgres;

--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payload_preferences_rels_id_seq OWNED BY public.payload_preferences_rels.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    slug character varying NOT NULL,
    author_id integer NOT NULL,
    is_private boolean DEFAULT true,
    published_date timestamp(3) with time zone NOT NULL,
    cover_image_id integer,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: posts_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts_locales (
    title character varying NOT NULL,
    content jsonb NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.posts_locales OWNER TO postgres;

--
-- Name: posts_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_locales_id_seq OWNER TO postgres;

--
-- Name: posts_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_locales_id_seq OWNED BY public.posts_locales.id;


--
-- Name: posts_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    categories_id integer
);


ALTER TABLE public.posts_rels OWNER TO postgres;

--
-- Name: posts_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_rels_id_seq OWNER TO postgres;

--
-- Name: posts_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_rels_id_seq OWNED BY public.posts_rels.id;


--
-- Name: posts_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.posts_tags OWNER TO postgres;

--
-- Name: posts_tags_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts_tags_locales (
    tag character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.posts_tags_locales OWNER TO postgres;

--
-- Name: posts_tags_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_tags_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_tags_locales_id_seq OWNER TO postgres;

--
-- Name: posts_tags_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_tags_locales_id_seq OWNED BY public.posts_tags_locales.id;


--
-- Name: site_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_config (
    id integer NOT NULL,
    contact_phone character varying,
    contact_email character varying,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);


ALTER TABLE public.site_config OWNER TO postgres;

--
-- Name: site_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_config_id_seq OWNER TO postgres;

--
-- Name: site_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_config_id_seq OWNED BY public.site_config.id;


--
-- Name: site_config_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_config_locales (
    site_name character varying DEFAULT 'Web Li'::character varying NOT NULL,
    site_description character varying,
    contact_address character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.site_config_locales OWNER TO postgres;

--
-- Name: site_config_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_config_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_config_locales_id_seq OWNER TO postgres;

--
-- Name: site_config_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_config_locales_id_seq OWNED BY public.site_config_locales.id;


--
-- Name: site_config_social_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_config_social_links (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    platform public.enum_site_config_social_links_platform NOT NULL,
    url character varying NOT NULL
);


ALTER TABLE public.site_config_social_links OWNER TO postgres;

--
-- Name: timeline_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timeline_events (
    id integer NOT NULL,
    slug character varying NOT NULL,
    event_date timestamp(3) with time zone NOT NULL,
    year numeric NOT NULL,
    related_post_id integer,
    source_type public.enum_timeline_events_source_type DEFAULT 'manual'::public.enum_timeline_events_source_type NOT NULL,
    is_private boolean DEFAULT true,
    sort_order numeric DEFAULT 0,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.timeline_events OWNER TO postgres;

--
-- Name: timeline_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timeline_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timeline_events_id_seq OWNER TO postgres;

--
-- Name: timeline_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timeline_events_id_seq OWNED BY public.timeline_events.id;


--
-- Name: timeline_events_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timeline_events_locales (
    title character varying NOT NULL,
    summary character varying,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.timeline_events_locales OWNER TO postgres;

--
-- Name: timeline_events_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timeline_events_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timeline_events_locales_id_seq OWNER TO postgres;

--
-- Name: timeline_events_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timeline_events_locales_id_seq OWNED BY public.timeline_events_locales.id;


--
-- Name: timeline_events_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timeline_events_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer,
    users_id integer,
    travel_plans_id integer,
    travel_memories_id integer
);


ALTER TABLE public.timeline_events_rels OWNER TO postgres;

--
-- Name: timeline_events_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timeline_events_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timeline_events_rels_id_seq OWNER TO postgres;

--
-- Name: timeline_events_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timeline_events_rels_id_seq OWNED BY public.timeline_events_rels.id;


--
-- Name: travel_memories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories (
    id integer NOT NULL,
    slug character varying,
    is_private boolean DEFAULT true,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    cover_image_id integer,
    origin_plan_id integer,
    source_metadata_source_file character varying,
    source_metadata_source_hash character varying,
    source_metadata_parser_version character varying,
    source_metadata_last_imported_at timestamp(3) with time zone,
    source_metadata_base_projection jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_travel_memories_status DEFAULT 'draft'::public.enum_travel_memories_status,
    presentation_style public.enum_travel_memories_presentation_style
);


ALTER TABLE public.travel_memories OWNER TO postgres;

--
-- Name: travel_memories_external_videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_external_videos (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    url character varying
);


ALTER TABLE public.travel_memories_external_videos OWNER TO postgres;

--
-- Name: travel_memories_external_videos_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_external_videos_locales (
    title character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memories_external_videos_locales OWNER TO postgres;

--
-- Name: travel_memories_external_videos_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_external_videos_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_external_videos_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_external_videos_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_external_videos_locales_id_seq OWNED BY public.travel_memories_external_videos_locales.id;


--
-- Name: travel_memories_guest_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_guest_participants (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.travel_memories_guest_participants OWNER TO postgres;

--
-- Name: travel_memories_guest_participants_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_guest_participants_locales (
    name character varying,
    note character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memories_guest_participants_locales OWNER TO postgres;

--
-- Name: travel_memories_guest_participants_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_guest_participants_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_guest_participants_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_guest_participants_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_guest_participants_locales_id_seq OWNED BY public.travel_memories_guest_participants_locales.id;


--
-- Name: travel_memories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_id_seq OWNER TO postgres;

--
-- Name: travel_memories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_id_seq OWNED BY public.travel_memories.id;


--
-- Name: travel_memories_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_locales (
    title character varying,
    summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.travel_memories_locales OWNER TO postgres;

--
-- Name: travel_memories_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_locales_id_seq OWNED BY public.travel_memories_locales.id;


--
-- Name: travel_memories_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    media_id integer
);


ALTER TABLE public.travel_memories_rels OWNER TO postgres;

--
-- Name: travel_memories_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_rels_id_seq OWNER TO postgres;

--
-- Name: travel_memories_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_rels_id_seq OWNED BY public.travel_memories_rels.id;


--
-- Name: travel_memories_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_reminders (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.travel_memories_reminders OWNER TO postgres;

--
-- Name: travel_memories_reminders_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_reminders_items (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.travel_memories_reminders_items OWNER TO postgres;

--
-- Name: travel_memories_reminders_items_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_reminders_items_locales (
    text character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memories_reminders_items_locales OWNER TO postgres;

--
-- Name: travel_memories_reminders_items_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_reminders_items_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_reminders_items_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_reminders_items_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_reminders_items_locales_id_seq OWNED BY public.travel_memories_reminders_items_locales.id;


--
-- Name: travel_memories_reminders_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_reminders_locales (
    category character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memories_reminders_locales OWNER TO postgres;

--
-- Name: travel_memories_reminders_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_reminders_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_reminders_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_reminders_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_reminders_locales_id_seq OWNED BY public.travel_memories_reminders_locales.id;


--
-- Name: travel_memories_story_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_story_sections (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    anchor character varying,
    level numeric DEFAULT 2,
    interactions_comments_enabled boolean DEFAULT true,
    interactions_thumbs_up_enabled boolean DEFAULT true,
    interactions_thumbs_down_enabled boolean DEFAULT true,
    role public.enum_travel_memories_story_sections_role
);


ALTER TABLE public.travel_memories_story_sections OWNER TO postgres;

--
-- Name: travel_memories_story_sections_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_story_sections_links (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL,
    url character varying
);


ALTER TABLE public.travel_memories_story_sections_links OWNER TO postgres;

--
-- Name: travel_memories_story_sections_links_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_story_sections_links_locales (
    label character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memories_story_sections_links_locales OWNER TO postgres;

--
-- Name: travel_memories_story_sections_links_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_story_sections_links_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_story_sections_links_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_story_sections_links_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_story_sections_links_locales_id_seq OWNED BY public.travel_memories_story_sections_links_locales.id;


--
-- Name: travel_memories_story_sections_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_story_sections_locales (
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL,
    display_day character varying,
    display_date character varying,
    display_subtitle character varying
);


ALTER TABLE public.travel_memories_story_sections_locales OWNER TO postgres;

--
-- Name: travel_memories_story_sections_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_story_sections_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_story_sections_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_story_sections_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_story_sections_locales_id_seq OWNED BY public.travel_memories_story_sections_locales.id;


--
-- Name: travel_memories_travel_ledger_flights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_travel_ledger_flights (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    date timestamp(3) with time zone,
    flight_number character varying,
    departure_time character varying,
    arrival_time character varying,
    date_label character varying,
    terminal character varying
);


ALTER TABLE public.travel_memories_travel_ledger_flights OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_flights_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_travel_ledger_flights_locales (
    airline character varying,
    route character varying,
    notes character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL,
    passengers character varying
);


ALTER TABLE public.travel_memories_travel_ledger_flights_locales OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_flights_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_flights_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq OWNED BY public.travel_memories_travel_ledger_flights_locales.id;


--
-- Name: travel_memories_travel_ledger_lodgings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_travel_ledger_lodgings (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    date_range character varying
);


ALTER TABLE public.travel_memories_travel_ledger_lodgings OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_lodgings_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memories_travel_ledger_lodgings_locales (
    hotel character varying,
    city character varying,
    notes character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL,
    address character varying,
    room_type character varying,
    booking_channel character varying,
    price character varying,
    highlights character varying
);


ALTER TABLE public.travel_memories_travel_ledger_lodgings_locales OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_lodgings_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memories_travel_ledger_lodgings_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq OWNED BY public.travel_memories_travel_ledger_lodgings_locales.id;


--
-- Name: travel_memory_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days (
    id integer NOT NULL,
    memory_id integer,
    day_identity character varying,
    day_key character varying,
    day numeric,
    date timestamp(3) with time zone,
    source_metadata_source_file character varying,
    source_metadata_source_hash character varying,
    source_metadata_parser_version character varying,
    source_metadata_last_imported_at timestamp(3) with time zone,
    source_metadata_base_projection jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_travel_memory_days_status DEFAULT 'draft'::public.enum_travel_memory_days_status,
    daily_hero_image_id integer
);


ALTER TABLE public.travel_memory_days OWNER TO postgres;

--
-- Name: travel_memory_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memory_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memory_days_id_seq OWNER TO postgres;

--
-- Name: travel_memory_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memory_days_id_seq OWNED BY public.travel_memory_days.id;


--
-- Name: travel_memory_days_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days_locales (
    date_label character varying,
    title character varying,
    theme character varying,
    story character varying,
    meals_breakfast character varying,
    meals_lunch character varying,
    meals_dinner character varying,
    lodging character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.travel_memory_days_locales OWNER TO postgres;

--
-- Name: travel_memory_days_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memory_days_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memory_days_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memory_days_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memory_days_locales_id_seq OWNED BY public.travel_memory_days_locales.id;


--
-- Name: travel_memory_days_moments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days_moments (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    moment_key character varying,
    "time" character varying
);


ALTER TABLE public.travel_memory_days_moments OWNER TO postgres;

--
-- Name: travel_memory_days_moments_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days_moments_locales (
    location character varying,
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL,
    transport character varying
);


ALTER TABLE public.travel_memory_days_moments_locales OWNER TO postgres;

--
-- Name: travel_memory_days_moments_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memory_days_moments_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memory_days_moments_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memory_days_moments_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memory_days_moments_locales_id_seq OWNED BY public.travel_memory_days_moments_locales.id;


--
-- Name: travel_memory_days_moments_placements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days_moments_placements (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL,
    placement_key character varying,
    type public.enum_travel_memory_days_moments_placements_type,
    role public.enum_travel_memory_days_moments_placements_role DEFAULT 'inline'::public.enum_travel_memory_days_moments_placements_role,
    media_id integer,
    youtube_url character varying
);


ALTER TABLE public.travel_memory_days_moments_placements OWNER TO postgres;

--
-- Name: travel_memory_days_moments_placements_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_memory_days_moments_placements_locales (
    caption character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_memory_days_moments_placements_locales OWNER TO postgres;

--
-- Name: travel_memory_days_moments_placements_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq OWNER TO postgres;

--
-- Name: travel_memory_days_moments_placements_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq OWNED BY public.travel_memory_days_moments_placements_locales.id;


--
-- Name: travel_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans (
    id integer NOT NULL,
    slug character varying,
    is_private boolean DEFAULT true,
    start_date timestamp(3) with time zone,
    end_date timestamp(3) with time zone,
    cover_image_id integer,
    source_metadata_source_file character varying,
    source_metadata_source_hash character varying,
    source_metadata_parser_version character varying,
    source_metadata_last_imported_at timestamp(3) with time zone,
    source_metadata_base_projection jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_travel_plans_status DEFAULT 'draft'::public.enum_travel_plans_status
);


ALTER TABLE public.travel_plans OWNER TO postgres;

--
-- Name: travel_plans_guest_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_guest_participants (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.travel_plans_guest_participants OWNER TO postgres;

--
-- Name: travel_plans_guest_participants_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_guest_participants_locales (
    name character varying,
    note character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_plans_guest_participants_locales OWNER TO postgres;

--
-- Name: travel_plans_guest_participants_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_guest_participants_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_guest_participants_locales_id_seq OWNER TO postgres;

--
-- Name: travel_plans_guest_participants_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_guest_participants_locales_id_seq OWNED BY public.travel_plans_guest_participants_locales.id;


--
-- Name: travel_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_id_seq OWNER TO postgres;

--
-- Name: travel_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_id_seq OWNED BY public.travel_plans.id;


--
-- Name: travel_plans_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_locales (
    title character varying,
    summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.travel_plans_locales OWNER TO postgres;

--
-- Name: travel_plans_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_locales_id_seq OWNER TO postgres;

--
-- Name: travel_plans_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_locales_id_seq OWNED BY public.travel_plans_locales.id;


--
-- Name: travel_plans_planning_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_planning_sections (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    level numeric DEFAULT 2,
    anchor character varying,
    interactions_comments_enabled boolean DEFAULT true,
    interactions_thumbs_up_enabled boolean DEFAULT true,
    interactions_thumbs_down_enabled boolean DEFAULT true
);


ALTER TABLE public.travel_plans_planning_sections OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_planning_sections_links (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL,
    url character varying
);


ALTER TABLE public.travel_plans_planning_sections_links OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_links_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_planning_sections_links_locales (
    label character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.travel_plans_planning_sections_links_locales OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_links_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_links_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq OWNED BY public.travel_plans_planning_sections_links_locales.id;


--
-- Name: travel_plans_planning_sections_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_planning_sections_locales (
    title character varying,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL,
    display_day character varying,
    display_date character varying,
    display_subtitle character varying
);


ALTER TABLE public.travel_plans_planning_sections_locales OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_planning_sections_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_planning_sections_locales_id_seq OWNER TO postgres;

--
-- Name: travel_plans_planning_sections_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_planning_sections_locales_id_seq OWNED BY public.travel_plans_planning_sections_locales.id;


--
-- Name: travel_plans_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_plans_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    media_id integer
);


ALTER TABLE public.travel_plans_rels OWNER TO postgres;

--
-- Name: travel_plans_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_plans_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_plans_rels_id_seq OWNER TO postgres;

--
-- Name: travel_plans_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_plans_rels_id_seq OWNED BY public.travel_plans_rels.id;


--
-- Name: travel_route_identities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_route_identities (
    id integer NOT NULL,
    slug character varying NOT NULL,
    owner_key character varying NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.travel_route_identities OWNER TO postgres;

--
-- Name: travel_route_identities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_route_identities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_route_identities_id_seq OWNER TO postgres;

--
-- Name: travel_route_identities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_route_identities_id_seq OWNED BY public.travel_route_identities.id;


--
-- Name: travel_route_identities_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.travel_route_identities_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    travel_plans_id integer,
    travel_memories_id integer
);


ALTER TABLE public.travel_route_identities_rels OWNER TO postgres;

--
-- Name: travel_route_identities_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.travel_route_identities_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.travel_route_identities_rels_id_seq OWNER TO postgres;

--
-- Name: travel_route_identities_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.travel_route_identities_rels_id_seq OWNED BY public.travel_route_identities_rels.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    slug character varying NOT NULL,
    family_role public.enum_users_family_role NOT NULL,
    profile_visibility public.enum_users_profile_visibility DEFAULT 'public'::public.enum_users_profile_visibility NOT NULL,
    avatar_id integer,
    theme_persona public.enum_users_theme_persona DEFAULT 'neutral'::public.enum_users_theme_persona NOT NULL,
    theme_primary_color character varying,
    theme_accent_color character varying,
    source_doc_identifier character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    email character varying NOT NULL,
    reset_password_token character varying,
    reset_password_expiration timestamp(3) with time zone,
    salt character varying,
    hash character varying,
    login_attempts numeric DEFAULT 0,
    lock_until timestamp(3) with time zone,
    hero_image_id integer,
    card_image_id integer,
    role public.enum_users_role DEFAULT 'family'::public.enum_users_role NOT NULL,
    public_contact_email character varying,
    public_contact_phone character varying,
    external_profile_url character varying,
    reset_password_requested_at timestamp(3) with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_beliefs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_beliefs (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.users_beliefs OWNER TO postgres;

--
-- Name: users_beliefs_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_beliefs_locales (
    text character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_beliefs_locales OWNER TO postgres;

--
-- Name: users_beliefs_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_beliefs_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_beliefs_locales_id_seq OWNER TO postgres;

--
-- Name: users_beliefs_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_beliefs_locales_id_seq OWNED BY public.users_beliefs_locales.id;


--
-- Name: users_career_timeline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_career_timeline (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    start character varying,
    "end" character varying
);


ALTER TABLE public.users_career_timeline OWNER TO postgres;

--
-- Name: users_career_timeline_highlights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_career_timeline_highlights (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.users_career_timeline_highlights OWNER TO postgres;

--
-- Name: users_career_timeline_highlights_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_career_timeline_highlights_locales (
    text character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_career_timeline_highlights_locales OWNER TO postgres;

--
-- Name: users_career_timeline_highlights_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_career_timeline_highlights_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_career_timeline_highlights_locales_id_seq OWNER TO postgres;

--
-- Name: users_career_timeline_highlights_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_career_timeline_highlights_locales_id_seq OWNED BY public.users_career_timeline_highlights_locales.id;


--
-- Name: users_career_timeline_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_career_timeline_locales (
    organization character varying NOT NULL,
    role character varying NOT NULL,
    location character varying,
    summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_career_timeline_locales OWNER TO postgres;

--
-- Name: users_career_timeline_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_career_timeline_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_career_timeline_locales_id_seq OWNER TO postgres;

--
-- Name: users_career_timeline_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_career_timeline_locales_id_seq OWNED BY public.users_career_timeline_locales.id;


--
-- Name: users_education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_education (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    year character varying
);


ALTER TABLE public.users_education OWNER TO postgres;

--
-- Name: users_education_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_education_locales (
    school character varying NOT NULL,
    degree character varying,
    major character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_education_locales OWNER TO postgres;

--
-- Name: users_education_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_education_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_education_locales_id_seq OWNER TO postgres;

--
-- Name: users_education_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_education_locales_id_seq OWNED BY public.users_education_locales.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_interests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_interests (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.users_interests OWNER TO postgres;

--
-- Name: users_interests_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_interests_locales (
    name character varying NOT NULL,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_interests_locales OWNER TO postgres;

--
-- Name: users_interests_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_interests_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_interests_locales_id_seq OWNER TO postgres;

--
-- Name: users_interests_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_interests_locales_id_seq OWNED BY public.users_interests_locales.id;


--
-- Name: users_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_locales (
    display_name character varying NOT NULL,
    status character varying,
    typewriter_prefix character varying,
    typewriter_suffix character varying,
    bio character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL,
    public_contact_site_title character varying,
    public_contact_description character varying,
    professional_timeline_intro character varying
);


ALTER TABLE public.users_locales OWNER TO postgres;

--
-- Name: users_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_locales_id_seq OWNER TO postgres;

--
-- Name: users_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_locales_id_seq OWNED BY public.users_locales.id;


--
-- Name: users_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    media_id integer
);


ALTER TABLE public.users_rels OWNER TO postgres;

--
-- Name: users_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_rels_id_seq OWNER TO postgres;

--
-- Name: users_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_rels_id_seq OWNED BY public.users_rels.id;


--
-- Name: users_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_sessions (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    created_at timestamp(3) with time zone,
    expires_at timestamp(3) with time zone NOT NULL
);


ALTER TABLE public.users_sessions OWNER TO postgres;

--
-- Name: users_skill_radar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_skill_radar (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    score numeric NOT NULL
);


ALTER TABLE public.users_skill_radar OWNER TO postgres;

--
-- Name: users_skill_radar_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_skill_radar_locales (
    skill character varying NOT NULL,
    evidence character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_skill_radar_locales OWNER TO postgres;

--
-- Name: users_skill_radar_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_skill_radar_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_skill_radar_locales_id_seq OWNER TO postgres;

--
-- Name: users_skill_radar_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_skill_radar_locales_id_seq OWNED BY public.users_skill_radar_locales.id;


--
-- Name: users_typewriter_rotating_words; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_typewriter_rotating_words (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.users_typewriter_rotating_words OWNER TO postgres;

--
-- Name: users_typewriter_rotating_words_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_typewriter_rotating_words_locales (
    word character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.users_typewriter_rotating_words_locales OWNER TO postgres;

--
-- Name: users_typewriter_rotating_words_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_typewriter_rotating_words_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_typewriter_rotating_words_locales_id_seq OWNER TO postgres;

--
-- Name: users_typewriter_rotating_words_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_typewriter_rotating_words_locales_id_seq OWNED BY public.users_typewriter_rotating_words_locales.id;


--
-- Name: wrapped_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots (
    id integer NOT NULL,
    year numeric NOT NULL,
    status public.enum_wrapped_snapshots_status DEFAULT 'draft'::public.enum_wrapped_snapshots_status NOT NULL,
    published_at timestamp(3) with time zone,
    hero_media_id integer,
    is_private boolean DEFAULT true,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wrapped_snapshots OWNER TO postgres;

--
-- Name: wrapped_snapshots_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots_blocks (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    kind public.enum_wrapped_snapshots_blocks_kind DEFAULT 'memory'::public.enum_wrapped_snapshots_blocks_kind NOT NULL,
    accent character varying
);


ALTER TABLE public.wrapped_snapshots_blocks OWNER TO postgres;

--
-- Name: wrapped_snapshots_blocks_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots_blocks_locales (
    title character varying NOT NULL,
    body character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.wrapped_snapshots_blocks_locales OWNER TO postgres;

--
-- Name: wrapped_snapshots_blocks_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq OWNER TO postgres;

--
-- Name: wrapped_snapshots_blocks_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq OWNED BY public.wrapped_snapshots_blocks_locales.id;


--
-- Name: wrapped_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wrapped_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wrapped_snapshots_id_seq OWNER TO postgres;

--
-- Name: wrapped_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wrapped_snapshots_id_seq OWNED BY public.wrapped_snapshots.id;


--
-- Name: wrapped_snapshots_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots_locales (
    summary character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.wrapped_snapshots_locales OWNER TO postgres;

--
-- Name: wrapped_snapshots_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wrapped_snapshots_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wrapped_snapshots_locales_id_seq OWNER TO postgres;

--
-- Name: wrapped_snapshots_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wrapped_snapshots_locales_id_seq OWNED BY public.wrapped_snapshots_locales.id;


--
-- Name: wrapped_snapshots_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots_stats (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL
);


ALTER TABLE public.wrapped_snapshots_stats OWNER TO postgres;

--
-- Name: wrapped_snapshots_stats_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wrapped_snapshots_stats_locales (
    label character varying NOT NULL,
    value character varying NOT NULL,
    note character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.wrapped_snapshots_stats_locales OWNER TO postgres;

--
-- Name: wrapped_snapshots_stats_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wrapped_snapshots_stats_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wrapped_snapshots_stats_locales_id_seq OWNER TO postgres;

--
-- Name: wrapped_snapshots_stats_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wrapped_snapshots_stats_locales_id_seq OWNED BY public.wrapped_snapshots_stats_locales.id;


--
-- Name: _travel_memories_v id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_id_seq'::regclass);


--
-- Name: _travel_memories_v_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_rels ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_rels_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_external_videos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_external_videos_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_external_videos_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_external_videos_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_guest_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_guest_participants_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_guest_participants_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_guest_participants_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_reminders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_reminders_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_reminders_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_reminders_items_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_reminders_items_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_reminders_items_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_reminders_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_reminders_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_story_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_story_sections_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_story_sections_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_story_sections_links_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_story_sections_links_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_story_sections_links_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_story_sections_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_story_sections_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_travel_ledger_flights id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_travel_ledger_flights_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_travel_ledger_flights_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_travel_ledger_lodgings_id_seq'::regclass);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq'::regclass);


--
-- Name: _travel_memory_days_v id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_id_seq'::regclass);


--
-- Name: _travel_memory_days_v_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_locales_id_seq'::regclass);


--
-- Name: _travel_memory_days_v_version_moments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_version_moments_id_seq'::regclass);


--
-- Name: _travel_memory_days_v_version_moments_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_version_moments_locales_id_seq'::regclass);


--
-- Name: _travel_memory_days_v_version_moments_placements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_version_moments_placements_id_seq'::regclass);


--
-- Name: _travel_memory_days_v_version_moments_placements_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_memory_days_v_version_moments_placements_locales_id_seq'::regclass);


--
-- Name: _travel_plans_v id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_id_seq'::regclass);


--
-- Name: _travel_plans_v_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_locales_id_seq'::regclass);


--
-- Name: _travel_plans_v_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_rels ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_rels_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_guest_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_guest_participants_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_guest_participants_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_guest_participants_locales_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_planning_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_planning_sections_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_planning_sections_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_planning_sections_links_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_planning_sections_links_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_planning_sections_links_locales_id_seq'::regclass);


--
-- Name: _travel_plans_v_version_planning_sections_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_locales ALTER COLUMN id SET DEFAULT nextval('public._travel_plans_v_version_planning_sections_locales_id_seq'::regclass);


--
-- Name: bucket_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items ALTER COLUMN id SET DEFAULT nextval('public.bucket_items_id_seq'::regclass);


--
-- Name: bucket_items_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items_locales ALTER COLUMN id SET DEFAULT nextval('public.bucket_items_locales_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: categories_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales ALTER COLUMN id SET DEFAULT nextval('public.categories_locales_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: comments_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments_locales ALTER COLUMN id SET DEFAULT nextval('public.comments_locales_id_seq'::regclass);


--
-- Name: home_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config ALTER COLUMN id SET DEFAULT nextval('public.home_config_id_seq'::regclass);


--
-- Name: home_config_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_locales ALTER COLUMN id SET DEFAULT nextval('public.home_config_locales_id_seq'::regclass);


--
-- Name: home_config_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_rels ALTER COLUMN id SET DEFAULT nextval('public.home_config_rels_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: media_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_locales ALTER COLUMN id SET DEFAULT nextval('public.media_locales_id_seq'::regclass);


--
-- Name: media_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels ALTER COLUMN id SET DEFAULT nextval('public.media_rels_id_seq'::regclass);


--
-- Name: media_tags_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags_locales ALTER COLUMN id SET DEFAULT nextval('public.media_tags_locales_id_seq'::regclass);


--
-- Name: payload_kv id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_kv ALTER COLUMN id SET DEFAULT nextval('public.payload_kv_id_seq'::regclass);


--
-- Name: payload_locked_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_id_seq'::regclass);


--
-- Name: payload_locked_documents_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_rels_id_seq'::regclass);


--
-- Name: payload_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_migrations ALTER COLUMN id SET DEFAULT nextval('public.payload_migrations_id_seq'::regclass);


--
-- Name: payload_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_id_seq'::regclass);


--
-- Name: payload_preferences_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_rels_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: posts_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_locales ALTER COLUMN id SET DEFAULT nextval('public.posts_locales_id_seq'::regclass);


--
-- Name: posts_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_rels ALTER COLUMN id SET DEFAULT nextval('public.posts_rels_id_seq'::regclass);


--
-- Name: posts_tags_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_tags_locales ALTER COLUMN id SET DEFAULT nextval('public.posts_tags_locales_id_seq'::regclass);


--
-- Name: site_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config ALTER COLUMN id SET DEFAULT nextval('public.site_config_id_seq'::regclass);


--
-- Name: site_config_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config_locales ALTER COLUMN id SET DEFAULT nextval('public.site_config_locales_id_seq'::regclass);


--
-- Name: timeline_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events ALTER COLUMN id SET DEFAULT nextval('public.timeline_events_id_seq'::regclass);


--
-- Name: timeline_events_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_locales ALTER COLUMN id SET DEFAULT nextval('public.timeline_events_locales_id_seq'::regclass);


--
-- Name: timeline_events_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels ALTER COLUMN id SET DEFAULT nextval('public.timeline_events_rels_id_seq'::regclass);


--
-- Name: travel_memories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_id_seq'::regclass);


--
-- Name: travel_memories_external_videos_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_external_videos_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_external_videos_locales_id_seq'::regclass);


--
-- Name: travel_memories_guest_participants_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_guest_participants_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_guest_participants_locales_id_seq'::regclass);


--
-- Name: travel_memories_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_locales_id_seq'::regclass);


--
-- Name: travel_memories_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_rels ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_rels_id_seq'::regclass);


--
-- Name: travel_memories_reminders_items_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_items_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_reminders_items_locales_id_seq'::regclass);


--
-- Name: travel_memories_reminders_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_reminders_locales_id_seq'::regclass);


--
-- Name: travel_memories_story_sections_links_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_links_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_story_sections_links_locales_id_seq'::regclass);


--
-- Name: travel_memories_story_sections_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_story_sections_locales_id_seq'::regclass);


--
-- Name: travel_memories_travel_ledger_flights_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_flights_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_travel_ledger_flights_locales_id_seq'::regclass);


--
-- Name: travel_memories_travel_ledger_lodgings_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_lodgings_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memories_travel_ledger_lodgings_locales_id_seq'::regclass);


--
-- Name: travel_memory_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days ALTER COLUMN id SET DEFAULT nextval('public.travel_memory_days_id_seq'::regclass);


--
-- Name: travel_memory_days_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memory_days_locales_id_seq'::regclass);


--
-- Name: travel_memory_days_moments_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memory_days_moments_locales_id_seq'::regclass);


--
-- Name: travel_memory_days_moments_placements_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_memory_days_moments_placements_locales_id_seq'::regclass);


--
-- Name: travel_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_id_seq'::regclass);


--
-- Name: travel_plans_guest_participants_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_guest_participants_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_guest_participants_locales_id_seq'::regclass);


--
-- Name: travel_plans_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_locales_id_seq'::regclass);


--
-- Name: travel_plans_planning_sections_links_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_links_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_planning_sections_links_locales_id_seq'::regclass);


--
-- Name: travel_plans_planning_sections_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_locales ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_planning_sections_locales_id_seq'::regclass);


--
-- Name: travel_plans_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_rels ALTER COLUMN id SET DEFAULT nextval('public.travel_plans_rels_id_seq'::regclass);


--
-- Name: travel_route_identities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities ALTER COLUMN id SET DEFAULT nextval('public.travel_route_identities_id_seq'::regclass);


--
-- Name: travel_route_identities_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities_rels ALTER COLUMN id SET DEFAULT nextval('public.travel_route_identities_rels_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users_beliefs_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_beliefs_locales ALTER COLUMN id SET DEFAULT nextval('public.users_beliefs_locales_id_seq'::regclass);


--
-- Name: users_career_timeline_highlights_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_highlights_locales ALTER COLUMN id SET DEFAULT nextval('public.users_career_timeline_highlights_locales_id_seq'::regclass);


--
-- Name: users_career_timeline_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_locales ALTER COLUMN id SET DEFAULT nextval('public.users_career_timeline_locales_id_seq'::regclass);


--
-- Name: users_education_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_education_locales ALTER COLUMN id SET DEFAULT nextval('public.users_education_locales_id_seq'::regclass);


--
-- Name: users_interests_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_interests_locales ALTER COLUMN id SET DEFAULT nextval('public.users_interests_locales_id_seq'::regclass);


--
-- Name: users_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_locales ALTER COLUMN id SET DEFAULT nextval('public.users_locales_id_seq'::regclass);


--
-- Name: users_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_rels ALTER COLUMN id SET DEFAULT nextval('public.users_rels_id_seq'::regclass);


--
-- Name: users_skill_radar_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_skill_radar_locales ALTER COLUMN id SET DEFAULT nextval('public.users_skill_radar_locales_id_seq'::regclass);


--
-- Name: users_typewriter_rotating_words_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_typewriter_rotating_words_locales ALTER COLUMN id SET DEFAULT nextval('public.users_typewriter_rotating_words_locales_id_seq'::regclass);


--
-- Name: wrapped_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots ALTER COLUMN id SET DEFAULT nextval('public.wrapped_snapshots_id_seq'::regclass);


--
-- Name: wrapped_snapshots_blocks_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_blocks_locales ALTER COLUMN id SET DEFAULT nextval('public.wrapped_snapshots_blocks_locales_id_seq'::regclass);


--
-- Name: wrapped_snapshots_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_locales ALTER COLUMN id SET DEFAULT nextval('public.wrapped_snapshots_locales_id_seq'::regclass);


--
-- Name: wrapped_snapshots_stats_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_stats_locales ALTER COLUMN id SET DEFAULT nextval('public.wrapped_snapshots_stats_locales_id_seq'::regclass);


--
-- Name: _travel_memories_v_locales _travel_memories_v_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_locales
    ADD CONSTRAINT _travel_memories_v_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v _travel_memories_v_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v
    ADD CONSTRAINT _travel_memories_v_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_rels _travel_memories_v_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_rels
    ADD CONSTRAINT _travel_memories_v_rels_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_external_videos_locales _travel_memories_v_version_external_videos_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos_locales
    ADD CONSTRAINT _travel_memories_v_version_external_videos_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_external_videos _travel_memories_v_version_external_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos
    ADD CONSTRAINT _travel_memories_v_version_external_videos_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_guest_participants_locales _travel_memories_v_version_guest_participants_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants_locales
    ADD CONSTRAINT _travel_memories_v_version_guest_participants_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_guest_participants _travel_memories_v_version_guest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants
    ADD CONSTRAINT _travel_memories_v_version_guest_participants_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_reminders_items_locales _travel_memories_v_version_reminders_items_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items_locales
    ADD CONSTRAINT _travel_memories_v_version_reminders_items_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_reminders_items _travel_memories_v_version_reminders_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items
    ADD CONSTRAINT _travel_memories_v_version_reminders_items_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_reminders_locales _travel_memories_v_version_reminders_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_locales
    ADD CONSTRAINT _travel_memories_v_version_reminders_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_reminders _travel_memories_v_version_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders
    ADD CONSTRAINT _travel_memories_v_version_reminders_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_story_sections_links_locales _travel_memories_v_version_story_sections_links_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links_locales
    ADD CONSTRAINT _travel_memories_v_version_story_sections_links_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_story_sections_links _travel_memories_v_version_story_sections_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links
    ADD CONSTRAINT _travel_memories_v_version_story_sections_links_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_story_sections_locales _travel_memories_v_version_story_sections_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_locales
    ADD CONSTRAINT _travel_memories_v_version_story_sections_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_story_sections _travel_memories_v_version_story_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections
    ADD CONSTRAINT _travel_memories_v_version_story_sections_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales _travel_memories_v_version_travel_ledger_flights_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights_locales
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_flights_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_travel_ledger_flights _travel_memories_v_version_travel_ledger_flights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_flights_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales _travel_memories_v_version_travel_ledger_lodgings_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings_locales
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_lodgings_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings _travel_memories_v_version_travel_ledger_lodgings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_lodgings_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v_locales _travel_memory_days_v_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_locales
    ADD CONSTRAINT _travel_memory_days_v_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v _travel_memory_days_v_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v
    ADD CONSTRAINT _travel_memory_days_v_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v_version_moments_locales _travel_memory_days_v_version_moments_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_locales
    ADD CONSTRAINT _travel_memory_days_v_version_moments_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v_version_moments _travel_memory_days_v_version_moments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments
    ADD CONSTRAINT _travel_memory_days_v_version_moments_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v_version_moments_placements_locales _travel_memory_days_v_version_moments_placements_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements_locales
    ADD CONSTRAINT _travel_memory_days_v_version_moments_placements_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_memory_days_v_version_moments_placements _travel_memory_days_v_version_moments_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements
    ADD CONSTRAINT _travel_memory_days_v_version_moments_placements_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_locales _travel_plans_v_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_locales
    ADD CONSTRAINT _travel_plans_v_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v _travel_plans_v_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v
    ADD CONSTRAINT _travel_plans_v_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_rels _travel_plans_v_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_rels
    ADD CONSTRAINT _travel_plans_v_rels_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_guest_participants_locales _travel_plans_v_version_guest_participants_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants_locales
    ADD CONSTRAINT _travel_plans_v_version_guest_participants_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_guest_participants _travel_plans_v_version_guest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants
    ADD CONSTRAINT _travel_plans_v_version_guest_participants_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_planning_sections_links_locales _travel_plans_v_version_planning_sections_links_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links_locales
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_links_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_planning_sections_links _travel_plans_v_version_planning_sections_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_links_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_planning_sections_locales _travel_plans_v_version_planning_sections_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_locales
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_locales_pkey PRIMARY KEY (id);


--
-- Name: _travel_plans_v_version_planning_sections _travel_plans_v_version_planning_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_pkey PRIMARY KEY (id);


--
-- Name: bucket_items_locales bucket_items_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items_locales
    ADD CONSTRAINT bucket_items_locales_pkey PRIMARY KEY (id);


--
-- Name: bucket_items bucket_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items
    ADD CONSTRAINT bucket_items_pkey PRIMARY KEY (id);


--
-- Name: categories_locales categories_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales
    ADD CONSTRAINT categories_locales_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: comments_locales comments_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments_locales
    ADD CONSTRAINT comments_locales_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: home_config_locales home_config_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_locales
    ADD CONSTRAINT home_config_locales_pkey PRIMARY KEY (id);


--
-- Name: home_config home_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config
    ADD CONSTRAINT home_config_pkey PRIMARY KEY (id);


--
-- Name: home_config_rels home_config_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_rels
    ADD CONSTRAINT home_config_rels_pkey PRIMARY KEY (id);


--
-- Name: media_locales media_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_locales
    ADD CONSTRAINT media_locales_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: media_rels media_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels
    ADD CONSTRAINT media_rels_pkey PRIMARY KEY (id);


--
-- Name: media_tags_locales media_tags_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags_locales
    ADD CONSTRAINT media_tags_locales_pkey PRIMARY KEY (id);


--
-- Name: media_tags media_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags
    ADD CONSTRAINT media_tags_pkey PRIMARY KEY (id);


--
-- Name: payload_kv payload_kv_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_kv
    ADD CONSTRAINT payload_kv_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents payload_locked_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents
    ADD CONSTRAINT payload_locked_documents_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_pkey PRIMARY KEY (id);


--
-- Name: payload_migrations payload_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_migrations
    ADD CONSTRAINT payload_migrations_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences payload_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences
    ADD CONSTRAINT payload_preferences_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences_rels payload_preferences_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_pkey PRIMARY KEY (id);


--
-- Name: posts_locales posts_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_locales
    ADD CONSTRAINT posts_locales_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts_rels posts_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_pkey PRIMARY KEY (id);


--
-- Name: posts_tags_locales posts_tags_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_tags_locales
    ADD CONSTRAINT posts_tags_locales_pkey PRIMARY KEY (id);


--
-- Name: posts_tags posts_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_tags
    ADD CONSTRAINT posts_tags_pkey PRIMARY KEY (id);


--
-- Name: site_config_locales site_config_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config_locales
    ADD CONSTRAINT site_config_locales_pkey PRIMARY KEY (id);


--
-- Name: site_config site_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config
    ADD CONSTRAINT site_config_pkey PRIMARY KEY (id);


--
-- Name: site_config_social_links site_config_social_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config_social_links
    ADD CONSTRAINT site_config_social_links_pkey PRIMARY KEY (id);


--
-- Name: timeline_events_locales timeline_events_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_locales
    ADD CONSTRAINT timeline_events_locales_pkey PRIMARY KEY (id);


--
-- Name: timeline_events timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);


--
-- Name: timeline_events_rels timeline_events_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_external_videos_locales travel_memories_external_videos_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_external_videos_locales
    ADD CONSTRAINT travel_memories_external_videos_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_external_videos travel_memories_external_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_external_videos
    ADD CONSTRAINT travel_memories_external_videos_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_guest_participants_locales travel_memories_guest_participants_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_guest_participants_locales
    ADD CONSTRAINT travel_memories_guest_participants_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_guest_participants travel_memories_guest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_guest_participants
    ADD CONSTRAINT travel_memories_guest_participants_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_locales travel_memories_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_locales
    ADD CONSTRAINT travel_memories_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories travel_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories
    ADD CONSTRAINT travel_memories_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_rels travel_memories_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_rels
    ADD CONSTRAINT travel_memories_rels_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_reminders_items_locales travel_memories_reminders_items_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_items_locales
    ADD CONSTRAINT travel_memories_reminders_items_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_reminders_items travel_memories_reminders_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_items
    ADD CONSTRAINT travel_memories_reminders_items_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_reminders_locales travel_memories_reminders_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_locales
    ADD CONSTRAINT travel_memories_reminders_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_reminders travel_memories_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders
    ADD CONSTRAINT travel_memories_reminders_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_story_sections_links_locales travel_memories_story_sections_links_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_links_locales
    ADD CONSTRAINT travel_memories_story_sections_links_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_story_sections_links travel_memories_story_sections_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_links
    ADD CONSTRAINT travel_memories_story_sections_links_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_story_sections_locales travel_memories_story_sections_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_locales
    ADD CONSTRAINT travel_memories_story_sections_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_story_sections travel_memories_story_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections
    ADD CONSTRAINT travel_memories_story_sections_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_travel_ledger_flights_locales travel_memories_travel_ledger_flights_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_flights_locales
    ADD CONSTRAINT travel_memories_travel_ledger_flights_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_travel_ledger_flights travel_memories_travel_ledger_flights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_flights
    ADD CONSTRAINT travel_memories_travel_ledger_flights_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_travel_ledger_lodgings_locales travel_memories_travel_ledger_lodgings_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_lodgings_locales
    ADD CONSTRAINT travel_memories_travel_ledger_lodgings_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memories_travel_ledger_lodgings travel_memories_travel_ledger_lodgings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_lodgings
    ADD CONSTRAINT travel_memories_travel_ledger_lodgings_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days_locales travel_memory_days_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_locales
    ADD CONSTRAINT travel_memory_days_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days_moments_locales travel_memory_days_moments_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_locales
    ADD CONSTRAINT travel_memory_days_moments_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days_moments travel_memory_days_moments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments
    ADD CONSTRAINT travel_memory_days_moments_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days_moments_placements_locales travel_memory_days_moments_placements_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements_locales
    ADD CONSTRAINT travel_memory_days_moments_placements_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days_moments_placements travel_memory_days_moments_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements
    ADD CONSTRAINT travel_memory_days_moments_placements_pkey PRIMARY KEY (id);


--
-- Name: travel_memory_days travel_memory_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days
    ADD CONSTRAINT travel_memory_days_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_guest_participants_locales travel_plans_guest_participants_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_guest_participants_locales
    ADD CONSTRAINT travel_plans_guest_participants_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_guest_participants travel_plans_guest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_guest_participants
    ADD CONSTRAINT travel_plans_guest_participants_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_locales travel_plans_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_locales
    ADD CONSTRAINT travel_plans_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_plans travel_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans
    ADD CONSTRAINT travel_plans_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_planning_sections_links_locales travel_plans_planning_sections_links_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_links_locales
    ADD CONSTRAINT travel_plans_planning_sections_links_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_planning_sections_links travel_plans_planning_sections_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_links
    ADD CONSTRAINT travel_plans_planning_sections_links_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_planning_sections_locales travel_plans_planning_sections_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_locales
    ADD CONSTRAINT travel_plans_planning_sections_locales_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_planning_sections travel_plans_planning_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections
    ADD CONSTRAINT travel_plans_planning_sections_pkey PRIMARY KEY (id);


--
-- Name: travel_plans_rels travel_plans_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_rels
    ADD CONSTRAINT travel_plans_rels_pkey PRIMARY KEY (id);


--
-- Name: travel_route_identities travel_route_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities
    ADD CONSTRAINT travel_route_identities_pkey PRIMARY KEY (id);


--
-- Name: travel_route_identities_rels travel_route_identities_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities_rels
    ADD CONSTRAINT travel_route_identities_rels_pkey PRIMARY KEY (id);


--
-- Name: users_beliefs_locales users_beliefs_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_beliefs_locales
    ADD CONSTRAINT users_beliefs_locales_pkey PRIMARY KEY (id);


--
-- Name: users_beliefs users_beliefs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_beliefs
    ADD CONSTRAINT users_beliefs_pkey PRIMARY KEY (id);


--
-- Name: users_career_timeline_highlights_locales users_career_timeline_highlights_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_highlights_locales
    ADD CONSTRAINT users_career_timeline_highlights_locales_pkey PRIMARY KEY (id);


--
-- Name: users_career_timeline_highlights users_career_timeline_highlights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_highlights
    ADD CONSTRAINT users_career_timeline_highlights_pkey PRIMARY KEY (id);


--
-- Name: users_career_timeline_locales users_career_timeline_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_locales
    ADD CONSTRAINT users_career_timeline_locales_pkey PRIMARY KEY (id);


--
-- Name: users_career_timeline users_career_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline
    ADD CONSTRAINT users_career_timeline_pkey PRIMARY KEY (id);


--
-- Name: users_education_locales users_education_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_education_locales
    ADD CONSTRAINT users_education_locales_pkey PRIMARY KEY (id);


--
-- Name: users_education users_education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_education
    ADD CONSTRAINT users_education_pkey PRIMARY KEY (id);


--
-- Name: users_interests_locales users_interests_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_interests_locales
    ADD CONSTRAINT users_interests_locales_pkey PRIMARY KEY (id);


--
-- Name: users_interests users_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_interests
    ADD CONSTRAINT users_interests_pkey PRIMARY KEY (id);


--
-- Name: users_locales users_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_locales
    ADD CONSTRAINT users_locales_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_rels users_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_rels
    ADD CONSTRAINT users_rels_pkey PRIMARY KEY (id);


--
-- Name: users_sessions users_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_sessions
    ADD CONSTRAINT users_sessions_pkey PRIMARY KEY (id);


--
-- Name: users_skill_radar_locales users_skill_radar_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_skill_radar_locales
    ADD CONSTRAINT users_skill_radar_locales_pkey PRIMARY KEY (id);


--
-- Name: users_skill_radar users_skill_radar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_skill_radar
    ADD CONSTRAINT users_skill_radar_pkey PRIMARY KEY (id);


--
-- Name: users_typewriter_rotating_words_locales users_typewriter_rotating_words_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_typewriter_rotating_words_locales
    ADD CONSTRAINT users_typewriter_rotating_words_locales_pkey PRIMARY KEY (id);


--
-- Name: users_typewriter_rotating_words users_typewriter_rotating_words_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_typewriter_rotating_words
    ADD CONSTRAINT users_typewriter_rotating_words_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots_blocks_locales wrapped_snapshots_blocks_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_blocks_locales
    ADD CONSTRAINT wrapped_snapshots_blocks_locales_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots_blocks wrapped_snapshots_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_blocks
    ADD CONSTRAINT wrapped_snapshots_blocks_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots_locales wrapped_snapshots_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_locales
    ADD CONSTRAINT wrapped_snapshots_locales_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots wrapped_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots
    ADD CONSTRAINT wrapped_snapshots_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots_stats_locales wrapped_snapshots_stats_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_stats_locales
    ADD CONSTRAINT wrapped_snapshots_stats_locales_pkey PRIMARY KEY (id);


--
-- Name: wrapped_snapshots_stats wrapped_snapshots_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_stats
    ADD CONSTRAINT wrapped_snapshots_stats_pkey PRIMARY KEY (id);


--
-- Name: _travel_memories_v_autosave_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_autosave_idx ON public._travel_memories_v USING btree (autosave);


--
-- Name: _travel_memories_v_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_created_at_idx ON public._travel_memories_v USING btree (created_at);


--
-- Name: _travel_memories_v_latest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_latest_idx ON public._travel_memories_v USING btree (latest);


--
-- Name: _travel_memories_v_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_locales_locale_parent_id_unique ON public._travel_memories_v_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_parent_idx ON public._travel_memories_v USING btree (parent_id);


--
-- Name: _travel_memories_v_published_locale_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_published_locale_idx ON public._travel_memories_v USING btree (published_locale);


--
-- Name: _travel_memories_v_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_rels_media_id_idx ON public._travel_memories_v_rels USING btree (media_id);


--
-- Name: _travel_memories_v_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_rels_order_idx ON public._travel_memories_v_rels USING btree ("order");


--
-- Name: _travel_memories_v_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_rels_parent_idx ON public._travel_memories_v_rels USING btree (parent_id);


--
-- Name: _travel_memories_v_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_rels_path_idx ON public._travel_memories_v_rels USING btree (path);


--
-- Name: _travel_memories_v_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_rels_users_id_idx ON public._travel_memories_v_rels USING btree (users_id);


--
-- Name: _travel_memories_v_snapshot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_snapshot_idx ON public._travel_memories_v USING btree (snapshot);


--
-- Name: _travel_memories_v_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_updated_at_idx ON public._travel_memories_v USING btree (updated_at);


--
-- Name: _travel_memories_v_version_external_videos_locales_locale_pa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_external_videos_locales_locale_pa ON public._travel_memories_v_version_external_videos_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_external_videos_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_external_videos_order_idx ON public._travel_memories_v_version_external_videos USING btree (_order);


--
-- Name: _travel_memories_v_version_external_videos_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_external_videos_parent_id_idx ON public._travel_memories_v_version_external_videos USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_guest_participants_locales_locale; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_guest_participants_locales_locale ON public._travel_memories_v_version_guest_participants_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_guest_participants_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_guest_participants_order_idx ON public._travel_memories_v_version_guest_participants USING btree (_order);


--
-- Name: _travel_memories_v_version_guest_participants_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_guest_participants_parent_id_idx ON public._travel_memories_v_version_guest_participants USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_reminders_items_locales_locale_pa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_reminders_items_locales_locale_pa ON public._travel_memories_v_version_reminders_items_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_reminders_items_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_reminders_items_order_idx ON public._travel_memories_v_version_reminders_items USING btree (_order);


--
-- Name: _travel_memories_v_version_reminders_items_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_reminders_items_parent_id_idx ON public._travel_memories_v_version_reminders_items USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_reminders_locales_locale_parent_i; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_reminders_locales_locale_parent_i ON public._travel_memories_v_version_reminders_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_reminders_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_reminders_order_idx ON public._travel_memories_v_version_reminders USING btree (_order);


--
-- Name: _travel_memories_v_version_reminders_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_reminders_parent_id_idx ON public._travel_memories_v_version_reminders USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_story_sections_links_locales_loca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_story_sections_links_locales_loca ON public._travel_memories_v_version_story_sections_links_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_story_sections_links_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_story_sections_links_order_idx ON public._travel_memories_v_version_story_sections_links USING btree (_order);


--
-- Name: _travel_memories_v_version_story_sections_links_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_story_sections_links_parent_id_idx ON public._travel_memories_v_version_story_sections_links USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_story_sections_locales_locale_par; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_story_sections_locales_locale_par ON public._travel_memories_v_version_story_sections_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_story_sections_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_story_sections_order_idx ON public._travel_memories_v_version_story_sections USING btree (_order);


--
-- Name: _travel_memories_v_version_story_sections_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_story_sections_parent_id_idx ON public._travel_memories_v_version_story_sections USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales_loc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_travel_ledger_flights_locales_loc ON public._travel_memories_v_version_travel_ledger_flights_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_travel_ledger_flights_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_travel_ledger_flights_order_idx ON public._travel_memories_v_version_travel_ledger_flights USING btree (_order);


--
-- Name: _travel_memories_v_version_travel_ledger_flights_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_travel_ledger_flights_parent_id_idx ON public._travel_memories_v_version_travel_ledger_flights USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales_lo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memories_v_version_travel_ledger_lodgings_locales_lo ON public._travel_memories_v_version_travel_ledger_lodgings_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_travel_ledger_lodgings_order_idx ON public._travel_memories_v_version_travel_ledger_lodgings USING btree (_order);


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_travel_ledger_lodgings_parent_id_idx ON public._travel_memories_v_version_travel_ledger_lodgings USING btree (_parent_id);


--
-- Name: _travel_memories_v_version_version__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version__status_idx ON public._travel_memories_v USING btree (version__status);


--
-- Name: _travel_memories_v_version_version_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_cover_image_idx ON public._travel_memories_v USING btree (version_cover_image_id);


--
-- Name: _travel_memories_v_version_version_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_created_at_idx ON public._travel_memories_v USING btree (version_created_at);


--
-- Name: _travel_memories_v_version_version_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_end_date_idx ON public._travel_memories_v USING btree (version_end_date);


--
-- Name: _travel_memories_v_version_version_origin_plan_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_origin_plan_idx ON public._travel_memories_v USING btree (version_origin_plan_id);


--
-- Name: _travel_memories_v_version_version_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_slug_idx ON public._travel_memories_v USING btree (version_slug);


--
-- Name: _travel_memories_v_version_version_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_start_date_idx ON public._travel_memories_v USING btree (version_start_date);


--
-- Name: _travel_memories_v_version_version_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memories_v_version_version_updated_at_idx ON public._travel_memories_v USING btree (version_updated_at);


--
-- Name: _travel_memory_days_v_autosave_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_autosave_idx ON public._travel_memory_days_v USING btree (autosave);


--
-- Name: _travel_memory_days_v_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_created_at_idx ON public._travel_memory_days_v USING btree (created_at);


--
-- Name: _travel_memory_days_v_latest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_latest_idx ON public._travel_memory_days_v USING btree (latest);


--
-- Name: _travel_memory_days_v_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memory_days_v_locales_locale_parent_id_unique ON public._travel_memory_days_v_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memory_days_v_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_parent_idx ON public._travel_memory_days_v USING btree (parent_id);


--
-- Name: _travel_memory_days_v_published_locale_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_published_locale_idx ON public._travel_memory_days_v USING btree (published_locale);


--
-- Name: _travel_memory_days_v_snapshot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_snapshot_idx ON public._travel_memory_days_v USING btree (snapshot);


--
-- Name: _travel_memory_days_v_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_updated_at_idx ON public._travel_memory_days_v USING btree (updated_at);


--
-- Name: _travel_memory_days_v_version_moments_locales_locale_parent_; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memory_days_v_version_moments_locales_locale_parent_ ON public._travel_memory_days_v_version_moments_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memory_days_v_version_moments_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_moments_order_idx ON public._travel_memory_days_v_version_moments USING btree (_order);


--
-- Name: _travel_memory_days_v_version_moments_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_moments_parent_id_idx ON public._travel_memory_days_v_version_moments USING btree (_parent_id);


--
-- Name: _travel_memory_days_v_version_moments_placements_locales_loc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_memory_days_v_version_moments_placements_locales_loc ON public._travel_memory_days_v_version_moments_placements_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_memory_days_v_version_moments_placements_media_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_moments_placements_media_idx ON public._travel_memory_days_v_version_moments_placements USING btree (media_id);


--
-- Name: _travel_memory_days_v_version_moments_placements_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_moments_placements_order_idx ON public._travel_memory_days_v_version_moments_placements USING btree (_order);


--
-- Name: _travel_memory_days_v_version_moments_placements_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_moments_placements_parent_id_idx ON public._travel_memory_days_v_version_moments_placements USING btree (_parent_id);


--
-- Name: _travel_memory_days_v_version_version__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version__status_idx ON public._travel_memory_days_v USING btree (version__status);


--
-- Name: _travel_memory_days_v_version_version_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_created_at_idx ON public._travel_memory_days_v USING btree (version_created_at);


--
-- Name: _travel_memory_days_v_version_version_daily_hero_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_daily_hero_image_idx ON public._travel_memory_days_v USING btree (version_daily_hero_image_id);


--
-- Name: _travel_memory_days_v_version_version_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_date_idx ON public._travel_memory_days_v USING btree (version_date);


--
-- Name: _travel_memory_days_v_version_version_day_identity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_day_identity_idx ON public._travel_memory_days_v USING btree (version_day_identity);


--
-- Name: _travel_memory_days_v_version_version_day_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_day_key_idx ON public._travel_memory_days_v USING btree (version_day_key);


--
-- Name: _travel_memory_days_v_version_version_memory_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_memory_idx ON public._travel_memory_days_v USING btree (version_memory_id);


--
-- Name: _travel_memory_days_v_version_version_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_memory_days_v_version_version_updated_at_idx ON public._travel_memory_days_v USING btree (version_updated_at);


--
-- Name: _travel_plans_v_autosave_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_autosave_idx ON public._travel_plans_v USING btree (autosave);


--
-- Name: _travel_plans_v_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_created_at_idx ON public._travel_plans_v USING btree (created_at);


--
-- Name: _travel_plans_v_latest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_latest_idx ON public._travel_plans_v USING btree (latest);


--
-- Name: _travel_plans_v_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_plans_v_locales_locale_parent_id_unique ON public._travel_plans_v_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_plans_v_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_parent_idx ON public._travel_plans_v USING btree (parent_id);


--
-- Name: _travel_plans_v_published_locale_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_published_locale_idx ON public._travel_plans_v USING btree (published_locale);


--
-- Name: _travel_plans_v_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_rels_media_id_idx ON public._travel_plans_v_rels USING btree (media_id);


--
-- Name: _travel_plans_v_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_rels_order_idx ON public._travel_plans_v_rels USING btree ("order");


--
-- Name: _travel_plans_v_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_rels_parent_idx ON public._travel_plans_v_rels USING btree (parent_id);


--
-- Name: _travel_plans_v_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_rels_path_idx ON public._travel_plans_v_rels USING btree (path);


--
-- Name: _travel_plans_v_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_rels_users_id_idx ON public._travel_plans_v_rels USING btree (users_id);


--
-- Name: _travel_plans_v_snapshot_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_snapshot_idx ON public._travel_plans_v USING btree (snapshot);


--
-- Name: _travel_plans_v_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_updated_at_idx ON public._travel_plans_v USING btree (updated_at);


--
-- Name: _travel_plans_v_version_guest_participants_locales_locale_pa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_plans_v_version_guest_participants_locales_locale_pa ON public._travel_plans_v_version_guest_participants_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_plans_v_version_guest_participants_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_guest_participants_order_idx ON public._travel_plans_v_version_guest_participants USING btree (_order);


--
-- Name: _travel_plans_v_version_guest_participants_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_guest_participants_parent_id_idx ON public._travel_plans_v_version_guest_participants USING btree (_parent_id);


--
-- Name: _travel_plans_v_version_planning_sections_links_locales_loca; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_plans_v_version_planning_sections_links_locales_loca ON public._travel_plans_v_version_planning_sections_links_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_plans_v_version_planning_sections_links_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_planning_sections_links_order_idx ON public._travel_plans_v_version_planning_sections_links USING btree (_order);


--
-- Name: _travel_plans_v_version_planning_sections_links_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_planning_sections_links_parent_id_idx ON public._travel_plans_v_version_planning_sections_links USING btree (_parent_id);


--
-- Name: _travel_plans_v_version_planning_sections_locales_locale_par; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX _travel_plans_v_version_planning_sections_locales_locale_par ON public._travel_plans_v_version_planning_sections_locales USING btree (_locale, _parent_id);


--
-- Name: _travel_plans_v_version_planning_sections_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_planning_sections_order_idx ON public._travel_plans_v_version_planning_sections USING btree (_order);


--
-- Name: _travel_plans_v_version_planning_sections_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_planning_sections_parent_id_idx ON public._travel_plans_v_version_planning_sections USING btree (_parent_id);


--
-- Name: _travel_plans_v_version_version__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version__status_idx ON public._travel_plans_v USING btree (version__status);


--
-- Name: _travel_plans_v_version_version_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_cover_image_idx ON public._travel_plans_v USING btree (version_cover_image_id);


--
-- Name: _travel_plans_v_version_version_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_created_at_idx ON public._travel_plans_v USING btree (version_created_at);


--
-- Name: _travel_plans_v_version_version_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_end_date_idx ON public._travel_plans_v USING btree (version_end_date);


--
-- Name: _travel_plans_v_version_version_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_slug_idx ON public._travel_plans_v USING btree (version_slug);


--
-- Name: _travel_plans_v_version_version_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_start_date_idx ON public._travel_plans_v USING btree (version_start_date);


--
-- Name: _travel_plans_v_version_version_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX _travel_plans_v_version_version_updated_at_idx ON public._travel_plans_v USING btree (version_updated_at);


--
-- Name: bucket_items_completed_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_completed_by_idx ON public.bucket_items USING btree (completed_by_id);


--
-- Name: bucket_items_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_cover_image_idx ON public.bucket_items USING btree (cover_image_id);


--
-- Name: bucket_items_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_created_at_idx ON public.bucket_items USING btree (created_at);


--
-- Name: bucket_items_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_created_by_idx ON public.bucket_items USING btree (created_by_id);


--
-- Name: bucket_items_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX bucket_items_locales_locale_parent_id_unique ON public.bucket_items_locales USING btree (_locale, _parent_id);


--
-- Name: bucket_items_timeline_event_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_timeline_event_idx ON public.bucket_items USING btree (timeline_event_id);


--
-- Name: bucket_items_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bucket_items_updated_at_idx ON public.bucket_items USING btree (updated_at);


--
-- Name: categories_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_created_at_idx ON public.categories USING btree (created_at);


--
-- Name: categories_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_locales_locale_parent_id_unique ON public.categories_locales USING btree (_locale, _parent_id);


--
-- Name: categories_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_idx ON public.categories USING btree (slug);


--
-- Name: categories_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_updated_at_idx ON public.categories USING btree (updated_at);


--
-- Name: comments_associated_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_associated_id_idx ON public.comments USING btree (associated_id);


--
-- Name: comments_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_created_at_idx ON public.comments USING btree (created_at);


--
-- Name: comments_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX comments_locales_locale_parent_id_unique ON public.comments_locales USING btree (_locale, _parent_id);


--
-- Name: comments_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_updated_at_idx ON public.comments USING btree (updated_at);


--
-- Name: comments_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX comments_user_idx ON public.comments USING btree (user_id);


--
-- Name: home_config_hero_background_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_hero_background_idx ON public.home_config USING btree (hero_background_id);


--
-- Name: home_config_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX home_config_locales_locale_parent_id_unique ON public.home_config_locales USING btree (_locale, _parent_id);


--
-- Name: home_config_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_rels_order_idx ON public.home_config_rels USING btree ("order");


--
-- Name: home_config_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_rels_parent_idx ON public.home_config_rels USING btree (parent_id);


--
-- Name: home_config_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_rels_path_idx ON public.home_config_rels USING btree (path);


--
-- Name: home_config_rels_travel_memories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_rels_travel_memories_id_idx ON public.home_config_rels USING btree (travel_memories_id);


--
-- Name: home_config_rels_travel_plans_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX home_config_rels_travel_plans_id_idx ON public.home_config_rels USING btree (travel_plans_id);


--
-- Name: media_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_created_at_idx ON public.media USING btree (created_at);


--
-- Name: media_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX media_filename_idx ON public.media USING btree (filename);


--
-- Name: media_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX media_locales_locale_parent_id_unique ON public.media_locales USING btree (_locale, _parent_id);


--
-- Name: media_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_order_idx ON public.media_rels USING btree ("order");


--
-- Name: media_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_parent_idx ON public.media_rels USING btree (parent_id);


--
-- Name: media_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_path_idx ON public.media_rels USING btree (path);


--
-- Name: media_rels_travel_memories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_travel_memories_id_idx ON public.media_rels USING btree (travel_memories_id);


--
-- Name: media_rels_travel_plans_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_travel_plans_id_idx ON public.media_rels USING btree (travel_plans_id);


--
-- Name: media_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_rels_users_id_idx ON public.media_rels USING btree (users_id);


--
-- Name: media_sizes_large_sizes_large_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_sizes_large_sizes_large_filename_idx ON public.media USING btree (sizes_large_filename);


--
-- Name: media_sizes_medium_sizes_medium_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_sizes_medium_sizes_medium_filename_idx ON public.media USING btree (sizes_medium_filename);


--
-- Name: media_sizes_thumbnail_sizes_thumbnail_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_sizes_thumbnail_sizes_thumbnail_filename_idx ON public.media USING btree (sizes_thumbnail_filename);


--
-- Name: media_source_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX media_source_path_idx ON public.media USING btree (source_path);


--
-- Name: media_tags_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX media_tags_locales_locale_parent_id_unique ON public.media_tags_locales USING btree (_locale, _parent_id);


--
-- Name: media_tags_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_tags_order_idx ON public.media_tags USING btree (_order);


--
-- Name: media_tags_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_tags_parent_id_idx ON public.media_tags USING btree (_parent_id);


--
-- Name: media_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_updated_at_idx ON public.media USING btree (updated_at);


--
-- Name: payload_kv_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payload_kv_key_idx ON public.payload_kv USING btree (key);


--
-- Name: payload_locked_documents_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_created_at_idx ON public.payload_locked_documents USING btree (created_at);


--
-- Name: payload_locked_documents_global_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_global_slug_idx ON public.payload_locked_documents USING btree (global_slug);


--
-- Name: payload_locked_documents_rels_bucket_items_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_bucket_items_id_idx ON public.payload_locked_documents_rels USING btree (bucket_items_id);


--
-- Name: payload_locked_documents_rels_categories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_categories_id_idx ON public.payload_locked_documents_rels USING btree (categories_id);


--
-- Name: payload_locked_documents_rels_comments_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_comments_id_idx ON public.payload_locked_documents_rels USING btree (comments_id);


--
-- Name: payload_locked_documents_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_media_id_idx ON public.payload_locked_documents_rels USING btree (media_id);


--
-- Name: payload_locked_documents_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_order_idx ON public.payload_locked_documents_rels USING btree ("order");


--
-- Name: payload_locked_documents_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_parent_idx ON public.payload_locked_documents_rels USING btree (parent_id);


--
-- Name: payload_locked_documents_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_path_idx ON public.payload_locked_documents_rels USING btree (path);


--
-- Name: payload_locked_documents_rels_posts_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_posts_id_idx ON public.payload_locked_documents_rels USING btree (posts_id);


--
-- Name: payload_locked_documents_rels_timeline_events_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_timeline_events_id_idx ON public.payload_locked_documents_rels USING btree (timeline_events_id);


--
-- Name: payload_locked_documents_rels_travel_memories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_travel_memories_id_idx ON public.payload_locked_documents_rels USING btree (travel_memories_id);


--
-- Name: payload_locked_documents_rels_travel_memory_days_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_travel_memory_days_id_idx ON public.payload_locked_documents_rels USING btree (travel_memory_days_id);


--
-- Name: payload_locked_documents_rels_travel_plans_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_travel_plans_id_idx ON public.payload_locked_documents_rels USING btree (travel_plans_id);


--
-- Name: payload_locked_documents_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_users_id_idx ON public.payload_locked_documents_rels USING btree (users_id);


--
-- Name: payload_locked_documents_rels_wrapped_snapshots_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_rels_wrapped_snapshots_id_idx ON public.payload_locked_documents_rels USING btree (wrapped_snapshots_id);


--
-- Name: payload_locked_documents_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_locked_documents_updated_at_idx ON public.payload_locked_documents USING btree (updated_at);


--
-- Name: payload_migrations_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_migrations_created_at_idx ON public.payload_migrations USING btree (created_at);


--
-- Name: payload_migrations_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_migrations_updated_at_idx ON public.payload_migrations USING btree (updated_at);


--
-- Name: payload_preferences_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_created_at_idx ON public.payload_preferences USING btree (created_at);


--
-- Name: payload_preferences_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_key_idx ON public.payload_preferences USING btree (key);


--
-- Name: payload_preferences_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_rels_order_idx ON public.payload_preferences_rels USING btree ("order");


--
-- Name: payload_preferences_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_rels_parent_idx ON public.payload_preferences_rels USING btree (parent_id);


--
-- Name: payload_preferences_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_rels_path_idx ON public.payload_preferences_rels USING btree (path);


--
-- Name: payload_preferences_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_rels_users_id_idx ON public.payload_preferences_rels USING btree (users_id);


--
-- Name: payload_preferences_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payload_preferences_updated_at_idx ON public.payload_preferences USING btree (updated_at);


--
-- Name: posts_author_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_author_idx ON public.posts USING btree (author_id);


--
-- Name: posts_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_cover_image_idx ON public.posts USING btree (cover_image_id);


--
-- Name: posts_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at);


--
-- Name: posts_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX posts_locales_locale_parent_id_unique ON public.posts_locales USING btree (_locale, _parent_id);


--
-- Name: posts_rels_categories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_rels_categories_id_idx ON public.posts_rels USING btree (categories_id);


--
-- Name: posts_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_rels_order_idx ON public.posts_rels USING btree ("order");


--
-- Name: posts_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_rels_parent_idx ON public.posts_rels USING btree (parent_id);


--
-- Name: posts_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_rels_path_idx ON public.posts_rels USING btree (path);


--
-- Name: posts_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX posts_slug_idx ON public.posts USING btree (slug);


--
-- Name: posts_tags_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX posts_tags_locales_locale_parent_id_unique ON public.posts_tags_locales USING btree (_locale, _parent_id);


--
-- Name: posts_tags_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_tags_order_idx ON public.posts_tags USING btree (_order);


--
-- Name: posts_tags_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_tags_parent_id_idx ON public.posts_tags USING btree (_parent_id);


--
-- Name: posts_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX posts_updated_at_idx ON public.posts USING btree (updated_at);


--
-- Name: site_config_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX site_config_locales_locale_parent_id_unique ON public.site_config_locales USING btree (_locale, _parent_id);


--
-- Name: site_config_social_links_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX site_config_social_links_order_idx ON public.site_config_social_links USING btree (_order);


--
-- Name: site_config_social_links_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX site_config_social_links_parent_id_idx ON public.site_config_social_links USING btree (_parent_id);


--
-- Name: timeline_events_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_created_at_idx ON public.timeline_events USING btree (created_at);


--
-- Name: timeline_events_event_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_event_date_idx ON public.timeline_events USING btree (event_date);


--
-- Name: timeline_events_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX timeline_events_locales_locale_parent_id_unique ON public.timeline_events_locales USING btree (_locale, _parent_id);


--
-- Name: timeline_events_related_post_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_related_post_idx ON public.timeline_events USING btree (related_post_id);


--
-- Name: timeline_events_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_media_id_idx ON public.timeline_events_rels USING btree (media_id);


--
-- Name: timeline_events_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_order_idx ON public.timeline_events_rels USING btree ("order");


--
-- Name: timeline_events_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_parent_idx ON public.timeline_events_rels USING btree (parent_id);


--
-- Name: timeline_events_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_path_idx ON public.timeline_events_rels USING btree (path);


--
-- Name: timeline_events_rels_travel_memories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_travel_memories_id_idx ON public.timeline_events_rels USING btree (travel_memories_id);


--
-- Name: timeline_events_rels_travel_plans_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_travel_plans_id_idx ON public.timeline_events_rels USING btree (travel_plans_id);


--
-- Name: timeline_events_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_rels_users_id_idx ON public.timeline_events_rels USING btree (users_id);


--
-- Name: timeline_events_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX timeline_events_slug_idx ON public.timeline_events USING btree (slug);


--
-- Name: timeline_events_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_updated_at_idx ON public.timeline_events USING btree (updated_at);


--
-- Name: timeline_events_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX timeline_events_year_idx ON public.timeline_events USING btree (year);


--
-- Name: travel_memories__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories__status_idx ON public.travel_memories USING btree (_status);


--
-- Name: travel_memories_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_cover_image_idx ON public.travel_memories USING btree (cover_image_id);


--
-- Name: travel_memories_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_created_at_idx ON public.travel_memories USING btree (created_at);


--
-- Name: travel_memories_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_end_date_idx ON public.travel_memories USING btree (end_date);


--
-- Name: travel_memories_external_videos_locales_locale_parent_id_uni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_external_videos_locales_locale_parent_id_uni ON public.travel_memories_external_videos_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_external_videos_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_external_videos_order_idx ON public.travel_memories_external_videos USING btree (_order);


--
-- Name: travel_memories_external_videos_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_external_videos_parent_id_idx ON public.travel_memories_external_videos USING btree (_parent_id);


--
-- Name: travel_memories_guest_participants_locales_locale_parent_id_; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_guest_participants_locales_locale_parent_id_ ON public.travel_memories_guest_participants_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_guest_participants_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_guest_participants_order_idx ON public.travel_memories_guest_participants USING btree (_order);


--
-- Name: travel_memories_guest_participants_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_guest_participants_parent_id_idx ON public.travel_memories_guest_participants USING btree (_parent_id);


--
-- Name: travel_memories_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_locales_locale_parent_id_unique ON public.travel_memories_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_origin_plan_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_origin_plan_idx ON public.travel_memories USING btree (origin_plan_id);


--
-- Name: travel_memories_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_rels_media_id_idx ON public.travel_memories_rels USING btree (media_id);


--
-- Name: travel_memories_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_rels_order_idx ON public.travel_memories_rels USING btree ("order");


--
-- Name: travel_memories_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_rels_parent_idx ON public.travel_memories_rels USING btree (parent_id);


--
-- Name: travel_memories_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_rels_path_idx ON public.travel_memories_rels USING btree (path);


--
-- Name: travel_memories_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_rels_users_id_idx ON public.travel_memories_rels USING btree (users_id);


--
-- Name: travel_memories_reminders_items_locales_locale_parent_id_uni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_reminders_items_locales_locale_parent_id_uni ON public.travel_memories_reminders_items_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_reminders_items_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_reminders_items_order_idx ON public.travel_memories_reminders_items USING btree (_order);


--
-- Name: travel_memories_reminders_items_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_reminders_items_parent_id_idx ON public.travel_memories_reminders_items USING btree (_parent_id);


--
-- Name: travel_memories_reminders_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_reminders_locales_locale_parent_id_unique ON public.travel_memories_reminders_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_reminders_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_reminders_order_idx ON public.travel_memories_reminders USING btree (_order);


--
-- Name: travel_memories_reminders_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_reminders_parent_id_idx ON public.travel_memories_reminders USING btree (_parent_id);


--
-- Name: travel_memories_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_slug_idx ON public.travel_memories USING btree (slug);


--
-- Name: travel_memories_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_start_date_idx ON public.travel_memories USING btree (start_date);


--
-- Name: travel_memories_story_sections_links_locales_locale_parent_i; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_story_sections_links_locales_locale_parent_i ON public.travel_memories_story_sections_links_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_story_sections_links_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_story_sections_links_order_idx ON public.travel_memories_story_sections_links USING btree (_order);


--
-- Name: travel_memories_story_sections_links_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_story_sections_links_parent_id_idx ON public.travel_memories_story_sections_links USING btree (_parent_id);


--
-- Name: travel_memories_story_sections_locales_locale_parent_id_uniq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_story_sections_locales_locale_parent_id_uniq ON public.travel_memories_story_sections_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_story_sections_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_story_sections_order_idx ON public.travel_memories_story_sections USING btree (_order);


--
-- Name: travel_memories_story_sections_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_story_sections_parent_id_idx ON public.travel_memories_story_sections USING btree (_parent_id);


--
-- Name: travel_memories_travel_ledger_flights_locales_locale_parent_; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_travel_ledger_flights_locales_locale_parent_ ON public.travel_memories_travel_ledger_flights_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_travel_ledger_flights_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_travel_ledger_flights_order_idx ON public.travel_memories_travel_ledger_flights USING btree (_order);


--
-- Name: travel_memories_travel_ledger_flights_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_travel_ledger_flights_parent_id_idx ON public.travel_memories_travel_ledger_flights USING btree (_parent_id);


--
-- Name: travel_memories_travel_ledger_lodgings_locales_locale_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memories_travel_ledger_lodgings_locales_locale_parent ON public.travel_memories_travel_ledger_lodgings_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memories_travel_ledger_lodgings_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_travel_ledger_lodgings_order_idx ON public.travel_memories_travel_ledger_lodgings USING btree (_order);


--
-- Name: travel_memories_travel_ledger_lodgings_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_travel_ledger_lodgings_parent_id_idx ON public.travel_memories_travel_ledger_lodgings USING btree (_parent_id);


--
-- Name: travel_memories_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memories_updated_at_idx ON public.travel_memories USING btree (updated_at);


--
-- Name: travel_memory_days__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days__status_idx ON public.travel_memory_days USING btree (_status);


--
-- Name: travel_memory_days_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_created_at_idx ON public.travel_memory_days USING btree (created_at);


--
-- Name: travel_memory_days_daily_hero_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_daily_hero_image_idx ON public.travel_memory_days USING btree (daily_hero_image_id);


--
-- Name: travel_memory_days_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_date_idx ON public.travel_memory_days USING btree (date);


--
-- Name: travel_memory_days_day_identity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memory_days_day_identity_idx ON public.travel_memory_days USING btree (day_identity);


--
-- Name: travel_memory_days_day_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_day_key_idx ON public.travel_memory_days USING btree (day_key);


--
-- Name: travel_memory_days_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memory_days_locales_locale_parent_id_unique ON public.travel_memory_days_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memory_days_memory_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_memory_idx ON public.travel_memory_days USING btree (memory_id);


--
-- Name: travel_memory_days_moments_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memory_days_moments_locales_locale_parent_id_unique ON public.travel_memory_days_moments_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memory_days_moments_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_moments_order_idx ON public.travel_memory_days_moments USING btree (_order);


--
-- Name: travel_memory_days_moments_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_moments_parent_id_idx ON public.travel_memory_days_moments USING btree (_parent_id);


--
-- Name: travel_memory_days_moments_placements_locales_locale_parent_; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_memory_days_moments_placements_locales_locale_parent_ ON public.travel_memory_days_moments_placements_locales USING btree (_locale, _parent_id);


--
-- Name: travel_memory_days_moments_placements_media_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_moments_placements_media_idx ON public.travel_memory_days_moments_placements USING btree (media_id);


--
-- Name: travel_memory_days_moments_placements_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_moments_placements_order_idx ON public.travel_memory_days_moments_placements USING btree (_order);


--
-- Name: travel_memory_days_moments_placements_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_moments_placements_parent_id_idx ON public.travel_memory_days_moments_placements USING btree (_parent_id);


--
-- Name: travel_memory_days_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_memory_days_updated_at_idx ON public.travel_memory_days USING btree (updated_at);


--
-- Name: travel_plans__status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans__status_idx ON public.travel_plans USING btree (_status);


--
-- Name: travel_plans_cover_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_cover_image_idx ON public.travel_plans USING btree (cover_image_id);


--
-- Name: travel_plans_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_created_at_idx ON public.travel_plans USING btree (created_at);


--
-- Name: travel_plans_end_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_end_date_idx ON public.travel_plans USING btree (end_date);


--
-- Name: travel_plans_guest_participants_locales_locale_parent_id_uni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_plans_guest_participants_locales_locale_parent_id_uni ON public.travel_plans_guest_participants_locales USING btree (_locale, _parent_id);


--
-- Name: travel_plans_guest_participants_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_guest_participants_order_idx ON public.travel_plans_guest_participants USING btree (_order);


--
-- Name: travel_plans_guest_participants_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_guest_participants_parent_id_idx ON public.travel_plans_guest_participants USING btree (_parent_id);


--
-- Name: travel_plans_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_plans_locales_locale_parent_id_unique ON public.travel_plans_locales USING btree (_locale, _parent_id);


--
-- Name: travel_plans_planning_sections_links_locales_locale_parent_i; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_plans_planning_sections_links_locales_locale_parent_i ON public.travel_plans_planning_sections_links_locales USING btree (_locale, _parent_id);


--
-- Name: travel_plans_planning_sections_links_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_planning_sections_links_order_idx ON public.travel_plans_planning_sections_links USING btree (_order);


--
-- Name: travel_plans_planning_sections_links_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_planning_sections_links_parent_id_idx ON public.travel_plans_planning_sections_links USING btree (_parent_id);


--
-- Name: travel_plans_planning_sections_locales_locale_parent_id_uniq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_plans_planning_sections_locales_locale_parent_id_uniq ON public.travel_plans_planning_sections_locales USING btree (_locale, _parent_id);


--
-- Name: travel_plans_planning_sections_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_planning_sections_order_idx ON public.travel_plans_planning_sections USING btree (_order);


--
-- Name: travel_plans_planning_sections_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_planning_sections_parent_id_idx ON public.travel_plans_planning_sections USING btree (_parent_id);


--
-- Name: travel_plans_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_rels_media_id_idx ON public.travel_plans_rels USING btree (media_id);


--
-- Name: travel_plans_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_rels_order_idx ON public.travel_plans_rels USING btree ("order");


--
-- Name: travel_plans_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_rels_parent_idx ON public.travel_plans_rels USING btree (parent_id);


--
-- Name: travel_plans_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_rels_path_idx ON public.travel_plans_rels USING btree (path);


--
-- Name: travel_plans_rels_users_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_rels_users_id_idx ON public.travel_plans_rels USING btree (users_id);


--
-- Name: travel_plans_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_plans_slug_idx ON public.travel_plans USING btree (slug);


--
-- Name: travel_plans_start_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_start_date_idx ON public.travel_plans USING btree (start_date);


--
-- Name: travel_plans_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_plans_updated_at_idx ON public.travel_plans USING btree (updated_at);


--
-- Name: travel_route_identities_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_created_at_idx ON public.travel_route_identities USING btree (created_at);


--
-- Name: travel_route_identities_owner_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_route_identities_owner_key_idx ON public.travel_route_identities USING btree (owner_key);


--
-- Name: travel_route_identities_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_rels_order_idx ON public.travel_route_identities_rels USING btree ("order");


--
-- Name: travel_route_identities_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_rels_parent_idx ON public.travel_route_identities_rels USING btree (parent_id);


--
-- Name: travel_route_identities_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_rels_path_idx ON public.travel_route_identities_rels USING btree (path);


--
-- Name: travel_route_identities_rels_travel_memories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_rels_travel_memories_id_idx ON public.travel_route_identities_rels USING btree (travel_memories_id);


--
-- Name: travel_route_identities_rels_travel_plans_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_rels_travel_plans_id_idx ON public.travel_route_identities_rels USING btree (travel_plans_id);


--
-- Name: travel_route_identities_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX travel_route_identities_slug_idx ON public.travel_route_identities USING btree (slug);


--
-- Name: travel_route_identities_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX travel_route_identities_updated_at_idx ON public.travel_route_identities USING btree (updated_at);


--
-- Name: users_avatar_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_avatar_idx ON public.users USING btree (avatar_id);


--
-- Name: users_beliefs_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_beliefs_locales_locale_parent_id_unique ON public.users_beliefs_locales USING btree (_locale, _parent_id);


--
-- Name: users_beliefs_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_beliefs_order_idx ON public.users_beliefs USING btree (_order);


--
-- Name: users_beliefs_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_beliefs_parent_id_idx ON public.users_beliefs USING btree (_parent_id);


--
-- Name: users_card_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_card_image_idx ON public.users USING btree (card_image_id);


--
-- Name: users_career_timeline_highlights_locales_locale_parent_id_un; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_career_timeline_highlights_locales_locale_parent_id_un ON public.users_career_timeline_highlights_locales USING btree (_locale, _parent_id);


--
-- Name: users_career_timeline_highlights_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_career_timeline_highlights_order_idx ON public.users_career_timeline_highlights USING btree (_order);


--
-- Name: users_career_timeline_highlights_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_career_timeline_highlights_parent_id_idx ON public.users_career_timeline_highlights USING btree (_parent_id);


--
-- Name: users_career_timeline_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_career_timeline_locales_locale_parent_id_unique ON public.users_career_timeline_locales USING btree (_locale, _parent_id);


--
-- Name: users_career_timeline_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_career_timeline_order_idx ON public.users_career_timeline USING btree (_order);


--
-- Name: users_career_timeline_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_career_timeline_parent_id_idx ON public.users_career_timeline USING btree (_parent_id);


--
-- Name: users_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_created_at_idx ON public.users USING btree (created_at);


--
-- Name: users_education_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_education_locales_locale_parent_id_unique ON public.users_education_locales USING btree (_locale, _parent_id);


--
-- Name: users_education_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_education_order_idx ON public.users_education USING btree (_order);


--
-- Name: users_education_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_education_parent_id_idx ON public.users_education USING btree (_parent_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_hero_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_hero_image_idx ON public.users USING btree (hero_image_id);


--
-- Name: users_interests_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_interests_locales_locale_parent_id_unique ON public.users_interests_locales USING btree (_locale, _parent_id);


--
-- Name: users_interests_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_interests_order_idx ON public.users_interests USING btree (_order);


--
-- Name: users_interests_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_interests_parent_id_idx ON public.users_interests USING btree (_parent_id);


--
-- Name: users_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_locales_locale_parent_id_unique ON public.users_locales USING btree (_locale, _parent_id);


--
-- Name: users_rels_media_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_rels_media_id_idx ON public.users_rels USING btree (media_id);


--
-- Name: users_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_rels_order_idx ON public.users_rels USING btree ("order");


--
-- Name: users_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_rels_parent_idx ON public.users_rels USING btree (parent_id);


--
-- Name: users_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_rels_path_idx ON public.users_rels USING btree (path);


--
-- Name: users_sessions_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_sessions_order_idx ON public.users_sessions USING btree (_order);


--
-- Name: users_sessions_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_sessions_parent_id_idx ON public.users_sessions USING btree (_parent_id);


--
-- Name: users_skill_radar_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_skill_radar_locales_locale_parent_id_unique ON public.users_skill_radar_locales USING btree (_locale, _parent_id);


--
-- Name: users_skill_radar_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_skill_radar_order_idx ON public.users_skill_radar USING btree (_order);


--
-- Name: users_skill_radar_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_skill_radar_parent_id_idx ON public.users_skill_radar USING btree (_parent_id);


--
-- Name: users_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_slug_idx ON public.users USING btree (slug);


--
-- Name: users_typewriter_rotating_words_locales_locale_parent_id_uni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_typewriter_rotating_words_locales_locale_parent_id_uni ON public.users_typewriter_rotating_words_locales USING btree (_locale, _parent_id);


--
-- Name: users_typewriter_rotating_words_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_typewriter_rotating_words_order_idx ON public.users_typewriter_rotating_words USING btree (_order);


--
-- Name: users_typewriter_rotating_words_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_typewriter_rotating_words_parent_id_idx ON public.users_typewriter_rotating_words USING btree (_parent_id);


--
-- Name: users_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_updated_at_idx ON public.users USING btree (updated_at);


--
-- Name: wrapped_snapshots_blocks_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wrapped_snapshots_blocks_locales_locale_parent_id_unique ON public.wrapped_snapshots_blocks_locales USING btree (_locale, _parent_id);


--
-- Name: wrapped_snapshots_blocks_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_blocks_order_idx ON public.wrapped_snapshots_blocks USING btree (_order);


--
-- Name: wrapped_snapshots_blocks_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_blocks_parent_id_idx ON public.wrapped_snapshots_blocks USING btree (_parent_id);


--
-- Name: wrapped_snapshots_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_created_at_idx ON public.wrapped_snapshots USING btree (created_at);


--
-- Name: wrapped_snapshots_hero_media_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_hero_media_idx ON public.wrapped_snapshots USING btree (hero_media_id);


--
-- Name: wrapped_snapshots_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wrapped_snapshots_locales_locale_parent_id_unique ON public.wrapped_snapshots_locales USING btree (_locale, _parent_id);


--
-- Name: wrapped_snapshots_stats_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wrapped_snapshots_stats_locales_locale_parent_id_unique ON public.wrapped_snapshots_stats_locales USING btree (_locale, _parent_id);


--
-- Name: wrapped_snapshots_stats_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_stats_order_idx ON public.wrapped_snapshots_stats USING btree (_order);


--
-- Name: wrapped_snapshots_stats_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_stats_parent_id_idx ON public.wrapped_snapshots_stats USING btree (_parent_id);


--
-- Name: wrapped_snapshots_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX wrapped_snapshots_updated_at_idx ON public.wrapped_snapshots USING btree (updated_at);


--
-- Name: wrapped_snapshots_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wrapped_snapshots_year_idx ON public.wrapped_snapshots USING btree (year);


--
-- Name: _travel_memories_v_locales _travel_memories_v_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_locales
    ADD CONSTRAINT _travel_memories_v_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v _travel_memories_v_parent_id_travel_memories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v
    ADD CONSTRAINT _travel_memories_v_parent_id_travel_memories_id_fk FOREIGN KEY (parent_id) REFERENCES public.travel_memories(id) ON DELETE SET NULL;


--
-- Name: _travel_memories_v_rels _travel_memories_v_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_rels
    ADD CONSTRAINT _travel_memories_v_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_rels _travel_memories_v_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_rels
    ADD CONSTRAINT _travel_memories_v_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_rels _travel_memories_v_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_rels
    ADD CONSTRAINT _travel_memories_v_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v _travel_memories_v_version_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v
    ADD CONSTRAINT _travel_memories_v_version_cover_image_id_media_id_fk FOREIGN KEY (version_cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: _travel_memories_v_version_external_videos_locales _travel_memories_v_version_external_videos_locales_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos_locales
    ADD CONSTRAINT _travel_memories_v_version_external_videos_locales_parent_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_external_videos(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_external_videos _travel_memories_v_version_external_videos_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_external_videos
    ADD CONSTRAINT _travel_memories_v_version_external_videos_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_guest_participants_locales _travel_memories_v_version_guest_participants_locales_par_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants_locales
    ADD CONSTRAINT _travel_memories_v_version_guest_participants_locales_par_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_guest_participants(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_guest_participants _travel_memories_v_version_guest_participants_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_guest_participants
    ADD CONSTRAINT _travel_memories_v_version_guest_participants_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v _travel_memories_v_version_origin_plan_id_travel_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v
    ADD CONSTRAINT _travel_memories_v_version_origin_plan_id_travel_plans_id_fk FOREIGN KEY (version_origin_plan_id) REFERENCES public.travel_plans(id) ON DELETE SET NULL;


--
-- Name: _travel_memories_v_version_reminders_items_locales _travel_memories_v_version_reminders_items_locales_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items_locales
    ADD CONSTRAINT _travel_memories_v_version_reminders_items_locales_parent_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_reminders_items(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_reminders_items _travel_memories_v_version_reminders_items_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_items
    ADD CONSTRAINT _travel_memories_v_version_reminders_items_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_reminders(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_reminders_locales _travel_memories_v_version_reminders_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders_locales
    ADD CONSTRAINT _travel_memories_v_version_reminders_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_reminders(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_reminders _travel_memories_v_version_reminders_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_reminders
    ADD CONSTRAINT _travel_memories_v_version_reminders_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_story_sections_links_locales _travel_memories_v_version_story_sections_links_locales_p_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links_locales
    ADD CONSTRAINT _travel_memories_v_version_story_sections_links_locales_p_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_story_sections_links(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_story_sections_links _travel_memories_v_version_story_sections_links_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_links
    ADD CONSTRAINT _travel_memories_v_version_story_sections_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_story_sections(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_story_sections_locales _travel_memories_v_version_story_sections_locales_parent__fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections_locales
    ADD CONSTRAINT _travel_memories_v_version_story_sections_locales_parent__fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_story_sections(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_story_sections _travel_memories_v_version_story_sections_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_story_sections
    ADD CONSTRAINT _travel_memories_v_version_story_sections_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales _travel_memories_v_version_travel_ledger_flights_locales__fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights_locales
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_flights_locales__fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_travel_ledger_flights(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_travel_ledger_flights _travel_memories_v_version_travel_ledger_flights_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_flights
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_flights_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales _travel_memories_v_version_travel_ledger_lodgings_locales_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings_locales
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_lodgings_locales_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v_version_travel_ledger_lodgings(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v_version_travel_ledger_lodgings _travel_memories_v_version_travel_ledger_lodgings_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memories_v_version_travel_ledger_lodgings
    ADD CONSTRAINT _travel_memories_v_version_travel_ledger_lodgings_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memories_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memory_days_v_locales _travel_memory_days_v_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_locales
    ADD CONSTRAINT _travel_memory_days_v_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memory_days_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memory_days_v _travel_memory_days_v_parent_id_travel_memory_days_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v
    ADD CONSTRAINT _travel_memory_days_v_parent_id_travel_memory_days_id_fk FOREIGN KEY (parent_id) REFERENCES public.travel_memory_days(id) ON DELETE SET NULL;


--
-- Name: _travel_memory_days_v _travel_memory_days_v_version_daily_hero_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v
    ADD CONSTRAINT _travel_memory_days_v_version_daily_hero_image_id_media_id_fk FOREIGN KEY (version_daily_hero_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: _travel_memory_days_v _travel_memory_days_v_version_memory_id_travel_memories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v
    ADD CONSTRAINT _travel_memory_days_v_version_memory_id_travel_memories_id_fk FOREIGN KEY (version_memory_id) REFERENCES public.travel_memories(id) ON DELETE SET NULL;


--
-- Name: _travel_memory_days_v_version_moments_locales _travel_memory_days_v_version_moments_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_locales
    ADD CONSTRAINT _travel_memory_days_v_version_moments_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memory_days_v_version_moments(id) ON DELETE CASCADE;


--
-- Name: _travel_memory_days_v_version_moments _travel_memory_days_v_version_moments_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments
    ADD CONSTRAINT _travel_memory_days_v_version_moments_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memory_days_v(id) ON DELETE CASCADE;


--
-- Name: _travel_memory_days_v_version_moments_placements_locales _travel_memory_days_v_version_moments_placements_locales__fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements_locales
    ADD CONSTRAINT _travel_memory_days_v_version_moments_placements_locales__fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memory_days_v_version_moments_placements(id) ON DELETE CASCADE;


--
-- Name: _travel_memory_days_v_version_moments_placements _travel_memory_days_v_version_moments_placements_media_id_media; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements
    ADD CONSTRAINT _travel_memory_days_v_version_moments_placements_media_id_media FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: _travel_memory_days_v_version_moments_placements _travel_memory_days_v_version_moments_placements_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_memory_days_v_version_moments_placements
    ADD CONSTRAINT _travel_memory_days_v_version_moments_placements_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_memory_days_v_version_moments(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_locales _travel_plans_v_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_locales
    ADD CONSTRAINT _travel_plans_v_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v _travel_plans_v_parent_id_travel_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v
    ADD CONSTRAINT _travel_plans_v_parent_id_travel_plans_id_fk FOREIGN KEY (parent_id) REFERENCES public.travel_plans(id) ON DELETE SET NULL;


--
-- Name: _travel_plans_v_rels _travel_plans_v_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_rels
    ADD CONSTRAINT _travel_plans_v_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_rels _travel_plans_v_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_rels
    ADD CONSTRAINT _travel_plans_v_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public._travel_plans_v(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_rels _travel_plans_v_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_rels
    ADD CONSTRAINT _travel_plans_v_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v _travel_plans_v_version_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v
    ADD CONSTRAINT _travel_plans_v_version_cover_image_id_media_id_fk FOREIGN KEY (version_cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: _travel_plans_v_version_guest_participants_locales _travel_plans_v_version_guest_participants_locales_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants_locales
    ADD CONSTRAINT _travel_plans_v_version_guest_participants_locales_parent_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v_version_guest_participants(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_version_guest_participants _travel_plans_v_version_guest_participants_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_guest_participants
    ADD CONSTRAINT _travel_plans_v_version_guest_participants_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_version_planning_sections_links_locales _travel_plans_v_version_planning_sections_links_locales_p_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links_locales
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_links_locales_p_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v_version_planning_sections_links(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_version_planning_sections_links _travel_plans_v_version_planning_sections_links_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_links
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v_version_planning_sections(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_version_planning_sections_locales _travel_plans_v_version_planning_sections_locales_parent__fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections_locales
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_locales_parent__fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v_version_planning_sections(id) ON DELETE CASCADE;


--
-- Name: _travel_plans_v_version_planning_sections _travel_plans_v_version_planning_sections_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._travel_plans_v_version_planning_sections
    ADD CONSTRAINT _travel_plans_v_version_planning_sections_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._travel_plans_v(id) ON DELETE CASCADE;


--
-- Name: bucket_items bucket_items_completed_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items
    ADD CONSTRAINT bucket_items_completed_by_id_users_id_fk FOREIGN KEY (completed_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bucket_items bucket_items_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items
    ADD CONSTRAINT bucket_items_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: bucket_items bucket_items_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items
    ADD CONSTRAINT bucket_items_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bucket_items_locales bucket_items_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items_locales
    ADD CONSTRAINT bucket_items_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.bucket_items(id) ON DELETE CASCADE;


--
-- Name: bucket_items bucket_items_timeline_event_id_timeline_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bucket_items
    ADD CONSTRAINT bucket_items_timeline_event_id_timeline_events_id_fk FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE SET NULL;


--
-- Name: categories_locales categories_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales
    ADD CONSTRAINT categories_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: comments_locales comments_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments_locales
    ADD CONSTRAINT comments_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: home_config home_config_hero_background_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config
    ADD CONSTRAINT home_config_hero_background_id_media_id_fk FOREIGN KEY (hero_background_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: home_config_locales home_config_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_locales
    ADD CONSTRAINT home_config_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.home_config(id) ON DELETE CASCADE;


--
-- Name: home_config_rels home_config_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_rels
    ADD CONSTRAINT home_config_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.home_config(id) ON DELETE CASCADE;


--
-- Name: home_config_rels home_config_rels_travel_memories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_rels
    ADD CONSTRAINT home_config_rels_travel_memories_fk FOREIGN KEY (travel_memories_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: home_config_rels home_config_rels_travel_plans_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_config_rels
    ADD CONSTRAINT home_config_rels_travel_plans_fk FOREIGN KEY (travel_plans_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: media_locales media_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_locales
    ADD CONSTRAINT media_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: media_rels media_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels
    ADD CONSTRAINT media_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: media_rels media_rels_travel_memories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels
    ADD CONSTRAINT media_rels_travel_memories_fk FOREIGN KEY (travel_memories_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: media_rels media_rels_travel_plans_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels
    ADD CONSTRAINT media_rels_travel_plans_fk FOREIGN KEY (travel_plans_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: media_rels media_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_rels
    ADD CONSTRAINT media_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: media_tags_locales media_tags_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags_locales
    ADD CONSTRAINT media_tags_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.media_tags(id) ON DELETE CASCADE;


--
-- Name: media_tags media_tags_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_tags
    ADD CONSTRAINT media_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_bucket_items_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_bucket_items_fk FOREIGN KEY (bucket_items_id) REFERENCES public.bucket_items(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_categories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_categories_fk FOREIGN KEY (categories_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_comments_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_comments_fk FOREIGN KEY (comments_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_locked_documents(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_posts_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_posts_fk FOREIGN KEY (posts_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_timeline_events_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_timeline_events_fk FOREIGN KEY (timeline_events_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_travel_memories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_travel_memories_fk FOREIGN KEY (travel_memories_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_travel_memory_days_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_travel_memory_days_fk FOREIGN KEY (travel_memory_days_id) REFERENCES public.travel_memory_days(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_travel_plans_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_travel_plans_fk FOREIGN KEY (travel_plans_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_wrapped_snapshots_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_wrapped_snapshots_fk FOREIGN KEY (wrapped_snapshots_id) REFERENCES public.wrapped_snapshots(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_preferences(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: posts posts_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: posts_locales posts_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_locales
    ADD CONSTRAINT posts_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_categories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_categories_fk FOREIGN KEY (categories_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: posts_rels posts_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_rels
    ADD CONSTRAINT posts_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: posts_tags_locales posts_tags_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_tags_locales
    ADD CONSTRAINT posts_tags_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.posts_tags(id) ON DELETE CASCADE;


--
-- Name: posts_tags posts_tags_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts_tags
    ADD CONSTRAINT posts_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: site_config_locales site_config_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config_locales
    ADD CONSTRAINT site_config_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.site_config(id) ON DELETE CASCADE;


--
-- Name: site_config_social_links site_config_social_links_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_config_social_links
    ADD CONSTRAINT site_config_social_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.site_config(id) ON DELETE CASCADE;


--
-- Name: timeline_events_locales timeline_events_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_locales
    ADD CONSTRAINT timeline_events_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;


--
-- Name: timeline_events timeline_events_related_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_related_post_id_posts_id_fk FOREIGN KEY (related_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: timeline_events_rels timeline_events_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: timeline_events_rels timeline_events_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;


--
-- Name: timeline_events_rels timeline_events_rels_travel_memories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_travel_memories_fk FOREIGN KEY (travel_memories_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: timeline_events_rels timeline_events_rels_travel_plans_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_travel_plans_fk FOREIGN KEY (travel_plans_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: timeline_events_rels timeline_events_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events_rels
    ADD CONSTRAINT timeline_events_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: travel_memories travel_memories_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories
    ADD CONSTRAINT travel_memories_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: travel_memories_external_videos_locales travel_memories_external_videos_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_external_videos_locales
    ADD CONSTRAINT travel_memories_external_videos_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_external_videos(id) ON DELETE CASCADE;


--
-- Name: travel_memories_external_videos travel_memories_external_videos_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_external_videos
    ADD CONSTRAINT travel_memories_external_videos_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_guest_participants_locales travel_memories_guest_participants_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_guest_participants_locales
    ADD CONSTRAINT travel_memories_guest_participants_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_guest_participants(id) ON DELETE CASCADE;


--
-- Name: travel_memories_guest_participants travel_memories_guest_participants_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_guest_participants
    ADD CONSTRAINT travel_memories_guest_participants_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_locales travel_memories_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_locales
    ADD CONSTRAINT travel_memories_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories travel_memories_origin_plan_id_travel_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories
    ADD CONSTRAINT travel_memories_origin_plan_id_travel_plans_id_fk FOREIGN KEY (origin_plan_id) REFERENCES public.travel_plans(id) ON DELETE SET NULL;


--
-- Name: travel_memories_rels travel_memories_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_rels
    ADD CONSTRAINT travel_memories_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: travel_memories_rels travel_memories_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_rels
    ADD CONSTRAINT travel_memories_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_rels travel_memories_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_rels
    ADD CONSTRAINT travel_memories_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: travel_memories_reminders_items_locales travel_memories_reminders_items_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_items_locales
    ADD CONSTRAINT travel_memories_reminders_items_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_reminders_items(id) ON DELETE CASCADE;


--
-- Name: travel_memories_reminders_items travel_memories_reminders_items_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_items
    ADD CONSTRAINT travel_memories_reminders_items_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_reminders(id) ON DELETE CASCADE;


--
-- Name: travel_memories_reminders_locales travel_memories_reminders_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders_locales
    ADD CONSTRAINT travel_memories_reminders_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_reminders(id) ON DELETE CASCADE;


--
-- Name: travel_memories_reminders travel_memories_reminders_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_reminders
    ADD CONSTRAINT travel_memories_reminders_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_story_sections_links_locales travel_memories_story_sections_links_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_links_locales
    ADD CONSTRAINT travel_memories_story_sections_links_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_story_sections_links(id) ON DELETE CASCADE;


--
-- Name: travel_memories_story_sections_links travel_memories_story_sections_links_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_links
    ADD CONSTRAINT travel_memories_story_sections_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_story_sections(id) ON DELETE CASCADE;


--
-- Name: travel_memories_story_sections_locales travel_memories_story_sections_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections_locales
    ADD CONSTRAINT travel_memories_story_sections_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_story_sections(id) ON DELETE CASCADE;


--
-- Name: travel_memories_story_sections travel_memories_story_sections_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_story_sections
    ADD CONSTRAINT travel_memories_story_sections_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_travel_ledger_flights_locales travel_memories_travel_ledger_flights_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_flights_locales
    ADD CONSTRAINT travel_memories_travel_ledger_flights_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_travel_ledger_flights(id) ON DELETE CASCADE;


--
-- Name: travel_memories_travel_ledger_flights travel_memories_travel_ledger_flights_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_flights
    ADD CONSTRAINT travel_memories_travel_ledger_flights_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memories_travel_ledger_lodgings_locales travel_memories_travel_ledger_lodgings_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_lodgings_locales
    ADD CONSTRAINT travel_memories_travel_ledger_lodgings_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories_travel_ledger_lodgings(id) ON DELETE CASCADE;


--
-- Name: travel_memories_travel_ledger_lodgings travel_memories_travel_ledger_lodgings_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memories_travel_ledger_lodgings
    ADD CONSTRAINT travel_memories_travel_ledger_lodgings_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_memory_days travel_memory_days_daily_hero_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days
    ADD CONSTRAINT travel_memory_days_daily_hero_image_id_media_id_fk FOREIGN KEY (daily_hero_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: travel_memory_days_locales travel_memory_days_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_locales
    ADD CONSTRAINT travel_memory_days_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memory_days(id) ON DELETE CASCADE;


--
-- Name: travel_memory_days travel_memory_days_memory_id_travel_memories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days
    ADD CONSTRAINT travel_memory_days_memory_id_travel_memories_id_fk FOREIGN KEY (memory_id) REFERENCES public.travel_memories(id) ON DELETE SET NULL;


--
-- Name: travel_memory_days_moments_locales travel_memory_days_moments_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_locales
    ADD CONSTRAINT travel_memory_days_moments_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memory_days_moments(id) ON DELETE CASCADE;


--
-- Name: travel_memory_days_moments travel_memory_days_moments_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments
    ADD CONSTRAINT travel_memory_days_moments_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memory_days(id) ON DELETE CASCADE;


--
-- Name: travel_memory_days_moments_placements_locales travel_memory_days_moments_placements_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements_locales
    ADD CONSTRAINT travel_memory_days_moments_placements_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memory_days_moments_placements(id) ON DELETE CASCADE;


--
-- Name: travel_memory_days_moments_placements travel_memory_days_moments_placements_media_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements
    ADD CONSTRAINT travel_memory_days_moments_placements_media_id_media_id_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: travel_memory_days_moments_placements travel_memory_days_moments_placements_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_memory_days_moments_placements
    ADD CONSTRAINT travel_memory_days_moments_placements_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_memory_days_moments(id) ON DELETE CASCADE;


--
-- Name: travel_plans travel_plans_cover_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans
    ADD CONSTRAINT travel_plans_cover_image_id_media_id_fk FOREIGN KEY (cover_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: travel_plans_guest_participants_locales travel_plans_guest_participants_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_guest_participants_locales
    ADD CONSTRAINT travel_plans_guest_participants_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans_guest_participants(id) ON DELETE CASCADE;


--
-- Name: travel_plans_guest_participants travel_plans_guest_participants_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_guest_participants
    ADD CONSTRAINT travel_plans_guest_participants_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: travel_plans_locales travel_plans_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_locales
    ADD CONSTRAINT travel_plans_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: travel_plans_planning_sections_links_locales travel_plans_planning_sections_links_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_links_locales
    ADD CONSTRAINT travel_plans_planning_sections_links_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans_planning_sections_links(id) ON DELETE CASCADE;


--
-- Name: travel_plans_planning_sections_links travel_plans_planning_sections_links_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_links
    ADD CONSTRAINT travel_plans_planning_sections_links_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans_planning_sections(id) ON DELETE CASCADE;


--
-- Name: travel_plans_planning_sections_locales travel_plans_planning_sections_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections_locales
    ADD CONSTRAINT travel_plans_planning_sections_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans_planning_sections(id) ON DELETE CASCADE;


--
-- Name: travel_plans_planning_sections travel_plans_planning_sections_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_planning_sections
    ADD CONSTRAINT travel_plans_planning_sections_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: travel_plans_rels travel_plans_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_rels
    ADD CONSTRAINT travel_plans_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: travel_plans_rels travel_plans_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_rels
    ADD CONSTRAINT travel_plans_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: travel_plans_rels travel_plans_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_plans_rels
    ADD CONSTRAINT travel_plans_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: travel_route_identities_rels travel_route_identities_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities_rels
    ADD CONSTRAINT travel_route_identities_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.travel_route_identities(id) ON DELETE CASCADE;


--
-- Name: travel_route_identities_rels travel_route_identities_rels_travel_memories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities_rels
    ADD CONSTRAINT travel_route_identities_rels_travel_memories_fk FOREIGN KEY (travel_memories_id) REFERENCES public.travel_memories(id) ON DELETE CASCADE;


--
-- Name: travel_route_identities_rels travel_route_identities_rels_travel_plans_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.travel_route_identities_rels
    ADD CONSTRAINT travel_route_identities_rels_travel_plans_fk FOREIGN KEY (travel_plans_id) REFERENCES public.travel_plans(id) ON DELETE CASCADE;


--
-- Name: users users_avatar_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_id_media_id_fk FOREIGN KEY (avatar_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: users_beliefs_locales users_beliefs_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_beliefs_locales
    ADD CONSTRAINT users_beliefs_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_beliefs(id) ON DELETE CASCADE;


--
-- Name: users_beliefs users_beliefs_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_beliefs
    ADD CONSTRAINT users_beliefs_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_card_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_card_image_id_media_id_fk FOREIGN KEY (card_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: users_career_timeline_highlights_locales users_career_timeline_highlights_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_highlights_locales
    ADD CONSTRAINT users_career_timeline_highlights_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_career_timeline_highlights(id) ON DELETE CASCADE;


--
-- Name: users_career_timeline_highlights users_career_timeline_highlights_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_highlights
    ADD CONSTRAINT users_career_timeline_highlights_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_career_timeline(id) ON DELETE CASCADE;


--
-- Name: users_career_timeline_locales users_career_timeline_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline_locales
    ADD CONSTRAINT users_career_timeline_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_career_timeline(id) ON DELETE CASCADE;


--
-- Name: users_career_timeline users_career_timeline_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_career_timeline
    ADD CONSTRAINT users_career_timeline_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_education_locales users_education_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_education_locales
    ADD CONSTRAINT users_education_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_education(id) ON DELETE CASCADE;


--
-- Name: users_education users_education_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_education
    ADD CONSTRAINT users_education_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_hero_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hero_image_id_media_id_fk FOREIGN KEY (hero_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: users_interests_locales users_interests_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_interests_locales
    ADD CONSTRAINT users_interests_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_interests(id) ON DELETE CASCADE;


--
-- Name: users_interests users_interests_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_interests
    ADD CONSTRAINT users_interests_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_locales users_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_locales
    ADD CONSTRAINT users_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_rels users_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_rels
    ADD CONSTRAINT users_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: users_rels users_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_rels
    ADD CONSTRAINT users_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_sessions users_sessions_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_sessions
    ADD CONSTRAINT users_sessions_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_skill_radar_locales users_skill_radar_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_skill_radar_locales
    ADD CONSTRAINT users_skill_radar_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_skill_radar(id) ON DELETE CASCADE;


--
-- Name: users_skill_radar users_skill_radar_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_skill_radar
    ADD CONSTRAINT users_skill_radar_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_typewriter_rotating_words_locales users_typewriter_rotating_words_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_typewriter_rotating_words_locales
    ADD CONSTRAINT users_typewriter_rotating_words_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users_typewriter_rotating_words(id) ON DELETE CASCADE;


--
-- Name: users_typewriter_rotating_words users_typewriter_rotating_words_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_typewriter_rotating_words
    ADD CONSTRAINT users_typewriter_rotating_words_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wrapped_snapshots_blocks_locales wrapped_snapshots_blocks_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_blocks_locales
    ADD CONSTRAINT wrapped_snapshots_blocks_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.wrapped_snapshots_blocks(id) ON DELETE CASCADE;


--
-- Name: wrapped_snapshots_blocks wrapped_snapshots_blocks_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_blocks
    ADD CONSTRAINT wrapped_snapshots_blocks_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.wrapped_snapshots(id) ON DELETE CASCADE;


--
-- Name: wrapped_snapshots wrapped_snapshots_hero_media_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots
    ADD CONSTRAINT wrapped_snapshots_hero_media_id_media_id_fk FOREIGN KEY (hero_media_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: wrapped_snapshots_locales wrapped_snapshots_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_locales
    ADD CONSTRAINT wrapped_snapshots_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.wrapped_snapshots(id) ON DELETE CASCADE;


--
-- Name: wrapped_snapshots_stats_locales wrapped_snapshots_stats_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_stats_locales
    ADD CONSTRAINT wrapped_snapshots_stats_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.wrapped_snapshots_stats(id) ON DELETE CASCADE;


--
-- Name: wrapped_snapshots_stats wrapped_snapshots_stats_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wrapped_snapshots_stats
    ADD CONSTRAINT wrapped_snapshots_stats_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.wrapped_snapshots(id) ON DELETE CASCADE;


--
-- Name: _travel_memories_v; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_external_videos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_external_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_external_videos_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_external_videos_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_guest_participants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_guest_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_guest_participants_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_guest_participants_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_reminders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_reminders_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_reminders_items ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_reminders_items_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_reminders_items_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_reminders_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_reminders_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_story_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_story_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_story_sections_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_story_sections_links ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_story_sections_links_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_story_sections_links_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_story_sections_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_story_sections_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_travel_ledger_flights; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_travel_ledger_flights ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_travel_ledger_flights_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_travel_ledger_flights_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_travel_ledger_lodgings ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memories_v_version_travel_ledger_lodgings_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memories_v_version_travel_ledger_lodgings_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v_version_moments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v_version_moments ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v_version_moments_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v_version_moments_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v_version_moments_placements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v_version_moments_placements ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_memory_days_v_version_moments_placements_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_memory_days_v_version_moments_placements_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_guest_participants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_guest_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_guest_participants_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_guest_participants_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_planning_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_planning_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_planning_sections_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_planning_sections_links ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_planning_sections_links_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_planning_sections_links_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: _travel_plans_v_version_planning_sections_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public._travel_plans_v_version_planning_sections_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: home_config_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.home_config_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: media; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

--
-- Name: media_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: media_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: media_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: media_tags_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_tags_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: payload_locked_documents_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payload_locked_documents_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: payload_migrations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payload_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: timeline_events_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.timeline_events_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_external_videos; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_external_videos ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_external_videos_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_external_videos_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_guest_participants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_guest_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_guest_participants_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_guest_participants_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_reminders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_reminders_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_reminders_items ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_reminders_items_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_reminders_items_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_reminders_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_reminders_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_story_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_story_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_story_sections_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_story_sections_links ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_story_sections_links_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_story_sections_links_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_story_sections_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_story_sections_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_travel_ledger_flights; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_travel_ledger_flights ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_travel_ledger_flights_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_travel_ledger_flights_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_travel_ledger_lodgings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_travel_ledger_lodgings ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memories_travel_ledger_lodgings_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memories_travel_ledger_lodgings_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days_moments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days_moments ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days_moments_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days_moments_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days_moments_placements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days_moments_placements ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_memory_days_moments_placements_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_memory_days_moments_placements_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_guest_participants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_guest_participants ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_guest_participants_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_guest_participants_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_planning_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_planning_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_planning_sections_links; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_planning_sections_links ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_planning_sections_links_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_planning_sections_links_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_planning_sections_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_planning_sections_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_plans_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_plans_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_route_identities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_route_identities ENABLE ROW LEVEL SECURITY;

--
-- Name: travel_route_identities_rels; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.travel_route_identities_rels ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: TABLE _travel_memories_v; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_rels TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_rels_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_external_videos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_external_videos TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_external_videos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_external_videos_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_external_videos_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_external_videos_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_external_videos_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_guest_participants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_guest_participants TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_guest_participants_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_guest_participants_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_guest_participants_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_guest_participants_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_guest_participants_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_reminders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_reminders TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_reminders_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_reminders_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_reminders_items TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_reminders_items_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_reminders_items_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_reminders_items_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_reminders_items_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_items_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_reminders_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_reminders_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_reminders_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_reminders_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_story_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_story_sections TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_story_sections_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_story_sections_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_story_sections_links TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_story_sections_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_story_sections_links_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_story_sections_links_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_story_sections_links_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_links_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_story_sections_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_story_sections_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_story_sections_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_story_sections_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_travel_ledger_flights; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_travel_ledger_flights TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_travel_ledger_flights_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_travel_ledger_flights_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_travel_ledger_flights_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_travel_ledger_flights_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_flights_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_travel_ledger_lodgings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_travel_ledger_lodgings TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_travel_ledger_lodgings_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_id_seq TO service_role;


--
-- Name: TABLE _travel_memories_v_version_travel_ledger_lodgings_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memories_v_version_travel_ledger_lodgings_locales TO service_role;


--
-- Name: SEQUENCE _travel_memories_v_version_travel_ledger_lodgings_locale_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memories_v_version_travel_ledger_lodgings_locale_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v_locales TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v_version_moments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v_version_moments TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_version_moments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v_version_moments_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v_version_moments_locales TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_version_moments_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v_version_moments_placements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v_version_moments_placements TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_version_moments_placements_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_id_seq TO service_role;


--
-- Name: TABLE _travel_memory_days_v_version_moments_placements_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_memory_days_v_version_moments_placements_locales TO service_role;


--
-- Name: SEQUENCE _travel_memory_days_v_version_moments_placements_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_memory_days_v_version_moments_placements_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_locales TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_rels TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_rels_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_guest_participants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_guest_participants TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_guest_participants_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_guest_participants_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_guest_participants_locales TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_guest_participants_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_guest_participants_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_planning_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_planning_sections TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_planning_sections_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_planning_sections_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_planning_sections_links TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_planning_sections_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_planning_sections_links_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_planning_sections_links_locales TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_planning_sections_links_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_links_locales_id_seq TO service_role;


--
-- Name: TABLE _travel_plans_v_version_planning_sections_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public._travel_plans_v_version_planning_sections_locales TO service_role;


--
-- Name: SEQUENCE _travel_plans_v_version_planning_sections_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public._travel_plans_v_version_planning_sections_locales_id_seq TO service_role;


--
-- Name: TABLE bucket_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bucket_items TO anon;
GRANT ALL ON TABLE public.bucket_items TO authenticated;
GRANT ALL ON TABLE public.bucket_items TO service_role;


--
-- Name: SEQUENCE bucket_items_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.bucket_items_id_seq TO anon;
GRANT ALL ON SEQUENCE public.bucket_items_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.bucket_items_id_seq TO service_role;


--
-- Name: TABLE bucket_items_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bucket_items_locales TO anon;
GRANT ALL ON TABLE public.bucket_items_locales TO authenticated;
GRANT ALL ON TABLE public.bucket_items_locales TO service_role;


--
-- Name: SEQUENCE bucket_items_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.bucket_items_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.bucket_items_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.bucket_items_locales_id_seq TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- Name: SEQUENCE categories_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.categories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.categories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.categories_id_seq TO service_role;


--
-- Name: TABLE categories_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories_locales TO anon;
GRANT ALL ON TABLE public.categories_locales TO authenticated;
GRANT ALL ON TABLE public.categories_locales TO service_role;


--
-- Name: SEQUENCE categories_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.categories_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.categories_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.categories_locales_id_seq TO service_role;


--
-- Name: TABLE comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.comments TO anon;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.comments TO service_role;


--
-- Name: SEQUENCE comments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.comments_id_seq TO anon;
GRANT ALL ON SEQUENCE public.comments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.comments_id_seq TO service_role;


--
-- Name: TABLE comments_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.comments_locales TO anon;
GRANT ALL ON TABLE public.comments_locales TO authenticated;
GRANT ALL ON TABLE public.comments_locales TO service_role;


--
-- Name: SEQUENCE comments_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.comments_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.comments_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.comments_locales_id_seq TO service_role;


--
-- Name: TABLE home_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.home_config TO anon;
GRANT ALL ON TABLE public.home_config TO authenticated;
GRANT ALL ON TABLE public.home_config TO service_role;


--
-- Name: SEQUENCE home_config_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.home_config_id_seq TO anon;
GRANT ALL ON SEQUENCE public.home_config_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.home_config_id_seq TO service_role;


--
-- Name: TABLE home_config_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.home_config_locales TO anon;
GRANT ALL ON TABLE public.home_config_locales TO authenticated;
GRANT ALL ON TABLE public.home_config_locales TO service_role;


--
-- Name: SEQUENCE home_config_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.home_config_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.home_config_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.home_config_locales_id_seq TO service_role;


--
-- Name: TABLE home_config_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.home_config_rels TO service_role;


--
-- Name: SEQUENCE home_config_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.home_config_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.home_config_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.home_config_rels_id_seq TO service_role;


--
-- Name: TABLE media; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media TO service_role;


--
-- Name: SEQUENCE media_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_id_seq TO anon;
GRANT ALL ON SEQUENCE public.media_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_id_seq TO service_role;


--
-- Name: TABLE media_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_locales TO service_role;


--
-- Name: SEQUENCE media_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.media_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_locales_id_seq TO service_role;


--
-- Name: TABLE media_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_rels TO service_role;


--
-- Name: SEQUENCE media_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.media_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_rels_id_seq TO service_role;


--
-- Name: TABLE media_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_tags TO service_role;


--
-- Name: TABLE media_tags_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_tags_locales TO service_role;


--
-- Name: SEQUENCE media_tags_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.media_tags_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.media_tags_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.media_tags_locales_id_seq TO service_role;


--
-- Name: TABLE payload_kv; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_kv TO anon;
GRANT ALL ON TABLE public.payload_kv TO authenticated;
GRANT ALL ON TABLE public.payload_kv TO service_role;


--
-- Name: SEQUENCE payload_kv_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_kv_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_kv_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_kv_id_seq TO service_role;


--
-- Name: TABLE payload_locked_documents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_locked_documents TO anon;
GRANT ALL ON TABLE public.payload_locked_documents TO authenticated;
GRANT ALL ON TABLE public.payload_locked_documents TO service_role;


--
-- Name: SEQUENCE payload_locked_documents_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_locked_documents_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_locked_documents_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_locked_documents_id_seq TO service_role;


--
-- Name: TABLE payload_locked_documents_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_locked_documents_rels TO service_role;


--
-- Name: SEQUENCE payload_locked_documents_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_locked_documents_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_locked_documents_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_locked_documents_rels_id_seq TO service_role;


--
-- Name: TABLE payload_migrations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_migrations TO service_role;


--
-- Name: SEQUENCE payload_migrations_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_migrations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_migrations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_migrations_id_seq TO service_role;


--
-- Name: TABLE payload_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_preferences TO anon;
GRANT ALL ON TABLE public.payload_preferences TO authenticated;
GRANT ALL ON TABLE public.payload_preferences TO service_role;


--
-- Name: SEQUENCE payload_preferences_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_preferences_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_preferences_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_preferences_id_seq TO service_role;


--
-- Name: TABLE payload_preferences_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payload_preferences_rels TO anon;
GRANT ALL ON TABLE public.payload_preferences_rels TO authenticated;
GRANT ALL ON TABLE public.payload_preferences_rels TO service_role;


--
-- Name: SEQUENCE payload_preferences_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.payload_preferences_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.payload_preferences_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.payload_preferences_rels_id_seq TO service_role;


--
-- Name: TABLE posts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts TO anon;
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT ALL ON TABLE public.posts TO service_role;


--
-- Name: SEQUENCE posts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.posts_id_seq TO anon;
GRANT ALL ON SEQUENCE public.posts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.posts_id_seq TO service_role;


--
-- Name: TABLE posts_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts_locales TO anon;
GRANT ALL ON TABLE public.posts_locales TO authenticated;
GRANT ALL ON TABLE public.posts_locales TO service_role;


--
-- Name: SEQUENCE posts_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.posts_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.posts_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.posts_locales_id_seq TO service_role;


--
-- Name: TABLE posts_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts_rels TO anon;
GRANT ALL ON TABLE public.posts_rels TO authenticated;
GRANT ALL ON TABLE public.posts_rels TO service_role;


--
-- Name: SEQUENCE posts_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.posts_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.posts_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.posts_rels_id_seq TO service_role;


--
-- Name: TABLE posts_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts_tags TO anon;
GRANT ALL ON TABLE public.posts_tags TO authenticated;
GRANT ALL ON TABLE public.posts_tags TO service_role;


--
-- Name: TABLE posts_tags_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.posts_tags_locales TO anon;
GRANT ALL ON TABLE public.posts_tags_locales TO authenticated;
GRANT ALL ON TABLE public.posts_tags_locales TO service_role;


--
-- Name: SEQUENCE posts_tags_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.posts_tags_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.posts_tags_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.posts_tags_locales_id_seq TO service_role;


--
-- Name: TABLE site_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_config TO anon;
GRANT ALL ON TABLE public.site_config TO authenticated;
GRANT ALL ON TABLE public.site_config TO service_role;


--
-- Name: SEQUENCE site_config_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.site_config_id_seq TO anon;
GRANT ALL ON SEQUENCE public.site_config_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.site_config_id_seq TO service_role;


--
-- Name: TABLE site_config_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_config_locales TO anon;
GRANT ALL ON TABLE public.site_config_locales TO authenticated;
GRANT ALL ON TABLE public.site_config_locales TO service_role;


--
-- Name: SEQUENCE site_config_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.site_config_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.site_config_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.site_config_locales_id_seq TO service_role;


--
-- Name: TABLE site_config_social_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_config_social_links TO anon;
GRANT ALL ON TABLE public.site_config_social_links TO authenticated;
GRANT ALL ON TABLE public.site_config_social_links TO service_role;


--
-- Name: TABLE timeline_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.timeline_events TO anon;
GRANT ALL ON TABLE public.timeline_events TO authenticated;
GRANT ALL ON TABLE public.timeline_events TO service_role;


--
-- Name: SEQUENCE timeline_events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.timeline_events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.timeline_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.timeline_events_id_seq TO service_role;


--
-- Name: TABLE timeline_events_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.timeline_events_locales TO anon;
GRANT ALL ON TABLE public.timeline_events_locales TO authenticated;
GRANT ALL ON TABLE public.timeline_events_locales TO service_role;


--
-- Name: SEQUENCE timeline_events_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.timeline_events_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.timeline_events_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.timeline_events_locales_id_seq TO service_role;


--
-- Name: TABLE timeline_events_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.timeline_events_rels TO service_role;


--
-- Name: SEQUENCE timeline_events_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.timeline_events_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.timeline_events_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.timeline_events_rels_id_seq TO service_role;


--
-- Name: TABLE travel_memories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories TO service_role;


--
-- Name: TABLE travel_memories_external_videos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_external_videos TO service_role;


--
-- Name: TABLE travel_memories_external_videos_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_external_videos_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_external_videos_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_external_videos_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_external_videos_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_external_videos_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_guest_participants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_guest_participants TO service_role;


--
-- Name: TABLE travel_memories_guest_participants_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_guest_participants_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_guest_participants_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_guest_participants_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_guest_participants_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_guest_participants_locales_id_seq TO service_role;


--
-- Name: SEQUENCE travel_memories_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_id_seq TO service_role;


--
-- Name: TABLE travel_memories_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_rels TO service_role;


--
-- Name: SEQUENCE travel_memories_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_rels_id_seq TO service_role;


--
-- Name: TABLE travel_memories_reminders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_reminders TO service_role;


--
-- Name: TABLE travel_memories_reminders_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_reminders_items TO service_role;


--
-- Name: TABLE travel_memories_reminders_items_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_reminders_items_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_reminders_items_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_reminders_items_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_reminders_items_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_reminders_items_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_reminders_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_reminders_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_reminders_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_reminders_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_reminders_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_reminders_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_story_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_story_sections TO service_role;


--
-- Name: TABLE travel_memories_story_sections_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_story_sections_links TO service_role;


--
-- Name: TABLE travel_memories_story_sections_links_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_story_sections_links_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_story_sections_links_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_story_sections_links_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_story_sections_links_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_story_sections_links_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_story_sections_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_story_sections_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_story_sections_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_story_sections_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_story_sections_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_story_sections_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_travel_ledger_flights; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_travel_ledger_flights TO service_role;


--
-- Name: TABLE travel_memories_travel_ledger_flights_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_travel_ledger_flights_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_travel_ledger_flights_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_flights_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memories_travel_ledger_lodgings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_travel_ledger_lodgings TO service_role;


--
-- Name: TABLE travel_memories_travel_ledger_lodgings_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memories_travel_ledger_lodgings_locales TO service_role;


--
-- Name: SEQUENCE travel_memories_travel_ledger_lodgings_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memories_travel_ledger_lodgings_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memory_days; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days TO service_role;


--
-- Name: SEQUENCE travel_memory_days_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memory_days_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memory_days_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memory_days_id_seq TO service_role;


--
-- Name: TABLE travel_memory_days_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days_locales TO service_role;


--
-- Name: SEQUENCE travel_memory_days_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memory_days_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memory_days_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memory_days_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memory_days_moments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days_moments TO service_role;


--
-- Name: TABLE travel_memory_days_moments_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days_moments_locales TO service_role;


--
-- Name: SEQUENCE travel_memory_days_moments_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memory_days_moments_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memory_days_moments_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memory_days_moments_locales_id_seq TO service_role;


--
-- Name: TABLE travel_memory_days_moments_placements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days_moments_placements TO service_role;


--
-- Name: TABLE travel_memory_days_moments_placements_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_memory_days_moments_placements_locales TO service_role;


--
-- Name: SEQUENCE travel_memory_days_moments_placements_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_memory_days_moments_placements_locales_id_seq TO service_role;


--
-- Name: TABLE travel_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans TO service_role;


--
-- Name: TABLE travel_plans_guest_participants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_guest_participants TO service_role;


--
-- Name: TABLE travel_plans_guest_participants_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_guest_participants_locales TO service_role;


--
-- Name: SEQUENCE travel_plans_guest_participants_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_guest_participants_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_guest_participants_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_guest_participants_locales_id_seq TO service_role;


--
-- Name: SEQUENCE travel_plans_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_id_seq TO service_role;


--
-- Name: TABLE travel_plans_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_locales TO service_role;


--
-- Name: SEQUENCE travel_plans_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_locales_id_seq TO service_role;


--
-- Name: TABLE travel_plans_planning_sections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_planning_sections TO service_role;


--
-- Name: TABLE travel_plans_planning_sections_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_planning_sections_links TO service_role;


--
-- Name: TABLE travel_plans_planning_sections_links_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_planning_sections_links_locales TO service_role;


--
-- Name: SEQUENCE travel_plans_planning_sections_links_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_links_locales_id_seq TO service_role;


--
-- Name: TABLE travel_plans_planning_sections_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_planning_sections_locales TO service_role;


--
-- Name: SEQUENCE travel_plans_planning_sections_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_planning_sections_locales_id_seq TO service_role;


--
-- Name: TABLE travel_plans_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_plans_rels TO service_role;


--
-- Name: SEQUENCE travel_plans_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_plans_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_plans_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_plans_rels_id_seq TO service_role;


--
-- Name: TABLE travel_route_identities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_route_identities TO service_role;


--
-- Name: SEQUENCE travel_route_identities_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_route_identities_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_route_identities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_route_identities_id_seq TO service_role;


--
-- Name: TABLE travel_route_identities_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.travel_route_identities_rels TO service_role;


--
-- Name: SEQUENCE travel_route_identities_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.travel_route_identities_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.travel_route_identities_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.travel_route_identities_rels_id_seq TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE users_beliefs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_beliefs TO anon;
GRANT ALL ON TABLE public.users_beliefs TO authenticated;
GRANT ALL ON TABLE public.users_beliefs TO service_role;


--
-- Name: TABLE users_beliefs_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_beliefs_locales TO anon;
GRANT ALL ON TABLE public.users_beliefs_locales TO authenticated;
GRANT ALL ON TABLE public.users_beliefs_locales TO service_role;


--
-- Name: SEQUENCE users_beliefs_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_beliefs_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_beliefs_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_beliefs_locales_id_seq TO service_role;


--
-- Name: TABLE users_career_timeline; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_career_timeline TO anon;
GRANT ALL ON TABLE public.users_career_timeline TO authenticated;
GRANT ALL ON TABLE public.users_career_timeline TO service_role;


--
-- Name: TABLE users_career_timeline_highlights; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_career_timeline_highlights TO anon;
GRANT ALL ON TABLE public.users_career_timeline_highlights TO authenticated;
GRANT ALL ON TABLE public.users_career_timeline_highlights TO service_role;


--
-- Name: TABLE users_career_timeline_highlights_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_career_timeline_highlights_locales TO anon;
GRANT ALL ON TABLE public.users_career_timeline_highlights_locales TO authenticated;
GRANT ALL ON TABLE public.users_career_timeline_highlights_locales TO service_role;


--
-- Name: SEQUENCE users_career_timeline_highlights_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_career_timeline_highlights_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_career_timeline_highlights_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_career_timeline_highlights_locales_id_seq TO service_role;


--
-- Name: TABLE users_career_timeline_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_career_timeline_locales TO anon;
GRANT ALL ON TABLE public.users_career_timeline_locales TO authenticated;
GRANT ALL ON TABLE public.users_career_timeline_locales TO service_role;


--
-- Name: SEQUENCE users_career_timeline_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_career_timeline_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_career_timeline_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_career_timeline_locales_id_seq TO service_role;


--
-- Name: TABLE users_education; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_education TO anon;
GRANT ALL ON TABLE public.users_education TO authenticated;
GRANT ALL ON TABLE public.users_education TO service_role;


--
-- Name: TABLE users_education_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_education_locales TO anon;
GRANT ALL ON TABLE public.users_education_locales TO authenticated;
GRANT ALL ON TABLE public.users_education_locales TO service_role;


--
-- Name: SEQUENCE users_education_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_education_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_education_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_education_locales_id_seq TO service_role;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;


--
-- Name: TABLE users_interests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_interests TO anon;
GRANT ALL ON TABLE public.users_interests TO authenticated;
GRANT ALL ON TABLE public.users_interests TO service_role;


--
-- Name: TABLE users_interests_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_interests_locales TO anon;
GRANT ALL ON TABLE public.users_interests_locales TO authenticated;
GRANT ALL ON TABLE public.users_interests_locales TO service_role;


--
-- Name: SEQUENCE users_interests_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_interests_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_interests_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_interests_locales_id_seq TO service_role;


--
-- Name: TABLE users_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_locales TO anon;
GRANT ALL ON TABLE public.users_locales TO authenticated;
GRANT ALL ON TABLE public.users_locales TO service_role;


--
-- Name: SEQUENCE users_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_locales_id_seq TO service_role;


--
-- Name: TABLE users_rels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_rels TO anon;
GRANT ALL ON TABLE public.users_rels TO authenticated;
GRANT ALL ON TABLE public.users_rels TO service_role;


--
-- Name: SEQUENCE users_rels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_rels_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_rels_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_rels_id_seq TO service_role;


--
-- Name: TABLE users_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_sessions TO anon;
GRANT ALL ON TABLE public.users_sessions TO authenticated;
GRANT ALL ON TABLE public.users_sessions TO service_role;


--
-- Name: TABLE users_skill_radar; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_skill_radar TO anon;
GRANT ALL ON TABLE public.users_skill_radar TO authenticated;
GRANT ALL ON TABLE public.users_skill_radar TO service_role;


--
-- Name: TABLE users_skill_radar_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_skill_radar_locales TO anon;
GRANT ALL ON TABLE public.users_skill_radar_locales TO authenticated;
GRANT ALL ON TABLE public.users_skill_radar_locales TO service_role;


--
-- Name: SEQUENCE users_skill_radar_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_skill_radar_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_skill_radar_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_skill_radar_locales_id_seq TO service_role;


--
-- Name: TABLE users_typewriter_rotating_words; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_typewriter_rotating_words TO anon;
GRANT ALL ON TABLE public.users_typewriter_rotating_words TO authenticated;
GRANT ALL ON TABLE public.users_typewriter_rotating_words TO service_role;


--
-- Name: TABLE users_typewriter_rotating_words_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users_typewriter_rotating_words_locales TO anon;
GRANT ALL ON TABLE public.users_typewriter_rotating_words_locales TO authenticated;
GRANT ALL ON TABLE public.users_typewriter_rotating_words_locales TO service_role;


--
-- Name: SEQUENCE users_typewriter_rotating_words_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_typewriter_rotating_words_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_typewriter_rotating_words_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_typewriter_rotating_words_locales_id_seq TO service_role;


--
-- Name: TABLE wrapped_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots TO service_role;


--
-- Name: TABLE wrapped_snapshots_blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots_blocks TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots_blocks TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots_blocks TO service_role;


--
-- Name: TABLE wrapped_snapshots_blocks_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots_blocks_locales TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots_blocks_locales TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots_blocks_locales TO service_role;


--
-- Name: SEQUENCE wrapped_snapshots_blocks_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_blocks_locales_id_seq TO service_role;


--
-- Name: SEQUENCE wrapped_snapshots_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wrapped_snapshots_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_id_seq TO service_role;


--
-- Name: TABLE wrapped_snapshots_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots_locales TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots_locales TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots_locales TO service_role;


--
-- Name: SEQUENCE wrapped_snapshots_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wrapped_snapshots_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_locales_id_seq TO service_role;


--
-- Name: TABLE wrapped_snapshots_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots_stats TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots_stats TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots_stats TO service_role;


--
-- Name: TABLE wrapped_snapshots_stats_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.wrapped_snapshots_stats_locales TO anon;
GRANT ALL ON TABLE public.wrapped_snapshots_stats_locales TO authenticated;
GRANT ALL ON TABLE public.wrapped_snapshots_stats_locales TO service_role;


--
-- Name: SEQUENCE wrapped_snapshots_stats_locales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wrapped_snapshots_stats_locales_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_stats_locales_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wrapped_snapshots_stats_locales_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict Issue158SchemaOnly20261010

