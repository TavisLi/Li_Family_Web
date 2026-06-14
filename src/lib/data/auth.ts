import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/payload/payload-types'
import { toFamilySession, type FamilySession } from './auth-session'
import { getPayloadClient } from './payload'

export type { FamilySession } from './auth-session'

export type PayloadUserRequest = {
  user: User
}

export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const result = await payload.auth({
    headers: requestHeaders,
  })

  return result.user ? (result.user as User) : null
}

export async function getFamilySession(): Promise<FamilySession> {
  return toFamilySession(await getCurrentUser())
}

export async function requireFamilyUser(redirectTo = '/family/login'): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect(redirectTo)
  }

  return user
}

export function userReq(user: User | null): { req: PayloadUserRequest } | Record<string, never> {
  return user ? { req: { user } } : {}
}
