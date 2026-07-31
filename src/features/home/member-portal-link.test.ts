import assert from 'node:assert/strict'

import type { User } from '@/payload/payload-types'
import { memberPortalLink } from './member-portal-link'

const internalMember = {
  slug: 'tavis',
} as User

assert.deepEqual(memberPortalLink(internalMember), {
  href: '/member/tavis',
  external: false,
  rel: undefined,
  target: undefined,
})

const externalMember = {
  slug: 'nini',
  externalProfileUrl: 'https://cancan-lierixia-novel.mjdhdsbcn8.chatgpt.site/zh-Hans',
} as User

assert.deepEqual(memberPortalLink(externalMember), {
  href: 'https://cancan-lierixia-novel.mjdhdsbcn8.chatgpt.site/zh-Hans',
  external: true,
  rel: 'noopener noreferrer',
  target: '_blank',
})
