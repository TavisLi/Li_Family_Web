import assert from 'node:assert/strict'
import { inspectC0Package } from './phase21-c0-package.mjs'

try {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--inspect-package') {
    console.log(JSON.stringify(await inspectC0Package(), null, 2))
  } else {
    assert(args.length === 2 && args[0] === '--production-readonly' && /^[a-f0-9]{64}$/.test(args[1]), 'BLOCK: unsupported mode')
    const { runC0Production } = await import('./phase21-c0-production.mjs')
    console.log(JSON.stringify(await runC0Production(args[1])))
  }
} catch {
  console.error(JSON.stringify({ status: 'C0_WORKER_BLOCK_NO_RETRY' }))
  process.exitCode = 1
}
