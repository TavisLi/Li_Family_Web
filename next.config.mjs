import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Keep authenticated document URLs out of the shared image optimizer cache.
    localPatterns: [
      { pathname: '/brand/**' },
      { pathname: '/atlas-review/**' },
      { pathname: '/prototypes/**' },
      { pathname: '/_next/static/media/**' },
    ],
  },
}

export default withPayload(nextConfig)
