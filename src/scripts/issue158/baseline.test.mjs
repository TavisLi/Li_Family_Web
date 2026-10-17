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
  const historicalPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  historicalPackage.dependencies.payload = '3.90.1'
  historicalPackage.dependencies['@payloadcms/db-postgres'] = '3.90.1'
  await writeFile(path.join(temp, 'package.json'), JSON.stringify(historicalPackage))
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

async function candidateFixture(t) {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'issue158-runtime-'))
  t.after(() => rm(temp, { recursive: true, force: true }))
  const bindingPath = 'scripts/rehearsal/baselines/issue158-v12/runtime-payload-3.90.2.json'
  const binding = JSON.parse(await readFile(path.join(root, bindingPath), 'utf8'))
  for (const name of ['package.json', '.nvmrc', '.node-version', bindingPath,
    'scripts/rehearsal/baselines/issue158-v12/baseline.json', ...Object.keys(binding.files)]) {
    await mkdir(path.dirname(path.join(temp, name)), { recursive: true })
    await copyFile(path.join(root, name), path.join(temp, name))
  }
  for (const [name, version] of Object.entries(binding.packages)) {
    const directory = path.join(temp, 'node_modules', name)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ version }))
  }
  return temp
}

test('candidate runtime rejects the original mixed Payload family', async (t) => {
  const temp = await candidateFixture(t)
  const pkg = JSON.parse(await readFile(path.join(temp, 'package.json'), 'utf8'))
  pkg.dependencies['@payloadcms/db-postgres'] = '3.90.1'
  await writeFile(path.join(temp, 'package.json'), JSON.stringify(pkg))
  await assert.rejects(verifyBaseline(temp), /Payload family mismatch/)
})

test('candidate runtime rejects historical baseline edits', async (t) => {
  const temp = await candidateFixture(t)
  const file = path.join(temp, 'scripts/rehearsal/baselines/issue158-v12/baseline.json')
  await writeFile(file, (await readFile(file, 'utf8')) + '\n')
  await assert.rejects(verifyBaseline(temp), /historical baseline drift/)
})

test('candidate runtime rejects installed adapter drift', async (t) => {
  const temp = await candidateFixture(t)
  await writeFile(path.join(temp, 'node_modules/@payloadcms/db-postgres/package.json'), '{"version":"3.90.1"}')
  await assert.rejects(verifyBaseline(temp), /installed Payload family mismatch/)
})

test('candidate runtime rejects lockfile drift', async (t) => {
  const temp = await candidateFixture(t)
  await writeFile(path.join(temp, 'pnpm-lock.yaml'), 'drift')
  await assert.rejects(verifyBaseline(temp), /runtime binding drift/)
})
