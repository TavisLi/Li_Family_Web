from pathlib import Path
import subprocess,concurrent.futures,json,time,os
root=Path('/private/tmp/issue113-slice3'); out=Path('/Users/tien-hsinglee/Project/li-family-web/docs/phase-artifacts/issue-113/slice-3')
def run(name):
 fixture=name.rsplit('-',1)[0]; start=time.time()
 cmd=['/Applications/ChatGPT.app/Contents/Resources/codex','exec','--ephemeral','-m','gpt-6-astra','-c','model_reasoning_effort="low"','-C',str(root/name),'-s','workspace-write','--json','-o',str(root/(name+'.final.txt')),'-']
 with (out/(name+'.events.jsonl')).open('w') as stdout,(out/(name+'.stderr.txt')).open('w') as stderr:
  try:
   p=subprocess.run(cmd,input=(out/(fixture+'.prompt.txt')).read_text(),text=True,stdout=stdout,stderr=stderr,timeout=480)
   result={'exit_code':p.returncode,'elapsed_seconds':round(time.time()-start,2)}
  except subprocess.TimeoutExpired:result={'exit_code':None,'timed_out':True,'elapsed_seconds':round(time.time()-start,2)}
 (out/(name+'.runner.json')).write_text(json.dumps(result,indent=2)+'\n')
 final=root/(name+'.final.txt')
 if final.exists():(out/(name+'.final.txt')).write_bytes(final.read_bytes())
 print(name,json.dumps(result),flush=True)
names=['F-UI-before','F-UI-after','F-DATA-before','F-DATA-after','F-SENSITIVE-before','F-SENSITIVE-after']
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(run,names))
