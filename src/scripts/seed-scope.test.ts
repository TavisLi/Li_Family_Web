import assert from 'node:assert/strict'

import { travelOnlySeedContent } from './seed-scope'

const scoped = travelOnlySeedContent({
  members: [{ slug: 'tavis' }],
  travels: [{ slug: 'planning-trip' }],
  media: [
    { ownerType: 'member', ownerSlug: 'tavis', sourcePath: 'member.jpeg' },
    { ownerType: 'travel', ownerSlug: 'planning-trip', sourcePath: 'travel.jpeg' },
  ],
  blogCategories: [{ slug: 'family' }],
  blogPosts: [{ slug: 'post' }],
})

assert.deepEqual(scoped.members, [])
assert.deepEqual(scoped.media.map((item) => item.sourcePath), ['travel.jpeg'])
assert.equal(scoped.travels.length, 1)
assert.deepEqual(scoped.blogCategories, [])
assert.deepEqual(scoped.blogPosts, [])
