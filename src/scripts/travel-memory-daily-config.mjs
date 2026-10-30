import assert from 'node:assert/strict'

// Run-local validation only, with unchanged required/schema flags. Payload's
// English update of a shared nested array validates untranslated title fields.
// Carry their exact empty values; the locked graph and read-back enforce them.
export function dailyPayloadConfig(config){
 const collections=config.collections.map(c=>{
  if(c.slug!=='travel-memory-days')return c
  const carryTitle=f=>{
   if(f.name!=='title')return f
   assert(f.localized&&f.required&&typeof f.validate==='function','BLOCK: daily title validator drift')
   return {...f,validate:(value,args)=>args.req.locale==='en'&&(value==null||value==='')?true:f.validate(value,args)}
  }
  return {...c,fields:c.fields.map(f=>f.name==='moments'?{...f,fields:f.fields.map(carryTitle)}:carryTitle(f))}
 })
 const stop=code=>{throw Object.assign(Error('BLOCK: '+code),{code})}
 const logger={options:{level:'info',hooks:{logMethod(args,method,level){if(level>=40)return stop('ISSUE134_DAILY_RUNTIME_WARNING');return method.apply(this,args)}}}}
 const email=()=>({name:'issue134-no-email',defaultFromAddress:'no-email@invalid.local',defaultFromName:'No email',sendEmail:async()=>stop('ISSUE134_DAILY_EMAIL_FORBIDDEN')})
 return {...config,collections,logger,email}
}
