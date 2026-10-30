import assert from 'node:assert/strict'
import test from 'node:test'
import {spawnSync} from 'node:child_process'
import {copyFile,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {scanTravelMedia} from './travel-memory-media-intake.ts'
import {validateMediaRegistry} from './travel-memory-media-registry.ts'
import {mergeTechnicalRegistries,prepareMediaUploadInputs} from './travel-memory-media-transfer.mjs'
import {sha256} from './travel-memory-review.mjs'

// Explicit macOS fixture generator; no source photographs are stored in Git.
// Run separately from the portable offline suite: pnpm test:issue134:heic.
test('HEIC original identity survives explicit JPEG derivative preparation',async()=>{
 assert.equal(process.platform,'darwin','This format proof requires the explicit macOS ImageIO fixture generator')
 const root=await mkdtemp(path.join(tmpdir(),'issue134-heic-'))
 const convert=(format,input,output)=>{
  const r=spawnSync('/usr/bin/sips',['-s','format',format,input,'--out',output],{env:{PATH:'/usr/bin:/bin'},encoding:'utf8',timeout:15000})
  assert.equal(r.status,0,'Synthetic ImageIO conversion failed')
 }
 try{
  const originals=path.join(root,'originals'),derivatives=path.join(root,'derivatives')
  await mkdir(originals);await mkdir(derivatives)
  const png=path.join(root,'synthetic.png'),heic=path.join(originals,'synthetic.heic'),jpeg=path.join(derivatives,'synthetic.jpeg')
  await sharp({create:{width:16,height:12,channels:3,background:'#aabbcc'}}).png().toFile(png)
  convert('heic',png,heic)
  const sourceBytes=await readFile(heic);assert.equal(sourceBytes.subarray(4,8).toString(),'ftyp');assert(sourceBytes.subarray(8,32).includes(Buffer.from('heic')))
  await copyFile(heic,path.join(originals,'duplicate.heic'))
  const original=await scanTravelMedia(originals,'synthetic-heic',path.join(root,'original-scan'))
  assert.equal(original.registry.assets.length,1);assert.equal(original.summary.exactDuplicates,1)
  const source=original.registry.assets[0];assert.equal(source.assetId,'sha256:'+sha256(sourceBytes));assert.equal(source.width,16);assert.equal(source.height,12);assert.equal(source.mimeType,'image/heif')
  // HEVC pixel support varies with installed libheif plugins. Conversion is an
  // explicit local step, never a claimed same-byte upload of the original.
  convert('jpeg',heic,jpeg)
  const output=path.join(root,'derivative-scan'),converted=await scanTravelMedia(derivatives,'synthetic-heic',output)
  const derivative={...converted.registry.assets[0],derivedFrom:source.assetId}
  assert.notEqual(derivative.assetId,source.assetId);assert.equal(derivative.mimeType,'image/jpeg')
  assert.equal((await sharp(jpeg).resize(8,8).jpeg().toBuffer()).length>0,true)
  const bound=validateMediaRegistry({...converted.registry,assets:[derivative]},'synthetic-heic')
  await writeFile(path.join(output,'registry.json'),JSON.stringify(bound))
  const again=await scanTravelMedia(derivatives,'synthetic-heic',output)
  assert.equal(again.registry.assets[0].derivedFrom,source.assetId)
  const before=structuredClone(original.registry),merged=mergeTechnicalRegistries(original.registry,again.registry)
  assert.deepEqual(original.registry,before);assert.equal(merged.assets.length,2);assert.deepEqual(merged.assets.find(a=>a.assetId===source.assetId),source)
  const entries=await prepareMediaUploadInputs({assets:[derivative],registry:merged,photoRoot:derivatives})
  assert.equal(entries.length,1);assert.equal(entries[0].assetId,derivative.assetId);assert.equal(entries[0].mimeType,'image/jpeg')
  assert.equal('sha256:'+sha256(await readFile(heic)),source.assetId)
 }finally{await rm(root,{recursive:true,force:true})}
})
