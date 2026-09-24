import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { currentState, manifestHash } from './run-contract.mjs'

export function fileEvidenceSink(directory, manifest, signal) {
  let lastStage = null
  let ledger
  const ledgerPath = path.join(directory, 'ledger.json')
  const checkpointsPath = path.join(directory, 'checkpoints.jsonl')
  const receiptPath = path.join(directory, 'receipt.json')
  return {
    signal,
    async start() {
      ledger = JSON.parse(await readFile(ledgerPath, 'utf8'))
      assert.equal(ledger.runId, manifest.runId, 'BLOCK: ledger run ID')
      assert.equal(ledger.manifestSha256, manifestHash(manifest), 'BLOCK: ledger manifest hash')
      assert.deepEqual(ledger.events, [], 'BLOCK: run already started; no retry')
      await writeFile(checkpointsPath, '', { flag: 'wx', mode: 0o600 })
    },
    async checkpoint(event) {
      await writeFile(checkpointsPath, `${JSON.stringify(event)}\n`, { flag: 'a', mode: 0o600 })
      if (event.stage !== lastStage) {
        lastStage = event.stage
        ledger.events.push({ sequence: ledger.events.length + 1, at: event.at, stage: event.stage,
          status: 'PENDING', evidencePath: 'checkpoints.jsonl' })
        await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 })
      }
    },
    async receipt(result) {
      await writeFile(receiptPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
      ledger.events.push({ sequence: ledger.events.length + 1, at: new Date().toISOString(), stage: result.stage,
        status: result.status, evidencePath: 'receipt.json' })
      await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 })
      const state = currentState(manifest, ledger, null, [], {})
      await writeFile(path.join(directory, 'current-state.json'), `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
    },
  }
}
