import { AsyncLocalStorage } from 'node:async_hooks'
import { issue134HistoryRowLimit, issue134HistorySummaryQuery } from './issue134-additive-history.mjs'

// One observed ROLLBACK plus the 12-query before-image capture in the bound fixture.
// This is a hard recovery allowance, not a guarantee for other fixture shapes.
export const issue134RecoveryReserve = Object.freeze({ queries: 13, roundTrips: 13 })
const additiveHistoryTables = ['_travel_memory_days_v', '_travel_memory_days_v_locales',
  '_travel_memory_days_v_version_moments', '_travel_memory_days_v_version_moments_locales',
  '_travel_memory_days_v_version_moments_placements', '_travel_memory_days_v_version_moments_placements_locales']
const recoveryHistoryQueries = new Set(additiveHistoryTables.map(issue134HistorySummaryQuery))

function recoveryQueryAllowed(config) {
  const text = typeof config === 'string' ? config : String(config?.text ?? '')
  // Keep existing SELECT reads; never admit another statement through this path.
  if (/^\s*SELECT\b/i.test(text)) return !text.trim().replace(/;$/, '').includes(';')
  // This is an exact generated-query allowlist, not general WITH permission.
  if (!recoveryHistoryQueries.has(text)) return false
  const values = config?.values
  return Array.isArray(values) && values.length === 2 && values[1] === issue134HistoryRowLimit + 1 &&
    Array.isArray(values[0]) && values[0].length > 0 && values[0].length <= issue134HistoryRowLimit &&
    values[0].every((id, i, ids) => Number.isSafeInteger(id) && id > 0 && (i === 0 || id > ids[i - 1]))
}

function safeError(code, message) {
  return Object.assign(new Error(message), { code })
}

function controlName(config) {
  const text = typeof config === 'string' ? config : String(config?.text ?? '')
  const match = /^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.exec(text)
  return match?.[1]?.toLowerCase() ?? null
}

