import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { runC0Worker } from './phase21-c0-worker-process.mjs'

// Production invocation requires a separately approved frozen manifest hash.
try {
  const args = process.argv.slice(2)
  const offline = args.length === 1 && args[0] === '--inspect-package'
  assert(offline || (args.length === 2 && args[0] === '--production-readonly' && /^[a-f0-9]{64}$/.test(args[1])), 'BLOCK: unsupported mode')
  if (!offline) assert(process.execArgv.includes('--env-file=.env'), 'BLOCK: explicit env file required')
  const result = await runC0Worker(fileURLToPath(new URL('./phase21-c0-worker.mjs', import.meta.url)), args)
  process.stdout.write(result.output)
} catch {
  console.error(JSON.stringify({ status: 'C0_CLI_BLOCK_NO_RETRY' }))
  process.exitCode = 1
}
