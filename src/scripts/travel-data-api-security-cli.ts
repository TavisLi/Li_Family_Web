import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  phase17TravelDataApiProtectedTables,
  phase17TravelDataApiSecurityMigrationName,
  phase17TravelDataApiSecurityUpSQL,
} from '@/migrations/20260717_121714_phase_17_secure_travel_data_api'
import {
  assertTravelDataApiSecurityApply,
  assertTravelDataApiSecurityInspect,
  assertTravelDataApiSecurityVerify,
  assertTravelDataApiSecurityWriteApproval,
  buildTravelDataApiSecurityApprovalToken,
  type TravelDataApiSecurityState,
} from './travel-data-api-security-package'

const require = createRequire(import.meta.url)
const { Pool } = require('pg') as {
  Pool: new (options: { connectionString: string; max: number }) => DatabasePool
}

type QueryResult<Row> = { rows: Row[] }
type DatabaseClient = {
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>
  release(): void
}
type DatabasePool = {
  connect(): Promise<DatabaseClient>
  end(): Promise<void>
}

const negativeStatements = [
  { operation: 'select-plan', sql: 'select id from public.travel_plans limit 1' },
  { operation: 'select-memory', sql: 'select id from public.travel_memories limit 1' },
  {
    operation: 'select-route-identity',
    sql: 'select id from public.travel_route_identities limit 1',
  },
  { operation: 'select-plan-locale', sql: 'select id from public.travel_plans_locales limit 1' },
  { operation: 'select-shared-relation', sql: 'select id from public.media_rels limit 1' },
  {
    operation: 'insert-route-identity',
    sql: `insert into public.travel_route_identities
      (slug, owner_key, updated_at, created_at)
      select 'negative-test', 'negative-test', now(), now() where false`,
  },
  {
    operation: 'update-plan',
    sql: 'update public.travel_plans set updated_at = updated_at where false',
  },
  { operation: 'delete-memory', sql: 'delete from public.travel_memories where false' },
] as const

async function run() {
  const mode = process.argv[2]
  if (mode !== 'inspect' && mode !== 'apply' && mode !== 'verify') {
    throw new Error('Usage: travel-data-api-security-cli.ts <inspect|apply|verify> [--allow-write]')
  }

  const root = process.cwd()
  await loadLocalEnv(root)
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required')
  if (process.env.PAYLOAD_ENABLE_DEV_SCHEMA_PUSH === 'true') {
    throw new Error('Security migration refuses PAYLOAD_ENABLE_DEV_SCHEMA_PUSH=true')
  }

  const pool = new Pool({ connectionString: databaseUri, max: 1 })
  try {
    const client = await pool.connect()
    try {
      const state = await collectState(client, databaseUri, root)
      const approvalToken = buildTravelDataApiSecurityApprovalToken(state)

      if (mode === 'inspect') {
        assertTravelDataApiSecurityInspect(state)
        console.log(JSON.stringify(publicState(mode, state, approvalToken), null, 2))
        return
      }

      if (mode === 'verify') {
        assertTravelDataApiSecurityVerify(state)
        const negativeTests = await runNegativeTests(client)
        assertNegativeTests(negativeTests)
        console.log(
          JSON.stringify(
            { ...publicState(mode, state, approvalToken), negativeTests, verified: true },
            null,
            2,
          ),
        )
        return
      }

      assertTravelDataApiSecurityApply(state)
      assertTravelDataApiSecurityWriteApproval({
        allowWrite: process.argv.includes('--allow-write'),
        expectedTarget: state.databaseFingerprint,
        expectedToken: approvalToken,
        providedTarget: process.env.TRAVEL_SECURITY_TARGET_CONFIRM,
        providedToken: process.env.TRAVEL_SECURITY_WRITE_CONFIRM,
      })

      await client.query('begin')
      try {
        await client.query('lock table public.payload_migrations in share row exclusive mode')
        const transactionState = await collectState(client, databaseUri, root)
        assertTravelDataApiSecurityApply(transactionState)
        if (buildTravelDataApiSecurityApprovalToken(transactionState) !== approvalToken) {
          throw new Error('Security migration state changed after approval; transaction refused')
        }
        await client.query(phase17TravelDataApiSecurityUpSQL)
        await client.query(
          `insert into public.payload_migrations (name, batch, updated_at, created_at)
           values ($1, (select coalesce(max(batch), 0) + 1 from public.payload_migrations), now(), now())`,
          [phase17TravelDataApiSecurityMigrationName],
        )
        const securedState = await collectState(client, databaseUri, root)
        assertTravelDataApiSecurityVerify(securedState)
        const transactionNegativeTests = await runNegativeTests(client, true)
        assertNegativeTests(transactionNegativeTests)
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        throw error
      }

      const committedState = await collectState(client, databaseUri, root)
      assertTravelDataApiSecurityVerify(committedState)
      const negativeTests = await runNegativeTests(client)
      assertNegativeTests(negativeTests)
      console.log(
        JSON.stringify(
          { ...publicState(mode, committedState, approvalToken), committed: true, negativeTests },
          null,
          2,
        ),
      )
    } finally {
      client.release()
    }
  } finally {
    await pool.end()
  }
}

