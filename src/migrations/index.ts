import * as migration_20260619_055511_phase_7_time_capsule from './20260619_055511_phase_7_time_capsule';
import * as migration_20260624_143753_add_user_role from './20260624_143753_add_user_role';

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
];
