import assert from 'node:assert/strict'

import { summarizeDryRunActions } from './seed-dry-run'

const summary = summarizeDryRunActions([
  { collection: 'users', key: 'tavis', action: 'update', existingId: 7 },
  { collection: 'travel-projects', key: '202602-thailand-phuket', action: 'create' },
  { collection: 'media', key: 'content-source/assets/members/tavis/tavis-avatar.jpeg', action: 'update', existingId: 42 },
])

assert.deepEqual(summary, {
  creates: 1,
  updates: 2,
  skips: 0,
  deletes: 0,
})
