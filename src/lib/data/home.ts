import type {
  BucketItem,
  HomeConfig,
  Post,
  TimelineEvent,
  User,
} from '@/payload/payload-types'
import type { TravelRuntimeRecord } from '@/lib/travel-runtime'
import type { FamilySession } from './auth'
import { getFamilySession, userReq } from './auth'
import { getBucketQuickView } from './bucket-list'
import { getPayloadClient } from './payload'
import { getTimelineHomeWidget } from './timeline'
import {
  getFeaturedTravelProjects as getFeaturedTravelRecords,
  getTravelRecordByRelationship,
} from './travel'
import { getWrappedHomeCta, type WrappedHomeCta } from './wrapped'

const DEFAULT_LIMIT = 6

export type HomePageData = {
  homeConfig: HomeConfig
  members: User[]
  posts: Post[]
  featuredTravel: TravelRuntimeRecord | null
  travelProjects: TravelRuntimeRecord[]
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
): Promise<TravelRuntimeRecord[]> {
  return getFeaturedTravelRecords(limit, session?.user ?? null)
}

export async function getTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelRuntimeRecord[]> {
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
  const homeConfig = await getHomeConfig()
  const members = await getMembers(DEFAULT_LIMIT, familySession)
  const travelProjects = await getFeaturedTravelProjects(DEFAULT_LIMIT, familySession)
  const posts = await getLatestPosts(DEFAULT_LIMIT, familySession)
  const timelineEvent = await getTimelineHomeWidget(familySession)
  const bucketItems = await getBucketQuickView(familySession)
  const wrappedCta = await getWrappedHomeCta(familySession)
  const featuredTravel =
    (await getTravelRecordByRelationship(
      homeConfig.featuredTravelRecord,
      familySession.user,
    )) ??
    travelProjects[0] ??
    null

  return {
    familySession,
    homeConfig,
    members,
    posts,
    travelProjects,
    timelineEvent,
    bucketItems,
    featuredTravel,
    wrappedCta,
  }
}

export async function getHomePageData() {
  return getHomeData()
}
