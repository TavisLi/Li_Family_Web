import { spawn } from 'node:child_process'

// Caller supplies a fixed reviewed worker path. No shell interpolation and no
// automatic restart. Capture output only for local rehearsal, never DB secrets.
export function runC0Worker(worker, args = [], { timeoutMs = 310000, maxBytes = 65536, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stopped = null
    let bytes = 0
    const output = []
    const stop = (reason) => {
      if (!stopped) { stopped = reason; child.kill('SIGKILL') }
    }
    const timer = setTimeout(() => stop('C0_WORKER_DEADLINE'), timeoutMs)
    for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > maxBytes) stop('C0_WORKER_OUTPUT_CAP')
      else output.push(chunk)
    })
    child.once('error', () => { clearTimeout(timer); reject(new Error('C0_WORKER_START_FAILED')) })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      if (stopped) reject(new Error(stopped))
      else if (code !== 0 || signal) reject(new Error('C0_WORKER_FAILED'))
      else resolve({ code, output: Buffer.concat(output).toString('utf8') })
    })
  })
}
