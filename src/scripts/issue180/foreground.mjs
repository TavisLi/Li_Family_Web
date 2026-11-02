import { spawn } from 'node:child_process'

// A foreground supervisor keeps the parent handle until close and never restarts.
// A closed parent alone does not establish absence of descendants.
export function startForeground(file, args, { env, logFd = 'ignore', spawnProcess = spawn } = {}) {
  const startedAt = Date.now()
  const child = spawnProcess(file, args, { env, detached: true, stdio: ['ignore', logFd, logFd] })
  let state = 'running', closeResult, launchError
  const closed = new Promise(resolve => {
    child.once('error', error => { launchError = error.message })
    child.once('exit', () => { state = 'exited' })
    child.once('close', (code, signal) => { state = 'closed'; closeResult = { code, signal, ...(launchError === undefined ? {} : { launchError }) }; resolve(closeResult) })
  })
  return {
    get pid() { return child.pid },
    get state() { return state },
    get result() { return closeResult },
    startedAt,
    closed,
    async stop({ deadline, sendSignal = signal => child.kill(signal) }) {
      if (!Number.isFinite(deadline) || deadline <= Date.now()) return { status: 'UNKNOWN', reason: 'CLEANUP_DEADLINE' }
      if (state === 'running') {
        if (!Number.isInteger(child.pid)) return { status: 'UNKNOWN', reason: 'HANDLE_NOT_LIVE' }
        // Signal the retained parent handle, never a PID read from disk or an old
        // numeric process group. PostgreSQL SIGINT requests fast, orderly shutdown.
        try { if (sendSignal('SIGINT') === false) return { status: 'UNKNOWN', reason: 'SIGNAL_FAILED' } }
        catch { return { status: 'UNKNOWN', reason: 'SIGNAL_FAILED' } }
      }
      let timer
      const result = await Promise.race([closed, new Promise(resolve => { timer = setTimeout(() => resolve(null), Math.max(0, deadline - Date.now())) })])
      clearTimeout(timer)
      if (!result) return { status: 'UNKNOWN', reason: 'EXIT_UNCONFIRMED' }
      // Caller must separately prove group and PostgreSQL server absence before deleting.
      return { status: 'PARENT_EXIT_CONFIRMED', result, groupAbsence: 'UNKNOWN', serverAbsence: 'UNKNOWN' }
    },
  }
}
