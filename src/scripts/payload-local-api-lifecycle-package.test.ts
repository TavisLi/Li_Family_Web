import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [packageJson, workspace, patch, smoke] = await Promise.all([
  readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../../pnpm-workspace.yaml', import.meta.url), 'utf8'),
  readFile(
    new URL('../../patches/@payloadcms__db-postgres@3.90.1.patch', import.meta.url),
    'utf8',
  ),
  readFile(new URL('./payload-local-api-lifecycle-smoke.ts', import.meta.url), 'utf8'),
])

assert.match(packageJson, /"test:payload-lifecycle":/)
assert.match(
  workspace,
  /'@payloadcms\/db-postgres@3\.90\.1': patches\/@payloadcms__db-postgres@3\.90\.1\.patch/,
)
assert.match(patch, /^\+\s*result\.release\(\);$/m)
assert.match(smoke, /try \{[\s\S]*await payload\.destroy\(\)[\s\S]*finally \{[\s\S]*await pool\.end\(\)/)
assert.doesNotMatch(smoke, /process\.exit/)
assert.doesNotMatch(smoke, /setTimeout|setInterval/)

console.log('payload local API lifecycle package test passed')
