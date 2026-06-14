import type { User } from '@/payload/payload-types'

export type FamilySession =
  | {
      isFamilyMode: true
      user: User
      displayName: string
      familyRole: User['familyRole']
    }
  | {
      isFamilyMode: false
      user: null
      displayName: null
      familyRole: null
    }

export function toFamilySession(user: User | null): FamilySession {
  if (!user) {
    return {
      isFamilyMode: false,
      user: null,
      displayName: null,
      familyRole: null,
    }
  }

  return {
    isFamilyMode: true,
    user,
    displayName: user.displayName || user.email || '家人',
    familyRole: user.familyRole,
  }
}
