import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, lstat, readFile, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createC0Evidence } from './phase21-c0-evidence.mjs'

const run = 'c0-20260905T010203004Z'
const temp = () => mkdtemp(join(tmpdir(), 'phase21-c0-evidence-test-'))
test('private snapshot and checkpoints are exclusive and readable', async () => {
  const parent = join(await temp(), 'private')
  const evidence = await createC0Evidence(parent, run)
  const checkpoint = await evidence.checkpoint({ label: 'before:begin', queryCount: 1, state: 'STARTED' })
  const snapshot = await evidence.snapshot({ rows: [] })
  assert.equal((await lstat(parent)).mode & 0o777, 0o700)
  assert.equal((await lstat(evidence.runPath)).mode & 0o777, 0o700)
  assert.equal((await lstat(snapshot.file)).mode & 0o777, 0o600)
  assert.equal((await lstat(checkpoint.file)).mode & 0o777, 0o600)
  assert.deepEqual(JSON.parse(await readFile(snapshot.file, 'utf8')), { rows: [] })
  await assert.rejects(evidence.snapshot({ overwrite: true }), { code: 'EEXIST' })
  await assert.rejects(createC0Evidence(parent, run), { code: 'EEXIST' })
  assert.deepEqual(JSON.parse(await readFile(snapshot.file, 'utf8')), { rows: [] })
})
test('unsafe directory and symlink are rejected without permission changes', async () => {
  const root = await temp()
  const unsafe = join(root, 'unsafe')
  await mkdir(unsafe, { mode: 0o755 })
  await assert.rejects(createC0Evidence(unsafe, run), /evidence directory/)
  const link = join(root, 'link')
  await symlink(root, link)
  await assert.rejects(createC0Evidence(link, run), /evidence directory/)
})
test('checkpoint rejects raw messages and snapshot size is bounded', async () => {
  const evidence = await createC0Evidence(join(await temp(), 'private'), run)
  await assert.rejects(evidence.checkpoint({ label: 'query', queryCount: 1, state: 'BLOCK', error: 'raw driver output' }), /checkpoint fields/)
  await assert.rejects(evidence.snapshot({ body: 'x'.repeat(2 * 1024 * 1024) }), /evidence byte cap/)
})
test('run identity cannot escape private directory', async () => {
  await assert.rejects(createC0Evidence(join(await temp(), 'private'), '../escape'), /run identity/)
})
