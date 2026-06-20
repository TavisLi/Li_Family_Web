import * as migration_20260619_055511_phase_7_time_capsule from './20260619_055511_phase_7_time_capsule';

export const migrations = [
  {
    up: migration_20260619_055511_phase_7_time_capsule.up,
    down: migration_20260619_055511_phase_7_time_capsule.down,
    name: '20260619_055511_phase_7_time_capsule'
  },
];
