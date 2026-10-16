import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'


const removedFields = {
  relations: ['oid'],
  constraints: ['oid', 'conrelid', 'contypid', 'confrelid', 'conkey', 'confkey'],
  indexes: ['indrelid', 'indkey', 'indcollation', 'indclass'],
  triggers: ['tgfoid', 'tgconstraint'],
}
const aclFields = ['nspacl', 'defaclacl', 'relacl', 'attacl']

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]))
}

export function projectCatalog(category, input, relations = []) {
  assert(Array.isArray(input), `BLOCK: ${category} catalog rows`)
  const relationNames = new Map(relations.map((row) => [String(row.oid), row.relname]))
  const projected = []
  for (const source of input) {
    const row = { ...source }
    for (const field of aclFields) {
      if (Array.isArray(row[field])) row[field] = [...row[field]].sort()
    }
    if (category === 'columns') {
      if (row.attisdropped === true) continue
      delete row.attnum
      delete row.atttypid
    } else {
      for (const field of removedFields[category] ?? []) delete row[field]
    }
    if (category === 'constraints') row.relationIdentity = relationNames.get(String(source.conrelid)) ?? null
    if (category === 'triggers' && row.tgisinternal) {
      assert.match(row.tgname, /^RI_ConstraintTrigger_[ac]_[0-9]+$/, 'BLOCK: unknown internal trigger name')
      row.definition = row.definition.replaceAll(row.tgname, 'INTERNAL_FK_TRIGGER')
      row.tgname = 'INTERNAL_FK_TRIGGER'
    }
    projected.push(stableValue(row))
  }
  if (category !== 'columns') projected.sort((left, right) => {
    const a = JSON.stringify(left)
    const b = JSON.stringify(right)
    return a < b ? -1 : a > b ? 1 : 0
  })
  return projected
}

export function catalogSha256(value) {
  return createHash('sha256').update(pythonJson(stableValue(value))).digest('hex')
}

export function parseCatalogPayload(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value) }
    catch { throw Object.assign(new Error('BLOCK: semantic catalog JSON payload is invalid'),
      { issue158Code: 'SEMANTIC_CATALOG_INVALID_JSON' }) }
  }
  assert(Array.isArray(value), 'BLOCK: semantic catalog payload unavailable')
  return value
}

export async function verifySemanticCatalog(client, root) {
  try { await client.query('SET search_path TO pg_catalog') }
  catch (error) {
    if (/^[0-9A-Z]{5}$/.test(error?.code ?? '')) error.issue158Code = `SEMANTIC_SEARCH_PATH_SQLSTATE_${error.code}`
    throw error
  }
  const baseline = JSON.parse(await readFile(path.join(root,
    'scripts/rehearsal/baselines/issue158-v12/semantic-catalog.json'), 'utf8'))
  const queries = JSON.parse(await readFile(path.join(root,
    'scripts/rehearsal/baselines/issue158-v12/catalog-queries.json'), 'utf8'))
  const rawRelations = []
  const observed = {}
  for (const category of Object.keys(baseline.categories)) {
    try {
      assert.equal(typeof queries[category], 'string', `BLOCK: missing semantic query ${category}`)
      const result = await client.query(queries[category])
      assert.equal(result.rows.length, 1, `BLOCK: ${category} query envelope`)
      const { row_count: rowCount, payload_bytes: payloadBytes } = result.rows[0]
      assert(Number(rowCount) <= 4096 && Number(payloadBytes) <= 2 * 1024 * 1024,
        `BLOCK: ${category} result cap`)
      const payload = parseCatalogPayload(result.rows[0].payload)
      if (category === 'relations') rawRelations.push(...payload)
      const projected = projectCatalog(category, payload, rawRelations)
      observed[category] = { rows: projected.length, sha256: catalogSha256(projected),
        match: projected.length === baseline.categories[category].rows &&
          catalogSha256(projected) === baseline.categories[category].sha256 }
      if (!observed[category].match) {
        throw Object.assign(new Error(`BLOCK: semantic catalog mismatch in ${category}`), {
          issue158Code: `SEMANTIC_CATALOG_${category.toUpperCase().replaceAll('-', '_')}`,
          issue158Observed: { category, expected: baseline.categories[category], observed: observed[category] },
        })
      }
    } catch (error) {
      if (/^[0-9A-Z]{5}$/.test(error?.code ?? '')) {
        error.issue158Code = `SEMANTIC_QUERY_${category.toUpperCase().replaceAll('-', '_')}_SQLSTATE_${error.code}`
      } else if (error?.code === 'ERR_ASSERTION') {
        error.issue158Code = `SEMANTIC_CATALOG_${category.toUpperCase().replaceAll('-', '_')}`
      }
      throw error
    }
  }
  return { projection: baseline.projection, categories: observed, ddlSemanticSha256: baseline.ddlSemanticSha256,
    sourceAcceptanceSha256: baseline.sourceAcceptanceSha256 }
}

function pythonJson(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value).replace(/[\u007f-\uffff]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`)
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(', ')}]`
  return `{${Object.keys(value).sort().map((key) => `${pythonJson(key)}: ${pythonJson(value[key])}`).join(', ')}}`
}
