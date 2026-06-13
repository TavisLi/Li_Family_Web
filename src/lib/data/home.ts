import type { HomeConfig, Post, TravelProject, User } from '@/payload/payload-types'
import { getPayloadClient } from './payload'

const DEFAULT_LIMIT = 6

export async function getMembers(limit = DEFAULT_LIMIT): Promise<User[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: 'createdAt',
  })

  return result.docs
}

export async function getFamilyMembers(limit = DEFAULT_LIMIT): Promise<User[]> {
  return getMembers(limit)
}

export async function getFeaturedTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'travel-projects',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-startDate',
  })

  return result.docs
}

export async function getTravelProjects(limit = DEFAULT_LIMIT): Promise<TravelProject[]> {
  return getFeaturedTravelProjects(limit)
}

export async function getLatestPosts(limit = DEFAULT_LIMIT): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    sort: '-publishedDate',
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

export async function getHomeData() {
  const [members, travelProjects, posts, homeConfig] = await Promise.all([
    getMembers(),
    getFeaturedTravelProjects(),
    getLatestPosts(),
    getHomeConfig(),
  ])

  return {
    homeConfig,
    members,
    posts,
    travelProjects,
  }
}

export async function getHomePageData() {
  return getHomeData()
}
