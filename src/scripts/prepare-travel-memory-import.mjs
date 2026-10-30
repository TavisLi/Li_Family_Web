import assert from 'node:assert/strict'
import path from 'node:path'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {compileReviewedDailyPlan} from './travel-memory-import-plan.mjs'
import {prepareMediaUploadInputs} from './travel-memory-media-transfer.mjs'
import {sha256} from './travel-memory-review.mjs'

export async function prepareTravelMemoryImport(config){
  const read=async p=>JSON.parse(await readFile(p)),sourceBytes=await readFile(config.source),model=await read(config.model),decisions=await read(config.decisions),registry=await read(config.registry)
  assert.equal(sha256(sourceBytes),config.sourceSha256,'BLOCK: accepted Source bytes changed');assert.equal(model.modelSha256,config.modelSha256,'BLOCK: accepted model changed')
  const plan=compileReviewedDailyPlan({sourceBytes,model,decisions,registry}),entries=await prepareMediaUploadInputs({assets:plan.uploads,registry,photoRoot:config.photoRoot})
  await mkdir(config.output,{mode:0o700}) // must be a fresh output; never clobber an old batch
  const save=(name,v)=>writeFile(path.join(config.output,name),JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600})
  await writeFile(path.join(config.output,'accepted-source.md'),sourceBytes,{flag:'wx',mode:0o600});await save('registry.base.json',registry);await save('daily-import-plan.json',plan)
  await save('upload-inputs.json',{kind:'verified-media-inputs-v1',slug:plan.slug,sourceSha256:plan.sourceSha256,count:entries.length,entrySetSha256:sha256(entries),totalBytes:entries.reduce((n,e)=>n+e.byteSize,0),entries,uploadAuthorized:false})
  const summary={sourceSha256:plan.sourceSha256,moments:plan.moments.length,placements:plan.placements.length,oldOccurrences:plan.oldToNew.length,removals:plan.removals.length,omissions:plan.omissions.length,moves:plan.placements.filter(p=>p.action==='move').length,uploads:entries.length,uploadBytes:entries.reduce((n,e)=>n+e.byteSize,0),freshCurrent:false,applyReady:false}
  await save('summary.json',summary);return summary
}
if(import.meta.url===`file://${process.argv[1]}`){assert.equal(process.argv.length,3,'Usage: node --import tsx src/scripts/prepare-travel-memory-import.mjs <config.json>');console.log(JSON.stringify(await prepareTravelMemoryImport(JSON.parse(await readFile(process.argv[2])))))}
