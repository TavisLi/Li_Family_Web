import { currentState } from './run-contract.mjs'

export function terminalDecision({ exitCode, signal, receipt, lastCheckpoint, forcedDeadline = false }) {
  if (receipt && !signal && exitCode === receipt.terminalExit &&
    ((receipt.status === 'PASS' && exitCode === 0) || (receipt.status !== 'PASS' && exitCode !== 0))) {
    return { status: receipt.status, code: receipt.code, requiresFallback: false }
  }
  const uncertain = ['SENT_UNKNOWN', 'UNKNOWN', 'ROLLBACK_UNKNOWN', 'COMMITTED'].includes(lastCheckpoint?.commitState) ||
    ['SENT_UNKNOWN', 'UNKNOWN', 'ROLLBACK_UNKNOWN'].includes(lastCheckpoint?.restoreState)
  const code = forcedDeadline ? 'RUN_DEADLINE' : signal ? 'SIGNAL' : receipt ? 'TERMINAL_EXIT_MISMATCH' : 'MISSING_TERMINAL_RECEIPT'
  return { status: uncertain ? 'UNKNOWN' : 'BLOCK', code,
    requiresFallback: true }
}

export function terminalLedgerState(manifest, ledger, decision, at = new Date().toISOString(),
  evidencePath = 'supervisor-receipt.json', force = false) {
  if ((decision.requiresFallback || force) && !['BLOCK', 'UNKNOWN'].includes(ledger.events.at(-1)?.status)) {
    ledger.events.push({ sequence: ledger.events.length + 1, at, stage: 'supervisor',
      status: decision.status, evidencePath })
  }
  return currentState(manifest, ledger, null, [], {})
}
