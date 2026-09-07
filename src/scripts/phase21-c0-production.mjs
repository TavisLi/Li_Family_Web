import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { c0FrozenPackage, inspectC0Package } from './phase21-c0-package.mjs'
import { c0ConnectionOptions } from './phase21-c0-connection.mjs'
import { createC0Evidence } from './phase21-c0-evidence.mjs'
import { executeC0 } from './phase21-c0-execute.mjs'

const blockCategories = new Set([
  'security-table-scope', 'security-rls-disabled', 'security-public-grant',
  'security-role-inventory', 'security-role-missing', 'security-role-privilege',
  'security-response-bound',
  'history-dev-count', 'history-dev-batch', 'history-migration-set',
])

export async function runC0Production(expectedHash) {
  assert(/^[a-f0-9]{64}$/.test(expectedHash), 'BLOCK: manifest hash')
  const raw = await readFile(c0FrozenPackage, 'utf8')
  assert.equal(createHash('sha256').update(raw).digest('hex'), expectedHash, 'BLOCK: manifest checksum')
  const frozen = JSON.parse(raw)
  assert.deepEqual(await inspectC0Package(), frozen, 'BLOCK: package drift')
  const options = c0ConnectionOptions(process.env)
  const privateRoot = '.phase21-private'
  assert.equal(execFileSync('git', ['check-ignore', `${privateRoot}/c0-probe`], { encoding: 'utf8' }).trim(), `${privateRoot}/c0-probe`, 'BLOCK: evidence not ignored')
  const runId = `c0-${new Date().toISOString().replace(/[-:.]/g, '')}`
  const evidence = await createC0Evidence(privateRoot, runId)
  const queries = Object.fromEntries(await Promise.all(Object.entries(frozen.queries).map(async ([key,file]) =>
    [key, await readFile(`docs/phase-artifacts/phase-21/${file}`, 'utf8')])))
  const require = createRequire(import.meta.resolve('@payloadcms/db-postgres'))
  const { Client } = require('pg')
  const client = new Client(options)
  let connectionError = false
  client.on('error', () => { connectionError = true })
  try {
    const result = await executeC0(client, queries, frozen, evidence)
    assert.equal(connectionError, false, 'BLOCK: asynchronous connection error')
    return { ...result, runId, productionWrites: 0 }
  } catch (error) {
    const category = blockCategories.has(error?.c0Category) ? `:${error.c0Category}` : ''
    await evidence.checkpoint({ label: `run-block${category}`, queryCount: 0, state: 'BLOCK' }).catch(() => {})
    throw error
  }
}