async function collectState(
  client: DatabaseClient,
  databaseUri: string,
  root: string,
): Promise<TravelDataApiSecurityState> {
  const placeholders = phase17TravelDataApiProtectedTables.map((_, index) => `$${index + 1}`).join(', ')
  const [migration, roles, tableRows, implementationFingerprint] = await Promise.all([
    client.query<{ present: boolean }>(
      'select exists (select 1 from public.payload_migrations where name = $1) as present',
      [phase17TravelDataApiSecurityMigrationName],
    ),
    client.query<{ anon: boolean; authenticated: boolean }>(`
      select
        exists (select 1 from pg_roles where rolname = 'anon') as anon,
        exists (select 1 from pg_roles where rolname = 'authenticated') as authenticated
    `),
    client.query<{
      authenticated_privileges: number
      anon_privileges: number
      rls_enabled: boolean
      table_name: string
    }>(
      `select
         c.relname as table_name,
         c.relrowsecurity as rls_enabled,
         (select count(*)::int from information_schema.role_table_grants g
           where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'anon') as anon_privileges,
         (select count(*)::int from information_schema.role_table_grants g
           where g.table_schema = 'public' and g.table_name = c.relname and g.grantee = 'authenticated') as authenticated_privileges
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relname in (${placeholders})`,
      [...phase17TravelDataApiProtectedTables],
    ),
    readImplementationFingerprint(root),
  ])
  const byName = new Map(tableRows.rows.map((row) => [row.table_name, row]))
  const roleState = requiredRow(roles.rows[0], 'database roles')
  return {
    databaseFingerprint: buildDatabaseFingerprint(databaseUri),
    implementationFingerprint,
    migrationPresent: requiredRow(migration.rows[0], 'migration record').present,
    rolesPresent: roleState,
    tables: phase17TravelDataApiProtectedTables.map((table) => {
      const row = byName.get(table)
      return {
        authenticatedPrivileges: row?.authenticated_privileges ?? 0,
        exists: Boolean(row),
        anonPrivileges: row?.anon_privileges ?? 0,
        rlsEnabled: row?.rls_enabled ?? false,
        table,
      }
    }),
  }
}

async function runNegativeTests(client: DatabaseClient, insideTransaction = false) {
  const results: Array<{ denied: boolean; operation: string; role: string; sqlState?: string }> = []
  for (const role of ['anon', 'authenticated'] as const) {
    for (const statement of negativeStatements) {
      await client.query(insideTransaction ? 'savepoint travel_security_negative_test' : 'begin')
      try {
        await client.query(`set local role ${role}`)
        await client.query(statement.sql)
        results.push({ denied: false, operation: statement.operation, role })
      } catch (error) {
        const sqlState = errorCode(error)
        results.push({ denied: sqlState === '42501', operation: statement.operation, role, sqlState })
      } finally {
        if (insideTransaction) {
          await client.query('rollback to savepoint travel_security_negative_test')
          await client.query('release savepoint travel_security_negative_test')
        } else {
          await client.query('rollback')
        }
      }
    }
  }
  return results
}

function assertNegativeTests(tests: Awaited<ReturnType<typeof runNegativeTests>>) {
  const failures = tests.filter((test) => !test.denied)
  if (failures.length > 0) {
    throw new Error(
      `Negative tests did not receive permission denied: ${failures
        .map(({ operation, role, sqlState }) => `${role}/${operation}/${sqlState ?? 'allowed'}`)
        .join(', ')}`,
    )
  }
}

function publicState(mode: string, state: TravelDataApiSecurityState, approvalToken: string) {
  const summary = {
    protectedTables: state.tables.length,
    rlsEnabled: state.tables.filter((table) => table.rlsEnabled).length,
    anonTablesWithPrivileges: state.tables.filter((table) => table.anonPrivileges > 0).length,
    authenticatedTablesWithPrivileges: state.tables.filter(
      (table) => table.authenticatedPrivileges > 0,
    ).length,
  }
  return {
    approvalToken,
    databaseFingerprint: state.databaseFingerprint,
    implementationFingerprint: state.implementationFingerprint,
    migrationPresent: state.migrationPresent,
    mode,
    rolesPresent: state.rolesPresent,
    summary,
    writeCommand:
      mode === 'inspect'
        ? `TRAVEL_SECURITY_TARGET_CONFIRM=${state.databaseFingerprint} ` +
          `TRAVEL_SECURITY_WRITE_CONFIRM=${approvalToken} ` +
          'pnpm run seed:travel:secure-data-api apply -- --allow-write'
        : undefined,
  }
}

function buildDatabaseFingerprint(databaseUri: string) {
  const parsed = new URL(databaseUri)
  return `db:${createHash('sha256')
    .update([parsed.protocol, parsed.username, parsed.hostname, parsed.port, parsed.pathname].join('|'))
    .digest('hex')
    .slice(0, 12)}`
}

async function readImplementationFingerprint(root: string) {
  const files = [
    'src/migrations/20260717_121714_phase_17_secure_travel_data_api.ts',
    'src/scripts/travel-data-api-security-cli.ts',
    'src/scripts/travel-data-api-security-package.ts',
  ]
  const contents = await Promise.all(files.map((file) => readFile(path.join(root, file))))
  return `impl:${createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0, 12)}`
}

function errorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined
}

function requiredRow<Row>(row: Row | undefined, label: string): Row {
  if (!row) throw new Error(`Could not read ${label}`)
  return row
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    try {
      const content = await readFile(path.join(root, filename), 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const separator = trimmed.indexOf('=')
        if (separator === -1) continue
        const key = trimmed.slice(0, separator).trim()
        const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
        if (key && process.env[key] === undefined) process.env[key] = value
      }
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
