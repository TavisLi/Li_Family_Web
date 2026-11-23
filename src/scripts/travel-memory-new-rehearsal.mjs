// Run in a clean checkout containing the transactional V2 importer, against an owned empty cluster.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFile, realpath, stat, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import { scanTravelMedia } from './travel-memory-media-intake.ts'
import { parseMemorySourceV2 } from './travel-memory-source-v2.ts'
import { applyReviewedNewMemory, previewNewMemory, readNewMemorySnapshot, verifyNewMemory } from './travel-memory-new-review.mjs'

const socket = await realpath(process.argv[2])
assert.match(socket, /^\/private\/tmp\/memory-rehearsal\.[A-Za-z0-9]+$/)
assert.equal((await stat(socket)).uid, process.getuid())
assert.equal((await stat(socket)).mode & 0o077, 0)
const pool = { host: socket, database: 'postgres', user: 'fixture', port: 59744, password: 'local-only', ssl: false }
const {Client} = createRequire(import.meta.resolve('@payloadcms/db-postgres'))('pg')
const reader = new Client(pool)
await reader.connect()
const server = (await reader.query("select current_setting('data_directory') as dir, current_setting('listen_addresses') as tcp")).rows[0]
assert.deepEqual(server, {dir:path.join(socket,'db'),tcp:''})
assert.equal((await reader.query("select count(*)::integer n from pg_tables where schemaname='public'")).rows[0].n,0)
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const slug = 'new-fixture-' + randomUUID()
const original = path.join(socket, 'originals')
await mkdir(original)
const photo = path.join(original,'tile.jpeg')
await sharp({create:{width:32,height:32,channels:3,background:'#419359'}}).jpeg().toFile(photo)
const {registry} = await scanTravelMedia(original, slug, path.join(socket,'intake'))
const asset = registry.assets[0]
assert.equal(asset.assetId, 'sha256:'+hash(await readFile(photo)))
const sourceBytes = Buffer.from([
  '---','sourceVersion: 2','locale: zh-TW','title: 合成溪畔旅行','slug: '+slug,
  "startDate: '2026-04-03'","endDate: '2026-04-03'",'isPrivate: true','---',
  '# 每日','```memory-day','day: 1','title: 溪畔','moments:','  - scene: 步道',
  '    title: 走到溪畔','    location: 合成步道','    placements:','      - type: photo',
  '        role: inline','        media: '+asset.assetId,'        caption: 綠色方塊','```','',
  '# 資產','```memory-media','assetId: '+asset.assetId,'type: photo','altText: 合成色塊','```','',
].join('\n'))
const source = parseMemorySourceV2(sourceBytes.toString())
const config = await (await import('../payload/payload.config.ts')).default
const uploads = path.join(socket,'media')
config.collections.find(c => c.slug === 'media').upload.staticDir = uploads
function fixtureConfig(push) {
  return { ...config, telemetry: false, typescript: { ...config.typescript, autoGenerate: false },
    db: postgresAdapter({ pool, push }) }
}
const payload = await getPayload({config:fixtureConfig(true)})
let independent
try {
  const publicPhoto = await payload.create({collection:'media',locale:'zh-TW',filePath:photo,data:{type:'photo',altText:'合成色塊'}})
  assert.equal('sha256:'+hash(await readFile(path.join(uploads,publicPhoto.filename))),asset.assetId)
  const photoDoc = await payload.create({collection:'media',locale:'zh-TW',data:{type:'photo',altText:'合成色塊',
    familyAssetKey:asset.assetId.slice('sha256:'.length),mimeType:'image/jpeg',filesize:asset.byteSize}})
  asset.locators.push({environment:'fixture',payloadId:photoDoc.id,verified:true,verifiedByteHash:asset.assetId})
  const other=await payload.create({collection:'travel-memories',locale:'en',data:{slug:'protected-memory',title:'Protected title',startDate:'2026-01-01',endDate:'2026-01-02',isPrivate:true,galleryImages:[publicPhoto.id],_status:'draft'}})
  const tables=(await reader.query("select tablename from pg_tables where schemaname='public' and (tablename like '%travel_memor%' or tablename like '%media%' or tablename like '%travel_route%') order by tablename")).rows
  async function snapshot() {
    const map = new Map()
    for (const {tablename} of tables) {
      assert.match(tablename,/^[a-z0-9_]+$/)
      const rows=(await reader.query('select to_jsonb(t)::text body from public."'+tablename+'" t order by 1')).rows
      map.set(tablename,rows.map(row=>row.body))
    }
    return map
  }
  const before=await snapshot()
  const observed = await readNewMemorySnapshot(payload, source, registry, 'fixture')
  const input = { sourceBytes, registryBytes: Buffer.from(JSON.stringify(registry)), slug,
    environment: 'fixture', inventoryBytes: Buffer.from(JSON.stringify(observed)) }
  const publicRegistry = structuredClone(registry)
  publicRegistry.assets[0].locators[0].payloadId = publicPhoto.id
  const publicPhotoInventory = await readNewMemorySnapshot(payload, source, publicRegistry, 'fixture')
  assert.throws(() => previewNewMemory({ ...input, registryBytes:Buffer.from(JSON.stringify(publicRegistry)),
    inventoryBytes:Buffer.from(JSON.stringify(publicPhotoInventory)) }), /verified private asset key/)
  const wrongVisibility = structuredClone(observed)
  wrongVisibility.inventory.allLocales.media[0].familyAssetKey = null
  assert.throws(() => previewNewMemory({ ...input, inventoryBytes:Buffer.from(JSON.stringify(wrongVisibility)) }),
    /visibility differs across inventory views/)
  assert.throws(() => previewNewMemory({ ...input,
    sourceBytes:Buffer.from(sourceBytes.toString().replace('isPrivate: true','isPrivate: false')) }),
    /visibility does not match/)
  const cli = fileURLToPath(new URL('./travel-memory-new-review.mjs', import.meta.url))
  const runCli = (...args) => JSON.parse(execFileSync(process.execPath, [...process.execArgv, cli, ...args],
    { cwd: socket, encoding: 'utf8', timeout: 15000 }))
  const sourceFile = path.join(socket, 'source.md')
  const registryFile = path.join(socket, 'registry.json')
  const inventoryFile = path.join(socket, 'inventory.json')
  const previewFile = path.join(socket, 'preview.json')
  await Promise.all([[sourceFile, sourceBytes], [registryFile, input.registryBytes], [inventoryFile, input.inventoryBytes]]
    .map(([file, bytes]) => writeFile(file, bytes, { flag: 'wx', mode: 0o600 })))
  assert.deepEqual(runCli('preview', slug, 'fixture', sourceFile, registryFile, inventoryFile, previewFile),
    { status: 'PREVIEW', days: 1, photos: 1 })
  const preview = JSON.parse(await readFile(previewFile))
  assert.equal(preview.status,'PREVIEW')
  assert.equal(preview.photos[0].cameraLocation,'NO_GPS')
  assert.equal(preview.photos[0].geoAdopted,false)
  assert.equal(preview.photos[0].sceneLocation,'合成步道')
  const gpsRegistry = structuredClone(registry)
  gpsRegistry.assets[0].gps = { latitude: 24, longitude: 121 }
  const gpsPreview = previewNewMemory({ ...input, registryBytes: Buffer.from(JSON.stringify(gpsRegistry)) })
  assert.equal(gpsPreview.photos[0].cameraLocation, 'GPS_REQUIRES_CRS_REVIEW')
  assert.equal(gpsPreview.photos[0].geoAdopted, false)
  const versionOnly = { ...observed, versionCount: 1 }
  assert.throws(() => previewNewMemory({ ...input, inventoryBytes: Buffer.from(JSON.stringify(versionOnly)) }), /version footprint/)
  const changedAlt = Buffer.from(sourceBytes.toString().replace('altText: 合成色塊', 'altText: changed'))
  assert.throws(() => previewNewMemory({ ...input, sourceBytes: changedAlt }))
  const unknown = structuredClone(registry)
  unknown.assets[0].locators = []
  assert.throws(() => previewNewMemory({ ...input, registryBytes: Buffer.from(JSON.stringify(unknown)) }), /BLOCK/)
  const stale = structuredClone(observed)
  stale.inventory.media[0].updatedAt = '2000-01-01T00:00:00.000Z'
  const staleInput = { ...input, inventoryBytes: Buffer.from(JSON.stringify(stale)) }
  const stalePreview = JSON.parse(JSON.stringify(previewNewMemory(staleInput)))
  const apply = (inputs, accepted) => applyReviewedNewMemory(payload, inputs, accepted, 'synthetic-memory.md')
  await assert.rejects(apply(staleInput, stalePreview), /reviewed new Memory inventory/)
  assert.deepEqual(await snapshot(), before)
  const result = await apply(input, preview)
  independent = await getPayload({key:'independent-readback',config:fixtureConfig(false)})
  assert.notEqual(independent.db.pool, payload.db.pool)
  const readback = JSON.parse(JSON.stringify(await readNewMemorySnapshot(independent, source, registry, 'fixture')))
  assert.equal(readback.ownerCount, 1)
  assert.ok(readback.versionCount > 0)
  const accepted=verifyNewMemory(preview,readback,result.memoryId)
  const anonMemory = await independent.findByID({collection:'travel-memories',id:result.memoryId,
    overrideAccess:false,disableErrors:true})
  const anonMedia = await independent.findByID({collection:'media',id:photoDoc.id,overrideAccess:false,disableErrors:true})
  assert.equal(anonMemory,null)
  assert.equal(anonMedia,null)
  const readbackFile = path.join(socket, 'independent-readback.json')
  await writeFile(readbackFile, JSON.stringify(readback), { flag: 'wx', mode: 0o600 })
  assert.deepEqual(runCli('verify', previewFile, readbackFile, String(result.memoryId)), {
    ...accepted, previewSha256: hash(await readFile(previewFile)), readbackSha256: hash(await readFile(readbackFile)),
  })
  assert.deepEqual({ days: accepted.days, moments: accepted.moments, placements: accepted.placements,
    photoPlacements: accepted.photoPlacements, visibility: accepted.visibility, draftStatus: accepted.draftStatus },
  { days: 1, moments: 1, placements: 1, photoPlacements: 1, visibility: 'family', draftStatus: 'draft' })
  const after=await snapshot()
  for (const [table,rows] of before) {
    // Payload can clear latest on its own new revisions. Every pre-existing row
    // belongs to the protected Memory or the independently uploaded Media.
    const observed=new Set(after.get(table))
    for (const row of rows) assert.ok(observed.has(row), 'changed existing row: '+table)
  }
  assert.equal((await reader.query('select count(*)::int n from travel_memories where id=$1 and slug=$2',[result.memoryId,slug])).rows[0].n,1)
  assert.notEqual(result.memoryId,other.id)
  assert.equal((await reader.query('select count(*)::int n from travel_memory_days_moments_placements where media_id=$1',[photoDoc.id])).rows[0].n,1)
  const tampered=structuredClone(readback)
  tampered.inventory.days[0].moments[0].placements[0].caption='wrong'
  assert.throws(()=>verifyNewMemory(preview,tampered,result.memoryId))
  const tamperedFile = path.join(socket, 'tampered-readback.json')
  await writeFile(tamperedFile, JSON.stringify(tampered), { flag: 'wx', mode: 0o600 })
  assert.throws(() => runCli('verify', previewFile, tamperedFile, String(result.memoryId)), error => {
    assert.equal(error.status, 1)
    assert.deepEqual(JSON.parse(error.stdout), { status: 'BLOCK', code: 'DRAFT_READBACK_UNVERIFIED' })
    assert.equal(error.stderr, '')
    return true
  })
  console.log(JSON.stringify({accepted,photos:preview.photos.length,protectedTables:tables.length,
    existingRows:[...before.values()].reduce((n,rows)=>n+rows.length,0),reviewDrift:'ROLLBACK_ZERO_CHANGE',
    unknownLocator:'BLOCK_ZERO_CHANGE',incorrectReadback:'BLOCK',privateMediaBoundary:'PASS',unsafeMediaLocator:'BLOCK'}))
} finally { await reader.end(); await independent?.destroy(); await payload.destroy() }
