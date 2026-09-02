import assert from 'node:assert/strict'
import test from 'node:test'

import { parseTravelMarkdown } from './seed-content'
import { buildTravelMemoryDayProjections } from './travel-memory-day-projections'

test('a top-level summary does not become part of the last Daily chapter', async () => {
  const travel = await parseTravelMarkdown('src/scripts/fixtures/travel-daily-boundaries.md')
  assert.deepEqual(travel.dailyItinerary?.[0]?.segments, [
    { time: '10:00', activity: 'Arrive', transport: 'Bus', notes: 'First' },
  ])
})

test('Australia Day 9 contains only its itinerary, not following meal and activity summaries', async () => {
  const travel = await parseTravelMarkdown('content-source/travels/202308東澳全覽9日.md')
  assert.equal(travel.dailyItinerary?.length, 9)
  assert.deepEqual(travel.dailyItinerary?.[8]?.segments, [
    { time: '05:40', activity: '抵達桃園機場', transport: '飛機', notes: '—' },
  ])
})

test('Australia Day 3 retains both itinerary tables but not the repeated header', async () => {
  const travel = await parseTravelMarkdown('content-source/travels/202308東澳全覽9日.md')
  const segments = travel.dailyItinerary?.[2]?.segments ?? []
  assert.equal(segments.length, 9)
  assert.equal(segments.filter((segment) => segment.transport === '交通').length, 0)
  assert.ok(segments.some((segment) => segment.activity.includes('City Circle Tram')))
  assert.ok(segments.some((segment) => segment.activity.includes('義大利街')))
  const day = buildTravelMemoryDayProjections(travel, []).days[2]
  for (const [title, key] of [
    ['⭐ 城市懷舊電車 City Circle Tram', 'itinerary-7'],
    ['聯邦廣場 Federation Square', 'itinerary-8'],
    ['聖派翠克大教堂 St. Patrick’s Cathedral', 'itinerary-9'],
    ['義大利街', 'itinerary-10'],
  ]) assert.equal(day.moments.find((moment) => moment.title === title)?.momentKey, key)
  assert.equal(day.moments.some((moment) => moment.momentKey === 'itinerary-6'), false)
})

test('Hainan Day 5 retains all 19 source activities, including arrival at the hotel', async () => {
  const travel = await parseTravelMarkdown('content-source/travels/201307海南島8日.md')
  const segments = travel.dailyItinerary?.[4]?.segments ?? []
  assert.equal(segments.length, 19)
  assert.equal(segments.at(-1)?.time, '19:30')
  assert.ok(segments.at(-1)?.activity.includes('希爾頓逸林'))
})

test('legacy identity mapping rejects missing, ambiguous and colliding source identities', async () => {
  const source = await parseTravelMarkdown('content-source/travels/202308東澳全覽9日.md')
  for (const mutation of ['missing', 'duplicate', 'collision']) {
    const travel = structuredClone(source)
    const segments = travel.dailyItinerary![2].segments!
    if (mutation === 'missing') segments[5].activity = 'Changed identity'
    if (mutation === 'duplicate') segments.push({ ...segments[5] })
    if (mutation === 'collision') segments[0].time = '7'
    assert.throws(() => buildTravelMemoryDayProjections(travel, []), /BLOCK: Australia Day 3/)
  }
  const before = structuredClone(source)
  buildTravelMemoryDayProjections(source, [])
  assert.deepEqual(source, before)
})

test('Daily tables use their own headers, preserve nested tables and exclude peer sections', async () => {
  const travel = await parseTravelMarkdown('src/scripts/fixtures/travel-daily-multiple-tables.md')
  assert.equal(travel.dailyItinerary?.length, 2)
  const first = travel.dailyItinerary![0]
  assert.deepEqual(first.segments, [
    { time: '10:00', activity: 'Arrive', transport: 'Bus', notes: 'First' },
    { time: '15:00', activity: 'Walk', transport: undefined, notes: 'No transport supplied' },
  ])
  assert.equal(first.theme, 'Theme')
  assert.equal(first.story, 'Story')
  assert.deepEqual(first.meals, { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' })
  assert.equal(first.lodging, 'Hotel')
  assert.equal(travel.dailyItinerary![1].segments?.length, 13)
  assert.equal(travel.dailyItinerary![1].segments?.at(-1)?.activity, 'Thirteen')
})

test('all 25 formal Memory days retain parser to child-projection content parity', async () => {
  const cases = [
    ['201307海南島8日.md', [5, 9, 12, 15, 19, 10, 11, 12]],
    ['202308東澳全覽9日.md', [2, 7, 9, 10, 5, 7, 10, 10, 1]],
    ['202602泰國普吉島8日.md', [6, 11, 7, 8, 10, 10, 7, 8]],
  ] as const
  for (const [file, expectedCounts] of cases) {
    const travel = await parseTravelMarkdown(`content-source/travels/${file}`)
    assert.deepEqual(travel.dailyItinerary?.map((day) => day.segments?.length), expectedCounts)
    const projection = buildTravelMemoryDayProjections(travel, [])
    for (const [index, day] of travel.dailyItinerary!.entries()) {
      const child = projection.days[index]
      assert.equal(child.title, day.title)
      assert.equal(child.date, day.date)
      assert.equal(child.theme, day.theme)
      assert.equal(child.story, day.story)
      assert.deepEqual(child.meals, day.meals)
      assert.equal(child.lodging, day.lodging)
      for (const segment of day.segments ?? []) {
        const moment = child.moments.find((item) => item.title === segment.activity && item.time === segment.time)
        assert.ok(moment, `${file} Day ${day.day}: ${segment.activity}`)
        assert.equal(moment.transport, segment.transport || undefined)
        assert.equal(moment.body, segment.notes || undefined)
      }
    }
  }
})
