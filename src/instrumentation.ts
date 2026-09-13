export function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.VERCEL_ENV === 'preview' &&
    process.env.ISSUE119_RUNTIME_PROBE === 'true'
  ) {
    console.info('[issue119-runtime]', JSON.stringify({
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      openssl: process.versions.openssl,
    }))
  }
}
