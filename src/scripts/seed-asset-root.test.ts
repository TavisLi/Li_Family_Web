import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSeedContent } from './seed-content'
import { seedAssetRoot } from './seed-asset-root'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const assetRoot = await mkdtemp(path.join(tmpdir(), 'seed-asset-root-'))
const sourcePath = 'travels/202308-east-australia/cover/202308-east-australia-cover-001.jpeg'
const previous = process.env.CONTENT_SOURCE_ASSET_ROOT

try {
  const physicalPath = path.join(assetRoot, sourcePath)
  await mkdir(path.dirname(physicalPath), { recursive: true })
  await writeFile(physicalPath, 'fixture')
  process.env.CONTENT_SOURCE_ASSET_ROOT = assetRoot
  assert.equal(seedAssetRoot(projectRoot), assetRoot)
  const content = await buildSeedContent(projectRoot)
  assert.equal(content.media.length, 1)
  assert.equal(content.media[0]?.sourcePath, `content-source/assets/${sourcePath}`)
  assert.equal(content.media[0]?.absolutePath, physicalPath)
  assert.equal(content.media[0]?.usage, 'cover')
  assert.equal(content.media[0]?.sortOrder, 1)
  await rm(physicalPath)
  await assert.rejects(() => buildSeedContent(projectRoot), /No source images found/)
  process.env.CONTENT_SOURCE_ASSET_ROOT = 'relative-path'
  assert.throws(() => seedAssetRoot(projectRoot), /absolute path/)
} finally {
  if (previous === undefined) delete process.env.CONTENT_SOURCE_ASSET_ROOT
  else process.env.CONTENT_SOURCE_ASSET_ROOT = previous
  await rm(assetRoot, { recursive: true, force: true })
}

console.log('Seed asset root: external physical file retains legacy logical identity PASS')