function safeQueryKind(config) {
  const text = typeof config === 'string' ? config : String(config?.text ?? '')
  if (/^\s*INSERT\s+INTO\s+(?:"?public"?\.)?"?_travel_memories_v_rels"?\b/i.test(text)) return 'memory-version-rel-insert'
  if (/^\s*SELECT\b[\s\S]*?\bFROM\s+(?:"?public"?\.)?"?_travel_memories_v_rels"?\b/i.test(text)) return 'memory-version-rel-read'
  if (/^\s*INSERT\s+INTO\s+(?:"?public"?\.)?"?travel_memories_rels"?\b/i.test(text)) return 'memory-current-rel-insert'
  if (/^\s*SELECT\s+media_id\s+FROM\s+public\.travel_memories_rels\b/i.test(text)) return 'memory-gallery-page'
  if (/^\s*SELECT\b[\s\S]*?\bFROM\s+(?:"?public"?\.)?"?travel_memories_rels"?\b/i.test(text)) return 'memory-current-rel-read'
  for (const table of additiveHistoryTables) {
    if (new RegExp(`\\bFROM\\s+(?:public\\.)?${table}(?=\\s|$)`, 'i').test(text)) {
      return /\bAS\s+row_sha256\b/i.test(text) ? `history-row-digest:${table}` : `history-root-page:${table}`
    }
  }
  if (/\bSELECT\b[\s\S]*?["']media["']\.["']id["']/i.test(text)) return 'media-row-read'
  return 'other'
}

function emptyControlCounts() {
  return { attempted: 0, confirmed: 0, failed: 0, unknown: 0 }
}

function emptyMetrics() {
  return {
    queries: 0,
    roundTrips: 0,
    requestBytes: 0,
    responseBytes: 0,
    rows: 0,
    maxRequestBytes: 0,
    maxResponseBytes: 0,
    maxRows: 0,
    queriesByStage: {},
    rowsByStage: {},
    requestBytesByStage: {},
    responseBytesByStage: {},
    transactionControls: {
      begin: emptyControlCounts(),
      commit: emptyControlCounts(),
      rollback: emptyControlCounts(),
    },
    galleryPageRows: [],
    queryObservations: [],
    lastQuery: null,
  }
}

function clone(value) {
  return structuredClone(value)
}

export function createIssue134PostgresIo({ Client, counters, limits, guard, getStage,
  recoveryReserve = { queries: 0, roundTrips: 0 }, recoveryGuard = guard, termination = null,
  beforeQuery = null }) {
  if (!Client?.prototype || typeof Client.prototype.query !== 'function') {
    throw new TypeError('PostgreSQL Client.prototype.query is required')
  }
  const prototype = Client.prototype
  const originalQuery = prototype.query
  const states = new WeakMap()
  const observedStates = new Set()
  const statesByProcessId = new Map()
  const globalMetrics = emptyMetrics()
  const recoveryContext = new AsyncLocalStorage()
  for (const [reserve, total] of [[recoveryReserve.queries, limits.queryBudget],
    [recoveryReserve.roundTrips, limits.roundTripBudget]]) {
    if (!Number.isSafeInteger(reserve) || reserve < 0 || reserve >= total) {
      throw new TypeError('Recovery reserve must fit within the original total budget')
    }
  }
  globalMetrics.budget = { totalQueries: limits.queryBudget, totalRoundTrips: limits.roundTripBudget,
    workQueries: limits.queryBudget - recoveryReserve.queries,
    workRoundTrips: limits.roundTripBudget - recoveryReserve.roundTrips,
    recoveryReserve: { ...recoveryReserve }, recoveryQueriesUsed: 0, recoveryRoundTripsUsed: 0 }
  let restored = false

  const getState = (client) => {
    let state = states.get(client)
    if (state) return state
    state = { wireStatus: 'UNKNOWN', pending: [], metrics: emptyMetrics(), listenerInstalled: false, originalSend: null }
    states.set(client, state)
    observedStates.add(state)
    if (Number.isSafeInteger(client.processID) && client.processID > 0) {
      statesByProcessId.set(client.processID, state)
    }
    const connection = client.connection
    if (!connection || typeof connection.on !== 'function') {
      throw safeError('POSTGRES_CLIENT_CONNECTION_MISSING', 'BLOCK: PostgreSQL client connection is unavailable')
    }
    state.listenerInstalled = true
    connection.on('message', (message) => {
      if (message?.name === 'readyForQuery') state.wireStatus = message.status
      const query = state.pending[0]
      if (!query) return
      if (Number.isInteger(message?.length) && message.length >= 4) {
        const messageBytes = message.length + 1
        query.responseBytes += messageBytes
        state.metrics.responseBytes += messageBytes
        globalMetrics.responseBytes += messageBytes
        state.metrics.responseBytesByStage[query.stage] =
          (state.metrics.responseBytesByStage[query.stage] ?? 0) + messageBytes
        globalMetrics.responseBytesByStage[query.stage] =
          (globalMetrics.responseBytesByStage[query.stage] ?? 0) + messageBytes
        counters.responseBytes = (counters.responseBytes ?? 0) + messageBytes
      }
      if (message?.name === 'dataRow') query.rows += 1
      if (message?.name === 'commandComplete') {
        query.command = String(message.text ?? '').toUpperCase().split(' ', 1)[0]
      }
      if (message?.name === 'error') query.serverError = true
      if (message?.name !== 'readyForQuery') return

      counters.roundTrips += 1
      state.metrics.roundTrips += 1
      globalMetrics.roundTrips += 1
      if (query.budgetClass === 'recovery') globalMetrics.budget.recoveryRoundTripsUsed += 1
      query.completed = true
      state.metrics.rows += query.rows
      globalMetrics.rows += query.rows
      state.metrics.rowsByStage[query.stage] = (state.metrics.rowsByStage[query.stage] ?? 0) + query.rows
      globalMetrics.rowsByStage[query.stage] = (globalMetrics.rowsByStage[query.stage] ?? 0) + query.rows
      state.metrics.maxRows = Math.max(state.metrics.maxRows, query.rows)
      globalMetrics.maxRows = Math.max(globalMetrics.maxRows, query.rows)
      state.metrics.maxResponseBytes = Math.max(state.metrics.maxResponseBytes, query.responseBytes)
      globalMetrics.maxResponseBytes = Math.max(globalMetrics.maxResponseBytes, query.responseBytes)

      if (query.control) {
        const control = state.metrics.transactionControls[query.control]
        const globalControl = globalMetrics.transactionControls[query.control]
        if (!query.serverError && query.command === query.control.toUpperCase()) {
          control.confirmed += 1
          globalControl.confirmed += 1
        } else {
          control.failed += 1
          globalControl.failed += 1
        }
      }
      if (query.kind === 'memory-gallery-page') {
        globalMetrics.galleryPageRows.push(query.rows)
        state.metrics.galleryPageRows.push(query.rows)
      }

      if (query.rows > limits.rowCap) query.violation = safeError('TRANSACTION_ROW_CAP', 'BLOCK: PostgreSQL row cap')
      else if (query.responseBytes > limits.responseByteCap) {
        query.violation = safeError('TRANSACTION_RESPONSE_BYTE_CAP', 'BLOCK: PostgreSQL response byte cap')
      }
      globalMetrics.lastQuery = state.metrics.lastQuery = {
        sequence: query.sequence,
        stage: query.stage,
        kind: query.kind,
        status: query.violation ? (query.rows > limits.rowCap ? 'BLOCKED_ROW_CAP' : 'BLOCKED_BYTE_CAP') :
          query.serverError ? 'ERROR' : 'PASS',
        rows: query.rows,
        requestBytes: query.requestBytes,
        responseBytes: query.responseBytes,
        ...(query.control ? { control: query.control,
          controlStatus: query.serverError || query.command !== query.control.toUpperCase() ? 'FAILED' : 'CONFIRMED' } : {}),
      }
      const observation = {
        sequence: query.sequence,
        stage: query.stage,
        kind: query.kind,
        budgetClass: query.budgetClass,
        status: globalMetrics.lastQuery.status,
        rows: query.rows,
        requestBytes: query.requestBytes,
        responseBytes: query.responseBytes,
        ...(query.control ? { control: query.control, controlStatus: globalMetrics.lastQuery.controlStatus } : {}),
      }
      query.observation = observation
      globalMetrics.queryObservations.push(observation)
      state.metrics.queryObservations.push(observation)
      state.pending.shift()
    })

    if (typeof connection._send === 'function') {
      state.originalSend = connection._send
      connection._send = function (buffer, ...args) {
        const query = state.pending[0]
        if (query && Buffer.isBuffer(buffer)) {
          query.requestBytes += buffer.length
          state.metrics.requestBytes += buffer.length
          globalMetrics.requestBytes += buffer.length
          counters.requestBytes = (counters.requestBytes ?? 0) + buffer.length
          globalMetrics.requestBytesByStage[query.stage] =
            (globalMetrics.requestBytesByStage[query.stage] ?? 0) + buffer.length
          state.metrics.requestBytesByStage[query.stage] =
            (state.metrics.requestBytesByStage[query.stage] ?? 0) + buffer.length
          state.metrics.maxRequestBytes = Math.max(state.metrics.maxRequestBytes, query.requestBytes)
          globalMetrics.maxRequestBytes = Math.max(globalMetrics.maxRequestBytes, query.requestBytes)
        }
        return state.originalSend.call(this, buffer, ...args)
      }
    }
    return state
  }

  const wrappedQuery = function (...inputArgs) {
    const config = inputArgs[0]
    beforeQuery?.(this, config)
    const control = controlName(config)
    const state = getState(this)
    const tx = state.metrics.transactionControls
    const rollback = control === 'rollback' && tx.begin.confirmed > tx.commit.confirmed + tx.rollback.confirmed
    const recoveryReadback = Boolean(recoveryContext.getStore())
    if (recoveryReadback && !recoveryQueryAllowed(config)) {
      throw safeError('RECOVERY_QUERY_NOT_READ_ONLY', 'BLOCK: recovery readback permits SELECT only')
    }
    const recovery = rollback || recoveryReadback
    const terminationOnly = rollback && termination !== null &&
      /^\s*ROLLBACK\s*;?\s*$/i.test(typeof config === 'string' ? config : String(config?.text ?? ''))
    let dispatched = false
    const queryGuard = terminationOnly ? () => termination.guard({ dispatched }) : recovery ? recoveryGuard : guard
    queryGuard()
    const queryCap = limits.queryBudget - (recovery ? 0 : recoveryReserve.queries)
    const roundTripCap = limits.roundTripBudget - (recovery ? 0 : recoveryReserve.roundTrips)
    const recoveryExhausted = recovery && recoveryReserve.queries > 0 &&
      (globalMetrics.budget.recoveryQueriesUsed + 1 > recoveryReserve.queries ||
        globalMetrics.budget.recoveryRoundTripsUsed + 1 > recoveryReserve.roundTrips)
    if (!terminationOnly && (counters.queries + 1 > queryCap || counters.roundTrips + 1 > roundTripCap || recoveryExhausted)) {
      const error = safeError('TRANSACTION_QUERY_BUDGET', 'BLOCK: PostgreSQL query budget')
      globalMetrics.lastQuery = { sequence: counters.queries + 1, stage: getStage(), status: 'BLOCKED_BUDGET' }
      throw error
    }
    const args = [...inputArgs]
    if (terminationOnly) {
      args[0] = typeof config === 'string' ? { text: config, query_timeout: termination.timeoutMs } :
        { ...config, query_timeout: termination.timeoutMs }
    }
    const query = {
      sequence: counters.queries + 1,
      stage: getStage(),
      control,
      budgetClass: recovery ? 'recovery' : 'work',
      kind: safeQueryKind(config),
      rows: 0,
      requestBytes: 0,
      responseBytes: 0,
      command: null,
      serverError: false,
      completed: false,
      violation: null,
    }
    counters.queries += 1
    dispatched = true
    globalMetrics.queries += 1
    if (recovery) globalMetrics.budget.recoveryQueriesUsed += 1
    state.metrics.queries += 1
    globalMetrics.queriesByStage[query.stage] = (globalMetrics.queriesByStage[query.stage] ?? 0) + 1
    state.metrics.queriesByStage[query.stage] = (state.metrics.queriesByStage[query.stage] ?? 0) + 1
    if (query.control) {
      state.metrics.transactionControls[query.control].attempted += 1
      globalMetrics.transactionControls[query.control].attempted += 1
    }
    state.pending.push(query)
    state.wireStatus = 'BUSY'

    let callbackIndex = -1
    if (typeof args[2] === 'function') callbackIndex = 2
    else if (typeof args[1] === 'function') callbackIndex = 1
    const configCallback = config && typeof config === 'object' && typeof config.callback === 'function'
    const finish = (error, result) => {
      if (!query.completed && error) {
        query.completed = true
        if (query.control) {
          state.metrics.transactionControls[query.control].unknown += 1
          globalMetrics.transactionControls[query.control].unknown += 1
        }
        const index = state.pending.indexOf(query)
        if (index >= 0) state.pending.splice(index, 1)
      }
      if (query.violation) return [query.violation, undefined]
      if (error) return [error, undefined]
      try { queryGuard() } catch (failure) {
        const reasonCode = typeof failure?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(failure.code)
          ? failure.code : 'QUERY_GUARD_BLOCKED'
        if (query.observation) query.observation.status = 'BLOCKED_BUDGET'
        if (globalMetrics.lastQuery?.sequence === query.sequence) {
          globalMetrics.lastQuery.status = 'BLOCKED_BUDGET'
          globalMetrics.lastQuery.budgetFailureCode = reasonCode
        }
        return [failure, undefined]
      }
      return [null, result]
    }

    if (callbackIndex >= 0) {
      const callback = args[callbackIndex]
      args[callbackIndex] = (error, result) => {
        const [finalError, finalResult] = finish(error, result)
        callback(finalError, finalResult)
      }
      try {
        return originalQuery.apply(this, args)
      } catch (error) {
        finish(error)
        throw error
      }
    }
    if (configCallback) {
      const callback = config.callback
      args[0] = { ...config, callback: (error, result) => {
        const [finalError, finalResult] = finish(error, result)
        callback(finalError, finalResult)
      } }
      try {
        return originalQuery.apply(this, args)
      } catch (error) {
        finish(error)
        throw error
      }
    }

    let result
    try {
      result = originalQuery.apply(this, args)
    } catch (error) {
      finish(error)
      throw error
    }
    if (!result || typeof result.then !== 'function') return result
    return result.then((value) => {
      const [error] = finish(null, value)
      if (error) throw error
      return value
    }, (error) => {
      finish(error)
      throw error
    })
  }

  prototype.query = wrappedQuery
  return {
    snapshot() { return clone(globalMetrics) },
    clientState(client) {
      const state = states.get(client) ?? statesByProcessId.get(client?.processID)
      return { status: state?.wireStatus ?? 'UNKNOWN', pending: state?.pending.length ?? 0 }
    },
    quiescence() { const rows=[...observedStates];return {idle:rows.length>0&&rows.every(s=>s.wireStatus==='I'&&s.pending.length===0),pending:rows.reduce((n,s)=>n+s.pending.length,0)} },
    async withRecoveryReadback(client, operation) {
      const state = states.get(client) ?? statesByProcessId.get(client?.processID)
      const tx = state?.metrics.transactionControls
      if (!tx || tx.rollback.confirmed === 0 || tx.begin.confirmed > tx.commit.confirmed + tx.rollback.confirmed) {
        throw safeError('RECOVERY_ROLLBACK_UNCONFIRMED', 'UNKNOWN: recovery requires confirmed transaction rollback')
      }
      return recoveryContext.run(true, operation)
    },
    snapshotFor(client) {
      const processId = Number.isSafeInteger(client?.processID) && client.processID > 0 ? client.processID : null
      const state = states.get(client) ?? (processId === null ? undefined : statesByProcessId.get(processId))
      return clone(state?.metrics ?? emptyMetrics())
    },
    restore() {
      if (restored) return
      if (prototype.query === wrappedQuery) prototype.query = originalQuery
      statesByProcessId.clear()
      restored = true
    },
  }
}
