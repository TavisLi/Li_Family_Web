import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { buildTravelConflictRegister, writeTravelConflictRegister } from './travel-conflict-register'

const entries = buildTravelConflictRegister([
  {
    collection: 'travel-plans',
    key: '202702-thailand-phuket',
    action: 'conflict',
    conflicts: [
      {
        field: 'sourceSections[item-1c51hpg].links',
        category: 'faithful-source-projection',
        base: [{ label: 'https://example.com', url: 'https://example.com' }],
        source: [{ label: 'https://example.com', url: 'https://example.com' }],
        current: [{ label: '度假村官網', url: 'https://example.com' }],
      },
    ],
  },
])

assert.equal(entries.length, 1)
assert.equal(entries[0]?.decision, 'payload-wins')
assert.match(entries[0]?.sourceSummary ?? '', /example\.com/)
assert.match(entries[0]?.currentSummary ?? '', /度假村官網/)

const artifactRoot = await mkdtemp(path.join(tmpdir(), 'phase-17-register-'))
const artifactPath = await writeTravelConflictRegister({ artifactRoot, entries })
const artifact = await readFile(artifactPath, 'utf8')

assert.match(artifactPath, /travel-conflict-register\.generated\.md$/)
assert.match(artifact, /202702-thailand-phuket/)
assert.match(artifact, /payload-wins/)
assert.match(artifact, /does not authorize a write/)
