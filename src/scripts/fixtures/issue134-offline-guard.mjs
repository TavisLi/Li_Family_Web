import fs from 'node:fs'
import fsp from 'node:fs/promises'
import net from 'node:net'
import tls from 'node:tls'
import {syncBuiltinESMExports} from 'node:module'

const deny=()=>{throw Error('ISSUE134_OFFLINE_NETWORK_FORBIDDEN')}
for(const [api,names]of [[fs,['readFile','readFileSync','open','openSync','createReadStream']],[fsp,['readFile','open']]]){
 for(const name of names){const original=api[name];api[name]=function(file,...args){
  if(/(?:^|[/\\])(?:\.env(?:\.[^/\\]*)?|\.rehearsal-runs|\.travel-media-staging)(?:[/\\]|$)/.test(String(file)))throw Error('ISSUE134_PRIVATE_INPUT_FORBIDDEN')
  return original.call(this,file,...args)
 }}
}
net.Socket.prototype.connect=deny
tls.connect=deny
globalThis.fetch=deny
syncBuiltinESMExports()
