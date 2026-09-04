import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  parseTravelMarkdown,
  validateCanonicalTravelMemoryMarkdown,
} from './seed-content'
import { buildTravelMemoryDayProjections } from './travel-memory-day-projections'

const templatePath = path.resolve('docs/templates/travel-memory-source-template.md')
const markdown = await readFile(templatePath, 'utf8')
assert.deepEqual(validateCanonicalTravelMemoryMarkdown(markdown), [])

const travel = await parseTravelMarkdown(templatePath, {
  slug: '209904-clean-room-coast',
  title: 'Clean-room Family Coast Memory',
  status: 'completed',
  sourceFile: 'docs/templates/travel-memory-source-template.md',
})
const projection = buildTravelMemoryDayProjections(travel, [])
assert.equal(travel.startDate, '2026-04-01')
assert.equal(travel.endDate, '2026-04-02')
assert.equal(travel.isPrivate, true)
assert.deepEqual(projection.days.map((day) => day.date), ['2026-04-01T00:00:00.000Z', '2026-04-02T00:00:00.000Z'])
assert.equal(projection.days.length, 2)
assert.equal(projection.days[0]?.theme, '抵達與相聚')
assert.equal(projection.days[0]?.story, '大家在傍晚海風裡重新聚在一起。')
assert.equal(projection.days[0]?.moments[0]?.transport, '接駁車')
assert.equal(travel.flights?.[0]?.flightNumber, 'EX101')
assert.deepEqual(travel.flights?.[0], {
  date: '4/1', airline: 'Example Air', flightNumber: 'EX101', route: 'TPE → SEA',
  departureTime: '08:00', arrivalTime: '09:10', notes: 'Synthetic data only',
  passengers: undefined,
})
assert.equal(travel.lodgings?.[0]?.hotel, '海風家庭旅店')
assert.deepEqual(travel.party, [{ name: 'Alex' }, { name: 'Bo' }, { name: 'Chen' }])

assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('# ✈️ 航班信息', '# 交通')).some((error) => error.includes('航班信息')))
assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('- **主題**：抵達與相聚', '- **天氣**：晴')).some((error) => error.includes('未知的 Daily 欄位：天氣')))
assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('## Day 2', '## Day 3')).some((error) => error.includes('連續排列')))

// Exercise the same file-based entry used by imports, without Payload or a DB.
const fixtureDirectory = await mkdtemp(path.join(tmpdir(), 'phase21-canonical-contract-'))
const fixturePath = path.join(fixtureDirectory, 'synthetic-memory.md')
try {
  for (const invalid of [
    markdown.replace('startDate: "2026-04-01"\n', ''),
    markdown.replace('endDate: "2026-04-02"\n', ''),
    markdown.replace('isPrivate: true\n', ''),
    markdown.replace('"2026-04-01"', '"2026-02-30"'),
    markdown.replace('"2026-04-01"', '"2026-4-1"'),
    markdown.replace('"2026-04-02"', '"2026-03-31"'),
    markdown.replace('isPrivate: true', 'isPrivate: "false"'),
    markdown.replace('isPrivate: true', 'isPrivate: null'),
    markdown.replace('# ✈️ 航班信息', '# 交通'),
    markdown.replace('航班 | 航線', '班號 | 航線'),
    markdown.replace('| 08:00 | 09:10 | Synthetic data only |', '|  | 09:10 | Synthetic data only |'),
    markdown.replace('## Day 2', '## Day 3'),
  ]) {
    assert.ok(validateCanonicalTravelMemoryMarkdown(invalid).length > 0)
    await writeFile(fixturePath, invalid)
    await assert.rejects(parseTravelMarkdown(fixturePath))
  }
  await writeFile(fixturePath, markdown.replace('isPrivate: true', 'isPrivate: false'))
  assert.equal((await parseTravelMarkdown(fixturePath)).isPrivate, false)
  const reordered = markdown
    .replace('| 日期 | 航空公司 | 航班 | 航線 | 起飛 | 抵達 | 備註 |', '| 乘客 | 抵達 | 航線 | 航班 | 日期 | 起飛 | 備註 | 航空公司 |')
    .replace('| --- | --- | --- | --- | --- | --- | --- |', '| --- | --- | --- | --- | --- | --- | --- | --- |')
    .replace('| 4/1 | Example Air | EX101 | TPE → SEA | 08:00 | 09:10 | Synthetic data only |', '| Alex、Bo | 09:10 | TPE → SEA | EX101 | 4/1 | 08:00 | Synthetic data only | Example Air |')
  await writeFile(fixturePath, reordered)
  assert.deepEqual((await parseTravelMarkdown(fixturePath)).flights, [{ ...travel.flights![0], passengers: 'Alex、Bo' }])
  // A known slug alone must not bypass validation for a new source file.
  await writeFile(fixturePath, markdown.replace('isPrivate: true\n', ''))
  await assert.rejects(parseTravelMarkdown(fixturePath, {
    slug: '201307-hainan', title: 'Synthetic', status: 'completed', sourceFile: fixturePath,
  }))
  const planNamedPath = path.join(fixtureDirectory, '202702泰國普吉島7日.md')
  await writeFile(planNamedPath, markdown.replace(/^(startDate|endDate|isPrivate):.*\n/gm, ''))
  await assert.rejects(parseTravelMarkdown(planNamedPath, {
    slug: '202702-thailand-phuket', title: 'Synthetic', status: 'completed', sourceFile: planNamedPath,
  }))
} finally {
  await rm(fixtureDirectory, { recursive: true })
}

console.log('travel memory canonical source contract tests passed')
