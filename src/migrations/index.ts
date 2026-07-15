import * as migration_20260619_055511_phase_7_time_capsule from './20260619_055511_phase_7_time_capsule';
import * as migration_20260624_143753_add_user_role from './20260624_143753_add_user_role';
import * as migration_20260625_234308_travel_source_sections from './20260625_234308_travel_source_sections';
import * as migration_20260628_130305_member_profile_config from './20260628_130305_member_profile_config';
import * as migration_20260629_144118_add_travel_source_section_media from './20260629_144118_add_travel_source_section_media';
import * as migration_20260630_150145_travel_source_section_interactions from './20260630_150145_travel_source_section_interactions';
import * as migration_20260701_123939_add_travel_source_section_display_title_fields from './20260701_123939_add_travel_source_section_display_title_fields';
import * as migration_20260711_141901 from './20260711_141901';
import * as migration_20260715_073322_phase_17_add_travel_collections from './20260715_073322_phase_17_add_travel_collections';

export const migrations = [
  {
    up: migration_20260619_055511_phase_7_time_capsule.up,
    down: migration_20260619_055511_phase_7_time_capsule.down,
    name: '20260619_055511_phase_7_time_capsule',
  },
  {
    up: migration_20260624_143753_add_user_role.up,
    down: migration_20260624_143753_add_user_role.down,
    name: '20260624_143753_add_user_role',
  },
  {
    up: migration_20260625_234308_travel_source_sections.up,
    down: migration_20260625_234308_travel_source_sections.down,
    name: '20260625_234308_travel_source_sections',
  },
  {
    up: migration_20260628_130305_member_profile_config.up,
    down: migration_20260628_130305_member_profile_config.down,
    name: '20260628_130305_member_profile_config',
  },
  {
    up: migration_20260629_144118_add_travel_source_section_media.up,
    down: migration_20260629_144118_add_travel_source_section_media.down,
    name: '20260629_144118_add_travel_source_section_media',
  },
  {
    up: migration_20260630_150145_travel_source_section_interactions.up,
    down: migration_20260630_150145_travel_source_section_interactions.down,
    name: '20260630_150145_travel_source_section_interactions',
  },
  {
    up: migration_20260701_123939_add_travel_source_section_display_title_fields.up,
    down: migration_20260701_123939_add_travel_source_section_display_title_fields.down,
    name: '20260701_123939_add_travel_source_section_display_title_fields',
  },
  {
    up: migration_20260711_141901.up,
    down: migration_20260711_141901.down,
    name: '20260711_141901',
  },
  {
    up: migration_20260715_073322_phase_17_add_travel_collections.up,
    down: migration_20260715_073322_phase_17_add_travel_collections.down,
    name: '20260715_073322_phase_17_add_travel_collections',
  },
];
