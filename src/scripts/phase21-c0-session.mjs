import assert from 'node:assert/strict'
import { boundedC0Sql, decodeC0Response } from './phase21-c0-response.mjs'
import { readC0MappingPages } from './phase21-c0-pages.mjs'
import { readC0ContentInventory } from './phase21-c0-inventory.mjs'
import { readC0Security } from './phase21-c0-security.mjs'

// Caller supplies one connected client configured with connection/query timeouts
// and default_transaction_read_only=on. No connection/retry or evidence writes here.
export async function readC0MappingSession(client, reviewedSql, checkpoint) {
  const sql = boundedC0Sql(reviewedSql)
  const result = await readC0Session(client, (query) => readC0MappingPages(async (slugs, cursor) =>
    decodeC0Response(await query(`page:${cursor}`, sql, [slugs, cursor]))), checkpoint)
  return { rows: result.snapshot.rows, queryCount: result.queryCount, responseBytes: result.snapshot.responseBytes * 2 }
}

export async function readC0ContentSession(client, reviewedQueries, checkpoint) {
  return readC0Session(client, (query) => readC0ContentInventory(query, reviewedQueries), checkpoint)
}

export async function readC0InventorySession(client, reviewedQueries, baseline, checkpoint) {
  return readC0Session(client, async (query) => {
    const operational = await readC0Security(query, reviewedQueries, baseline)
    const content = await readC0ContentInventory(query, reviewedQueries)
    return { ...operational, ...content }
  }, checkpoint)
}

async function readC0Session(client, inventory, checkpoint) {
  let queryCount = 0
  const query = async (label, statement, values) => {
    assert(++queryCount <= 110, 'BLOCK: session query budget')
    await checkpoint({ label, queryCount, state: 'STARTED' })
    let result
    try { result = await client.query(statement, values) }
    catch (error) {
      const code = typeof error?.code === 'string' && /^[A-Z0-9]{5}$/.test(error.code)
        ? error.code.toLowerCase() : 'transport-or-client'
      await checkpoint({ label: `${label}:error:${code}`, queryCount, state: 'BLOCK' }).catch(() => {})
      throw error
    }
    await checkpoint({ label, queryCount, state: 'PASS' })
    return result
  }
  async function read(label) {
    let begun = false
    let failure
    try {
      // Mark transaction open before a post-BEGIN checkpoint can fail.
      await checkpoint({ label: `${label}:begin`, queryCount: ++queryCount, state: 'STARTED' })
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      begun = true
      await checkpoint({ label: `${label}:begin`, queryCount, state: 'PASS' })
      await query(`${label}:timeout`, "SET LOCAL statement_timeout='15000'")
      const settings = await query(`${label}:settings`, "SELECT current_setting('transaction_read_only') AS readonly, current_setting('statement_timeout') AS timeout")
      assert.deepEqual(settings.rows, [{ readonly: 'on', timeout: '15s' }], 'BLOCK: transaction settings')
      return await inventory((name, statement, values) => query(`${label}:${name}`, statement, values))
    } catch (error) {
      failure = error
      throw error
    } finally {
      // ROLLBACK only closes this read-only transaction; never retries a read.
      if (begun) {
        try {
          // A broken checkpoint sink must not prevent closing the transaction.
          ++queryCount
          await client.query('ROLLBACK')
          await checkpoint({ label: `${label}:rollback`, queryCount, state: 'PASS' })
        }
        catch (cleanupError) { if (!failure) throw cleanupError }
      }
    }
  }
  const before = await read('before')
  const after = await read('after')
  assert.deepEqual(after, before, 'BLOCK: mapping drift')
  await checkpoint({ label: 'mapping-readback', queryCount, state: 'PASS' })
  return { snapshot: before, queryCount }
}
