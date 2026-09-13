import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include the public CA for the approved Preview connection's sslrootcert path.
  outputFileTracingIncludes: {
    '/*': ['./docs/phase-artifacts/issue-119/supabase-ca.crt'],
  },
}

export default withPayload(nextConfig)
