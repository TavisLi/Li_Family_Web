import { readC0InventorySession } from './phase21-c0-session.mjs'

export const c0DeadlineMs = 300000

// Client construction, approved manifest verification, and evidence directory
// creation belong to the entrypoint. Never reconnect or retry this client.
export async function executeC0(client, queries, baseline, evidence, deadlineMs = c0DeadlineMs) {
  let expired = false
  let closing
  const close = () => closing ??= Promise.resolve().then(() => client.end())
  const guard = () => { if (expired) throw new Error('BLOCK: C0 deadline') }
  const checkpoint = async (event) => { guard(); await evidence.checkpoint(event); guard() }
  const safeClient = { async query(statement, values) {
    guard()
    const result = await client.query(statement, values)
    guard()
    return result
  } }
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      expired = true
      // Close begins immediately; close failure cannot mask timeout.
      void close().catch(() => {})
      reject(new Error('BLOCK: C0 deadline'))
    }, deadlineMs)
  })
  const work = async () => {
    await checkpoint({ label: 'connect', queryCount: 0, state: 'STARTED' })
    await client.connect()
    guard()
    await checkpoint({ label: 'connect', queryCount: 0, state: 'PASS' })
    const result = await readC0InventorySession(safeClient, queries, baseline, checkpoint)
    guard()
    // Finish closing before producing the final private snapshot receipt.
    await close()
    guard()
    const receipt = await evidence.snapshot(result.snapshot)
    guard()
    await checkpoint({ label: 'snapshot-readback', queryCount: result.queryCount, state: 'PASS' })
    return { status: 'C0_INVENTORY_READBACK_PASS_NOT_CLEANUP_APPROVAL', receipt, queryCount: result.queryCount }
  }
  let failed = false
  try { return await Promise.race([work(), timeout]) }
  catch (error) { failed = true; throw error }
  finally {
    clearTimeout(timer)
    // On timeout, do not wait indefinitely for a broken driver to acknowledge
    // end(). The CLI still needs a process-level deadline as a last resort.
    if (expired || failed) void close().catch(() => {})
    else await close()
  }
}
