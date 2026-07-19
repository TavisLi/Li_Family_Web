import assert from 'node:assert/strict'

import type { Comment, User } from '@/payload/payload-types'
import { buildTravelInteractionThreads } from './travel-interactions'

const familyUser = {
  id: 7,
  displayName: 'Tavis Li',
  email: 'tavis@example.com',
} as User

const comments: Comment[] = [
  comment(1, 'travel:phuket:source:overview', 'up'),
  comment(2, 'travel:phuket:source:overview', 'down', '需要再確認飯店。'),
  comment(3, 'travel:phuket:source:flights', 'none', '航班資訊已更新。'),
  comment(4, 'travel:other:source:overview', 'up', '不應混入。'),
]

const threads = buildTravelInteractionThreads(
  ['travel:phuket:source:overview', 'travel:phuket:source:flights'],
  comments,
)

assert.deepEqual(threads['travel:phuket:source:overview'], {
  associatedId: 'travel:phuket:source:overview',
  locked: false,
  comments: [
    {
      id: 2,
      associatedId: 'travel:phuket:source:overview',
      authorName: 'Tavis Li',
      commentText: '需要再確認飯店。',
      reaction: 'down',
      createdAt: '2026-07-18T00:00:02.000Z',
    },
  ],
  reactions: {
    up: 1,
    down: 1,
  },
})
assert.deepEqual(threads['travel:phuket:source:flights']?.comments, [
  {
    id: 3,
    associatedId: 'travel:phuket:source:flights',
    authorName: 'Tavis Li',
    commentText: '航班資訊已更新。',
    reaction: null,
    createdAt: '2026-07-18T00:00:03.000Z',
  },
])

function comment(
  id: number,
  associatedId: string,
  reaction: Comment['reaction'],
  commentText?: string,
): Comment {
  return {
    id,
    user: familyUser,
    associatedType: 'travel',
    associatedId,
    commentText,
    reaction,
    createdAt: `2026-07-18T00:00:0${id}.000Z`,
    updatedAt: `2026-07-18T00:00:0${id}.000Z`,
  }
}
