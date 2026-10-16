import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { verifyBaseline } from './baseline.mjs'

const root = path.resolve(new URL('../../..', import.meta.url).pathname)

test('versioned Issue 158 baseline is hash-bound and declares deferred limits', async () => {
  const result = await verifyBaseline(root)
  assert.equal(result.schemaSha256, '0fd2766bd5e825861696f60f9578e5b2d4997f07996f7de2eac91b43a70b69a1')
  assert.equal(result.catalogCategories, 12)
  assert(result.statementCount > 1000)
  assert(result.limitations.includes('migration readiness BLOCK'))
  assert(result.limitations.includes('platform and collation equivalence UNKNOWN'))
})

test('baseline verifier rejects data commands and hash drift in an isolated fixture', async (t) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'issue158-baseline-'))
  t.after(() => rm(temp, { recursive: true, force: true }))
  const directory = path.join(temp, 'scripts/rehearsal/baselines/issue158-v12')
  await mkdir(directory, { recursive: true })
  await copyFile(path.join(root, 'package.json'), path.join(temp, 'package.json'))
  await copyFile(path.join(root, '.nvmrc'), path.join(temp, '.nvmrc'))
  await copyFile(path.join(root, '.node-version'), path.join(temp, '.node-version'))
  const manifest = JSON.parse(await readFile(path.join(root, 'scripts/rehearsal/baselines/issue158-v12/baseline.json'), 'utf8'))
  const malicious = Buffer.from("\\restrict Issue158SchemaOnly20261010\nSELECT pg_catalog.set_config('search_path', '', false);\nINSERT INTO public.users VALUES (1);\n\\unrestrict Issue158SchemaOnly20261010\n")
  manifest.artifacts.schema = { path: 'scripts/rehearsal/baselines/issue158-v12/schema.sql',
    sha256: createHash('sha256').update(malicious).digest('hex'), bytes: malicious.length }
  await writeFile(path.join(directory, 'baseline.json'), JSON.stringify(manifest))
  await writeFile(path.join(directory, 'schema.sql'), malicious)
  await assert.rejects(verifyBaseline(temp), /baseline contains data or executable objects/)
})
