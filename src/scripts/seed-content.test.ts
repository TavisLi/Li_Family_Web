import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildSeedContent,
  parseBloggerSeedSource,
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
  assert.equal((chongqing.cabinAssignments ?? []).length, 3)
  assert.ok((chongqing.dailyItinerary ?? []).length >= 8)

  const eastAustralia = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202308东澳全览9日.md'),
  )

  assert.equal(eastAustralia.slug, '202308-east-australia')
  assert.equal((eastAustralia.flights ?? []).length, 4)

  const phuket2026 = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202602泰国普吉岛8日.md'),
  )

  assert.equal(phuket2026.slug, '202602-thailand-phuket')
  assert.equal(phuket2026.status, 'completed')

  const phuket2027 = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202702泰国普吉岛7日.md'),
  )

  assert.equal(phuket2027.slug, '202702-thailand-phuket')
  assert.equal(phuket2027.status, 'planning')

  const seedContent = await buildSeedContent(projectRoot)

  assert.ok(seedContent.media.length >= 10)
  assert.ok(seedContent.media.some((item) => item.ownerType === 'member' && item.ownerSlug === 'tavis'))
  assert.ok(
    seedContent.media.some(
      (item) => item.ownerType === 'travel' && item.ownerSlug === '202308-east-australia',
    ),
  )
  assert.ok(
    seedContent.media.some(
      (item) =>
        item.ownerType === 'travel' &&
        item.ownerSlug === '202607-chongqing-yangtze-river' &&
        item.sourcePath.endsWith(
          'content-source/assets/travels/202607-chongqing-yangtze-river/cover/cover-001.jpg',
        ) &&
        item.usage === 'cover',
    ),
  )
  assert.ok(seedContent.media.every((item) => !item.sourcePath.includes('/.')))

  const phuketDay2FlightPhoto = seedContent.media.find(
    (item) =>
      item.sourcePath.endsWith(
        'content-source/assets/travels/202602-thailand-phuket/gallery/gallery-022.jpeg',
      ),
  )

  assert.ok(phuketDay2FlightPhoto)
  assert.equal(phuketDay2FlightPhoto.ownerSlug, '202602-thailand-phuket')
  assert.equal(phuketDay2FlightPhoto.usage, 'itinerary')
  assert.equal(phuketDay2FlightPhoto.day, 2)
  assert.equal(phuketDay2FlightPhoto.sectionId, 'mai-khao-flight-viewing')
  assert.equal(phuketDay2FlightPhoto.time, '14:30')
  assert.equal(phuketDay2FlightPhoto.location, 'Mai Khao Beach Flight Viewing Point')
  assert.equal(phuketDay2FlightPhoto.caption, '餐後回到邁考海灘，看飛機低空掠過海灘上方。')
  assert.ok(phuketDay2FlightPhoto.tags.some((item) => item.tag === 'day-02'))
  assert.ok(phuketDay2FlightPhoto.tags.some((item) => item.tag === 'section:mai-khao-flight-viewing'))

  const bloggerSample = await parseBloggerSeedSource(
    projectRoot,
    {
      limit: 8,
    },
  )

  assert.ok(bloggerSample.posts.length >= 2)
  assert.ok(bloggerSample.posts.length <= 8)
  assert.ok(bloggerSample.posts.every((post) => post.source === 'blogger-takeout'))
  assert.ok(bloggerSample.posts.every((post) => post.authorSlug === 'tavis'))
  assert.ok(bloggerSample.posts.some((post) => post.tags.length >= 2))
  assert.ok(bloggerSample.categories.length >= 1)
  assert.ok(
    bloggerSample.posts.every((post) => post.content.root.children[0]?.type === 'paragraph'),
  )

  assert.ok(seedContent.blogCategories.some((category) => category.slug === 'family-note'))
  assert.ok(seedContent.blogPosts.some((post) => !post.isPrivate))
  assert.ok(seedContent.blogPosts.some((post) => post.isPrivate))
  assert.ok(seedContent.blogPosts.some((post) => !post.coverImageSourceUrl))
  assert.ok(seedContent.blogPosts.some((post) => post.tags.length >= 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
