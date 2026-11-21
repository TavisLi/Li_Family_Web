import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { open, readFile, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { prepareFamilyPhoto } from './travel-memory-family-photo-intake.mjs'

const [candidatePath, candidateSha, originalDir, outputPath] = process.argv.slice(2)
assert(process.argv.length === 6,
  'Usage: node --import tsx prepare-travel-memory-family-objects.mjs <candidate.json> <candidate-sha256> <originals-dir> <new-output.json>')

const candidateBytes = await readFile(candidatePath)
assert.equal(createHash('sha256').update(candidateBytes).digest('hex'), candidateSha, 'Candidate SHA mismatch')
const candidate = JSON.parse(candidateBytes)
assert(candidate.assets > 0 && candidate.rows.length === candidate.assets, 'Candidate asset count mismatch')
assert.equal(new Set(candidate.rows.map(row => row.assetId)).size, candidate.assets, 'Duplicate candidate asset')
const root = await realpath(originalDir)
const entries = []
let originalBytes = 0
let derivativeBytes = 0

for (const [index, row] of candidate.rows.entries()) {
  try {
    assert.equal(row.mimeType, 'image/jpeg')
    assert(Number.isSafeInteger(row.byteSize) && row.byteSize > 0 && row.byteSize <= 32 * 1024 * 1024)
    const source = await realpath(path.resolve(root, row.relativeOriginals[0]))
    const relative = path.relative(root, source)
    assert(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
    const file = await open(source, 'r')
    let bytes
    try {
      const stat = await file.stat()
      assert(stat.isFile() && stat.size === row.byteSize)
      bytes = Buffer.alloc(row.byteSize)
      assert.equal((await file.read({ buffer: bytes, position: 0 })).bytesRead, row.byteSize)
      assert.equal((await file.stat()).size, row.byteSize)
    } finally { await file.close() }
    const { objects } = await prepareFamilyPhoto(bytes, row.assetId)
    entries.push({ assetId: row.assetId, altTextSha256: row.altTextSha256, objects })
    originalBytes += row.byteSize
    derivativeBytes += objects.filter(object => object.variant !== 'original').reduce((sum, object) => sum + object.bytes, 0)
  } catch {
    throw new Error(`Family photo preparation failed at candidate row ${index + 1}`)
  }
}

assert.equal(originalBytes, candidate.totalBytes, 'Candidate original byte count mismatch')
const summary = { status: 'OFFLINE_OBJECTS_PREPARED', assets: entries.length,
  objectCount: entries.reduce((sum, entry) => sum + entry.objects.length, 0), originalBytes, derivativeBytes }
const output = { ...summary, candidateSha256: candidateSha, slug: candidate.slug,
  encoder: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, mozjpeg: sharp.versions.mozjpeg,
    platform: process.platform, architecture: process.arch },
  productionPresence: 'UNKNOWN', liveApproved: false, entries }
const serialized = JSON.stringify(output, null, 2) + '\n'
await writeFile(outputPath, serialized, { flag: 'wx', mode: 0o600 })
console.log(JSON.stringify({ ...summary, outputSha256: createHash('sha256').update(serialized).digest('hex') }))
