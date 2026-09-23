import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import { verifyManifestFiles } from './run-contract.mjs'

const root = process.cwd()
const directory = 'docs/phase-artifacts/issue-105/local-closeout'
const json = async (name) => JSON.parse(await readFile(path.join(directory, name), 'utf8'))

test('recorded local matrix is bound to current bytes and has a terminal receipt for every fault', async () => {
  const matrix = await json('runs/matrix.json')
  assert.equal(matrix.results.length, 12)
  assert.equal(new Set(matrix.results.map((item) => item.fault)).size, 12)
  for (const item of matrix.results) {
    const base = `runs/${item.fault}`
    const manifest = await json(`${base}/manifest.json`)
    await verifyManifestFiles(manifest, root)
    assert.equal(manifest.environment, 'disposable')
    assert.equal(manifest.scope.expectedEffects.at(-1), `local-fault:${item.fault}`)
    const terminal = await json(`${base}/terminal-exit.json`)
    const receipt = await json(`${base}/${terminal.receiptPath}`)
    const state = await json(`${base}/current-state.json`)
    assert.equal(terminal.status, item.status)
    assert.equal(terminal.code, item.code)
    assert.equal(state.status, item.status)
    assert.equal(receipt.automaticRetry, false)
    if (item.fault !== 'normal' && item.fault !== 'delay' && item.fault !== 'long-wait') {
      assert.notEqual(item.status, 'PASS')
    }
  }
  assert(matrix.results.find((item) => item.fault === 'long-wait').elapsedMs >= 30_000)
})

test('actual same-run CLI measurements preserve every terminal outcome', async () => {
  const matrix = await json('runs/matrix.json')
  const report = await json('efficiency.json')
  assert.deepEqual(report.scenarios.map(({ fault, status, code }) => ({ fault, status, code })),
    matrix.results.map(({ fault, status, code }) => ({ fault, status, code })))
  assert(report.totals.reductionPercent >= 50)
  assert.equal(report.approvalReplay.actualHumanApprovalRounds, 0)
  assert.equal(report.approvalReplay.mutationAutoRetries, 0)
  assert.equal(report.tokenTelemetry, null)
  assert.equal((await json('scope-parity.json')).status, 'PASS')
})
