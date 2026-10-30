import assert from 'node:assert/strict'
import test from 'node:test'
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {scanTravelMedia} from './travel-memory-media-intake.ts'
import {prepareTravelReview} from './prepare-travel-memory-review.mjs'
import {prepareTravelMemoryImport} from './prepare-travel-memory-import.mjs'
import {sha256} from './travel-memory-review.mjs'

test('synthetic folder → metadata → HTML review → hash-bound decisions → import inputs; no private files or network',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'issue134-workflow-'))
 try{
  const input=path.join(root,'photos');await mkdir(input)
  const xmp='<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:exif="http://ns.adobe.com/exif/1.0/"><photoshop:Title>Synthetic title</photoshop:Title><exif:UserComment>Synthetic comment</exif:UserComment></rdf:Description></rdf:RDF></x:xmpmeta>'
  const bytes=await sharp({create:{width:2,height:3,channels:3,background:'#ffffff'}}).jpeg().withXmp(xmp).toBuffer()
  await writeFile(path.join(input,'synthetic.jpeg'),bytes)
  const slug='synthetic-workflow',scan=await scanTravelMedia(input,slug,path.join(root,'scan'))
  assert.deepEqual(scan.registry.assets[0].embeddedCaptionCandidates,['Synthetic title','Synthetic comment'])
  const assetId=scan.registry.assets[0].assetId
  const source='---\nsourceVersion: 2\nlocale: zh-TW\ntitle: Synthetic workflow\nslug: '+slug+'\nstartDate: "2099-01-01"\nendDate: "2099-01-01"\nisPrivate: true\n---\n\n```memory-day\n'+JSON.stringify({day:1,title:'合成每日',moments:[{scene:'one',momentKey:'synthetic-moment',title:'合成片段',placements:[{type:'photo',media:assetId,role:'inline',caption:'合成圖說'}]}]})+'\n```\n'
  const save=async(name,value)=>{const file=path.join(root,name);await writeFile(file,typeof value==='string'?value:JSON.stringify(value));return file}
  const sourceFile=await save('source.md',source),batch=await save('batch.json',{batchId:'synthetic-batch',sourceSha256:sha256(source)})
  const priorRegistry=await save('prior.json',{version:1,travelSlug:slug,assets:[]})
  const day={id:101,memory:2,day:1,dayKey:'day-01',title:'Synthetic saved day',moments:[]}
  const current=await save('current.json',{days:[day],english:[structuredClone(day)]})
  const review=path.join(root,'review')
  await prepareTravelReview({batch,original:sourceFile,source:sourceFile,current,priorRegistry,scannedRegistry:path.join(root,'scan/registry.json'),photoRoot:input,output:review,freshness:{synthetic:true}})
  const model=JSON.parse(await readFile(path.join(review,'review-model.json')))
  assert.equal(model.placements.length,1);assert.equal(model.placements[0].thumbnailAvailable,true)
  assert((await readFile(path.join(review,'review.html'),'utf8')).includes("connect-src 'none'"))
  const decisions=await save('decisions.json',{modelSha256:model.modelSha256,sourceSha256:model.sourceSha256,removals:{},placements:{[model.placements[0].reviewId]:{destination:model.moments[0].reviewId,order:0,caption:'合成圖說',role:'inline'}}})
  const config={source:sourceFile,sourceSha256:sha256(source),model:path.join(review,'review-model.json'),modelSha256:model.modelSha256,decisions,registry:path.join(review,'registry.json'),photoRoot:input,output:path.join(root,'import')}
  const summary=await prepareTravelMemoryImport(config)
  assert.equal(summary.moments,1);assert.equal(summary.placements,1);assert.equal(summary.uploads,1);assert.equal(summary.applyReady,false)
  assert.equal((await readFile(path.join(config.output,'accepted-source.md'),'utf8')),source)
  await assert.rejects(prepareTravelMemoryImport({...config,sourceSha256:'0'.repeat(64),output:path.join(root,'bad')}),/Source bytes changed/)
  await assert.rejects(prepareTravelMemoryImport(config),/EEXIST/)
 }finally{await rm(root,{recursive:true,force:true})}
})
