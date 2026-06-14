import type { HomeConfig, Post, TravelProject, User } from '@/payload/payload-types'
import type { FamilySession } from './auth'
import { getFamilySession, userReq } from './auth'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6

export type HomePageData = {
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  travelProjects: TravelProject[]
  familySession: FamilySession
}

export async function getMembers(
  limit = DEFAULT_LIMIT,
  session?: FamilySession,
): Promise<User[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: 'createdAt',
    ...userReq(session?.user ?? null),
  })

  return result.docs
}

export async function getFamilyMembers(limit = DEFAULT_LIMIT): Promise<User[]> {
  return getMembers(limit)
}

export async function getFeaturedTravelProjects(
  limit = DEFAULT_LIMIT,
  session?: FamilySession,
): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
    ...userReq(session?.user ?? null),
  })

  return result.docs
}

export async function getTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  return getFeaturedTravelProjects(limit)
}

export async function getLatestPosts(
  limit = DEFAULT_LIMIT,
  session?: FamilySession,
): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-publishedDate',
    ...userReq(session?.user ?? null),
  })

  return result.docs
}

export async function getPosts(limit = DEFAULT_LIMIT): Promise<Post[]> {
  return getLatestPosts(limit)
}

export async function getHomeConfig(): Promise<HomeConfig> {
  const payload = await getPayloadClient()

  return payload.findGlobal({
    slug: 'home-config',
    depth: 1,
  })
}

export async function getHomeData(): Promise<HomePageData> {
  const familySession = await getFamilySession()
  const [members, travelProjects, posts, homeConfig] = await Promise.all([
    getMembers(DEFAULT_LIMIT, familySession),
    getFeaturedTravelProjects(DEFAULT_LIMIT, familySession),
    getLatestPosts(DEFAULT_LIMIT, familySession),
    getHomeConfig(),
  ])

  return {
    familySession,
    homeConfig,
    members,
    posts,
    travelProjects,
  }
}

export async function getHomePageData() {
  return getHomeData()
}
