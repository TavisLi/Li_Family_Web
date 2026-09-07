import assert from 'node:assert/strict'
import { constants } from 'node:fs'
import { lstat, mkdir, open } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

// Parent must already be verified as Git-ignored by the production entrypoint.
export async function createC0Evidence(parent, runId) {
  assert(/^c0-[0-9]{8}T[0-9]{9}Z$/.test(runId), 'BLOCK: run identity')
  await mkdir(parent, { mode: 0o700 }).catch((error) => { if (error.code !== 'EEXIST') throw error })
  async function directory(path) {
    const info = await lstat(path)
    assert(info.isDirectory() && !info.isSymbolicLink() && (info.mode & 0o777) === 0o700, 'BLOCK: evidence directory')
  }
  await directory(parent)
  const runPath = join(parent, runId)
  await mkdir(runPath, { mode: 0o700 }) // Existing run is never resumed or replaced.
  let checkpointNumber = 0
  async function save(name, value) {
    await directory(parent)
    await directory(runPath)
    const body = JSON.stringify(value) + '\n'
    assert(Buffer.byteLength(body) <= 2 * 1024 * 1024, 'BLOCK: evidence byte cap')
    const file = await open(join(runPath, name), constants.O_CREAT | constants.O_EXCL | constants.O_RDWR | constants.O_NOFOLLOW, 0o600)
    try {
      assert(((await file.stat()).mode & 0o777) === 0o600, 'BLOCK: evidence file permissions')
      await file.writeFile(body)
      await file.sync()
      const bytes = Buffer.alloc(Buffer.byteLength(body))
      const { bytesRead } = await file.read(bytes, 0, bytes.length, 0)
      assert.equal(bytesRead, bytes.length, 'BLOCK: evidence incomplete readback')
      assert.equal(bytes.toString(), body, 'BLOCK: evidence readback mismatch')
      return { file: join(runPath, name), sha256: createHash('sha256').update(bytes).digest('hex') }
    } finally { await file.close() }
  }
  return {
    runPath,
    async checkpoint(event) {
      assert.deepEqual(Object.keys(event).sort(), ['label', 'queryCount', 'state'], 'BLOCK: checkpoint fields')
      assert(/^[a-z0-9:-]{1,80}$/.test(event.label), 'BLOCK: checkpoint label')
      assert(['STARTED', 'PASS', 'BLOCK'].includes(event.state), 'BLOCK: checkpoint state')
      assert(Number.isSafeInteger(event.queryCount) && event.queryCount >= 0, 'BLOCK: checkpoint count')
      return save(`checkpoint-${String(++checkpointNumber).padStart(4, '0')}.json`, event)
    },
    snapshot: (value) => save('snapshot.json', value),
  }
}
