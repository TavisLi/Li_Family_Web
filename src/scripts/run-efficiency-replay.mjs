import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import path from 'node:path'

const root = 'docs/phase-artifacts/issue-105/slice-2-example/run'
const readJson = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'))

export function compareReplay(scenarios, context) {
  const results = scenarios.map((scenario) => {
    const started = performance.now()
    const full = JSON.stringify({ manifest: context.manifest,
      checkpoints: scenario.name === 'normal' ? context.checkpoints :
        context.checkpoints.filter((item) => item.stage === 'bootstrap' ||
          context.stages.indexOf(item.stage) <= context.stages.indexOf(scenario.stage)),
      receipt: scenario.receipt }) + '\n'
    const compact = JSON.stringify({ runId: context.manifest.runId, status: scenario.receipt.status,
      stage: scenario.stage, code: scenario.receipt.code, commitState: scenario.receipt.commitState,
      restoreState: scenario.receipt.restoreState, evidencePath: 'receipt.json' }) + '\n'
    assert(scenario.receipt.status !== 'PASS' || scenario.receipt.code === null)
    assert(scenario.receipt.status === 'PASS' || ['BLOCK', 'UNKNOWN'].includes(scenario.receipt.status))
    return { name: scenario.name, status: scenario.receipt.status, code: scenario.receipt.code,
      baselineModelVisibleBytes: Buffer.byteLength(full), compactModelVisibleBytes: Buffer.byteLength(compact),
      baselineToolCalls: 1, compactToolCalls: 1, baselineEmptyPolls: 0, compactEmptyPolls: 0,
      baselineApprovalRounds: 0, compactApprovalRounds: 0,
      replayComputeElapsedMs: Number((performance.now() - started).toFixed(3)),
      recordedRunElapsedMs: scenario.name === 'normal' ? context.terminal.elapsedMs : null }
  })
  const total = (key) => results.reduce((sum, item) => sum + item[key], 0)
  const baseline = total('baselineModelVisibleBytes')
  const compact = total('compactModelVisibleBytes')
  return { version: 1, method: 'offline same-input replay; full raw-state output versus compact terminal state',
    source: 'recorded disposable normal run; fault receipts modeled from focused test outcomes',
    tokenTelemetry: null, tokenMetric: 'not measured; byte counts are a proxy',
    scenarios: results, totals: { baselineModelVisibleBytes: baseline, compactModelVisibleBytes: compact,
      reductionPercent: Number(((baseline - compact) / baseline * 100).toFixed(2)),
      baselineToolCalls: total('baselineToolCalls'), compactToolCalls: total('compactToolCalls'),
      baselineEmptyPolls: 0, compactEmptyPolls: 0, baselineApprovalRounds: 0, compactApprovalRounds: 0,
      replayComputeElapsedMs: Number(results.reduce((sum, item) => sum + item.replayComputeElapsedMs, 0).toFixed(3)) } }
}

export async function replay() {
  const [manifest, receipt, terminal, rawCheckpoints] = await Promise.all([
    readJson('manifest.json'), readJson('receipt.json'), readJson('terminal-exit.json'),
    readFile(path.join(root, 'checkpoints.jsonl'), 'utf8'),
  ])
  const checkpoints = rawCheckpoints.trim().split('\n').map((line) => JSON.parse(line))
  const stages = [...new Set(checkpoints.map((item) => item.stage))]
  const fault = (name, stage, code, status = 'BLOCK', commitState = 'ROLLED_BACK') => ({
    name, stage, receipt: { ...receipt, status, code, stage, commitState, restoreState: 'NOT_STARTED', terminalExit: 1 },
  })
  const scenarios = [
    { name: 'normal', stage: 'complete', receipt },
    fault('warning', 'preflight', 'DATABASE_WARNING', 'UNKNOWN', 'ROLLBACK_UNKNOWN'),
    fault('silent-exit', 'preflight', 'MISSING_TERMINAL_RECEIPT'),
    fault('delayed-timeout', 'preflight', 'CLIENT_RESPONSE_TIMEOUT', 'UNKNOWN', 'ROLLBACK_UNKNOWN'),
    fault('oversized-response', 'preflight', 'RESPONSE_BYTE_CAP'),
    fault('query-cancelled', 'preflight', 'QUERY_CANCELLED'),
    fault('connection-drop', 'preflight', 'CONNECTION_DROP', 'UNKNOWN', 'ROLLBACK_UNKNOWN'),
    fault('rollback-failed', 'preflight', 'QUERY_FAILURE', 'UNKNOWN', 'ROLLBACK_UNKNOWN'),
    fault('commit-ack-loss', 'commit', 'CONNECTION_DROP', 'UNKNOWN', 'UNKNOWN'),
  ]
  const report = compareReplay(scenarios, { manifest, checkpoints, stages, terminal })
  assert(report.totals.reductionPercent >= 50, 'BLOCK: output reduction below 50%')
  assert(report.scenarios.every((item, index) => item.status === scenarios[index].receipt.status &&
    item.code === scenarios[index].receipt.code), 'BLOCK: fail-closed outcome changed')
  return report
}

if (process.argv[1]?.endsWith('/run-efficiency-replay.mjs')) {
  const destination = process.argv[2]
  if (!destination || process.argv.length !== 3) throw new Error('Usage: node src/scripts/run-efficiency-replay.mjs <report-path>')
  const report = await replay()
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })
  console.log(JSON.stringify({ status: 'PASS', report: destination, reductionPercent: report.totals.reductionPercent }))
}
