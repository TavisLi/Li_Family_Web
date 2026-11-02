import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

const runtimeModule = () => import('./payload-runtime.mjs')
async function owned(t) {
 const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'issue180-runtime-')))
 t.after(()=>rm(directory,{recursive:true,force:true}))
 const runId='issue180-'+ 'a'.repeat(32), owner={version:1,runId,directory,database:'issue180_'+ 'a'.repeat(32),nonce:'b'.repeat(64)}
 await mkdir(path.join(directory,'socket'));await mkdir(path.join(directory,'home'))
 await writeFile(path.join(directory,'owner.json'),JSON.stringify(owner))
 return {owner,root:process.cwd(),options:{uri:`postgresql://postgres@localhost:5432/${owner.database}?host=${encodeURIComponent(path.join(directory,'socket'))}`}}
}
test('bootstrap refuses absent ownership and remote/default/extra URI before runtime import',async t=>{
 const {bootstrapPayload}=await runtimeModule(), valid=await owned(t)
 let imports=0;const deps={importRuntime:async()=>{imports++;throw Error('should not import')}}
 for(const args of [{},{...valid,owner:undefined},{...valid,options:{}},...[
  'postgresql://postgres@remote/db','postgresql://postgres:password@localhost:5432/db',valid.options.uri+'&sslmode=disable',valid.options.uri.replace('%2Fsocket','%2Felsewhere'),valid.options.uri.replace('/issue180_','/other_'),
 ].map(uri=>({...valid,options:{uri}}))]) await assert.rejects(()=>bootstrapPayload(args,deps),/BLOCK/)
 assert.equal(imports,0)
})
test('bootstrap uses isolated real collection config, explicit connection and no plugins or schema push',async t=>{
 const {bootstrapPayload,buildRehearsalConfig}=await runtimeModule(), args=await owned(t)
 const config=await buildRehearsalConfig(args)
 assert.deepEqual(config.collections.filter(c=>!c.slug.startsWith('payload-')).map(c=>c.slug),['users','media','travel-plans','travel-memories','travel-memory-days','travel-route-identities'])
 assert.equal(config.localization.defaultLocale,'zh-TW');assert.deepEqual(config.localization.localeCodes,['zh-TW','en'])
 assert.equal(config.plugins.length,0);assert.equal(config.onInit,undefined)
 assert.equal(config.db.name,'postgres')
 const adapter=config.db.init({payload:{config,logger:{}}})
 assert.equal(adapter.push,false);assert.equal(adapter.disableCreateDatabase,true)
 assert.equal(adapter.poolOptions.connectionString,args.options.uri)
 assert.equal(adapter.poolOptions.max,3)
 await assert.rejects(()=>config.email({}).sendEmail({}),/EMAIL_FORBIDDEN/)
 let passed,closed=0
 const payload={destroy:async()=>closed++}
 const result=await bootstrapPayload(args,{importRuntime:async()=>({buildRehearsalConfig,getPayload:async options=>{passed=options;return payload}})})
 assert.equal(result.payload,payload);assert.equal(passed.disableOnInit,true);assert.equal(passed.key,undefined)
 await result.close();assert.equal(closed,1)
})
test('synthetic image-resizing collections provide sharp and do not trigger the Payload warning',async t=>{
 const {buildRehearsalConfig}=await runtimeModule(),args=await owned(t),config=await buildRehearsalConfig(args)
 const installedSharp=(await import('sharp')).default
 const resizingEnabled=config.collections.some(collection=>collection.upload?.imageSizes||collection.upload?.formatOptions)
 assert.equal(resizingEnabled,true)
 assert.equal(config.sharp,installedSharp)
 assert.equal(!config.sharp&&resizingEnabled,false,'Payload would emit its image-resizing sharp warning')
})
test('synthetic image-resizing config blocks when sharp is missing',async t=>{
 const {buildRehearsalConfig,assertImageProcessingConfigured}=await runtimeModule(),args=await owned(t),config=await buildRehearsalConfig(args)
 assert.throws(()=>assertImageProcessingConfigured(config.collections,undefined),/SYNTHETIC_SHARP_REQUIRED/)
 assert.doesNotThrow(()=>assertImageProcessingConfigured(config.collections,config.sharp))
})
test('fixture has deterministic owned identities, bilingual content and no asset/upload requests',async()=>{
 const {fixtureSources}=await runtimeModule()
 const a=fixtureSources(),b=fixtureSources();assert.deepEqual(a,b)
 assert.equal(a.v2Source.locale,'zh-TW');assert.equal(a.v2Source.assets,undefined)
 assert.ok(a.legacyMemorySource.dailyItinerary[0].segments.length)
 assert.equal(a.geo.crs,'WGS84');assert.equal(a.geo.name.en,'Synthetic place')
 assert.equal(a.geoAlternate.latitude,24.15)
 assert.ok(a.legacyPlanSource.sourceSections[0].anchor)
})
test('real route factories and aliased product imports load from owned cwd with sanitized environment and no Payload bootstrap',async t=>{
 const args=await owned(t),file=path.join(args.root,'src/scripts/issue180/payload-runtime.mjs')
 const source=`import {buildRehearsalConfig,importProduct} from ${JSON.stringify('file://'+file)};
 const args=${JSON.stringify(args)};
 const config=await buildRehearsalConfig(args);
 const {createRequire}=await import('node:module');const require=createRequire(${JSON.stringify('file://'+await realpath('node_modules/@payloadcms/db-postgres/package.json'))});
 const {Client}=require('pg');const client=new Client({connectionString:args.options.uri});
 if(client.connectionParameters.host!==args.owner.directory+'/socket'||client.connectionParameters.database!==args.owner.database)throw Error('UNIX_SOCKET_URI_PARSE');
 await importProduct(args.root,'scripts/phase19-travel-memory-backfill.ts');
 const routes=await import(${JSON.stringify('file://'+await realpath('node_modules/@payloadcms/next/dist/exports/routes.js'))});
 if(typeof routes.REST_GET(config)!=='function'||typeof routes.GRAPHQL_POST(config)!=='function')throw Error('ROUTE_FACTORY');
 console.log('CONFIG_ONLY_NO_DATABASE');`
 const result=spawnSync(process.execPath,['--conditions=react-server','--input-type=module','-e',source],{cwd:path.join(args.owner.directory,'home'),encoding:'utf8',timeout:20000,maxBuffer:100000,env:{PATH:'/usr/bin:/bin',HOME:path.join(args.owner.directory,'home'),NODE_ENV:'production'}})
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/CONFIG_ONLY_NO_DATABASE/)
})
test('synthetic user fixtures pass actual required familyRole choices without DB',async()=>{
 const {loadFixture,importProduct}=await runtimeModule(),{Users}=await importProduct(process.cwd(),'payload/collections/Users.ts')
 const field=Users.fields.find(x=>x.name==='familyRole'),choices=field.options.map(x=>x.value),seen=[]
 const {select}=await import(await realpath('node_modules/payload/dist/fields/validations.js'))
 const options={options:field.options,required:true,req:{t:key=>key}}
 assert.equal(select('family',options),true);assert.equal(select('invalid-role',options),'validation:invalidSelection');assert.equal(select(undefined,options),'validation:required')
 const payload={create:async args=>{if(args.collection!=='users')throw Error('STOP_AFTER_USERS');seen.push(args.data);assert.equal(select(args.data.familyRole,options),true,'INVALID_FAMILY_ROLE');return {...args.data,id:seen.length}}}
 await assert.rejects(loadFixture({payload,root:process.cwd()}),/STOP_AFTER_USERS/)
 assert.equal(seen.length,2);assert(!choices.includes('invalid-role'))
})
