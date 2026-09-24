import assert from 'node:assert/strict'
import test from 'node:test'

import { replay } from './run-efficiency-replay.mjs'

test('same-input replay reduces modeled visible bytes while preserving every terminal outcome', async () => {
  const report = await replay()
  assert(report.totals.reductionPercent >= 50)
  assert.equal(report.scenarios.length, 9)
  assert.equal(report.scenarios[0].status, 'PASS')
  assert(report.scenarios.slice(1).every((item) => ['BLOCK', 'UNKNOWN'].includes(item.status)))
  assert(report.scenarios.some((item) => item.code === 'MISSING_TERMINAL_RECEIPT'))
  assert(report.scenarios.some((item) => item.code === 'CONNECTION_DROP' && item.status === 'UNKNOWN'))
  assert.equal(report.totals.compactApprovalRounds, 0)
  assert.equal(report.tokenTelemetry, null)
})
