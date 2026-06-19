import type { HomeConfig, Post, TravelProject, User } from '@/payload/payload-types'
import type { BucketItem } from '@/payload/payload-types'
import type { FamilySession } from './auth'
import { getFamilySession, userReq } from './auth'
import { getBucketQuickView } from './bucket-list'
import { getPayloadClient } from './payload'
import { getTimelineHomeWidget } from './timeline'
import { getWrappedHomeCta, type WrappedHomeCta } from './wrapped'
import type { TimelineEvent } from '@/payload/payload-types'

const DEFAULT_LIMIT = 6

export type HomePageData = {
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  travelProjects: TravelProject[]
  familySession: FamilySession
  timelineEvent: TimelineEvent | null
  bucketItems: BucketItem[]
  wrappedCta: WrappedHomeCta
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
  const [
    members,
    travelProjects,
    posts,
    homeConfig,
    timelineEvent,
    bucketItems,
    wrappedCta,
  ] = await Promise.all([
    getMembers(DEFAULT_LIMIT, familySession),
    getFeaturedTravelProjects(DEFAULT_LIMIT, familySession),
    getLatestPosts(DEFAULT_LIMIT, familySession),
    getHomeConfig(),
    getTimelineHomeWidget(familySession),
    getBucketQuickView(familySession),
    getWrappedHomeCta(familySession),
  ])

  return {
    familySession,
    homeConfig,
    members,
    posts,
    travelProjects,
    timelineEvent,
    bucketItems,
    wrappedCta,
  }
}

export async function getHomePageData() {
  return getHomeData()
}
