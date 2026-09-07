import assert from 'node:assert/strict'
import test from 'node:test'
import { readC0Security } from './phase21-c0-security.mjs'
const baseline = { tables: ['travel_memories'], migrations: ['migration-1'] }
const sql = { security: 'SELECT 1', history: 'SELECT 1' }
const security = [{ legacy_relation_id: 1, table_name: 'travel_memories', rls_enabled: true,
  public_table_grant: false, public_column_grant: false,
  restricted_role_access: ['anon','authenticated'].map((role) => ({ role, exists: true, table_access: false, column_access: false, superuser: false, bypass_rls: false })) }]
const history = [{ legacy_relation_id: 1, name: 'dev', batch: -1 }, { legacy_relation_id: 2, name: 'migration-1', batch: 11 }]
function query(tables = security, migrations = history) {
  return async (label) => {
    const body = JSON.stringify(label === 'security' ? tables : migrations)
    return { rows: [{ bytes: Buffer.byteLength(body), body }] }
  }
}
test('exact table and migration inventory preserves dev marker', async () => {
  assert.deepEqual(await readC0Security(query(), sql, baseline), { security, history })
})
test('missing table and disabled RLS block', async () => {
  await assert.rejects(readC0Security(query([]), sql, baseline), /missing or unexpected tables/)
  await assert.rejects(readC0Security(query([{ ...security[0], rls_enabled: false }]), sql, baseline), (error) => {
    assert.match(error.message, /RLS disabled/)
    assert.equal(error.c0Category, 'security-rls-disabled')
    return true
  })
})
test('security response boundary receives a non-sensitive category', async () => {
  await assert.rejects(readC0Security(async () => ({ rows: [{ bytes: 65537, body: null }] }), sql, baseline), (error) => {
    assert.equal(error.c0Category, 'security-response-bound')
    return true
  })
})
test('pending and duplicate migrations block', async () => {
  await assert.rejects(readC0Security(query(security, history.slice(0, 1)), sql, baseline), /pending or duplicate/)
  await assert.rejects(readC0Security(query(security, [...history, { ...history[1], legacy_relation_id: 3 }]), sql, baseline), /pending or duplicate/)
})
test('unexpected dev metadata blocks', async () => {
  await assert.rejects(readC0Security(query(security, [{ ...history[0], batch: 0 }, history[1]]), sql, baseline), /dev history batch/)
})

test('documented standalone migration requires exact unique name and batch', async () => {
  const standalone = { name: '20260719_025401', batch: 8 }
  const approved = { ...baseline, historicalMigrations: [standalone] }
  const rows = [...history, { ...standalone, legacy_relation_id: 3 }]
  assert.deepEqual((await readC0Security(query(security, rows), sql, approved)).history, rows)
  await assert.rejects(readC0Security(query(), sql, approved), /migration history/)
  await assert.rejects(readC0Security(query(security, [...rows, { ...standalone, legacy_relation_id: 4 }]), sql, approved), /migration history/)
  await assert.rejects(readC0Security(query(security, [...history, { ...standalone, batch: 9, legacy_relation_id: 3 }]), sql, approved), /historical migration batch/)
  await assert.rejects(readC0Security(query(security, [...rows, { name:'unknown',batch:8,legacy_relation_id:4 }]), sql, approved), /migration history/)
})

test('effective access, missing role and PUBLIC grants block', async () => {
  const changed = structuredClone(security)
  changed[0].restricted_role_access[0].table_access = true
  await assert.rejects(readC0Security(query(changed), sql, baseline), /restricted role privilege/)
  changed[0].restricted_role_access[0].table_access = false
  changed[0].restricted_role_access[0].exists = false
  await assert.rejects(readC0Security(query(changed), sql, baseline), /expected role missing/)
  await assert.rejects(readC0Security(query([{ ...security[0], public_column_grant: true }]), sql, baseline), /PUBLIC grant/)
})
