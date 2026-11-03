import assert from 'node:assert/strict'
import path from 'node:path'
import { verifyOwnership } from './lifecycle.mjs'
let productLoader,productRoot
export async function importProduct(root,file) {
 assert(!path.isAbsolute(file) && !file.split('/').includes('..'),'PRODUCT_IMPORT_PATH')
 if(!productLoader) {
  productRoot=root
  const {register}=await import('tsx/esm/api')
  productLoader=register({namespace:'issue180-owned-product',tsconfig:path.join(root,'tsconfig.json')})
 }
 assert.equal(root,productRoot,'PRODUCT_IMPORT_ROOT_CHANGED')
 return productLoader.import(path.join(root,'src',file),import.meta.url)
}

async function validate({owner,options}={}) {
 assert(owner && options?.uri,'BLOCK: explicit owned URI required')
 await verifyOwnership(owner)
 const uri=new URL(options.uri)
 assert(uri.protocol==='postgresql:' && uri.hostname==='localhost' && uri.port==='5432' && uri.username==='postgres' && !uri.password,'BLOCK: non-owned URI')
 assert(uri.pathname==='/'+owner.database && uri.searchParams.get('host')===path.join(owner.directory,'socket'),'BLOCK: target mismatch')
 assert([...uri.searchParams.keys()].length===1,'BLOCK: unexpected URI options')
}
export async function buildRehearsalConfig(args) {
 await validate(args)
 const [{buildConfig},{postgresAdapter},{lexicalEditor},{default:sharp}]=await Promise.all([import('payload'),import('@payloadcms/db-postgres'),import('@payloadcms/richtext-lexical'),import('sharp')])
 const collections=[]
 for(const name of ['Users','Media','TravelPlans','TravelMemories','TravelMemoryDays','TravelRouteIdentities']) {
  const imported=await importProduct(args.root,'payload/collections/'+name+'.ts')
  const collection=imported[name]
  collections.push(name==='Media'?{...collection,upload:{...collection.upload,disableLocalStorage:true,staticDir:path.join(args.owner.directory,'uploads')}}:collection)
 }
 assertImageProcessingConfigured(collections,sharp)
 return buildConfig({collections,secret:'issue180-synthetic-local-secret-only',plugins:[],
  admin:{user:'users'},routes:{api:'/api',graphQL:'/graphql'},
  localization:{locales:['zh-TW','en'],defaultLocale:'zh-TW',fallback:true},custom:{supportedLocales:['zh-TW','en']},
  editor:lexicalEditor(),db:postgresAdapter({push:false,disableCreateDatabase:true,pool:{connectionString:args.options.uri,max:3,connectionTimeoutMillis:5000,idleTimeoutMillis:5000}}),
  email:()=>({name:'issue180-disabled',defaultFromName:'Synthetic',defaultFromAddress:'nobody@synthetic.invalid',sendEmail:async()=>{throw Error('EMAIL_FORBIDDEN')}}),
  sharp,telemetry:false,typescript:{autoGenerate:false},graphQL:{disablePlaygroundInProduction:true},
 })
}
export function assertImageProcessingConfigured(collections,sharp) {
 if(!sharp&&collections.some(collection=>collection.upload?.imageSizes||collection.upload?.formatOptions))throw Error('BLOCK:SYNTHETIC_SHARP_REQUIRED')
}
export async function bootstrapPayload(args,deps={}) {
 await validate(args)
 const runtime=deps.importRuntime?await deps.importRuntime():{buildRehearsalConfig,getPayload:(await import('payload')).getPayload}
 const config=await runtime.buildRehearsalConfig(args)
 const payload=await runtime.getPayload({config,disableOnInit:true})
 return {payload,config,close:async()=>{await payload.destroy()}}
}
export function fixtureSources() {
 const common={title:'Synthetic source',isPrivate:true,startDate:'2028-01-01',endDate:'2028-01-02',externalDocIdentifier:'synthetic-180.md'}
 const geo={name:{'zh-TW':'合成地點',en:'Synthetic place'},latitude:25,longitude:121,crs:'WGS84',provenance:'issue180-private-provenance',originalCRS:null}
 return {geo,geoAlternate:{...geo,latitude:24.15,longitude:120.68,provenance:'issue180-private-alternate'},
  legacyPlanSource:{...common,slug:'synthetic-writer-plan',status:'planning',sourceSections:[{level:2,title:'Synthetic section',anchor:'source-section',body:'Source body'}]},
  legacyMemorySource:{...common,slug:'synthetic-writer-memory',status:'completed',dailyItinerary:[{day:1,date:'1/1',title:'Source day',segments:[{activity:'Source moment'}]}],sourceSections:[]},
  v2Source:{sourceVersion:2,locale:'zh-TW',title:'Synthetic v2',slug:'synthetic-writer-v2',startDate:'2028-01-01',endDate:'2028-01-02',isPrivate:true,days:[{day:1,title:'Source v2 day',moments:[{scene:'source-v2',momentKey:'source-v2-moment',title:'Source v2 moment'}]}]},
 }
}
export async function loadFixture({payload,root}) {
 const sources=fixtureSources(),password='Synthetic-180-only-test-password!'
 const admin=await payload.create({collection:'users',overrideAccess:true,locale:'zh-TW',data:{email:'admin180@synthetic.invalid',password,role:'admin',familyRole:'family',slug:'synthetic-admin-180',displayName:'Synthetic Admin'}})
 const family=await payload.create({collection:'users',overrideAccess:true,locale:'zh-TW',data:{email:'family180@synthetic.invalid',password,role:'family',familyRole:'family',slug:'synthetic-family-180',displayName:'Synthetic Family'}})
 const base={startDate:'2028-01-01',endDate:'2028-01-02',sourceMetadata:{sourceFile:'synthetic-fixture',sourceHash:'issue180-private-base',parserVersion:'phase-17-plan-v1',baseProjection:{sentinel:'issue180-private-base',fixtureGeoCopy:sources.geo,locales:{'zh-TW':{days:{'day-01':{moments:[{momentKey:'synthetic-moment',geo:sources.geo}]}}},en:{days:{'day-01':{moments:[{momentKey:'synthetic-moment',geo:sources.geo}]}}}}}}}
 const create=async(collection,data)=>{
  const doc=await payload.create({collection,locale:'zh-TW',overrideAccess:false,user:admin,data})
  const patch={title:'English '+data.title}
  if(collection==='travel-plans')patch.planningSections=doc.planningSections.map(section=>({id:section.id,anchor:section.anchor,title:'English section',body:'English body',...(section.geoStops?.length?{geoStops:section.geoStops.map(stop=>({id:stop.id,stopKey:stop.stopKey,geo:{name:sources.geo.name.en}}))}:{})}))
  if(collection==='travel-memory-days')patch.moments=doc.moments.map(moment=>({id:moment.id,momentKey:moment.momentKey,title:'English moment',geo:{name:sources.geo.name.en}}))
  await payload.update({collection,id:doc.id,locale:'en',overrideAccess:false,user:admin,data:patch})
  return doc
 }
 const section=()=>[{anchor:'synthetic-section',level:2,title:'合成段落',body:'合成內容',geoStops:[{stopKey:'synthetic-stop',geo:{...sources.geo,name:sources.geo.name['zh-TW'],approval:null}}]}]
 const plan=async(slug,isPrivate,status='published')=>create('travel-plans',{...base,slug,title:slug,isPrivate,_status:status,planningSections:section()})
 const publicPlan=await plan('synthetic-public-plan',false),familyPlan=await plan('synthetic-family-plan',true),draftPlan=await plan('synthetic-draft-plan',false,'draft'),otherPlan=await plan('synthetic-other-plan',true),approvedPlan=await plan('synthetic-public-approved-plan',false)
 const memory=async(slug,isPrivate,status='published')=>create('travel-memories',{...base,slug,title:slug,isPrivate,_status:status,originPlan:publicPlan.id})
 const publicMemory=await memory('synthetic-public-memory',false),familyMemory=await memory('synthetic-family-memory',true),draftMemory=await memory('synthetic-draft-memory',false,'draft')
 const day=async(parent,key,status='published')=>create('travel-memory-days',{memory:parent.id,dayKey:key,day:Number(key.slice(-2)),title:'合成日誌',_status:status,sourceMetadata:base.sourceMetadata,moments:[{momentKey:'synthetic-moment',title:'合成時刻',body:'合成故事',geo:{...sources.geo,name:sources.geo.name['zh-TW'],approval:null},placements:[{placementKey:'synthetic-placement',type:'youtube',youtubeUrl:'https://youtu.be/aqz-KE-bpKQ'}]}]})
 const publicDay=await day(publicMemory,'day-01'),otherDay=await day(publicMemory,'day-02'),familyDay=await day(familyMemory,'day-01'),parentDraftDay=await day(draftMemory,'day-01'),draftDay=await day(publicMemory,'day-03','draft')
 const review=await importProduct(root,'payload/collections/travel-geo-review.ts')
 const {createLocalReq}=await import('payload')
 for(const [kind,id,audience] of [['plan',publicPlan.id,'public'],['plan',approvedPlan.id,'public'],['plan',familyPlan.id,'family'],['plan',draftPlan.id,'public'],['memory',publicDay.id,'public'],['memory',otherDay.id,'public'],['memory',familyDay.id,'family'],['memory',draftDay.id,'public']]) {
  const req=await createLocalReq({user:admin},payload),target=await review.readGeoReviewTarget(req,kind,id)
  await review.reviewTravelGeo(req,kind,id,{action:'approve',audience,expectedRevision:review.geoReviewRevision(target.doc,target.parent),sectionOrDayKey:kind==='plan'?'synthetic-section':target.doc.dayKey,itemKey:kind==='plan'?'synthetic-stop':'synthetic-moment'})
 }
 const adminToken=(await payload.login({collection:'users',data:{email:admin.email,password}})).token
 const familyToken=(await payload.login({collection:'users',data:{email:family.email,password}})).token
 assert(adminToken && familyToken,'FIXTURE_LOGIN_FAILED')
 return {...sources,admin,family,adminToken,familyToken,hiddenSentinel:'issue180-private-base',targetPlanId:publicPlan.id,publicPlanId:publicPlan.id,approvedPlanId:approvedPlan.id,familyPlanId:familyPlan.id,draftPlanId:draftPlan.id,otherPlanId:otherPlan.id,memoryId:publicMemory.id,otherMemoryId:familyMemory.id,familyMemoryId:familyMemory.id,draftMemoryId:draftMemory.id,dayId:publicDay.id,otherDayId:otherDay.id,familyDayId:familyDay.id,parentDraftDayId:parentDraftDay.id,draftDayId:draftDay.id,sectionKey:'synthetic-section',stopKey:'synthetic-stop',momentKey:'synthetic-moment',placementKey:'synthetic-placement'}
}
