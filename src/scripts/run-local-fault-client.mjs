import { setTimeout as delay } from 'node:timers/promises'

const faultError = (code, message) => Object.assign(new Error(message), { code })

// Faults are available only to the loopback disposable rehearsal entrypoint.
export function localClientFactory(Client, connectionString, limits, fault) {
  let readInjected = false
  let commitInjected = false
  let connectDelayed = false
  return () => {
    const client = new Client({ connectionString, connectionTimeoutMillis: limits.clientTimeoutMs,
      query_timeout: limits.clientTimeoutMs, application_name: 'issue105-local-closeout' })
    return {
      on: (...args) => client.on(...args),
      async connect() {
        if (fault === 'deadline' && !connectDelayed) {
          connectDelayed = true
          await delay(300)
        }
        await client.connect()
      },
      async query(text, values) {
        if (fault === 'rollback-failure' && text === 'ROLLBACK') throw new Error('injected rollback failure')
        if (fault === 'commit-ack-loss' && text === 'COMMIT' && !commitInjected) {
          commitInjected = true
          await client.query(text, values)
          throw faultError('08006', 'injected commit acknowledgement loss')
        }
        if (!readInjected && /^SELECT\b/i.test(text)) {
          readInjected = true
          if (fault === 'warning') client.emit('notice', { severity: 'WARNING' })
          if (fault === 'silent-exit') {
            await client.query(text, values)
            process.exit(0)
          }
          if (fault === 'delay') await delay(350)
          if (fault === 'long-wait') await delay(35000)
          if (fault === 'deadline') await delay(300)
          if (fault === 'oversized-response') return { rows: [{ payload: 'x'.repeat(70000) }], rowCount: 1 }
          if (fault === 'query-cancelled') throw faultError('57014', 'canceling statement due to user request')
          if (fault === 'connection-drop') {
            await client.end()
            throw faultError('08006', 'injected connection drop')
          }
          if (fault === 'rollback-failure') throw new Error('injected preflight failure')
          if (fault === 'signal') process.kill(process.pid, 'SIGTERM')
        }
        return client.query(text, values)
      },
      end: () => client.end(),
    }
  }
}
