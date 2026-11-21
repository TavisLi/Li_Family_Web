import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createIssue134PostgresIo } from './issue134-transaction-io.mjs'

const digest = value => createHash('sha256').update(value).digest('hex')
const error = code => Object.assign(new Error(code), { code })
const check = (condition, code) => { if (!condition) throw error(code) }
const positiveInteger = id => Number.isSafeInteger(id) && id > 0
const ownerParameter = 'validated positive integer Current Memory id from 06'
const locales = new Set(['zh-TW', 'en'])

export async function loadTravelMemoryCurrentPlan(directory, expectedSha) {
  const read = async (file, checksum) => {
    const bytes = await readFile(path.resolve(directory, file))
    assert.equal(digest(bytes), checksum, 'Current plan artifact drift')
    return bytes.toString('utf8')
  }
  const candidate = JSON.parse(await read('current-read-approval-candidate.json', expectedSha))
  const base = JSON.parse(await read(candidate.basePlan.file, candidate.basePlan.sha256))
  assert.equal(candidate.target, base.target)
  assert.deepEqual(candidate.limits, base.limits)
  assert.equal(candidate.maxAttempts, 1)
  const load = async step => ({ ...step, label: path.basename(step.file), text: await read(step.file, step.sha256) })
  const steps = await Promise.all(base.order.map(load))
  const origin = await load(candidate.newOwnerBranch.step)
  assert.deepEqual(steps.map(s => s.label.split('-')[0]), Array.from({length:14}, (_,i) => String(i+1).padStart(2,'0')))
  assert.equal(origin.label, '07a-origin-plan-if-new.sql')
  assert.equal(steps.length, base.limits.sqlDispatches)
  const [slug, originPlanSlug] = steps[5].parameters
  assert.deepEqual(steps[6].parameters, [slug])
  assert.deepEqual(origin.parameters, [originPlanSlug])
  for (const s of steps.slice(7, -1)) assert.deepEqual(s.parameters, [ownerParameter, slug])
  return { ...candidate, planSha256: expectedSha, slug, originPlanSlug, steps, origin }
}

function envelope(response, step) {
  const row = response.rows[0]
  check(response.rows.length === 1 && typeof row.payload === 'string' &&
    Buffer.byteLength(row.payload) <= step.jsonBytes, 'CURRENT_ENVELOPE_CAP')
  const records = JSON.parse(row.payload)
  check(Array.isArray(records) && records.length <= step.logicalRows &&
    records.length === Number(row.row_count), 'CURRENT_ROW_CAP_OR_SHAPE')
  for (const item of records) {
    if (item.locales == null) continue
    check(Array.isArray(item.locales) && item.locales.length <= 2 &&
      new Set(item.locales.map(entry => entry._locale)).size === item.locales.length &&
      item.locales.every(entry => locales.has(entry._locale)), 'CURRENT_LOCALE_SCOPE')
  }
  return [records, Buffer.byteLength(row.payload)]
}

function assertSession(records, role) {
  const row = records[0]
  check(records.length === 1 && row.effective_role === role.effective && row.login_role === role.session &&
    row.database_name === 'postgres' && row.read_only === 'on' && row.isolation === 'repeatable read' &&
    row.statement_timeout === '5s' && row.lock_timeout === '1s' && row.search_path === 'pg_catalog' &&
    row.server_encoding === 'UTF8' && row.client_encoding === 'UTF8' &&
    row.rolsuper === false && row.rolbypassrls === false, 'CURRENT_READER_IDENTITY_DRIFT')
}

