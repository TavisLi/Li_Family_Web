import { spawn } from 'node:child_process'

// Never report termination until the process has closed. A signal escalates from
// TERM to KILL; an unconfirmed close is UNKNOWN and forbids later DB work.
export function runChild(file, args, { env, deadline, signal, maxBytes = 1024 * 1024, killGraceMs = 200 } = {}) {
  if (!Number.isFinite(deadline) || Date.now() >= deadline) return Promise.reject(new Error('DEADLINE'))
  if (signal?.aborted) return Promise.reject(new Error('INTERRUPTED'))
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let bytes = 0, stdout = '', stderr = '', reason = null, escalation, watchdog
    const terminate = why => {
      if (reason) return
      reason = why
      try { process.kill(-child.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') reason = 'TERMINATION_UNKNOWN' }
      escalation = setTimeout(() => {
        try { process.kill(-child.pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') reason = 'TERMINATION_UNKNOWN' }
      }, killGraceMs)
      watchdog = setTimeout(() => { reason = 'TERMINATION_UNKNOWN'; reject(new Error(reason)) }, killGraceMs + 5000)
    }
    const abort = () => terminate('INTERRUPTED')
    signal?.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(() => terminate('DEADLINE'), Math.max(0, deadline - Date.now()))
    if (signal?.aborted) terminate('INTERRUPTED')
    const collect = (chunk, stream) => { bytes += chunk.length; if (bytes > maxBytes) terminate('OUTPUT_LIMIT'); else if(stream === 'stdout') stdout += chunk.toString(); else stderr += chunk.toString() }
    child.stdout.on('data', chunk=>collect(chunk,'stdout')); child.stderr.on('data', chunk=>collect(chunk,'stderr'))
    child.on('error', error => { clearTimeout(timer); clearTimeout(escalation); clearTimeout(watchdog); signal?.removeEventListener('abort', abort); reject(error) })
    child.on('close', (code, sig) => {
      clearTimeout(timer); clearTimeout(escalation); clearTimeout(watchdog); signal?.removeEventListener('abort', abort)
      if (reason || code !== 0) reject(Object.assign(new Error(reason ?? `CHILD_FAILED:${code}:${sig}`), {stdout,stderr})); else resolve({ stdout, stderr, code })
    })
  })
}
