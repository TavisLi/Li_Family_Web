import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'
export const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export async function verifyBinding(root, binding) {
  assert.equal(binding.version, 1)
  assert.equal(process.versions.node, binding.node, 'Node version mismatch')
  const read = name => readFile(path.join(root, name), 'utf8')
  for (const [name, digest] of Object.entries(binding.files)) {
    assert(!path.isAbsolute(name) && !name.split('/').includes('..'), 'unsafe binding path')
    assert.equal(hash(await read(name)), digest, `binding drift: ${name}`)
  }
  const historical = JSON.parse(await read(binding.historicalMapping))
  const baseline = JSON.parse(await read(binding.baseline))
  assert.equal(hash(await read(binding.baseline)), historical.baselineManifestSha256)
  assert.equal(hash(await read(binding.historicalLock)), historical.files['pnpm-lock.yaml'])
  assert.equal(baseline.runtime.payload, historical.historicalPayload)
  for (const name of ['pnpm-workspace.yaml', 'patches/@payloadcms__db-postgres@3.90.2.patch']) {
    assert.equal(hash(await read(name)), historical.files[name], `historical compatibility drift: ${name}`)
  }
  // The reviewed lock change is additions only. Any changed/deleted historical line blocks.
  const oldLines = (await read(binding.historicalLock)).split('\n')
  const newLines = (await read('pnpm-lock.yaml')).split('\n')
  let cursor = 0
  for (const line of newLines) if (line === oldLines[cursor]) cursor++
  assert.equal(cursor, oldLines.length, 'lockfile contains changes beyond additive dependency review')
  const pkg = JSON.parse(await read('package.json'))
  assert.equal(pkg.packageManager, 'pnpm@10.28.0')
  const installed = {}
  for (const [name, version] of Object.entries(historical.packages)) {
    assert.equal(pkg.dependencies[name], version, `declared package mismatch: ${name}`)
    const file = path.join(root, 'node_modules', name, 'package.json')
    assert.equal(JSON.parse(await readFile(file, 'utf8')).version, version, `installed version mismatch: ${name}`)
    installed[name] = await realpath(file)
  }
  for (const item of Object.values(baseline.artifacts)) {
    if (item.path && item.sha256) assert.equal(hash(await read(item.path)), item.sha256, 'baseline artifact drift')
  }
  return { status: 'OFFLINE_BINDING_VERIFIED', installed, fidelity: 'UNKNOWN', historicalMappingUnchanged: true }
}
