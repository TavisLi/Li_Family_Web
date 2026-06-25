import * as migration_20260619_055511_phase_7_time_capsule from './20260619_055511_phase_7_time_capsule';
import * as migration_20260625_234308_travel_source_sections from './20260625_234308_travel_source_sections';

export const migrations = [
  {
    up: migration_20260619_055511_phase_7_time_capsule.up,
    down: migration_20260619_055511_phase_7_time_capsule.down,
    name: '20260619_055511_phase_7_time_capsule',
  },
  {
    up: migration_20260625_234308_travel_source_sections.up,
    down: migration_20260625_234308_travel_source_sections.down,
    name: '20260625_234308_travel_source_sections'
  },
];
