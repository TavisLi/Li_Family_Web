import type { User } from '@/payload/payload-types'

export function memberPortalLink(member: User): {
  href: string
  external: boolean
  rel: 'noopener noreferrer' | undefined
  target: '_blank' | undefined
} {
  if (member.externalProfileUrl) {
    return {
      href: member.externalProfileUrl,
      external: true,
      rel: 'noopener noreferrer',
      target: '_blank',
    }
  }

  return {
    href: `/member/${member.slug}`,
    external: false,
    rel: undefined,
    target: undefined,
  }
}
