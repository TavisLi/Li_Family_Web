import * as migration_20260619_055511_phase_7_time_capsule from './20260619_055511_phase_7_time_capsule';
import * as migration_20260624_143753_add_user_role from './20260624_143753_add_user_role';
import * as migration_20260625_234308_travel_source_sections from './20260625_234308_travel_source_sections';
import * as migration_20260628_130305_member_profile_config from './20260628_130305_member_profile_config';

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
    name: '20260628_130305_member_profile_config'
  },
];
