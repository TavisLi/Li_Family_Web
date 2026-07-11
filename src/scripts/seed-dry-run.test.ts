import assert from 'node:assert/strict'

import { summarizeDryRunActions } from './seed-dry-run'

const summary = summarizeDryRunActions([
  { collection: 'users', key: 'tavis', action: 'update', existingId: 7 },
  { collection: 'travel-projects', key: '202602-thailand-phuket', action: 'create' },
  { collection: 'media', key: 'content-source/assets/members/tavis/tavis-avatar.jpeg', action: 'update', existingId: 42 },
  { collection: 'media', key: 'content-source/assets/members/tavis/tavis-hero.jpeg', action: 'skip', existingId: 43 },
  { collection: 'travel-projects', key: 'legacy-travel', action: 'preserve', existingId: 44 },
  { collection: 'travel-projects', key: 'conflicted-travel', action: 'conflict', existingId: 45 },
])

assert.deepEqual(summary, {
  creates: 1,
  updates: 2,
  skips: 1,
  preserves: 1,
  conflicts: 1,
  deletes: 0,
})
