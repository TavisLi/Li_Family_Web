import assert from 'node:assert/strict'
import test from 'node:test'
import {syntheticDailyFixture} from './fixtures/travel-memory-daily-synthetic.mjs'
const {graph,plan,registry,counts}=syntheticDailyFixture()
test('SQL/Payload equivalence permits timestamp encoding and absent nullable fields only',async()=>{
 const {assertDailyGraphEquivalent}=await import('./travel-memory-daily-boundary.mjs')
 const other=structuredClone(graph)
 for(const d of [...other.fresh,...other.english]){if(d.date!==null)d.date=new Date(d.date).toISOString();d.createdAt=new Date(d.createdAt).toISOString();d.updatedAt=new Date(d.updatedAt).toISOString();if(d.lodging===null)delete d.lodging}
 assert.equal(assertDailyGraphEquivalent(graph,other).status,'PASS')
 for(const change of [g=>g.fresh[8].moments.reverse(),g=>g.fresh[8].id++,g=>g.fresh[0].moments[0].id='changed',g=>g.english[0].title='',g=>g.fresh[0].sourceMetadata.baseProjection={changed:true},g=>g.fresh[0].moments[0].placements[0].media=null]){
  const drift=structuredClone(other);change(drift);assert.throws(()=>assertDailyGraphEquivalent(graph,drift),/DAILY_/)
 }
})
test('semantic boundary refuses unknown locales and duplicate IDs',async()=>{
 const {assertDailyGraphEquivalent}=await import('./travel-memory-daily-boundary.mjs')
 const drift=structuredClone(graph);drift.fresh[1].id=drift.fresh[0].id
 assert.throws(()=>assertDailyGraphEquivalent(graph,drift))
})
test('daily runner carries untranslated English without weakening Chinese title validation or shared schema',async()=>{
 const {dailyPayloadConfig}=await import('./travel-memory-daily-config.mjs')
 const validate=v=>v?'valid':'required'
 const source={collections:[{slug:'travel-memory-days',versions:{drafts:true,maxPerDoc:30},fields:[{name:'title',localized:true,required:true,validate},{name:'moments',type:'array',fields:[{name:'title',localized:true,required:true,validate}]}]}]}
 const result=dailyPayloadConfig(source),title=result.collections[0].fields[0]
 assert.equal(await title.validate(null,{req:{locale:'en'}}),true)
 assert.equal(await title.validate(null,{req:{locale:'zh-TW'}}),'required')
 assert.equal(title.required,true);assert.equal(source.collections[0].versions.maxPerDoc,30);assert.equal(source.collections[0].fields[0].validate,validate)
})
test('formal materialization binds every new placement key deterministically and preserves accepted existing keys',async()=>{
 const {materializeFormalDailyGraph}=await import('./travel-memory-daily-boundary.mjs')
 const {sha256}=await import('./travel-memory-review.mjs')
 const before=structuredClone(plan),options={fresh:graph.fresh,english:graph.english,expectedGraphSha256:sha256({fresh:graph.fresh,english:graph.english}),registry}
 const a=materializeFormalDailyGraph(plan,options),b=materializeFormalDailyGraph(plan,options)
 assert.deepEqual(a,b);assert.deepEqual(plan,before)
 let generated=0
 for(const d of a)for(const m of d.zh.moments)for(const [i,p]of m.placements.entries()){
  assert(p.placementKey)
  const row=plan.placements.find(r=>r.dayKey===d.zh.dayKey&&r.momentKey===m.momentKey&&r.order===i)
  if(row.placementKey)assert.equal(p.placementKey,row.placementKey);else generated++
  assert.equal(d.en.moments.find(e=>e.momentKey===m.momentKey).placements[i].placementKey,p.placementKey)
 }
 assert.equal(generated,counts.generated)
})
test('identity ledger includes empty Moments and resolves moved old IDs by their bound origin keys',async()=>{
 const {materializeFormalDailyGraph,dailyIdentityLedger}=await import('./travel-memory-daily-boundary.mjs')
 const {sha256}=await import('./travel-memory-review.mjs')
 const expected=materializeFormalDailyGraph(plan,{fresh:graph.fresh,english:graph.english,expectedGraphSha256:sha256({fresh:graph.fresh,english:graph.english}),registry})
 const ledger=dailyIdentityLedger(plan,graph,{fresh:expected.map(d=>d.zh),english:expected.map(d=>d.en)},{pending:true})
 assert.equal(ledger.moments.length,counts.moments);assert.equal(ledger.placements.length,counts.placements);assert.equal(ledger.removals.length,counts.removals);assert.equal(ledger.omissions.length,counts.omissions)
 assert(ledger.placements.filter(p=>p.action==='move').every(p=>p.oldId&&p.newKey&&p.oldAnchor&&p.newAnchor))
})
test('daily runner treats runtime warnings as terminal and disables all email sends',async()=>{
 const {dailyPayloadConfig}=await import('./travel-memory-daily-config.mjs')
 const source={collections:[{slug:'travel-memory-days',fields:[]}]}
 const cfg=dailyPayloadConfig(source)
 assert.throws(()=>cfg.logger.options.hooks.logMethod([],()=>{},40),/DAILY_RUNTIME_WARNING/)
 await assert.rejects(cfg.email().sendEmail({}),/DAILY_EMAIL_FORBIDDEN/)
})
