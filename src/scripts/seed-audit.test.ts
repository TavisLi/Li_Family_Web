import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSourceCoverageAudit } from './seed-audit'
import { buildSeedContent } from './seed-content'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../..')
const audit = buildSourceCoverageAudit(await buildSeedContent(projectRoot))

assert.equal(audit.catalog.length, 5)
assert.deepEqual(audit.integrity.missingTravelRecords, [])
assert.deepEqual(audit.integrity.missingCoverMedia, [])
assert.deepEqual(audit.integrity.missingStructuredContent, [])
assert.equal(audit.mutationPlan.deletes, 0)
assert.equal(audit.mutationPlan.status, 'source-only')
assert.ok(audit.avatarSourcePaths.includes('content-source/assets/members/tavis/tavis-avatar.jpeg'))
assert.ok(audit.avatarSourcePaths.includes('content-source/assets/members/lynn/lynn-avatar.jpeg'))
