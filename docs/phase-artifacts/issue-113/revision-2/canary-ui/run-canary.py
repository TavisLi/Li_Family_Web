from pathlib import Path
import subprocess,json,hashlib,shutil,time,os,signal,selectors
repo=Path('/Users/tien-hsinglee/Project/li-family-web')
out=repo/'docs/phase-artifacts/issue-113/revision-2/canary-ui'
out.mkdir(exist_ok=False)
work=Path('/private/tmp/issue113-revision2-ui-canary')
cli='/Applications/ChatGPT.app/Contents/Resources/codex'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks=json.loads((repo/'docs/phase-artifacts/issue-113/revision-2/checks.json').read_text())
for p,m in checks['measurements'].items(): assert sha(repo/p)==m['candidate_sha256']
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()=='e20bf82f489634112a2c569b5ce5e0ba06616b81'
subprocess.run(['git','clone','--quiet','--no-hardlinks',str(repo),str(work)],check=True)
subprocess.run(['git','remote','remove','origin'],cwd=work,check=True)
old=json.loads((repo/'docs/phase-artifacts/issue-113/slice-2/validation.json').read_text())
for entry in old['changed_files']:
 p=entry['path']
 if p.startswith('docs/phase-artifacts/') or p=='src/scripts/agent-governance.test.ts': continue
 dest=work/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(repo/p,dest)
with (work/'README.md').open('a') as f:f.write('\n<!-- Existing user note: preserve unchanged. -->\n')
(work/'personal-note.txt').write_text('Existing untracked personal asset. Preserve exactly.\n')
prompt=(repo/'docs/phase-artifacts/issue-113/slice-3/F-UI.prompt.txt').read_text()
(out/'prompt.txt').write_text(prompt)
before={str(p.relative_to(work)):sha(p) for p in work.rglob('*') if p.is_file() and '.git' not in p.relative_to(work).parts}
(out/'workspace-before.json').write_text(json.dumps(before,indent=2))
cmd=[cli,'exec','--ephemeral','-m','gpt-6-astra','-c','model_reasoning_effort="low"','-C',str(work),'-s','workspace-write','--json','-o',str(out/'final.txt'),'-']
plan={'model':'gpt-6-astra','effort':'low','wall_seconds':180,'observable_tool_start_limit':20,'attempts':1,'token_limit':'No real-time hard cap; end-of-turn usage only','cli_version':subprocess.check_output([cli,'--version'],text=True).strip(),'cli_sha256':sha(Path(cli)),'prompt_sha256':sha(out/'prompt.txt'),'command':cmd,'host_configuration':'Existing config/plugins retained; no changes; full resolved catalog not available before startup','workspace':str(work)}
(out/'plan.json').write_text(json.dumps(plan,indent=2))
start=time.monotonic(); count=0;reason=None
with (out/'events.jsonl').open('w') as log,(out/'stderr.txt').open('w') as err:
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=err,text=True,start_new_session=True)
 p.stdin.write(prompt);p.stdin.close();sel=selectors.DefaultSelector();sel.register(p.stdout,selectors.EVENT_READ)
 while p.poll() is None:
  if time.monotonic()-start>=180:reason='wall_time_limit';break
  for key,_ in sel.select(timeout=1):
   line=key.fileobj.readline()
   if not line:continue
   log.write(line);log.flush()
   try:e=json.loads(line)
   except ValueError:continue
   if e.get('type')=='item.started' and e.get('item',{}).get('type') in ['command_execution','mcp_tool_call','web_search']:count+=1
   if count>=20:reason='tool_event_limit';break
  if reason:break
 if reason:
  os.killpg(p.pid,signal.SIGTERM)
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
 log.write(p.stdout.read())
after={str(q.relative_to(work)):sha(q) for q in work.rglob('*') if q.is_file() and '.git' not in q.relative_to(work).parts}
changed=[q for q in sorted(set(before)|set(after)) if before.get(q)!=after.get(q)]
(out/'result.patch').write_bytes(subprocess.check_output(['git','diff','--','src'],cwd=work))
result={'exit_code':p.returncode,'stop_reason':reason,'elapsed_seconds':round(time.monotonic()-start,2),'tool_starts':count,'changed_since_fixture':changed,'staged_paths':subprocess.check_output(['git','diff','--cached','--name-only'],cwd=work,text=True),'diff_check_exit':subprocess.run(['git','diff','--check'],cwd=work,capture_output=True).returncode}
(out/'runner.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
