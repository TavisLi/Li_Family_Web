# Issue #119 Production read-only evidence

Historical machine-readable record carried forward from PR #127. JSON payload is preserved verbatim; this file does not claim a new Production verification.

```json
{
  "verifiedAt": "2026-09-14",
  "result": "PASS",
  "scope": "Production read-only public GET and platform metadata/logs",
  "mergeCommit": "e20bf82f489634112a2c569b5ce5e0ba06616b81",
  "deployment": {
    "id": "dpl_Ayzj9At4fjerKwBNNEdzAjhxcVBG",
    "url": "https://li-family-ezkjie0x6-tavis-li-s-projects.vercel.app",
    "canonicalAlias": "https://li-family-web.vercel.app",
    "target": "production",
    "state": "READY",
    "region": "iad1",
    "source": "git",
    "commit": "e20bf82f489634112a2c569b5ce5e0ba06616b81"
  },
  "runtime": {
    "projectSelector": "24.x",
    "buildSelector": "24.x",
    "deployedLambdaRuntime": "nodejs24.x",
    "nodeLambdaOutputs": 4,
    "exactPatch": "Vercel-managed and not exposed after temporary Preview probe removal"
  },
  "build": {
    "cache": "skipped because Node changed from 20.x to 24.x",
    "lockfile": "up to date; resolution skipped",
    "packages": 1019,
    "pnpm": "10.28.0",
    "nativeInstall": "sharp, esbuild and unrs-resolver PASS",
    "nextBuild": "PASS",
    "lintAndTypes": "PASS",
    "serverlessFunctions": "created successfully"
  },
  "publicRequests": {
    "count": 12,
    "allStatus": 200,
    "errorDigestCount": 0,
    "paths": [
      "/",
      "/blog",
      "/blog/200902keynote",
      "/travel",
      "/travel/202308-east-australia",
      "/travel/202308-east-australia/day/day-01",
      "/travel/202308-east-australia/photos",
      "/timeline",
      "/member/tavis",
      "/?_rsc=issue119-production",
      "/api/og-default",
      "/_next/image?url=%2Fbrand%2Fweb-li-family-crest-light.png&w=64&q=75"
    ],
    "payloadReads": "Populated public home, blog, travel plan/memory/day/photos, timeline and member content PASS",
    "rsc": "text/x-component PASS",
    "edgeOg": "image/png PASS",
    "nextImage": "image/png PASS"
  },
  "r2": {
    "publicObjectsChecked": 2,
    "formats": ["jpeg", "webp"],
    "dimensions": "1600x1200",
    "tlsEncryptedAndAuthorized": true,
    "sharpDecodeAndResize": "PASS",
    "uploadAttempted": false
  },
  "runtimeLogs": {
    "deploymentScopedWindow": "2026-09-14T09:13:52Z to 2026-09-14T11:13:52Z",
    "errorOrFatal": 0,
    "warning": 0,
    "observedDynamicStatus": "11 x 200; static/edge responses are not all represented in serverless logs"
  },
  "forbiddenActionsPerformed": {
    "login": false,
    "admin": false,
    "upload": false,
    "migration": false,
    "productionDataMutation": false
  },
  "knownAcceptedLimits": [
    "Cloud login/Admin/upload remains unverified by prior Human decision",
    "Exact Production Node 24 patch is not observable without the removed temporary probe; deployed artifacts prove nodejs24.x",
    "Two documented pre-existing baseline debts remain unchanged"
  ],
  "localDiagnosticPointers": [
    "/tmp/issue119-production-inspect.json",
    "/tmp/issue119-production-events.json",
    "/tmp/issue119/production-http/results-latest.json",
    "/tmp/issue119/r2-production-results.json"
  ]
}
```
