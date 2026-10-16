import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const forbidden = /\b(?:COPY|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|TRUNCATE|SECURITY\s+DEFINER|CREATE\s+(?:FUNCTION|PROCEDURE|EVENT\s+TRIGGER|EXTENSION|FOREIGN\s+DATA\s+WRAPPER|SERVER)|DO\s+\$|PROGRAM)\b/i
const allowed = /^(?:CREATE|ALTER|GRANT|REVOKE|COMMENT|SET|SELECT)\b/i

export async function verifyBaseline(root) {
  const rootPath = await realpath(root)
  const manifestPath = path.join(rootPath, 'scripts/rehearsal/baselines/issue158-v12/baseline.json')
  const baseline = JSON.parse(await readFile(manifestPath, 'utf8'))
  assert.equal(baseline.version, 1)
  assert.equal(baseline.id, 'issue158-v12-semantic')
  assert.equal(baseline.source.scope, 'schema-only')
  const pkg = JSON.parse(await readFile(path.join(rootPath, 'package.json'), 'utf8'))
  assert.equal((await readFile(path.join(rootPath, '.nvmrc'), 'utf8')).trim(), baseline.runtime.node)
  assert.equal((await readFile(path.join(rootPath, '.node-version'), 'utf8')).trim(), baseline.runtime.node)
  assert.equal(pkg.packageManager, `pnpm@${baseline.runtime.pnpm}`)
  assert.equal(pkg.dependencies.payload, baseline.runtime.payload)
  assert.equal(pkg.dependencies['@payloadcms/db-postgres'], baseline.runtime.payload)
  assert.equal(baseline.runtime.postgresMajor, baseline.restore.postgresMajor)
  assert.match(baseline.runtime.ciImage, /^postgres:17\.11@sha256:[a-f0-9]{64}$/)
  assert.deepEqual(baseline.restore.catalogCategories, [
    'relations', 'columns', 'constraints', 'indexes', 'triggers', 'functions', 'types',
    'policies', 'roles', 'memberships', 'migrations', 'default-privileges',
  ])
  const artifact = baseline.artifacts.schema
  assert.equal(artifact.path, 'scripts/rehearsal/baselines/issue158-v12/schema.sql')
  const file = await realpath(path.resolve(rootPath, artifact.path))
  assert(file.startsWith(`${rootPath}${path.sep}`), 'BLOCK: baseline path escapes checkout')
  const bytes = await readFile(file)
  assert.equal(bytes.length, artifact.bytes, 'BLOCK: baseline size drift')
  assert.equal(sha256(bytes), artifact.sha256, 'BLOCK: baseline hash drift')

  const sql = bytes.toString('utf8')
  const content = sql.split('\n').filter((line) => line.trim() && !line.startsWith('--') &&
    !line.startsWith('\\restrict ') && !line.startsWith('\\unrestrict '))
  assert.deepEqual(sql.split('\n').filter((line) => line.startsWith('\\'))
    .map((line) => line.trim()), ['\\restrict Issue158SchemaOnly20261010', '\\unrestrict Issue158SchemaOnly20261010'])
  const statements = content.join('\n').split(';').map((item) => item.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  assert.deepEqual(statements.filter((statement) => /^SELECT\b/i.test(statement)),
    ["SELECT pg_catalog.set_config('search_path', '', false)"])
  assert(!forbidden.test(statements.join('\n')), 'BLOCK: baseline contains data or executable objects')
  assert(statements.every((statement) => allowed.test(statement)),
    'BLOCK: baseline contains an unreviewed statement class')

  for (const [key, expectedPath] of [['catalogQueries', 'scripts/rehearsal/baselines/issue158-v12/catalog-queries.json'],
    ['semanticCatalog', 'scripts/rehearsal/baselines/issue158-v12/semantic-catalog.json']]) {
    const item = baseline.artifacts[key]
    assert.equal(item.path, expectedPath, `BLOCK: ${key} path`)
    assert.equal(sha256(await readFile(path.join(rootPath, item.path))), item.sha256, `BLOCK: ${key} hash drift`)
  }
  const semantic = JSON.parse(await readFile(path.join(rootPath, baseline.artifacts.semanticCatalog.path), 'utf8'))
  assert.equal(semantic.projection, 'issue158-catalog-v1')
  assert.equal(semantic.sourceAcceptanceSha256, 'b8e60df76a0d2a39994c32b6fcae9e6e639427ce95caa3a28bfffd3962906e7d')
  assert.equal(semantic.categories && Object.keys(semantic.categories).length, 12)

  return { id: baseline.id, canonicalSha256: baseline.source.canonicalSha256,
    schemaSha256: sha256(bytes), bytes: bytes.length, statementCount: statements.length,
    postgresMajor: baseline.restore.postgresMajor, catalogCategories: Object.keys(semantic.categories).length,
    semanticCatalogSha256: sha256(await readFile(path.join(rootPath, baseline.artifacts.semanticCatalog.path))),
    migrationRows: baseline.restore.migrationRows, limitations: baseline.limitations }
}
