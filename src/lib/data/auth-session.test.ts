import assert from 'node:assert/strict'

import type { User } from '@/payload/payload-types'
import { toFamilySession } from './auth-session'

const familyUser = {
  id: 7,
  displayName: 'Tavis Li',
  email: 'tavis@example.com',
  familyRole: 'father',
} as User

assert.deepEqual(toFamilySession(null), {
  isFamilyMode: false,
  user: null,
  displayName: null,
  familyRole: null,
})

assert.deepEqual(toFamilySession(familyUser), {
  isFamilyMode: true,
  user: familyUser,
  displayName: 'Tavis Li',
  familyRole: 'father',
})
