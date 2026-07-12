type ScopeableSeedContent = {
  members: unknown[]
  travels: unknown[]
  media: { ownerType: string }[]
  blogCategories: unknown[]
  blogPosts: unknown[]
}

export function travelOnlySeedContent<T extends ScopeableSeedContent>(seedContent: T): T {
  return {
    ...seedContent,
    members: [],
    media: seedContent.media.filter((item) => item.ownerType === 'travel'),
    blogCategories: [],
    blogPosts: [],
  }
}
