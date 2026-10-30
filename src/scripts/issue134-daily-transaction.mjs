import assert from 'node:assert/strict'

// Only the supervised daily consumer uses this adapter boundary. Drizzle still
// owns its transaction; no alternate executor or fallback SQL is introduced.
export function bindDailyTransaction({ payload, req, observation, transactionIo }) {
  const adapter = payload.db, pool = adapter.pool, client = observation.client
  const id = observation.transactionId
  const baseline = transactionIo.snapshotFor(client).transactionControls
  const originals = { find: adapter.find, connect: pool.connect,
    commit: adapter.commitTransaction, rollback: adapter.rollbackTransaction }
  let releasedForReadback = false, lockReadsBound = 0, blockedAcquisitions = 0, terminalKind = null
  const fail = code => { throw Object.assign(Error('UNKNOWN: ' + code), { code }) }
  const controls = () => transactionIo.snapshotFor(client).transactionControls
  const pinned = () => adapter.sessions?.[id]?.db?.session?.client === client
  const active = async request => {
    if (releasedForReadback || String(await request?.transactionID) !== id || !pinned()) {
      fail('ISSUE134_DAILY_TRANSACTION_CONTEXT_LOST')
    }
  }
  pool.connect = function (...args) {
    if (!releasedForReadback) {
      blockedAcquisitions++
      fail('ISSUE134_DAILY_UNBOUND_POOL_ACQUISITION')
    }
    return originals.connect.apply(this, args)
  }
  adapter.find = async function (args) {
    // Payload 3.90.1's checkDocumentLockStatus omits req on this read.
    if (!releasedForReadback && args.collection === 'payload-locked-documents') {
      await active(args.req ?? req)
      if (!args.req) { args = { ...args, req }; lockReadsBound++ }
    }
    return originals.find.call(this, args)
  }
  const confirmed = kind => {
    if (terminalKind) return terminalKind === kind
    const now = controls(), other = kind === 'commit' ? 'rollback' : 'commit'
    const wire = transactionIo.clientState(client)
    return now[kind].attempted === baseline[kind].attempted + 1 &&
      now[kind].confirmed === baseline[kind].confirmed + 1 &&
      now[other].attempted === baseline[other].attempted && wire.status === 'I' && wire.pending === 0
  }
  const end = kind => async function (incoming) {
    if (String(await incoming) !== id) fail('ISSUE134_DAILY_TRANSACTION_ID_DRIFT')
    // Payload may call killTransaction more than once; never resend a control.
    if (confirmed(kind)) { terminalKind = kind; return }
    const now = controls()
    if (now.commit.attempted !== baseline.commit.attempted ||
        now.rollback.attempted !== baseline.rollback.attempted || !pinned()) {
      fail('ISSUE134_DAILY_TRANSACTION_END_UNKNOWN')
    }
    let error
    try { await originals[kind].call(this, incoming) } catch (caught) { error = caught }
    if (!confirmed(kind)) fail('ISSUE134_DAILY_' + kind.toUpperCase() + '_UNCONFIRMED')
    terminalKind = kind
    if (error) throw error
  }
  adapter.commitTransaction = end('commit')
  adapter.rollbackTransaction = end('rollback')
  return {
    assertRequest: active,
    beforeQuery(actualClient, config) {
      if (releasedForReadback) return
      if (actualClient !== client) fail('ISSUE134_DAILY_TRANSACTION_CLIENT_DRIFT')
      const text = typeof config === 'string' ? config : config?.text ?? ''
      if (/^\s*(COMMIT|ROLLBACK)\b/i.test(text)) {
        const now = controls()
        if (now.commit.attempted !== baseline.commit.attempted ||
            now.rollback.attempted !== baseline.rollback.attempted) {
          fail('ISSUE134_DAILY_TRANSACTION_CONTROL_ALREADY_SENT')
        }
      }
    },
    allowReadback(kind) {
      assert(confirmed(kind), 'UNKNOWN: daily transaction end not confirmed before independent read-back')
      terminalKind = kind
      releasedForReadback = true
    },
    summary() {
      return { transactionId: id, backendPid: observation.backendPid, lockReadsBound,
        blockedAcquisitions, releasedForReadback, commitConfirmed: confirmed('commit'),
        rollbackConfirmed: confirmed('rollback'), transactionControls: controls(), transactionControlBaseline: baseline,
        automaticRetry: false }
    },
    async dispose() {
      // Close an uncertain transport without sending another transaction command.
      if (!confirmed('commit') && !confirmed('rollback')) {
        try { client.release(true) } catch { /* already released by Drizzle */ }
        await client.end().catch(() => {})
      }
      adapter.find = originals.find; pool.connect = originals.connect
      adapter.commitTransaction = originals.commit; adapter.rollbackTransaction = originals.rollback
    },
  }
}
