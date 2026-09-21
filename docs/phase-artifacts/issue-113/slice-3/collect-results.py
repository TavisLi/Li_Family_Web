"""Read completed isolated runs and preserve observable evidence; never changes governance."""
from pathlib import Path
import json, hashlib, subprocess, difflib, shlex, re, glob
ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'run-manifest.json').read_text())
def sha(b): return hashlib.sha256(b).hexdigest()
results={}
for name,run in manifest['runs'].items():
    w=Path(run['workspace'])
    events=[json.loads(x) for x in (ROOT/(name+'.events.jsonl')).read_text().splitlines() if x]
    items=[e['item'] for e in events if e['type']=='item.completed']
    commands=[x for x in items if x['type']=='command_execution']
    reads=[]; ledger=[]; recognized=set(); observed_files=set(); seen=set(); repeated=0
    for item in commands:
        output=item.get('aggregated_output',''); command=item['command']
        ledger.append({'item':item['id'],'command':command,'exit_code':item.get('exit_code'),'output_utf8_bytes':len(output.encode()),'output_sha256':sha(output.encode())})
        for output_line in output.splitlines():
            match=re.match(r'^([^:]+):[0-9]+:',output_line)
            if match and (w/match[1]).is_file():observed_files.add(match[1])
        # Direct cat/sed only; rg, Python and automatically injected context remain outside this subset.
        try: shell=shlex.split(command)[-1]
        except ValueError: continue
        for line in shell.splitlines():
            for segment in re.split(r';(?=(?:[^\'\"]|\'[^\']*\'|\"[^\"]*\")*$)',line):
                try: t=shlex.split(segment)
                except ValueError:continue
                if not t:continue
                selected=[]
                if t[0]=='cat':selected=[(f,None) for f in t[1:] if not f.startswith('-')]
                elif t[0]=='sed' and len(t)>=4 and t[1]=='-n':selected=[(f,t[2]) for f in t[3:]]
                expanded=[]
                for path,ranges in selected:
                    brace=re.search(r'\{([^{}]+)\}',path)
                    patterns=[path[:brace.start()]+part+path[brace.end():] for part in brace[1].split(',')] if brace else [path]
                    for pattern in patterns:
                        matches=glob.glob(pattern,root_dir=w) if any(c in pattern for c in '*?[') else [pattern]
                        expanded.extend((match,ranges) for match in matches)
                for path,ranges in expanded:
                    f=w/path
                    if not f.is_file():continue
                    instruction=(path in ['AGENTS.md','CONTEXT.md'] or path.startswith(('docs/','.agents/','skills/')) or path.endswith('SKILL.md'))
                    data=f.read_bytes(); lines=data.splitlines(keepends=True)
                    if ranges is None: indices=list(range(len(lines)))
                    else:
                        indices=[]
                        for part in ranges.split(';'):
                            match=re.fullmatch(r'(\d+)(?:,(\d+|\$))?p',part)
                            if not match:continue
                            a=int(match[1]);b=(len(lines) if match[2]=='$' else int(match[2] or a))
                            indices.extend(range(a-1,min(b,len(lines))))
                    if not indices:continue
                    payload=b''.join(lines[n] for n in indices)
                    observed=payload.decode(errors='replace') in output
                    key=(path,sha(data),tuple(indices))
                    repeat=key in seen and observed
                    if observed:
                        repeated+=int(repeat);seen.add(key);observed_files.add(path)
                        if instruction:recognized.add(path)
                    reads.append({'item':item['id'],'path':path,'instruction':instruction,'file_sha256':sha(data),'ranges':ranges or 'full','selected_utf8_bytes':len(payload),'exact_payload_present_in_logged_output':observed,'exact_repeat':repeat})
    changed=[];deleted=[]
    for path,old in run['initial_sha256'].items():
        f=w/path
        if not f.exists():deleted.append(path)
        elif sha(f.read_bytes())!=old:changed.append(path)
    new=[str(f.relative_to(w)) for f in w.rglob('*') if f.is_file() and '.git' not in f.relative_to(w).parts and str(f.relative_to(w)) not in run['initial_sha256']]
    task_paths=changed+new
    output_dir=ROOT/'outputs'/name;output_dir.mkdir(parents=True,exist_ok=True)
    for path in task_paths:
        f=w/path
        if f.is_file() and f.stat().st_size<1000000:
            dst=output_dir/path;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(f.read_bytes())
    tracked=[p for p in changed if subprocess.run(['git','ls-files','--error-unmatch',p],cwd=w,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0]
    fixture_diff=[]
    for path in changed:
        original=subprocess.check_output(['git','show','HEAD:'+path],cwd=w)
        if name.startswith('F-DATA') and path=='src/lib/travel-memory.ts':
            original=original.replace(b'caption: placement.caption,',b"caption: (placement.media && typeof placement.media === 'object' ? placement.media.altText : undefined) || placement.caption,")
        assert sha(original)==run['initial_sha256'][path],path
        fixture_diff.extend(difflib.unified_diff(original.decode().splitlines(keepends=True),(w/path).read_text().splitlines(keepends=True),fromfile='fixture-input/'+path,tofile='fixture-output/'+path))
    if fixture_diff:(ROOT/(name+'.patch')).write_text(''.join(fixture_diff))
    messages=[{'item':x['id'],'text':x['text']} for x in items if x['type']=='agent_message']
    metrics={'completed_command_calls':len(commands),'other_completed_tool_items':[{'id':x['id'],'type':x['type']} for x in items if x['type'] not in ['command_execution','agent_message','reasoning','error']], 'logged_tool_output_utf8_bytes':sum(x['output_utf8_bytes'] for x in ledger),'observed_direct_instruction_read_bytes_subset':sum(x['selected_utf8_bytes'] for x in reads if x['exact_payload_present_in_logged_output'] and x['instruction']),'observed_direct_instruction_files_subset':sorted(recognized),'exact_repeated_direct_reads_subset':repeated,'observed_files_read_lower_bound':sorted(observed_files),'total_model_visible_instruction_bytes':None,'total_files_read':None,'all_repeated_reads':None,'usage':next((e.get('usage') for e in events if e['type']=='turn.completed'),None)}
    results[name]={'metrics':metrics,'messages':messages,'command_ledger':ledger,'direct_instruction_read_ledger':reads,'changed_from_fixture_input':changed,'new_files':new,'deleted_files':deleted,'task_output_sha256':{p:sha((w/p).read_bytes()) for p in task_paths if (w/p).is_file()},'head_after':subprocess.check_output(['git','rev-parse','HEAD'],cwd=w,text=True).strip(),'final_event':events[-1]}
(ROOT/'behavioral-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{'metrics':v['metrics'],'changed':v['changed_from_fixture_input'],'new':v['new_files']} for k,v in results.items()},ensure_ascii=False,indent=2))
