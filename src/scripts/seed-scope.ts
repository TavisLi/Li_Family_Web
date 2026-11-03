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

// Keep legacy Plan seeding explicit; Memory uses the dedicated V2 entrypoint.
export function assertLegacySeedScope(args: string[]): void {
  if (args.includes('--plans-only')) {
    if (!args.includes('--travel-only') || args.some(arg => ['--blog-only', '--phase-9', '--phase-9-read-back', '--memory-v2'].includes(arg)) || args.some(arg => arg.startsWith('--refresh-'))) throw new Error('--plans-only requires --travel-only without another seed mode')
    return
  }
  throw new Error('MEMORY_V1_RETIRED: use --memory-v2 <file> for Memory or --travel-only --plans-only for Plan')
}

export function planOnlySeedContent<T extends Omit<ScopeableSeedContent, 'travels' | 'media'> & {
  travels: { slug: string; status: string }[]
  media: { ownerType: string; ownerSlug: string }[]
}>(seedContent: T): T {
  const scoped = travelOnlySeedContent(seedContent)
  const travels = scoped.travels.filter(travel => travel.status === 'planning')
  const slugs = new Set(travels.map(travel => travel.slug))
  return { ...scoped, travels, media: scoped.media.filter(media => slugs.has(media.ownerSlug)) }
}
