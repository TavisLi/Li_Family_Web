import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildSeedContent,
  parseFamilyMembersConfig,
  parseResumeMarkdown,
  parseTravelMarkdown,
} from './seed-content'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../..')

async function main() {
  const familyMembers = await parseFamilyMembersConfig(
    path.join(projectRoot, 'docs/family-members.md'),
  )

  assert.equal(familyMembers.length, 6)
  assert.deepEqual(
    familyMembers.map((member) => member.slug),
    ['tavis', 'lynn', 'nini', 'leo', 'sophie', 'grandma'],
  )
  assert.equal(familyMembers[0]?.typewriter?.rotatingWords.length, 3)

  const tavisResume = await parseResumeMarkdown(
    path.join(projectRoot, 'content-source/profiles/tavis_resume.md'),
    'tavis',
  )

  assert.equal(tavisResume.slug, 'tavis')
  assert.ok((tavisResume.bio ?? '').includes('28年半導體'))
  assert.ok((tavisResume.careerTimeline ?? []).length >= 7)
  assert.ok((tavisResume.skillRadar ?? []).length >= 4)

  const chongqing = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202607重庆长江三峡8日.md'),
  )

  assert.equal(chongqing.slug, '202607-chongqing-yangtze-river')
  assert.equal(chongqing.status, 'planning')
  assert.equal((chongqing.flights ?? []).length, 2)
  assert.ok((chongqing.dailyItinerary ?? []).length >= 8)

  const seedContent = await buildSeedContent(projectRoot)

  assert.ok(seedContent.media.length >= 10)
  assert.ok(seedContent.media.some((item) => item.ownerType === 'member' && item.ownerSlug === 'tavis'))
  assert.ok(
    seedContent.media.some(
      (item) => item.ownerType === 'travel' && item.ownerSlug === '202308-east-australia',
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
