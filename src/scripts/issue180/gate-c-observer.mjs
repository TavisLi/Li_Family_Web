import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {isDeepStrictEqual} from 'node:util'
import { assertUnchanged,indexSnapshot } from './snapshot-assertions.mjs'
const identifier=value=>{assert(/^[a-z_][a-z0-9_]*$/.test(value),'UNSAFE_OBSERVER_IDENTIFIER');return '"'+value+'"'}
export async function observeDatabase(lifecycle,options,{database}={}) {
 const query=async text=>JSON.parse((await (database?lifecycle.queryOwnedRecoveryDatabase({database},text,options):lifecycle.query(text,options))).stdout)
 const tables=await query("SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]') FROM pg_tables WHERE schemaname='public'")
 const keys=await query("SELECT coalesce(json_agg(x),'[]') FROM (SELECT c.relname AS table_name,a.attname AS column_name,k.ordinality FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY k(attnum,ordinality) JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.attnum WHERE i.indisprimary AND c.relnamespace='public'::regnamespace ORDER BY c.relname,k.ordinality) x")
 const result=[]
 for(const table of tables) {
  const rows=await query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]') FROM public.${identifier(table)} t`)
  const columns=keys.filter(k=>k.table_name===table).map(k=>k.column_name)
  assert(columns.length,'OBSERVER_PRIMARY_KEY_REQUIRED:'+table)
  for(const value of rows)result.push({table,key:JSON.stringify(columns.map(key=>value[key])),value})
 }
 return result.sort((a,b)=>a.table.localeCompare(b.table,'en')||a.key.localeCompare(b.key,'en'))
}
export async function ownershipEdges(sql) {
 return sql("SELECT coalesce(json_agg(x),'[]') FROM (SELECT c.relname AS table_name,a.attname AS column_name,p.relname AS parent_table,b.attname AS parent_column FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_class p ON p.oid=k.confrelid JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.conkey[1] JOIN pg_attribute b ON b.attrelid=p.oid AND b.attnum=k.confkey[1] WHERE k.contype='f' AND c.relnamespace='public'::regnamespace AND array_length(k.conkey,1)=1 AND (a.attname='_parent_id' OR (a.attname='parent_id' AND c.relname LIKE '\\_travel\\_%\\_v' ESCAPE '\\') OR (c.relname='travel_route_identities_rels' AND a.attname IN ('parent_id','travel_plans_id','travel_memories_id')))) x")
}
const relation='travel_route_identities_rels'
function relationOwned(row,rows,allowed,edges) {
 const required=[['parent_id','travel_route_identities'],['travel_plans_id','travel_plans'],['travel_memories_id','travel_memories']]
 if(!required.every(([column,parent])=>edges.some(e=>e.table_name===relation && e.column_name===column && e.parent_table===parent && e.parent_column==='id')))return false
 const v=row.value,plan=v.travel_plans_id,memory=v.travel_memories_id
 if(v.path!=='owner' || v.parent_id==null || (plan==null)===(memory==null))return false
 const collection=plan!=null?'travel-plans':'travel-memories',id=plan??memory
 if(!allowed.some(a=>a.collection===collection && String(a.id)===String(id)) || !allowed.some(a=>a.collection==='travel-route-identities' && String(a.id)===String(v.parent_id)))return false
 const parents=rows.filter(r=>r.table==='travel_route_identities' && String(r.value.id)===String(v.parent_id))
 return parents.length>0 && parents.every(r=>r.value.owner_key===`${collection}:${id}`) && rows.some(r=>r.table===collection.replaceAll('-','_') && String(r.value.id)===String(id))
}
export function buildFailureEvidence(before,after,allowed,edges,status='BLOCK') {
 const a=indexSnapshot(before),b=indexSnapshot(after),ids=new Set([...a.keys(),...b.keys()]),changes=[]
 for(const id of ids)if(!a.has(id)||!b.has(id)||!isDeepStrictEqual(a.get(id),b.get(id))) {
  const [table,key]=JSON.parse(id);changes.push({table,key,kind:!a.has(id)?'added':!b.has(id)?'removed':'changed',before:a.has(id)?{table,key,value:a.get(id)}:null,after:b.has(id)?{table,key,value:b.get(id)}:null})
 }
 const rows=[...before,...after],ownerDecisions=changes.filter(c=>c.table===relation).map(c=>({table:c.table,key:c.key,permitted:[c.before,c.after].filter(Boolean).every(r=>relationOwned(r,rows,allowed,edges))}))
 const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
 let evidence={status,before,after,changes,edges,allowed,ownerDecisions,beforeSha256:sha(before),afterSha256:sha(after)}
 if(Buffer.byteLength(JSON.stringify(evidence))>1024*1024) {
  const identityChanges=changes.filter(c=>c.table==='travel_route_identities').slice(0,8),ids=new Set(identityChanges.flatMap(c=>[c.before?.value.id,c.after?.value.id]).filter(id=>id!=null).map(String))
  const identityRelations={before:before.filter(r=>r.table===relation && ids.has(String(r.value.parent_id))).slice(0,8),after:after.filter(r=>r.table===relation && ids.has(String(r.value.parent_id))).slice(0,8)}
  evidence={status:'UNKNOWN',reason:'FAILURE_EVIDENCE_CAP',beforeSha256:sha(before),afterSha256:sha(after),changesSha256:sha(changes),edgesSha256:sha(edges),allowedSha256:sha(allowed),identityChanges,identityRelations,edges,allowed,contextTruncated:changes.filter(c=>c.table==='travel_route_identities').length>8 || before.filter(r=>r.table===relation && ids.has(String(r.value.parent_id))).length>8 || after.filter(r=>r.table===relation && ids.has(String(r.value.parent_id))).length>8}
  if(Buffer.byteLength(JSON.stringify(evidence))>1024*1024)evidence={status:'UNKNOWN',reason:'FAILURE_EVIDENCE_CAP',beforeSha256:sha(before),afterSha256:sha(after),changesSha256:sha(changes),edgesSha256:sha(edges),allowedSha256:sha(allowed),contextTruncated:true}
 }
 return {...evidence,evidenceSha256:sha(evidence)}
}
export function assertFocusedIdentity(after,allowed,edges) {
 for(const target of allowed.filter(a=>['travel-plans','travel-memories'].includes(a.collection))) {
  const matches=after.filter(r=>r.table===relation && relationOwned(r,after,allowed,edges) && String(r.value[target.collection==='travel-plans'?'travel_plans_id':'travel_memories_id'])===String(target.id))
  assert.equal(matches.length,1,'BLOCK: FOCUSED_OWNER_IDENTITY_UNKNOWN')
 }
}
export function hasFocusedTargetEvidence(after,allowed,edges) {
 return allowed.some(target=>['travel-plans','travel-memories'].includes(target.collection) && after.some(row=>row.table===relation && relationOwned(row,after,allowed,edges) && String(row.value[target.collection==='travel-plans'?'travel_plans_id':'travel_memories_id'])===String(target.id)))
}
export function assertOwnedChanges(before,after,allowed,edges) {
 const rows=[...before,...after],permit=new Map()
 const identity=row=>JSON.stringify([row.table,row.key])
 for(const row of rows)if(row.table!==relation && allowed.some(item=>row.table===item.collection.replaceAll('-','_') && String(row.value.id)===String(item.id)))permit.set(identity(row),row)
 let size=-1
 while(size!==permit.size) {
  size=permit.size
  for(const row of rows)if(row.table!==relation && !permit.has(identity(row)) && edges.some(edge=>edge.table_name===row.table && [...permit.values()].some(parent=>parent.table===edge.parent_table && row.value[edge.column_name]!=null && String(row.value[edge.column_name])===String(parent.value[edge.parent_column]))))permit.set(identity(row),row)
 }
 // Existing target identity rows may receive only Payload's updated_at bookkeeping.
 const derivedAllowed=[]
 for(const old of before.filter(r=>r.table==='travel_route_identities')) {
  const matches=after.filter(r=>identity(r)===identity(old))
  if(matches.length!==1)continue
  const next=matches[0],{updated_at:oldTime,...oldData}=old.value,{updated_at:newTime,...newData}=next.value
  if(!Object.hasOwn(old.value,'updated_at') || !Object.hasOwn(next.value,'updated_at') || !isDeepStrictEqual(oldData,newData))continue
  const oldLinks=before.filter(r=>r.table===relation && String(r.value.parent_id)===String(old.value.id))
  const newLinks=after.filter(r=>r.table===relation && String(r.value.parent_id)===String(old.value.id))
  const proofAllowed=[...allowed,{collection:'travel-route-identities',id:old.value.id}]
  if(oldLinks.length===1 && newLinks.length===1 && relationOwned(oldLinks[0],before,proofAllowed,edges) && relationOwned(newLinks[0],after,proofAllowed,edges)){permit.set(identity(old),old);derivedAllowed.push(proofAllowed.at(-1))}
 }
 for(const row of rows.filter(r=>r.table===relation))if(rows.filter(r=>identity(r)===identity(row)).every(r=>relationOwned(r,rows,[...allowed,...derivedAllowed],edges)))permit.set(identity(row),row)
 return assertUnchanged(before,after,[...permit.values()].map(({table,key})=>({table,key})))
}
