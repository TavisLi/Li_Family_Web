import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getPayload } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { familyMediaResponse } from '../lib/data/family-media-response.ts'
import { up as addLegacyObjectKey } from '../migrations/20260926_020144_issue140_media_object_key.ts'
import { up, down } from '../migrations/20261120_112809_family_media_key.ts'
import { familyPhotoIntakeAdapter, prepareFamilyPhoto, runFamilyPhotoIntake } from './travel-memory-family-photo-intake.mjs'
import { observeFamilyMedia } from './travel-memory-family-media-read.mjs'
import { createHash } from 'node:crypto'

const socket = await realpath(process.argv[2])
assert.match(socket,/^\/private\/tmp\/family-media-rehearsal\.[A-Za-z0-9]+$/)
assert.equal((await stat(socket)).uid,process.getuid())
assert.equal((await stat(socket)).mode & 0o077,0)
assert((await stat(path.join(socket,'.s.PGSQL.59744'))).isSocket())
const pool = {host:socket,port:59744,user:'fixture',password:'fixture-only',database:'postgres',ssl:false}
const {Client} = createRequire(import.meta.resolve('@payloadcms/db-postgres'))('pg')
const client = new Client(pool)
await client.connect()
try {
  assert.deepEqual((await client.query("SELECT current_setting('data_directory') dir, current_setting('listen_addresses') tcp")).rows[0],
    {dir:path.join(socket,'db'),tcp:''})
  assert.equal((await client.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,0)
  const config = await (await import('../payload/payload.config.ts')).default
  const media = config.collections.find(c => c.slug==='media')
  media.upload.staticDir=path.join(socket,'native-media')
  const payload=await getPayload({config:{...config,telemetry:false,typescript:{...config.typescript,autoGenerate:false},
    db:postgresAdapter({pool,push:true})}})
  let readPayload
  try {
    const legacyAlias = 'travels/disposable-family/legacy.jpeg'
    const publicPhoto = await payload.create({collection:'media',data:{type:'photo',altText:'Legacy public fixture',sourcePath:legacyAlias}})
    const migration = {db:payload.db.drizzle,payload}
    await addLegacyObjectKey(migration)
    await down(migration)
    const publicBefore = (await client.query('SELECT type,filename FROM media WHERE id=$1',[publicPhoto.id])).rows[0]
    await up(migration)
    assert.deepEqual((await client.query('SELECT type,filename FROM media WHERE id=$1',[publicPhoto.id])).rows[0], publicBefore)
    const user = await payload.create({collection:'users', data:{email:'family@example.invalid',password:'fixture-only-password',
      displayName:'Family fixture',slug:'family-fixture',role:'family',familyRole:'father'}})
    const admin = await payload.create({collection:'users', data:{email:'admin@example.invalid',password:'fixture-only-password',
      displayName:'Admin fixture',slug:'admin-fixture',role:'admin',familyRole:'father'}})
    const actors = { writer: { ...admin, collection: 'users' }, reader: { ...user, collection: 'users' } }
    await assert.rejects(payload.create({ collection: 'media', overrideAccess: false, user: actors.reader,
      data: { type: 'photo', altText: 'Denied fixture' } }))
    readPayload=await getPayload({key:'family-media-readback',config:{...config,telemetry:false,
      typescript:{...config.typescript,autoGenerate:false},db:postgresAdapter({pool,push:false})}})
    assert.notEqual(readPayload.db.pool,payload.db.pool)
    const original=await sharp({create:{width:16,height:16,channels:3,background:'#419359'}}).jpeg().toBuffer()
    const key=createHash('sha256').update(original).digest('hex')
    const assetId=`sha256:${key}`
    const {objects}=await prepareFamilyPhoto(original,assetId)
    const stored=new Map()
    const bucket='disposable-family'
    const guard=()=>{}
    const storageConfig={maxAttempts:async()=>1}
    const adapter=await familyPhotoIntakeAdapter({bucket,payload,readPayload,guard,actors,
      writeStorage:{config:storageConfig,async send(command,{abortSignal}) {
        assert.equal(command.constructor.name,'PutObjectCommand')
        abortSignal.throwIfAborted()
        const {Bucket,Key,IfNoneMatch}=command.input
        assert.equal(Bucket,bucket)
        assert.equal(IfNoneMatch,'*')
        assert(!stored.has(Key))
        stored.set(Key,command.input)
      }},
      readStorage:{config:storageConfig,async send(command,{abortSignal}) {
        assert.equal(command.constructor.name,'GetObjectCommand')
        abortSignal.throwIfAborted()
        const {Body,ContentLength,ContentType}=stored.get(command.input.Key)
        return {Body:{transformToWebStream:()=>new Blob([Body]).stream()},ContentLength,ContentType}
      }},
    })
    const steps=[]
    const receipts=[]
    const registry={version:1,travelSlug:'disposable-family',assets:[{assetId,filename:'synthetic.jpeg',
      files:['synthetic.jpeg'],mimeType:'image/jpeg',width:16,height:16,byteSize:original.length,
      provenance:'local-file',locators:[]}]}
    const result=await runFamilyPhotoIntake({registry,adapter,guard,loadOriginal:async()=>original,
      checkpoint:async event=>steps.push(event.stage),saveReceipt:async receipt=>receipts.push(receipt),
      plan:{environment:'disposable',slug:registry.travelSlug,mode:'family-photo-create',ownerBasis:'ZERO_OWNER_AND_VERSION',
        bucket,locale:'zh-TW',entries:[{assetId,altText:'Private fixture',objects}]}})
    assert.equal(stored.size,4)
    assert.deepEqual(steps,['OBJECT_INTENT','OBJECT_VERIFIED','OBJECT_INTENT','OBJECT_VERIFIED',
      'OBJECT_INTENT','OBJECT_VERIFIED','OBJECT_INTENT','OBJECT_VERIFIED','MEDIA_INTENT','VERIFIED'])
    assert.equal(receipts[0].originalGetSha256,assetId)
    const saved=await readPayload.findByID({collection:'media',id:result.assets[0].locators[0].payloadId,depth:0})
    const anon = await payload.find({collection:'media',overrideAccess:false,depth:0})
    assert.deepEqual(anon.docs.map(item=>item.id),[publicPhoto.id])
    assert.equal(await payload.findByID({collection:'media',id:saved.id,overrideAccess:false,disableErrors:true}),null)
    const family = async id => payload.findByID({collection:'media',id,overrideAccess:false,depth:0,req:{user}})
    assert.equal((await family(saved.id)).url,`/api/family-media/${saved.id}/original`)
    assert.equal((await family(saved.id)).altText,'Private fixture')
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    try {
      const observations = await observeFamilyMedia({ entries: [
        { assetId }, { assetId: 'sha256:' + 'a'.repeat(64) },
        { assetId: 'sha256:' + 'b'.repeat(64), sourcePath: legacyAlias },
      ], slug: registry.travelSlug, locale: 'zh-TW', query: client.query.bind(client), guard,
      verifyVisibility: async () => {
        const row = (await client.query("SELECT current_user = 'fixture' AS fixture, current_setting('transaction_read_only') AS readonly")).rows[0]
        return row.fixture && row.readonly === 'on'
      } })
      assert.deepEqual(observations.map(({ media }) => media.state), ['FOUND', 'ABSENT_CONFIRMED', 'CONFLICT'])
      assert.equal(observations[0].media.id, saved.id)
      assert.equal(observations[0].media.altTextSha256, createHash('sha256').update('Private fixture').digest('hex'))
    } finally {
      assert.equal((await client.query('ROLLBACK')).command, 'ROLLBACK')
    }
    const png=path.join(socket,'synthetic.jpeg')
    await sharp({create:{width:16,height:16,channels:3,background:'#419359'}}).jpeg().toFile(png)
    await assert.rejects(payload.create({collection:'media',filePath:png,
      data:{type:'photo',altText:'Unsafe fixture',familyAssetKey:'b'.repeat(64)}}),/private object store/)
    await assert.rejects(payload.update({collection:'media',id:saved.id,data:{familyAssetKey:null}}),/cannot be changed/)
    await assert.rejects(down(migration),/Family Media access boundary still in use/)
    assert.equal((await client.query('SELECT family_asset_key FROM media WHERE id=$1',[saved.id])).rows[0].family_asset_key,key)
    const familyResponse=await familyMediaResponse({id:String(saved.id),variant:'original',canReadFamily:true,
      findFamilyKey:async id=>(await family(id)).familyAssetKey,
      getPrivatePhoto:async objectKey=>{
        assert.equal(objectKey,`family-media/${key}/original.jpeg`)
        const bytes=stored.get(objectKey).Body
        return {body:new Blob([bytes]).stream(),bytes:bytes.length,mimeType:'image/jpeg'}
      }})
    assert.deepEqual(Buffer.from(await familyResponse.arrayBuffer()),original)
    assert.equal(familyResponse.headers.get('cache-control'),'private, no-store')
    console.log(JSON.stringify({status:'PASS_LOCAL_ONLY',publicLegacyPreserved:true,
      anonymousListAndIdDenied:true,familyResponseVerified:true,publicUploadRejected:true,privacyRollbackRefused:true,
      syntheticObjectReadbacks:stored.size,independentMediaReadback:true,exactMediaReconciliation:true}))
  } finally {
    try { await readPayload?.destroy() } finally { await payload.destroy() }
  }
} finally { await client.end() }