// The calling gate must verify committed ACL/view fingerprints and the exact Human approval
// before supplying the authorized reader connection. Failed attempts expose a receipt only.
export async function readTravelMemoryCurrent({ Client, client, raw, plan, authorize, verifyPeer, signal }) {
  const { limits, steps, origin, slug, originPlanSlug } = plan
  const deadline = performance.now() + limits.elapsedMs
  const remaining = () => Math.floor(deadline - performance.now())
  const counters = { queries: 0, roundTrips: 0, responseBytes: 0 }
  let stage = 'connect', peer, timer, warning = false, connectionError = false, failure
  let rollback = 'NOT_STARTED', jsonBytes = 0, logicalRows = 0, owner, originPlanId, snapshotKind
  const snapshot = {}
  const guard = () => {
    authorize()
    check(!signal?.aborted && !connectionError, 'CURRENT_INTERRUPTED')
    check(!warning, 'CURRENT_WARNING')
    check(remaining() > limits.cleanupReserveMs, 'CURRENT_DEADLINE')
  }
  client.on('notice', () => { warning = true })
  client.on('error', () => { connectionError = true })
  const observer = createIssue134PostgresIo({ Client, counters, getStage: () => stage, guard,
    limits: { queryBudget: limits.sqlDispatches, roundTripBudget: limits.queryCycles, rowCap: 1,
      responseByteCap: limits.responseWireBytes },
    recoveryReserve: { queries: 1, roundTrips: 1 },
    recoveryGuard: () => check(remaining() > 0 && !connectionError, 'CURRENT_ROLLBACK_DEADLINE'),
  })
  const watchdog = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(error('CURRENT_DEADLINE'))
      raw?.destroy()
      client.connection?.stream?.destroy()
    }, limits.elapsedMs)
  })
  const bounded = promise => Promise.race([promise, watchdog])
  async function runStep(step) {
    guard()
    stage = step.label
    const values = step.parameters.map(value => value === ownerParameter ? owner : value)
    const response = await bounded(client.query({ text: step.text, values,
      query_timeout: Math.min(limits.statementMs, remaining()-limits.cleanupReserveMs) }))
    assert.deepEqual(observer.clientState(client), { status: 'T', pending: 0 }, 'CURRENT_TRANSACTION_STATE')
    if (step.logicalRows === null) return
    const [records, bytes] = envelope(response, step)
    jsonBytes += bytes
    logicalRows += records.length
    check(jsonBytes <= limits.jsonPayloadBytes && logicalRows <= limits.logicalTopLevelRows, 'CURRENT_AGGREGATE_CAP')
    snapshot[step.label] = records
    return records
  }

  try {
    guard()
    check(raw?.cap === limits.responseWireBytes && client.connection.stream === raw, 'CURRENT_WIRE_CAP_MISSING')
    await bounded(client.connect())
    peer = verifyPeer(client)
    for (const step of steps.slice(0, 4)) await runStep(step)
    assertSession(await runStep(steps[4]), plan.requiredRole)
    const ownerRows = await runStep(steps[5])
    if (ownerRows.length) {
      const row = ownerRows[0]
      check(ownerRows.length === 1 && positiveInteger(row.id) && row.slug === slug &&
        row.is_private === true && row.expected_origin_plan === true && positiveInteger(row.origin_plan_id),
        'CURRENT_OWNER_SCOPE_DRIFT')
      owner = row.id
      originPlanId = row.origin_plan_id
    }
    const versions = await runStep(steps[6])
    check(versions.every(row => owner && row.parent_id === owner), 'CURRENT_VERSION_OWNER_AMBIGUITY')
    if (owner) {
      for (const step of steps.slice(7, -1)) await runStep(step)
      const memory = snapshot[steps[7].label]
      check(memory.length === 1 && memory[0].id === owner && memory[0].slug === slug &&
        memory[0].is_private === true && memory[0].origin_plan_id === originPlanId, 'CURRENT_OWNER_READBACK_DRIFT')
      snapshotKind = 'EXISTING_OWNER_PROJECTION'
    } else {
      const plans = await runStep(origin)
      check(plans.length === 1 && positiveInteger(plans[0].id) && plans[0].slug === originPlanSlug,
        'CURRENT_ORIGIN_PLAN_AMBIGUITY')
      originPlanId = plans[0].id
      snapshotKind = 'ZERO_OWNER_AND_VERSION'
      check(counters.queries + 1 <= plan.newOwnerBranch.limits.sqlDispatches &&
        jsonBytes <= plan.newOwnerBranch.limits.jsonPayloadBytes, 'CURRENT_ZERO_BRANCH_CAP')
    }
  } catch (caught) {
    failure = caught
  } finally {
    const begin = observer.snapshotFor(client).transactionControls.begin
    const state = observer.clientState(client)
    if (begin.attempted) {
      rollback = 'UNKNOWN'
      if (begin.confirmed && !state.pending && ['T','E'].includes(state.status) && remaining() > 0 && !connectionError) {
        try {
          const response = await bounded(client.query({ text: steps.at(-1).text,
            query_timeout: Math.min(limits.cleanupReserveMs, remaining()) }))
          const metrics = observer.snapshotFor(client).transactionControls.rollback
          const state = observer.clientState(client)
          if (response.command === 'ROLLBACK' && metrics.confirmed === 1 && state.status === 'I' && !state.pending) {
            rollback = 'CONFIRMED'
          }
        } catch { /* one attempt on the original connection */ }
      }
    }
    try { await bounded(client.end()) } catch { failure ??= error('CURRENT_CLOSE_UNKNOWN') }
    finally { clearTimeout(timer); observer.restore(); raw?.destroy() }
  }
  if (warning || signal?.aborted || connectionError) failure ??= error('CURRENT_INTERRUPTED')
  const status = rollback === 'UNKNOWN' || ['CURRENT_DEADLINE','CURRENT_CLOSE_UNKNOWN'].includes(failure?.code) ?
    'UNKNOWN' : failure ? 'BLOCK' : 'PASS'
  const code = failure ? (/^[A-Z0-9_]{2,64}$/.test(failure.code ?? '') ? failure.code : 'CURRENT_CHECK_FAILED')
    : status === 'UNKNOWN' ? 'CURRENT_ROLLBACK_UNKNOWN' : null
  return { status, code, stage, counters, jsonBytes, rollback, peer,
    ...(status === 'PASS' ? { snapshotKind, owner: owner ?? null, originPlanId,
      mediaCoverage: owner ? 'PLACEMENT_REFERENCES_ONLY' : 'NONE', snapshot } : {}) }
}
