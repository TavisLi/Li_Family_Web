import test from 'node:test'
import assert from 'node:assert/strict'

import { catalogSha256, parseCatalogPayload, projectCatalog } from './catalog.mjs'

test('semantic projection ignores OIDs and physical dropped-column slots but preserves live column order', () => {
  const rows = [
    { attnum: 1, atttypid: 23, attisdropped: false, attname: 'first' },
    { attnum: 2, atttypid: 0, attisdropped: true, attname: 'dropped' },
    { attnum: 3, atttypid: 25, attisdropped: false, attname: 'second' },
  ]
  assert.deepEqual(projectCatalog('columns', rows), [
    { attisdropped: false, attname: 'first' },
    { attisdropped: false, attname: 'second' },
  ])
  assert.notDeepEqual(projectCatalog('columns', rows), projectCatalog('columns', [...rows].reverse()))
})

test('constraints replace unstable relation OID with the captured relation identity', () => {
  assert.deepEqual(projectCatalog('constraints', [{ oid: 9, conrelid: 42, conname: 'fk', conkey: [1] }],
    [{ oid: 42, relname: 'days' }]), [{ conname: 'fk', relationIdentity: 'days' }])
})

test('only known generated internal FK trigger names are normalized', () => {
  const row = { tgisinternal: true, tgname: 'RI_ConstraintTrigger_a_123', definition: 'trigger RI_ConstraintTrigger_a_123' }
  assert.deepEqual(projectCatalog('triggers', [row]), [
    { definition: 'trigger INTERNAL_FK_TRIGGER', tgname: 'INTERNAL_FK_TRIGGER', tgisinternal: true },
  ])
  assert.throws(() => projectCatalog('triggers', [{ ...row, tgname: 'unexpected' }]), /unknown internal trigger/)
})

test('semantic catalog hash ignores object key insertion order', () => {
  assert.equal(catalogSha256([{ a: 1, b: 2 }]), catalogSha256([{ b: 2, a: 1 }]))
  assert.equal(catalogSha256([]), '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945')
})

test('bounded catalog text payload is parsed before semantic projection', () => {
  assert.deepEqual(parseCatalogPayload('[{"nspname":"public"}]'), [{ nspname: 'public' }])
  assert.deepEqual(parseCatalogPayload([{ nspname: 'public' }]), [{ nspname: 'public' }])
  assert.throws(() => parseCatalogPayload('not-json'), (error) =>
    error.issue158Code === 'SEMANTIC_CATALOG_INVALID_JSON')
  assert.throws(() => parseCatalogPayload('null'), /payload unavailable/)
})
