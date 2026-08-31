import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
assert.equal(projection.days.length, 2)
assert.equal(projection.days[0]?.theme, '抵達與相聚')
assert.equal(projection.days[0]?.story, '大家在傍晚海風裡重新聚在一起。')
assert.equal(projection.days[0]?.moments[0]?.transport, '接駁車')
assert.equal(travel.flights?.[0]?.flightNumber, 'EX101')
assert.equal(travel.lodgings?.[0]?.hotel, '海風家庭旅店')

assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('# ✈️ 航班信息', '# 交通')).some((error) => error.includes('航班信息')))
assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('- **主題**：抵達與相聚', '- **天氣**：晴')).some((error) => error.includes('未知的 Daily 欄位：天氣')))
assert.ok(validateCanonicalTravelMemoryMarkdown(markdown.replace('## Day 2', '## Day 3')).some((error) => error.includes('連續排列')))

console.log('travel memory canonical source contract tests passed')
