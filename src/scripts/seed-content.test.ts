import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildSeedContent,
  parseBloggerSeedSource,
  parseFamilyMembersConfig,
  parseResumeMarkdown,
  parseTravelCatalog,
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
  assert.deepEqual(familyMembers[0]?.displayNameLocales, {
    'zh-TW': '李天行',
    en: 'Tavis Li',
  })
  assert.deepEqual(
    familyMembers.find((member) => member.slug === 'nini')?.interests?.map((interest) => interest.name),
    ['寫小說', '旅遊', '拍照'],
  )
  assert.deepEqual(
    familyMembers.find((member) => member.slug === 'leo')?.interests?.map((interest) => interest.name),
    ['旅遊', '編程', '籃球', '電腦遊戲', '動手能力強'],
  )

  const catalog = await parseTravelCatalog(
    path.join(projectRoot, 'docs/travel-projects.md'),
    path.join(projectRoot, 'content-source/travels'),
  )

  assert.equal(catalog.length, 5)
  assert.deepEqual(
    catalog.map((entry) => entry.slug),
    [
      '202607-chongqing-yangtze-river',
      '202702-thailand-phuket',
      '201307-hainan',
      '202308-east-australia',
      '202602-thailand-phuket',
    ],
  )
  assert.equal(
    catalog.find((entry) => entry.slug === '202602-thailand-phuket')?.title,
    '初探泰國普吉島 - 萬豪度假會·躍浪渡假村·芭東海灘',
  )

  const tavisResume = await parseResumeMarkdown(
    path.join(projectRoot, 'content-source/profiles/tavis_resume.md'),
    'tavis',
  )

  assert.equal(tavisResume.slug, 'tavis')
  assert.ok((tavisResume.bio ?? '').includes('28年半導體'))
  assert.ok((tavisResume.careerTimeline ?? []).length >= 7)
  assert.ok((tavisResume.skillRadar ?? []).length >= 4)

  const chongqing = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202607重慶長江三峽8日.md'),
  )

  assert.equal(chongqing.slug, '202607-chongqing-yangtze-river')
  assert.equal(chongqing.status, 'planning')
  assert.equal((chongqing.flights ?? []).length, 2)
  assert.equal((chongqing.cabinAssignments ?? []).length, 3)
  assert.ok((chongqing.dailyItinerary ?? []).length >= 8)

  const eastAustralia = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202308東澳全覽9日.md'),
  )

  assert.equal(eastAustralia.slug, '202308-east-australia')
  assert.equal((eastAustralia.flights ?? []).length, 4)

  const phuket2026 = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202602泰國普吉島8日.md'),
  )

  assert.equal(phuket2026.slug, '202602-thailand-phuket')
  assert.equal(phuket2026.status, 'completed')
  assert.equal((phuket2026.flights ?? []).length, 8)
  assert.equal((phuket2026.lodgings ?? []).length, 4)
  assert.equal((phuket2026.externalVideos ?? []).length, 10)
  assert.equal(phuket2026.dailyItinerary?.[0]?.segments?.[0]?.time, '上午')
  assert.equal(phuket2026.dailyItinerary?.[0]?.segments?.[0]?.transport, 'BR211')
  assert.ok((phuket2026.dailyItinerary?.[0]?.segments?.[0]?.notes ?? '').includes('行李直掛'))

  const phuket2027 = await parseTravelMarkdown(
    path.join(projectRoot, 'content-source/travels/202702泰國普吉島7日.md'),
  )

  assert.equal(phuket2027.slug, '202702-thailand-phuket')
  assert.equal(phuket2027.status, 'planning')
  assert.equal((phuket2027.flights ?? []).length, 2)
  assert.equal((phuket2027.lodgings ?? []).length, 2)

  const seedContent = await buildSeedContent(projectRoot)

  assert.deepEqual(
    seedContent.travels.map((travel) => travel.slug).sort(),
    catalog.map((entry) => entry.slug).sort(),
  )
  assert.equal(
    seedContent.travels.find((travel) => travel.slug === '201307-hainan')?.title,
    '非誠勿擾之海南三亞度假 - 亞龍灣·海棠灣·石梅灣',
  )
  for (const entry of catalog) {
    const travel = seedContent.travels.find((candidate) => candidate.slug === entry.slug)
    const media = seedContent.media.filter(
      (item) => item.ownerType === 'travel' && item.ownerSlug === entry.slug,
    )

    assert.ok(travel, `${entry.slug} must be represented in the seed model`)
    assert.ok((travel.flights ?? []).length > 0, `${entry.slug} must retain flight information`)
    assert.ok((travel.lodgings ?? []).length > 0, `${entry.slug} must retain lodging information`)
    assert.ok((travel.dailyItinerary ?? []).length > 0, `${entry.slug} must retain daily itinerary`)
    assert.ok(media.some((item) => item.usage === 'cover'), `${entry.slug} must have cover media`)
  }

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
          'content-source/assets/travels/202607-chongqing-yangtze-river/cover/202607-chongqing-yangtze-river-cover-001.jpg',
        ) &&
        item.usage === 'cover',
    ),
  )
  assert.ok(seedContent.media.every((item) => !item.sourcePath.includes('/.')))
  assert.equal(
    new Set(seedContent.media.map((item) => path.basename(item.sourcePath))).size,
    seedContent.media.length,
    'every seeded media filename must be globally unique for Payload uploads',
  )

  const hainanDay3GuanyinPhoto = seedContent.media.find(
    (item) =>
      item.sourcePath.endsWith(
        'content-source/assets/travels/201307-hainan/itinerary/day-03-nanshan-sea-guanyin-001.jpeg',
      ),
  )

  assert.ok(hainanDay3GuanyinPhoto)
  assert.equal(hainanDay3GuanyinPhoto.ownerSlug, '201307-hainan')
  assert.equal(hainanDay3GuanyinPhoto.usage, 'itinerary')
  assert.equal(hainanDay3GuanyinPhoto.day, 3)
  assert.equal(hainanDay3GuanyinPhoto.sectionId, 'nanshan-sea-guanyin')
  assert.equal(hainanDay3GuanyinPhoto.time, '11:00')
  assert.equal(hainanDay3GuanyinPhoto.location, 'Nanshan Cultural Tourism Zone')
  assert.equal(hainanDay3GuanyinPhoto.caption, '南山文化旅遊區的海上觀音。')
  assert.ok(hainanDay3GuanyinPhoto.tags.some((item) => item.tag === 'day-03'))
  assert.ok(hainanDay3GuanyinPhoto.tags.some((item) => item.tag === 'section:nanshan-sea-guanyin'))

  const phuketDay2FlightPhoto = seedContent.media.find(
    (item) =>
        item.sourcePath.endsWith(
          'content-source/assets/travels/202602-thailand-phuket/gallery/202602-thailand-phuket-gallery-022.jpeg',
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
